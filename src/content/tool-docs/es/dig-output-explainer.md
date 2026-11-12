## Qué hace

Pega la salida de un comando `dig` y la herramienta reconstruye el mensaje DNS que representa, sección por sección, y explica cada parte. Lee el encabezado, la línea de flags y los contadores de las secciones, la pseudosección OPT de EDNS, las cuatro secciones de registros, con cada registro de recurso desglosado en sus campos, y las estadísticas de la consulta del final. Solo analiza el texto: no se resuelve nada ni se envía nada a ningún sitio.

## Por qué hay que decodificar la salida de dig

`dig` imprime una representación fiel pero escueta de un mensaje DNS, y en tokens muy cortos cabe mucho significado. El **encabezado** lleva la operación, un código de estado y un ID de mensaje; la línea de **flags** lleva flags de una sola palabra cuya presencia o ausencia lo cambia todo. `aa` significa que la respuesta es autoritativa, de un servidor responsable de la zona y no de una caché; `rd` significa que se pidió recursión y `ra`, que está disponible; `ad` marca datos validados por DNSSEC; `tc` significa que la respuesta se truncó y debería reintentarse por TCP. El código de estado es lo otro que hay que leer primero: `NOERROR`, `NXDOMAIN` para un nombre que no existe, o `SERVFAIL` para un fallo en el servidor.

## Las secciones y EDNS

Un mensaje DNS tiene cuatro secciones, y dig las etiqueta: **QUESTION** (lo que se preguntó), **ANSWER** (los registros que lo responden), **AUTHORITY** (los servidores de nombres responsables) y **ADDITIONAL** (registros adicionales útiles). La herramienta desglosa cada registro de recurso en sus partes: el nombre, el TTL en segundos (convertido cuando dig lo imprimió con unidades), la clase (casi siempre `IN`), el tipo (`A`, `AAAA`, `MX`, etc.) y los datos del registro. También decodifica la **pseudosección OPT**, la extensión EDNS(0) (RFC 6891) que anuncia cosas como la mayor respuesta UDP que acepta el resolver y la compatibilidad con DNSSEC, y que no es un registro real, sino metadatos sobre el intercambio.

## Las estadísticas

El pie que imprime dig es realmente útil para el diagnóstico: el tiempo de consulta te dice cuánto tardó el resolver, la línea del servidor te dice qué resolver respondió, y el tamaño del mensaje y la marca de tiempo lo completan. Leerlos juntos suele explicar una resolución lenta o sorprendente antes que los propios registros.

## Uso

Pega una respuesta completa de `dig` y lee el encabezado, los flags, las secciones y las estadísticas decodificados. El análisis es determinista y totalmente local; la herramienta nunca hace una resolución por su cuenta.

## Formatos que lee

Además del formato predeterminado, el analizador lee las formas que producen las opciones de salida de dig, cada una fijada por una prueba con salida real de dig 9.20.29:

- `+ttlunits`: los TTL impresos con unidades (`1h30m`, `1d`, `2w`, `4m16s`; el manual enumera s, m, h, d y w) se convierten a segundos y se muestran de las dos formas, por ejemplo `1h30m = 5400s`.
- `+nottlid`: los registros impresos sin columna TTL se leen igualmente, con el TTL marcado como ausente.
- `+multiline`: los registros repartidos entre paréntesis en varias líneas, con comentarios `;`, se vuelven a unir en una sola línea, así que un SOA se sigue desglosando en sus siete campos.
- Opcode 6 y RCODE 11: dig 9.20 no tiene nombre para ellos e imprime `RESERVED6` y `RESERVED11`. La IANA los asignó a DNS Stateful Operations (DSO) y a DSOTYPENI (RFC 8490), y la herramienta muestra los dos nombres.

Para una respuesta negativa (NXDOMAIN, o NOERROR con la sección de respuesta vacía) que lleva el SOA de la zona, la herramienta también calcula el TTL de caché negativa. El RFC 2308, en su sección 5, dice que el servidor autoritativo fija el TTL del SOA en el mínimo entre el propio TTL del SOA y su campo MINIMUM, y que una caché lo descuenta a partir de ahí.

## Ejemplos

El botón Ejemplo y las pruebas usan salida real de dig 9.20.29 capturada el 19 de octubre de 2026, en su mayor parte a través de un relay local que enviaba cada consulta a un resolver público por DNS over HTTPS (la línea SERVER muestra el relay, `127.0.0.1`), y el resto contra un servidor de laboratorio local con una copia de `example.com` con direcciones de documentación, además de un respondedor de laboratorio construido para devolver RCODE 11. Los nombres que no existen están bajo `.invalid`: el RFC 6761, en su sección 6.4, permite a los usuarios dar por hecho que siempre devuelven NXDOMAIN, mientras que `example.com` responde ahora NOERROR sin datos para los nombres que no existen (la denegación compacta del RFC 9824).

