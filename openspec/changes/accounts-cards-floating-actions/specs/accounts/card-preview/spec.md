## MODIFIED Requirements

### Requirement: Acciones sin ocultar contenido

Los botones de acción (ver historial, editar, archivar/restaurar, eliminar y expandir inversiones) SHALL mantener su función sin superponerse al texto de la tarjeta ni al balance en ninguna vista. En desktop (`md` y superior) las acciones SHALL mostrarse **siempre visibles** en un cluster flotante al pie-derecho de la tarjeta, posicionado fuera del flujo del layout, de modo que no reserven ancho, no compriman el nombre ni el balance y no requieran hover para descubrirse. El cluster SHALL no solapar el balance, el badge de variación ni el texto en ninguna longitud de nombre o balance. En anchos angostos (móvil) la tarjeta SHALL apilar los bloques (icono/cabecera → nombre → balance/metadata → acciones) para que nada quede encima de otro bloque, y las acciones SHALL permanecer siempre visibles e inline como hasta ahora.

#### Scenario: Cluster flotante visible sin hover en desktop
- **WHEN** la tarjeta se renderiza en desktop
- **THEN** los botones de acción se muestran siempre visibles en un cluster al pie-derecho de la tarjeta, sin requerir hover ni foco

#### Scenario: Hover sobre la tarjeta
- **WHEN** el usuario pasa el puntero sobre una tarjeta con nombre e institución largos
- **THEN** el cluster flotante permanece visible y los botones de acción no tapan el nombre, la institución, el balance ni el badge

#### Scenario: Las acciones no comprimen el contenido en desktop
- **WHEN** una tarjeta en desktop tiene un nombre y un balance largos
- **THEN** el nombre y el balance usan todo el ancho disponible sin compartirlo con las acciones, y el cluster no los tapa

#### Scenario: Tarjeta en ancho móvil
- **WHEN** la tarjeta se renderiza en un ancho angosto
- **THEN** los bloques se apilan en orden (nombre → balance → metadata → acciones) sin solapamiento, todo el texto permanece visible y las acciones siguen visibles sin hover

#### Scenario: Cluster con chevron de inversiones
- **WHEN** la cuenta tiene inversiones asociadas
- **THEN** el chevron de expandir/contraer aparece dentro del cluster junto a editar, archivar y eliminar

## ADDED Requirements

### Requirement: Icono de tipo neutral en zinc

El sistema SHALL mostrar el icono de tipo de cuenta en la tarjeta en tonos neutros zinc, sin color distintivo por tipo ni tinte de la paleta Sage, tanto en desktop como en móvil. El tipo de cuenta SHALL quedar expresado únicamente por la etiqueta de texto (p.ej. "Banco", "Billetera Digital", "Cripto"). El emerald `#059669` SHALL seguir reservado exclusivamente a valores positivos/variación, y el rojo SHALL usarse únicamente como tinte semántico de la acción de eliminar.

#### Scenario: Icono neutro en desktop
- **WHEN** una tarjeta se renderiza en desktop
- **THEN** el icono de tipo (banco, billetera, efectivo, cripto, otro) se muestra en gris zinc sobre fondo zinc, sin un color propio del tipo

#### Scenario: Icono neutro en móvil
- **WHEN** una tarjeta se renderiza en un ancho angosto
- **THEN** el icono de tipo se muestra igualmente en gris zinc sobre fondo zinc, coherente con la versión desktop