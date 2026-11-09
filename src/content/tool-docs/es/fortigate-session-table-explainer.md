## Qué hace

Pega la salida de `diagnose sys session list` y esta herramienta te la lee: el protocolo y su estado, qué política admitió el flujo, qué se tradujo en cada tramo, los temporizadores y si el otro extremo llegó a responder. Se ejecuta por completo en tu navegador y nunca contacta con ningún dispositivo.

## Por qué vale la pena leer la tabla de sesiones

La tabla de sesiones es el registro fidedigno de lo que hizo realmente el FortiGate. La lista de políticas te dice lo que debería pasar; la sesión te dice lo que pasó. Cuando alguien insiste en que el firewall le bloquea el tráfico, una entrada de sesión que muestra el flujo admitido por la política 7, con bytes contados en los dos sentidos, lo zanja en una línea.

Su problema es la presentación. La salida es densa, posicional y difícil de recordar, así que la información está ahí y nadie la lee.

## La lectura que la gente se salta

```
statistic(bytes/packets/allow_err): org=240/4/0 reply=0/0/0
```

Paquetes de salida, ninguna respuesta. El FortiGate reenvió el tráfico y **no volvió nada**. La sesión existe, lo que significa que una política la permitió, así que no es el firewall bloqueando nada: el problema está más allá de este dispositivo, en el enrutamiento de la ruta de vuelta, en el host de destino o en un filtro más adelante.

Esta herramienta empieza por esa lectura en lugar de limitarse a mostrar dos números, porque diagnosticarlo erróneamente como un problema del firewall es el error más común y más caro que se comete con esta salida.

En UDP, `proto_state` dice lo mismo de forma más directa: `00` es unidireccional y `01` es bidireccional.

## Los hooks del NAT

Las líneas `hook=` son donde la traducción se hace visible.

```
hook=post dir=org  act=snat 192.168.1.10:52345->93.184.216.34:443(203.0.113.5:52345)
hook=pre  dir=reply act=dnat 93.184.216.34:443->203.0.113.5:52345(192.168.1.10:52345)
```

La tupla entre paréntesis es la forma traducida. `hook=post dir=org act=snat` lleva el origen posterior al NAT, que es lo que ve el otro extremo. `hook=pre dir=reply act=dnat` lleva el destino anterior al NAT. Una sesión sin `snat` ni `dnat` en ningún tramo se enrutó sin traducción, y la herramienta lo dice en lugar de dejarlo implícito.

## Lo que no te dirá

Los campos cuyas tablas de valores completas son documentación del fabricante se muestran **en bruto**, con su significado indicado solo donde está documentado y no es ambiguo. El `proto_state` de TCP es el caso más claro: los dos dígitos son el estado de la conexión en cada sentido, `01` es la sesión establecida que todo el mundo se encuentra, y el resto de la tabla le corresponde publicarlo a Fortinet. La herramienta dice qué significan los dígitos y no se inventa la correspondencia.

Es un límite deliberado. Un decodificador que adivina una tabla de valores parece más completo y se equivoca justo cuando el valor es inusual, que es justo cuando estás leyendo la tabla de sesiones.

## Compartir resultados

Al principio de la lectura, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` las sesiones tal como se pegaron. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

La salida de `diagnose sys session list` nombra direcciones, puertos, traducciones NAT y la política de cada flujo, y puede nombrar a un usuario autenticado (el motivo por el que la ventana emergente añade una línea de precaución). Antes de ofrecer un enlace, se busca en el cuadro una credencial definida por FortiOS o por un estándar: una línea `set` de una opción que la [referencia de la CLI de FortiOS 7.6.8](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) declara de tipo contraseña (`psksecret`, `password`, `passwd`, `secret`, `key`, `auth-pwd` y las demás; consultada el 2026-11-01) o el `name` de una comunidad SNMP ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), sección 3.2.5), cualquier valor `ENC` (según el aviso de Fortinet [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007), consultado el 2026-11-01, esos datos publicados donde otros pueden leerlos “should currently be considered ‘easy to decrypt’”, deben considerarse por ahora fáciles de descifrar), un par `psksecret=` o `password=` con esos mismos nombres en una línea de directiva, una clave privada PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468)), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)), una línea `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sección 11.6.2), una contraseña en una URL o un ID de clave de acceso de AWS. Si aparece una, no hay enlace: la ventana emergente indica su línea, y tú la sustituyes por un marcador de posición y vuelves a presionar, de modo que lo que compartes es exactamente lo que elegiste (nunca se sustituye un valor dentro de un cuadro pegado, porque eso cambiaría lo que se envía). Un valor cuyo nombre solo parece el de un secreto no bloquea el enlace; la ventana emergente indica el primero.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** El cuadro se rellena como lo haría un pegado y la página lee cada sesión. No se contacta con nada. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.

## Dónde encaja

Se complementa con el explicador de búsqueda de políticas de FortiGate: esa herramienta predice qué política *debería* coincidir, y esta confirma qué política *coincidió*. Juntas cierran el círculo entre configuración y comportamiento. A quien prepara el NSE 4 le sirve para los objetivos 1.02 y 1.04.