## Compartir resultados

Al principio de la lectura, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva la salida de dig tal como se pegó (`#input=...`), y nada más. Antes de que copies nada, la ventana emergente añade una precaución: la salida de dig puede nombrar hosts internos, direcciones y el resolver al que se preguntó, así que léela antes de enviar el enlace. Todo lo que lleva el enlace va después del `#`, que el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27) describe como “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo): el navegador no lo envía al servidor cuando se abre el enlace, pero se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Un enlace lleva como máximo 16.384 caracteres, el límite que el sitio aplica a todo valor después del `#`; si es más largo, no hay enlace, y la ventana emergente indica la longitud que tendría.
- **Al abrir un enlace.** El texto rellena el cuadro como lo haría un pegado y la página vuelve a explicarlo; no se resuelve ni se envía nada. Un texto que no es salida de dig recibe la nota propia de la página. Se acepte o no, los valores salen después de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, con un marcador o con el propio botón Compartir de la página no se lleva nada que no hayas decidido compartir.

## API

El mismo motor responde a la operación `/api/v1/dig-output-explainer` de la API HTTP del sitio, detallada campo por campo en el contrato OpenAPI de la [página de la API](/api), con ejemplos tomados de los vectores de referencia. El contrato también indica si este sitio sirve la API.

- **Solicitud.** La salida de dig como texto, con sus saltos de línea y tabulaciones.
- **Respuesta.** `versionLine`, `digVersion`, `queryArgs`, `header` (`opcode`, `status` e `id` tal como se imprimen, más `opcodeName` o `statusName` cuando dig imprime RESERVED6 o RESERVED11), `flags` con los contadores de las cuatro secciones, `opt`, `sections` (cada registro con `name`, `ttl` en segundos o `null`, `ttlText` cuando dig imprimió el TTL con unidades, `class`, `type`, `rdata` e `isQuestion`), `footer`, `negative` (`owner`, `soaTtl`, `minimum` y `ttl`) para una respuesta negativa con un SOA en AUTHORITY, `warnings` (códigos estables) y `hadHeader`.
- **Errores.** Un texto que no es salida de dig no es un error HTTP: `hadHeader` es `false`.

`ttlText`, `negative`, `opcodeName`, `statusName` y las advertencias `ttl-units` y `ttl-absent` se añadieron el 19 de octubre de 2026; un TTL impreso como `1d` responde ahora `ttl` 86400, cuando antes se leía como 1.

## Fuentes

- [RFC 1035: Domain Names - Implementation and Specification](https://www.rfc-editor.org/rfc/rfc1035) (consultado el 2026-10-19): el formato del mensaje y los flags del encabezado
- [RFC 6891: Extension Mechanisms for DNS (EDNS(0))](https://www.rfc-editor.org/rfc/rfc6891) (consultado el 2026-10-19): la pseudosección OPT
- [RFC 2308: Negative Caching of DNS Queries](https://www.rfc-editor.org/rfc/rfc2308) (consultado el 2026-10-19): la sección 5, el TTL de caché negativa
- [RFC 4034: Resource Records for the DNS Security Extensions](https://www.rfc-editor.org/rfc/rfc4034) (consultado el 2026-10-19): RRSIG, DNSKEY, DS, NSEC
- [RFC 9499: DNS Terminology](https://www.rfc-editor.org/rfc/rfc9499) (marzo de 2024, deja obsoleto el RFC 8499; consultado el 2026-10-19)
- [RFC 8490: DNS Stateful Operations](https://www.rfc-editor.org/rfc/rfc8490) (consultado el 2026-10-19): secciones 10.1 y 10.2, el opcode 6 (DSO) y el RCODE 11 (DSOTYPENI)
- [RFC 6761: Special-Use Domain Names](https://www.rfc-editor.org/rfc/rfc6761) (consultado el 2026-10-19): la sección 6.4, los nombres bajo `.invalid`
- [RFC 9824: Compact Denial of Existence in DNSSEC](https://www.rfc-editor.org/rfc/rfc9824) (consultado el 2026-10-19): NOERROR sin datos para un nombre que no existe
- [ISC, BIND 9 9.20.29 documentation, Manual Pages: dig](https://bind9.readthedocs.io/en/v9.20.29/manpages.html) (consultado el 2026-10-19): `+ttlunits`, `+ttlid`, `+multiline`, `+opcode`
- [BIND 9 source at tag v9.20.29, bin/dig/dig.c](https://github.com/isc-projects/bind9/blob/v9.20.29/bin/dig/dig.c) (consultado el 2026-10-19): los nombres de opcode que imprime dig, entre ellos `RESERVED6`; `RESERVED11` sale de lib/dns/rcode.c
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultado el 2026-10-27): la sección 3.5, el fragmento, que lleva los valores de un enlace de Compartir resultados
