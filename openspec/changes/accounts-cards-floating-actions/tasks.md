## 1. Neutralizar el icono de tipo en zinc (desktop y móvil)

- [x] 1.1 En `AccountCard` (`src/features/accounts/AccountsList.tsx`), reemplazar el `style={{ backgroundColor, color }}` del tile de icono (líneas 87-93) por clases fijas `bg-zinc-100 text-zinc-400` y tamaño `w-9 h-9 rounded-lg`, sin color por tipo
- [x] 1.2 Quitar `color` del destructuring de `getAccountTypeDetails` y verificar que no haya otro uso de `color` en el componente
- [x] 1.3 Confirmar en desktop y móvil que el icono (banco/billetera/efectivo/cripto/otro) se ve zinc neutro y que la etiqueta de texto sigue mostrando el tipo

## 2. Cluster de acciones flotante en desktop

- [x] 2.1 Volver `relative` a la raíz de `AccountCard` y re-estilizar el cluster de acciones (líneas 139-169): eliminar `opacity-0`, `group-hover:opacity-100` y `transition-opacity`; añadir `md:absolute md:right-3 md:bottom-3 md:bg-zinc-100 md:border md:border-zinc-200 md:rounded-lg md:p-0.5 md:z-10`; mantener inline y siempre visible en móvil (`max-md`)
- [x] 2.2 Añadir reserva de pie en desktop: `md:pb-11` al contenedor de contenido (fila nombre/balance) y `md:pb-11` al bloque expandido de inversiones, para que el pill no solape balance/badge ni la última fila de inversiones
- [x] 2.3 Aplicar color semántico al eliminar: 🗑 con rojo suave constante (`text-red-500`, hover `bg-red-100 text-red-600`); el resto de iconos del cluster zinc-500 con hover zinc-900
- [x] 2.4 Verificar que en desktop el clic en balance/badge abre el historial, el chevron expande/contrae inversiones, y archivar/restaurar y eliminar disparan sus flujos actuales

## 3. Verificación y calidad

- [x] 3.1 Revisar en desktop los casos límite: nombre largo, balance con precisión cripto, cuenta archivada (chip), tarjeta con inversiones expandidas — sin solapamientos entre pill y contenido
- [x] 3.2 Revisar en móvil (`max-md`) que el layout de acciones queda exactamente como hoy (inline, siempre visible) y solo cambia el icono a zinc
- [x] 3.3 Confirmar que no quedan colores Sage ni otros acentos en la tarjeta (solo zinc + emerald para deltas positivos + rojo semántico del 🗑)
- [x] 3.4 Ejecutar `npm run lint` y verificar que el build dev compila sin errores de tipado (`npx tsc --noEmit`)