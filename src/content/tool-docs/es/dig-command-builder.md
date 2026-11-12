## Qué hace

Tú describes la consulta y la página escribe la línea de comandos de `dig`. Cinco grupos de controles corresponden a las cinco cosas que dice una invocación de dig:

- **Qué buscar:** un nombre y un tipo de registro (A de forma predeterminada, cualquier mnemónico del registro de la IANA, `TYPEnn`, o los tipos de consulta ANY, AXFR e IXFR con el número de serie que tienes), una clase (IN de forma predeterminada; CH y HS), o una dirección para una resolución inversa con `-x`, en cuyo caso dig deriva por sí mismo el nombre PTR y no se escriben el nombre, el tipo ni la clase.
- **A quién preguntar:** el servidor (`@server`, un nombre de host o una dirección IPv4 o IPv6 sin más), un puerto no estándar (`-p`), el transporte (UDP, `+tcp`, `+tls`, `+https` con su endpoint), una sola familia de direcciones (`-4`, `-6`) y una dirección de origen (`-b`).
- **Cómo preguntar:** `+trace`, `+nssearch`, `+norecurse`, `+dnssec`, `+cd`, `+ignore`; los controles de EDNS `+bufsize`, `+subnet`, `+nsid`, `+nocookie`, `+noedns`; y los temporizadores `+timeout`, `+tries`, `+retry`.
- **Qué imprimir:** el mensaje completo, `+short` (con `+identify`), `+noall +answer` o `+yaml`; además, `+multiline`, `+ttlunits` y `+qr`.
- **En tu equipo:** `-k keyfile` para una consulta firmada y `-r` para ignorar `~/.digrc`.

Se obtienen tres cosas: el comando, en un orden canónico, con un botón Copiar; hallazgos, cuando una combinación es contradictoria, redundante o puede sorprender; y un resumen de lo que llevará la consulta, derivado de los valores predeterminados y las interacciones que indica el manual: la pregunta que dig pondrá en el mensaje, a qué servidores se pregunta, el transporte y el puerto una vez aplicados los valores predeterminados de cada tipo, si una respuesta UDP truncada se reintenta por TCP, y los bits RD, DO, CD y AD, el registro OPT de EDNS y su tamaño de búfer, la cookie y si la consulta va firmada. Debajo se explica cada token.

## El orden del comando

dig lee la línea entera y no le importa mucho el orden, con dos excepciones que indica el manual: las opciones de consulta (las palabras con `+`) dependen del orden, y `+short` y `+cmd` son globales. El generador escribe un orden fijo para que la misma intención dé siempre los mismos bytes: `dig`, `@server`, las opciones (`-r`, `-4`/`-6`, `-b`, `-p`, `-k`), la pregunta (`-x address`, o el nombre, después el tipo y después la clase) y, por último, las opciones de consulta agrupadas como transporte, modo, bits del encabezado, EDNS, temporizadores y salida. `+noall` se escribe siempre antes que `+answer` porque se aplican en secuencia.

Los valores predeterminados no se escriben: tipo A, clase IN, puerto 53 (853 para TLS, 443 para HTTPS), UDP. Un nombre que también es un mnemónico de tipo o de clase (el dominio de nivel superior `ch`, un host que se llama literalmente `mx`) se escribe con `-q`, porque dig lee las palabras sueltas como tipos y clases antes que como nombres; la propia nota del manual sobre los dominios de nivel superior IN y CH es la razón de que exista la opción.

## Qué comprueban los hallazgos

Cada regla remite a la frase del manual o del RFC que la justifica:

