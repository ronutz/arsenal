## Qué hace

Convierte un documento entre JSON y YAML, en los dos sentidos, en tu navegador. A partir de JSON produce YAML de estilo bloque; a partir de YAML produce JSON. Cuando falla un análisis, el error indica la línea y la columna exactas, y cuando una conversión pierde algo por el camino, una nota explica qué y por qué.

## Los dos sentidos

- **De JSON a YAML.** El JSON se valida primero con el mismo analizador preciso, que sigue la posición, que usa el formateador de JSON, así que un documento no válido se rechaza con una línea, una columna y una ruta JSON Pointer en lugar de con un fallo impreciso. Los datos válidos se escriben después como YAML de estilo bloque.
- **De YAML a JSON.** El YAML se analiza con un esquema compatible con JSON y se serializa a JSON. Los anchors y los alias (el mecanismo de reutilización `&name` y `*name` de YAML) se expanden en línea, y los escalares de bloque (los estilos de cadena multilínea de YAML) se convierten en cadenas JSON normales.

## Las trampas de las comillas que resuelve

YAML es famoso por leer de buena gana una palabra sin comillas como algo que no es una cadena, y ahí es donde fallan los viajes de ida y vuelta. El caso más conocido es el “problema de Noruega”: la palabra `NO` sin comillas se lee como el booleano falso, y lo mismo pasa con `yes`, `on` y `off`, y con valores como `1.0` (un número, no la cadena “1.0”) y `08` (que no es un octal válido). Al emitir YAML, el conversor pone entre comillas estos valores para que lo que querías como cadena siga siendo una cadena.

## Lo que se puede perder en la conversión

Algunas cosas existen en un formato pero no en el otro, así que las notas las señalan:

- **Comentarios.** YAML tiene comentarios y JSON no, así que los comentarios se descartan al convertir de YAML a JSON.
- **Anchors y alias.** Se expanden a su valor completo, así que una referencia compartida y compacta en el YAML de origen se convierte en datos repetidos en la salida.

## Ejemplos resueltos

- El JSON `{"port":8080,"tls":true}` se convierte en las líneas YAML `port: 8080` y `tls: true`.
- El YAML `country: NO` se convierte en el JSON `{"country":"NO"}` a la entrada, y cuando se vuelve a emitir como YAML el valor va entre comillas, `country: "NO"`, para que no se confunda con falso.

## Uso

Pega JSON para obtener YAML, o YAML para obtener JSON. Lee las notas de conversión cuando aparezcan: te dicen si algo, como un comentario o un anchor, cambió de una forma que conviene que sepas. La conversión es determinista para una entrada dada.

## Compartir resultados

Al principio de la lectura (o debajo de un error de análisis, que también es una respuesta), **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` el origen tal como se pegó, el sentido y la sangría. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia. La configuración suele contener contraseñas, claves y nombres internos, así que la ventana emergente te pide que la leas antes de enviar el enlace. El texto va tal como se pegó: la salida convertida muestra todos los valores. Antes de ofrecer un enlace, se busca en el texto una credencial definida por un estándar: una clave privada PEM, una línea `Authorization` o `Proxy-Authorization` con cualquier esquema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), secciones 11.6.2 y 11.7.2: el valor “consists of credentials”, consiste en credenciales), una línea `Cookie` o `Set-Cookie` con un valor ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), secciones 4.1.1 y 4.2.1), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sección 1), una contraseña en una URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sección 3.2.1: la forma “user:password” “is deprecated”, está obsoleta), un ID de clave de acceso de AWS o un valor `ENC` de FortiOS; todos consultados el 2026-11-01. Si aparece una de ellas, no hay enlace: la ventana emergente indica su línea, y tú la sustituyes por un marcador de posición y vuelves a presionar. Un valor cuyo nombre solo parece el de un secreto (una clave `password:` o `apiKey`) no bloquea el enlace; la ventana emergente indica el primero para que puedas revisarlo. Aquí cuentan como credenciales cinco nombres de miembro y de clave, porque un estándar define lo que contienen: `access_token` y `refresh_token` ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), secciones 1.4, 1.5 y 5.1: “Access tokens are credentials used to access protected resources”, los tokens de acceso son credenciales que se usan para acceder a recursos protegidos), `id_token` ([OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html), sección 3.1.3.3), `client_secret` ([RFC 7591](https://www.rfc-editor.org/rfc/rfc7591), sección 3.2.1) y `registration_access_token` ([RFC 7592](https://www.rfc-editor.org/rfc/rfc7592), sección 3); todos consultados el 2026-11-01. Con un valor, cualquiera de ellos significa que no hay enlace, como en el Decodificador de OIDC.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** El texto rellena el cuadro y las opciones quedan como las habrías elegido tú, y la página lo convierte. Si una opción es desconocida, se ignora el enlace. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
