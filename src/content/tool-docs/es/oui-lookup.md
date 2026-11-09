## Qué hace

Una dirección MAC es una dirección de hardware de 48 bits que suele escribirse como seis bytes en hexadecimal, por ejemplo `00:1b:54:11:22:33`. Los tres primeros bytes son el identificador único de organización (OUI, Organizationally Unique Identifier), que el IEEE asigna a un fabricante. La herramienta toma una dirección MAC (en cualquier formato habitual) o un OUI suelto, busca el OUI en una instantánea incluida del registro MA-L del IEEE para dar el nombre del fabricante y lee los dos bits con significado del primer byte. También reconoce las direcciones cuyo significado fija un estándar y no un fabricante: asignaciones multicast, routers virtuales VRRP, asignaciones de la IANA y direcciones de grupo conocidas. Todo se ejecuta en tu navegador.

## Los dos bits que importan

El primer byte de una dirección MAC lleva dos flags en sus bits bajos:

- El **bit I/G** (el bit menos significativo) indica unicast cuando vale 0 y multicast cuando vale 1. Una dirección multicast es una dirección de grupo, no la de una sola interfaz.
- El **bit U/L** (el segundo bit menos significativo) indica administración universal cuando vale 0 y local cuando vale 1. Una dirección administrada de forma universal es única en todo el mundo y sale del OUI de un fabricante; una dirección administrada localmente la definió un software (un hipervisor, una interfaz agregada con bonding, una dirección MAC de wifi aleatoria) y no tiene fabricante.

Así que `02:...` está administrada localmente (no hay fabricante que buscar) y `01:...` es multicast. La única excepción estándar es `33-33`, que se ve más abajo: tiene activado el bit Local, pero es la asignación multicast de IPv6, no una dirección elegida por software (RFC 9542, sección 2.3.1).

## Asignaciones multicast

- **Multicast IPv4, de `01-00-5E-00-00-00` a `01-00-5E-7F-FF-FF`.** La sección 6.4 del RFC 1112 asigna un grupo “placing the low-order 23-bits of the IP address into the low-order 23 bits of the Ethernet multicast address 01-00-5E-00-00-00” (copiando los 23 bits bajos de la dirección IP en los 23 bits bajos de esa dirección multicast Ethernet). Una dirección de grupo tiene 28 bits significativos, así que se pierden 5 bits y 32 grupos IPv4 comparten cada dirección MAC. La página explica por qué y enlaza con el asignador de grupos multicast a direcciones MAC con la dirección ya rellenada, que enumera los 32 con los nombres que les da la IANA: `01:00:5e:00:00:01` la comparten `224.0.0.1`, `224.128.0.1`, `225.0.0.1` y así sucesivamente hasta `239.128.0.1`. La API devuelve los 32 en `ipv4Groups`. La mitad superior del bloque no es IPv4: el registro Ethernet Numbers de la IANA asigna el rango de `01-00-5E-80-00-00` a `8F-FF-FF` al multicast de MPLS (conmutación de etiquetas multiprotocolo, Multiprotocol Label Switching), según el RFC 5332, y la herramienta lo indica.
- **Multicast IPv6, `33-33-xx-xx-xx-xx`.** La sección 7 del RFC 2464 envía un paquete multicast IPv6 a “the Ethernet multicast address whose first two octets are the value 3333 hexadecimal and whose last four octets are the last four octets of DST” (la dirección multicast Ethernet cuyos dos primeros octetos valen 3333 en hexadecimal y cuyos cuatro últimos son los cuatro últimos octetos del destino, DST). La herramienta muestra esos 32 bits finales, así que `33:33:00:00:00:01` lleva `0000:0001`, la cola de `ff02::1`.

## VRRP y otras asignaciones de la IANA

La IANA tiene el OUI `00-00-5E`. La sección 7.3 del RFC 9568 forma la dirección MAC de un router virtual VRRP como `00-00-5E-00-01-{VRID}` para IPv4 y `00-00-5E-00-02-{VRID}` para IPv6, donde el VRID es “An integer value (1-255)” (un número entero de 1 a 255). La herramienta muestra, por ejemplo, `Router virtual VRRP (IPv4), VRID 1` para `00:00:5e:00:01:01`, y marca un VRID 0 como fuera de ese rango.

También se reconocen las demás filas con nombre del registro Ethernet Numbers de la IANA, cada una con el RFC que cita el registro (los nombres se muestran tal como los escribe el registro):

