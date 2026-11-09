## Qué hace

Pega la sección F5 Ethernet Trailer tal como la muestra Wireshark, o los bytes del trailer en bruto en hexadecimal, y la herramienta explica cada campo: el sentido, el slot y el TMM, el virtual server, los identificadores de flujo y de par, y la causa del RST que da el propio equipo. En local y sin conexión; analiza el texto que pegas y no se conecta a nada.

## Por qué vale la pena leer el trailer

Ejecuta tcpdump **en** un BIG-IP con los flags de ruido (`:n` bajo, `:nn` medio, `:nnn` alto, con `-s0`) y cada trama lleva el relato que hace el propio equipo de ese paquete. La **causa del RST** es el campo que justifica el ejercicio: una captura sin ella muestra que una conexión murió; con ella, el equipo te dice que fue él quien cortó la conexión y por qué.

## De qué te avisa

**Los ID de flujo solo son únicos dentro de una combinación de slot y TMM, y se reutilizan.** El mismo ID puede aparecer en paquetes sin relación entre sí, antes o después, dentro de una misma captura. La herramienta lo dice en cada decodificación, porque un ID de flujo que se toma por único a escala global lleva a sacar, con total confianza, una conclusión equivocada.

También te remite a `f5ethtrailer.anyflowid`, que coincide con el ID tanto si es de flujo como de par y, por tanto, devuelve **los dos lados** de la conexión; filtrar solo por `flowid` devuelve la mitad de lo que querías.

## *** La sección que se niega a decodificar ***

A partir de **BIG-IP v15**, el trailer puede llevar una **sección de proveedor TLS con secretos de sesión**. Wireshark los convertirá en entradas de keylog y descifrará la captura.

**Esta herramienta detecta esa sección, te dice que está ahí y no decodifica nada de ella.** Un vector de referencia comprueba que ningún secreto aparezca nunca en ninguna parte de la salida.

El motivo es lo que conviene saber: **una captura tomada con ruido alto en un equipo con v15 o posterior puede contener las claves de sus propias sesiones TLS.** F5 documenta que el trailer nunca sale del equipo por el cable, lo cual es cierto, y se refiere al cable. El archivo es otra cuestión, y enviarlo a un ticket o a un compañero envía las claves con él.

## Qué no hace

No lee archivos pcap y no puede ver tu captura. Cuando una causa de RST no está en su tabla, lo dice en lugar de inventarse una explicación.

## Compartir resultados

Debajo del resumen, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` el texto del trailer tal como se pegó, pero nunca lo que esta página se niega a decodificar. Su ventana emergente dice primero qué lleva el enlace, y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

- **Secretos TLS: no hay enlace.** Cuando la página encuentra una sección de proveedor TLS, o el texto nombra un secreto o una línea de keylog, no hay ningún enlace, y la ventana emergente explica por qué. La propia lista de campos de Wireshark para el trailer ([referencia de filtros de visualización de f5ethtrailer](https://www.wireshark.org/docs/dfref/f/f5ethtrailer.html), consultada el 2026-10-27) incluye `f5ethtrailer.tls.master_secret`, los secretos de tráfico del cliente y del servidor y `f5ethtrailer.tls.keylog`: las claves de las propias sesiones TLS de la captura. Dejarlos fuera cambiaría lo que esta página dice sobre el trailer, así que, en su lugar, no se envía nada.
- **Bytes: solo el encabezado.** Los bytes pegados solo van cuando son únicamente el encabezado del trailer (el número mágico, la longitud y la versión, 8 bytes en la lista de campos de Wireshark). Cualquier otra cosa, antes o después de él, pueden ser datos del propio paquete o secciones de proveedor del trailer, secretos TLS incluidos, que esta página nunca lee: no hay enlace, y la ventana emergente sugiere compartir en su lugar la vista de texto de Wireshark.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que el texto no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** El texto rellena el cuadro como lo haría un pegado y la página lo decodifica. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
