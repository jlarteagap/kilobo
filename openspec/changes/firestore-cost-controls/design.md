## Context

Restricciones del proyecto que condicionan el diseño:

- **Firestore factura por documento.** Un `getDocs` sin `limit()` cuesta lo que el número de documentos devueltos, no lo que la consulta. El coste real de una pantalla es su cardinalidad, no su latencia.
- **Los índices compuestos se construyen de forma asíncrona.** Crear un índice en Firestore consume lecturas mientras se construye y tarda minutos u horas. El orden de despliegue importa más que la corrección del código.
- **El SDK de cliente de Firestore no se usa.** Todo el acceso pasa por `firebase-admin`, así que no hay conflicto entre la capa de agregación y listeners de cliente. Tampoco hay un consumidor legítimo de un payload ilimitado.
- **`transactions.findAll` es la pieza más Hewlett-Packard del sistema**: la usan el dashboard, la página de transacciones, el progreso de presupuestos, la proyección de balance, el Sankey y los insights. Cambiarla afecta a más consumidores que cualquier otra modificación de este cambio.
- **Existe caché de insights en Firestore con TTL de 24 h** (`insightsRepository.ts:10`), que no invalida al escribir. Es un precedente útil de persistencia de derivados, pero también un ejemplo del problema de datos obsoletos que hay que evitar aquí.

Ver `proposal.md` para la motivación y `specs/` para los requisitos.

## Goals / Non-Goals

**Goals:**
- Que el coste por carga de pantalla deje de depender del tamaño del historial del usuario.
- Que las métricas mostradas al usuario sean idénticas antes y después del cambio.
- Que ninguna cifra mostrada quede obsoleta después de registrar un movimiento.

**Non-Goals:**
- No se rediseña el modelo de datos ni se cambia la semántica de los cálculos financieros.
- No se introduce un almacén de agregados materializados si una consulta de agregación basta.
- No se toca la verificación de sesión por petición, que pertenece a `security-legal-hardening`.
- No se optimizan las consultas del conductor ni de mantenimiento más allá de aplicarles `limit()`.

## Decisions

### D1 — Orden de despliegue en dos fases: índices primero, código después

Los índices compuestos se despliegan y se espera a que estén listos antes de desplegar el código que depende de ellos. Al revés, las consultas fallan en producción con `FAILED_PRECONDITION` mientras el índice se construye.

Se añade una comprobación automatizada que extrae los patrones de consulta de los repositorios y los contrasta con `firestore.indexes.json`, fallando si hay algún patrón compuesto sin índice. Esto convierte un fallo de producción en un fallo de integración continua.

**Alternativa descartada:** desplegar todo junto y confiar en que el índice se construya rápido. En un proyecto con 7 índices actuales que pasan a 19, esa apuesta no tiene margen.

### D2 — Paginación por cursor, no por desplazamiento

El listado de transacciones se pagina por cursor sobre `(date, id)` en lugar de por desplazamiento numérico. El desplazamiento degrada de forma notable a medida que aumenta el número de documentos saltados, porque la base de datos sigue leyendo y descartando todo lo anterior. El cursor es estable ante inserciones concurrentes.

El cursor se firma de forma que un cliente no pueda alterarlo para saltar a una posición arbitraria.

### D3 — La ruta agregada se construye primero, y el listado se acota después

El orden interno de `tasks.md` pone la ruta de métricas agregadas antes de cambiar el contrato de `GET /api/transactions`. La razón es práctica: una vez que el dashboard consume la ruta agregada, depende mucho menos del listado completo, y entonces acotarlo es un cambio acotado en lugar de una reestructuración de seis consumidores.

Esto no evita el trabajo; solo evita hacerlo dos veces en el orden equivocado.

### D4 — Agregaciones con consultas de agregación, no con documentos materializados

Firestore dispone hoy de consultas de agregación `count()` y `sum()`. Cubren el caso de uso —contar y sumar por grupo— sin coste de escritura adicional, sin invalidación y sin riesgo de consistencia.

Un almacén de documentos agregados solo se justifica si hacen falta métricas que la agregación no expresa, como percentiles, medianas o comparativas entre periodos con semántica propia. Hoy no es el caso.

**Alternativa descartada:** mantener el cálculo en el cliente pero restringiendo el listado a los últimos N meses. Es mucho más barato de implementar, pero deja el coste con el usuario: un historial amplio sigue pagando la lectura, y el perfil de un usuario nuevo y otro veterano seguirían difiriendo en coste. No resuelve el problema, lo acota.

### D5 — La caché de métricas se invalida por escritura, no por vencimiento

La caché de métricas agregadas se invalida cuando el usuario registra, edita o elimina una transacción, un presupuesto o una cuenta, no solo por vencimiento. Es la diferencia entre una caché que refleja los datos y una que obliga al usuario a recargar para ver el efecto de lo que acaba de hacer.

El coste de esta decisión es un punto de invalidación por cada ruta de escritura. Se mitiga centralizando la invalidación en la capa de servicio, que ya es el punto por el que pasan todas las escrituras de transacciones.

