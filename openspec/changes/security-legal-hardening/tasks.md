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

## 4. Protección por token del estado compartido de /gasolina

- [x] 4.1 Crear el documento de configuración que almacena el token de acceso compartido, fuera del bundle de cliente
- [x] 4.2 Implementar la validación del token en el servidor con comparación en tiempo constante
- [x] 4.3 Emitir la cookie `httpOnly`, `sameSite=strict` y con `path` restringido a las rutas de la feature, tras validar el token
- [x] 4.4 Exigir el token válido en las 8 Server Actions mutantes de `src/app/gasolina/actions.ts` (de 10 exportadas: las 2 de lectura siguen públicas), rechazando antes de cualquier escritura
- [x] 4.5 Añadir el gate correspondiente a las acciones de mantenimiento de la misma feature, preservando la degradación sin sesión que ya define `maintenance.actions.ts`
- [x] 4.6 Exponer en la interfaz la entrada de token y el estado de escritura habilitado o deshabilitado, manteniendo la lectura pública
- [x] 4.7 Documentar el procedimiento de rotación del token

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

- [x] 7.1 Comprobar que una petición sin sesión ni token no puede escribir en el estado compartido
- [x] 7.2 Comprobar que una petición con token válido sí opera con normalidad
- [x] 7.3 Comprobar que el rechazo por límite responde 429 con `Retry-After` y no escribe
- [x] 7.4 Comprobar que el borrado de cuenta elimina los datos de todas las colecciones del manifiesto y revoca la sesión
- [x] 7.5 Comprobar que la exportación no incluye datos de ningún otro usuario
- [x] 7.6 Ejecutar `npm run lint` y `npx tsc --noEmit`