## Why

Dos riesgos abiertos que hoy son explotables desde internet sin autenticación y que además tienen consecuencia legal directa.

1. **Acceso sin auth a datos mutables.** `/gasolina` y `/car-sharing` son públicas por diseño (`middleware.ts:15`), y usan Server Actions. `src/app/gasolina/actions.ts` expone 12 acciones —incluida `resetAllAction()` que borra el estado completo— **sin llamar a `getUserId()`, sin validación de ownership y sin rate limit**. El repositorio destino (`car-sharing.repository.ts`, colección `car_sharing_cycles`) **no tiene campo `user_id`**: es estado global. Cualquier visitante puede leer, mutar y borrar datos compartidos, y el bucle `addTripAction()` convierte la app en un medidor de escrituras no facturable.

   El patrón correcto ya existe en el archivo hermano `maintenance.actions.ts:37-43`, que sí llama a `getUserId()` y degrada a solo-log cuando no hay sesión. `actions.ts` simplemente quedó fuera.

2. **Sin rate limiting en toda la app.** No existe throttling, captcha ni dependency de Redis/Upstash. `/api/auth/session` POST es el endpoint más expuesto: no requiere sesión, no está limitado, y cada llamada dispara un round-trip al Admin SDK de Firebase (`createSessionCookie`). `GET /api/transactions` no tiene `limit()` ni ventana de fechas (`transactions.repository.ts:67-75`), así que devuelve el historial completo en cada request.

3. **Cumplimiento legal.** El footer enlaza a "Privacidad" y "Términos" con `href="#"` — documentos que no existen. No hay borrado de cuenta (`adminAuth.deleteUser()` nunca se llama), ni export de datos, ni `firestore.rules`. Los datos financieros de usuarios viven en Firebase (Google, fuera de la jurisdicción) sin que el usuario sea informado en ningún momento.

## What Changes

**Control de acceso en Server Actions públicas**
- Añadir `getUserId()` a las 12 acciones de `src/app/gasolina/actions.ts`.
- Definir el modelo de autorización de `/gasolina` y `/car-sharing`: por-user (scope `car_sharing_cycles` por `user_id`) o compartido con secreto. **Decisión abierta — ver `design.md`.**
- Rechazar con 401 toda acción mutante sin sesión autenticada.

**Rate limiting**
- Límite por IP y por usuario en `/api/auth/session` POST, `/api/insights` POST y todas las rutas mutantes.
- Límite de frecuencia en las Server Actions de `/gasolina`.
- Cabecera `Retry-After` y respuesta 429 consistente.

**Protección de datos / legal**
- Páginas `/privacidad` y `/terminos` con contenido real, enlazadas desde el footer (reemplazan los `href="#"`).
- Endpoint de borrado de cuenta con cascada sobre todas las colecciones del usuario.
- Endpoint de export de datos.
- `firestore.rules` como segunda capa (hoy el Admin SDK las bypasea por completo y el archivo no existe).

**Higiene asociada**
- Eliminar `src/lib/env.ts` (código muerto, nunca importado, no valida nada).
- Corregir el comentario obsoleto en `middleware.ts:37` (dice `/api/auth` pero el matcher excluye todo `/api`).

## Capabilities

### New Capabilities

- `access-control/abuse-protection`: autorización en Server Actions públicas, scoping por usuario del estado compartido, rate limiting por IP/usuario y códigos de error 401/429.
- `privacy/data-rights`: páginas de privacidad y términos, derecho de borrado con cascada, export de datos, y reglas de Firestore como capa de respaldo.

### Modified Capabilities

Ninguna. No hay specs existentes de seguridad ni de legal en `openspec/specs/`; el árbol actual (`account-balance-history`, `accounts/card-preview`, `driver/app-deposits`, `driver/tips`, `investments/recurring-buys`) no cubre estos comportamientos y ninguno cambia.

## Impact

**Código afectado**
- `src/app/gasolina/actions.ts` — 12 acciones sin auth (el punto más crítico).
- `src/repositories/car-sharing.repository.ts` (344 líneas) y `car-maintenance.repository.ts` — sin campo `user_id`.
- `src/app/api/auth/session/route.ts` — endpoint sin limite.
- `src/app/api/insights/route.ts` — `POST` sin limite; además el `months` de POST no hace `parseInt` (`"abc"` → `NaN`).
- `src/lib/auth.server.ts` — `verifySessionCookie(cookie, true)` sin memoizar por request.
- `src/features/landing/components/LandingFooter.tsx` — `href="#"` en Privacidad y Términos.
- `src/app/ajustes/page.tsx` — punto de entrada natural para borrar/exportar.
- `firebase.json` — necesita la clave `rules`.
- `middleware.ts`, `src/lib/env.ts` (borrar).

**Sistemas y dependencias**
- Firestore: añadir `user_id` a `car_sharing_cycles` y `car_maintenance_logs` requiere migración de datos existentes (colecciones hoy globales).
- Rate limiting: requiere elegir backend. Sin Redis externo, la opción por defecto sería en memoria de proceso — **ineficaz en serverless**, donde cada invocación es una instancia nueva.
- Legal: las páginas deben declarar que los datos se procesan en Google Firebase (transferencia fuera de la jurisdicción del usuario).

**Fuera de alcance**
- El gasto de Firestore (historial completo sin `limit()`, ausencia de agregaciones) se trata en el cambio separado `firestore-cost-controls`.
- IDOR: la auditoría confirmó que los 37 route handlers llaman a `getUserId()` y que el chequeo `user_id` se respeta en toda la capa de servicios. No hay cambio de comportamiento, solo se documenta como invariante a preservar.