# Explicador del flujo de decisión de GSLB

Pega bloques (stanzas) `gtm wideip` y `gtm pool` (tal como los imprimen `tmsh list gtm wideip a <name>` y `tmsh list gtm pool a <name>`) y verás la decisión en dos niveles del balanceo de carga global de servidores (GSLB, global server load balancing) de BIG-IP DNS (antes GTM, Global Traffic Manager) tal como se ejecuta en realidad.

El nivel de wide IP muestra el método de selección de pool (`pool-lb-mode`, round-robin de forma predeterminada) con los pools asociados, su orden y sus valores de ratio, y los ajustes de la wide IP que dan forma a las respuestas: la persistencia, el last-resort-pool, el comportamiento de failure-rcode y el control del nivel de detalle del log de decisiones, que te permite ver este mismo flujo en los logs.

El nivel de pool muestra la cadena de tres pasos: preferido (`load-balancing-mode`), alternativo (`alternate-mode`) y de reserva (`fallback-mode`), y cada paso lleva la semántica que da el fabricante para el nivel y para el método. Cuando falta un atributo, se aplican los valores predeterminados y se indican como tales: round-robin, round-robin, return-to-dns.

Debajo, observaciones deterministas contrastan la configuración con la gramática documentada y con las reglas del manual de Load Balancing: métodos que no están en la lista de tokens admitidos en un nivel, la propiedad del nivel de reserva de ignorar la disponibilidad, indicada en cada cadena resuelta, la configuración de Fallback IP (el método sin dirección, o una dirección que ningún nivel usa), el conjunto de casos en los que se aplica dynamic-ratio, los coeficientes de QoS a cero, las ratios de miembros que ningún nivel consume, la regla de emparejamiento de Global Availability y la advertencia sobre topology en los dos niveles, que pide que el fallback de cada pool sea None.

Un solo nombre de método explica ese método, incluidos los niveles que lo admiten y de dónde procede su señal de decisión (sondeo de la ruta al LDNS, estadísticas del lado del servidor o ninguna). La palabra `methods` enumera los dos catálogos.

Todo se ejecuta en local; nada de lo que pegas sale de la página.

## Compartir resultados

Al principio de la lectura, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` el cuadro tal como se escribió, y nada más. Su ventana emergente dice primero qué lleva el enlace y después da una precaución propia: los nombres de las wide IP y de los pools identifican tu infraestructura, así que lee lo pegado antes de enviar el enlace. Después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Esta página se salta cada bloque que no explica, así que un archivo de configuración entero sigue recibiendo una lectura, y un enlace con él llevaría todo lo que contiene. Por eso, mientras lo pegado contenga un ajuste secreto, no hay enlace, y la ventana emergente nombra el ajuste: un atributo de tmsh llamado `password`, `passphrase` o `secret`, o cuyo nombre termine en ellos (`encrypted-password`, `proxy-ca-passphrase`, `shared-secret`), `bind-pw` o `community-name`, seguido de un valor distinto de `none`; o un encabezado `Authorization` en cualquier parte, como en la cadena `send` de un monitor. La [referencia de tmsh para gtm monitor http](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/gtm/gtm_monitor_http.html) de F5 (consultada el 2026-10-27) incluye `password` junto a `send`, y el [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) (sección 11.6.2, consultado el 2026-10-27) define el valor de Authorization como credenciales. Quita esa línea y vuelve a presionar: esta página nunca muestra esos valores, así que el resto se lee igual.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que el texto no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** El texto rellena el cuadro como lo haría un pegado y la página lo lee; no se envía nada a ninguna parte. Después, el valor sale de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
