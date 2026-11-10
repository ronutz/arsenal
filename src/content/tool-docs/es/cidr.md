## Qué hace

La Calculadora CIDR / de subredes trabaja con bloques IPv4 escritos en notación CIDR, una dirección y una longitud de prefijo como `192.168.1.0/24`. Tiene cuatro modos, que se eligen con las pestañas de arriba:

- **Subred** analiza un bloque: dirección de red, última dirección, máscara de red, máscara wildcard, primer y último host utilizable, direcciones totales y hosts utilizables, los bits de la dirección y los rangos de uso especial en los que cae el bloque o con los que se solapa.
- **VLSM** divide un bloque padre en subredes de longitud variable que se ajusten a una lista de números de hosts.
- **Superred** resume una lista de prefijos en el conjunto más pequeño de bloques que cubre exactamente las mismas direcciones, y en el prefijo único más pequeño que las cubre todas.
- **Solapamiento / hueco** encuentra qué prefijos de una lista se solapan o se contienen entre sí y, si se indica un ámbito, enumera el espacio dentro de él que no cubre ningún prefijo.

Todos los cálculos se ejecutan en tu navegador; nada de lo que escribes se envía a ninguna parte. Un bloque que llega desde otra página viaja después del `#` de la dirección, una parte que ninguna solicitud lleva; consulta **Enlaces a la calculadora** más abajo.

## Modo Subred

Una longitud de prefijo `/n` fija los `n` bits iniciales de la dirección de 32 bits como parte de red y deja `32 - n` bits para los hosts, de modo que el bloque abarca `2^(32 - n)` direcciones (RFC 4632, sección 3.1). En un bloque de /0 a /30, la herramienta reserva dos de ellas: la que tiene todos los bits de host a 0 (la dirección de red) y la que los tiene todos a 1 (el broadcast dirigido). El RFC 1122, sección 3.2.1.3, no permite 0 ni todo unos en el campo de número de host fuera de los casos especiales que enumera, así que un bloque de /0 a /30 tiene `2^(32 - n) - 2` hosts utilizables.

Un /31 y un /32 no reservan nada. El RFC 3021, sección 2.1, dice que en un enlace punto a punto con máscara de 31 bits ambas direcciones “MUST be interpreted as host addresses” (deben interpretarse como direcciones de host), así que la herramienta cuenta dos hosts utilizables en un /31, marca la primera dirección como el identificador de red que también es un host utilizable y la última como una dirección sin broadcast dirigido. Un /32 es un único host.

Una dirección escrita con bits de host activados, como `192.168.1.77/24`, se lee como el bloque al que pertenece: la fila de la dirección de red muestra `192.168.1.0`. El control deslizante **Longitud de prefijo** reescribe el prefijo de la dirección actual y recalcula al instante. El botón **Ejemplo** carga `192.168.1.0/24`.

Ejemplos resueltos, tal como los muestra la herramienta:

- `192.168.1.0/24`: red `192.168.1.0`, broadcast `192.168.1.255`, utilizables de `192.168.1.1` a `192.168.1.254`, 254 hosts, máscara de red `255.255.255.0`, wildcard `0.0.0.255`.
- `10.0.0.0/30`: red `10.0.0.0`, broadcast `10.0.0.3`, utilizables de `10.0.0.1` a `10.0.0.2`, 2 hosts, máscara de red `255.255.255.252`.
- `10.0.0.0/31`: dos direcciones utilizables, `10.0.0.0` y `10.0.0.1`, sin dirección de red ni de broadcast reservadas.

## Clasificación de uso especial

Debajo de los resultados de Subred, la herramienta compara el bloque con cada fila del registro IPv4 Special-Purpose Address Space de la IANA, descargado el 2026-10-26 (el registro se actualizó por última vez el 2025-10-09; el Clasificador de URL para SSRF lee la misma copia de sus filas), más una fila para multicast. Muestra uno de tres veredictos:

