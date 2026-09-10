## Purpose

Amplía la página de cuentas para que la variación diaria del balance sea consolidada, explicable y
de bajo ruido: historial reciente por cuenta, suma en Patrimonio Total, ordenamiento por variación,
estados neutros refinados y recálculo automático del límite del día.

## ADDED Requirements

### Requirement: Mostrar el historial reciente de cambios por cuenta

El sistema SHALL exponer, desde la API de cambios de balance, el historial reciente de una cuenta
(hasta N cambios, N por defecto 10, ordenado de más reciente a más antiguo) cuando se solicite con
`limit`. Un clic sobre el badge o el balance de una tarjeta SHALL abrir un diálogo con ese historial.
Cada entrada SHALL mostrar el origen del cambio, el delta con signo, el balance anterior y el nuevo,
y la fecha y hora. El diálogo SHALL separar visualmente las entradas del periodo actual del cierre
del día anterior (ancla) cuando aplique.

#### Scenario: Abrir el historial desde la tarjeta
- **WHEN** el usuario hace clic en el badge o el balance de una cuenta
- **THEN** se abre un diálogo con los cambios más recientes de esa cuenta ordenados de más reciente a
  más antiguo

#### Scenario: Entradas con origen identificable
- **WHEN** el historial contiene cambios de distintos orígenes
- **THEN** cada entrada muestra su etiqueta de origen (ajuste manual, transacción, inversión o deuda)

#### Scenario: Separador del cierre del día anterior
- **WHEN** el historial incluye el cambio ancla (el inmediatamente anterior al inicio del periodo)
- **THEN** se muestra una separación con el balance "Cierre de ayer: Bs X"

#### Scenario: Cuenta sin historial
- **WHEN** la cuenta no tiene registros de cambio
- **THEN** el diálogo muestra un estado vacío sin ruido visual

### Requirement: Variación diaria consolidada y ordenamiento

El sistema SHALL mostrar, junto al título "Patrimonio Total", la suma de las variaciones diarias de
todas las cuentas con ancla de comparación, convertidas a BOB, como un pill con signo ("+12 hoy"
o "−5 hoy") — silencioso cuando la suma es 0. El sistema SHALL ofrecer ordenar la grilla de cuentas
por variación del día (descendente), por nombre o por balance. En el modo variación, las cuentas
sin ancla SHALL quedar al final de la grilla.

#### Scenario: Variación positiva consolidada
- **WHEN** la suma de deltas diarios (en BOB) de las cuentas con ancla es +12
- **THEN** Patrimonio Total muestra "+12 hoy" con acento emerald

#### Scenario: Variación negativa consolidada
- **WHEN** la suma de deltas diarios es -5
- **THEN** Patrimonio Total muestra "-5 hoy" con color zinc

#### Scenario: Sin anclas de comparación
- **WHEN** ninguna cuenta tiene registro previo al inicio del periodo
- **THEN** Patrimonio Total no muestra ninguna variación

#### Scenario: Ordenar por variación del día
- **WHEN** el usuario selecciona "Variación (hoy)"
- **THEN** las cuentas se ordenan por delta descendente y las cuentas sin ancla quedan al final

### Requirement: Refinar el estado neutro del badge

El sistema SHALL mostrar el pill "Sin cambios · hace X" únicamente cuando el delta del periodo sea 0,
el último cambio registrado sea anterior al inicio del periodo actual (no de hoy) y la cuenta no tenga
inversiones. Cuando la cuenta tenga inversiones, el pill "X invertidos" SHALL tener prioridad sobre
el estado neutro. El sistema SHALL NO mostrar "+0" ni "0" en ninguna circunstancia.

#### Scenario: Cuenta inactiva con inversiones
- **WHEN** el delta del periodo es 0 y la cuenta tiene inversiones
- **THEN** la tarjeta muestra el pill "X invertidos" en lugar de "Sin cambios"

#### Scenario: Sin movimientos en el día
- **WHEN** el delta es 0 y el último cambio registrado es de hoy
- **THEN** no se muestra ningún pill neutro ("Sin cambios" no aparece para actividad de hoy)

#### Scenario: Cuenta inactiva prolongada
- **WHEN** el delta es 0, el último cambio es de un periodo anterior y la cuenta no tiene inversiones
- **THEN** la tarjeta muestra "Sin cambios · hace X" con la referencia temporal al último cambio

### Requirement: Recalcular al cruzar el límite del día

El sistema SHALL recalcular el badge de variación y la variación consolidada cuando el reloj local
cruza la siguiente 4:00 AM (inicio de un nuevo periodo), de modo que una sesión abierta refleje el
nuevo periodo sin interacción manual ni recarga.

#### Scenario: Sesión abierta cruza la 4:00 AM
- **WHEN** la página permanece abierta al cruzar un límite de periodo
- **THEN** se consulta la ancla del nuevo periodo y los badges y el patrimonio se actualizan sin
  recargar

### Requirement: Desglose del patrimonio por moneda

El sistema SHALL mostrar el patrimonio desglosado por moneda (no como un total único en BOB). Cada
fila SHALL mostrar la etiqueta de la moneda ("Bolivianos", "Dólares"…), el subtotal de cuentas en
esa moneda, y para monedas extranjeras (no BOB) su conversión aproximada a BOB con el prefijo "≈".
BOB SHALL mostrarse solo como "Bs X" sin conversión. El sistema SHALL mostrar la variación diaria
por moneda como un chip compacto junto al subtotal, silencioso cuando es 0.

#### Scenario: Moneda extranjera con conversión
- **WHEN** el patrimonio incluye cuentas en USD
- **THEN** la fila de "Dólares" muestra el subtotal en USD y su conversión "≈ Bs X"

#### Scenario: Variación por moneda positiva
- **WHEN** la suma de deltas de las cuentas en USD es +47,50
- **THEN** la fila de Dólares muestra "+47,50 hoy" con color emerald

#### Scenario: Variación por moneda nula
- **WHEN** la suma de deltas de una moneda es 0
- **THEN** la fila no muestra ningún chip de variación

### Requirement: Formato de montos por moneda

El sistema SHALL formatear los montos de cuenta en su moneda nativa: solo BOB/USD muestran símbolo
de moneda (vía `formatCurrency`). El resto (cripto: BTC, ETH, USDT, XRP, BNB, USDC) SHALL
formatearse como número plano con hasta 8 decimales, sin símbolo, para evitar mostrar "Bs" en
cuentas cripto.

#### Scenario: Saldo de cuenta cripto
- **WHEN** una cuenta tiene moneda BTC con balance 0,0023
- **THEN** la tarjeta muestra "0,0023" (sin símbolo) y no "Bs 0,00"

#### Scenario: Diálogo de historial cripto
- **WHEN** el historial de una cuenta BTC muestra una transacción con prev 0,001 y nuevo 0,002
- **THEN** la línea muestra "0,001 → 0,002" (sin símbolo, hasta 8 decimales)