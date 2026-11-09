# Explicador de decisiones de reenvío de ZCC

Pega una postura de Zscaler Client Connector (el estado de red detectado, la acción de reenvío de ZIA, la versión de Z-Tunnel y, si quieres, la acción de ZPA) y lee, capa a capa, la columna vertebral de decisión documentada, exactamente como la describen la arquitectura de referencia y el portal de ayuda del fabricante.

## Por qué un explicador y no un simulador

Esta herramienta existe con la forma que fijó su cláusula de ratificación, y el motivo se explica aquí antes que nada. La verificación (2026-07-21, contra la arquitectura de referencia Secure Mobile Access with Zscaler Client Connector y help.zscaler.com) encontró la **columna vertebral** de la decisión documentada públicamente de principio a fin: cómo se determina el estado de red de confianza, qué hace cada una de las cuatro acciones de ZIA por estado, qué captura cada versión de Z-Tunnel, el failover automático de Z-Tunnel 2.0 a 1.0, el web-split híbrido y las dos acciones de ZPA. Esa columna vertebral es determinista, y esta herramienta la calcula.

Lo que **no** está publicado es un orden de precedencia único para la capa de bypass. Cada mecanismo está documentado por separado: Application Bypass, las Destination y Domain Exclusions e Inclusions, VPN Gateway Bypass (VPN: red privada virtual, virtual private network), el PAC del perfil de aplicación y el PAC del perfil de reenvío con su macro de bypass de Z-Tunnel 2.0. Pero cuando varios afectan al mismo flujo, Zscaler publica recetas, no una matriz de resolución de conflictos. Un simulador tendría que inventarse esa matriz. Esta herramienta se niega: presenta cada mecanismo documentado como un registro explicado y no arbitra nada. Es la misma regla de no inventar que siguen las demás herramientas del sitio.

## Gramática de la entrada

Un parámetro por línea, `key = value`. Las líneas que empiezan por `#` son comentarios.

- `network`: trusted | vpn | off-trusted (obligatorio)
- `zia-action`: tunnel | twlp | enforce-proxy | none (obligatorio)
- `tunnel`: zt2 | zt1 (solo con las acciones de túnel)
- `web-split`: on | off (el modo híbrido documentado de Z-Tunnel 2.0)
- `zpa-action`: tunnel | none (opcional)

## Qué obtienes

La columna vertebral se muestra como tarjetas por capas: el estado de la red con los criterios de detección documentados (DNS Server y Search Domains, recomendados como los más estáticos; la coincidencia ANY/ALL; la exclusividad de Pre-Defined Trusted Networks, y el modo de fallo documentado de la resolución dinámica); el significado documentado de la acción de ZIA; la semántica de Z-Tunnel para tu elección (el túnel de proxy de Z-Tunnel 1.0, solo web y por 80/443, frente a la captura DTLS/TLS de todos los puertos de Z-Tunnel 2.0, con el failover automático y, si está activado, el web-split híbrido), y la decisión de la capa de ZPA, de solo dos acciones y deliberadamente más pequeña. Debajo de la columna vertebral están el registro de bypass y las notas permanentes, entre ellas la propia tabla de recomendaciones de la arquitectura de referencia (Trusted = None, VPN = Tunnel with Local Proxy, Off-Trusted = Tunnel, Z-Tunnel 2.0) y las capas de fail-open y fail-close.

Todo se ejecuta en local, en tu navegador; nada de lo que pegas sale de la página.

## Compartir resultados

Al principio de la lectura, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` la configuración tal como la pegaste. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Cada parámetro es una de unas pocas opciones documentadas, sin direcciones, hosts, usuarios ni claves, así que la ventana emergente no añade ninguna línea de precaución propia. Antes de ofrecer un enlace, se busca en el cuadro una credencial definida por un estándar: una clave privada PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), sección 10), una línea `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sección 11.6.2), una línea `Cookie` con valor ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sección 4.2.1), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sección 1), una contraseña en una URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sección 3.2.1), un ID de clave de acceso de AWS o un valor `ENC` de FortiOS; todos consultados el 2026-11-01. La gramática no tiene sitio para ninguno de ellos, pero una línea de comentario es texto libre. Si aparece uno, no hay enlace: la ventana emergente indica su línea, y tú lo sustituyes por un marcador de posición y vuelves a presionar. Un valor cuyo nombre solo parece el de un secreto no impide el enlace; la ventana emergente indica el primero.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** El cuadro se rellena como lo haría un pegado y la página recorre la columna vertebral. No se contacta con nada. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.

## Fuentes

- [Arquitectura de referencia de Zscaler: Secure Mobile Access with Zscaler Client Connector](https://www.zscaler.com/resources/reference-architectures/secure-mobile-access-with-zcc.pdf) (los estados, las acciones, los criterios, la semántica de los túneles, el failover y la tabla de recomendaciones; consultado el 2026-11-09)
- [Ayuda de Zscaler: About Z-Tunnel 1.0 & Z-Tunnel 2.0](https://help.zscaler.com/zscaler-client-connector/about-z-tunnel-1.0-z-tunnel-2.0) (consultado el 2026-11-09)
- [Ayuda de Zscaler: Best Practices for Adding Bypasses for Z-Tunnel 2.0](https://help.zscaler.com/zscaler-client-connector/best-practices-adding-bypasses-z-tunnel-2.0) (el reparto del trabajo entre los dos PAC; consultado el 2026-11-09)
- [Ayuda de Zscaler: Configuring Forwarding Profiles for Zscaler Client Connector](https://help.zscaler.com/zscaler-client-connector/configuring-forwarding-profiles-zscaler-client-connector) (consultado el 2026-11-09)

La regla del fragmento en la que se apoya Compartir resultados es la del [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sección 3.5 (consultado el 2026-11-01), y las credenciales que busca su comprobación las definen el RFC 7468, el RFC 9110, el RFC 6265 y el RFC 7519 (consultados el mismo día).
