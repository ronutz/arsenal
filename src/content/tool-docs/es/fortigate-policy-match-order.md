## Qué hace

Pega una lista ordenada de políticas de FortiGate y, si quieres, un paquete. La herramienta recorre la lista de arriba abajo mostrando qué campo descartó cada política, nombra la ganadora e indica cuándo el paquete cae hasta la denegación implícita. En local y sin conexión; razona sobre la lista que le das y nunca toca ningún dispositivo.

## El análisis que vale la pena ejecutar por sí solo

Incluso sin paquete, la herramienta indica las **políticas que nunca se pueden alcanzar**, aquellas en las que una política anterior cubre todos los campos que cubre una posterior. Es la forma más común de “mi regla no funciona”: la regla es correcta y simplemente nunca se alcanza. Vale la pena ejecutarlo de forma periódica y no solo cuando algo se rompe.

## Lo que corrige

**El ID de la política es un identificador, no una posición.** La política 3 puede estar por debajo de la política 47, y renumerarlas no cambia nada del orden de evaluación. Mucho material en internet se lee como si el ID fuera el orden; la herramienta enuncia la corrección en cada ejecución, y uno de sus vectores de referencia es una lista en la que la política 47 está por encima de la 3 y gana.

También dice siempre que **cada sentido necesita su propia política**: que se permita el tráfico de A a B no dice nada de B a A.

## Las reglas de las IP virtuales

Una política con una **VIP aplicada se compara de otra forma y tiene prioridad** sobre una política normal, así que el orden por sí solo no impedirá que un origen llegue a ella. La política de denegación necesita **`match-vip`** y tiene que estar por encima. Las políticas de denegación nuevas lo tienen habilitado de forma predeterminada; una política **accept** no puede tenerlo en absoluto, y la herramienta marca esa combinación como imposible.

## Qué no hace

No resuelve objetos de dirección ni grupos de servicios, así que un objeto con nombre es un token opaco salvo que sea `all` o `any`. Puede decirte que `web-servers` y `all` son distintos, pero no si uno contiene al otro. Para eso, la autoridad es el dispositivo.

## Compartir resultados

Al principio de la lectura, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` las políticas y la línea del paquete tal como se escribieron (una línea de paquete vacía se deja fuera). Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Las políticas nombran tus interfaces, tus objetos de dirección y tus servicios (el motivo por el que la ventana emergente añade una línea de precaución). Se leen los dos campos, y un mensaje sobre una credencial indica cuál la contiene. Antes de ofrecer un enlace, se busca en el cuadro una credencial definida por FortiOS o por un estándar: una línea `set` de una opción que la [referencia de la CLI de FortiOS 7.6.8](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) declara de tipo contraseña (`psksecret`, `password`, `passwd`, `secret`, `key`, `auth-pwd` y las demás; consultada el 2026-11-01) o el `name` de una comunidad SNMP ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), sección 3.2.5), cualquier valor `ENC` (según el aviso de Fortinet [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007), consultado el 2026-11-01, esos datos publicados donde otros pueden leerlos “should currently be considered ‘easy to decrypt’”, deben considerarse por ahora fáciles de descifrar), un par `psksecret=` o `password=` con esos mismos nombres en una línea de directiva, una clave privada PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468)), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)), una línea `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sección 11.6.2), una contraseña en una URL o un ID de clave de acceso de AWS. Si aparece una, no hay enlace: la ventana emergente indica su línea, y tú la sustituyes por un marcador de posición y vuelves a presionar, de modo que lo que compartes es exactamente lo que elegiste (nunca se sustituye un valor dentro de un cuadro pegado, porque eso cambiaría lo que se envía). Un valor cuyo nombre solo parece el de un secreto no bloquea el enlace; la ventana emergente indica el primero.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** Los dos campos se rellenan tal como se escribieron (si el enlace no lleva línea de paquete, ese campo queda vacío) y la página los lee. No se contacta con nada. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