| Dirección o rango | Significado | Referencia |
| --- | --- | --- |
| de `00-00-5E-00-00-00` a `00-00-5E-00-00-FF` | Reserved | RFC 9542 |
| `00-00-5E-00-52-00`, `-01` | PacketPWEthA, PacketPWEthB | RFC 6658 |
| `00-00-5E-00-52-02` | BFD for VXLAN | RFC 8971 |
| `00-00-5E-00-52-13` | Proxy Mobile IPv6 | RFC 6543 |
| de `00-00-5E-00-53-00` a `00-00-5E-00-53-FF` | Documentation (unicast) | RFC 9542 |
| `00-00-5E-90-01-00` y `01-00-5E-90-01-00` | TRILL OAM | RFC 7455 |
| de `01-00-5E-80-00-00` a `01-00-5E-8F-FF-FF` | MPLS Multicast | RFC 5332 |
| `01-00-5E-90-00-00` | MPLS-TP p2p | RFC 7213 |
| `01-00-5E-90-00-01` | BFD on Link Aggregation Group (LAG) interfaces | RFC 7130 |
| `01-00-5E-90-00-02`, `-03` | AllL1MI-ISs, AllL2MI-ISs | RFC 8202 |
| de `01-00-5E-90-10-00` a `01-00-5E-90-10-FF` | Documentation (multicast) | RFC 9542 |

## Direcciones de grupo conocidas

| Dirección | Nombre | Estándar |
| --- | --- | --- |
| `01-80-C2-00-00-00` | Bridge Group address / Nearest Customer Bridge group address | IEEE 802.1Q, 802.1X, 802.1AE, 802.1AX |
| `01-80-C2-00-00-01` | IEEE MAC-specific Control Protocols group address | IEEE 802.1Q |
| `01-80-C2-00-00-02` | IEEE 802.3 Slow_Protocols_Multicast address | IEEE 802.1Q, 802.1AX |
| `01-80-C2-00-00-03` | Nearest non-TPMR Bridge group address / IEEE Std 802.1X PAE address | IEEE 802.1Q, 802.1X, 802.1AE, 802.1AX, 802.1BR |
| `01-80-C2-00-00-04` | IEEE MAC-specific Control Protocols group address | IEEE 802.1Q |
| `01-80-C2-00-00-05`, `-06` | Reserved for future standardization | IEEE 802.1Q |
| `01-80-C2-00-00-07` | MEF Forum ELMI protocol group address (not exclusively reserved for this purpose) | IEEE 802.1Q |
| `01-80-C2-00-00-08` | Provider Bridge group address | IEEE 802.1Q |
| `01-80-C2-00-00-09`, `-0A` | Reserved for future standardization | IEEE 802.1Q |
| `01-80-C2-00-00-0B` | EDE-SS PEP Address | IEEE 802.1Q, 802.1X, 802.1AE |
| `01-80-C2-00-00-0C` | Reserved for future standardization | IEEE 802.1Q |
| `01-80-C2-00-00-0D` | Provider Bridge MVRP address | IEEE 802.1Q |
| `01-80-C2-00-00-0E` | Individual LAN Scope group address / Nearest Bridge group address | IEEE 802.1Q, 802.1X, 802.1AE, 802.1AS |
| `01-80-C2-00-00-0F` | Reserved for future standardization | IEEE 802.1Q |
| `01-80-C2-00-00-14` | All Level 1 Intermediate Systems (IS-IS AllL1ISs) | ISO/IEC 10589 |
| `01-80-C2-00-00-15` | All Level 2 Intermediate Systems (IS-IS AllL2ISs) | ISO/IEC 10589 |
| `09-00-2B-00-00-04` | All End System Network Entities (ES-IS AllEndSystems) | ISO 9542 |
| `09-00-2B-00-00-05` | All Intermediate System Network Entities (AllIntermediateSystems) | ISO 9542 |

Los nombres son los de la IEEE Registration Authority (la autoridad de registro del IEEE), tomados de su lista pública de direcciones MAC de grupo estándar. Los valores de IS-IS coinciden con la tabla de constantes del RFC 1142, la republicación de 1990 de ISO DP 10589. Para las 16 direcciones de `01-80-C2-00-00-00` a `0F`, la guía didáctica del IEEE sobre direcciones de grupo estándar dice que las tramas enviadas a ellas “are not relayed by MAC bridges conforming to IEEE 802.1D” (no las retransmiten los puentes MAC conformes con IEEE 802.1D), y la herramienta añade esa nota. Otras direcciones de grupo de `01-80-C2` (por ejemplo, el rango de `01-80-C2-00-00-30` a `3F`, el de los mensajes CCM y Linktrace) todavía no están en la tabla y aparecen como ausentes de la instantánea MA-L.

## Formatos que acepta

Funcionan la forma con dos puntos (`00:1b:54:...`), con guiones (`00-1b-54-...`), la de Cisco con puntos (`001b.5411.2233`) y la que no lleva separadores (`001b5411...`), en mayúsculas o minúsculas, y también un OUI suelto de seis dígitos hexadecimales. Un OUI suelto recibe un significado estándar solo cuando tres bytes bastan para decidirlo (`33-33-xx` siempre es multicast IPv6); `01-00-5E` por sí solo podría ser multicast IPv4 o MPLS, así que la herramienta necesita la dirección completa.

## Sobre los datos

