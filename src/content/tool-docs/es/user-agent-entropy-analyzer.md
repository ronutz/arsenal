## Qué hace

Pega una cadena User-Agent y la herramienta desglosa los tokens identificativos que lleva (navegador y versión, motor de renderizado, sistema operativo y versión, clase de dispositivo y arquitectura de CPU), estima los bits distintivos que aporta cada uno e indica si la cadena está en la forma reducida y congelada que envían ahora los navegadores modernos.

## Lo que quiere mostrar

Un User-Agent es un pequeño montón de entropía. Ningún token por sí solo te identifica, pero juntos acotan el campo, y cuanto más detallada es la cadena, más distintiva resulta. La herramienta muestra esa superficie con honestidad. Las cifras de bits son ilustrativas, tomadas de investigaciones publicadas sobre fingerprinting, no una medición en vivo de ninguna población: el objetivo es hacer visible la forma de la superficie, no ponerte una puntuación.

## Adónde fue el detalle

Los navegadores modernos congelan el User-Agent: Chromium fija la versión menor en 0.0.0 y limita el detalle de la plataforma, y Safari fijó hace tiempo buena parte de su cadena. El detalle no desapareció: pasó a User-Agent Client Hints (Sec-CH-UA y compañía), que un sitio tiene que pedir activamente mediante el encabezado Accept-CH. La consecuencia es que la recogida de alta entropía ahora se ve en los encabezados, en lugar de quedar implícita en una sola cadena. Solo decodifica y explica: la entrada es una cadena que pegas, no se lee nada de tu propio navegador y no se envía nada.

## Compartir resultados

Debajo del resumen, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` el User-Agent tal como se escribió (`input`). Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Una cadena User-Agent nombra un navegador, un motor y un sistema operativo, y todo servidor con el que habla un navegador ya la recibe. Pero el cuadro admite varias líneas, y una solicitud entera copiada de las herramientas para desarrolladores (devtools) también se lee como un User-Agent, así que antes de ofrecer un enlace el texto pasa por la comprobación de secretos del sitio: si un valor es una credencial por su formato (una línea `Cookie`, [RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sección 4.2.1; credenciales de Authorization, [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sección 11.6.2; un JWS o un JWE; una contraseña en una URL; una clave privada PEM; un ID de clave de acceso de AWS), no hay enlace, y la ventana emergente indica su línea. Pega solo el User-Agent y vuelve a presionar. Un valor cuyo nombre solo parece el de un secreto sigue teniendo enlace, con una línea que lo nombra.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que el texto no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** El texto rellena el cuadro como lo haría un pegado y la página lo analiza; no se envía nada. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
