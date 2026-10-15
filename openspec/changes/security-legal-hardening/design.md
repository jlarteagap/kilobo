## Context

Restricciones reales del proyecto que condicionan el diseño:

- **El Admin SDK bypasea las reglas de Firestore por completo.** Todo acceso pasa por `firebase-admin`, así que las reglas de base de datos no son hoy un control activo, sino una capa de respaldo para el futuro. `firestore.json` solo declara índices; no hay archivo de reglas.
- **No existe ninguna dependencia de rate limiting.** `package.json` no incluye Redis, Upstash ni nada equivalente.
- **`/gasolina` es un conjunto de datos compartido, no por usuario** (decisión del propietario). Varias personas aportan al mismo vehículo. Esto descarta el scoping por `user_id` y descarta tratar los viajes como recursos con propietario.
- **Las dos participantes tienen cuenta, pero solo una la usa.** Firebase Auth tiene exactamente 2 usuarios —`melyan.217@gmail.com` y `jorgelarteagap@gmail.com`— que corresponden a los dos nombres de `DEFAULT_USERS` (`CarSharingDashboard.tsx:32`). **No hay ruta de registro en el código**, así que el conjunto lo controla el propietario. Pero `melyan.217@gmail.com` tiene `lastSignIn` idéntico a su `creationTime` (2026-06-01): entró una vez y no volvió. "Tiene cuenta" y "puede entrar" no son lo mismo, y el diseño tiene que aguantar a alguien que no entra.
- **`maintenance.actions.ts:37-43` ya resuelve una parte del problema**: llama a `getUserId()` y, sin sesión, degrada a solo registro histórico sin transacción. Ese archivo es el patrón a extender, no a rediseñar.
- **Los Server Actions no pasan por `middleware.ts`.** El matcher excluye `api` y las Server Actions se despachan fuera de ese flujo, así que el control tiene que ir dentro de cada acción.
- **No se sabe con certeza dónde está desplegada la app.** La decisión de limitador toma una posición que funciona en ambos casos.

Ver `proposal.md` para la motivación y `specs/` para los requisitos normativos.

## Goals / Non-Goals

**Goals:**
- Cerrar el vector de escritura abierta en `/gasolina` sin romper el caso de uso real (consulta rápida desde el vehículo sin iniciar sesión).
- Impedir que las operaciones costosas se usen como amplificador de consumo, sin introducir infraestructura nueva que mantener.
- Habilitar el cumplimiento de los derechos de acceso y supresión sobre datos financieros.
- Dejar una segunda capa de defensa a nivel de base de datos.

**Non-Goals:**
- No se rediseña el modelo de datos financiero ni se toca la lógica de balances.
- No se cambia el comportamiento de lectura de `/gasolina`: sigue siendo pública.
- No se optimiza el coste de Firestore de las lecturas analíticas (eso vive en `firestore-cost-controls`).
- No se implementa un sistema de cuentas compartidas ni permisos granulares por miembro.

## Decisions

### D1 — La escritura al estado compartido se acota por tasa; lo irreversible exige sesión

> **Esta decisión reemplazó a un modelo de token compartido que se implementó y se descartó.** No se conserva aquí la versión anterior del documento: el token llegó a escribirse, pero nunca llegó a estar en efecto, porque el documento de configuración que lo guardaba nunca se emitió. Revisar los datos reales lo dejó sin premisa.

El control de escritura de `/gasolina` y `/car-sharing` se reparte por **operación, según su consecuencia**, no por feature:

| Estrato | Control | Operaciones |
|---|---|---|
| ① | límite de tasa por IP, 30 escrituras / 300 s | las 11 mutantes |
| ①' | límite de tasa adicional, 1 reset / 24 h | `resetAllAction` |
| ② | nada más — abiertas | registrar viaje, actualizar viaje, cerrar carga, marcar liquidado, editar ciclo cerrado, odómetro, registrar mantenimiento |
| ③ | `getUserId()` | borrar viaje, borrar ciclo, borrar historial, borrar mantenimiento |

**Por qué no un token compartido.** La decisión anterior lo descartó a favor del token con este argumento: *"lista de miembros con IDs de usuario: exige que **todos** los participantes tengan cuenta; hoy no está garantizado"*. Los datos de producción dicen lo contrario:

- Firebase Auth tiene **2 cuentas**: `melyan.217@gmail.com` y `jorgelarteagap@gmail.com`. Corresponden exactamente a los dos participantes de `DEFAULT_USERS` (`CarSharingDashboard.tsx:32`).
- **No existe ruta de registro en el código.** El conjunto de cuentas lo controla el propietario, no un signup abierto.
- `melyan.217@gmail.com` tiene `lastSignIn` idéntico a su `creationTime` (2026-06-01): entró una vez y no volvió.

La premisa era falsa. Y el token no fue una fricción tolerada para esa participante: fue **bloqueo total**, porque nunca llegó a emitirse y las 8 acciones rechazaban a todo el mundo, incluida ella. Una puerta que no se puede abrir no es un control, es una caída.

