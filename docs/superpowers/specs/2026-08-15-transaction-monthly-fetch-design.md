# Carga mensual de transacciones

## Objetivo

Evitar que la pantalla de transacciones descargue todo el historial en cada carga. La aplicación solicitará remotamente solo las transacciones del mes que el usuario esté visualizando y reutilizará los meses ya descargados desde la caché de TanStack Query.

## Alcance

- La pantalla abre en el mes calendario actual.
- Al seleccionar otro mes, el cliente solicita solo el rango de fechas de ese mes.
- Cada mes usa una clave de caché distinta; al volver a un mes previamente abierto no se hace otra solicitud mientras la entrada siga vigente.
- Las mutaciones mantienen actualizada únicamente la caché del mes afectado. Se conserva la invalidación de cuentas cuando el servidor modifica saldos.
- No se altera el acceso al historial: se carga bajo demanda.

## Diseño

### API

`GET /api/transactions` aceptará parámetros opcionales `from` y `to` en formato `YYYY-MM-DD`.

- Si ambos parámetros son válidos, el servicio y el repositorio filtrarán por `user_id` y por el intervalo inclusivo de `date`.
- Si no se reciben parámetros, el comportamiento seguirá siendo compatible para consumidores existentes; la pantalla principal sí siempre enviará el período mensual.
- Rangos inválidos, incompletos o invertidos devolverán `400`, evitando consultas imprecisas.

### Cliente y caché

- `useTransactions` recibirá el período actual y utilizará una clave como `['transactions', 'list', from, to]`.
- La consulta tendrá un tiempo de frescura explícito y no realizará refetch automático al volver a una pantalla si el mes continúa fresco.
- Los selectores de mes son la única fuente del período activo; no se precargarán meses adyacentes.

### Mutaciones

- Crear: inserta la transacción devuelta en la clave del mes de su fecha, solo si ese mes está cacheado; invalida cuentas para reflejar el saldo remoto.
- Editar: actualiza de forma optimista el mes mostrado. Si cambia la fecha entre meses, elimina la transacción del mes origen y la agrega al destino si existen en caché.
- Eliminar: elimina de forma optimista solo en la clave del mes de la transacción y luego invalida cuentas.
- En caso de error se restaura exactamente la caché afectada. No se invalida todo el historial de transacciones.

## Errores y compatibilidad

La API mantiene el wrapper `{ data }` y los mensajes de error existentes. Los clientes que no adopten el período seguirán obteniendo el resultado actual hasta que se migren. La consulta Firestore se ordenará por fecha descendente dentro del rango y podrá requerir un índice compuesto para `user_id` y `date`.

## Verificación

1. Abrir transacciones: la solicitud contiene el primer y último día del mes actual.
2. Cambiar de mes: se produce una única solicitud para el nuevo rango.
3. Volver al mes inicial: no se realiza una nueva solicitud mientras el caché esté fresco.
4. Crear, editar y borrar: la lista visible cambia de inmediato y no se solicita el historial completo.
5. Confirmar que usuarios no autorizados, rangos inválidos y errores del servidor se manejan correctamente.
