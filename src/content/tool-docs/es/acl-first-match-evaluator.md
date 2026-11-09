## Qué hace

Pega una lista de acceso IPv4 de Cisco IOS o IOS XE tal como la copiarías de una configuración, describe un paquete y la herramienta te dice qué entrada lo decide. Cada entrada que prueba antes de esa aparece con el primer campo que la descartó (protocolo, dirección de origen, puerto de origen, dirección de destino, puerto de destino, `established` o `fragments`); si no coincide ninguna, el paquete llega a la denegación implícita. Una revisión (lint) lee la lista entera, haya paquete o no. Todo se calcula en tu navegador a partir del texto que pegas; nada se aplica a ningún dispositivo.

El alcance es intencionado: **la v1 solo lee la sintaxis IPv4 de Cisco IOS e IOS XE.** Lo que ocurre al final de una lista depende de la plataforma, no de un estándar: Juniper EX termina cada filtro con un descarte implícito, mientras que Extreme Switch Engine y Fabric Engine permiten lo que no coincidió con ninguna regla. El [artículo sobre las ACL](/learn/access-control-lists-on-switches-and-routers) compara las plataformas una al lado de otra, con sus fuentes.

## Qué lee

- **Listas numeradas**: líneas `access-list`, estándar de 1 a 99 y de 1300 a 1999, extendidas de 100 a 199 y de 2000 a 2699, y sus líneas `remark`.
- **Listas con nombre**: un bloque `ip access-list standard NAME` o `ip access-list extended NAME`, entradas con número de secuencia o sin él y líneas `remark`. Un nombre empieza por una letra; un número del rango correcto designa la misma lista que las líneas `access-list` con ese número. Si pegas varias listas, se leen todas; unos botones eligen la que se evalúa.
- **Direcciones**: `any` (0.0.0.0 255.255.255.255), `host A` (A 0.0.0.0), una dirección con su máscara wildcard y, en una entrada estándar, una dirección sola, que toma 0.0.0.0 como máscara. Los bits de la máscara wildcard puestos a 1 se ignoran y no tienen por qué ser contiguos.
- **Protocolos**: `ip` (todos los protocolos), un número de 0 a 255 y las palabras clave cuyo número da una fuente: `icmp` 1, `igmp` 2, `tcp` 6, `udp` 17, `gre` 47, `esp` 50, `eigrp` 88, `pim` 103 (IANA, con la misma palabra clave) y `ospf` 89 (RFC 2328). Cisco también acepta `ahp`, `ipinip`, `nos` y `pcp`; ninguna de las fuentes consultadas da sus números, así que una línea que use una de ellas aparece en la lista con ese motivo, y puedes escribir el número en su lugar.
- **Puertos**, solo después de `tcp` o `udp`: `eq` y `neq` con hasta 10 puertos, `lt`, `gt` y `range` (inclusivo). Un operador detrás del origen prueba el puerto de origen; detrás del destino, el puerto de destino. Un puerto es un número de 0 a 65535 o un nombre de la lista TCP o UDP del modelo de datos de Cisco IOS XE 17.18.1 (`www` es TCP 80, `domain` es 53 en ambos, `snmp` es UDP 161...); un nombre TCP solo sirve con `tcp`, y uno UDP, solo con `udp`.
- **Opciones**: `established` (solo TCP: para coincidir hace falta ACK o RST activado), `fragments` (la entrada solo se aplica a fragmentos no iniciales), `log` y `log-input`.

Las líneas que no lee aparecen debajo del resultado con el motivo; nunca se descartan: grupos de objetos, tipos de mensaje ICMP e IGMP, `dscp`, `precedence`, `tos`, `time-range`, `option`, `ttl`, flags TCP distintos de `established`, entradas `dynamic` y reflexivas, nombres de host, comandos `no`, `ip access-list resequence`, `ip access-group` (donde se aplica una lista) y la salida de `show access-lists`. Si una de esas líneas parece una entrada, el resultado avisa de que el veredicto solo cubre las entradas que se leyeron.

## El recorrido

