## Qué hace

Elige la pila de perfiles de un virtual server Standard (proxy completo) de BIG-IP, es decir, si tiene un perfil client-SSL, un perfil HTTP, un perfil server-SSL y un pool, y la herramienta muestra en qué orden se disparan los eventos de iRule habituales, de `CLIENT_ACCEPTED` a `CLIENT_CLOSED`, como línea de tiempo y como lista. Es un modelo del comportamiento documentado de F5, calculado en tu navegador; nunca se conecta a un equipo.

## Por qué el orden depende de la pila

Una iRule funciona por eventos: tu código Tcl se ejecuta cuando se dispara un evento con nombre, y qué eventos se disparan, y en qué orden, lo decide la configuración del virtual server, no el script. Un virtual server de proxy completo procesa el lado del cliente y el lado del servidor como dos conexiones separadas, así que los eventos recorren fases distintas: se acepta la conexión del cliente, se completa el handshake TLS del lado del cliente, se analiza la solicitud HTTP, se selecciona un miembro del pool, se abre la conexión del lado del servidor, se completa el handshake TLS del lado del servidor, se envía la solicitud, vuelve la respuesta y, por último, se cierran los dos lados. Si cambias la pila, el conjunto de eventos cambia con ella.

## Qué añade cada perfil

- **Sin más perfiles que un pool**, quedan los eventos de nivel de conexión: `CLIENT_ACCEPTED` al principio, los eventos de balanceo de carga cuando se elige un miembro, `SERVER_CONNECTED` en el lado del servidor y los eventos `CLOSED` al final.
- **Un perfil client-SSL** añade los eventos TLS del lado del cliente, como `CLIENTSSL_CLIENTHELLO` y `CLIENTSSL_HANDSHAKE`, antes de que se procese la solicitud.
- **Un perfil HTTP** añade los eventos de solicitud y de respuesta, `HTTP_REQUEST` en el lado del cliente y `HTTP_REQUEST_SEND` y `HTTP_RESPONSE` en el lado del servidor, para que puedas actuar sobre los encabezados y la carga útil (payload).
- **Un perfil server-SSL** añade los eventos TLS del lado del servidor para la conexión con el miembro del pool.
- **Un perfil JSON o SSE** queda fuera de este modelo. BIG-IP 21.0.0 introdujo los eventos JSON ([`JSON_REQUEST`](https://clouddocs.f5.com/api/irules/JSON_REQUEST.html), `JSON_RESPONSE` y sus variantes de error y de ausencia) y [`SSE_RESPONSE`](https://clouddocs.f5.com/api/irules/SSE_RESPONSE.html), que necesitan un perfil JSON o SSE en el virtual server junto con el perfil HTTP ([referencia de perfiles de BIG-IP 21.0](https://techdocs.f5.com/en-us/bigip-21-0-0/big-ip-local-traffic-management-profiles-reference/model-context-protocol.html), consultada el 2026-10-26). La herramienta los nombra en sus notas en lugar de situarlos en la secuencia.

La herramienta también sitúa en la secuencia, donde corresponde, los eventos condicionales, las rutas de recogida de datos (collect) y la ruta de fallo del balanceo de carga (`LB_FAILED`).

## Una nota sobre varias iRules

Cuando dos iRules gestionan el mismo evento, el orden entre ellas no es el orden en que aparecen en la lista; lo controla el comando `priority` dentro de cada evento (F5 K12090273), y se aplica una prioridad predeterminada cuando no se define ninguna. Es un eje distinto del orden entre eventos que presenta esta herramienta.

## Uso

Activa o desactiva los perfiles de tu virtual server y lee la secuencia de eventos resultante como línea de tiempo y como lista. Refleja el modelo de eventos documentado de F5 (la Master List of iRule Events y las referencias de cada evento), así que es una ayuda para planificar y aprender, no una captura de un sistema real en funcionamiento.

## Compartir resultados

Encima de la secuencia de eventos, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva las cinco opciones de perfil por su nombre, cada una como `1` o `0` (`#clientssl=1&http=1&serverssl=1&pool=1&fastl4=0`), y nada más; siempre hay una secuencia, así que una pila con todas las opciones desactivadas también recibe enlace. Todo lo que lleva el enlace va después del `#`, que el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27) describe como “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo): el navegador no lo envía al servidor cuando se abre el enlace, pero se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Un enlace lleva como máximo 16.384 caracteres, el límite que el sitio aplica a todo valor después del `#`; cinco opciones ocupan mucho menos.
- **Al abrir un enlace.** Las opciones toman los valores del enlace (una opción que el enlace no lleva queda desactivada) y se dibuja la secuencia, como si hicieras clic en ellas. Un valor distinto de `1` o `0` hace que se ignore todo el enlace. Se acepte o no, los valores salen después de la propia dirección de la página al instante, sin ninguna solicitud, así que al recargar, con un marcador o con el propio botón Compartir de la página no se lleva nada que no hayas decidido compartir.