**Por qué el límite de tasa y la sesión resuelven problemas distintos.** El primero acota el *volumen*; no puede impedir una sola escritura que destruya, porque `resetAll` es una petición. El segundo impide la operación concreta. Por eso `resetAll` lleva los dos.

**Alternativas descartadas:**
- *Scoping por `user_id` sobre `car_sharing_cycles`*: el estado es compartido y no tiene dueño. Atribuirlo a un usuario obligaría a una migración de datos y quitaría acceso a la otra participante.
- *Sesión para toda escritura*: resolvería el problema de atribución, pero bloquearía a quien no usa la app a diario. Semitido.
- *Gate en `middleware.ts`*: no funciona. Las Server Actions no atraviesan el matcher, que además excluye `api`.

**Consecuencia buena:** sin token, **no hay nada que emitir, rotar, distribuir ni revocar**, y no hay migración de datos. `car_sharing_config/access` nunca existió, así que la reversión no deja residuo.

**Riesgo aceptado y declarado:** el nombre de participante de un viaje viene del cliente (un `<select>` sobre `DEFAULT_USERS`), no de la sesión, así que un visitante puede atribuir un viaje a cualquiera de los dos. El límite de tasa acota el volumen; no resuelve la atribución. Cerrarlo exige credenciales, que es justo lo que este diseño evita. Si algún día molesta, la extensión es pedir el nombre al servidor y no aceptar el del cliente.

### D2 — Limitador sobre contadores en Firestore

Implementación elegida por el propietario. Contadores en documentos de una colección dedicada, con ventana fija.

Algoritmo por petición:
1. Calcular la clave `hash(identidad) + ventana temporal` (p. ej. ventana de 60 s alineada a reloj).
2. Leer el documento del contador.
3. Si `count >= límite`, responder 429 con `Retry-After` — **sin escribir**.
4. Si no, incrementar en una transacción de Firestore y continuar.

Puntos que importan:
- **Rechazar no escribe.** Un cliente bloqueado consume 1 lectura, no una escritura. Eso corta el vector de amplificación de escritura, que es el que cuesta.
- **Solo se limita lo necesario**, no todo. El requisito dice "como mínimo" tres superficies: creación de sesión, recálculo de insights y mutaciones públicas. Limitar las 13 rutas del dashboard multiplicaría el coste por una defended que el producto no necesita.
- **Los contadores expiran.** Se añaden al índice junto con su TTL y una tarea programada los purga, para que la colección no crezca sin límite.

**Optimización de coste:** cada comprobación cuesta 1 lectura + 1 escritura en el camino permitido. Como el dashboard dispara 13 peticiones, añadir el limitador a todas costaría 26 operaciones extra por carga. Se aplica un **memo en memoria con TTL de pocos segundos** para amortiguar ráfagas en la misma instancia. Sigue siendo serverless-safe en el sentido que importa: la ausencia del memo nunca *debilita* el límite, solo lo hace más caro. Es un acelerador, no el mecanismo de corrección.

**Alternativas descartadas:**
- *Upstash Redis*: latencia mejor y coste estable, pero exige cuenta, dependencia externa y acceso de red desde la región de despliegue. Se descartó para no añadir infraestructura.
- *Contador en memoria del proceso*: en un entorno serverless cada invocación es una instancia nueva, así que **el límite nunca se activaría**. Descartado por seguridad, no por gusto.

### D3 — Verificación de origen como defensa en profundidad

Las rutas mutantes validarán la cabecera `Origin` contra el host esperado. `sameSite=strict` ya cubre el CSRF clásico en navegadores modernos, pero no cubre:
- peticiones desde un **subdominio** hermano (cuenta como mismo sitio para `sameSite`),
- un XSS en el propio sitio,
- clientes no navegador que ignoran las políticas de cookie.

Es barato y no cambia el comportamiento legítimo.

### D4 — El borrado de cuenta usa un manifiesto explícito de colecciones

El endpoint de borrado recorre un **manifiesto declarado** de colecciones con campo `user_id` y borra en lotes (respetando el máximo de operaciones por batch de Firestore), con paginación por cursor para conjuntos grandes.

Riesgo asumido: si el manifiesto se queda corto respecto a las colecciones reales, quedan datos financieros huérfanos — precisamente el fallo que la función debe evitar.

**Contramedida:** antes de dar el cambio por bueno, un script de auditoría compara el conjunto de colecciones que **efectivamente** contienen `user_id` contra el manifiesto, y falla si hay alguna fuera. El manifiesto no se considera correcto por revisión manual.

### D5 — Reglas de Firestore en modo denegar-todo

No hay SDK de cliente de Firestore en la aplicación, así que las reglas no cambian el comportamiento actual. Se despliegan como `deny-all` para que:
- una futura importación accidental de `firebase/firestore` en cliente no quede expuesta por descuido,
- exista un artefacto auditable de control de acceso.

