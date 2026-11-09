## Qué hace esta herramienta

Pega una política de Access Control de Check Point escrita en una pequeña gramática didáctica (una o más declaraciones `layer`, sus reglas y una línea `test`) y el evaluador hace pasar la conexión por las capas delante de ti. Cada paso nombra la regla que coincidió, explica qué significó realmente esa coincidencia y señala los descartes que no registran nada. La salida es una traza y no un veredicto, porque el veredicto por sí solo no enseña nada: lo importante es ver cómo una capa acepta una conexión y la siguiente la descarta.

## La frase que viene a enseñar

**Las capas ordenadas son un AND, no un OR.** Accept en una capa significa que la conexión *pasa a la siguiente capa*; solo se permite cuando la acepta la última capa ordenada. Un drop en cualquier capa termina la evaluación de inmediato, así que un permiso en una capa temprana no puede rescatar el tráfico que rechaza una capa posterior: la excepción va en la capa que, de otro modo, lo denegaría. Es el comportamiento que con más seguridad entiende mal quien llega desde FortiGate, BIG-IP o una simple cadena de iptables, y es el motivo por el que la traza muestra “aceptada, pasa a la siguiente capa” en lugar de una marca de verificación.

## La gramática

Capas: `layer Network ordered` o `layer DMZ inline`. Reglas: `1 | permit internal | accept | src=10.0.0.0/8 dst=any svc=443`, con las acciones `accept`, `drop` o `inline:<layer>` para dar paso a una subpolítica. Añade `nolog` para modelar una regla con Track en None. Todo lo que se omite significa Any. Una línea `test src=... dst=... svc=...` aporta la conexión. Las líneas que empiezan por `#` son comentarios.

## Qué más informa

Además de la traza, el evaluador examina la propia política: la falta de una regla de limpieza (cleanup rule) explícita, una regla de limpieza sin registro (lo que anula su único propósito), reglas con Track en None y el sombreado (shadowing) por pares, es decir, una regla que nunca puede dispararse porque otra anterior ya coincide con todo lo que coincidiría ella.

La advertencia de descarte silencioso merece mención aparte. Cuando no coincide nada, la regla de limpieza implícita descarta la conexión y no registra absolutamente nada. Es el dato más caro de una base de reglas de Check Point para quien está solucionando problemas, porque el síntoma es una conexión que falla sin ninguna entrada del log que lo explique, y parece una avería de la red en lugar de una decisión de la política.

## Límites, sin rodeos

Los **nombres** de servicio no se resuelven: `443` es un número de puerto, no `https`. Asignar nombres a puertos sería suponer el contenido de la base de datos de objetos de otra persona. El análisis de sombreado es **por pares**, así que no se señala una regla que cubren entre varias reglas anteriores pero ninguna por sí sola. Solo IPv4. La gramática es un subconjunto didáctico intencionado (las reglas reales añaden VPN (red privada virtual, virtual private network), contenido, horario, install-on y negación), pero la semántica de capas que se enseña aquí se aplica a todas ellas de forma idéntica.

## Compartir resultados

Debajo del veredicto y de la conexión que juzgó, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` la política tal como la pegaste. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Los nombres de las reglas, las subredes y la conexión de prueba describen tu red (por eso la ventana emergente añade una línea de precaución). Antes de ofrecer un enlace, se busca en el cuadro una credencial definida por un estándar: una clave privada PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), sección 10), una línea `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sección 11.6.2), una línea `Cookie` con valor ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sección 4.2.1), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sección 1), una contraseña en una URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sección 3.2.1), un ID de clave de acceso de AWS o un valor `ENC` de FortiOS; todos consultados el 2026-11-01. La gramática no tiene sitio para ninguno de ellos, pero los nombres de regla y las líneas de comentario son texto libre. Si aparece uno, no hay enlace: la ventana emergente indica su línea, y tú lo sustituyes por un marcador de posición y vuelves a presionar. Un valor cuyo nombre solo parece el de un secreto no impide el enlace; la ventana emergente indica el primero.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** El cuadro se rellena como lo haría un pegado y la página evalúa las capas. No se contacta con nada. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
