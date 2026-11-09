## Qué hace

Pega la salida de un comando `nslookup` y la herramienta la decodifica en un desglose estructurado y explicado: qué resolver respondió, si la respuesta era autoritativa, cada registro con sus campos detallados y cualquier fallo que haya notificado. Solo analiza el texto; no se resuelve nada ni se envía nada a ningún sitio.

## Cómo se lee el formato de nslookup

`nslookup` imprime las respuestas DNS en un formato suelto, casi de prosa, muy distinto del de `dig`, y ese formato lleva un significado que conviene hacer explícito. Toda respuesta empieza con un encabezado **Server** y **Address** que nombra el resolver al que se consultó. Una línea **Non-authoritative answer:** significa que el bit AA estaba a cero: la respuesta vino de un resolver, no de un servidor autoritativo para el nombre. El RFC 1035 (sección 4.1.1) y el RFC 2181 (sección 6) definen la autoridad por el nombre, no por el almacenamiento en caché, así que la línea no dice si el resolver respondió desde su caché o fue a buscar la respuesta por ti; las dos cosas se ven igual. Su ausencia, en una consulta directa, implica una respuesta autoritativa. Cuando una búsqueda falla, nslookup imprime una línea como `** server can't find NAME: NXDOMAIN`, y la herramienta muestra ese fallo y lo que significa el estado.

## Los registros y sus campos

En la mayoría de los tipos de registro, nslookup imprime una simple línea `name = value`, pero unos pocos meten varios campos en una línea o en un bloque, y esos son los que vale la pena decodificar:

- Los registros **MX** se leen como `mail exchanger = 10 mail.example.com`, donde el número es la preferencia (se prefiere el más bajo) y el nombre es el host de correo. La herramienta separa las dos partes.
- Los registros **SRV** (RFC 2782) llevan la prioridad, el peso, el puerto y el destino en una sola línea; la herramienta los separa para que veas a qué host y puerto de servicio apuntan.
- Los registros **SOA** ocupan varias líneas: el servidor de nombres primario de la zona, el buzón del responsable, el serial y los temporizadores (refresh, retry, expire, minimum). La herramienta presenta esos campos ordenados.

## Uso

Pega una respuesta de `nslookup` y lee el resolver, el estado de autoridad, cada registro con sus campos y cualquier error. El análisis es determinista y completamente local; la herramienta nunca hace una búsqueda por su cuenta, lo que también la convierte en una forma segura de leer una salida capturada en otro sitio.

## Ejemplos

El botón Ejemplo y las pruebas de la herramienta usan salida real de `nslookup` de BIND 9.20.29, capturada el 19 de octubre de 2026 a través de un relay local que enviaba cada consulta a un resolver público por DNS over HTTPS, así que la línea Server muestra la dirección del relay, `127.0.0.1#5311`. El ejemplo de fallo busca `nonexistent.invalid`: el RFC 6761, en su sección 6.4, permite a los usuarios dar por hecho que las consultas de nombres bajo `.invalid` siempre devuelven NXDOMAIN, mientras que `example.com` responde ahora NOERROR sin datos para los nombres que no existen (la denegación compacta del RFC 9824).

## Compartir resultados

Al principio de la lectura, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva la salida de nslookup tal como se pegó (`#input=...`), y nada más. Antes de que copies nada, la ventana emergente añade una precaución: la salida de nslookup puede nombrar hosts internos, direcciones y el servidor al que se preguntó, así que léela antes de enviar el enlace. Todo lo que lleva el enlace va después del `#`, que el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27) describe como “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo): el navegador no lo envía al servidor cuando se abre el enlace, pero se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Un enlace lleva como máximo 16.384 caracteres, el límite que el sitio aplica a todo valor después del `#`; si es más largo, no hay enlace, y la ventana emergente indica la longitud que tendría.
- **Al abrir un enlace.** El texto rellena el cuadro como lo haría un pegado y la página vuelve a explicarlo; no se resuelve ni se envía nada. Un texto que no es salida de nslookup recibe la nota propia de la página. Se acepte o no, los valores salen después de la propia dirección de la página al instante, sin ninguna solicitud, así que al recargar, con un marcador o con el propio botón Compartir de la página no se lleva nada que no hayas decidido compartir.

## API

El mismo motor responde a la operación `/api/v1/nslookup-output-explainer` de la API HTTP del sitio, descrita campo por campo en el contrato OpenAPI de la [página de la API](/api), con ejemplos tomados de los vectores de referencia. El contrato también indica si este sitio sirve la API.

- **Solicitud.** La salida de nslookup como texto, con sus saltos de línea y tabulaciones.
- **Respuesta.** `server` (`server` y `address`), `authority` (`authoritative`, `non-authoritative` o `unknown`), `records` (`name`, `type`, `value` y `fields` para MX, SRV y SOA), `errors` (`name` y `code`), `referralNote`, `warnings` (códigos estables) y `recognized`.
- **Errores.** Un texto que no es salida de nslookup no es un error HTTP: `recognized` es `false`.

La respuesta no cambió el 19 de octubre de 2026; los ejemplos se sustituyeron por capturas hechas ese día.

## Fuentes

- [RFC 1035: Domain Names - Implementation and Specification](https://www.rfc-editor.org/rfc/rfc1035) (consultado el 2026-10-19): el bit AA, sección 4.1.1
- [RFC 2181: Clarifications to the DNS Specification](https://www.rfc-editor.org/rfc/rfc2181) (consultado el 2026-10-19): la autoridad de zona, sección 6
- [RFC 2308: Negative Caching of DNS Queries](https://www.rfc-editor.org/rfc/rfc2308) (consultado el 2026-10-19): NXDOMAIN, NODATA y el minimum del SOA
- [RFC 2782: A DNS RR for specifying the location of services (DNS SRV)](https://www.rfc-editor.org/rfc/rfc2782) (consultado el 2026-10-19): los campos de SRV
- [RFC 9499: DNS Terminology](https://www.rfc-editor.org/rfc/rfc9499) (marzo de 2024, deja obsoleto el RFC 8499; consultado el 2026-10-19): servidor autoritativo y resolver
- [RFC 6761: Special-Use Domain Names](https://www.rfc-editor.org/rfc/rfc6761) (consultado el 2026-10-19): la sección 6.4, los nombres bajo `.invalid`
- [RFC 9824: Compact Denial of Existence in DNSSEC](https://www.rfc-editor.org/rfc/rfc9824) (consultado el 2026-10-19): NOERROR sin datos para un nombre que no existe
- [RFC 7505: A "Null MX" No Service Resource Record for Domains That Accept No Mail](https://www.rfc-editor.org/rfc/rfc7505) (consultado el 2026-10-19): el ejemplo de MX, preferencia 0 y exchange `.`
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultado el 2026-10-27): sección 3.5, el fragmento, que lleva los valores de un enlace de Compartir resultados
