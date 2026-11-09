## Qué hace

PingFederate permite escribir expresiones OGNL en las asignaciones de atributos y en los criterios de emisión, para los casos en que una asignación simple no basta. Esta herramienta lee una de esas expresiones y la explica construcción por construcción, y después señala lo que suele fallar en producción y no en las pruebas. Se ejecuta en tu navegador y nunca evalúa la expresión.

## Por qué importa el selector de contexto

Tanto una asignación de atributos como un criterio de emisión son expresiones, y se supone que devuelven cosas distintas. Una asignación produce el valor que después se envía en la aserción o en el token. Un criterio produce true o false, y la emisión solo sigue adelante cuando es true. Elegir el que no corresponde es un error de configuración habitual, y no falla de forma visible: un criterio que devuelve una cadena en lugar de un booleano se comportará de maneras que parecen un problema de autorización en un sitio completamente distinto. El selector existe para que la herramienta pueda decirte cuándo lo que has escrito no encaja con el lugar donde lo vas a poner.

## Qué explica

Las construcciones reconocidas son las que aparecen en asignaciones reales: leer un atributo por su nombre, comprobar si es nulo, convertir un valor en cadena, normalizar mayúsculas y minúsculas, las operaciones de cadena que quitan el dominio de un nombre de usuario o limpian los espacios en blanco que un directorio arrastra desde 2004, los condicionales que dan un valor predeterminado, los literales de mapa que traducen nombres de grupos del directorio a nombres de roles de la aplicación, y las proyecciones y selecciones que tratan atributos multivalor, como la pertenencia a grupos.

## Los diagnósticos, y por qué está cada uno

**Atributos leídos sin comprobar si son nulos.** Es la causa más habitual de que una expresión funcione en pruebas y falle en producción, y el motivo no tiene nada de vistoso: las cuentas que se usan para probar están más ordenadas que el directorio. Un atributo que siempre está en tu propia cuenta no siempre está en la de todo el mundo, ausente no es lo mismo que vacío, y se dan los dos casos. La herramienta nombra los atributos que ha visto leer para que decidas de cuáles estás realmente seguro.

**Llamadas a métodos estáticos de Java.** Construcciones como `@java.lang.String@format` están admitidas y a veces son exactamente lo que hace falta. También son la razón por la que crear expresiones es un rol administrativo aparte en el producto: la misma construcción que formatea una fecha puede llegar a mucho más que una fecha. Señalarla no es una sugerencia de quitarla; es una nota de que esta expresión hace algo que solo debería poder hacer el rol de expresiones.

**Un criterio sin nada que compare.** Si un criterio de emisión no contiene ninguna comparación, ninguna prueba de pertenencia ni ninguna coincidencia de patrón, es poco probable que devuelva un booleano, devuelva lo que devuelva.

**Una asignación que solo deja pasar un atributo.** Es legítimo, y normalmente se puede conseguir sin ninguna expresión. Conviene preferirlo cuando se pueda, porque una asignación simple la ve cualquier administrador, mientras que una expresión solo la puede editar el rol de expresiones, y quien tenga que depurarla algún día puede no tener ese rol.

**Expresiones que han crecido demasiado.** Las expresiones largas son difíciles de revisar, más difíciles de traspasar e invisibles para cualquiera que no tenga el rol de expresiones, lo que incluye a la mayoría de quienes acabarán siendo responsables de ellas.

## Por qué nunca evalúa

Un explicador de expresiones que las evaluara sería un servicio de ejecución de código, que es exactamente la propiedad que convierte la creación de expresiones en un privilegio restringido dentro del propio PingFederate. La herramienta analiza y describe. Si quieres saber qué devuelve una expresión para un usuario concreto, el lugar para averiguarlo es una conexión de prueba en un entorno que no sea de producción, no una página web.

## Compartir resultados

Al principio de la lectura, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` la expresión tal como se escribió y, cuando es un criterio de emisión, dónde se usa (la asignación de atributos es el valor predeterminado, así que no se incluye). Su ventana emergente dice primero qué lleva el enlace y después da una precaución propia: las expresiones nombran atributos reales y a veces grupos reales, así que léela antes de enviar el enlace. Luego ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Una expresión en la que la comprobación de secretos del sitio encuentra una credencial escrita de una forma que reconoce por su aspecto no tiene enlace, y la ventana emergente la indica junto con su línea: una clave privada PEM, un encabezado Authorization, un ID de clave de acceso de AWS, un JWT, una contraseña en una URL o un valor `ENC` de FortiOS. Sustitúyela por un marcador de posición y vuelve a presionar; esta página explica las mismas construcciones en los dos casos.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que los valores no se envían al servidor cuando se abre el enlace; se quedan en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlos.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** La expresión y su contexto rellenan la página, que la explica igual que si la hubieras pegado; como siempre, no se evalúa nada y no se envía nada. Un contexto que la página no ofrece, o una expresión que contiene una credencial, hace que se ignore el enlace entero. En cualquier caso, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
