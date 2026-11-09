# Explicador de filtros LDAP

Pega cualquier filtro de búsqueda LDAP (protocolo ligero de acceso a directorios, Lightweight Directory Access Protocol) y la herramienta lo analiza exactamente como lo hace un servidor de directorio: según el RFC 4515, la representación en cadena a la que acaban compilándose todos los clientes LDAP, las búsquedas de PingDirectory, las consultas a un datastore de PingFederate y las consultas de Active Directory.

## Qué obtienes

El árbol anotado. Cada nodo AND (`&`), OR (`|`) y NOT (`!`) expresa su regla en lenguaje llano; cada elemento hoja se clasifica por tipo de coincidencia: igualdad, presencia (`=*`), subcadena (comodines, con sus partes “empieza por”, “contiene” y “termina en” en orden), `>=`, `<=`, aproximada (`~=`) o coincidencia extensible. Los escapes hexadecimales del RFC 4515 (`\2a`, `\28`, `\29`, `\5c`) se decodifican y se enumeran. Los OID de reglas de coincidencia más conocidos de Active Directory se reconocen por su nombre: `1.2.840.113556.1.4.803` (AND bit a bit, la clásica prueba de cuenta deshabilitada `(userAccountControl:1.2.840.113556.1.4.803:=2)`), `804` (OR bit a bit) y `1941` (pertenencia transitiva a grupos).

## Errores anclados

Un filtro mal formado falla con la posición exacta del carácter y un circunflejo (^) debajo: el paréntesis desequilibrado, el elemento sin `=`, la barra invertida a la que le faltan sus dos dígitos hexadecimales.

## Privacidad

Los filtros suelen contener nombres de atributos internos y la estructura de las OU. Todo se analiza en local, en tu navegador; no se transmite nada.

## Compartir resultados

Debajo de los recuentos del filtro, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` el filtro tal como lo escribiste, incluso uno que no se puede analizar: su error anclado es la lectura que quizá quieras mostrar. Su ventana emergente dice primero qué lleva el enlace y después da una precaución propia: un filtro puede nombrar usuarios, grupos y la forma de tu directorio, así que léelo antes de enviar el enlace. Después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Un filtro que afirma un valor de un atributo de contraseña no obtiene enlace, y la ventana emergente nombra el atributo: `userPassword` ([RFC 4519](https://www.rfc-editor.org/rfc/rfc4519), sección 2.41, OID 2.5.4.35, “octet strings that are known only to the user and the system”, cadenas de octetos que solo conocen el usuario y el sistema), `authPassword` ([RFC 3112](https://www.rfc-editor.org/rfc/rfc3112), OID 1.3.6.1.4.1.4203.1.3.4) y `unicodePwd` de Active Directory ([el esquema de AD de Microsoft](https://learn.microsoft.com/en-us/windows/win32/adschema/a-unicodepwd), ID de atributo 1.2.840.113556.1.4.90), todos consultados el 2026-11-01. Se reconocen por nombre o por OID, con cualquier combinación de mayúsculas y minúsculas y con cualquier opción, porque el [RFC 4512](https://www.rfc-editor.org/rfc/rfc4512) (sección 2.5, consultado el 2026-11-01) hace que las descripciones de atributo no distingan mayúsculas de minúsculas, con las opciones después de un `;`. Una prueba de presencia como `(userPassword=*)` no lleva ningún valor y sí obtiene enlace.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que el filtro no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres, el límite que el sitio aplica a todo valor después del `#`; si el filtro es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** El filtro rellena el cuadro y la página lo explica como si lo hubieras pegado; no se envía nada a ningún directorio. Un filtro que afirma una contraseña se ignora. En cualquier caso, el valor sale de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
