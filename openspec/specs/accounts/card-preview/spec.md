# accounts/card-preview Specification

## Purpose

Rediseñar la tarjeta de cuenta individual (`AccountCard`) en la página de cuentas para que todo el contenido de texto — nombre, institución, balance, badge de variación y "X invertidos" — sea totalmente visible y legible, sin recortes ni solapamiento, en escritorio y móvil, con y sin hover.

## Requirements

### Requirement: Contenido de la tarjeta totalmente visible y legible

El sistema SHALL renderizar en `AccountCard`: el nombre de la cuenta completo (que SHALL ajustarse a una segunda línea si es largo en lugar de quedar truncado), la etiqueta de tipo e institución completas, el balance y la metadata de variación/"invertidos". Ningún bloque de la tarjeta SHALL superponerse a otro, y el texto SHALL mantener contraste legible según los tokens de color existentes. Cuando el balance o el contenido lateral sea largo, la tarjeta SHALL reacomodar su layout (p.ej. mover el balance a su propia línea) sin recortar ni ocultar información.

#### Scenario: Nombre de cuenta largo
- **WHEN** una cuenta tiene un nombre largo que excede el ancho disponible
- **THEN** el nombre se muestra completo ajustándose a continuación, sin ser cortado por el balance

#### Scenario: Balance largo
- **WHEN** el balance formateado es largo (p.ej. con precisión cripto)
- **THEN** el balance y su badge/quinta fila se muestran completos sin superponerse al nombre ni a los botones

### Requirement: Acciones sin ocultar contenido

Los botones de acción (ver historial, inversiones, editar, archivar, eliminar) SHALL mantener su función sin superponerse al texto de la tarjeta ni al balance cuando se hacen visibles (hover/foco). En anchos angostos (móvil) la tarjeta SHALL apilar los bloques (icono/cabecera → nombre → balance/metadata → acciones) para que nada quede encima de otro bloque. La visibilidad de las acciones no SHALL provocar saltos que recorten texto.

#### Scenario: Hover sobre la tarjeta
- **WHEN** el usuario pasa el puntero sobre una tarjeta con nombre e institución largos
- **THEN** los botones de acción aparecen sin tapar el nombre, la institución, el balance ni el badge

#### Scenario: Tarjeta en ancho móvil
- **WHEN** la tarjeta se renderiza en un ancho angosto
- **THEN** los bloques se apilan en orden (nombre → balance → metadata → acciones) sin solapamiento y todo el texto permanece visible