Cisco evalúa una lista **por número de secuencia**, y decide la primera entrada que coincide; lo que viene después no se lee. La herramienta prueba las entradas en ese orden:

- Una entrada escrita sin número recibe 10 más que el número más alto de su lista (10 si es la primera) y va al final. Un número que ya está en la lista se rechaza (Cisco responde `Duplicate sequence number`), y una entrada igual a otra que ya existe, salvo por el número, no cambia nada; ambas aparecen como líneas no leídas.
- En una lista **estándar**, Cisco guarda en una tabla hash las entradas que nombran un solo host y busca el origen en esa tabla antes de recorrer las demás entradas. El recorrido sigue ese orden y lo indica cuando una entrada de host se prueba antes que un número de secuencia más bajo.
- Una entrada **estándar** solo prueba la dirección de origen: el protocolo, el destino y los puertos del paquete no intervienen.
- Si no coincide nada, el paquete queda denegado por la denegación implícita, que Cisco documenta como la sentencia deny no escrita con la que termina toda lista de acceso.
- Una lista sin entradas no recibe el veredicto de denegación implícita: Cisco documenta que una interfaz con una lista de acceso vacía aplicada permite todo el tráfico.

El paquete de prueba es un paquete sin fragmentar: una entrada con `fragments` nunca coincide con él.

## La revisión (lint)

- **Sombreada (shadowed)**: una entrada anterior coincide con todos los paquetes con los que coincidiría esta, con la acción contraria, así que esta nunca decide nada.
- **Redundante**: una entrada anterior coincide con todos los paquetes con los que coincidiría esta, con la misma acción; o lo hace una entrada posterior y ninguna entrada intermedia decide otra cosa sobre esos paquetes. Quitarla no cambia nada.
- **Solo repite la denegación implícita**: una entrada deny a la que no se superpone ningún permit posterior. No cambia ningún veredicto, aunque su contador (o su `log`) muestra el tráfico.
- **Nunca coincide**: una prueba de puerto que ningún puerto supera, como `lt 0`.
- **Máscara wildcard no contigua**: válida en Cisco; se señala porque ninguna longitud de prefijo puede expresarla y sus direcciones no forman un solo bloque.
- **Bits ignorados**: una dirección con bits a 1 donde su máscara wildcard los ignora (`10.1.1.5 0.0.0.255` coincide con 10.1.1.0/24).
- **Alcance de una lista estándar**: sus entradas solo prueban el origen, así que cada una decide sobre todo lo que envían esos orígenes.

La revisión razona sobre los fragmentos no iniciales además de sobre los paquetes completos, porque Cisco los prueba de otra forma: una entrada deny con puertos o con `established` no se aplica a un fragmento no inicial, y se procesa la entrada siguiente. Por eso, una entrada situada debajo de un deny así se marca como sombreada “para todo paquete sin fragmentar”, con el motivo, en lugar de sombreada sin más.

Cada dirección de cada entrada se muestra tal como se escribió, como dirección y máscara wildcard con los bits ignorados puestos a 0, como prefijo en la notación del RFC 4632 cuando la máscara wildcard es contigua y con el número de direcciones con las que coincide.

## Lo que no puede saber

- Lo que contiene el dispositivo. La herramienta lee el texto que pegas; una línea que no lee puede ser igualmente una entrada en el dispositivo.
- Dónde se aplica la lista y en qué sentido. Que sea una interfaz de puerto, de VLAN o enrutada, de entrada o de salida, cambia qué paquetes llegan siquiera a la lista; el artículo explica los puntos de aplicación.
- Los límites del hardware. Una lista que se lee correctamente puede, aun así, no caber en la TCAM del switch.
- Otras plataformas. Su sintaxis y su final de lista son distintos; la v1 no las lee.

## Ejemplos

