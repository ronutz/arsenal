## Qué hace

Pega JSON y esta herramienta lo valida y después le da formato legible, lo minifica o lo ordena. Lo que la distingue de un simple `JSON.parse` es lo que te dice cuando algo está mal o es inusual: un error de análisis indica la línea, la columna y la ruta exactas del problema; las claves de objeto repetidas se señalan, y los números muy grandes o muy precisos se conservan exactamente en lugar de redondearse. Todo se ejecuta en tu navegador.

## Un analizador hecho para diagnosticar

El motor es un analizador escrito a mano que sigue la posición mientras lee, en lugar de depender del análisis integrado del entorno de ejecución de JavaScript. Eso aporta tres cosas que importan en la práctica:

- **Errores precisos.** Cuando falla el análisis, obtienes la línea, la columna, el desplazamiento en bytes, un mensaje en lenguaje llano y la ruta JSON Pointer (RFC 6901) hasta el punto del error, en lugar de un único `SyntaxError`, que depende del motor y no lleva ruta.
- **Detección de claves duplicadas.** La gramática de JSON permite técnicamente que un objeto repita una clave, y `JSON.parse` se queda en silencio solo con la última. Ese comportamiento silencioso oculta errores reales, así que este motor indica cada duplicado que encuentra, con su ruta.
- **Números grandes exactos.** Los números JSON no tienen límite de tamaño, pero un número de JavaScript es un valor de coma flotante de 64 bits y pierde precisión por encima de 2^53. El formateador conserva los dígitos que escribiste, así que un id de 20 dígitos o un decimal de alta precisión no se redondean sin avisar.

## Formatear, minificar y ordenar

Cuando el JSON es válido, puedes darle formato legible con una sangría uniforme, minificarlo a la forma más pequeña en una sola línea u ordenar las claves de los objetos para que dos documentos que solo difieren en el orden de las claves queden alineados al compararlos. El orden es por clave y no reordena los arrays, cuyo orden tiene significado en JSON.

## Ejemplos resueltos

- `{"b":1,"a":2}` ordenado por clave queda `{"a":2,"b":1}`.
- `{ "a": 1 }` minificado queda `{"a":1}`, sin los espacios en blanco.
- `{"id":10000000000000001}` conserva todos sus dígitos, mientras que pasar por un valor de coma flotante de 64 bits lo convertiría en `10000000000000000`.
- `{"a":1,"a":2}` se señala por la clave duplicada `a`; un analizador estándar se quedaría en silencio con `2`.

## Uso

Pega un documento JSON y elige darle formato, minificarlo u ordenarlo. Si no se puede analizar, el error señala el punto exacto; si se analiza pero tiene claves duplicadas o números demasiado grandes, se indican. La herramienta es una función pura de su entrada, así que el mismo documento da siempre el mismo resultado.

Para XML, el [Formateador y validador de XML](/tools/xml-formatter) hace lo mismo: una comprobación de que está bien formado que indica la línea y la columna, y después el formato legible o la minificación.

## Compartir resultados

Al principio de la lectura (o debajo de un error de análisis, que también es una lectura), **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` el JSON tal como se pegó y las tres opciones elegidas (legible o minificado, la sangría, las claves ordenadas). Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia. El JSON suele contener contraseñas, claves y nombres internos, así que la ventana emergente te pide que lo leas antes de enviar el enlace. El texto va tal como se pegó: la salida con formato muestra todos los valores, así que no se puede sustituir nada sin cambiar lo que ve quien lo lee. Antes de ofrecer un enlace, se busca en el texto una credencial definida por un estándar: una clave privada PEM, una línea `Authorization` o `Proxy-Authorization` con cualquier esquema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), secciones 11.6.2 y 11.7.2: el valor “consists of credentials”, consiste en credenciales), una línea `Cookie` o `Set-Cookie` con un valor ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), secciones 4.1.1 y 4.2.1), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sección 1), una contraseña en una URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sección 3.2.1: la forma “user:password” “is deprecated”, está obsoleta), un ID de clave de acceso de AWS o un valor `ENC` de FortiOS; todos consultados el 2026-11-01. Si aparece una de ellas, no hay enlace: la ventana emergente indica su línea, y tú la sustituyes por un marcador de posición y vuelves a presionar. Un valor cuyo nombre solo parece el de un secreto (un miembro `password` o `apiKey`) no bloquea el enlace; la ventana emergente indica el primero para que puedas revisarlo. Aquí cuentan como credenciales cinco nombres de miembro, porque un estándar define lo que contienen: `access_token` y `refresh_token` ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), secciones 1.4, 1.5 y 5.1: “Access tokens are credentials used to access protected resources”, los tokens de acceso son credenciales que se usan para acceder a recursos protegidos), `id_token` ([OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html), sección 3.1.3.3), `client_secret` ([RFC 7591](https://www.rfc-editor.org/rfc/rfc7591), sección 3.2.1) y `registration_access_token` ([RFC 7592](https://www.rfc-editor.org/rfc/rfc7592), sección 3); todos consultados el 2026-11-01. Con un valor, cualquiera de ellos significa que no hay enlace, como en el Decodificador de OIDC.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** El texto rellena el cuadro y las opciones quedan como las habrías elegido tú, y la página le da formato. Si una opción es desconocida, se ignora el enlace. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
