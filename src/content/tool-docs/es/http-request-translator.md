## Qué hace

Pega una solicitud HTTP/1.1 en bruto, como las que dan una captura, un log de proxy o un ejemplo de un RFC, y la herramienta la convierte en el comando `curl` equivalente, en una llamada `fetch` de navegador, en una invocación de HTTPie, en un fragmento de Python `requests` y en una línea de PowerShell. Todo se analiza en tu navegador; nunca se envía nada y no se ejecuta ninguna solicitud.

## La inversa del explicador de curl

El [Explicador de comandos curl](/tools/curl-command-explainer) va en un sentido: entra un comando y, entre sus salidas, está la solicitud en bruto. Esta herramienta va en el otro: entra una solicitud en bruto y sale un comando que se puede ejecutar. Las dos existen porque cada sentido hace falta en un momento distinto. Una captura te da un mensaje; un terminal quiere un comando; un informe de error quiere los dos.

## Cómo se arma la URL

Una línea de solicitud normal solo lleva una ruta, como en `GET /users HTTP/1.1`, porque la conexión ya conoce el host. Para producir algo que puedas ejecutar en cualquier sitio, la herramienta une ese destino con el encabezado `Host`. Los destinos en absolute-form, los que usan los proxies, ya están completos y se toman tal cual. Si falta `Host` en una solicitud en origin-form, la herramienta lo dice, porque si no la URL sería una suposición.

## Los encabezados que descarta a propósito

`Host`, `Content-Length` y `Connection` no se vuelven a emitir. Todos los clientes los establecen por su cuenta, y pasarlos tal cual provoca encabezados duplicados o, peor, una longitud declarada que ya no coincide con el cuerpo que el cliente va a enviar realmente.

## De qué advierte

- **Un `Content-Length` que no coincide con el cuerpo.** Los servidores y los proxies pueden entonces no estar de acuerdo sobre dónde termina el mensaje, que es la materia prima del contrabando de solicitudes (request smuggling).
- **Un cuerpo chunked.** Se pasa tal como se pegó, sin decodificarlo; decodificar las codificaciones de transferencia es tarea de un decodificador de mensajes, no de un traductor.
- **`http` sin cifrar.** Los encabezados y el cuerpo viajan legibles.
- **Un encabezado `Authorization` o una `Cookie`.** Una solicitud capturada suele ser una credencial activa, y en la práctica esta es la advertencia que más importa: lo que estás a punto de pegar en un ticket puede ser una sesión que funciona.

## Uso

Pega la solicitud, lee la línea de solicitud y los encabezados analizados y después copia la forma que necesites. La conversión es determinista y local, así que la misma solicitud produce siempre la misma salida.

## Compartir resultados

Debajo de la línea de solicitud y de sus advertencias, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` la solicitud con todas las credenciales enmascaradas, nunca tal como se escribió: una solicitud capturada suele llevar un encabezado Authorization o una cookie de sesión, y esta página muestra en claro el valor de cada encabezado, y en cinco traducciones. Su ventana emergente dice primero qué lleva el enlace y cuántos valores se enmascararon, y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Qué se enmascara:

- **Los campos de encabezado**, por su nombre: `Authorization` y `Proxy-Authorization` conservan su esquema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), secciones 11.6.2 y 11.7.2: el valor “consists of credentials”, consiste en credenciales); Basic conserva su user-id y pierde la contraseña ([RFC 7617](https://www.rfc-editor.org/rfc/rfc7617), sección 2); un JWT conserva su encabezado protegido y pierde los claims y la firma ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sección 1); se va cada valor de `Cookie` ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sección 4.2.1); un campo con nombre de secreto (`X-API-Key`) se va entero; se va un token dentro de cualquier otro valor (un `Referer` con un código). Cada uno pasa a ser `REDACTED`.
- **El destino de la solicitud**: la contraseña de un `user:password@` ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sección 3.2.1) y los parámetros de consulta secretos pasan a ser `REDACTED`.
- **El cuerpo**: los miembros JSON y los parámetros de formulario con nombre de secreto (`access_token` ([RFC 6750](https://www.rfc-editor.org/rfc/rfc6750), secciones 2.2 y 2.3), `refresh_token`, `client_secret`, `password` y `code` ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), secciones 2.3.1, 4.1.2, 4.3.2 y 5.1), `code_verifier` ([RFC 7636](https://www.rfc-editor.org/rfc/rfc7636), sección 4.5) y cualquier nombre que termine en token, secret, password o api key) se rellenan con un `*` por cada uno de sus octetos, así que el cuerpo conserva su longitud: un `Content-Length` que coincidía sigue coincidiendo.

Los vectores de compartición de la herramienta comprueban que la página que abre el enlace lee la misma solicitud (las mismas advertencias, los mismos campos y la misma longitud de cuerpo). Si queda una clave o un token donde ningún nombre lo indica (un JWT pegado como cuerpo de texto sin formato), no hay enlace: la ventana emergente indica su línea.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que la copia no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerla.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** La copia rellena el cuadro como lo haría un pegado y la página la traduce; no se envía nada. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
