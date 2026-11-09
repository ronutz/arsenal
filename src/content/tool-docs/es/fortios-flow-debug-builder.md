## Qué hace

Rellena lo que quieres rastrear (una dirección y, si quieres, puertos, un protocolo y un número de paquetes) y la herramienta monta la secuencia completa de `diagnose debug flow` para un FortiGate: la vuelta a un estado limpio, el filtro, las opciones de visualización, el rastreo y la activación, seguidos de la limpieza. Cada línea se explica por separado. Genera texto y no contacta con nada.

En la mayor parte del formulario no hace falta escribir: los campos de puerto y el número de paquetes tienen flechas arriba y abajo a su lado, y debajo del campo de protocolo hay un botón por cada nombre de protocolo que la herramienta convierte en su número (`tcp`, `udp`, `icmp`, `icmpv6`, `gre`, `esp`, `ah`, `sctp`); al presionar el que está iluminado, el campo se vuelve a vaciar. Un número de protocolo, las direcciones y el VDOM sí se escriben.

## Por qué un generador y no una referencia

`diagnose debug flow` no es un comando, es una receta de cuatro o cinco comandos que solo funcionan juntos. El orden importa, la limpieza importa más, y todo ello se usa tan pocas veces que casi nadie lo recuerda con exactitud. Ese es justo el tipo de problema que resuelve un generador determinista.

## El orden en que lo genera, y por qué

La herramienta genera **primero el filtro y al final la activación**. La propia guía de administración de Fortinet muestra `diagnose debug enable` primero, antes del filtro, y **los dos órdenes funcionan**, así que la herramienta lo dice en sus notas en lugar de elegir uno en silencio. El motivo para preferir el filtro primero es práctico: en un firewall con mucho tráfico, activar la salida antes de definir el filtro rastrea todo hasta que el filtro entra en vigor.

## Tres cosas que siempre te dice

- **El número es de paquetes, no de segundos.** `trace start 100` son cien paquetes, y una interfaz con mucho tráfico puede agotarlos en menos de un segundo.
- **El tráfico descargado en hardware (offload) nunca llega a este código.** En plataformas con NP o SP, un filtro correcto puede no producir nada en absoluto mientras el tráfico fluye a la vista. Es el motivo más común de que un buen rastreo parezca roto.
- **Los números de línea de la salida no son estables entre versiones.** Busca por el nombre de la función.

## Qué no hace

No puede conocer tu plataforma, tu distribución de VDOM ni si tu sesión se está descargando en hardware, y no valida nada contra ningún dispositivo. Se niega a generar un rastreo sin filtro, porque un debug flow sin filtro en un firewall de producción es la forma más rápida de dejar una consola inutilizable.

## Compartir resultados

Debajo de los comandos, después de Copiar, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` el formulario como valores con nombre, siempre todos los campos: `addr`, `saddr`, `daddr`, `port`, `sport`, `dport`, `proto`, `vdom` y `count` tal como se escribieron (uno vacío se deja fuera), e `iprope` y `timestamp` como 1 o 0. El botón está deshabilitado hasta que se define un filtro, porque sin él la página no genera nada. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

El formulario no contiene ningún secreto (el generador da formato a un texto y no ejecuta nada), pero sus filtros nombran hosts, puertos y un dominio virtual de tu red, así que la ventana emergente añade una línea de precaución antes de que copies nada. Viajan todos los campos, no solo los que difieren de los valores predeterminados, para que un enlace antiguo conserve su significado si cambia un valor predeterminado.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** Los valores del enlace sustituyen todo el formulario (un campo de texto que el enlace no lleva se vacía) y la página genera los comandos; no se ejecuta nada. Si una opción tiene un valor distinto de 1 o 0, o si el enlace no tiene filtro, se ignora el enlace entero. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
