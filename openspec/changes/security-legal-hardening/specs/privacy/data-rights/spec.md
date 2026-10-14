## Purpose

Garantiza que el usuario pueda ejercer sus derechos sobre sus propios datos financieros, y que la aplicación informe de forma visible y veraz dónde se procesa esa información.

## ADDED Requirements

### Requirement: Documento de privacidad publicado

El sistema SHALL publicar un documento de privacidad accesible desde el pie de página de la aplicación, sin enlaces rotos. El documento SHALL identificar al responsable del tratamiento, las categorías de datos tratados y el hecho de que los datos se almacenan y procesan en infraestructura de Google Firebase, equivalente a una transferencia de datos fuera de la jurisdicción del usuario.

El documento SHALL ser alcanzable por un usuario que no ha iniciado sesión.

#### Scenario: Enlace del pie de página funcional
- **WHEN** un usuario navega al pie de página y pulsa "Privacidad"
- **THEN** se muestra el documento de privacidad completo, no una página vacía ni una redirección a un ancla inexistente

#### Scenario: El documento menciona el proveedor de almacenamiento
- **WHEN** un usuario lee el documento de privacidad
- **THEN** encuentra una mención explícita a que los datos se procesan mediante servicios de Google

#### Scenario: Términos accesibles
- **WHEN** un usuario pulsa "Términos" en el pie de página
- **THEN** se muestra un documento de términos vigente

### Requirement: El usuario puede eliminar su cuenta y todos sus datos

El sistema SHALL ofrecer una vía para que un usuario autenticado elimine permanentemente su cuenta. La eliminación SHALL eliminar los datos personales y financieros del usuario en todas las colecciones donde resida su información, incluidos, sin limitarse a ellos, transacciones, cuentas, presupuestos, categorías, deudas, créditos, inversiones, objetivos de ahorro, turnos y depósitos de conductor, registros de historial de balance e insights.

Tras la eliminación, el sistema SHALL revocar la sesión del usuario. La operación SHALL ser irreversible y SHALL NOT requerir intervención de un operador.

#### Scenario: Borrado completo
- **WHEN** un usuario autenticado confirma la eliminación de su cuenta
- **THEN** se eliminan sus documentos en todas las colecciones, se revoca su sesión y el acceso posterior con la misma identidad ya no recupera datos

#### Scenario: Borrado de un usuario sin datos registrados
- **WHEN** un usuario sin transacciones ni registros confirma la eliminación
- **THEN** la operación responde con éxito y su sesión queda revocada

#### Scenario: Intento de borrado sin sesión
- **WHEN** una petición sin sesión intenta eliminar una cuenta
- **THEN** el sistema responde 401 y no elimina nada

### Requirement: El usuario puede exportar sus datos

El sistema SHALL permitir que un usuario autenticado obtenga una copia de sus datos financieros en un formato legible y portable. La exportación SHALL incluir la información de todas las categorías donde el usuario tenga registros y SHALL identificar los datos personales asociados a la cuenta.

#### Scenario: Exportación de datos propios
- **WHEN** un usuario autenticado solicita su exportación
- **THEN** recibe un archivo con sus transacciones, cuentas y demás registros, correspondientes únicamente a su propia cuenta

#### Scenario: La exportación no incluye datos ajenos
- **WHEN** un usuario exporta sus datos
- **THEN** el archivo no contiene ningún registro perteneciente a otro usuario

### Requirement: Reglas de base de datos como capa de respaldo

El sistema SHALL declarar reglas de seguridad de la base de datos en la configuración del proyecto y mantenerlas desplegadas. Las reglas SHALL denegar por defecto el acceso directo del cliente a los datos, de modo que el acceso solo sea posible a través de la capa de servidor autorizada.

#### Scenario: Consulta directa desde el cliente sin autorización
- **WHEN** un cliente intenta leer documentos de la base de datos de forma directa, sin pasar por la capa de servidor de la aplicación
- **THEN** la base de datos deniega la operación

#### Scenario: La configuración declara las reglas
- **WHEN** se inspecciona la configuración del proyecto de Firebase
- **THEN** existe una declaración de reglas de seguridad referenciada para su despliegue