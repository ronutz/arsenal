## Qué hace

Pega una `service_policy` de F5XC (F5 Distributed Cloud) en JSON y la herramienta detalla exactamente cómo compara: el alcance de servidores al que se aplica, el orden en que se evalúan sus reglas y, para cada regla, su acción y las condiciones que deben cumplirse. Lee la definición de la política por completo en tu navegador y no evalúa nada contra tráfico real.

## Qué es una service policy

En la plataforma F5 Distributed Cloud, una service policy decide qué solicitudes llegan a un balanceador de carga y cuáles se rechazan; es el equivalente en la plataforma de la lógica de comparación de solicitudes que escribirías como una iRule en un BIG-IP clásico. Una política tiene un **alcance de servidores** que indica qué servidores gobierna, un **resultado** (disposition) que fija el comportamiento predeterminado y una **lista de reglas** ordenada. El orden importa: las reglas se evalúan en secuencia y la primera que coincide decide el resultado, así que leerlas de arriba abajo es la forma de entender lo que hace realmente la política.

## Cómo coincide una regla

Cada regla combina una **acción**, como permitir o denegar, con un conjunto de condiciones que deben cumplirse todas para que la regla se aplique. La herramienta presenta cada condición tal como la define el esquema:

- el **comparador** y lo que inspecciona (un origen, un encabezado, una ruta, etc.);
- sus **criterios**, ya compare por valor exacto, por expresión regular o por prefijo;
- la **lógica y/o** que combina varios valores;
- cualquier **inversión**, en la que la coincidencia se niega; y
- la **distinción entre mayúsculas y minúsculas** de la comparación.

Ahí está el valor de presentarlas con claridad: una service policy en JSON en bruto es difícil de leer, y un solo comparador mal leído o una condición invertida es justo el tipo de cosa que permite o bloquea el tráfico equivocado.

## Basada en el esquema

Los nombres de campo y las estructuras que entiende la herramienta siguen el esquema OpenAPI oficial de F5 Distributed Cloud para la service policy y sus reglas, así que la decodificación refleja el objeto real y no una suposición. La herramienta es local y no genera tráfico de salida: analiza y explica el JSON que pegas, y nunca contacta con la plataforma ni prueba la política contra solicitudes reales. Una entrada mal formada se notifica en lugar de provocar una excepción.

## Uso

Pega una spec JSON de `service_policy` y lee el alcance de servidores, las reglas en orden y la acción y las condiciones de cada regla. La decodificación es determinista y local.

## Compartir resultados

Debajo del resumen, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` la política tal como se pegó, una vez que la página la reconoce. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia. Una política puede nombrar hosts internos, rangos de direcciones, ASN y nombres de encabezados y de cookies: la ventana emergente te pide que los revises. La página muestra cada comparador con sus valores, así que no se puede recortar nada sin cambiar la lectura; en su lugar, una credencial bloquea el enlace. Antes de ofrecer un enlace, se busca en la política una credencial definida por un estándar: una clave privada PEM, una línea `Authorization` o `Proxy-Authorization` con cualquier esquema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), secciones 11.6.2 y 11.7.2: el valor “consists of credentials”, consiste en credenciales), una línea `Cookie` o `Set-Cookie` con valor ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sección 8.4: los servidores “commonly store a nonce (or ‘session identifier’) in a cookie”, suelen guardar en una cookie un nonce o identificador de sesión), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sección 1), una contraseña en una URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sección 3.2.1), un ID de clave de acceso de AWS o un valor `ENC` de FortiOS, y dos cosas que define el propio esquema de F5 Distributed Cloud: un secreto SecretType, es decir, una URL `clear_secret_info` o una ubicación `blindfold_secret_info` (la [referencia de la API de XC](https://docs.cloud.f5.com/docs-v2/api/views-http-loadbalancer): “SecretType is used in an object to indicate a sensitive/confidential field”, se usa en un objeto para indicar un campo sensible o confidencial), y un comparador del encabezado `Authorization` con un valor literal; todos consultados el 2026-11-01. Si aparece uno, no hay enlace: la ventana emergente indica su línea, y tú lo sustituyes por un marcador de posición y vuelves a presionar. Un valor cuyo nombre solo parece el de un secreto (un miembro JSON `token`, un `token=` en una cadena de consulta, un comparador de `X-Api-Key` o de cookie) no bloquea el enlace; la ventana emergente indica el primero para que puedas revisarlo.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** La política rellena el cuadro como lo haría un pegado, y la página la lee (se decodifica, nunca se evalúa). Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
