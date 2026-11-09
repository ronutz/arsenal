## Qué hace

Pega dos configuraciones de FortiOS separadas por una línea de `---` y obtén una comparación **estructural**: qué cambió por sección, por objeto y por opción. Se ejecuta por completo en tu navegador.

## Por qué una comparación línea a línea es la herramienta equivocada aquí

Un diff de texto busca una **secuencia de edición** (edit script) mínima, que no es lo mismo que el cambio que hizo una persona. Aplicado a la salida de FortiOS, eso produce tres molestias concretas:

- Un bloque que **se movió** aparece como un borrado más una inserción, así que revisar un objeto sin cambios exige la misma atención que una edición real.
- Un objeto parece cambiado porque a un vecino le creció una línea y la alineación se desplazó.
- Tres ediciones reales quedan enterradas entre cuatrocientas líneas de contexto sin cambios.

Esta herramienta analiza los dos lados en secciones, objetos y opciones, y después compara las estructuras. Un bloque que se movió no es un cambio. Una opción que cambió es una línea que nombra el valor anterior y el nuevo.

## El único lugar donde el orden no es ruido

En la mayoría de las secciones, el orden de los objetos es irrelevante: objetos de dirección, objetos de servicio, interfaces. Indicar ahí una reordenación sería ruido, así que se ignora.

En **firewall policy** y en sus parientes, el orden **es** el comportamiento. Gana la primera coincidencia, así que subir una política por encima de otra cambia lo que hace el dispositivo sin cambiar ni una sola opción. Es la edición que una comparación línea a línea entierra más a fondo, porque, a ambos lados del movimiento, nada difiere en el texto salvo la posición.

Esas secciones se tratan como sensibles al orden por su nombre, y una reordenación en ellas se indica como un hallazgo real:

`firewall policy` · `firewall policy6` · `firewall proxy-policy` · `firewall local-in-policy` · `firewall shaping-policy` · `firewall security-policy` · `router policy` · `router policy6` · `system sdwan`

Tratar los dos casos igual, en cualquiera de los dos sentidos, haría que la herramienta se equivocara, así que los dos comportamientos están fijados por vectores de referencia.

## Entrada

Dos configuraciones, separadas por una línea que solo contiene `---` o etiquetadas con `BEFORE:` y `AFTER:` en sus propias líneas. Cada lado es una salida normal de `show` o de `show full-configuration`.

Los bloques `config` anidados dentro de un objeto se analizan, y sus opciones llevan como prefijo la ruta anidada para que no puedan chocar con una opción del mismo nombre en el objeto padre.

## Qué no hace

**Compara, no juzga.** Te dirá que una política se movió o que una dirección cambió; no te dirá si fue buena idea, porque eso depende de una intención que no puede ver.

Tampoco modela el peso semántico de una opción. Cambiar un comentario y cambiar una acción se leen igual, como una opción cambiada, y queda en manos de quien lee saber cuál importa.

Una entrada idéntica produce silencio en lugar de un mensaje tranquilizador. Una herramienta de comparación que encuentra cambios fantasma no es de fiar en los que cuentan, así que un vector fija también eso.

## Compartir resultados

Al principio de la comparación, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` una copia del cuadro (las dos configuraciones con el valor de cada opción secreta de FortiOS sustituido por una marca numerada), nunca el cuadro tal como se pegó. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia. La ventana emergente también indica cuántos valores se sustituyeron.

Las opciones que se sustituyen son las que la [referencia de la CLI de FortiOS 7.6.8](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) declara de tipo contraseña (`password`, `password-2`, `password-3` o `password_aes256`; consultada el 2026-11-01): el `psksecret`, el `psksecret-remote` y el `ppk-secret` de una fase 1 de IPsec, el `password` de un administrador y el `passwd` de un usuario local, la `api-key` de un usuario de API, los valores `secret` de RADIUS (Remote Authentication Dial-In User Service), los valores `key` de TACACS+ y de HA, el `auth-pwd` y el `priv-pwd` de SNMPv3, el `password` de BGP (protocolo de puerta de enlace de frontera, Border Gateway Protocol) y de LDAP (protocolo ligero de acceso a directorios, Lightweight Directory Access Protocol), la `authentication-key` y la `key-string` de OSPF (Open Shortest Path First), la `passphrase` de una red wifi y las claves secretas de los conectores de nube; cualquier opción cuyo nombre termine en una palabra como password, secret o token; el `name` de una comunidad SNMP, que es la propia cadena de comunidad ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), sección 3.2.5; [RFC 3584](https://www.rfc-editor.org/rfc/rfc3584), sección 5.2.1); y todos los valores `ENC`, sea cual sea su opción. El propio aviso de Fortinet [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007) (consultado el 2026-11-01) dice que, en una configuración “willingly posted on a forum for troubleshooting purpose” (publicada a propósito en un foro para resolver un problema), los datos `ENC` se pueden descifrar hasta obtener el texto en claro, y que esos datos “should currently be considered ‘easy to decrypt’” (deben considerarse por ahora fáciles de descifrar), así que un valor `ENC` se trata como el secreto que contiene. Cada valor se convierte en una marca numerada (`[redacted-1]`, `[redacted-2]`, etc.), con el mismo número para el mismo valor; la palabra `ENC`, las comillas y todos los demás caracteres se quedan. No hay ninguna opción para volver a poner los valores: ninguno cambia la lectura, y cada uno es una credencial. Como los valores iguales conservan marcas iguales y los distintos, marcas distintas, un secreto que cambió entre los dos lados sigue apareciendo como una opción cambiada (`psksecret: ENC [redacted-1] → ENC [redacted-3]`), y uno que no cambió sigue sin aparecer.

Un valor que se extiende más allá de su línea no se puede sustituir ahí (una clave privada PEM entre comillas en varias líneas, [RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), sección 10), y la copia todavía puede contener una credencial que ninguna opción nombra (un JWT, [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sección 1; una línea `Authorization`, [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sección 11.6.2; una contraseña en una URL, RFC 3986, sección 3.2.1; un ID de clave de acceso de AWS). En los dos casos no hay enlace: la ventana emergente indica la línea, y tú pones un marcador de posición en su lugar y vuelves a presionar. Un valor cuyo nombre solo parece el de un secreto (una palabra en un comentario, por ejemplo) no bloquea el enlace; la ventana emergente indica el primero. Las direcciones, los nombres de objetos y el resto de las dos configuraciones van tal como se pegaron, y la ventana emergente te pide que los leas antes.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** La copia rellena el cuadro como lo haría un pegado y la página compara los dos lados, con las mismas secciones, objetos y opciones cambiados que para quien lo envió. Un enlace que todavía contiene un secreto es uno que el botón nunca genera, y se ignora. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.

## Dónde encaja

Úsala junto con el artículo sobre las políticas de firewall y el NAT de FortiGate, que explica por qué el orden determina el comportamiento en las secciones que esta herramienta trata como sensibles al orden.