- `+trace` activa `+dnssec` y `+cookie` y desactiva la recursión; `@server` solo afecta entonces a la consulta inicial por los servidores raíz. Pedir además `+dnssec` o `+norecurse` se marca como redundante, y se muestra la nota sobre el servidor.
- `+nssearch` también desactiva la recursión.
- El tipo ANY e `ixfr=N` usan TCP de forma predeterminada; AXFR siempre usa TCP, y una transferencia sin `@server` iría a los resolvers de `/etc/resolv.conf` en lugar de a un servidor que tenga la zona (RFC 5936). ANY puede recibir una respuesta mínima o un registro HINFO sintetizado (RFC 8482).
- `+bufsize` va de 0 a 65.535; el receptor trata un valor inferior a 512 como 512 (RFC 6891, sección 6.2.3); por encima de 4096 se supera el punto de partida que sugiere el RFC 6891; el DNS Flag Day 2020 da 1232 como el tamaño mínimo seguro.
- `+bufsize=0` se marca para que lo revises: anuncia un búfer UDP de EDNS de 0 bytes, que el receptor trata como 512. No restablece el valor predeterminado; el manual reserva esa tarea a `+bufsize` sin valor. El valor predeterminado de dig es 1232 bytes (`DEFAULT_EDNS_BUFSIZE` en el código fuente de la 9.20.29). El cambio de 4096 a 1232 es la entrada 5516 de BIND CHANGES, publicada en la 9.17.6 y, por tanto, presente en todas las versiones desde la 9.18.0; en la rama 9.16 esa misma entrada llegó a `named` pero no a dig, que mantuvo 4096 hasta la 9.16.50.
- `+dnssec`, `+trace`, `+bufsize`, `+nsid` y `+subnet` van en el registro OPT (RFC 6891; el bit DO es del RFC 3225), así que `+noedns` no se puede combinar con ellos y no se escribe cuando están presentes.
- `+subnet=0` (o una longitud de prefijo de 0) pide al resolver que no use tu dirección (RFC 7871).
- `-4` frente a un servidor escrito como dirección IPv6 literal, o `-6` frente a uno IPv4, deja a dig sin ningún sitio al que enviar la consulta.
- dig sube a 1 sin avisar un `+timeout` inferior a 1 y un `+tries` de 0.
- `+identify` no hace nada sin `+short`; `+ignore` no hace nada sin UDP.
- Para TSIG solo se ofrece `-k`. El manual dice que se use en lugar de `-y`, porque `-y` pone el secreto compartido en la línea de comandos, donde `ps` y el historial del shell pueden verlo.

## Límites

- El generador emite una consulta por comando. dig admite varias consultas en una sola línea, cada una con sus opciones, y un archivo de lotes con `-f`; ninguna de las dos cosas está modelada.
- No ejecuta dig, no resuelve nada ni comprueba que exista un servidor. El resumen se deriva de lo que dice el manual, no de lo observado.
- Las opciones que no se ofrecen (`+aaonly`, `+besteffort`, `+cmd`, `+comments`, `+crypto`, `+domain`, `+ednsopt`, `+expire`, `+header-only`, `+keepopen`, `+ndots`, `+onesoa`, `+opcode`, `+padding`, `+proxy`, `+qid`, `+search`, `+split`, `+stats`, `+tls-ca` y los demás archivos de TLS, `+unknownformat`, `+zoneversion`, `-c` como opción, `-f`, `-F`, `-m`, `-t` como opción, `-u`, `-y`) están documentadas en el manual; aquí están las habituales.
- Se comprueba la forma de los nombres (etiquetas de letras, dígitos, guiones y guiones bajos, de 63 caracteres como máximo cada una y 253 en total; un asterisco solo como etiqueta comodín); el generador no sabe si un nombre existe.
- El manual de dig consultado para esta página es la documentación “latest” de BIND 9 (9.21) y, para `+bufsize`, el manual estable de la 9.20.29 (consultado el 2026-10-19). Las versiones antiguas de dig no tienen algunas opciones de consulta (`+tls`, `+https` y `+yaml` son recientes); dig imprime “Invalid option” ante una palabra que no conoce.

## Compartir resultados

