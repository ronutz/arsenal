## Qué hace

Describe un clúster FGCP (las interfaces monitoreadas caídas, la antigüedad, la prioridad y el número de serie de cada unidad, más la opción override) y esta herramienta ejecuta la elección de la unidad primaria, nombra el criterio que la decidió y te dice quién sería la primaria si se cambiara el override. Se ejecuta por completo en tu navegador.

## La pregunta que responde

“¿Por qué la unidad con la prioridad más alta no es la primaria?”

Es una pregunta que se hace constantemente, y la respuesta casi siempre es la misma. Con el override **deshabilitado**, que es el valor predeterminado, FGCP compara **la antigüedad antes que la prioridad**. Una unidad que se reinició tiene poca antigüedad, así que sigue como secundaria por muy alta que sea su prioridad.

No es un error ni una mala configuración. El valor predeterminado existe para que una unidad que oscila no pueda tomar y perder el rol de primaria una y otra vez, porque cada toma interrumpe el tráfico. Fortinet eligió la estabilidad por encima de la preferencia, y la opción para cambiarlo está ahí mismo.

## El orden de comparación

| Orden | Criterio | Gana |
|---|---|---|
| 1 | Interfaces monitoreadas caídas | Menos |
| 2 | Antigüedad (override deshabilitado) | Mayor |
| 3 | Prioridad | Mayor |
| 4 | Número de serie | Desempate determinista |

Habilitar el override pone **la prioridad por encima de la antigüedad**, así que las posiciones 2 y 3 se intercambian. Las interfaces monitoreadas siguen en primer lugar en los dos modos, y el número de serie sigue en último lugar.

La herramienta muestra el orden que está realmente en vigor para tu entrada y no el genérico, porque esa es la parte que la gente recuerda mal.

## El contrafactual es el resultado útil

Junto a la ganadora, la herramienta calcula quién sería la primaria con el override cambiado. Cuando difiere, lo dice de forma explícita.

Eso importa porque “FGT-B es la primaria” es un hecho, y “con el override habilitado, FGT-A sería la primaria, y esa única opción es lo que decide este clúster” es una decisión. Lo segundo es lo que de verdad necesita alguien que está mirando un clúster que se comporta de forma inesperada.

Cuando cambiar el override no cambiaría nada, también lo dice, y eso descarta toda una línea de investigación en una sola línea.

## Cómo leer los demás resultados

**Decidido por las interfaces monitoreadas** significa que el estado de las interfaces lo resolvió antes de consultar nada más. Corrige la interfaz caída y la comparación pasa al siguiente criterio.

**Decidido por el número de serie** significa que todo lo demás empató. Es determinista, pero arbitrario: si quieres que se prefiera una unidad concreta, define una prioridad en lugar de depender de qué número de serie queda primero al ordenar.

## Lo que no modela

Solo la elección. No modela la supervivencia de las sesiones durante el failover, que depende de session pickup y de si la inspección era basada en proxy, ni modela el split brain, que es un fallo en la ruta del heartbeat y no un resultado de la elección. Eso lo trata el artículo sobre la alta disponibilidad FGCP.

## Compartir resultados

Debajo de la unidad primaria y sus hallazgos, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` el cuadro tal como se pegó. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Las líneas de directivas nombran tus unidades y sus números de serie (el motivo por el que la ventana emergente añade una línea de precaución), y la página solo lee las líneas `member:` y `override:`, así que un bloque `config system ha` pegado junto a ellas también viajaría, con la contraseña del clúster. Antes de ofrecer un enlace, se busca en el cuadro una credencial definida por FortiOS o por un estándar: una línea `set` de una opción que la [referencia de la CLI de FortiOS 7.6.8](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) declara de tipo contraseña (`psksecret`, `password`, `passwd`, `secret`, `key`, `auth-pwd` y las demás; consultada el 2026-11-01) o el `name` de una comunidad SNMP ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), sección 3.2.5), cualquier valor `ENC` (según el aviso de Fortinet [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007), consultado el 2026-11-01, esos datos publicados donde otros pueden leerlos “should currently be considered ‘easy to decrypt’”, deben considerarse por ahora fáciles de descifrar), un par `psksecret=` o `password=` con esos mismos nombres en una línea de directiva, una clave privada PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468)), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)), una línea `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sección 11.6.2), una contraseña en una URL o un ID de clave de acceso de AWS. Si aparece una, no hay enlace: la ventana emergente indica su línea, y tú la sustituyes por un marcador de posición y vuelves a presionar, de modo que lo que compartes es exactamente lo que elegiste (nunca se sustituye un valor dentro de un cuadro pegado, porque eso cambiaría lo que se envía). Un valor cuyo nombre solo parece el de un secreto no bloquea el enlace; la ventana emergente indica el primero.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** El cuadro se rellena como lo haría un pegado y la página ejecuta la elección, contrafactual incluido. No se contacta con nada. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.

## Dónde encaja

Se complementa con el artículo sobre la alta disponibilidad FGCP de FortiGate, que explica por qué existe el orden predeterminado y qué más cambia en un failover. A quien prepara el NSE 4 le sirve para el objetivo 1.03.
