## Qué hace

Esta herramienta es un selector guiado del algoritmo de balanceo de carga de un origin pool de F5 Distributed Cloud (XC). Responde tres preguntas (si las sesiones tienen que mantenerse en el mismo origen, qué identifica una sesión: la dirección IP de origen, una cookie, un encabezado personalizado o “varía según la ruta”, y si el origin pool es dinámico) y la herramienta recomienda uno de los algoritmos de XC, nombra su equivalente en BIG-IP, enumera las advertencias que se aplican a tus respuestas y te dice dónde configurarlo. Todo se ejecuta en tu navegador.

## El modelo de persistencia de XC, para quien viene de BIG-IP

Esta es la idea que la herramienta existe para transmitir. En BIG-IP, el método de balanceo de carga (Round Robin, Least Connections, etc.) y el perfil de persistencia (Source Address Affinity, Cookie) son dos opciones independientes del virtual server. XC los une. Los algoritmos de hash consistente (Source IP Stickiness, Cookie Based Stickiness y Ring Hash) no son solo métodos de reparto: cada uno es también, por definición, el método de persistencia. Al elegir uno, obtienes las dos cosas a la vez. Los algoritmos sin hash (Round Robin, Least Active Request, Random) no tienen ninguna persistencia. No hay un objeto de perfil de persistencia aparte que asociar.

## Los siete algoritmos

Round Robin envía las solicitudes a los orígenes por turnos. Least Active Request envía cada solicitud al origen con menos solicitudes en curso, lo que encaja con solicitudes de costo desigual o con conexiones de larga duración. Random elige un origen al azar y, estadísticamente, reparte por igual en pools grandes. Source IP Stickiness, Cookie Based Stickiness y Ring Hash forman la familia del hash consistente: calculan el hash de la dirección IP de origen, de una cookie o de una política de hash que tú defines (normalmente un encabezado con un ID de sesión), y mantienen a un cliente en el mismo origen. Load Balancer Override es la vía de escape: delega la elección en el balanceador de carga HTTP para que puedas definir la afinidad (stickiness) por ruta o por dominio.

## Por qué importan las advertencias

La recomendación vale lo que valga el encaje, así que la herramienta saca a la luz las trampas. Calcular el hash sobre la dirección IP de origen concentra en un solo origen a los clientes que comparten una dirección IP (detrás de un NAT o de un proxy), y la carga se desequilibra. La afinidad por cookie necesita un nombre, un TTL y un path, y solo se mantiene si el cliente devuelve la cookie. Un hash sobre un encabezado personalizado necesita un valor estable en cada sesión, no en cada solicitud. Y para un pool dinámico (pods de Kubernetes que escalan hacia arriba y hacia abajo), el hash consistente es la familia adecuada, porque reasigna el menor número de clientes cuando cambian los miembros.

## Compartir resultados

Debajo del nombre del algoritmo recomendado, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` tus respuestas, por sus identificadores: si necesitas persistencia; el reparto o la clave de sesión, lo que lea la recomendación; y si el pool es dinámico, una vez que lo hayas respondido. El cuestionario no tiene nada que escribir, así que no viaja nada que hayas escrito. El botón está disponible cuando la recomendación está completa. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** Las respuestas se marcan como si hubieras hecho clic en ellas, y aparece la recomendación. Un enlace con una respuesta desconocida, o con respuestas de las dos ramas, se ignora. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
