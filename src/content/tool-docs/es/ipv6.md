## Qué hace

Analiza una dirección o un prefijo IPv6 y míralo desde todos los ángulos: su forma canónica abreviada y su forma totalmente expandida, qué tipo de dirección es, los cálculos de prefijo de un bloque, la dirección MAC de hardware si hay una incrustada en el identificador de interfaz, los campos de una dirección Teredo y el nombre de DNS inverso que apunta de vuelta a ella. Todo se calcula en tu navegador.

## Formas canónica y expandida

Una dirección IPv6 tiene 128 bits y se escribe como ocho grupos de cuatro dígitos hexadecimales separados por dos puntos. La misma dirección puede escribirse de muchas formas, así que el RFC 5952 define una forma canónica: en minúsculas, sin los ceros a la izquierda de cada grupo y con la única secuencia más larga de grupos a cero comprimida en `::`. La herramienta muestra esa forma canónica y, a su lado, la forma totalmente expandida con todos los grupos escritos completos, que es la versión que quieres cuando necesitas ver los 128 bits o alinear direcciones por columnas. Por ejemplo, `2001:0db8:0000:0000:0000:0000:0000:0001` es la forma expandida de `2001:db8::1`, que es a su vez su forma canónica. Una dirección IPv4-mapped conserva la notación mixta que recomienda la sección 5 del RFC 5952 (`::ffff:192.0.2.128`), mientras que la forma expandida es siempre de ocho grupos hexadecimales.

## Clasificación y cálculos de prefijo

No todas las direcciones son públicas normales. La herramienta clasifica los rangos de uso especial, cada uno comprobado con el IANA IPv6 Special-Purpose Address Registry:

| Bloque | Se muestra como | Definido en |
| --- | --- | --- |
| `::1/128` | Loopback | RFC 4291 |
| `::/128` | Sin especificar | RFC 4291 |
| `::ffff:0:0/96` | IPv4-mapped | RFC 4291 |
| `64:ff9b::/96` | Traducción IPv4/IPv6 | RFC 6052 |
| `64:ff9b:1::/48` | Traducción IPv4/IPv6 (uso local) | RFC 8215 |
| `100::/64` | Solo descarte | RFC 6666 |
| `2001::/32` | Teredo | RFC 4380 |
| `2001:db8::/32` | Documentación | RFC 3849 |
| `2002::/16` | 6to4 | RFC 3056 |
| `3fff::/20` | Documentación | RFC 9637 |
| `5f00::/16` | SID de Segment Routing (SRv6) | RFC 9602 |
| `fc00::/7` | Unicast local único | RFC 4193 |
| `fe80::/10` | Unicast de enlace local | RFC 4291 |
| `ff00::/8` | Multicast | RFC 4291 |

Todo lo demás dentro de `2000::/3` se indica como unicast global. El registro tiene más filas (por ejemplo, `2001:2::/48` para pruebas de rendimiento y `2001:20::/28` para ORCHIDv2) que esta tabla todavía no recoge, así que una dirección de una de ellas aparece como unicast global.

Cuando le das un prefijo, calcula la dirección de red del bloque, su primera y su última dirección y cuántas direcciones abarca: la misma aritmética que hace la herramienta de CIDR para IPv4, pero sobre un campo de 128 bits.

## Multicast: ámbito, flags y multicast de origen específico

Una dirección multicast empieza por `ff`, seguida de un campo de flags de 4 bits y de un ámbito (scope) de 4 bits (sección 2.7 del RFC 4291). La herramienta nombra el ámbito según el registro de ámbitos de la IANA: interface-local (1), link-local (2), realm-local (3, nombrado por el RFC 7346), admin-local (4), site-local (5), organization-local (8) y global (E). Los valores 0 y F están reservados y se muestran como `reservado (ámbito 0)` y `reservado (ámbito F)`; los valores 6, 7 y del 9 al D están sin asignar y se muestran, por ejemplo, como `sin asignar (ámbito 6)`. Así, `ff0f::1` ya no parece un ámbito válido.

El campo de flags se lee bit a bit como X, R, P y T (sección 4 del RFC 7371): T=1 marca una dirección transitoria; P=1, una dirección basada en un prefijo unicast (RFC 3306); R=1, una dirección con un punto de encuentro (rendezvous point) incrustado (RFC 3956). `ff02::1` muestra `0000 (X=0, R=0, P=0, T=0)`.

