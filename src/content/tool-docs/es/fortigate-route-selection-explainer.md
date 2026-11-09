## Qué hace

Indica un destino y un conjunto de rutas, y esta herramienta ejecuta la selección que haría FortiOS: qué rutas se instalan, cuál toma realmente el tráfico y cuáles son respaldos flotantes. Se ejecuta por completo en tu navegador.

## La distinción por la que existe toda la herramienta

La distancia administrativa y la prioridad se tratan a menudo como si fueran la misma idea. No lo son, y actúan en momentos distintos.

**La distancia decide qué ruta se INSTALA.** Las rutas al mismo destino compiten, gana la distancia más baja y la perdedora **no está** en la tabla de reenvío: no queda más abajo en la clasificación ni es una alternativa que se usa con carga, simplemente no está. Por eso “mi ruta no funciona” resulta tantas veces ser “mi ruta nunca se instaló”, y por eso una ruta que configuraste no aparece en `get router info routing-table all`.

**La prioridad decide cuál de varias rutas YA INSTALADAS se prefiere.** Solo se aplica a las rutas que sobrevivieron a la comparación de distancias. Una prioridad de 0 no puede rescatar una ruta que perdió por distancia, y un vector de referencia fija exactamente ese caso.

## Lo que se deduce de ella

| Configuración | Resultado |
|---|---|
| Mismo prefijo, misma distancia | Se instalan las dos; decide la prioridad |
| Mismo prefijo, distinta distancia | Se instala una; la otra es un respaldo flotante |
| Mismo prefijo, misma distancia, misma prioridad | ECMP reparte la carga entre las dos |

El respaldo flotante es la forma de construir una ruta predeterminada en espera: mismo prefijo, mayor distancia. Solo aparece en la tabla cuando se retira la principal, que es lo que hace el **monitoreo del estado del enlace (link health monitoring)**, y por eso una ruta estática sin él sigue en la tabla aunque la ruta más allá de la interfaz esté rota.

La herramienta modela una ruta caída para que veas cómo el respaldo toma el relevo.

## El reenvío toma la coincidencia más larga

Entre las rutas **instaladas**, gana el prefijo más específico, con independencia de la distancia o la prioridad. Un /16 gana a una ruta predeterminada para una dirección que esté dentro de él aunque la ruta predeterminada tenga mejores valores, porque en el momento del reenvío la especificidad se compara primero.

Por eso funciona también el secuestro de prefijos, y por eso conviene tener presente este orden más allá de un solo dispositivo.

## Lo que no modela

Solo la tabla de enrutamiento. Hay dos cosas que se consultan **antes** que ella y que la anulan:

- Una **ruta de política (policy route)**, que compara el origen, el protocolo y el puerto además del destino. Una ruta de política olvidada es la causa clásica de un tráfico que ignora una ruta estática a todas luces correcta, así que, si la tabla dice una cosa y el tráfico hace otra, mira ahí primero.
- Una **regla de SD-WAN** (red de área amplia definida por software, software-defined wide area network), que elige un miembro según el rendimiento medido antes de llegar a la tabla.

Solo trabaja con IPv4, y no evalúa si una puerta de enlace es realmente alcanzable; toma el conjunto de rutas tal como se le da.

## Compartir resultados

Debajo de la ruta seleccionada, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` el destino y las rutas tal como se pegaron. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Las rutas nombran tus prefijos internos, tus siguientes saltos y tus interfaces, igual que una tabla de enrutamiento (el motivo por el que la ventana emergente añade una línea de precaución). Antes de ofrecer un enlace, se busca en el cuadro una credencial definida por FortiOS o por un estándar: una línea `set` de una opción que la [referencia de la CLI de FortiOS 7.6.8](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) declara de tipo contraseña (`psksecret`, `password`, `passwd`, `secret`, `key`, `auth-pwd` y las demás; consultada el 2026-11-01) o el `name` de una comunidad SNMP ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), sección 3.2.5), cualquier valor `ENC` (según el aviso de Fortinet [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007), consultado el 2026-11-01, esos datos publicados donde otros pueden leerlos “should currently be considered ‘easy to decrypt’”, deben considerarse por ahora fáciles de descifrar), un par `psksecret=` o `password=` con esos mismos nombres en una línea de directiva, una clave privada PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468)), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)), una línea `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sección 11.6.2), una contraseña en una URL o un ID de clave de acceso de AWS. Si aparece una, no hay enlace: la ventana emergente indica su línea, y tú la sustituyes por un marcador de posición y vuelves a presionar, de modo que lo que compartes es exactamente lo que elegiste (nunca se sustituye un valor dentro de un cuadro pegado, porque eso cambiaría lo que se envía). Un valor cuyo nombre solo parece el de un secreto no bloquea el enlace; la ventana emergente indica el primero.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** El cuadro se rellena como lo haría un pegado y la página selecciona la ruta. No se contacta con nada. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.

## Dónde encaja

Se complementa con el artículo sobre el enrutamiento y el SD-WAN de FortiGate, que trata el orden de consulta completo y la capa de SD-WAN que esta herramienta deja fuera. A quien prepara el NSE 4 le sirve para el objetivo 4.01.