- **Dentro de un rango de uso especial**: todo el bloque está en un rango de la lista. La frase nombra el más específico; por ejemplo, `192.168.1.0/24` está dentro de `192.168.0.0/16`, Private-Use (RFC 1918).
- **En parte de uso especial**: el bloque contiene uno o más rangos de la lista y también otras direcciones. Dos bloques CIDR están anidados o son disjuntos, así que esta es la única forma en que un bloque puede solaparse en parte con un rango. La frase da el recuento; por ejemplo, en `10.0.0.0/7`, 16.777.216 de 33.554.432 direcciones caen en `10.0.0.0/8`. Las filas anidadas se cuentan una vez: `192.0.0.0/23` contiene `192.0.0.0/24` y sus seis filas más específicas, y la herramienta informa de 256 de 512.
- **Ningún rango de uso especial (espacio unicast enrutable globalmente)**: el bloque no toca ningún rango de la lista; por ejemplo, `172.32.0.0/24`, el /24 que está justo encima de `172.16.0.0/12`.

Debajo del veredicto, una tabla enumera cada fila que toca el bloque, de la más específica a la menos: el rango, el nombre del registro, la columna RFC, la relación (**es este bloque**, **contiene este bloque** o **dentro de este bloque (solapamiento parcial)**) y cuatro de los flags del registro. El registro los define: **Origen** y **Destino** indican si una dirección del rango es válida como origen o como destino de un datagrama que atraviesa dos dispositivos; **Reenviable** indica si un router puede reenviar ese datagrama entre interfaces externas; **Accesible globalmente** indica si es reenviable más allá de un dominio administrativo determinado. Cuando el registro añade una nota al pie, la herramienta la muestra: la nota 1 en los flags de Loopback (“Several protocols have been granted exceptions to this rule”, a varios protocolos se les han concedido excepciones a esta regla) y la nota 2 en `192.0.0.0/24` (“Not useable unless by virtue of a more specific reservation”, no utilizable salvo en virtud de una reserva más específica).

Las filas, tal como las enumera el registro (Origen, Destino, Reenviable, Accesible globalmente):

| Rango | Nombre | RFC | O | D | R | G |
|---|---|---|---|---|---|---|
| `0.0.0.0/8` | “This network” | RFC 791, sección 3.2 | sí | no | no | no |
| `0.0.0.0/32` | “This host on this network” | RFC 1122, sección 3.2.1.3 | sí | no | no | no |
| `10.0.0.0/8` | Private-Use | RFC 1918 | sí | sí | sí | no |
| `100.64.0.0/10` | Shared Address Space | RFC 6598 | sí | sí | sí | no |
| `127.0.0.0/8` | Loopback | RFC 1122, sección 3.2.1.3 | no [1] | no [1] | no [1] | no [1] |
| `169.254.0.0/16` | Link Local | RFC 3927 | sí | sí | no | no |
| `172.16.0.0/12` | Private-Use | RFC 1918 | sí | sí | sí | no |
| `192.0.0.0/24` [2] | IETF Protocol Assignments | RFC 6890, sección 2.1 | no | no | no | no |
| `192.0.0.0/29` | IPv4 Service Continuity Prefix | RFC 7335 | sí | sí | sí | no |
| `192.0.0.8/32` | IPv4 dummy address | RFC 7600 | sí | no | no | no |
| `192.0.0.9/32` | Port Control Protocol Anycast | RFC 7723 | sí | sí | sí | sí |
| `192.0.0.10/32` | Traversal Using Relays around NAT Anycast | RFC 8155 | sí | sí | sí | sí |
| `192.0.0.170/32`, `192.0.0.171/32` | NAT64/DNS64 Discovery | RFC 8880; RFC 7050, sección 2.2 | no | no | no | no |
| `192.0.2.0/24` | Documentation (TEST-NET-1) | RFC 5737 | no | no | no | no |
| `192.31.196.0/24` | AS112-v4 | RFC 7535 | sí | sí | sí | sí |
| `192.52.193.0/24` | AMT | RFC 7450 | sí | sí | sí | sí |
| `192.88.99.0/24` | Deprecated (6to4 Relay Anycast), finalizado en 2015-03 | RFC 7526 | no figura | no figura | no figura | no figura |
| `192.88.99.2/32` | 6a44-relay anycast address | RFC 6751 | sí | sí | sí | no |
| `192.168.0.0/16` | Private-Use | RFC 1918 | sí | sí | sí | no |
| `192.175.48.0/24` | Direct Delegation AS112 Service | RFC 7534 | sí | sí | sí | sí |
| `198.18.0.0/15` | Benchmarking | RFC 2544 | sí | sí | sí | no |
| `198.51.100.0/24` | Documentation (TEST-NET-2) | RFC 5737 | no | no | no | no |
| `203.0.113.0/24` | Documentation (TEST-NET-3) | RFC 5737 | no | no | no | no |
| `224.0.0.0/4` | Multicast | RFC 1112, sección 4; RFC 5771 | no figura | no figura | no figura | no figura |
| `240.0.0.0/4` | Reserved | RFC 1112, sección 4 | no | no | no | no |
| `255.255.255.255/32` | Limited Broadcast | RFC 8190; RFC 919, sección 7 | no | sí | no | no |