Se adopta el mismo criterio para la caché de insights, que hoy solo expira a las 24 h y por eso puede mostrar métricas hasta un día desactualizadas. **Esto es una mejora de corrección que este cambio introduce de paso**, y conviene declararlo explícitamente porque cambia comportamiento visible del producto.

### D6 — El alcance de una lectura se eleva al límite superior esperado

Las lecturas sin `limit()` que son acotadas por regla de negocio se acotan al valor de esa regla, para que el peor caso sea conocido. El caso claro es el de cuentas: la regla ya limita a 10 por usuario, así que el `limit()` documenta y hace cumplir un límite que hoy solo existe en el servicio.

Para las colecciones compartidas (`car_sharing_cycles`, `car_maintenance_logs`), que no tienen propietario y hoy se leen completas, se aplica `limit()` directo.

### D7 — El identificador de cuenta se elimina de la ruta de lectura por cuenta

`useAccountBalanceChanges.ts:65-76` lanza una petición HTTP por cuenta para obtener su última variación, con un máximo de 10. Se sustituye por una consulta agrupada. El comentario del propio archivo ya anticipa que el máximo de 10 hace la carga aceptable; el motivo real por el que no se hizo antes no es de carga sino de que el patrón deClient N+1 era más rápido de escribir que la consulta agrupada.

## Risks / Trade-offs

**[Los índices compuestos consumes lecturas de construcción y retrasan el despliegue]** → Se despliegan en fase aparte y con antelación. El coste es una espera de minutos u horas, aceptable frente a una caída en producción.

**[Cambiar el contrato de `GET /api/transactions` rompe consumidores que asumen el array completo]** → El orden D3 reduce la superficie, pero no la elimina. La mitigación es que la nueva respuesta exponga un indicador explícito de página siguiente, de modo que el fallo sea ruidoso y no silencioso: un consumidor que asuma completitud verá que faltan registros, en lugar de calcular totales sobre datos truncados sin avisar.

**[La invalidación por escritura añade acoplamiento]** → Todo camino de escritura debe conocer la caché. Si una ruta futura escribe en transacciones y olvida invalidar, el usuario ve métricas obsoletas. Se mitiga invalidando desde la capa de servicio y no desde los route handlers, de modo que no dependa de que quien escriba recuerde.

**[Las consultas de agregación de Firestore tienen límites de grupos y de consultas)** → El número de presupuestos activos y de categorías por usuario es pequeño y acotado por reglas de negocio. Si algún día un usuario superara esos límites, la consulta de agregación fallaría de forma ruidosa, no devolvería resultados incorrectos.

**[El cálculo en servidor añade latencia de red** → Compensa el hecho de que hoy el cálculo en cliente ocurre en cada ciclo de render. Con la caché, la respuesta servida desde el servidor es un único documento leído, más barato y más rápido que los varios cientos de documentos que hoy descarga el navegador.

**[Cambiar la semántica de la caché de insights altera comportamiento visible** → Es deliberado y beneficial, pero debe anunciarse. Un usuario que hoy ve métricas de hasta 24 h atrasadas empezará a verlas actualizadas. No es una regresión.

## Migration Plan

1. **Fase 1 — índices.** Desplegar los 12 índices compuestos faltantes y esperar a que el despliegue los marque como listos. Ningún cambio de comportamiento; si algo falla, no es por esto.
2. **Fase 2 — ruta agregada, sin tocar el listado.** Añadir la ruta de métricas agregadas y su caché. Validar que las cifras coinciden con las que produce hoy el cálculo en cliente, ejecutando ambos en paralelo sobre datos reales antes de cambiar los hooks.
3. **Fase 3 — migrar los hooks de métricas, Sankey y presupuestos** a la ruta agregada. El listado completo sigue existiendo y sigue alimentando lo que aún no se ha migrado, de modo que la regresión es fácil de atribuir.
4. **Fase 4 — acotar el listado.** Cambiar el contrato de `GET /api/transactions` a página con cursor y migrar los consumidores restantes.
5. **Fase 5 — N+1 de escritura.** Hoist de `accountsRepository.findAll` y consolidation de lotes en el registro de turnos y el pago de cuotas.

**Rollback:** las fases 1 y 2 son aditivas y reversibles sin coste. La fase 3 se revierte cambiando de vuelta los hooks, que es una operación local. La fase 4 es la única que rompe consumidores, y por eso va última y aislada. La fase 5 es interna a los servicios y se revierte sin efecto en el cliente.

## Open Questions

- **Tamaño de página por defecto.** Depende de cuántos registros necesita ver el usuario de una vez en la vista de transacciones. No cambia los requisitos ni el enfoque; se calibra con uso real.
- **Periodo de retención de la caché de métricas y su granularidad.** Depende de la variabilidad de los datos y del coste de recomputar. No cambia las decisiones anteriores.
- **Frecuencia de purga de la caché de insights vencida.** Mismo tipo de pregunta operativa que en el otro cambio, y también diferible.
- **Si el coste de `verifySessionCookie` por petición debe abordarse aquí.** Documentado en `proposal.md` como fuera de alcance, porque la corrección natural requiere middleware activo sobre las rutas de API. Si se decide que el middleware debe cubrir también las APIs, esta decisión se revisa; hasta entonces, permanece en `security-legal-hardening`.