Se añade la clave `rules` a `firebase.json` y se incluye en el despliegue.

## Risks / Trade-offs

**[El limitador en Firestore añade coste justo al sistema que se intenta abaratar]** → Se limita solo a las tres superficies necesarias, no a las 13 rutas del dashboard. El rechazo no escribe. Y el coste por petición admitida (1 lectura + 1 escritura) es marginal comparado con una consulta sin `limit()` que ya devuelve cientos de documentos. Se medirá tras el despliegue.

**[Las operaciones de registro quedan abiertas a cualquiera que conozca la URL]** → Es el riesgo grande y es deliberado: el caso de uso es anotar un viaje desde el vehículo sin credenciales, y la alternativa (token) resultó ser un bloqueo, no una protección. Lo acota el límite de 30/300 s por IP; lo que **no** acota es la atribución, porque el nombre de participante lo elige el cliente. Lo que sí queda cerrado es lo caro: nada irreversible se ejecuta sin sesión.

**[Un tercero puede escribir viajes a nombre de cualquiera de los dos participantes]** → Es el límite explícito de este diseño, no un descuido. El daño se reduce al estado del auto, que se puede corregir a mano desde una sesión; no alcanza balances ni datos de la cuenta de nadie. Si aparece la necesidad de atribuir, la extensión es tomar el nombre del servidor en lugar del cliente.

**[La degradación sin sesión en mantenimiento sigue vigente, y es un sesgo]** → `addMaintenanceLogAction` sin sesión guarda solo el log y no descuenta del fondo; con sesión, sí descuenta. Quien anota decide en qué mundo vive la anotación. Se documenta en vez de ocultarse porque cambiarlo obligaría a exigir sesión, que es justo lo que este diseño evita.

**[El borrado en cascada puede fallar a medio camino]** → Se ejecuta en orden y se reporta el resultado por colección. Un fallo parcial se registra explícitamente para poder reanudar. Es preferible a un "borrado" silencioso e incompleto.

**[Las reglas deny-all rompen algo no previsto]** → Hoy no hay cliente de Firestore, así que el riesgo es nulo. Se despliega después de verificar con el script de auditoría que ninguna ruta de cliente lee la base directamente.

**[El memo en memoria introduce una ventana de imprecisión de pocos segundos]** → Deliberado y acotado. Un atacante puede ejecutar unas pocas peticiones extra por ráfaga. No afecta a la corrección del límite, solo su coste.

## Migration Plan

1. **Sin migración de datos.** Al ser el estado compartido sin propietario, `car_sharing_cycles` y `car_maintenance_logs` no necesitan campo nuevo. Es la diferencia clave frente a la opción de scoping por usuario.
2. Desplegar reglas deny-all y verificar con el script de auditoría que el acceso de cliente es nulo.
3. Publicar `/privacidad` y `/términos` **antes** de enlazarlos desde el footer, para no volver a tener enlaces rotos.
4. Activar el limitador primero en modo observativo (registra lo que rechazaría sin rechazar) sobre la creación de sesión, la de mayor tráfico no autenticado. Comparar contra tráfico real antes de aplicar.
5. Desplegar los guards de `/gasolina` **sin** exigir ninguna acción a los participantes: registrar y consultar no piden credenciales. Verificar que sin sesión las 4 operaciones irreversibles rechazan antes de leer o escribir.
6. Arrancar `RATE_LIMIT_MODE=observe` sobre `car-write` y `car-reset` para calibrar `30/300 s` contra tráfico real antes de activar el rechazo.
7. Activar los endpoints de borrado y export ya activos, sin riesgo de regresión porque son nuevos.

**Rollback:** cada control es independiente. Quitar los guards de `src/app/gasolina/guards.ts` devuelve la página a escritura abierta sin tocar datos ni desplegar nada más — es un solo archivo y tres funciones. Despublicar el limitador devuelve las rutas a su comportamiento actual. Las páginas legales y los endpoints nuevos son aditivos y su retiro no afecta al resto.

## Open Questions

- **Frecuencia de purga de contadores.** Depende de la cadencia de despliegue disponible (una tarea programada diaria o por lotería al desplegar). No cambia los requisitos, el enfoque ni las tareas; se resuelve al implementar.
- **Volumen exacto de tráfico de creación de sesión** para calibrar el umbral inicial del limitador. Se puede arrancar con un valor conservador por identidad y ajustar con los datos observados en el paso 4 del despliegue.
- **Umbral de `car-write`.** 30/300 s es una estimación, no una medición: una sesión real de registro son unas 5 escrituras. Si en modo observativo aparece tráfico legítimo cerca del tope, se sube el umbral antes de activar el rechazo.
- **Si el estado compartido debe dejar de ser legible sin credenciales.** Hoy se mantiene público por decisión de diseño. Si más adelante se considera demasiada exposición, es un cambio acotado: el límite de lectura se aplica igual que el de escritura, y a las rutas de lectura de las dos acciones de `getClosedCycles`/`getActiveCycle`.