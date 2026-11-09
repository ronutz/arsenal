## Qué hace

Describe una política (el tráfico, la configuración de inspección SSL, el modo de inspección y qué perfiles de seguridad tiene asociados) y esta herramienta te dice qué perfiles pueden **ver** realmente ese tráfico. Se ejecuta por completo en tu navegador.

## La cadena de dependencias

Un perfil de seguridad solo actúa cuando se cumplen todas las condiciones previas que tiene por encima:

1. Una política de firewall **permite** el tráfico. Nada inspecciona lo que se denegó.
2. La inspección SSL lo **descifra**, si va cifrado.
3. El **modo** de inspección admite la función.
4. Solo entonces actúa el perfil.

La herramienta recorre esa cadena para cada perfil y nombra el eslabón que falló. La mayoría de los avisos de que un perfil no funciona se resuelven en el **paso 2**: el tráfico es HTTPS, la política lleva inspección de certificados en lugar de inspección profunda, y sencillamente no hay nada que leer. El perfil parece asociado, la configuración parece correcta, y está ciego.

## Ciego no es lo mismo que degradado

Esa distinción es el juicio que esta herramienta existe para hacer, y equivocarse en cualquiera de los dos sentidos sería peor que no decir nada.

Que un perfil figure como **CIEGO** significa que está asociado, configurado y no hace nada. AntiVirus, el IPS (sistema de prevención de intrusiones, intrusion prevention system), la DLP (prevención de pérdida de datos, data loss prevention) y el filtro de archivos necesitan el cuerpo del mensaje. Detrás de una inspección de certificados no hay cuerpo, así que no son parcialmente eficaces: están inertes.

Que figure como **degradado** significa que funciona con menos que la imagen completa. El control de aplicaciones y el filtro web todavía pueden identificar parte del tráfico a partir de los metadatos del handshake, como el SNI, así que una política por nombre de host se sigue aplicando y una política por ruta de URL, no.

Decirle a alguien que un perfil funciona en parte cuando no ve nada en absoluto es el error más peligroso, así que los dos casos se indican por separado y con estilos distintos.

## La inspección de certificados es otra cosa, no una versión más débil

Valida el certificado y lee el handshake. Nunca descifra la carga útil (payload). Describirla como una “inspección profunda más ligera” lleva directamente a la situación del perfil ciego, y por eso la herramienta la presenta como un mecanismo distinto y no como un ajuste inferior.

Pasar una política a inspección profunda es el único cambio que arregla a la vez todos los perfiles ciegos, y es una decisión de verdad, no una casilla. La inspección profunda implica terminar el TLS en el FortiGate, lo que tiene consecuencias de confianza en los certificados, de privacidad y de rendimiento que forman parte de la decisión.

## Advertencias sobre el modo

Incluso donde hay cobertura, el modo de flujo limita algunos comportamientos, y la herramienta indica dónde. AntiVirus en modo de flujo analiza el archivo a medida que llega en lugar de almacenarlo entero en búfer, así que los archivos muy grandes y los archivos comprimidos muy anidados son donde la cobertura se debilita. También señala la acción para archivos sobredimensionados (oversize), cuyo valor predeterminado **deja pasar** los archivos por encima del umbral, de modo que las descargas más grandes quedan sin inspeccionar salvo que eso se cambie a propósito.

## Lo que no modela

**Cobertura, no detección.** Responde si un perfil puede ver el tráfico. Nunca afirma que un perfil detectaría una amenaza concreta, porque eso depende de las firmas, de las bases de datos y de la propia amenaza, y nada de eso se puede calcular a partir de la descripción de una política.

Tampoco evalúa la calidad de la configuración de los perfiles: un perfil de AntiVirus con todos los análisis deshabilitados figura aquí como eficaz, porque la pregunta que se hace es de visibilidad.

## Compartir resultados

Debajo de la tabla de cobertura, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` el cuadro tal como se pegó. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Las líneas de directivas nombran tipos de perfil y modos de inspección, no tu red, así que la ventana emergente no añade ninguna línea de precaución propia. Antes de ofrecer un enlace, se busca en el cuadro una credencial definida por FortiOS o por un estándar: una línea `set` de una opción que la [referencia de la CLI de FortiOS 7.6.8](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) declara de tipo contraseña (`psksecret`, `password`, `passwd`, `secret`, `key`, `auth-pwd` y las demás; consultada el 2026-11-01) o el `name` de una comunidad SNMP ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), sección 3.2.5), cualquier valor `ENC` (según el aviso de Fortinet [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007), consultado el 2026-11-01, esos datos publicados donde otros pueden leerlos “should currently be considered ‘easy to decrypt’”, deben considerarse por ahora fáciles de descifrar), un par `psksecret=` o `password=` con esos mismos nombres en una línea de directiva, una clave privada PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468)), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)), una línea `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sección 11.6.2), una contraseña en una URL o un ID de clave de acceso de AWS. Si aparece una, no hay enlace: la ventana emergente indica su línea, y tú la sustituyes por un marcador de posición y vuelves a presionar, de modo que lo que compartes es exactamente lo que elegiste (nunca se sustituye un valor dentro de un cuadro pegado, porque eso cambiaría lo que se envía). Un valor cuyo nombre solo parece el de un secreto no bloquea el enlace; la ventana emergente indica el primero.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** El cuadro se rellena como lo haría un pegado y la página comprueba la cobertura. No se contacta con nada. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.

## Dónde encaja

Se complementa con el artículo sobre los perfiles de seguridad de FortiGate, que explica a fondo la diferencia entre flujo y proxy, y con el artículo sobre los modos de inspección SSL. A quien prepara el NSE 4 le sirve para los objetivos del 3.02 al 3.05.