El registro de uso especial no incluye el multicast. La fila de multicast procede del registro IPv4 Multicast Address Space de la IANA, cuya nota da “the range 224.0.0.0 through 239.255.255.255” (el rango de 224.0.0.0 a 239.255.255.255), el mismo rango que el RFC 1112, sección 4, da para las direcciones de grupo de hosts. Ese registro no tiene columnas de flags, así que la herramienta muestra sus flags como **no figura** en lugar de adivinarlos; hace lo mismo con la fila obsoleta del relay 6to4, cuyas celdas de flags el registro deja en blanco.

Algunas filas se entienden mejor con su RFC. El RFC 1918, sección 3, reserva los tres bloques Private-Use “for private internets” (para internets privadas). El RFC 6598 reserva `100.64.0.0/10` para el NAT de nivel de operador (Carrier-Grade NAT) y dice que “Shared Address Space is distinct from RFC 1918 private address space because it is intended for use on Service Provider networks” (el espacio de direcciones compartido es distinto del espacio privado del RFC 1918 porque está pensado para las redes de los proveedores de servicios). El RFC 5737 reserva los tres bloques TEST-NET para documentación. El RFC 1112, sección 4, dice que las direcciones con “1111” en sus cuatro bits de orden superior “are reserved for future addressing modes” (están reservadas para futuros modos de direccionamiento): la fila `240.0.0.0/4`.

Lo que no es la clasificación: informa de las filas del registro y de nada más. No consulta si un bloque está asignado a alguien ni si se anuncia en internet, y el propio registro advierte que los prefijos que lista “are not guaranteed routability in any particular local or global context” (no tienen garantizada la enrutabilidad en ningún contexto local o global concreto).

## Modo VLSM

Introduce un **bloque padre** y una fila por subred: un nombre opcional y el número de hosts que debe contener. **Asignar** dimensiona y coloca cada solicitud:

1. **Tamaño.** Una solicitud de `h` hosts recibe el bloque más pequeño de al menos `h + 2` direcciones; las dos son la dirección de red y la de broadcast (RFC 1122, sección 3.2.1.3). 100 hosts reciben un /25, 25 hosts un /27 y 2 hosts un /30. Una solicitud de 0 hosts se rechaza con un mensaje que nombra el problema; una solicitud mayor que cualquier bloque IPv4 se enumera como que no cabe.
2. **Orden.** Las solicitudes se colocan empezando por el bloque más grande, no en el orden en que se introdujeron, y el resultado lo indica. Así, cada bloque empieza en un múltiplo de su propio tamaño y los bloques asignados no dejan huecos entre ellos.
3. **Colocación.** Cada bloque ocupa la siguiente posición alineada dentro del padre; una solicitud cuyo bloque alineado se saldría del padre se enumera en **No cupo**.

