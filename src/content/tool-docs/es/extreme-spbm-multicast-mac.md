## Qué hace esta herramienta

Funciona en los dos sentidos. Dale el nickname de un nodo y un I-SID y construye la dirección de grupo que ese nodo usará para ese servicio. Pega una dirección sacada de `show isis spbm multicast-fib` y te dice a qué árbol pertenece la entrada y qué servicio lleva.

## La regla

Una dirección de grupo de SPBM no se configura ni se aprende. Se compone a partir de dos números que todo nodo ya tiene:

- **los tres primeros bytes**: el prefijo fijo `0x30000` combinado con el nickname de 20 bits
- **los tres últimos bytes**: el I-SID de 24 bits

Así, el nickname `0.00.10` con el I-SID 100 da `03:00:10:00:00:64`. Cada nodo del árbol de ruta más corta (shortest path tree) calcula esa misma dirección a partir de la base de datos de estado de enlace sin que nadie se la diga, y precisamente por eso SPBM no necesita aprender direcciones MAC de backbone.

El mismo I-SID con raíz en otro nodo produce otra dirección: un árbol por raíz.

## El sentido que de verdad sirve

Leer la FIB multicast. Es una columna de valores hexadecimales, y la pregunta es siempre la misma: de quién es este árbol y qué servicio lleva. Las dos respuestas están en la dirección. `03:00:41:00:04:4d` es el nickname `0.00.41` con el I-SID 1101. Busca el nickname en la columna SYSID o HOST-NAME de la misma salida para ponerle nombre al nodo.

## Una ambigüedad, declarada en lugar de oculta

Los bits 16 y 17 pertenecen al prefijo fijo. Un nickname cuyo primer campo los activa produce una dirección que no se puede decodificar de vuelta a un único nickname. Todos los ejemplos documentados usan un primer campo de 0. Si escribes otro valor, la herramienta construye la dirección y te avisa de que el sentido inverso no está verificado, en lugar de devolver un nickname que no puede respaldar.

## Límites, con franqueza

Solo calcula la dirección de grupo. La selección del B-VID, el propio árbol de ruta más corta, la adyacencia IS-IS y la dirección MAC de backbone unicast quedan fuera de su alcance; la B-MAC unicast es la dirección del chasis y no se deriva de nada. El I-SID se trata como un número; si un valor concreto es una VSN de capa 2 o una VSN de capa 3 es una cuestión de configuración que la herramienta no modela.

## Compartir resultados

Debajo de la dirección y su resumen, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` los campos de la tarea de la que salió la respuesta: el nickname y el I-SID tal como se escribieron (`nickname`, `isid`) para una dirección que construiste, o la dirección tal como se escribió (`input`) para una que desmontaste; un enlace nunca lleva las dos cosas. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que los campos no se envían al servidor cuando se abre el enlace; se quedan en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlos.

- **Al abrir un enlace.** Los campos de la tarea se rellenan y la página calcula, igual que al escribir; no se consulta nada. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
