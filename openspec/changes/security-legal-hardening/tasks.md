## 1. Fundamentos de seguridad

- [x] 1.1 Añadir un helper de verificación de origen que compare la cabecera `Origin` con el host esperado, reutilizable por cualquier ruta mutante (design.md D3)
- [x] 1.2 Aplicar la verificación de origen a las rutas mutantes de API bajo sesión
- [x] 1.3 Corregir el comentario obsoleto de `middleware.ts:37`, que describe `/api/auth` cuando el matcher excluye todo `/api`
- [x] 1.4 Eliminar `src/lib/env.ts` (código muerto, nunca importado, no valida ninguna variable)
- [x] 1.5 Añadir `parseInt` y validación al parámetro `months` del handler `POST /api/insights`, que hoy produce `NaN` con entrada no numérica

## 2. Reglas de Firestore como segunda capa

- [x] 2.1 Crear `firestore.rules` en modo denegar-todo
- [x] 2.2 Declarar la clave `rules` en `firebase.json`
- [x] 2.3 Verificar con un script que ninguna ruta de cliente importa `firebase/firestore` antes de desplegar las reglas
- [x] 2.4 Incluir las reglas en el despliegue junto a los índices

## 3. Limitador de tasa sobre contadores en Firestore

- [x] 3.1 Crear la colección de contadores con el modelado de clave por identidad y ventana temporal
- [x] 3.2 Implementar el límite: lectura del contador, rechazo con 429 y `Retry-After` sin escribir, incremento transaccional en el camino permitido
- [x] 3.3 Usar comparación en tiempo constante donde aplique e impedir que el valor de la identidad se persista en claro
- [x] 3.4 Añadir el memo en memoria con TTL corto para amortiguar ráfagas en la misma instancia
- [x] 3.5 Añadir `expires_at` e índice a los contadores, más la purga de documentos vencidos
- [x] 3.6 Limitar `POST /api/auth/session` con el límite más estricto
- [x] 3.7 Limitar `POST /api/insights` para proteger la invalidación de caché
- [x] 3.8 Desplegar en modo observativo sobre creación de sesión y comparar contra tráfico real antes de activar el rechazo

## 4. Control de escritura del estado compartido de /gasolina

> Esta sección reemplaza a una anterior que cerró el mismo vector con un token compartido. Ese modelo se implementó y se descartó: su premisa —que no todos los participantes tienen cuenta— era falsa, y el token nunca llegó a emitirse, así que las 8 acciones rechazaban a todo el mundo. Ver `design.md` D1.

- [x] 4.1 Verificar contra producción cuántos participantes tienen cuenta y cuántos la usan, en lugar de suponerlo
- [x] 4.2 Implementar `clientIp()` sobre `Headers` para que el limitador también sea usable dentro de Server Actions, donde no hay `Request`
- [x] 4.3 Crear `src/app/gasolina/guards.ts` con `requireCarWriteLimit`, `requireResetLimit` y `requireCarSession`
- [x] 4.4 Aplicar el límite por IP a las 8 Server Actions mutantes de `src/app/gasolina/actions.ts` y a las 3 de `maintenance.actions.ts`, rechazando antes de cualquier lectura o escritura
- [x] 4.5 Reservar `deleteTripAction`, `deleteCycleAction`, `resetAllAction` y `deleteMaintenanceLogAction` a sesión autenticada válida
- [x] 4.6 Añadir el techo de 1 reset / 24 h sobre `resetAllAction`, que el límite general no puede frenar por ser una sola petición
- [x] 4.7 Preservar la degradación sin sesión de `addMaintenanceLogAction`: log histórico sin transacción, sin tocar la cuenta de nadie
- [x] 4.8 Añadir confirmación explícita al borrado de mantenimiento, que era el único destructivo de la página sin `window.confirm`

## 5. Páginas legales

- [x] 5.1 Redactar `/privacidad` identificando responsable, categorías de datos y el procesamiento mediante servicios de Google Firebase como transferencia fuera de la jurisdicción del usuario
- [x] 5.2 Redactar `/términos` incluyendo el descargo sobre la exactitud de los balances y las métricas calculadas
- [x] 5.3 Reemplazar los enlaces `href="#"` de `LandingFooter.tsx` por las rutas reales
- [x] 5.4 Verificar que ambas páginas son accesibles sin sesión

## 6. Derechos de supresión y portabilidad

- [x] 6.1 Declarar el manifiesto explícito de colecciones con campo `user_id`
- [x] 6.2 Escribir el script de auditoría que compara las colecciones que realmente contienen `user_id` contra el manifiesto y falla si hay alguna fuera
- [x] 6.3 Ejecutar la auditoría y ampliar el manifiesto hasta que pase
- [x] 6.4 Implementar el borrado en cascada por lotes y con paginación por cursor, reportando el resultado por colección
- [x] 6.5 Revocar la sesión del usuario tras el borrado
- [x] 6.6 Exponer el borrado desde `/ajustes` con confirmación explícita
- [x] 6.7 Implementar la exportación de datos de la propia cuenta en formato legible
- [x] 6.8 Exponer la exportación desde `/ajustes`

## 7. Verificación

- [x] 7.1 Comprobar que una petición sin sesión puede registrar y cerrar ciclos dentro del límite, y que el estado compartido se persiste
- [x] 7.2 Comprobar que una petición sin sesión NO puede borrar viaje, ciclo, historial ni mantenimiento, y que el rechazo ocurre antes de cualquier lectura
- [x] 7.3 Comprobar que el rechazo por límite de tasa no escribe en el estado compartido
- [x] 7.4 Comprobar que el borrado de cuenta elimina los datos de todas las colecciones del manifiesto y revoca la sesión
- [x] 7.5 Comprobar que la exportación no incluye datos de ningún otro usuario
- [x] 7.6 Ejecutar `npm run lint` y `npx tsc --noEmit`