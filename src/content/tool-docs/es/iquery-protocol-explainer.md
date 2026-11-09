## Qué hace

Pega la salida del comando `iqdump` de F5, líneas de `/var/log/gtm` o el nombre de un tema, y la herramienta explica el protocolo iQuery de F5 sin tocar ningún dispositivo. iQuery es el protocolo propietario, basado en XML, que BIG-IP DNS (antes GTM) usa para hablar con el agente `big3d` del propio equipo y de todos los demás BIG-IP que conoce. La herramienta decodifica lo que pegas y explica la arquitectura que hay detrás. Es una herramienta que decodifica y explica, se ejecuta por completo en tu navegador y se basa en la propia documentación de BIG-IP DNS/GTM de F5.

## Cómo se decodifica la salida de iqdump

`iqdump` transmite en vivo los datos de iQuery entre dos sistemas para que puedas verificar la ruta y la autenticación SSL. Pega su salida y la herramienta lee las líneas de comentario del encabezado, el nombre de host local desde el que lo ejecutaste, el par `big3d` con el que se conectó y el puerto (4353), el grupo de sincronización al que se suscribió y la marca de tiempo, y después los campos del bloque (stanza) `<xml_connection>`, como `version`, la cadena de compilación de `big3d` y `connection_id`. Cada campo se explica, y una línea de par `big3d` presente se destaca como prueba de que la ruta TCP y la confianza SSL con ese agente funcionan, porque con una ruta rota `iqdump` devuelve un error.

## Cómo se decodifican las líneas de /var/log/gtm

El proceso `gtmd` registra el estado de la malla iQuery en `/var/log/gtm`. Pega esas líneas y la herramienta decodifica los mensajes de cambio de estado de los equipos, por ejemplo una transición `green --> red`, que significa que un BIG-IP dejó de estar disponible por iQuery, junto con las entradas `SNMP_TRAP` y los mensajes de conexión de `big3d` establecida o perdida. Una transición `green --> red` se señala con lo que hay que comprobar a continuación: la ruta iQuery (TCP 4353, confianza SSL) hacia ese equipo, y si su `big3d` se está ejecutando y tiene una versión compatible.

## Cómo se explica la arquitectura

Escribe un tema o haz clic en uno y la herramienta lo explica en los términos de F5: la malla iQuery de conexiones de larga duración, el puerto TCP 4353, la confianza basada en certificados SSL que establecen inicialmente `bigip_add`, `big3d_install` y `gtm_add`, el propio comando `iqdump`, lo que lleva iQuery (la disponibilidad de los objetos más las métricas de balanceo de carga que necesita el balanceo de carga global de servidores (GSLB, global server load balancing) dinámico), los agentes `gtmd` y `big3d`, y la regla de VLAN según la cual iQuery solo se envía por la VLAN por la que un sistema lo recibe.

## Compartir resultados

Al principio de la lectura, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` el cuadro tal como se escribió, y nada más. Su ventana emergente dice primero qué lleva el enlace y después da una precaución propia: la salida puede nombrar tus sistemas BIG-IP, tus self IPs y tus versiones, así que léela antes de enviar el enlace. Después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

El índice de temas no es un resultado: mientras se muestra (con el cuadro vacío, con `list` o con un texto que la herramienta no reconoce), el botón está desactivado. Ni la salida de `iqdump` ni estas líneas de log llevan credenciales: la confianza de iQuery son los certificados que intercambian los sistemas.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que el texto no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** El texto rellena el cuadro como lo haría un pegado y la página lo lee; no se envía nada a ninguna parte. Después, el valor sale de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.

## Alcance y fundamento

Explica y decodifica; nunca abre un socket, no ejecuta `iqdump` ni descarga nada, y la misma entrada produce siempre la misma salida. Lee la forma del texto de `iqdump` y de los logs, en lugar de validar un intercambio iQuery completo. Cada dato procede de los manuales de conceptos y de implementaciones de BIG-IP DNS/GTM de F5, de la guía de operaciones de LTM-DNS y de los artículos K sobre la confianza y la solución de problemas de iQuery; el ejemplo es una muestra real de `iqdump` publicada por F5. Ten en cuenta que el módulo Link Controller se eliminó en BIG-IP 21.0.0. Nada de lo que pegas sale de la página.
