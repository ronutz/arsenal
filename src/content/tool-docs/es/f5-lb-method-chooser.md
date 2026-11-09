## Qué hace

Pega un bloque (stanza) ltm pool y la herramienta explica su método de balanceo de carga con los términos del propio F5: qué pondera el método, cómo se comporta, cuándo dice el fabricante que conviene elegirlo y los puntos delicados que hay que vigilar. Después contrasta el método con el resto del pool y señala las combinaciones que funcionan mal sin avisar, como pesos de ratio bajo un modo que los ignora o un modo ponderado al que le faltan los límites de conexiones que necesita. También puedes escribir un solo nombre de método para ver su explicación completa, la palabra “methods” para el catálogo completo, o responder dos preguntas en el panel de selección para obtener una recomendación con fuentes. Todo se ejecuta en tu navegador y no se conecta a ningún equipo.

## Estáticos y dinámicos, de miembro y de nodo

Los 19 modos documentados se dividen según dos ejes. Los modos estáticos, Round Robin y Ratio, deciden solo a partir de la configuración y nunca perciben el estado real de los servidores. Los modos dinámicos reaccionan a algo medido: conexiones abiertas, sesiones, velocidad de respuesta o métricas de servidor que alimentan los monitores. El segundo eje es el sufijo de ámbito. Un modo de miembro cuenta el trabajo de un servidor solo dentro de este pool; un modo de nodo lo cuenta en todos los pools a los que pertenece el servidor, que es el recuento justo cuando las mismas máquinas atienden varios pools.

## Qué pondera cada familia

Round Robin no pondera nada más que a quién le toca, y es el predeterminado. Ratio sigue una proporción que declaras tú. Least Connections elige a quien tenga menos conexiones abiertas en ese preciso momento, lo que absorbe las diferencias de duración de las conexiones. Observed suaviza ese recuento instantáneo y lo convierte en una ratio por segundo, y Predictive añade la tendencia y prefiere los miembros que van a mejor. Weighted Least Connections lee el connection-limit de cada miembro como su capacidad y reparte según el porcentaje que se usa de ella. Ratio Least Connections combina la ratio que declaras con el recuento en vivo. Dynamic Ratio te quita por completo la proporción de las manos y la recalcula continuamente a partir de mediciones de los servidores. Least Sessions y Ratio (session) cuentan sesiones de persistencia en lugar de conexiones, y Fastest sigue la velocidad de respuesta, medida como solicitudes de capa 7 pendientes.

## Las comprobaciones cruzadas

Las observaciones son lecturas deterministas de la configuración pegada frente a reglas documentadas. Las ratios de miembro bajo un modo que no es de ratio se señalan porque, según el K6406, las ratios solo se aplican con un método de ratio. Weighted Least Connections (member) con algún miembro que conserva el connection-limit predeterminado de 0 se señala porque la referencia exige un límite en cada miembro. Un pool de least connections recibe la nota sobre slow ramp, ya que la referencia destaca esa combinación y la rampa predeterminada es de 10 segundos. Least Sessions muestra su requisito previo en el virtual server: un perfil de persistencia que lleve el control de las sesiones. ignore-persisted-weight se explica cuando se aplica y se señala cuando el modo queda fuera de su ámbito documentado. Los grupos de prioridad se leen junto con min-active-members, el ajuste que de verdad pone en marcha la activación por grupos de prioridad.

## El selector

Dos preguntas alimentan una tabla de decisión fija: en qué se diferencian las capacidades de los miembros (iguales, declaradas como ratio, cuantificadas como límites de conexiones o que se midan en tu lugar) y a qué debe reaccionar el método (a nada, a las conexiones en vivo, a la tendencia, a las sesiones o a la velocidad de respuesta). Mismas respuestas, misma recomendación, siempre, con el razonamiento y los requisitos previos indicados. La tabla codifica la propia guía del fabricante del K42275060, no opiniones.

## Compartir resultados

La página tiene dos puntos de entrada, así que **Compartir resultados** tiene dos botones, y cada uno genera un enlace a esta página, solo cuando lo presionas, que lleva una parte después del `#`. Cada ventana emergente dice primero qué lleva su enlace, y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

- **Al principio de la respuesta del cuadro**: el cuadro tal como se escribió (`#input=`), un pool, un nombre de método, `methods` o una línea `choose`. Los nombres de pool y de miembro pueden identificar tus servidores, así que la ventana emergente añade una línea de precaución antes de que copies nada. Un pool no contiene ningún ajuste secreto ([referencia de tmsh de F5, ltm pool](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_pool.html), consultada el 2026-10-27).
- **Debajo de la recomendación de Ayúdame a elegir**: tus dos respuestas por sus identificadores, `capacity` (`equal`, `ratio`, `connlimit`, `measured`) y `react` (`none`, `connections`, `trend`, `sessions`, `response`), solo cuando las dos están elegidas.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que lleva no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** Se rellena lo que lleva el enlace: el cuadro, como lo haría un pegado, y las dos listas, como si las eligieras; lo que no lleva conserva su valor. Una respuesta que las listas no ofrecen, o una respuesta sin la otra, hace que se ignore todo el enlace. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.

## Fuentes

Los 19 tokens, sus descripciones y las opciones del pool proceden de la referencia de tmsh de ltm pool. La guía sobre cuándo usar cada método y el requisito previo de least sessions proceden del K42275060. La mecánica de los modos dinámicos, la exclusión de OneConnect y la regla de que las ratios necesitan un método de ratio proceden del K6406.

- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultado el 2026-10-27): sección 3.5, el fragmento, que lleva los valores de un enlace de Compartir resultados
