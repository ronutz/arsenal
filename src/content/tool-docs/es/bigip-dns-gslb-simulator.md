## Qué hace

Modela el balanceo de carga global de servidores (GSLB, Global Server Load Balancing) de BIG-IP DNS (antes GTM), que funciona en dos niveles: una wide IP elige primero un pool y después el pool elige un virtual server. Configura tus pools (cada uno con un valor de ratio, una etiqueta de región, un estado up o down y un método de selección de miembros) y sus miembros, y después define el método de pool de la wide IP, una región del cliente y un número de solicitudes N. La herramienta calcula cómo se resuelven las próximas N solicitudes de resolución de nombres DNS: primero el reparto por pool y después el reparto por miembro dentro de cada pool.

## Qué simula y qué no

Es determinista en los dos niveles: Round Robin (circular y equilibrado), Ratio (ponderado, con reparto por mayor resto), Global Availability (todas las solicitudes al primer recurso disponible en el orden de la lista, y el resto como respaldo) y Topology (gana con la puntuación más alta el recurso cuya región coincide con la del cliente; los empates dentro de la puntuación ganadora se reparten en round robin). Un pool o un miembro en down no recibe nada, y el tráfico se redistribuye entre los que están up.

Los métodos dinámicos (Quality of Service, Completion Rate, Round Trip Time, Fewest Hops, Kilobytes/Second, Packet Rate, Virtual Server Score, Least Connections, CPU) dependen de métricas de rendimiento en vivo que los agentes big3d recogen de cada centro de datos. Eso no se puede reproducir sin conexión, así que la herramienta lo dice claramente en lugar de inventarse un reparto. Es la misma regla de honestidad que sigue el simulador de LTM con sus métodos dinámicos.

## Por qué importan los dos niveles

La confusión más habitual con GSLB es tratar la selección del pool y la selección del miembro como una sola decisión. Son decisiones separadas, y cada una puede usar un método distinto: una wide IP puede elegir pools por Topology (enviar los clientes europeos al pool de la UE) mientras cada pool elige un virtual server por Ratio (dar más peso al sitio más grande). La herramienta hace visible esa separación (ves qué pool respondió y después qué virtual server de ese pool resolvió), de modo que la interacción entre los dos niveles resulta concreta y no abstracta.

## Compartir resultados

Debajo del nivel de pools (o debajo de la explicación, para un método dinámico de la wide IP), **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` todo el formulario como valores con nombre: `method`, `region` (se omite si está vacío), `requests`, `pools` (una línea por pool: nombre, valor de ratio, región, up y método de miembros, separados por tabulaciones) y `members` (una línea por miembro: el número de su pool, nombre, valor de ratio, región y up). Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia. Los nombres y las regiones van tal como se escribieron, salvo que una tabulación pegada en uno de ellos viaja como un espacio.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que los valores no se envían al servidor cuando se abre el enlace; se quedan en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlos.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** Los valores del enlace sustituyen todo el formulario, incluido cualquier campo que el enlace no lleve, y la página los simula; no se envía nada a ninguna parte. Un valor que el formulario no admitiría (un método desconocido, un valor de ratio inferior a 1, una fila a la que le falta un campo) hace que el enlace esté mal formado, y se ignora entero. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