La opción **Asignar un /31 a las solicitudes de 2 hosts (enlaces punto a punto, RFC 3021)** está desactivada de forma predeterminada. Si la marcas, una solicitud de exactamente 2 hosts recibe un /31 en lugar de un /30, y su fila no muestra broadcast: el RFC 3021, sección 2.1, convierte ambas direcciones en hosts, y la sección 2.2 dice que el broadcast limitado “MUST be used for all broadcast traffic on a point-to-point link with a 31-bit subnet mask” (debe usarse para todo el tráfico de broadcast en un enlace punto a punto con máscara de subred de 31 bits). Úsala solo donde los dos extremos del enlace admitan prefijos de 31 bits: la sección 5 advierte que un enlace “in which only one end supports the use of 31-bit prefixes may not operate correctly” (en el que solo un extremo admite prefijos de 31 bits puede no funcionar correctamente).

Un bloque padre escrito con bits de host activados, como `192.0.2.77/24`, se enmascara a `192.0.2.0/24`, y el resultado lo indica encima de la tabla en lugar de repartir el plan en silencio a partir de un bloque distinto del que escribiste.

El resultado muestra el padre, las direcciones usadas y libres, la utilización, una tabla con cada subred (nombre, hosts solicitados, red, prefijo, máscara de red, rango utilizable, broadcast, hosts utilizables), el espacio libre que queda en el padre como bloques CIDR y las solicitudes que no cupieron.

Ejemplo resuelto: el padre `203.0.113.0/24` con una oficina de 100 hosts, una LAN de invitados de 25, una LAN de administración de 10 y dos enlaces entre routers de 2 hosts cada uno.

- Opción desactivada: `203.0.113.0/25`, `203.0.113.128/27`, `203.0.113.160/28`, `203.0.113.176/30`, `203.0.113.180/30`; 184 direcciones usadas, 72 libres (71,9 %), bloques libres `203.0.113.184/29` y `203.0.113.192/26`.
- Opción activada: los enlaces pasan a ser `203.0.113.176/31` y `203.0.113.178/31`; 180 usadas, 76 libres (70,3 %), bloques libres `203.0.113.180/30`, `203.0.113.184/29` y `203.0.113.192/26`.

## Modo Superred

Pega hasta 1024 prefijos, separados por saltos de línea, comas o espacios. **Resumir** los fusiona (los prefijos que se solapan o son adyacentes se convierten en un solo rango) y muestra:

- el **conjunto mínimo de cobertura**: la menor cantidad de bloques CIDR alineados que cubren exactamente las mismas direcciones que la entrada, ni una más;
- la **superred única**: el prefijo único más pequeño que cubre todas las entradas, y cuántas direcciones añade además de ellas cuando es mayor que su unión.

Ejemplos: `192.168.0.0/24` y `192.168.1.0/24` se resumen en `192.168.0.0/23` sin nada adicional. `10.0.0.0/24` y `10.0.2.0/24` siguen siendo dos bloques; la superred única `10.0.0.0/22` añadiría 512 direcciones que no están en ninguna de las dos entradas.

## Modo Solapamiento / hueco

Pega hasta 1024 prefijos y, de forma opcional, un **ámbito**. **Comprobar** compara cada par y etiqueta cada par que se solapa como **es idéntico a**, **contiene** o **está dentro de**, con el rango compartido y su tamaño; dos bloques CIDR están anidados o son disjuntos, así que todo solapamiento es uno de esos casos. También cuenta las direcciones que cubren los prefijos. Con un ámbito, enumera los **huecos en el ámbito**: las direcciones dentro del ámbito que no cubre ningún prefijo, como los bloques alineados más grandes que caben.

