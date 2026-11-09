## Qué hace

Pega una lista de políticas de firewall de FortiGate y un paquete, y esta herramienta hace la evaluación que haría FortiOS: de arriba abajo, todos los criterios tienen que coincidir y gana la primera coincidencia. Indica la política que coincide, un rastro que nombra el **primer criterio que eliminó** cada política anterior y las políticas por debajo de la coincidencia que también habrían coincidido. Se ejecuta por completo en tu navegador y nunca contacta con ningún dispositivo.

## Por qué el rastro importa más que el veredicto

Saber que coincidió la política 7 es una parte pequeña de la respuesta. La parte útil es por qué no coincidieron las políticas de la 1 a la 6, porque eso es lo que te dice si la lista está escrita como se pretendía. Una política con las direcciones correctas y la interfaz de salida equivocada deja de coincidir en silencio, y nada en la interfaz gráfica lo indica; el contador de coincidencias simplemente nunca sube.

El rastro nombra un criterio por política: el primero que falló. FortiOS exige todos, así que basta con un fallo para eliminar una política, e indicar el primero es lo que mantiene legible el resultado en una lista larga.

## Sombreada frente a regla general, y por qué la distinción es lo esencial

Cuando una política coincide, las políticas posteriores que también habrían coincidido caen en dos categorías muy distintas, y esta herramienta las mantiene separadas.

Que una política posterior figure como **SOMBREADA** significa que es al menos tan específica como la que ganó. Es un fallo de verdad: está activa en la configuración, parece correcta en pantalla y nunca puede tener efecto sobre este tráfico con el orden actual. Es el problema de políticas más común en FortiGate, y la solución es subirla por encima de la ganadora.

Que figure como **regla general** significa que es más amplia que la ganadora. Un permiso general por debajo de un conjunto de reglas específicas es un diseño correcto, no un error, así que la herramienta lo indica sin marcarlo. Mezclar los dos casos es lo que hace que este tipo de herramientas dé falsas alarmas en cada lista de políticas bien ordenada, y por eso la especificidad se calcula en lugar de suponerse.

## Formatos de entrada

Se aceptan dos formas, porque puedes tener cualquiera de las dos.

**CLI de FortiOS**: la salida de `show firewall policy` o un bloque `config firewall policy`. Los miembros se leen de las listas entre comillas, y una política con `set status disable` se indica como omitida en lugar de ignorarse en silencio.

**Una tabla con barras verticales o tabulaciones**: `id | srcintf | dstintf | srcaddr | dstaddr | service | action`, que es el aspecto de una copia desde la interfaz gráfica o de una lista escrita a mano. Si una celda tiene varios miembros, van separados por comas.

El paquete va en su propia línea en cualquiera de los dos formatos:

```
packet: srcintf=port1, dstintf=port2, srcaddr=LAN, dstaddr=WebSrv, service=HTTPS
```

## La limitación, dicha con claridad

La coincidencia compara **nombres de objetos**, no direcciones resueltas. Una lista de políticas pegada no lleva las definiciones de los objetos de dirección, así que la pregunta “¿está 10.1.1.5 dentro del objeto llamado LAN_Subnet?” no se puede responder con esta entrada. Indica el nombre del objeto, o `all`.

Es una decisión deliberada. La herramienta podría adivinar analizando las direcciones a partir de los nombres de los objetos, y se equivocaría con total seguridad cada vez que un nombre no describiera su contenido. Un límite declarado es más útil que una respuesta plausible pero errónea, y es la razón por la que se puede confiar en esta herramienta en las partes que sí responde.

Además, solo modela **la decisión de coincidencia**. Los resultados del NAT (traducción de direcciones de red, network address translation), los resultados de los perfiles de seguridad, el enrutamiento y el estado de las sesiones dependen de una configuración que esta entrada no lleva, y no se deducen.

## Compartir resultados

