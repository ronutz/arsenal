## Qué hace

Responde seis preguntas sobre una ubicación (el ancho de banda necesario, si hace falta alta disponibilidad, si la IP de salida es estática, si el tránsito tiene que ir cifrado, si el dispositivo de borde admite GRE y si hay NAT de origen en los endpoints internos del túnel) y la herramienta devuelve la recomendación de reenvío determinista: GRE o IPsec, la cifra de capacidad por túnel que se aplica y la regla documentada de la que sale, y el número mínimo de túneles principales y de respaldo que cubre el requisito. Cada paso de eliminación se muestra en orden, así que la respuesta enseña el razonamiento en lugar de sustituirlo. Con las mismas respuestas, siempre la misma recomendación; todo se ejecuta en tu navegador y no se contacta con nada.

## Las cifras publicadas con las que calcula

Todas las cifras de capacidad son de la propia Zscaler, verificadas en directo en su portal de ayuda el 21 de julio de 2026. Un túnel GRE lleva hasta 1 Gbps, salvo que las direcciones de los endpoints internos del túnel tengan NAT de origen; en ese caso, la cifra baja a 250 Mbps, porque el servicio balancea la carga del tráfico GRE según las direcciones internas y el NAT las reduce a una sola. Un túnel IPsec lleva hasta 400 Mbps por dirección IP pública de origen. Las formas de escalar reproducen los propios ejemplos resueltos de la documentación: 2 Gbps de GRE son dos túneles principales más dos de respaldo en IP públicas de origen distintas; 800 Mbps de IPsec son dos más dos, a los que se llega o bien con IP públicas de origen distintas, o bien con varios túneles sobre la misma IP usando NAT Traversal con aleatorización del puerto de origen con IKEv2.

## Cómo funciona la eliminación

Se prefiere GRE cuando se cumplen sus tres condiciones previas (una dirección pública de salida estática, un dispositivo compatible con GRE y ninguna obligación de cifrado), porque es la encapsulación más sencilla, se reenvía a velocidad de hardware y tiene el techo por túnel más alto. Si falla cualquiera de esas condiciones, la respuesta pasa a IPsec, que tolera direcciones dinámicas (peers identificados por su nombre de dominio completo, fully qualified domain name), cifra por construcción y solo pide que se configuren IKEv2 y Dead Peer Detection. El número de túneles es entonces la división del ancho de banda necesario entre la cifra por túnel aplicable, redondeada hacia arriba, y el número de túneles de respaldo replica el de principales cuando hace falta alta disponibilidad, cada uno apuntado a un Public Service Edge de un centro de datos distinto: la forma principal/secundario documentada. Cuando no se pide alta disponibilidad, la herramienta devuelve el mínimo real y dice claramente que el fabricante sigue recomendando un túnel secundario.

## Lo que no finge

Las cifras son una orientación del plano de reenvío para los túneles de ubicación, no promesas sobre ningún circuito concreto, y la herramienta dice qué regla documentada produjo cada número en lugar de inventarse precisión. Los usuarios en itinerancia quedan fuera del alcance, y es así a propósito: un equipo portátil fuera de la red reenvía a través del Z-Tunnel de Zscaler Client Connector, no a través de un túnel de ubicación, y esta herramienta declara ese límite en lugar de difuminarlo.

## Compartir resultados

Debajo de la tarjeta de recomendación, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva el formulario después del `#` como valores con nombre, siempre todos los campos: `mbps` tal como se escribió, y `ha`, `staticip`, `encryption`, `gre` y `nated` como 1 o 0. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Una cifra de ancho de banda y cinco respuestas de sí o no no identifican nada, así que la ventana emergente no añade nada a la advertencia estándar del sitio. Van todos los campos, no solo los que difieren de las respuestas iniciales, para que un enlace antiguo conserve su significado si estas cambian.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** Los valores del enlace sustituyen todo el formulario y la página vuelve a elegir (aritmética sobre cifras publicadas; no se contacta con nada). Un ancho de banda que la página rechaza, o una respuesta distinta de 1 o 0, hace que se ignore el enlace entero. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.

## Fuentes

Las cifras de GRE, la regla del NAT de origen y los ejemplos de escalado proceden de [Understanding Generic Routing Encapsulation (GRE)](https://help.zscaler.com/zia/understanding-generic-routing-encapsulation-gre). El límite de IPsec por IP de origen, sus dos formas de escalar y la recomendación principal/secundario proceden de [Configuring an IPSec VPN Tunnel](https://help.zscaler.com/zia/configuring-ipsec-vpn-tunnel) (VPN: red privada virtual, virtual private network). Las condiciones previas de GRE y la señal que da una IP dinámica hacia IPsec proceden de [Choosing Traffic Forwarding Methods](https://help.zscaler.com/zia/choosing-traffic-forwarding-methods), y la regla de que la MTU (unidad máxima de transmisión, maximum transmission unit) del túnel no supere ni la MTU del equipo ni la MTU de la ruta procede de [Determining Optimal MTU for GRE or IPSec Tunnels](https://help.zscaler.com/zia/determining-the-optimal-mtu-for-gre-or-ipsec-tunnels). Las cuatro, consultadas el 2026-11-09.

La regla del fragmento en la que se apoya Compartir resultados es la del [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sección 3.5 (consultado el 2026-11-01).
