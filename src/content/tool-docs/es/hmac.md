## Qué hace

Calcula un HMAC, un hash con clave, sobre un mensaje usando una clave secreta, con el resultado en hexadecimal y en Base64. Eliges SHA-256, SHA-384 o SHA-512 como hash subyacente. El cálculo usa la Web Crypto nativa del navegador, y tu clave nunca sale de tu navegador. Es la misma construcción, por el mismo código, que usa el verificador de JWT para comprobar una firma HS256, así que los dos coinciden, y no por casualidad.

## Para qué sirve un HMAC

Un hash simple demuestra que los datos no han cambiado, pero cualquiera puede recalcularlo, así que no demuestra quién lo produjo. HMAC añade una clave secreta al hash, lo que lo convierte en un código de autenticación de mensajes: un valor que demuestra a la vez que el mensaje está íntegro y que procede de alguien que tiene la clave. El emisor calcula el HMAC y lo envía junto con el mensaje; el receptor, que comparte la clave, lo recalcula y comprueba que los dos coinciden. Está definido en el RFC 2104 y en FIPS 198-1, con vectores de prueba en el RFC 4231.

## Simétrico por naturaleza

HMAC usa un único secreto compartido tanto para producir el código como para verificarlo. Eso lo hace rápido y sencillo, pero también significa que quien puede verificar un HMAC también puede falsificarlo, porque las dos operaciones usan la misma clave. Es la herramienta adecuada cuando la misma parte, o dos partes que ya comparten un secreto de confianza, producen y comprueban los códigos. Cuando partes independientes tienen que verificar sin poder falsificar, encaja mejor una firma asimétrica: es la misma contrapartida que separa HS256 de RS256 en los JWT.

## Cómo se construye

HMAC no es simplemente el hash de la clave unida al mensaje, que sería vulnerable a los ataques de extensión de longitud. Es una construcción anidada: se calcula el hash del mensaje junto con una forma derivada de la clave, y ese resultado se vuelve a pasar por el hash con una segunda forma derivada. Esta estructura es la que da a HMAC su demostración de seguridad, y es el motivo por el que conviene usar HMAC en lugar de inventarse un hash con clave propio.

## Uso

Introduce un mensaje y una clave secreta, elige el hash y lee el HMAC en hexadecimal o en Base64. Si das el mismo mensaje y la misma clave a dos sistemas, los códigos coinciden; cambia el mensaje o la clave en un solo carácter y el código cambia por completo.

## Compartir resultados

Debajo del MAC, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` el mensaje tal como se escribió y el algoritmo, y nunca la clave. Quien recibe el enlace escribe la clave que le compartes por otra vía y obtiene el mismo MAC; tampoco se lleva el MAC, porque junto al mensaje permitiría a cualquiera probar sin conexión intentos de adivinar una clave débil. Una excepción: la clave `Jefe` también va, porque es la clave de prueba publicada en el [RFC 4231](https://www.rfc-editor.org/rfc/rfc4231) (caso de prueba 2, consultado el 2026-11-01), la que usa el Ejemplo de la página. Su ventana emergente dice primero qué lleva el enlace, después muestra una advertencia propia (el mensaje va tal como se escribió, así que léelo antes de enviar el enlace) y luego ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Una clave HMAC es una clave: el [RFC 2104](https://www.rfc-editor.org/rfc/rfc2104) (sección 3, consultado el 2026-11-01) pide claves “chosen at random” (elegidas al azar) y “periodically refreshed” (renovadas periódicamente), una práctica que “limits the damage of an exposed key” (limita el daño de una clave expuesta), y quien la tenga puede calcular un MAC válido para cualquier mensaje.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que los valores no se envían al servidor cuando se abre el enlace; se quedan en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlos.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** El mensaje y el algoritmo rellenan la página. El cuadro de la clave toma la clave de prueba publicada cuando llega y, si no, conserva lo que haya escrito quien abre el enlace; en una página recién abierta está vacío, y una nota indica que la clave nunca viaja. El MAC se calcula con Web Crypto en el navegador en cuanto los dos campos están rellenos. Un algoritmo que la página no ofrece, o una clave que no es la publicada, hacen que se ignore el enlace entero. En cualquier caso, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
