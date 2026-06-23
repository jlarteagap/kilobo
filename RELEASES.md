# Release Notes v1.6.1
**Released**: June 23, 2026

## 🎉 ¡Novedades Destacadas!

### 💵 Soporte Multi-Moneda y Conversión en Tiempo Real
¡Kilo ahora habla múltiples monedas! Hemos implementado un sistema robusto para manejar cuentas y transacciones en dólares (USD) y bolivianos (BOB) con conversión automática.
- **Tasas de Cambio en Vivo**: Integración con un proveedor en tiempo real para obtener el tipo de cambio oficial/P2P de Binance para USD en Bolivia.
- **Actualización Automática**: El sistema refresca la tasa de cambio en vivo cada 10 minutos en el navegador y cuenta con caché en servidor para máxima velocidad y eficiencia.
- **Transferencias entre Cuentas de Distinta Moneda**: Realiza traspasos o ahorros entre cuentas en USD y BOB; el sistema convertirá automáticamente los montos y guardará el registro exacto.
- **Métricas y Gráficos Unificados**: Tu balance general, deudas, presupuestos y gráficos se unifican automáticamente a BOB usando las tasas de cambio del día para brindarte una visión financiera consolidada.

---

# Release Notes v1.6.0
**Released**: June 10, 2026

## 🎉 ¡Novedades Destacadas!

### 🎯 Metas de Ahorro
Hemos añadido un módulo completo para planificar tus ahorros a mediano y largo plazo.
- **Seguimiento Visual**: Registra tus objetivos, visualiza tu progreso y calcula proyecciones automáticas para saber cuándo alcanzarás tu meta.
- **Sincronización con Transacciones**: El dinero transferido a tus metas se registra y deduce correctamente de tus saldos.

### 📅 Fechas Personalizadas
Ahora puedes elegir la fecha y hora exacta al registrar deudas, transacciones y viajes compartidos, evitando la restricción de usar siempre la hora del servidor.

### 🏷️ Actividades y Etiquetas (Renombramiento)
Para hacer la aplicación más intuitiva, hemos renombrado el concepto de "Proyectos" a **Actividades** y los "Subtipos" a **Etiquetas** a lo largo de toda la plataforma.

---

# Release Notes v1.5.6
**Released**: May 30, 2026

## 🎉 ¡Novedades Destacadas!

### 🚗 Control de Gasolina y Registro de Viajes
Hemos añadido un módulo completo para hacer seguimiento a tus gastos de combustible y bitácora de viajes en la ruta `/gasolina`.
- **Edición en Línea**: Edita y corrige tus registros de viajes directamente desde la tabla con un doble clic.
- **Desglose de Viajes por Usuario**: El panel ahora muestra una distribución detallada de los viajes acumulados por cada miembro del grupo.
- **Registro Preciso de Hora**: Los trayectos ahora incluyen la hora y minutos exactos para un control impecable.

### 🔧 Mantenimiento de Vehículos y Odómetro
¡Mantén tu auto en perfecto estado! Hemos desarrollado un sistema dedicado para registrar los mantenimientos de tu coche.
- **Alertas de Odómetro**: Registra tus kilometrajes actuales y recibe avisos automáticos cuando sea momento de realizar tu cambio de aceite o revisión periódica.
- **Panel de Mantenimiento**: Una interfaz limpia para ver el historial mecánico e incidencias.

### 📊 Comparativa de Gastos en Cuentas (Últimos 3 Meses)
Optimiza tu presupuesto mensual con nuestra nueva herramienta inteligente en la sección de Cuentas. Compara tus gastos promedio contra los últimos 3 meses y obtén sugerencias de ahorro personalizadas.

### 📉 Comparación de Categorías y Gráficos Premium
- **CategoryComparison Component**: Una visualización de alto nivel para comparar tus categorías de gasto mes a mes.
- **Categorías Simplificadas**: Limpiamos y simplificamos el flujo de categorías eliminando las fuentes de ingresos redundantes, centrándonos 100% en una estructura organizada de egresos.

## ✨ Mejoras de Rendimiento y Consistencia

- **Actualizaciones Transaccionales en Lote**: La creación y eliminación de transacciones ahora se realiza a nivel servidor en un lote atómico (`WriteBatch` de Firestore). Esto garantiza que la actualización del saldo de la cuenta y el registro de la transacción ocurran simultáneamente, eliminando estados parciales.
- **Optimización de Lecturas en Base de Datos**: Rediseñamos todos los repositorios del sistema para que retornen los datos inmediatamente tras su escritura, eliminando un paso de consulta (`get()`) innecesario y reduciendo el consumo/costo de la base de datos Firestore en un 50% por cada registro.
- **Consultas Concurrentes**: El validador de seguridad en cuentas ahora realiza consultas en paralelo, acelerando el flujo de trabajo a la mitad de tiempo.
- **Caché Inteligente de Algoritmos**: Los motores de detección de anomalías y sugerencias de ahorro ahora reutilizan los datos de tendencias previamente calculados en memoria en lugar de recalcularlos en cada consulta.

---

# Release Notes v1.3.0
**Released**: March 24, 2026

## 🎉 Novedades v1.3.0

### Menú de Acciones Rápidas
¡Crear datos ahora es más rápido! Hemos añadido un nuevo botón "+" en la cabecera que despliega un menú para crear transacciones, cuentas, presupuestos y más desde cualquier página.

### Diseño Mobile-First
La aplicación ahora luce mejor que nunca en dispositivos móviles. Hemos ajustado las tablas y los contenedores para asegurar que tu información financiera esté siempre legible y accesible.

### Página de Inicio "Quiet Wealth"
Estrenamos una nueva identidad visual con nuestra landing page. El panel de control principal ahora vive en `/dashboard`, ofreciendo una experiencia más organizada.

## ✨ Mejoras v1.3.0

- **Transacciones Simplificadas**: Hemos eliminado el paso obligatorio de seleccionar un método de pago, haciendo que registrar tus gastos sea mucho más fluido.
- **Métricas del Dashboard**: Resúmenes de deudas y presupuestos ahora integrados directamente en la vista principal.
- **Navegación**: Iconos actualizados y mejor flujo de autenticación.

## 🐛 Correcciones v1.3.0

- Arreglado el cálculo de patrimonio neto relacionado con cuentas de deuda.
- Eliminados errores visuales en las tablas de transacciones en pantallas pequeñas.

## 📝 Changelog Completo

Consulta el archivo [CHANGELOG.md](CHANGELOG.md) para más detalles técnicos.
