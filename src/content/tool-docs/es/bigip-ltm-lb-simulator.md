## Qué hace

Esta herramienta simula cómo reparte el tráfico un pool de BIG-IP LTM. Configuras los miembros del pool (cada uno con un valor de ratio de miembro, un nodo con su valor de ratio de nodo, un grupo de prioridad y un número de registros de persistencia existentes), eliges un método de balanceo de carga y un número de solicitudes N, y te muestra dónde caen las próximas N conexiones, como reparto por miembro. Se ejecuta por completo en tu navegador y es determinista: las mismas entradas producen siempre la misma respuesta.

## Los métodos que simula

Simula los métodos estáticos y los basados en conexiones o en sesiones, porque su resultado lo determinan la configuración y la carga que tú indicas. Round Robin envía cada solicitud al siguiente miembro por turno. Ratio (member) reparte en proporción al valor de ratio de cada miembro; Ratio (node) hace lo mismo por nodo y divide la parte de cada nodo entre sus miembros. Least Connections (member y node) envía cada conexión nueva al miembro menos cargado; Weighted Least Connections pondera eso según el valor de ratio. Least Sessions envía al miembro con menos registros de persistencia, que es exactamente el número de registros de persistencia que introduces para cada miembro.

## Grupos de prioridad

La activación de grupos de prioridad (Priority Group Activation) decide qué miembros pueden recibir tráfico. Cada miembro tiene una prioridad; el tráfico va primero al grupo de prioridad más alta, y un grupo inferior solo se activa cuando el número de miembros disponibles en el conjunto activo baja del umbral que defines (0 desactiva la función). La herramienta lo aplica y marca cada miembro como activo o en espera (standby), así que puedes ver un grupo inferior inactivo hasta que el superior se queda corto.

## Qué no simula y por qué

Fastest, Observed, Predictive y Dynamic Ratio son métodos dinámicos que deciden según métricas en vivo: tiempo de respuesta, número de conexiones por segundo, tendencias de rendimiento, datos SNMP. Esos valores no forman parte de la configuración de un pool y cambian continuamente, así que no hay una forma honesta de calcular para ellos un reparto fijo a partir de datos estáticos. La herramienta los ofrece en la lista, pero, cuando eliges uno, explica por qué no puede simularlo en lugar de inventarse números. Dos notas más de honestidad: Least Connections se modela a partir de una tabla de conexiones vacía, porque la herramienta no recibe el número de conexiones actuales, así que empieza equilibrado; y Least Sessions supone persistencia por dirección de origen o por sesión, ya que con la persistencia basada en cookies BIG-IP vuelve a Round Robin.

## Compartir resultados

Al final de la respuesta, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` todo el formulario como valores con nombre: `members` (una línea por miembro, con su nombre, nodo, valor de ratio, valor de ratio del nodo, grupo de prioridad y registros de persistencia separados por tabulaciones), `method`, `threshold` (la activación de grupos de prioridad) y `requests`. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia. Los nombres y los nodos van tal como se escribieron, salvo que una tabulación pegada en uno de ellos viaja como un espacio.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que los valores no se envían al servidor cuando se abre el enlace; se quedan en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlos.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** Los valores del enlace sustituyen todo el formulario, incluido cualquier campo que el enlace no lleve, y la página los simula; no se envía nada a ninguna parte. Un valor que el formulario no admitiría (un método desconocido, un valor de ratio inferior a 1, una fila a la que le falta un campo) hace que el enlace esté mal formado, y se ignora entero. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
