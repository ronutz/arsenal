## Qué hace

Pega un bloque de configuración de FortiOS y la herramienta devuelve su estructura como un árbol con cada verbo explicado: qué hacen `config`, `edit`, `set`, `unset`, `append`, `next`, `end` y `abort`, y en qué punto del bloque estás en cada línea. En local y sin conexión; lee la estructura, no la semántica.

## La trampa que existe para detectar

**`set` sobre un campo de varios valores sustituye la lista entera.** `set srcaddr "internal-net"` en una política que tenía cuatro direcciones de origen la deja con una, con éxito, en silencio y sin que nada en la salida lo mencione. El comando que añade es **`append`**.

La herramienta avisa en cada `set` sobre un campo de lista conocido, con el nombre del campo y la línea. Es el hábito más caro del trabajo con la CLI de FortiOS, y es invisible en un bloque leído por encima, que es justo como se leen los bloques.

## Dos cosas más que siempre dice

- **`edit` crea lo que no encuentra.** Un ID de política mal escrito no produce un error, produce una política.
- **`end` es la única línea que confirma los cambios.** `next` cierra una entrada y se queda en la tabla; `abort` cierra y descarta. Un bloque que usa `end` donde se quería `next` sale de la tabla antes de tiempo, y todas las ediciones que quedan acaban en otro sitio.

También indica los **bloques sin cerrar**, porque un bloque sin cerrar no ha confirmado nada y pegarlo en una sesión en vivo te deja en un lugar inesperado.

## Qué no hace

No conoce tus objetos de dirección, tus políticas ni tu distribución de VDOM, y no puede decir si un valor es razonable. Responde si la forma del comando hace lo que probablemente esperaba quien lo escribió, que es una pregunta distinta y a menudo más útil.

Tampoco puede saber qué había antes en un campo. Cuando avisa de que un `set` sustituye una lista, **la pregunta que te pide responder es qué contenía esa lista.**

## Compartir resultados

Al principio de la lectura, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` una copia del bloque con el valor de cada opción secreta de FortiOS sustituido por una marca numerada, nunca el bloque tal como se pegó, porque el árbol muestra el valor de cada línea. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia. La ventana emergente también indica cuántos valores se sustituyeron.

Las opciones que se sustituyen son las que la [referencia de la CLI de FortiOS 7.6.8](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) declara de tipo contraseña (`password`, `password-2`, `password-3` o `password_aes256`; consultada el 2026-11-01): el `psksecret`, el `psksecret-remote` y el `ppk-secret` de una fase 1 de IPsec, el `password` de un administrador y el `passwd` de un usuario local, la `api-key` de un usuario de API, los valores `secret` de RADIUS (Remote Authentication Dial-In User Service), los valores `key` de TACACS+ y de HA, el `auth-pwd` y el `priv-pwd` de SNMPv3, el `password` de BGP (protocolo de puerta de enlace de frontera, Border Gateway Protocol) y de LDAP (protocolo ligero de acceso a directorios, Lightweight Directory Access Protocol), la `authentication-key` y la `key-string` de OSPF (Open Shortest Path First), la `passphrase` de una red wifi y las claves secretas de los conectores de nube; cualquier opción cuyo nombre termine en una palabra como password, secret o token; el `name` de una comunidad SNMP, que es la propia cadena de comunidad ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), sección 3.2.5; [RFC 3584](https://www.rfc-editor.org/rfc/rfc3584), sección 5.2.1); y todos los valores `ENC`, sea cual sea su opción. El propio aviso de Fortinet [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007) (consultado el 2026-11-01) dice que, en una configuración “willingly posted on a forum for troubleshooting purpose” (publicada a propósito en un foro para resolver un problema), los datos `ENC` se pueden descifrar hasta obtener el texto en claro, y que esos datos “should currently be considered ‘easy to decrypt’” (deben considerarse por ahora fáciles de descifrar), así que un valor `ENC` se trata como el secreto que contiene. Cada valor se convierte en una marca numerada (`[redacted-1]`, `[redacted-2]`, etc.), con el mismo número para el mismo valor; la palabra `ENC`, las comillas y todos los demás caracteres se quedan. No hay ninguna opción para volver a poner los valores: ninguno cambia la lectura, y cada uno es una credencial.

Un valor que se extiende más allá de su línea no se puede sustituir ahí (una clave privada PEM entre comillas en varias líneas, [RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), sección 10), y la copia todavía puede contener una credencial que ninguna opción nombra (un JWT, [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), sección 1; una línea `Authorization`, [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sección 11.6.2; una contraseña en una URL, RFC 3986, sección 3.2.1; un ID de clave de acceso de AWS). En los dos casos no hay enlace: la ventana emergente indica la línea, y tú pones un marcador de posición en su lugar y vuelves a presionar. Un valor cuyo nombre solo parece el de un secreto (una palabra en un comentario, por ejemplo) no bloquea el enlace; la ventana emergente indica el primero. Los nombres de las interfaces, las direcciones, los objetos y los usuarios van tal como se pegaron, y la ventana emergente te pide que los leas antes.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** La copia rellena el cuadro como lo haría un pegado y la página la explica: el árbol, las advertencias y las notas se leen igual que para quien lo envió, con las marcas en lugar de los valores. Un enlace que todavía contiene un secreto es uno que el botón nunca genera, y se ignora. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.

## Herramientas relacionadas

Para recoger por script la configuración de un FortiGate, el [Generador de scripts de Expect](/tools/expect-script-builder) escribe un script que inicia sesión y ejecuta comandos, con un perfil de FortiOS. De forma predeterminada, responde al paginador `--More--` con un espacio en lugar de cambiar la configuración de salida de la consola, un cambio global que vería la sesión de cada administrador.
