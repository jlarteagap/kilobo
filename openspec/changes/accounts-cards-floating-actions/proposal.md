## Why

En desktop, las tarjetas de cuenta están visualmente muy juntas: el cluster de acciones (editar/archivar/eliminar, más el chevron de inversiones) vive en línea al final de la fila y, aunque está oculto con `opacity-0` hasta el hover, **siempre reserva ~130-180px de ancho** (`shrink-0` en flujo). Ese ancho muerto comprime el balance y la metadata contra el nombre, hace que los nombres largos rompan antes y aprieta las cards del grid de 2 columnas. Además, el tile de tipo de la izquierda inyecta la paleta Sage (5 colores por tipo) en una vista que ya migra al referente Minimal · Zinc (un solo acento emerald).

## What Changes

- **Desktop (`md:`):** las acciones de `AccountCard` salen del flujo y pasan a un **cluster flotante absoluto al pie-derecho** de la tarjeta, siempre visible (se elimina el patrón `opacity-0 group-hover:opacity-100`). El balance, su badge y el nombre dejan de compartir ancho con las acciones; el texto respira y las cards se distancian.
- **Icono de tipo neutral (desktop y móvil):** el tile de la izquierda pierde el color por tipo (`bg {color}18` + `color` de Sage) y pasa a `bg-zinc-100 text-zinc-400` de 36px. El tipo de cuenta se comunica únicamente por el texto de la etiqueta ("Banco · Billetera Digital · …"). El icono queda como apoyo quieto y decorativo.
- **Color:** emerald `#059669` sigue reservado exclusivamente a valores positivos; en el cluster solo el 🗑 lleva un tinte rojo suave (semántica destructiva), el resto es zinc.
- **Móvil (`max-md`):** las acciones NO cambian de layout — se mantienen apiladas inline y siempre visibles, como hoy. Solo cambia el icono (neutralización).
- Se mantienen intactas: clic en balance/badge para abrir historial, expandir inversiones (chevron sigue en el cluster cuando aplica), archivar/restaurar y eliminar con su confirmación.

## Capabilities

### New Capabilities

- Ninguna.

### Modified Capabilities

- `accounts/card-preview`: cambia el requerimiento de visibilidad y posición de las acciones de la tarjeta en desktop (ocultas-hasta-hover y en flujo → cluster flotante siempre visible al pie-derecho) y añade el requisito del icono de tipo neutral en zinc en ambas vistas.

## Impact

- **Código afectado:** `src/features/accounts/AccountsList.tsx` — componente `AccountCard` (tile de icono líneas 87-93, bloque derecho y cluster de acciones líneas 113-170). Solo layout y estilo: sin cambios de datos, API, tipos ni hooks.
- **Sin dependencias nuevas.**
- **Referente de diseño:** `docs/DESIGN-MANUAL.md` §11 Minimal · Zinc (zinc neutros, radios simétricos 22px/xl, único acento emerald para valores positivos, rojo únicamente semántico).
- **Riesgo:** bajo; cambio contenido en una sola página; el layout móvil de acciones y toda la lógica de interacción quedan intactos.