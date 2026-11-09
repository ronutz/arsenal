# Explicador de decisiones de direccionamiento de Netskope

Pega una descripción compacta de una configuración de direccionamiento (steering) y de un flujo, y recorre el orden de decisión documentado hasta un veredicto (**DIRECCIONADO**, **EN BYPASS**, **BLOQUEADO** o **DIRECTO**), con un registro de decisiones que explica cada comprobación del camino. Es un explicador del porqué, no un simulador: cada paso del registro cita un comportamiento documentado y, donde la documentación pública no publica ninguna regla, el registro lo dice en lugar de inventarse una.

## La gramática

Líneas clave-valor, un dato de la decisión por línea:

```
mode: web                     # cloud-apps | web | all
dynamic: on                   # optional; then mode-on-prem / mode-off-prem (none allowed)
location: off-prem            # on-prem | off-prem
tunnel: up                    # up | down
fail-close: off               # on | off
flow: web app.example.com     # web <host> | app <name> | non-web <proto/port> | rfc1918 <ip> | loopback
non-standard-port: ip         # optional; fqdn | ip - how a non-standard web port is reached
exception: domain *.example.com          # 0+ lines; kinds: cert-pinned, domain, category, dest-location, firewall-app
flow-matches: domain          # which configured exception kinds this flow matches (or none)
```

La línea `flow-matches` es honestidad deliberada: que un flujo real coincida con una categoría o con un objeto de ubicación de destino depende de datos del tenant que esta herramienta local no puede ver, así que tú declaras la coincidencia y el motor explica la consecuencia documentada.

## Lo que sabe el registro

Los tres modos de tráfico y para quién es cada uno (Cloud Apps Only para Cloud Inline o solo CASB, Web Traffic para la mayoría de las organizaciones, All Traffic para quienes tienen la suscripción a Cloud Firewall). El bypass predeterminado, siempre activo, del espacio RFC1918. Las familias de excepciones y sus comportamientos documentados, incluida la opción por perfil **Steer and decrypt at Netskope Cloud** de la familia de certificate pinning, la única coincidencia que direcciona en lugar de dejar en bypass. Los modos por ubicación del direccionamiento dinámico, incluido **None**: sin túnel y sin procesar las excepciones. El reparto documentado de **Fail Close**: las excepciones basadas en dominios, en direcciones IP y en certificate pinning se siguen aplicando, mientras que las basadas en categorías se bloquean. Y la trampa del puerto no estándar: a un puerto configurado por FQDN al que se accede por dirección IP se le trata como tráfico no web, con la solución documentada de configurar los dos.

## Qué viene después

Un veredicto **DIRECCIONADO** es donde empieza la siguiente decisión: si la sesión se descifra o no le corresponde a la política de TLS, y [el artículo sobre el descifrado TLS en línea](/learn/netskope-inline-tls-decryption) sigue justo desde ahí. El panorama del direccionamiento en sí (Client, proxy explícito y PAC, túneles, proxy inverso) es [el artículo sobre los métodos de direccionamiento](/learn/netskope-steering-methods); la capa PAC tiene [su propio explicador](/tools/pac-file-explainer).

## Compartir resultados

Debajo del veredicto, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` la especificación tal como la escribiste, una vez que la página tiene una decisión. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia. Un flujo y sus excepciones nombran hosts, aplicaciones y dominios, y la página [steering profile](https://docs.netskope.com/en/configure-a-steering-profile) de Netskope (consultada el 2026-11-01) tiene excepciones para el tráfico con “personal or private content” (contenido personal o privado): la ventana emergente te pide que las compruebes. El registro lee cada línea, así que no se recorta nada. Antes de ofrecer un enlace, se busca en la especificación una credencial definida por un estándar: una clave privada PEM, una línea `Authorization` o `Proxy-Authorization` con cualquier esquema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), secciones 11.6.2 y 11.7.2: el valor “consists of credentials”, consiste en credenciales), una línea `Cookie` o `Set-Cookie` con valor ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sección 8.4: los servidores “commonly store a nonce (or ‘session identifier’) in a cookie”, suelen guardar en una cookie un nonce o identificador de sesión), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sección 1), una contraseña en una URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), sección 3.2.1), un ID de clave de acceso de AWS o un valor `ENC` de FortiOS; todos consultados el 2026-11-01. Si aparece uno, no hay enlace: la ventana emergente indica su línea, y tú lo sustituyes por un marcador de posición y vuelves a presionar. Un valor cuyo nombre solo parece el de un secreto (un miembro JSON `token`, un `token=` en una cadena de consulta) no bloquea el enlace; la ventana emergente indica el primero para que puedas revisarlo.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** La especificación rellena el cuadro como lo haría un pegado, y la página la explica. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.

## Fuentes

- [Documentación de Netskope: Configure a Steering Profile](https://docs.netskope.com/en/configure-a-steering-profile) (modos, bypass predeterminados; consultado el 2026-11-09)
- [Documentación de Netskope: Creating a Steering Configuration](https://docs.netskope.com/en/creating-a-steering-configuration) (Fail Close, puertos no estándar; consultado el 2026-11-09)
- [Documentación de Netskope: Enabling Dynamic Steering](https://docs.netskope.com/en/enabling-dynamic-steering) (modos por ubicación, semántica de None; consultado el 2026-11-09)
- [Documentación de Netskope: Certificate Pinned Applications](https://docs.netskope.com/en/certificate-pinned-applications) (steer-and-decrypt; consultado el 2026-11-09)
