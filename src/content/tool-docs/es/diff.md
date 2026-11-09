## Qué hace

Compara dos bloques de texto y ve exactamente qué cambió: una vista línea a línea de lo añadido y lo eliminado, con resaltado por palabras dentro de las líneas editadas para que localices el cambio concreto. Si quieres, puedes ignorar los espacios en blanco o las mayúsculas y minúsculas. Todo se calcula en tu navegador; tu texto nunca se envía a ningún sitio.

## Cómo se calcula un diff

Un buen diff no es una comparación ingenua línea a línea: busca el conjunto más pequeño de cambios que convierte el primer texto en el segundo. La herramienta lo consigue calculando la **subsecuencia común más larga** (LCS, longest common subsequence) de los dos textos: la secuencia más larga de tokens que aparece, en orden, en los dos. Lo que está en esa subsecuencia común no cambió; todo lo que está en el primer texto pero no en la LCS es una **eliminación**, y todo lo que está en el segundo texto pero no en la LCS es una **inserción**. Esa es la idea central del clásico algoritmo de diff de Myers, y produce una secuencia de edición mínima (edit script): el menor número de adiciones y eliminaciones que explica la diferencia.

## Dos niveles: líneas y palabras

La misma operación LCS se ejecuta con dos granularidades. En la vista principal, los tokens son líneas completas, lo que da la conocida lista de líneas añadidas y quitadas. Para una línea que cambió, en lugar de añadirse o quitarse por completo, la herramienta vuelve a calcular el diff con palabras, espacios y signos de puntuación como tokens, y resalta solo las partes de la línea que realmente difieren. Ese resaltado dentro de la línea es lo que convierte “esta línea cambió” en “esta palabra cambió”.

## Determinismo

Cuando dos secuencias de edición distintas son igual de cortas, un diff tiene que elegir una, y la herramienta elige siempre de la misma forma (prefiere una eliminación cuando las dos direcciones son igual de buenas). Ese desempate fijo hace que la salida sea determinista: las mismas dos entradas producen siempre el mismo diff, sin depender del momento ni de nada externo.

## Uso

Pega el texto original en un lado y el texto modificado en el otro, y lee las diferencias línea a línea con el resaltado por palabras. Activa las opciones de ignorar espacios en blanco o mayúsculas y minúsculas cuando te importe el contenido y no el formato.

## Compartir resultados

Debajo del encabezado del resultado (o debajo de “No se encontraron diferencias”, que también es una lectura), **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` los dos textos tal como se pegaron, Original y Modificado, y las dos opciones. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia. Los textos comparados pueden ser privados, así que la ventana emergente te pide que leas los dos antes de enviar el enlace. Los textos van tal como se pegaron: un valor sustituido en los dos cuadros podría ocultar justo el cambio que quieres mostrar. Antes de ofrecer un enlace, se busca en el texto una credencial definida por un estándar: una clave privada PEM, una línea `Authorization` o `Proxy-Authorization` con cualquier esquema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), secciones 11.6.2 y 11.7.2: el valor “consists of credentials”, consiste en credenciales), una línea `Cookie` o `Set-Cookie` con valor ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), secciones 4.1.1 y 4.2.1), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sección 1), una contraseña en una URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sección 3.2.1: la forma “user:password” “is deprecated”, está en desuso), un ID de clave de acceso de AWS o un valor `ENC` de FortiOS; todos consultados el 2026-11-01. Si aparece uno, no hay enlace: la ventana emergente indica el cuadro y la línea, y tú lo sustituyes por un marcador de posición y vuelves a presionar. Un valor cuyo nombre solo parece el de un secreto (`db_password = ...`, un `token=` en una URL) no bloquea el enlace; la ventana emergente indica el primero para que puedas revisarlo.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** Los dos cuadros y las dos opciones quedan como los dejarías tú, y la página compara. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
