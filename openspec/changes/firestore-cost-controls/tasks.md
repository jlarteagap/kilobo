## 1. Fase 1 — Índices compuestos

- [x] 1.1 Escribir el script de auditoría que extrae los patrones de consulta compuestos de `src/repositories/` y los contrasta con `firestore.indexes.json`
- [x] 1.2 Ejecutar la auditoría sobre el estado actual y registrar la lista de patrones sin índice
- [x] 1.3 Añadir a `firestore.indexes.json` los 12 patrones faltantes: investments por `user_id,date`; investments por `account_id,user_id,date`; subcolección de transacciones de inversión por `date,created_at`; credits por `user_id,status`; credits por `account_id,user_id`; projects por `user_id,status`; transactions por `category_id,user_id`; transactions por `category_id,tag,user_id`; transactions por `account_id,user_id`; transactions por `to_account_id,user_id`; debts por `account_id,user_id`; savings_goals por `account_id,user_id`
- [x] 1.4 Conectar el script de auditoría a la verificación previa al despliegue
- [ ] 1.5 Desplegar los índices y esperar a que el despliegue los marque como listos antes de continuar con la fase 2

## 2. Fase 2 — Ruta de métricas agregadas

- [x] 2.1 Crear la ruta de métricas agregadas que devuelve totales de ingreso y gasto, balance neto, comparativa con el periodo anterior y series temporales, calculados en el servidor
- [x] 2.2 Añadir a esa ruta el desglose por categoría que alimenta el grafo de flujo de caja, devolviendo el grafo ya construido
- [x] 2.3 Añadir a esa ruta el importe gastado de cada presupuesto activo dentro del periodo
- [x] 2.4 Resolver el caso sin datos devolviendo estructuras vacías válidas, sin nodos nulos ni errores
- [x] 2.5 Implementar la persistencia de la respuesta agregada con fecha de vencimiento
- [x] 2.6 Centralizar la invalidación de esa caché en la capa de servicio, para que la descubra toda ruta de escritura
- [x] 2.7 Conectar la invalidación a las escrituras de transacciones, presupuestos y cuentas
- [x] 2.8 Aplicar el mismo criterio de invalidación por escritura a la caché de insights, que hoy solo expira a las 24 h
- [ ] 2.9 Ejecutar en paralelo el cálculo nuevo y el existente sobre datos reales y comparar cifras antes de migrar ningún hook

## 3. Fase 3 — Migrar los hooks consumidores

- [x] 3.1 Migrar `useFinancialMetrics` a la ruta agregada y retirar su reducción en el navegador
- [x] 3.2 Migrar `useCashflowData` a la ruta agregada y retirar la construcción del grafo en el navegador
- [x] 3.3 Migrar el cálculo de progreso de presupuestos a la ruta agregada y retirar `calcProgress` del recorrido del historial
- [x] 3.4 Sustituir `useAccountBalanceChanges` por una consulta agrupada que elimine la petición HTTP por cuenta
- [x] 3.5 Confirmar que el número de peticiones del dashboard es idéntico con historial corto y con historial amplio

## 4. Fase 4 — Acotar el listado de transacciones

- [x] 4.1 Añadir a la consulta de transacciones soporte de ventana de fechas con el filtro empujado a la base de datos
- [x] 4.2 Implementar paginación por cursor sobre fecha e identificador, con el cursor firmado para que el cliente no pueda alterarlo
- [x] 4.3 Exponer en la respuesta el indicador de página siguiente y un tamaño de página máximo configurable
- [x] 4.4 Cambiar `GET /api/transactions` para devolver una página en lugar del historial completo
- [x] 4.5 Migrar los consumidores restantes del listado completo, incluidos la página de transacciones, la proyección de balance y los insights
- [x] 4.6 Cambiar el filtrado en memoria por rango de fechas de los insights por un filtrado en la consulta
- [x] 4.7 Verificar que recorrer todas las páginas devuelve la totalidad del historial, sin omisiones ni duplicados

## 5. Fase 5 — N+1 de escritura

- [ ] 5.1 Elevar la preparación de cuentas fuera del bucle en la creación de transacción con impacto en balance
- [ ] 5.2 Consolidar el registro de un turno del conductor en un conjunto acotado de lecturas y lotes, sustituyendo la repetición por transacción
- [ ] 5.3 Consolidar el pago de varias cuotas de un crédito para que prepare los datos compartidos una sola vez
- [ ] 5.4 Consolidar el reprocesado y el borrado de turnos para que el número de lecturas no crezca con el número de transacciones afectadas
- [ ] 5.5 Eliminar la lectura previa al incremento del odómetro, que la base de datos ya resuelve de forma atómica

## 6. Lecturas auxiliares

- [ ] 6.1 Resolver en la base de datos la exclusión de categorías migradas, hoy filtrada en memoria tras leerlas
- [ ] 6.2 Sustituir la búsqueda de inversión por nombre, que lee el conjunto completo de la cuenta, por una consulta dirigida
- [ ] 6.3 Aplicar `limit()` a las lecturas sin cota, incluyendo la lectura completa de `car_sharing_cycles` en su borrado masivo y la de registros de mantenimiento
- [ ] 6.4 Elevar el límite de la lectura de cuentas al máximo ya impuesto por regla de negocio
- [ ] 6.5 Revisar `GET /api/driver/maintenance`, que lee todos los registros y luego filtra por tipo en memoria, y acotarlo

## 7. Higiene

- [ ] 7.1 Sustituir el temporizador global de 10 minutos de la tasa de cambio por una consulta con revalidación server-side, de modo que no dispare una petición de red en cada página y cada 10 minutos con el navegador abierto
- [ ] 7.2 Ejecutar `npm run lint` y `npx tsc --noEmit`