Cuando los flags son `0011` y los 16 bits siguientes son cero, la dirección está en `ff3x::/32`, que la sección 1 del RFC 4607 reserva para el multicast de origen específico (SSM, source-specific multicast): “all SSM addresses must have P=1, T=1, and plen=0” (todas las direcciones SSM deben tener P=1, T=1 y plen=0). La herramienta la etiqueta entonces como Multicast de origen específico e indica en qué parte del espacio de ID de grupo está, según el RFC 4607 y el registro de la IANA: de `ff3x::0:0` a `ff3x::3fff:ffff` no son válidas, de `ff3x::4000:0` a `ff3x::7fff:ffff` están reservadas para asignación de la IANA, de `ff3x::8000:0` a `ff3x::ffff:ffff` son para asignación dinámica, y una dirección con un campo de prefijo de red distinto de cero (fuera de `ff3x::/96`) está reservada para un uso futuro de SSM y hoy no es válida. Por ejemplo, `ff3e::8000:1` es SSM de ámbito global en el rango dinámico.

## Teredo

Una dirección Teredo empaqueta en los 128 bits un endpoint de túnel (sección 4 del RFC 4380): el prefijo de 32 bits `2001::/32`, la dirección IPv4 del servidor Teredo en claro (bits del 32 al 63), 16 bits de flags y, después, el puerto UDP externo y la dirección IPv4 externa del cliente, ambos ofuscados: “Each bit in the address and port number is reversed” (cada bit de la dirección y del número de puerto está invertido), es decir, un OR exclusivo con `0xFFFF` para el puerto y con `0xFFFFFFFF` para la dirección. La herramienta deshace el XOR y muestra el servidor, la dirección del cliente, el puerto del cliente y los flags. Lee los flags con la disposición que da la sección 3.1 del RFC 5991 (`|C|z|Random1|U|G|Random2|`), nombrando el bit de cono C y los bits U y G; los doce bits aleatorios se dejan como están.

Ejemplo resuelto con direcciones de documentación: `2001:0:c000:22d:3c5a:63bf:34ff:8eeb` se decodifica como servidor `192.0.2.45` (`c000:022d`), flags `0x3c5a` (C=0, U=0, G=0), puerto del cliente `40000` (`63bf` XOR `ffff` = `9c40`) y cliente `203.0.113.20` (`34ff:8eeb` XOR `ffff:ffff` = `cb00:7114`). El módulo `ipaddress` de Python devuelve el mismo servidor y el mismo cliente en su propiedad `teredo`. El decodificador se ejecuta para una sola dirección (sin longitud de prefijo, o con `/128`); para un bloque como `2001::/32` solo clasifica el rango y hace los cálculos de prefijo.

## EUI-64 y DNS inverso

De la dirección salen dos extras. Si el identificador de interfaz se construyó a partir de la dirección MAC de 48 bits de una tarjeta de red con el método EUI-64 modificado (RFC 4291, apéndice A), la herramienta recupera esa dirección MAC, y por eso existen las extensiones de privacidad, para no filtrarla. Y construye el nombre de DNS inverso de `ip6.arpa`: los nibbles de la dirección en orden inverso, separados por puntos y terminados en `.ip6.arpa`, que es lo que usa una consulta PTR para la dirección.

## Uso

Pega una dirección IPv6 para ver sus formas canónica y expandida, su clasificación, los flags y el ámbito multicast si los hay, los campos Teredo si los hay, la dirección MAC incrustada si la hay y su nombre de DNS inverso, o pega un prefijo para añadir los cálculos del bloque. El análisis es determinista y solo lee la dirección que le das.

## Compartir resultados

Debajo de las formas canónica y expandida, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva el campo de la dirección tal como se escribió (`#input=2001%3Adb8%3A0%3A0%3A8%3A800%3A200c%3A417a`), y nada más. Todo lo que lleva el enlace va después del `#`, que según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27) queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo): el navegador no lo envía al servidor cuando se abre el enlace, pero se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Un enlace lleva como máximo 16.384 caracteres, el límite que el sitio aplica a todo valor después del `#`; una dirección o un prefijo es mucho más corto.
- **Al abrir un enlace.** La dirección rellena el campo como lo haría la escritura y la página la vuelve a decodificar; un texto que no es una dirección recibe el mensaje propio de la página. Se acepte o no, los valores salen después de la propia dirección de la página al instante, sin ninguna solicitud, así que al recargar, con un marcador o con el propio botón Compartir de la página no se lleva nada que no hayas decidido compartir.

