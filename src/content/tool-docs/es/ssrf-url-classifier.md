## Qué hace

Pega una URL y la herramienta te dice adónde apunta en realidad: loopback, un rango privado o link-local, un endpoint de metadatos de la nube, el espacio compartido de CGNAT, otro espacio reservado o la internet pública. Decodifica los trucos de ofuscación de direcciones IP que se usan para disfrazar una dirección interna, lee la dirección IPv4 que una dirección IPv6 puede llevar dentro (seis esquemas, Teredo incluido), nombra el bloque de uso especial de la IANA en el que cae una dirección para cada fila de los dos registros, señala las direcciones de servicio anycast de uso especial, señala los esquemas de URL peligrosos y las credenciales incrustadas, y muestra un nivel de riesgo de SSRF. Nunca resuelve el DNS ni envía la solicitud; es un clasificador, no una sonda.

## Qué es la SSRF y por qué importa clasificar

La falsificación de solicitudes del lado del servidor (SSRF, Server-Side Request Forgery) es un ataque en el que se engaña a un servidor para que haga una solicitud a una URL que eligió el atacante, normalmente para llegar a algo a lo que el atacante no puede llegar directamente: un servicio en `localhost`, una máquina de un rango interno o el endpoint de metadatos de un proveedor de nube. Defenderse se reduce a decidir si es seguro obtener una URL, y esa decisión es más difícil de lo que parece, porque una dirección interna se puede escribir de muchas formas disfrazadas. Esta herramienta está hecha para esa decisión: existe para ayudarte a entender una URL y a diseñar una lista de permitidos, claramente del lado de la defensa.

## Las ofuscaciones que decodifica

Un filtro ingenuo que bloquea `127.0.0.1` no ve las muchas otras formas de escribir la misma dirección, y los atacantes explotan justo eso. La herramienta las decodifica para que el destino real quede a la vista:

