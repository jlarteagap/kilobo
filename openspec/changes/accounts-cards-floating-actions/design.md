## Context

Tarjeta de cuenta (`AccountCard`) dentro de `src/features/accounts/AccountsList.tsx`. El problema y la motivación están en `proposal.md`; los comportamientos exigidos en `specs/accounts/card-preview/spec.md`. Restricciones de diseño: referente Minimal · Zinc (`docs/DESIGN-MANUAL.md` §11) — neutros zinc, un solo acento emerald `#059669` reservado a valores positivos, radios simétricos (card `rounded-[22px]`, elementos `rounded-lg`), sin dark mode.

Estado actual del render en desktop: fila única con tres grupos en línea — tile de icono teñido por tipo (paleta Sage) + nombre, a la derecha balance+badge, y al final un cluster de acciones `opacity-0 group-hover:opacity-100` que, por estar en flujo con `shrink-0`, reserva siempre ~130-180px aunque esté invisible.

## Goals / Non-Goals

**Goals:**
- Liberar el ancho de las tarjetas en desktop sacando las acciones del flujo.
- Acciones siempre visibles en desktop (hacerlas descubribles sin hover).
- Neutralizar el icono de tipo a zinc en desktop y móvil (eliminar la paleta Sage de la tarjeta).
- Mantener intactas la interacción (historial por clic en balance, expandir inversiones, archivar/restaurar, eliminar con confirmación) y el layout móvil.

**Non-Goals:**
- No cambiar el layout de acciones en móvil (queda inline y siempre visible como hoy).
- No tocar ordenamiento, dialogs, datos, API, hooks ni tipos.
- No añadir dependencias ni dark mode.
- No aplicar la neutralización del icono fuera de la tarjeta de cuenta (p.ej. `AccountForm`, `InvestmentsList`).

## Decisions

**D1 — Sacar el cluster del flujo solo en desktop, con un único elemento responsivo.**
El cluster actual se re-estiliza con utilidades responsive en lugar de duplicarlo: sigue siendo hijo del bloque derecho (`flex justify-between`) para que en móvil quede inline, pero en `md:` pasa a `absolute right-3 bottom-3` (la tarjeta raíz pasa a `relative`). Se eliminan `opacity-0`, `group-hover:opacity-100` y `transition-opacity` del cluster y se añade presentación de pill en desktop: `md:bg-zinc-100 md:border md:border-zinc-200 md:rounded-lg md:p-0.5`.
- *Alternativa descartada:* renderizar dos clusters (uno móvil, uno desktop) → duplica markup y botones sin beneficio.
- *Alternativa descartada:* menú kebab `⋮` con dropdown → no la pidió el usuario; el clúster siempre visible mantiene las acciones one-tap.

**D2 — Reservar espacio vertical en el pie de la tarjeta para que el pill no solape contenido.**
El contenido (`p-4`, fila nombre/balance) suma padding inferior en desktop (`md:pb-11`) y, cuando la lista expandida de inversiones está abierta, ese bloque añade `md:pb-11` en su propio contenedor. El pill queda en `bottom-3` (dentro del área reservada) y con `z-10`.
- *Alternativa descartada:* colocar el cluster dentro del flujo al final de una fila nueva → volvería a consumir ancho/alto sin aportar nada frente al absolute con espacio reservado.

**D3 — Icono de tipo neutral: zinc fijo, sin color por tipo.**
En el tile (líneas 87-93) se reemplaza `style={{ backgroundColor: ...color...18, color }}` por clases fijas `bg-zinc-100 text-zinc-400`, y el tamaño baja de 40px a 36px (`w-9 h-9`). Se quita `color` del destructuring de `getAccountTypeDetails` (no hay otro uso en el componente). El tipo sigue visible por la etiqueta de texto (`label`).
- *Alternativa descartada:* eliminar el icono completamente → pierde escaneabilidad; C2 equilibra scannability y sobriedad.

**D4 — Color semántico del 🗑.**
El botón de eliminar pasa de zinc (con rojo solo en hover) a un rojo suave constante (`text-red-400`/`text-red-500`, hover sobre `bg-red-50`/`bg-red-100`). El resto de iconos del cluster quedan zinc-500 con hover zinc-900. Esto es semántica destructiva, no un segundo acento de diseño; el emerald sigue exclusivo para valores positivos.

**D5 — Sin cambios en el bloque de balance.**
El botón de balance sigue derecho (`text-left md:text-right`), conserva su clic (abre historial) y su badge. Al desaparecer el cluster del flujo en desktop, recibe todo el ancho restante de forma natural (sin `w-` nuevas).

## Risks / Trade-offs

- **El pill puede chocar con contenido largo** (balance crypto con mucha precisión + badge en la misma línea, o lista de inversiones expandida) → reservar `md:pb-11` en el contenido y en el bloque expandido, `z-10` en el pill; verificar en los escenarios de names/balances largos.
- **Touch targets pequeños** (botones ~24px, herencia actual) → se mantiene el tamaño actual para no alterar la interacción ya conocida; el pill agrega padding visual. Si se quisiera corregir, sería un cambio aparte.
- **Card más alta en desktop** por el espacio del pie → trade-off aceptado: es lo que separa visualmente las tarjetas, que es el síntoma que motivó el cambio.
- **Regresión de estilo en móvil** al tocar clases compartidas del cluster → mitigar verificando en `max-md` que el cluster queda inline, siempre visible y sin padding de pill.

## Migration Plan

- Cambio solo de frontend, contenido en `AccountsList.tsx`; sin migración de datos ni servidor.
- Rollback: revertir las clases del tile y del cluster en `AccountCard`; no hay estado persistente involucrado.

## Open Questions

- Ninguna para el alcance definido. La prueba visual en distintos anchos y contenido (nombres largos, balances crypto, cuentas archivadas) se hará durante la implementación.