## API

El mismo motor responde a la operación `/api/v1/ipv6` de la API HTTP del sitio, descrita campo por campo en el contrato OpenAPI de la [página de la API](/api), con ejemplos tomados de los vectores de referencia. El contrato también indica si este sitio sirve la API.

- **Solicitud.** La dirección o el prefijo como texto: `?input=` en un GET, o el cuerpo de un POST.
- **Respuesta.** `input`, `bytes` (16 números), `compressed`, `expanded`, `prefixLength`, `classification` (`type`, `detail` e `isMulticast`; en toda dirección multicast, también `scope`, `scopeStatus` y `flags`; `ssmRange` para ff3x::/32; `embeddedIpv4` para las formas IPv4-mapped e IPv4-compatible), `prefix` (la aritmética del prefijo, o `null`), `eui64Mac`, `teredo` (`server`, `flags`, `cone`, `port` y `client`, o `null`) y `reverseDns`. Para `2001:0:c000:22d:3c5a:63bf:34ff:8eeb`, la API responde `teredo.server` `192.0.2.45`, `teredo.port` 40000 y `teredo.client` `203.0.113.20`.
- **Errores.** HTTP 400, `invalid_input`, con el mensaje `empty`, `format` o `prefix`.

`scopeStatus`, `flags`, `ssmRange` y `teredo` se añadieron el 2026-10-19.

## Fuentes

- [IANA IPv6 Special-Purpose Address Registry, CSV (registry last updated 2025-10-09)](https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry-1.csv) (consultado el 2026-10-19)
- [IANA IPv6 Multicast Address Space Registry: scopes and SSM group IDs (last updated 2026-04-07)](https://www.iana.org/assignments/ipv6-multicast-addresses/ipv6-multicast-addresses.txt) (consultado el 2026-10-19)
- [RFC 4291: IP Version 6 Addressing Architecture, section 2.7 and Appendix A](https://www.rfc-editor.org/rfc/rfc4291) (consultado el 2026-10-19)
- [RFC 5952: A Recommendation for IPv6 Address Text Representation](https://www.rfc-editor.org/rfc/rfc5952) (consultado el 2026-10-19)
- [RFC 7346: IPv6 Multicast Address Scopes](https://www.rfc-editor.org/rfc/rfc7346) (consultado el 2026-10-19)
- [RFC 7371: Updates to the IPv6 Multicast Addressing Architecture, section 4](https://www.rfc-editor.org/rfc/rfc7371) (consultado el 2026-10-19)
- [RFC 3306: Unicast-Prefix-based IPv6 Multicast Addresses, section 6](https://www.rfc-editor.org/rfc/rfc3306) (consultado el 2026-10-19)
- [RFC 3956: Embedding the Rendezvous Point (RP) Address in an IPv6 Multicast Address](https://www.rfc-editor.org/rfc/rfc3956) (consultado el 2026-10-19)
- [RFC 4607: Source-Specific Multicast for IP, section 1](https://www.rfc-editor.org/rfc/rfc4607) (consultado el 2026-10-19)
- [RFC 4380: Teredo: Tunneling IPv6 over UDP through Network Address Translations (NATs), section 4](https://www.rfc-editor.org/rfc/rfc4380) (consultado el 2026-10-19)
- [RFC 5991: Teredo Security Updates, section 3.1](https://www.rfc-editor.org/rfc/rfc5991) (consultado el 2026-10-19)
- [RFC 9637: Expanding the IPv6 Documentation Space](https://www.rfc-editor.org/rfc/rfc9637) (consultado el 2026-10-19)
- [RFC 9602: Segment Routing over IPv6 (SRv6) Segment Identifiers in the IPv6 Addressing Architecture](https://www.rfc-editor.org/rfc/rfc9602) (consultado el 2026-10-19)
- [RFC 8215: Local-Use IPv4/IPv6 Translation Prefix](https://www.rfc-editor.org/rfc/rfc8215) (consultado el 2026-10-19)
- [RFC 3849: IPv6 Address Prefix Reserved for Documentation](https://www.rfc-editor.org/rfc/rfc3849) (consultado el 2026-10-19)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultado el 2026-10-27): sección 3.5, el fragmento, que lleva los valores de un enlace de Compartir resultados