Ejemplo: `10.0.0.0/26` y `10.0.0.128/26` en el ámbito `10.0.0.0/24` no se solapan, cubren 128 de 256 direcciones y dejan los huecos `10.0.0.64/26` y `10.0.0.192/26`.

## Enlaces a la calculadora

Otra página puede abrir la calculadora con un bloque ya rellenado. El cuadro CIDR de la página de inicio lo hace desde su enlace **Abrir la calculadora CIDR completa** y desde la línea de uso especial, y la dirección tiene este aspecto: `/es/tools/cidr/#input=192.0.2.7%2F31`. El bloque viaja en el fragmento, la parte que va después de `#`: un navegador nunca pone el fragmento en una solicitud HTTP ni en un encabezado Referer, así que el host que sirve la página no recibe el bloque. La calculadora lo lee en el navegador, lo pasa por el mismo validador que **Calcular** y muestra el resultado de Subred (para `192.0.2.7/31`: `192.0.2.6` y `192.0.2.7`, dos direcciones utilizables). Un bloque no válido muestra el mismo mensaje de error que si lo escribieras; un valor de más de 16.384 caracteres se ignora.

Lo que el fragmento no oculta: se queda en la barra de direcciones y en el historial del navegador, un marcador lo conserva y cualquiera a quien envíes la dirección puede leerlo; el botón **Compartir** de la página lo advierte cuando la dirección lleva un bloque. **Borrar**, **Ejemplo** o cualquier edición quitan el bloque de la dirección sin recargar la página, de modo que al compartir o recargar después ya no lo lleva. Cambiar de idioma conserva el bloque.

Los enlaces antiguos ponían el bloque en la cadena de consulta (`?input=192.0.2.7%2F31`). Siguen funcionando, pero la cadena de consulta forma parte de la solicitud, así que esa primera solicitud sí llevó el bloque al host antes de que se ejecutara la página. La calculadora pasa entonces el bloque al fragmento y lo indica en una nota debajo de la entrada.

## Compartir resultados

En el modo Subred, debajo del resultado, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva el bloque a partir del cual se calculó el resultado (`#input=192.168.1.0%2F24`), y nada más. Los modos VLSM, Superred y Solapamiento no se comparten: sus varios campos no caben en el único valor que lleva esta dirección. Todo lo que lleva el enlace va después del `#`, que según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27) queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo): el navegador no lo envía al servidor cuando se abre el enlace, pero se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Un enlace lleva como máximo 16.384 caracteres, el límite que el sitio aplica a todo valor después del `#`; un bloque es mucho más corto.
- **Al abrir un enlace.** El enlace es la misma dirección descrita en **Enlaces a la calculadora**: el bloque rellena el campo de Subred y se calcula con el mismo validador que **Calcular**. Como en todo enlace a esta herramienta, el valor se queda después del `#` hasta que cambias o borras el campo, y entonces sale de la dirección sin ninguna solicitud.

## API

El mismo motor responde a la operación `/api/v1/cidr` de la API HTTP del sitio, descrita campo por campo en el contrato OpenAPI de la [página de la API](/api), con ejemplos tomados de los vectores de referencia. El contrato también indica si este sitio sirve la API.

