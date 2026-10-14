## Context

Restricciones reales del proyecto que condicionan el diseño:

- **El Admin SDK bypasea las reglas de Firestore por completo.** Todo acceso pasa por `firebase-admin`, así que las reglas de base de datos no son hoy un control activo, sino una capa de respaldo para el futuro. `firestore.json` solo declara índices; no hay archivo de reglas.
- **No existe ninguna dependencia de rate limiting.** `package.json` no incluye Redis, Upstash ni nada equivalente.
- **`/gasolina` es un conjunto de datos compartido, no por usuario** (decisión del propietario). Varias personas aportan al mismo vehículo y no necesariamente tienen cuenta en la aplicación. Esto descarta el scoping por `user_id` y descarta tratar los viajes como recursos con propietario.
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

### D1 — El estado compartido se protege con un token, no con cuentas de usuario

El control de escritura de `/gasolina` y `/car-sharing` será un **token de acceso compartido**, no la sesión de usuario.

- El token se guarda en un documento de configuración de Firestore (`car_sharing_config/access`), nunca en el bundle del cliente.
- Se compara en el servidor con comparación en **tiempo constante** para no filtrar el valor por temporización.
- El participante lo introduce una vez en la interfaz; se guarda en una **cookie `httpOnly`, `sameSite=strict`, con `path` restringido a las rutas de la feature**.
- La **lectura permanece pública**. Es deliberado: el caso de uso es consultar el estado sin escribir credenciales.

**Alternativas descartadas:**
- *Scoping por `user_id`*: incompatible con la realidad del dato. Habría que migrar documentos globales a un propietario arbitrario y los demás participantes perderían acceso a lo que comparten. Además obligaría a una migración de datos que ahora no es necesaria.
- *Lista de miembros con IDs de usuario*: más limpia conceptualmente, pero exige que **todos** los participantes tengan cuenta. Hoy no está garantizado.
- *Gate en `middleware.ts`*: no funciona. Las Server Actions no atraviesan el matcher, que además ya excluye `api`.

**Consecuencia buena:** al ser el estado compartido sin propietario, **no hace falta migración de datos**. Esto elimina el riesgo operativo más grande del cambio.

**Extensión futura:** si algún día se quiere identidad por participante, el token se sustituye por una colección de miembros y el resto del diseño no cambia.

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

**[El token compartido es una credencial que se puede filtrar]** → Se compara en tiempo constante, viaja solo en cookie `httpOnly`, y se puede rotar cambiando un solo documento. Mitigación adicional: si se filtra, el daño se limita a escritura sobre el estado del vehículo, no a datos financieros del usuario. **A diferencia de una sesión, no hay datos personales detrás.**

**[El token es único para todos los participantes, sin trazabilidad]** → Un cambio incorrecto no se puede atribuir a una persona concreta. Es el precio de no exigir cuentas. Aceptable para el volumen esperado; si aparece la necesidad, D1 ya tiene la extensión prevista.

**[El borrado en cascada puede fallar a medio camino]** → Se ejecuta en orden y se reporta el resultado por colección. Un fallo parcial se registra explícitamente para poder reanudar. Es preferible a un "borrado" silencioso e incompleto.

**[Las reglas deny-all rompen algo no previsto]** → Hoy no hay cliente de Firestore, así que el riesgo es nulo. Se despliega después de verificar con el script de auditoría que ninguna ruta de cliente lee la base directamente.

**[El memo en memoria introduce una ventana de imprecisión de pocos segundos]** → Deliberado y acotado. Un atacante puede ejecutar unas pocas peticiones extra por ráfaga. No afecta a la corrección del límite, solo su coste.

## Migration Plan

1. **Sin migración de datos.** Al ser el estado compartido sin propietario, `car_sharing_cycles` y `car_maintenance_logs` no necesitan campo nuevo. Es la diferencia clave frente a la opción de scoping por usuario.
2. Desplegar reglas deny-all y verificar con el script de auditoría que el acceso de cliente es nulo.
3. Publicar `/privacidad` y `/términos` **antes** de enlazarlos desde el footer, para no volver a tener enlaces rotos.
4. Activar el limitador primero en modo observativo (registra lo que rechazaría sin rechazar) sobre la creación de sesión, la de mayor tráfico no autenticado. Comparar contra tráfico real antes de aplicar.
5. Requerir el token en las Server Actions de `/gasolina` y comunicar el token a los participantes antes de activar, o la feature queda inusable para ellos.
6. Activar los endpoints de borrado y export ya activos, sin riesgo de regresión porque son nuevos.

**Rollback:** cada control es independiente. Revertir la cookie de token y el middleware de la acción devuelve `/gasolina` a su comportamiento actual sin tocar datos. Despublicar el limitador devuelve las rutas a su comportamiento actual. Las páginas legales y los endpoints nuevos son aditivos y su retiro no afecta al resto.

## Open Questions

- **Frecuencia de purga de contadores.** Depende de la cadencia de despliegue disponible (una tarea programada diaria o por lotería al desplegar). No cambia los requisitos, el enfoque ni las tareas; se resuelve al implementar.
- **Volumen exacto de tráfico de creación de sesión** para calibrar el umbral inicial del limitador. Se puede arrancar con un valor conservador por identidad y ajustar con los datos observados en el paso 4 del despliegue.
- **Si el estado compartido debe dejar de ser legible sin credenciales.** Hoy se mantiene público por decisión de diseño. Si más adelante se considera demasiada exposición, es un cambio acotado sobre D1 — el token ya existe y solo hay que aplicarlo también a la lectura.