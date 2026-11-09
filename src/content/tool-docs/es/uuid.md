## Qué hace

Genera UUID, o pega uno existente para inspeccionarlo. La generación produce un UUID versión 4 aleatorio o un UUID versión 7 ordenado por tiempo, con la fuente aleatoria segura del navegador (`crypto.getRandomValues`). La inspección acepta cualquier UUID e indica si es válido, qué versión y qué variante es y, en un valor versión 7, el momento de creación que lleva dentro. Todo se ejecuta en tu navegador.

## Qué es un UUID

Un UUID es un identificador de 128 bits, escrito como 32 dígitos hexadecimales con la conocida agrupación 8-4-4-4-12, por ejemplo, `f47ac10b-58cc-4372-a567-0e02b2c3d479`. Su objetivo es ser único sin una autoridad central que reparta números: cualquiera puede generar uno y confiar en que no colisionará con el de nadie más. Dos campos fijos codifican su estructura: un nibble de versión, que dice cómo se generó el UUID, y un campo de variante, que lo marca como UUID del RFC 4122/9562.

## Versión 4 y versión 7

- **La versión 4** es casi por completo aleatoria: 122 de sus 128 bits salen de la fuente aleatoria, y los otros 6 son los bits fijos de versión y de variante. Es la opción predeterminada adecuada cuando solo necesitas un identificador impredecible y resistente a colisiones, y no te importa el orden.
- **La versión 7** está ordenada por tiempo. Sus 48 bits más significativos son una marca de tiempo Unix en milisegundos, seguida de 74 bits aleatorios. Como la marca de tiempo va delante, los UUID versión 7 se ordenan por orden de creación, lo que los hace mucho mejores que los de versión 4 como claves primarias de una base de datos: las inserciones secuenciales mantienen compacto el índice en lugar de dispersar las escrituras por todo él.

La versión 7 es nueva en el RFC 9562, la especificación de 2024 que actualizó y dejó obsoleto el RFC 4122 original.

## Inspección de un UUID

Pega cualquier UUID y la herramienta lo analiza sin generar nada: confirma el formato, lee la versión y la variante en sus posiciones fijas y, en un UUID versión 7, decodifica la marca de tiempo de 48 bits que lleva dentro y la convierte en una fecha. Esa última parte es el truco útil: un identificador versión 7 lleva discretamente el momento en que se creó, así que puedes leer la hora de creación de un registro directamente en su clave.

## Uso

Genera un UUID v4 o v7 con un clic, o pega un UUID existente para leer su versión, su variante y, en los v7, su marca de tiempo. La generación usa la fuente aleatoria segura, así que los valores v4 son impredecibles; la inspección es un análisis puro y solo revela lo que codifica el propio UUID.

## Compartir resultados

Debajo de la lectura del cuadro de inspección, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` el valor de ese cuadro. Los UUID que generaste no van en el enlace: cada uno sale de la fuente aleatoria de tu navegador, y quien abre el enlace presiona Generar para obtener los suyos. Un UUID no nombra nada tuyo. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Al abrir un enlace.** El valor rellena el cuadro de inspección como lo haría un pegado y la página lo lee (un valor que no es un UUID muestra “No es un UUID válido”, como al escribirlo). Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
