## Qué hace

Pega perfiles de persistencia y virtual servers de BIG-IP como un fragmento de tmsh y la herramienta explica la persistencia de cada uno: qué método es, qué usa como clave, cómo se comporta, los campos que importan y las formas en que falla en la práctica. Para cada virtual server también muestra la cadena de persistencia: el método principal y el de reserva (fallback) que se usa cuando el principal no produce ningún registro. Analiza la configuración en tu navegador y no se conecta a ningún equipo.

## Qué es la persistencia y por qué importa el método

La persistencia, también llamada afinidad de sesión, mantiene a un cliente fijado al mismo miembro del pool a lo largo de varias conexiones, algo que necesitan las aplicaciones con estado para que una sesión iniciada en un servidor continúe en ese servidor. BIG-IP ofrece varios métodos, y lo importante es que cada uno usa una clave distinta, así que cada uno tiene su propia forma de fallar. Elegir un método es, en realidad, elegir qué usar como clave y aceptar cómo puede romperse esa clave.

## Los métodos habituales y cómo fallan

- La persistencia por **dirección de origen** (source-address) usa como clave la dirección IP del cliente. Su fallo clásico es que muchos clientes lleguen desde detrás de un único NAT o proxy: comparten una dirección, así que todos quedan fijados a un miembro del pool y la carga se desequilibra. También se rompe si la dirección de un cliente cambia en mitad de la sesión.
- La persistencia por **cookie** usa como clave una cookie HTTP que gestiona el BIG-IP, en modos que la insertan, la reescriben o la leen de forma pasiva. Es precisa, pero requiere HTTP y un cliente que acepte cookies, así que no se aplica al tráfico que no es HTTP.
- La persistencia **SSL** usa como clave el ID de sesión TLS. Falla cuando los clientes cambian o renegocian los ID de sesión, o cuando los ID de sesión duran poco, y por eso se combina tan a menudo con un método de reserva.
- La persistencia **universal** usa como clave un valor que una iRule extrae del tráfico, lo que te permite persistir sobre casi cualquier cosa (un token, un encabezado, un campo) a cambio de escribir la regla.

Ajustes como match-across-services, match-across-virtuals y match-across-pools amplían el ámbito en el que se aplica un registro de persistencia, y la herramienta los lee donde están definidos.

## La cadena de método principal y de reserva

Un virtual server puede nombrar un perfil de persistencia principal y otro de reserva. Cuando el método principal no encuentra ningún registro existente para una conexión, BIG-IP usa el de reserva para colocarla. Una combinación muy conocida es la persistencia por ID de sesión SSL con la dirección de origen como reserva, para que un cliente cuyo ID de sesión aún no se conoce quede fijado de todos modos por su dirección IP. La herramienta muestra esta cadena para cada virtual server, para que veas qué decide realmente el miembro. Para los bytes de dentro de una cookie de persistencia en concreto, la herramienta complementaria es el Decodificador de cookies de persistencia de BIG-IP; esta explica el método que la rodea.

## Uso

Pega perfiles de persistencia, virtual servers o ambos, y lee el método, la clave, los campos y las formas de fallo de cada uno, además de la cadena de principal a reserva de cada virtual server. El análisis es determinista y local.

## Compartir resultados

Al principio de la lectura, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` los perfiles y los virtual servers con el valor de cada ajuste secreto sustituido por `[redacted]`, nunca tal como se pegaron. Un perfil de cookie puede contener uno: [`cookie-encryption-passphrase`](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_persistence_cookie.html) “Specifies a passphrase to be used for cookie encryption” (especifica una frase de contraseña para el cifrado de cookies) (referencia de tmsh de F5, ltm persistence cookie, consultada el 2026-10-27). Su ventana emergente dice primero qué lleva el enlace, y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

La copia es la del [Explicador de configuración tmsh](/tools/f5-tmsh-config-explainer), hecha con el mismo analizador con el que lee esta página, así que también se sustituyen todos los valores de contraseña, frase de contraseña, secreto y comunidad SNMP de un pegado más grande; la ventana emergente indica cuántos. `[redacted]` es una sola palabra de tmsh, así que la página que recibe el enlace lee los mismos perfiles, cadenas y campos. Los nombres de perfiles, virtual servers, pools y cookies van tal como se pegaron; también el cuerpo de una iRule, y la ventana emergente lo indica cuando lo hay. Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que la copia no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerla.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** La copia rellena el cuadro como lo haría un pegado y la página la explica. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
