# Carga mensual de transacciones

## Objetivo

Evitar que la aplicación descargue todo el historial de transacciones. Cada consumidor solicitará remotamente únicamente el intervalo que necesita y reutilizará los intervalos ya descargados desde la caché de TanStack Query.

## Alcance

- La pantalla de transacciones abre en el mes calendario actual.
- Cada `Period` existente (`THIS_WEEK`, `THIS_MONTH`, `LAST_MONTH`, `CUSTOM_RANGE`, etc.) se resuelve a un rango exacto `from`/`to` mediante `resolvePeriod`; no se elimina soporte de semana ni de rango personalizado, aun si comprende varios meses.
- Al seleccionar otro período, el cliente solicita solo su rango exacto. Cada rango usa una clave de caché distinta; al volver a un rango previamente abierto no se hace otra solicitud mientras la entrada siga vigente.
- Las mutaciones mantienen actualizada únicamente la caché del mes afectado. Se conserva la invalidación de cuentas cuando el servidor modifica saldos.
- El dashboard, presupuestos, proyecciones y flujo de caja dejarán de llamar `useTransactions()` sin un rango. Cada uno declarará su intervalo necesario; las vistas con comparativas solicitarán los rangos actual y anterior en paralelo.
- No se altera el acceso al historial: se carga bajo demanda.

## Diseño

### API

`GET /api/transactions` recibirá un `NextRequest` y aceptará parámetros `from` y `to` en formato estricto `YYYY-MM-DD`.

- Si ambos parámetros son válidos, el servicio y el repositorio filtrarán por `user_id` y por el intervalo solicitado.
- Rangos ausentes, incompletos, con formato inválido o invertidos devolverán `400`; se elimina el GET sin límite para impedir regresiones a descargas completas.
- Antes de activar el filtro se auditará el formato de `date` almacenado. La consulta usará límites seguros para el formato real (límite superior exclusivo del día siguiente para timestamps/ISO) o una migración a un campo normalizado `transaction_date: YYYY-MM-DD`. Nunca se usará `<= YYYY-MM-DD` sobre valores con hora.

### Cliente y caché

- `useTransactions` recibirá un `Period` o un `DateRange` y utilizará una clave como `['transactions', 'list', from, to]`.
- La consulta tendrá un tiempo de frescura explícito y no realizará refetch automático al volver a una pantalla si el mes continúa fresco.
- Los selectores de período son la única fuente del intervalo activo; no se precargarán rangos adyacentes.
- Las métricas comparativas usarán una segunda consulta cacheada para el período anterior; sus cálculos recibirán la colección actual y la anterior por separado. Esto conserva tendencias correctas sin descargar todo el historial.

### Mutaciones

- Crear: inserta la transacción devuelta en cada rango cacheado que la contenga, conserva el orden descendente por fecha e invalida cuentas para reflejar el saldo remoto.
- Editar: la mutación recibe la transacción original junto con los cambios. Actualiza de forma optimista todos los rangos cacheados que contienen el origen o el resultado; si la fecha cambia, retira e inserta donde corresponda, preservando el orden.
- Eliminar: recibe la transacción original y la elimina de todos los rangos cacheados que la contienen; luego invalida cuentas.
- En caso de error se restaura exactamente cada entrada de caché afectada. No se invalida todo el historial de transacciones.

## Errores y compatibilidad

La API mantiene el wrapper `{ data }` y los mensajes de error existentes. Todos los consumidores se migrarán en el mismo cambio, por lo que no habrá un fallback sin rango. La consulta Firestore se ordenará por fecha descendente dentro del rango y podrá requerir un índice compuesto para `user_id` y el campo de fecha normalizado.

## Verificación

1. Abrir transacciones: la solicitud contiene el rango exacto del mes actual; semana y rango personalizado generan sus límites correctos.
2. Cambiar de período: se produce una única solicitud para el nuevo rango. Volver a uno fresco no genera otra solicitud.
3. Las métricas comparativas solicitan solo el rango anterior necesario y muestran tendencias correctas.
4. Crear, editar y borrar: todas las listas cacheadas afectadas cambian de inmediato, conservan el orden y no se solicita el historial completo.
5. Dashboard, presupuestos, proyecciones y flujo de caja emiten solicitudes acotadas a sus necesidades.
6. Confirmar que usuarios no autorizados, rangos ausentes/ inválidos y errores del servidor se manejan correctamente, incluyendo fechas Firestore con hora.