Debajo del comando, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva cada campo que hayas definido, cada uno por su nombre: el nombre que se busca como `#input=` y después, por ejemplo, `&type=MX&server=192.0.2.53&dnssec=1`. Una opción va como `1` solo cuando está activada, y una elección, por su valor (`transport=tls`). Antes de que copies nada, la ventana emergente añade una precaución: el comando puede nombrar tu servidor DNS, una dirección de origen o la ruta de un archivo de clave, así que compruébalo antes de enviar el enlace. El formulario no contiene ninguna clave: el `-k` de dig recibe la ruta de un archivo de clave. Todo lo que lleva el enlace va después del `#`, que el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27) describe como “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo): el navegador no lo envía al servidor cuando se abre el enlace, pero se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Un enlace lleva como máximo 16.384 caracteres, el límite que el sitio aplica a todo valor después del `#`; todos los campos juntos son mucho más cortos.
- **Al abrir un enlace.** El formulario del enlace sustituye a todo el formulario, incluido el Ejemplo con el que se abre la página (un campo que el enlace no lleva se vacía), y se construye el comando; no se ejecuta ni se envía nada. Una elección que el formulario no ofrece, una opción con un valor distinto de `1` o `0`, o un valor más largo de lo que admite su campo hace que se ignore el enlace entero. Se acepte o no, los valores salen después de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, con un marcador o con el propio botón Compartir de la página no se lleva nada que no hayas decidido compartir.

## API

El mismo motor responde a la operación `/api/v1/dig-command-builder` de la API HTTP del sitio, detallada campo por campo en el contrato OpenAPI de la [página de la API](/api), con ejemplos tomados de los vectores de referencia. El contrato también indica si este sitio sirve la API.

- **Solicitud.** Un objeto JSON con los campos del formulario: `name`, `type`, `ixfrSerial`, `klass`, `reverse`, `server`, `port`, `ipv`, `source`, `transport`, `httpsEndpoint`, `bufsize`, `subnet`, `timeout`, `tries`, `retry`, `output` y `keyfile` como cadenas, y las opciones `trace`, `nssearch`, `norecurse`, `dnssec`, `cd`, `noedns`, `nocookie`, `nsid`, `ignore`, `identify`, `multiline`, `ttlunits`, `qr` y `norc` como booleanos.
- **Respuesta.** `ok`, `command`, `parts` (`text`, `kind` y `explain`, el id de la explicación), `findings` (`code`, `severity` y `params`) y `effective`, lo que lleva la consulta.
- **Errores.** Un hallazgo de error no es un error HTTP: `ok` es `false`, `command` está vacío y `effective` es `null`. Un cuerpo que no es un objeto JSON recibe HTTP 400.

Desde el 19 de octubre de 2026, `{"name": "example.com", "bufsize": "0"}` devuelve el hallazgo `bufsize-default` con gravedad `warning`; antes era un `info` que decía que 0 restablece el valor predeterminado.

## Fuentes