Los nombres de los fabricantes salen de la lista pública MA-L (OUI) del IEEE, incluida en la herramienta como instantánea de un momento concreto. Al ser una instantánea, puede que un bloque asignado hace muy poco todavía no esté, y esta versión cubre el registro MA-L (24 bits), no los bloques más pequeños MA-M (28 bits) ni MA-S (36 bits). La instantánea se carga de forma diferida en tu primera búsqueda, así que la página se abre rápido y nunca se pide nada a un servidor en el momento de buscar. Las direcciones definidas por estándares que se ven arriba son una pequeña tabla fija en el código, con cada fila vinculada a su fuente.

## Uso

Escribe o pega una dirección MAC o un OUI. Una dirección administrada localmente o desconocida se indica tal cual, sin intentar adivinar nada.

## Compartir resultados

Debajo de la lectura, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva la dirección MAC o el OUI tal como se escribió (`#input=00%3A1b%3A54%3A11%3A22%3A33`), y nada más. Todo lo que lleva el enlace va después del `#`, que según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27) queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo): el navegador no lo envía al servidor cuando se abre el enlace, pero se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Un enlace lleva como máximo 16.384 caracteres, el límite que el sitio aplica a todo valor después del `#`; una dirección es mucho más corta.
- **Al abrir un enlace.** El enlace tiene la misma forma que usan otras páginas para pasarle una dirección MAC a esta herramienta: el valor rellena el campo y se busca igual que si lo hubieras pegado (la tabla de fabricantes se carga desde este sitio en la primera búsqueda, como al pegar). Como en todo enlace a esta herramienta, el valor se queda después del `#` hasta que cambias o borras el campo, y entonces sale de la dirección de la página sin ninguna solicitud.

## API

El mismo motor responde a la operación `/api/v1/oui-lookup` de la API HTTP del sitio, descrita campo por campo en el contrato OpenAPI de la [página de la API](/api), con ejemplos tomados de los vectores de referencia. El contrato también indica si este sitio sirve la API.

- **Solicitud.** La dirección MAC o el OUI como texto, en cualquier notación que acepte la página.
- **Respuesta.** `ok`, `input`, `hex`, `formatted`, `oui`, `ouiFormatted`, `vendor` (o `null`), `multicast`, `local`, `isOuiOnly`, `notes` (frases en inglés) y, cuando un estándar o un registro da su significado a la dirección, `wellKnown`: `kind` (`ipv4-multicast`, `ipv6-multicast`, `vrrp-ipv4`, `vrrp-ipv6`, `iana-block` o `group-address`), `name`, `standard` y, según el tipo, `ipv4Groups` (los 32 grupos), `ipv6Low32`, `vrid` o `bridgeFiltered`.
- **Errores.** Una entrada que no es una dirección MAC ni un OUI no es un error HTTP: la API responde `ok: false` con `error.message`.

`wellKnown` se añadió el 2026-10-19.

## Fuentes

- [IEEE Registration Authority: MA-L (OUI) public listing](https://standards-oui.ieee.org/oui/oui.csv) (instantánea del 2026-07-10)
- [RFC 1112: Host Extensions for IP Multicasting, section 6.4](https://www.rfc-editor.org/rfc/rfc1112) (consultado el 2026-10-19)
- [RFC 2464: Transmission of IPv6 Packets over Ethernet Networks, section 7](https://www.rfc-editor.org/rfc/rfc2464) (consultado el 2026-10-19)
- [RFC 9568: Virtual Router Redundancy Protocol (VRRP) Version 3 for IPv4 and IPv6, section 7.3](https://www.rfc-editor.org/rfc/rfc9568) (consultado el 2026-10-19)
- [RFC 9542: IANA Considerations and IETF Protocol and Documentation Usage for IEEE 802 Parameters, sections 2.1.3, 2.1.4 and 2.3.1](https://www.rfc-editor.org/rfc/rfc9542) (consultado el 2026-10-19)
- [IANA Ethernet Numbers registry: IANA Unicast and Multicast 48-bit MAC Addresses (last updated 2026-10-13)](https://www.iana.org/assignments/ethernet-numbers/ethernet-numbers.txt) (consultado el 2026-10-19)
- [IEEE Registration Authority: Standards Group MAC public listing](https://standards.ieee.org/products-programs/regauth/grpmac/public/) (consultado el 2026-10-19)
- [IEEE Registration Authority: Standard Group MAC Addresses: A Tutorial Guide (PDF)](https://standards.ieee.org/wp-content/uploads/import/documents/tutorials/macgrp.pdf) (consultado el 2026-10-19)
- [RFC 1142: OSI IS-IS Intra-domain Routing Protocol (republication of ISO DP 10589)](https://www.rfc-editor.org/rfc/rfc1142) (consultado el 2026-10-19)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultado el 2026-10-27): sección 3.5, el fragmento, que lleva los valores de un enlace de Compartir resultados