- la forma de entero **decimal**, en la que `2130706433` es `127.0.0.1` y `2852039166` es la dirección de metadatos `169.254.169.254` (es la que carga el botón Ejemplo);
- las formas de octetos en **octal** y en **hexadecimal**;
- IPv4 en **forma abreviada**, en la que `127.1` se expande a `127.0.0.1`;
- **cualquier forma de escribir una dirección IPv6**: la herramienta descompone la dirección en sus ocho piezas de 16 bits antes de clasificar nada, así que `[0:0:0:0:0:0:0:1]` y `[0000:0000:0000:0000:0000:0000:0000:0001]` son el loopback `::1`, igual que el RFC 4291 presenta `0:0:0:0:0:0:0:1` y `::1` como dos formas de escribir la dirección de loopback, donde “The use of ‘::’ indicates one or more groups of 16 bits of zeros” (‘::’ indica uno o más grupos de 16 bits a cero) ([RFC 4291, sección 2.2](https://www.rfc-editor.org/rfc/rfc4291.txt)); y
- las **direcciones IPv6 que llevan una dirección IPv4**, que se describen en la sección siguiente.

Después clasifica el literal resultante con cada fila de los registros de uso especial de la IANA y destaca las direcciones de metadatos de la nube, que son objetivos de SSRF de primer orden. La dirección decodificada se muestra en el texto canónico del [RFC 5952](https://www.rfc-editor.org/rfc/rfc5952.txt): en minúsculas, sin ceros a la izquierda, con la secuencia más larga de piezas a cero escrita como `::` (sección 4) y, para los prefijos que por sí solos señalan una dirección IPv4 incrustada, en notación mixta con una cola decimal con puntos, porque “mixed notation is RECOMMENDED if the following condition is met” (se recomienda la notación mixta si se cumple la condición siguiente) y la condición es un prefijo bien conocido como los que define el RFC 4291 (sección 5).

## Direcciones IPv6 que llevan una dirección IPv4

Seis esquemas de IPv6 colocan una dirección IPv4 dentro de los 128 bits. Un filtro que solo comprueba el texto IPv6 deja pasar el destino IPv4 interno, así que la herramienta decodifica la dirección IPv4, califica la URL según ella, dice qué incrustación decodificó y muestra la fila del registro de la dirección que lleva. Una dirección pública que va dentro de una incrustación se califica como Público, con la incrustación nombrada.

| Esquema | Prefijo | Dónde va la dirección IPv4 | Fuente |
|---|---|---|---|
| IPv4-mapped | `::ffff:0:0/96` | los 32 bits bajos | [RFC 4291, sección 2.5.5.2](https://www.rfc-editor.org/rfc/rfc4291.txt) |
| IPv4-compatible (obsoleto) | `::/96`, salvo `::` y `::1` | los 32 bits bajos | [RFC 4291, sección 2.5.5.1](https://www.rfc-editor.org/rfc/rfc4291.txt) |
| NAT64, prefijo bien conocido (Well-Known Prefix) | `64:ff9b::/96` | los 32 bits bajos (el esquema /96) | [RFC 6052, secciones 2.1 y 2.2](https://www.rfc-editor.org/rfc/rfc6052.txt) |
| NAT64, prefijo de uso local | `64:ff9b:1::/48` | depende de la longitud de prefijo que eligió el operador: el esquema /48, /56, /64 o /96 del RFC 6052 | [RFC 8215, secciones 1 y 5](https://www.rfc-editor.org/rfc/rfc8215.txt) |
| 6to4 | `2002::/16` | los bits 16 a 47 (el campo V4ADDR) | [RFC 3056, sección 2](https://www.rfc-editor.org/rfc/rfc3056.txt) |
| Teredo | `2001::/32` | dos direcciones: el servidor en los bits 32 a 63 y el cliente, invertido, en los bits 96 a 127 | [RFC 4380, sección 4](https://www.rfc-editor.org/rfc/rfc4380.txt) |

**IPv4-mapped.** `[::ffff:127.0.0.1]` es la dirección de loopback con ropa de IPv6. Un navegador no la muestra así: el serializador IPv6 del URL Standard de WHATWG escribe cada pieza de 16 bits como “the shortest possible lowercase hexadecimal number” (el número hexadecimal en minúsculas más corto posible), así que la misma URL vuelve como `[::ffff:7f00:1]` ([WHATWG URL Standard, IPv6 serializer](https://url.spec.whatwg.org/)). Las dos formas se califican como Loopback, riesgo Alto.

**IPv4-compatible.** El RFC 4291 define `::a.b.c.d` con 96 bits a cero delante de la dirección IPv4, y después lo retira: el formato “is now deprecated because the current IPv6 transition mechanisms no longer use these addresses” (ahora está obsoleto porque los mecanismos actuales de transición a IPv6 ya no usan estas direcciones), y la dirección IPv4 que lleva “must be a globally-unique IPv4 unicast address” (debe ser una dirección IPv4 unicast globalmente única) ([RFC 4291, sección 2.5.5.1](https://www.rfc-editor.org/rfc/rfc4291.txt)). El registro no tiene ninguna fila para él. Una pila que todavía acepte el formato llega a la dirección que lleva, así que `[::127.0.0.1]` y su gemela hexadecimal `[::7f00:1]` se califican como Loopback, `[::a9fe:a9fe]` como Metadatos de la nube y `[::8.8.8.8]` como Público; en todos los casos, el resultado dice que el formato está obsoleto. `::` y `::1` tienen sus propias filas en el registro y nunca se leen como IPv4-compatible.

**NAT64 con el prefijo bien conocido.** `[64:ff9b::169.254.169.254]` y su gemela hexadecimal `[64:ff9b::a9fe:a9fe]` llevan la dirección de metadatos link-local, así que se califican como Metadatos de la nube. El RFC 6052 dice “The Well-Known Prefix MUST NOT be used to represent non-global IPv4 addresses” (el prefijo bien conocido no debe usarse para representar direcciones IPv4 no globales) y ordena a los traductores descartar esos paquetes ([RFC 6052, sección 3.1](https://www.rfc-editor.org/rfc/rfc6052.txt)). Aun así, la dirección nombra ese destino interno, y por eso un filtro debe rechazarla en lugar de confiar en todos los traductores del camino. Una dirección con el prefijo bien conocido que lleva una dirección IPv4 pública, como `64:ff9b::8.8.8.8`, se califica como Público, porque el registro marca `64:ff9b::/96` como accesible globalmente.

**NAT64 con el prefijo de uso local.** El RFC 8215 reserva `64:ff9b:1::/48` para la traducción dentro de una red y deja la longitud del prefijo de traducción en manos del operador; los nodos “must not make any assumptions regarding the syntax or properties of those addresses” (no deben suponer nada sobre la sintaxis ni las propiedades de esas direcciones) ([RFC 8215, sección 5](https://www.rfc-editor.org/rfc/rfc8215.txt)). Por eso la herramienta lee la dirección con cada esquema del RFC 6052 que cabe dentro de un /48 (/96, /64, /56 y /48), se queda con la lectura que apunta más hacia dentro (metadatos de la nube y, después, loopback, link-local y privada) y muestra la lectura /96 cuando ninguna lo hace. Todos los esquemas se saltan los bits 64 a 71, y el RFC 6052 dice “These bits MUST be set to zero” (estos bits deben estar a cero) ([RFC 6052, sección 2.2](https://www.rfc-editor.org/rfc/rfc6052.txt)); cuando no son cero, no se decodifica ninguna dirección IPv4. Como el registro de la IANA marca `64:ff9b:1::/48` como no accesible globalmente, una dirección de ese bloque nunca se califica por debajo de Reservado.

**6to4.** El RFC 3056 construye un prefijo de sitio a partir del prefijo `2002` de 16 bits y la dirección IPv4 de 32 bits del sitio, escrito `2002:V4ADDR::/48` ([RFC 3056, sección 2](https://www.rfc-editor.org/rfc/rfc3056.txt)). Por eso `[2002:7f00:1::]` lleva `127.0.0.1` y se califica como Loopback; `[2002:a9fe:a9fe::1]` lleva la dirección de metadatos.

**Teredo.** Una dirección Teredo tiene cinco partes: “Prefix”, “Server IPv4”, “Flags”, “Port” y “Client IPv4” ([RFC 4380, sección 4](https://www.rfc-editor.org/rfc/rfc4380.txt)). El prefijo es `2001:0000:/32` (sección 2.6). La dirección del servidor va tal cual en los bits 32 a 63. El puerto y la dirección asignados al cliente van ofuscados: “Each bit in the address and port number is reversed; this can be done by an exclusive OR of the 16-bit port number with the hexadecimal value 0xFFFF, and an exclusive OR of the 32-bit address with the hexadecimal value 0xFFFFFFFF” (cada bit de la dirección y del puerto se invierte, lo que se puede hacer con un OR exclusivo de cada uno con un valor de todo unos) (sección 4). El RFC 5991 redefinió más tarde el campo Flags con bits aleatorios, pero dejó como estaban los campos del servidor y del cliente ([RFC 5991, sección 3.1](https://www.rfc-editor.org/rfc/rfc5991.txt)). La herramienta deshace el XOR, califica las dos direcciones IPv4, deja que decida la más interna (en caso de empate gana el servidor) y muestra el servidor, el cliente, el puerto del cliente y los flags. `[2001:0:808:808:0:feae:80ff:fffe]` tiene el servidor `8.8.8.8` y el cliente `127.0.0.1` (`0x80fffffe` XOR `0xffffffff`), así que se califica como Loopback; `[2001:0:808:808:0:feae:fefd:fcfb]` lleva el cliente `1.2.3.4` en el puerto 337, el mismo par que usa el RFC 4380 en su propio ejemplo de ofuscación (sección 5.1.1), y se califica como Público. El RFC 4380 añade que “the identifiers used in global addresses MUST include a global scope unicast IPv4 address” (los identificadores de las direcciones globales deben incluir una dirección IPv4 unicast de ámbito global) (sección 4), así que una dirección Teredo que lleva una interna nombra un destino que ninguna dirección Teredo válida debería llevar.

**Lo que no decodifica: 6a44.** El RFC 6751 construye una dirección 6a44 a partir de “the 6a44-network IPv6 prefix C (a /48 the ISP has assigned to its 6a44 relays)” (el prefijo C de la red, un bloque que el ISP asignó a sus relays), seguido de la dirección IPv4 de la sede del cliente, un puerto y la dirección IPv4 local del cliente ([RFC 6751, sección 5](https://www.rfc-editor.org/rfc/rfc6751.txt)). Como cada ISP elige su /48, ningún prefijo fijo identifica una dirección 6a44, y la herramienta no puede distinguirla de cualquier otra dirección sin la configuración de ese ISP. Sí nombra el lado IPv4: `192.88.99.2` es la dirección anycast de los relays 6a44 (sección 8).

## Cada bloque de uso especial, con el nombre que le dan los registros de la IANA

La herramienta incluye todas las filas de los registros IPv4 Special-Purpose Address Space e IPv6 Special-Purpose Address Space de la IANA ([CSV de IPv4](https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry-1.csv) y [CSV de IPv6](https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry-1.csv), ambos actualizados por última vez el 2025-10-09 y consultados el 2026-10-26): 25 filas de IPv4 y 25 de IPv6. La Calculadora CIDR / de subredes lee la misma copia de las filas de IPv4. Una dirección se compara con la fila más específica que la cubre, y el resultado muestra el bloque, el nombre del registro y el RFC, literalmente. El registro define Globally Reachable como “whether an IP datagram whose destination address is drawn from the allocated special-purpose address block is forwardable beyond a specified administrative domain” (si un datagrama IP cuya dirección de destino pertenece al bloque de uso especial asignado puede reenviarse más allá de un dominio administrativo concreto), y la calificación lo sigue:

- **Globally Reachable False** se califica como **Reservado** (riesgo Alto en la escala de esta herramienta), salvo que la fila tenga una categoría más reveladora: Loopback, Red privada, Link-local o NAT de nivel de operador.
- **Globally Reachable True** se califica como **Público** (riesgo Bajo), y el bloque se sigue nombrando, así que nada del registro acaba en un “Público” anónimo.
- **Sin valor** ocurre de dos formas. Para las filas de incrustación (6to4, Teredo), el registro dice N/A y remite al RFC, así que decide la dirección IPv4 que llevan. Para las dos filas obsoletas, el registro no tiene ningún booleano, y la herramienta las califica como Reservado: el RFC 7526 dice “The prefix 192.88.99.0/24 MUST NOT be reassigned for other use except by a future IETF Standards Action” (ese prefijo no debe reasignarse a otro uso salvo por una futura Standards Action del IETF) y deja constancia de que “The Boolean values for the address block 192.88.99.0/24 have been removed” (se han eliminado los valores booleanos de ese bloque) ([RFC 7526, secciones 4 y 7](https://www.rfc-editor.org/rfc/rfc7526.txt)), y `2001:10::/28` está dentro de `2001::/23`, que no es accesible globalmente “Unless allowed by a more specific allocation” (salvo que lo permita una asignación más específica) (nota [1] del registro).

Los bloques multicast `224.0.0.0/4` y `ff00::/8` no son filas de uso especial (tienen registros propios) y aun así se califican como Reservado, sin una fila nombrada.

### IPv4

| Bloque | Nombre de la IANA | RFC | Globally Reachable | Calificación |
|---|---|---|---|---|
| `0.0.0.0/8` | “This network” | RFC 791, Section 3.2 | False | Reservado, Alto |
| `0.0.0.0/32` | “This host on this network” | RFC 1122, Section 3.2.1.3 | False | Reservado, Alto |
| `10.0.0.0/8` | Private-Use | RFC 1918 | False | Red privada, Alto |
| `100.64.0.0/10` | Shared Address Space | RFC 6598 | False | CGNAT, Medio |
| `127.0.0.0/8` | Loopback | RFC 1122, Section 3.2.1.3 | False | Loopback, Alto |
| `169.254.0.0/16` | Link Local | RFC 3927 | False | Link-local, Alto (`169.254.169.254`: Metadatos de la nube) |
| `172.16.0.0/12` | Private-Use | RFC 1918 | False | Red privada, Alto |
| `192.0.0.0/24` | IETF Protocol Assignments | RFC 6890, Section 2.1 | False | Reservado, Alto |
| `192.0.0.0/29` | IPv4 Service Continuity Prefix | RFC 7335 | False | Reservado, Alto |
| `192.0.0.8/32` | IPv4 dummy address | RFC 7600 | False | Reservado, Alto |
| `192.0.0.9/32` | Port Control Protocol Anycast | RFC 7723 | True | Público, Bajo, servicio anycast |
| `192.0.0.10/32` | Traversal Using Relays around NAT Anycast | RFC 8155 | True | Público, Bajo, servicio anycast |
| `192.0.0.170/32`, `192.0.0.171/32` | NAT64/DNS64 Discovery | RFC 8880; RFC 7050, Section 2.2 | False | Reservado, Alto |
| `192.0.2.0/24` | Documentation (TEST-NET-1) | RFC 5737 | False | Reservado, Alto |
| `192.31.196.0/24` | AS112-v4 | RFC 7535 | True | Público, Bajo |
| `192.52.193.0/24` | AMT | RFC 7450 | True | Público, Bajo |
| `192.88.99.0/24` | Deprecated (6to4 Relay Anycast) | RFC 7526 | ninguno | Reservado, Alto |
| `192.88.99.2/32` | 6a44-relay anycast address | RFC 6751 | False | Reservado, Alto, servicio anycast |
| `192.168.0.0/16` | Private-Use | RFC 1918 | False | Red privada, Alto |
| `192.175.48.0/24` | Direct Delegation AS112 Service | RFC 7534 | True | Público, Bajo |
| `198.18.0.0/15` | Benchmarking | RFC 2544 | False | Reservado, Alto |
| `198.51.100.0/24` | Documentation (TEST-NET-2) | RFC 5737 | False | Reservado, Alto |
| `203.0.113.0/24` | Documentation (TEST-NET-3) | RFC 5737 | False | Reservado, Alto |
| `240.0.0.0/4` | Reserved | RFC 1112, Section 4 | False | Reservado, Alto |
| `255.255.255.255/32` | Limited Broadcast | RFC 8190; RFC 919, Section 7 | False | Reservado, Alto |

Dentro de `192.0.0.0/24` decide la nota del registro: el /24 es “Not useable unless by virtue of a more specific reservation” (no utilizable salvo en virtud de una reserva más específica), así que gana la fila más específica. `100.100.100.200`, una dirección de metadatos de la nube, está en Shared Address Space y se califica como Metadatos de la nube con esa fila nombrada.

### IPv6

| Bloque | Nombre de la IANA | RFC | Globally Reachable | Calificación |
|---|---|---|---|---|
| `::1/128` | Loopback Address | RFC 4291 | False | Loopback, Alto |
| `::/128` | Unspecified Address | RFC 4291 | False | Reservado, Alto |
| `::ffff:0:0/96` | IPv4-mapped Address | RFC 4291 | False | según la dirección IPv4 que lleva |
| `64:ff9b::/96` | IPv4-IPv6 Translat. | RFC 6052 | True | según la dirección IPv4 que lleva |
| `64:ff9b:1::/48` | IPv4-IPv6 Translat. | RFC 8215 | False | según la dirección IPv4 que lleva, nunca por debajo de Reservado |
| `100::/64` | Discard-Only Address Block | RFC 6666 | False | Reservado, Alto |
| `100:0:0:1::/64` | Dummy IPv6 Prefix | RFC 9780 | False | Reservado, Alto |
| `2001::/23` | IETF Protocol Assignments | RFC 2928 | False | Reservado, Alto |
| `2001::/32` | TEREDO | RFC 4380; RFC 8190 | N/A | según la más interna de las dos direcciones IPv4 que lleva |
| `2001:1::1/128` | Port Control Protocol Anycast | RFC 7723 | True | Público, Bajo, servicio anycast |
| `2001:1::2/128` | Traversal Using Relays around NAT Anycast | RFC 8155 | True | Público, Bajo, servicio anycast |
| `2001:1::3/128` | DNS-SD Service Registration Protocol Anycast | RFC 9665 | True | Público, Bajo, servicio anycast |
| `2001:2::/48` | Benchmarking | RFC 5180; RFC Errata 1752 | False | Reservado, Alto |
| `2001:3::/32` | AMT | RFC 7450 | True | Público, Bajo |
| `2001:4:112::/48` | AS112-v6 | RFC 7535 | True | Público, Bajo |
| `2001:10::/28` | Deprecated (previously ORCHID) | RFC 4843 | ninguno | Reservado, Alto |
| `2001:20::/28` | ORCHIDv2 | RFC 7343 | True | Público, Bajo |
| `2001:30::/28` | Drone Remote ID Protocol Entity Tags (DETs) Prefix | RFC 9374 | True | Público, Bajo |
| `2001:db8::/32` | Documentation | RFC 3849 | False | Reservado, Alto |
| `2002::/16` | 6to4 | RFC 3056 | N/A | según la dirección IPv4 que lleva |
| `2620:4f:8000::/48` | Direct Delegation AS112 Service | RFC 7534 | True | Público, Bajo |
| `3fff::/20` | Documentation | RFC 9637 | False | Reservado, Alto |
| `5f00::/16` | Segment Routing (SRv6) SIDs | RFC 9602 | False | Reservado, Alto |
| `fc00::/7` | Unique-Local | RFC 4193; RFC 8190 | False | Red privada, Alto (`fd00:ec2::254`: Metadatos de la nube) |
| `fe80::/10` | Link-Local Unicast | RFC 4291 | False | Link-local, Alto |

Algunas filas merecen un comentario. El prefijo para pruebas de rendimiento (benchmarking) es `2001:2::/48` porque la errata 1752 corrigió el RFC 5180, que había impreso `2001:0200::/48`; la errata dice “The IANA has assigned 2001:0002::/48 for IPv6 benchmarking” ([RFC Errata 1752](https://www.rfc-editor.org/errata/eid1752)). `5f00::/16` contiene identificadores de segmento de Segment Routing sobre IPv6, y las especificaciones de SRv6 “are intended to be applicable to a contained SR Domain or between collaborating SR Domains” (están pensadas para aplicarse dentro de un dominio SR acotado o entre dominios SR que colaboran) ([RFC 9602, sección 5](https://www.rfc-editor.org/rfc/rfc9602.txt)). `100:0:0:1::/64` es el prefijo IPv6 ficticio que el RFC 9780 recomienda en lugar de “an IPv4 loopback address mapped to IPv6” (una dirección de loopback IPv4 asignada a IPv6) ([RFC 9780, Abstract](https://www.rfc-editor.org/rfc/rfc9780.txt)). Las direcciones ORCHIDv2 y DET son identificadores, no localizadores: los ORCHID “are considered non-routable addresses from the IPv6-layer perspective” (se consideran direcciones no enrutables desde el punto de vista de la capa IPv6) ([RFC 7343, Abstract](https://www.rfc-editor.org/rfc/rfc7343.txt)) y los HHIT “are valid, though non-routable, IPv6 addresses” (son direcciones IPv6 válidas, aunque no enrutables) ([RFC 9374, sección 1](https://www.rfc-editor.org/rfc/rfc9374.txt)). Aun así, el registro marca los dos bloques como accesibles globalmente, así que la herramienta sigue al registro y los califica como Público, con el bloque nombrado. Para los prefijos de documentación, el RFC 3849 deja clara la intención: “This assignment implies that IPv6 network operators should add this address prefix to the list of non-routeable IPv6 address space” (esta asignación implica que los operadores de redes IPv6 deberían añadir este prefijo a la lista de espacio de direcciones IPv6 no enrutable) ([RFC 3849, sección 3](https://www.rfc-editor.org/rfc/rfc3849.txt)).

## Las direcciones de servicio anycast, y por qué se califican como públicas

Cinco filas son direcciones de servicio anycast que el registro marca como accesibles globalmente: `192.0.0.9` y `2001:1::1` para el Port Control Protocol, `192.0.0.10` y `2001:1::2` para TURN, y `2001:1::3` para el DNS-SD Service Registration Protocol. Una sexta, `192.88.99.2`, es la dirección anycast de los relays 6a44, que el registro marca como no accesible globalmente. La herramienta mantiene la calificación que se deriva del registro (Público para las cinco primeras, Reservado para la sexta), pero nombra el bloque y añade una alerta que dice que es una dirección de servicio anycast de uso especial, para que quien lee lo vea.

¿Por qué señalarlas? Una dirección anycast no es una sola máquina: “A packet sent to an anycast address is delivered to the ‘topologically nearest’ network interface with the anycast address” (un paquete enviado a una dirección anycast se entrega a la interfaz de red más cercana topológicamente que tenga esa dirección) ([RFC 8155, sección 6](https://www.rfc-editor.org/rfc/rfc8155.txt)). En PCP se trata, a propósito, de un middlebox cercano: las direcciones permiten a los clientes “transmit signaling messages to their closest PCP-aware on-path NAT, firewall, or other middlebox” (enviar mensajes de señalización al NAT, firewall u otro middlebox compatible con PCP más cercano en su ruta) ([RFC 7723, Abstract](https://www.rfc-editor.org/rfc/rfc7723.txt)). `2001:1::3` es “a fixed anycast address that can be commonly used as a destination for SRP Updates when no SRP registrar is explicitly configured” (una dirección anycast fija que puede usarse como destino de los SRP Updates cuando no hay ningún registrador SRP configurado de forma explícita) ([RFC 9665, sección 10.5](https://www.rfc-editor.org/rfc/rfc9665.txt)). Un servidor que obtiene una de estas URL puede, por tanto, hablar con equipos de su propia ruta de red, algo que una calificación de Público por sí sola ocultaría. La calificación sigue siendo Público porque es lo que dice el registro; la alerta está para que una lista de permitidos nombre estas direcciones de forma explícita en lugar de dejarlas pasar como hosts normales de internet. La alerta también sigue a una incrustación: `[64:ff9b::192.0.0.9]` se califica como Público y lleva la alerta, porque la dirección que lleva es la dirección anycast de PCP.

## Ejemplos resueltos

Los vectores de referencia de la herramienta fijan todos los ejemplos siguientes, junto con un vector por cada fila del registro.

| Entrada | Calificación | Por qué |
|---|---|---|
| `http://2852039166/latest/meta-data/` | Metadatos de la nube, Alto | forma decimal de `169.254.169.254` (el botón Ejemplo) |
| `http://[::ffff:7f00:1]/` | Loopback, Alto | IPv4-mapped, lleva `127.0.0.1` |
| `http://[0:0:0:0:0:0:0:1]/` | Loopback, Alto | una forma expandida de `::1` |
| `http://[::7f00:1]/` | Loopback, Alto | IPv4-compatible (obsoleto), lleva `127.0.0.1` |
| `http://[64:ff9b::169.254.169.254]/` | Metadatos de la nube, Alto | NAT64 con el prefijo bien conocido, lleva `169.254.169.254` |
| `http://[2002:7f00:1::]/` | Loopback, Alto | 6to4, lleva `127.0.0.1` |
| `http://[2001:0:808:808:0:feae:80ff:fffe]/` | Loopback, Alto | Teredo, el cliente lleva `127.0.0.1` |
| `http://[2001:0:a9fe:a9fe:8000:feae:fefd:fcfb]/` | Metadatos de la nube, Alto | Teredo, el servidor es `169.254.169.254` |
| `http://[2001:2::1]/` | Reservado, Alto | Benchmarking, `2001:2::/48` |
| `http://[5f00::1]/` | Reservado, Alto | Segment Routing (SRv6) SIDs, `5f00::/16` |
| `http://192.88.99.1/` | Reservado, Alto | Deprecated (6to4 Relay Anycast), sin valor de Globally Reachable |
| `http://192.0.0.10/` | Público, Bajo, con alerta | dirección de servicio anycast de TURN |
| `http://[2001:1::3]/` | Público, Bajo, con alerta | dirección anycast del DNS-SD Service Registration Protocol |
| `http://192.31.196.1/` | Público, Bajo, con el bloque nombrado | AS112-v4 |

## Esquemas, credenciales y lo que no se sabe

Además de la dirección, la herramienta señala los esquemas de URL peligrosos (los que van más allá de `http` y `https` y de los que suelen abusar las cargas útiles de SSRF) y las credenciales incrustadas con la forma `user:pass@host`. Hay algo en lo que se esfuerza por ser honesta: un nombre de host sin más que no es un nombre especial conocido se indica como resuelto en tiempo de ejecución, sin adivinar, porque la herramienta nunca resuelve el DNS. Es la respuesta veraz, y también es la razón de que la herramienta sea segura: clasifica lo que dice la URL en lugar de salir a buscarlo.

## Uso

Pega una URL, o presiona Ejemplo, y lee su clasificación, el destino decodificado, la dirección IPv4 incrustada con su propia fila del registro, las dos direcciones Teredo cuando hay dos, el bloque de uso especial, cualquier alerta de anycast o de obsolescencia, cualquier esquema o credencial señalados y el nivel de riesgo de SSRF. Todo se calcula en local; nunca se hace ninguna solicitud.

## Compartir resultados

Después de la respuesta (el veredicto, los datos y las alertas), **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` la URL con la contraseña que haya antes de su `@` sustituida por `[redacted]`. El [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.2.1, consultado el 2026-11-01) declara obsoleto `user:password` en la información de usuario (userinfo) y dice que las aplicaciones “should not render as clear text any data after the first colon” (no deberían mostrar en claro nada de lo que va después de los primeros dos puntos). La página nunca muestra la información de usuario, solo que existe, así que la copia se lee igual; se vuelve a clasificar antes de ofrecer el enlace y, cuando no se leería igual (una URL sin `//`, cuya “contraseña” la página muestra como parte de la ruta), no hay enlace y la ventana emergente te pide que la quites. Un nombre de usuario solo va tal como se escribió, porque puede ser precisamente el truco que se estudia (`http://expected-host@internal/`); la ventana emergente lo indica por si es un token. Un JWT o un ID de clave de acceso de AWS en la ruta o en la cadena de consulta bloquean el enlace, y un nombre como `access_token=` en la cadena de consulta se indica en la ventana emergente. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** La URL rellena el cuadro como lo haría un pegado y la página la clasifica, en local: sin consulta DNS y sin ninguna solicitud. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.

## API

El mismo motor responde a la operación `/api/v1/ssrf-url-classifier` de la API HTTP del sitio, descrita campo por campo en el contrato OpenAPI de la [página de la API](/api), con ejemplos tomados de los vectores de referencia. El contrato también indica si este sitio sirve la API.

- **Solicitud.** La URL o el host como texto: `?input=` en un GET, o como cuerpo de un POST.
- **Respuesta.** Las partes de la URL (`scheme`, `host`, `port`, `path`, `hasUserinfo`, `schemeFlag`), la dirección (`isIp`, `ipVersion`, `canonicalIp`, `obfuscated`, `obfuscationForm`), la calificación (`category`, `risk`, `reasons` en inglés) y la decodificación: `embedding` (`ipv4-mapped`, `ipv4-compatible`, `nat64-wkp`, `nat64-local`, `6to4`, `teredo` o `null`), `embeddedIpv4` (la dirección que decide), `embeddingLayout`, `specialBlock` y `embeddedSpecialBlock` (cada uno `{prefix, name, rfc, globallyReachable}` o `null`), `teredo` (`serverIpv4`, `clientIpv4`, `clientPort`, `flags`, o `null`) y `anycastService`. Para `http://[2001:0:808:808:0:feae:80ff:fffe]/`, la API responde `loopback` / `high`, con el servidor `teredo` `8.8.8.8`, el cliente `127.0.0.1`, el puerto 337 y los flags 0, y `embeddedSpecialBlock` `127.0.0.0/8` “Loopback”.
- **Errores.** Solo se rechaza una entrada vacía: HTTP 400. Un host que la herramienta no puede situar no es un error; se califica como `unresolved` o `internal-name`.

`embedding`, `embeddedIpv4`, `embeddingLayout` y `specialBlock` se añadieron el 2026-10-19; ese mismo día, más tarde, `embedding` ganó `ipv4-compatible` y `teredo`, `specialBlock` pasó a cubrir todas las filas del registro, se añadieron `embeddedSpecialBlock`, `teredo` y `anycastService`, y `canonicalIp` para una dirección IPv4-compatible pasó a la notación mixta (`::127.0.0.1`).

## Fuentes

- [IANA, IPv4 Special-Purpose Address Space, CSV, registro actualizado por última vez el 2025-10-09](https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry-1.csv) (consultado el 2026-10-26): las 25 filas; la nota [2], de la [edición XML](https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry.xml)
- [IANA, IPv6 Special-Purpose Address Space, CSV, registro actualizado por última vez el 2025-10-09](https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry-1.csv) (consultado el 2026-10-26): las 25 filas; las notas [1] a [4] y la definición de Globally Reachable, de la [edición XML](https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry.xml)
- [RFC 4291, IP Version 6 Addressing Architecture, febrero de 2006](https://www.rfc-editor.org/rfc/rfc4291.txt) (consultado el 2026-10-19): sección 2.2 (formas de texto), secciones 2.5.5.1 y 2.5.5.2 (IPv4-compatible e IPv4-mapped)
- [RFC 5952, A Recommendation for IPv6 Address Text Representation, agosto de 2010](https://www.rfc-editor.org/rfc/rfc5952.txt) (consultado el 2026-10-19): secciones 4 y 5
- [RFC 6052, IPv6 Addressing of IPv4/IPv6 Translators, octubre de 2010](https://www.rfc-editor.org/rfc/rfc6052.txt) (consultado el 2026-10-19): secciones 2.1 a 2.4 y 3.1
- [RFC 8215, Local-Use IPv4/IPv6 Translation Prefix, agosto de 2017](https://www.rfc-editor.org/rfc/rfc8215.txt) (consultado el 2026-10-19): secciones 1, 4.1 y 5
- [RFC 3056, Connection of IPv6 Domains via IPv4 Clouds, febrero de 2001](https://www.rfc-editor.org/rfc/rfc3056.txt) (consultado el 2026-10-19): sección 2
- [RFC 4380, Teredo: Tunneling IPv6 over UDP through Network Address Translations (NATs), febrero de 2006](https://www.rfc-editor.org/rfc/rfc4380.txt) (consultado el 2026-10-19): secciones 2.6 y 4
- [RFC 5991, Teredo Security Updates, septiembre de 2010](https://www.rfc-editor.org/rfc/rfc5991.txt) (consultado el 2026-10-19): sección 3.1
- [RFC 6751, Native IPv6 behind IPv4-to-IPv4 NAT Customer Premises Equipment (6a44), octubre de 2012](https://www.rfc-editor.org/rfc/rfc6751.txt) (consultado el 2026-10-19): secciones 5 y 8
- [RFC 7526, Deprecating the Anycast Prefix for 6to4 Relay Routers, mayo de 2015](https://www.rfc-editor.org/rfc/rfc7526.txt) (consultado el 2026-10-19): secciones 4 y 7
- [RFC 7723, Port Control Protocol (PCP) Anycast Addresses, enero de 2016](https://www.rfc-editor.org/rfc/rfc7723.txt) (consultado el 2026-10-19): Abstract y sección 1
- [RFC 8155, Traversal Using Relays around NAT (TURN) Server Auto Discovery, abril de 2017](https://www.rfc-editor.org/rfc/rfc8155.txt) (consultado el 2026-10-19): secciones 6 y 8
- [RFC 9665, Service Registration Protocol for DNS-Based Service Discovery, junio de 2025](https://www.rfc-editor.org/rfc/rfc9665.txt) (consultado el 2026-10-19): sección 10.5
- [RFC Errata 1752 for RFC 5180, IPv6 Benchmarking Methodology for Network Interconnect Devices](https://www.rfc-editor.org/errata/eid1752) (consultado el 2026-10-19): el prefijo de benchmarking corregido
- [RFC 7343, An IPv6 Prefix for Overlay Routable Cryptographic Hash Identifiers Version 2 (ORCHIDv2), septiembre de 2014](https://www.rfc-editor.org/rfc/rfc7343.txt) (consultado el 2026-10-19): Abstract
- [RFC 9374, DRIP Entity Tag (DET) for Unmanned Aircraft System Remote ID (UAS RID), marzo de 2023](https://www.rfc-editor.org/rfc/rfc9374.txt) (consultado el 2026-10-19): sección 1
- [RFC 9602, Segment Routing over IPv6 (SRv6) Segment Identifiers in the IPv6 Addressing Architecture, octubre de 2024](https://www.rfc-editor.org/rfc/rfc9602.txt) (consultado el 2026-10-19): secciones 5 y 6
- [RFC 9780, Bidirectional Forwarding Detection (BFD) for Multipoint Networks over Point-to-Multipoint MPLS Label Switched Paths (LSPs), mayo de 2025](https://www.rfc-editor.org/rfc/rfc9780.txt) (consultado el 2026-10-19; MPLS son las siglas de Multiprotocol Label Switching): Abstract
- [RFC 3849, IPv6 Address Prefix Reserved for Documentation, julio de 2004](https://www.rfc-editor.org/rfc/rfc3849.txt) (consultado el 2026-10-19): secciones 2 y 3
- [RFC 9637, Expanding the IPv6 Documentation Space, agosto de 2024](https://www.rfc-editor.org/rfc/rfc9637.txt) (consultado el 2026-10-19): Abstract e IANA Considerations
- [RFC 6666, A Discard Prefix for IPv6, agosto de 2012](https://www.rfc-editor.org/rfc/rfc6666.txt) (consultado el 2026-10-19): secciones 2 y 4
- [RFC 7050, Discovery of the IPv6 Prefix Used for IPv6 Address Synthesis, noviembre de 2013](https://www.rfc-editor.org/rfc/rfc7050.txt) (consultado el 2026-10-19): sección 2.2
- [WHATWG, URL Standard, Living Standard actualizado por última vez el 19 de octubre de 2026](https://url.spec.whatwg.org/) (consultado el 2026-10-19): el serializador IPv6
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax, enero de 2005](https://www.rfc-editor.org/rfc/rfc3986) (consultado el 2026-11-01): sección 3.5, el fragmento, y sección 3.2.1, la contraseña de la información de usuario