- [BIND 9 Administrator Reference Manual, Manual Pages: dig](https://bind9.readthedocs.io/en/latest/manpages.html#man-dig) (consultado el 2026-10-04): cada opción y cada opción de consulta, los valores predeterminados y las interacciones citadas arriba
- [BIND 9 source, bin/dig/dig.c](https://github.com/isc-projects/bind9/blob/main/bin/dig/dig.c) (consultado el 2026-10-04): el orden en que se prueba una palabra suelta (ixfr=, tipo, clase, nombre) y el TCP predeterminado para ANY e ixfr
- [RFC 1035: Domain Names - Implementation and Specification](https://www.rfc-editor.org/rfc/rfc1035) (consultado el 2026-10-04): los valores TYPE y CLASS, el puerto 53, el límite UDP de 512 bytes, IN-ADDR.ARPA, las longitudes de etiqueta y de nombre, el bit RD
- [RFC 3596: DNS Extensions to Support IP Version 6](https://www.rfc-editor.org/rfc/rfc3596) (consultado el 2026-10-04): AAAA y la forma por nibbles de IP6.ARPA
- [RFC 6891: Extension Mechanisms for DNS (EDNS(0))](https://www.rfc-editor.org/rfc/rfc6891) (consultado el 2026-10-04): el registro OPT, las reglas del tamaño de la carga útil, 4096 como punto de partida
- [RFC 3225: Indicating Resolver Support of DNSSEC](https://www.rfc-editor.org/rfc/rfc3225) (consultado el 2026-10-04): el bit DO
- [RFC 4034](https://www.rfc-editor.org/rfc/rfc4034) y [RFC 4035](https://www.rfc-editor.org/rfc/rfc4035) (consultados el 2026-10-04): los tipos de registro de DNSSEC; los bits CD y AD
- [RFC 5936: DNS Zone Transfer Protocol (AXFR)](https://www.rfc-editor.org/rfc/rfc5936) y [RFC 1995: Incremental Zone Transfer in DNS](https://www.rfc-editor.org/rfc/rfc1995) (consultados el 2026-10-04)
- [RFC 8482: Providing Minimal-Sized Responses to DNS Queries That Have QTYPE=ANY](https://www.rfc-editor.org/rfc/rfc8482) (consultado el 2026-10-04)
- [RFC 7858: DNS over TLS](https://www.rfc-editor.org/rfc/rfc7858) y [RFC 8484: DNS Queries over HTTPS](https://www.rfc-editor.org/rfc/rfc8484) (consultados el 2026-10-04)
- [RFC 5001: NSID](https://www.rfc-editor.org/rfc/rfc5001), [RFC 7871: Client Subnet in DNS Queries](https://www.rfc-editor.org/rfc/rfc7871), [RFC 7873: DNS Cookies](https://www.rfc-editor.org/rfc/rfc7873) (consultados el 2026-10-04)
- [IANA: Domain Name System (DNS) Parameters](https://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml) (consultado el 2026-10-04): el registro de RR TYPE que acepta el campo de tipo, y los códigos de opción de EDNS
- [ISC, BIND 9 9.20.29 documentation, Manual Pages: dig](https://bind9.readthedocs.io/en/v9.20.29/manpages.html) (consultado el 2026-10-19): `+bufsize[=B]` fija el tamaño anunciado en B bytes, de 0 a 65.535; `+bufsize` sin valor restablece el valor predeterminado
- [BIND 9 source at tag v9.20.29, bin/dig/dighost.h](https://github.com/isc-projects/bind9/blob/v9.20.29/bin/dig/dighost.h) (consultado el 2026-10-19): `DEFAULT_EDNS_BUFSIZE 1232`
- [ISC, BIND 9.18.0 CHANGES](https://downloads.isc.org/isc/bind9/9.18.0/CHANGES) (consultado el 2026-10-19): la entrada 5516, en la 9.17.6, por la que el tamaño predeterminado del búfer EDNS pasó de 4096 a 1232 bytes
- [BIND 9 source at tag v9.16.50, bin/dig/include/dig/dig.h](https://github.com/isc-projects/bind9/blob/v9.16.50/bin/dig/include/dig/dig.h) (consultado el 2026-10-19): `DEFAULT_EDNS_BUFSIZE 4096`, el valor predeterminado de dig en la rama 9.16
- [DNS Flag Day 2020](https://www.dnsflagday.net/2020/) (consultado el 2026-10-04): 1232 bytes como el tamaño mínimo seguro del búfer EDNS
- [RFC 5737](https://www.rfc-editor.org/rfc/rfc5737) y [RFC 3849](https://www.rfc-editor.org/rfc/rfc3849) (consultados el 2026-10-04): los rangos de direcciones de documentación que se usan en los ejemplos (192.0.2.0/24, 2001:db8::/32)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultado el 2026-10-27): la sección 3.5, el fragmento, que lleva los valores de un enlace de Compartir resultados
