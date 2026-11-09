## Qué hace

Pega una firma SYN de p0f v3 en la gramática canónica (ver:ittl:olen:mss:wsize,scale:olayout:quirks:pclass) y la herramienta decodifica los ocho campos, explica el razonamiento sobre el TTL inicial y la ventana, da nombre a cada opción TCP y a cada token de peculiaridad (quirk) y compara la forma de los campos con las firmas de referencia de sistemas operativos que documenta p0f. Acepta tanto una firma suelta como la forma “label = sig”.

## Por qué es pasivo

p0f obtiene huellas observando paquetes que un host ya envió (el SYN de una conexión normal) y nunca envía un sondeo propio. Eso es lo que significa aquí “pasivo”, y por eso la técnica es invisible para el objetivo. Esta herramienta lo lleva un paso más allá, hacia la pura enseñanza: pegas una firma que ya tienes, y no se lee nada de tu propio equipo ni se envía nada a ninguna parte.

## La señal del proxy

La lectura más útil de todas es el TTL inicial. Como cada router reduce el TTL, un valor cercano a 64 apunta a Linux/BSD/Darwin, uno cercano a 128 a Windows y uno cercano a 255 a equipos de red. Cuando ese TTL de la pila contradice el sistema operativo que declara un User-Agent, es casi seguro que estás ante un proxy o un NAT: el paquete lleva la pila del intermediario, no la del cliente. La disposición de las opciones y las peculiaridades afinan la suposición; la herramienta muestra lo que aporta cada una.

## Compartir resultados

Debajo del indicio de sistema operativo, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` la firma tal como se escribió (`input`), y nada más. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Una firma de p0f describe cómo construye un host un SYN TCP (TTL, opciones, ventana, peculiaridades); no nombra ningún host ni a ninguna persona.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que la firma no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Al abrir un enlace.** La firma rellena el cuadro como lo haría un pegado y la página la decodifica; no se envía nada. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
