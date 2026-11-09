## Qué hace la herramienta

Pega un `location`, su `proxy_pass` y un URI de solicitud. La herramienta calcula lo que recibe realmente el backend y muestra la **misma configuración con la barra final invertida**, para que la diferencia se vea en lugar de describirse.

## La regla

`proxy_pass http://backend;` **no tiene parte de URI**, así que el URI original de la solicitud pasa sin cambios, con el prefijo del location incluido. `proxy_pass http://backend/;` **sí tiene** parte de URI, e incluso esa sola barra cuenta, así que la parte de la solicitud que coincide con el prefijo del location se **sustituye** por ella.

Con `location /app/` y una solicitud de `/app/page`, la primera forma envía `/app/page`, la segunda envía `/page` y `proxy_pass http://backend/v2/;` envía `/v2/page`.

Lo que quieras depende del backend. Una aplicación montada en la misma ruta necesita que se conserve el prefijo; una que no sabe que está detrás de un prefijo necesita que se quite. Elegir mal produce un 404 del backend para una solicitud que el proxy trató a la perfección.

## La barra doble es real

Un location sin barra final más una parte de URI envía al upstream una barra doble de verdad: `location /app` con `proxy_pass http://backend/` convierte `/app/page` en `//page`. La herramienta lo reproduce en lugar de arreglarlo, porque una respuesta más bonita que la que da NGINX ocultaría justo el defecto que viniste a buscar.

## Qué rechaza

Los location con expresión regular y los location con nombre no pueden llevar parte de URI: no hay un prefijo literal que sustituir, así que NGINX rechaza la configuración al arrancar. La herramienta lo indica en lugar de inventarse un resultado.

## La excepción de las variables

Una variable en cualquier parte del valor anula por completo la sustitución del prefijo y lleva la resolución del upstream al momento de la solicitud, lo que normalmente exige un `resolver` y convierte un fallo de resolución de nombres en un error en tiempo de ejecución, en lugar de uno que detectaría `nginx -t`.

## Límites, sin rodeos

Sin `rewrite`, `try_files` ni redirecciones internas: esto responde qué ruta recibe el backend, no qué hace la solicitud completa. Los bloques upstream no se resuelven en servidores, y las cadenas de consulta pasan sin modelarse.

## Compartir resultados

Debajo del resultado, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` el cuadro tal como lo escribiste, una vez que la página tiene un resultado. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia. El valor de proxy_pass nombra un backend, un nombre de host o una dirección que suele ser interna, y la página lo vuelve a mostrar en la variante contraria, así que no se recorta nada: la ventana emergente te pide que lo compruebes. Antes de ofrecer un enlace, se busca en el cuadro una credencial definida por un estándar: una clave privada PEM, una línea `Authorization` o `Proxy-Authorization` con cualquier esquema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), secciones 11.6.2 y 11.7.2: el valor “consists of credentials”, consiste en credenciales), una línea `Cookie` o `Set-Cookie` con valor ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sección 8.4: los servidores “commonly store a nonce (or ‘session identifier’) in a cookie”, suelen guardar en una cookie un nonce o identificador de sesión), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sección 1), una contraseña en una URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sección 3.2.1), un ID de clave de acceso de AWS o un valor `ENC` de FortiOS; todos consultados el 2026-11-01. Si aparece uno, no hay enlace: la ventana emergente indica su línea, y tú lo sustituyes por un marcador de posición y vuelves a presionar. Un valor cuyo nombre solo parece el de un secreto (un miembro JSON `token`, un `token=` en una cadena de consulta) no bloquea el enlace; la ventana emergente indica el primero para que puedas revisarlo.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** El cuadro se rellena como lo haría un pegado, y la página calcula la ruta (el upstream nunca se resuelve ni se contacta). Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