El botón Ejemplo carga la lista del laboratorio del capítulo 4.3 del curso LAN Switch Operations and Maintenance: permitir SSH desde 10.1.10.0/24 hacia la red de administración 10.1.99.0/24, denegar todo lo demás hacia 10.1.99.0/24 y permitir el resto, como `ip access-list extended MGMT-PROTECT` con los números de secuencia 10, 20 y 30. Su paquete es SSH desde la VLAN 20 (TCP de 10.1.20.25, puerto 51514, a 10.1.99.10, puerto 22): la entrada 10 falla en la dirección de origen y la entrada 20 lo deniega. Cambia el origen a 10.1.10.25 y la entrada 10 lo permite; intercambia las dos primeras entradas y el SSH desde la VLAN 10 queda denegado, con el permit marcado como sombreado. Los vectores de referencia cubren la primera coincidencia en cada campo, cada operador de puerto en sus límites, listas estándar y extendidas, el orden del hash, números de secuencia desordenados, los dos tipos de redundancia y las líneas no leídas; uno de ellos es el propio ejemplo no contiguo de Extreme Fabric Engine (3.4.5.6 con 255.255.255.0 coincide con 192.168.1.6 y no con 3.4.5.7), escrito a la manera de Cisco.

## API

El mismo motor responde a la operación `/api/v1/acl-first-match-evaluator` de la API HTTP del sitio, descrita en el contrato OpenAPI de la [página de la API](/api), que también indica si este sitio sirve la API.

- **Solicitud.** La lista de acceso como texto (se lee y se revisa) o un objeto JSON `{"acl": "...", "packet": {"protocol": "tcp", "source": "10.1.20.25", "destination": "10.1.99.10", "sourcePort": 51514, "destinationPort": 22, "ackOrRst": false}, "list": "MGMT-PROTECT"}` (y además se recorre para ese paquete). `packet` y `list` son opcionales; los puertos pueden ser números o cadenas.
- **Respuesta.** `lists` (cada una con `name`, `kind`, `line`, `entries`, `evaluationOrder` y `remarks`; cada entrada con `seq`, `seqGiven`, `line`, `text`, `action`, `protocol`, `source`, `sourcePort`, `destination`, `destinationPort`, `established`, `fragments`, `log` y `hashed`; cada dirección con `written`, `form`, `address`, `wildcard`, `base`, `contiguous`, `prefix`, `addresses` e `ignoredBitsSet`), `selected`, `issues` (`line`, `text`, `entryLike`, `reason`), `packet`, `packetErrors`, `steps` (`seq`, `line`, `text`, `action`, `matched`, `field`, `reason`), `verdict` (`action`, `by`: `entry`, `implicit-deny` o `empty-list`, `seq`, `line`, `text`, `sentence`), `lint` (`kind`, `seq`, `line`, `other`, `sentence`), `notes` y `counts`.
- **Errores.** HTTP 400 para una solicitud que empieza por `{` pero no es JSON válido o no tiene la cadena `acl`, y para un texto de más de 65.536 caracteres o 4000 líneas. Una línea o un paquete que no se pueden leer no son un error HTTP: `issues` y `packetErrors` explican el motivo.

## Compartir resultados

Debajo del veredicto, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` la lista de acceso tal como la pegaste (`input`) y el paquete de prueba tal como lo escribiste (`protocol`, `source`, `srcport`, `destination`, `dstport` y `ackrst` si la casilla está marcada), además de `list` si elegiste una lista que no es la primera. Su ventana emergente dice primero qué lleva el enlace, luego da una precaución propia (una lista de acceso nombra redes y hosts internos y lo que puede llegar a ellos) y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

La lista también pasa por la comprobación de secretos del sitio: si un valor es una credencial por su formato (una contraseña en una URL, una clave privada PEM, un JWT), en un remark o en cualquier otra parte, no hay enlace, y la ventana emergente indica su línea. Sustitúyelo por un marcador de posición y vuelve a presionar.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-02), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que sigue al `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** La lista y cada campo del paquete se rellenan como si los hubieras escrito y la página los lee; no se contacta con nada. Un valor del paquete que la herramienta no puede leer muestra el mismo mensaje que al escribirlo. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.

## Fuentes