Debajo de la respuesta principal (al principio de la lectura cuando no hay paquete), **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` una copia del cuadro, nunca el cuadro tal como se pegó. La página lee las políticas y la línea `packet:` y se salta todo lo demás, así que una configuración entera pegada aquí también obtiene una lectura; la copia sustituye por una marca numerada el valor de cada opción secreta de FortiOS que contenga. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia. La ventana emergente también indica cuántos valores se sustituyeron.

Las opciones que se sustituyen son las que la [referencia de la CLI de FortiOS 7.6.8](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) declara de tipo contraseña (`password`, `password-2`, `password-3` o `password_aes256`; consultada el 2026-11-01): el `psksecret`, el `psksecret-remote` y el `ppk-secret` de una fase 1 de IPsec, el `password` de un administrador y el `passwd` de un usuario local, la `api-key` de un usuario de API, los valores `secret` de RADIUS (Remote Authentication Dial-In User Service), los valores `key` de TACACS+ y de HA, el `auth-pwd` y el `priv-pwd` de SNMPv3, el `password` de BGP (protocolo de puerta de enlace de frontera, Border Gateway Protocol) y de LDAP (protocolo ligero de acceso a directorios, Lightweight Directory Access Protocol), la `authentication-key` y la `key-string` de OSPF (Open Shortest Path First), la `passphrase` de una red wifi y las claves secretas de los conectores de nube; cualquier opción cuyo nombre termine en una palabra como password, secret o token; el `name` de una comunidad SNMP, que es la propia cadena de comunidad ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), sección 3.2.5; [RFC 3584](https://www.rfc-editor.org/rfc/rfc3584), sección 5.2.1); y todos los valores `ENC`, sea cual sea su opción. El propio aviso de Fortinet [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007) (consultado el 2026-11-01) dice que, en una configuración “willingly posted on a forum for troubleshooting purpose” (publicada a propósito en un foro para resolver un problema), los datos `ENC` se pueden descifrar hasta obtener el texto en claro, y que esos datos “should currently be considered ‘easy to decrypt’” (deben considerarse por ahora fáciles de descifrar), así que un valor `ENC` se trata como el secreto que contiene. Cada valor se convierte en una marca numerada (`[redacted-1]`, `[redacted-2]`, etc.), con el mismo número para el mismo valor; la palabra `ENC`, las comillas y todos los demás caracteres se quedan. No hay ninguna opción para volver a poner los valores: ninguno cambia la lectura, y cada uno es una credencial.

Un valor que se extiende más allá de su línea no se puede sustituir ahí (una clave privada PEM entre comillas en varias líneas, [RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), sección 10), y la copia todavía puede contener una credencial que ninguna opción nombra (un JWT, [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sección 1; una línea `Authorization`, [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sección 11.6.2; una contraseña en una URL, RFC 3986, sección 3.2.1; un ID de clave de acceso de AWS). En los dos casos no hay enlace: la ventana emergente indica la línea, y tú pones un marcador de posición en su lugar y vuelves a presionar. Un valor cuyo nombre solo parece el de un secreto (una palabra en un comentario, por ejemplo) no bloquea el enlace; la ventana emergente indica el primero. La búsqueda nunca lee esas opciones, así que la copia se lee exactamente igual; los nombres de las interfaces, las direcciones y las políticas van tal como se pegaron, y la ventana emergente te pide que los leas antes.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** La copia rellena el cuadro como lo haría un pegado y la página ejecuta la búsqueda. Un enlace que todavía contiene un secreto es uno que el botón nunca genera, y se ignora. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.

## Dónde encaja

Se complementa con el artículo sobre las políticas de firewall y el NAT de FortiGate, que explica el proceso de evaluación que recorre esta herramienta, incluido por qué el NAT de destino a través de una VIP se produce antes de evaluar las políticas y el NAT de origen, después. A quien prepara el NSE 4 le cubre los objetivos 2.01 y 2.02.