- **Solicitud.** Un bloque sin más (`192.168.1.0/24`, como `?input=` en un GET o como cuerpo de un POST) ejecuta el modo Subred. Un objeto JSON elige un modo: `{"mode": "subnet", "block": "..."}`; `{"mode": "vlsm", "parent": "...", "requirements": [{"label": "Office", "hosts": 100}], "pointToPoint31": false}`; `{"mode": "supernet", "prefixes": [...]}`; o `{"mode": "overlap", "prefixes": [...], "scope": "..."}`. `prefixes` también puede ser una sola cadena, separada como en el cuadro de la página.
- **Respuesta.** Todo resultado lleva `mode`. Subred devuelve los campos de los resultados de Subred (`input`, `network`, `broadcast`, `netmask`, `wildcard`, `firstHost`, `lastHost`, `totalAddresses`, `usableHosts`) y `specialPurpose`: `status` (`special`, `partial` o `none`), `specialAddresses` y `matches`, uno por cada fila del registro que toca el bloque, con las columnas del registro (un flag que el registro deja en blanco es `null`), `relation` (`equal`, `inside` o `contains`) y `overlapAddresses`. VLSM devuelve `subnets` (cada una con `pointToPoint31`), `unallocated`, `parentInput`, `parentMasked`, `freeBlocks`, `placement` (`largest-first`) y los totales de direcciones. Superred devuelve `aggregated`, `singleSupernet` y `supernetExtraAddresses`; Solapamiento / hueco devuelve `overlaps`, `gaps`, `coveredAddresses` y `scopeAddresses`.
- **Errores.** HTTP 400, `invalid_input`, con el mensaje del motor: una solicitud de 0 hosts responde `a requirement (Z) asks for 0 hosts`.

Hasta el 2026-10-19, la operación devolvía solo el desglose de Subred; ese día se añadieron `mode` y `specialPurpose`, y los modos VLSM, Superred y Solapamiento / hueco pasaron a estar disponibles a través de la API.

## Fuentes

- [IANA, IPv4 Special-Purpose Address Space registry, CSV](https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry-1.csv) (registro actualizado el 2025-10-09; consultado el 2026-10-26): cada fila de uso especial, sus flags y sus notas al pie
- [IANA, IPv4 Multicast Address Space registry](https://www.iana.org/assignments/multicast-addresses/multicast-addresses.xml) (registro actualizado el 2026-08-20; consultado el 2026-10-26): el rango de multicast
- [RFC 4632: Classless Inter-domain Routing (CIDR)](https://www.rfc-editor.org/rfc/rfc4632) (consultado el 2026-10-19): sección 3.1, la notación de prefijos y el tamaño de los bloques
- [RFC 1122: Requirements for Internet Hosts - Communication Layers](https://www.rfc-editor.org/rfc/rfc1122) (consultado el 2026-10-19): sección 3.2.1.3, los valores reservados del número de host
- [RFC 3021: Using 31-Bit Prefixes on IPv4 Point-to-Point Links](https://www.rfc-editor.org/rfc/rfc3021) (consultado el 2026-10-19): secciones 2.1, 2.2 y 5
- [RFC 6890: Special-Purpose IP Address Registries](https://www.rfc-editor.org/rfc/rfc6890) (consultado el 2026-10-19), actualizado por el [RFC 8190](https://www.rfc-editor.org/rfc/rfc8190) (consultado el 2026-10-19): la estructura del registro
- [RFC 1918: Address Allocation for Private Internets](https://www.rfc-editor.org/rfc/rfc1918) (consultado el 2026-10-19): sección 3
- [RFC 6598: IANA-Reserved IPv4 Prefix for Shared Address Space](https://www.rfc-editor.org/rfc/rfc6598) (consultado el 2026-10-19)
- [RFC 5737: IPv4 Address Blocks Reserved for Documentation](https://www.rfc-editor.org/rfc/rfc5737) (consultado el 2026-10-19)
- [RFC 3927: Dynamic Configuration of IPv4 Link-Local Addresses](https://www.rfc-editor.org/rfc/rfc3927) (consultado el 2026-10-19)
- [RFC 1112: Host Extensions for IP Multicasting](https://www.rfc-editor.org/rfc/rfc1112) (consultado el 2026-10-19): sección 4, las direcciones de grupo de hosts y el rango de clase E
- [RFC 5771: IANA Guidelines for IPv4 Multicast Address Assignments](https://www.rfc-editor.org/rfc/rfc5771) (consultado el 2026-10-19)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultado el 2026-10-27): sección 3.5, el fragmento, que lleva los valores de un enlace de Compartir resultados