- [Cisco, Security and VPN Configuration Guide, Cisco IOS XE 17.x: IP Access List Entry Sequence Numbering](https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/sec-vpn/b-security-vpn/m_sec-acl-seq-num.html) (consultado el 2026-11-02; VPN son las siglas de red privada virtual, virtual private network): la primera coincidencia, “If no conditions match, the packet is dropped”, la lista vacía, los números de secuencia asignados de 10 en 10, el rechazo de duplicados, las entradas de host estándar en tabla hash y buscadas primero
- [Cisco, ACLs Configuration Guide, Cisco IOS XE 17 (Catalyst 9000): Access Control Lists](https://www.cisco.com/c/en/us/td/docs/switches/lan/c9000/security/acls/acls-configuration-guide/access-control-lists.html) (consultado el 2026-11-02): el número de secuencia “dictates the order in which ACEs are evaluated”, los remarks, la sintaxis numerada y sus rangos, los operadores de puerto, `established`
- [Cisco IOS Security Command Reference, Commands A to C](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/security/a1/sec-a1-cr-book/sec-cr-a2.html) (consultado el 2026-11-02): `access-list (IP extended)` y `access-list (IP standard)`: protocolos, bits wildcard, operadores y nombres de puerto, `established`, `fragments`, `log`, la denegación implícita
- [Cisco, IOS XE 17.18.1 YANG model Cisco-IOS-XE-acl](https://raw.githubusercontent.com/YangModels/yang/main/vendor/cisco/xe/17181/Cisco-IOS-XE-acl.yang) (consultado el 2026-11-02): `eq` y `neq` con hasta 10 puertos, números de secuencia de 1 a 2147483647, remarks de 1 a 100 caracteres
- [Cisco, IOS XE 17.18.1 YANG model Cisco-IOS-XE-types](https://raw.githubusercontent.com/YangModels/yang/main/vendor/cisco/xe/17181/Cisco-IOS-XE-types.yang) (consultado el 2026-11-02): los rangos de números de lista, los nombres de puerto TCP y UDP con sus números
- [Cisco, End-of-Sale and End-of-Life Announcement for the Cisco IOS XE 17.18.x](https://www.cisco.com/c/en/us/products/collateral/ios-nx-os-software/ios-xe-17/ios-xe-17-18-x-eol.html) (consultado el 2026-11-02): versiones de mantenimiento de software hasta el 29 de abril de 2028, correcciones de seguridad hasta el 30 de septiembre de 2029
- [RFC 4632, Classless Inter-domain Routing (CIDR)](https://www.rfc-editor.org/rfc/rfc4632.txt) (consultado el 2026-11-02): la notación de prefijo y las máscaras contiguas
- [IANA, Assigned Internet Protocol Numbers](https://www.iana.org/assignments/protocol-numbers/protocol-numbers-1.csv) (consultado el 2026-11-02): los números de protocolo que hay detrás de las palabras clave
- [RFC 2328, OSPF Version 2](https://www.rfc-editor.org/rfc/rfc2328.txt) (consultado el 2026-11-02): “OSPF is IP protocol number 89”
- [Juniper Networks, Understanding how firewall filters are evaluated (EX Series)](https://www.juniper.net/documentation/us/en/software/junos/routing-policy/topics/concept/firewall-filter-ex-series-evaluation-understanding.html) (consultado el 2026-11-02): el descarte implícito al final de cada filtro
- [Extreme Networks, Switch Engine v33.7.1 User Guide (PDF)](https://documentation.extremenetworks.com/Switch%20Engine%20v33.7.1%20User%20Guide/downloads/Switch_Engine_33_7_1_User_Guide.pdf) (consultado el 2026-11-02): “If a packet matches no rule entries in the ACL, it is permitted”
- [Extreme Networks, Fabric Engine v9.4 User Guide, access control lists](https://documentation.extremenetworks.com/Fabric%20Engine%20v9.4%20User%20Guide/fe_9.4_ug_revacdev/content/documents/Switch_Operating_Systems/VOSS_and_Fabric_Engine/fabric_engine_user_guide/access_control_lists.shtml) (consultado el 2026-11-02): “The default action mode for ACLs is permit”
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax, section 3.5](https://www.rfc-editor.org/rfc/rfc3986#section-3.5) (consultado el 2026-11-02): el fragmento, en el que se basa Compartir resultados
