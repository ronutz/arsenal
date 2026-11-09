## Qué hace

Monta un comando `tcpdump` correcto para un F5 BIG-IP a partir de opciones estructuradas: la interfaz (con la sintaxis propia de BIG-IP), cuánto detalle de flujo de TMM incluir, la longitud de captura (snaplen), si se escribe un archivo de captura y un filtro BPF. La herramienta da formato al comando para que lo copies y lo ejecutes en el equipo; no captura nada por sí misma ni se conecta a ningún equipo.

## Por qué tcpdump es distinto en BIG-IP

En un BIG-IP, `tcpdump` se ejecuta sobre el Traffic Management Microkernel (TMM), y el argumento de interfaz es donde se aparta del tcpdump estándar. Hay dos piezas propias de BIG-IP que importan más que el resto:

- **La interfaz `0.0`** significa todas las interfaces de datos de TMM a la vez. Es muy útil para averiguar por dónde circula el tráfico (o por dónde no), pero no tiene limitación de tasa, así que un filtro es imprescindible para no desbordar la captura.
- **El sufijo de detalle `:n`** controla cuánta información interna de TMM lleva cada línea de paquete, y es la parte en la que más se equivoca la gente.

## El sufijo de detalle y el error que conviene evitar

Añadir un sufijo a la interfaz sube el nivel de “noise” (ruido):

- **`:n`** (bajo) añade el nombre del virtual server, la interfaz y el sentido.
- **`:nn`** (medio) añade detalles del flujo.
- **`:nnn`** (alto) añade la dirección IP y el puerto de los dos lados del BIG-IP, para que puedas seguir una única conexión a través del proxy.

Una **`p`** al final (como en `:nnnp`, o simplemente `:p`) captura a la vez los dos lados del proxy: el flujo del cliente al BIG-IP y el flujo del BIG-IP al miembro del pool. El error clásico es confundir este sufijo de interfaz `:n` con la opción `-n` de la línea de comandos, que hace algo completamente distinto (desactiva la resolución de nombres). Son cosas separadas, y la herramienta las modela por separado para que no las mezcles.

## Uso

Elige la interfaz y el nivel de detalle, define una longitud de captura y un archivo de salida si los quieres, añade un filtro BPF y copia el comando montado. Se construye con las opciones de la propia guía de F5 para trazar paquetes (K411 y K13637), así que es el comando que un BIG-IP acepta de verdad.

## Compartir resultados

Debajo del comando, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva el formulario después del `#` como valores con nombre: `iface`, `filter` y `file` tal como se escribieron (el archivo, solo cuando se escribe), y cada opción que difiera del valor predeterminado del formulario (`detail`, `both`, `names`, `snaplen` con `snapbytes`, `count`, `verbose`, `ether`, `hex`, `write`). El botón está desactivado mientras el formulario conserve los valores predeterminados sin tocar. Su ventana emergente dice primero qué lleva el enlace, y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

El formulario no contiene ningún secreto (el generador da formato a un comando y no ejecuta nada), pero la interfaz y el filtro pueden nombrar direcciones y VLAN internas, así que la ventana emergente añade una línea de precaución propia de esta herramienta antes de que copies nada. Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que el formulario no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** Los valores del enlace sustituyen todo el formulario: un campo de texto que el enlace no lleve se vacía, una opción que no lleve toma su valor predeterminado, y la página monta el comando. No se captura, ejecuta ni envía nada. Una opción que el formulario no ofrece, un valor de activación distinto de 1 o 0, o un número fuera de rango hacen que se ignore todo el enlace. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
