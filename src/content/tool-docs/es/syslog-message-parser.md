## Qué hace

Lee un mensaje syslog tal como se recibió, o una trama TCP que lleve uno, y nombra cada campo en el orden en que los nombra su RFC. Se prueban dos gramáticas: el mensaje del RFC 5424 (PRI, VERSION, TIMESTAMP, HOSTNAME, APP-NAME, PROCID, MSGID, STRUCTURED-DATA, MSG) y la forma BSD que describe el RFC 3164 (PRI, TIMESTAMP, HOSTNAME, TAG, CONTENT). El PRI se desglosa en facility y severidad con las mismas tablas que usa el [Decodificador y codificador de PRI de syslog](/tools/syslog-pri-decoder). Todo lo que no cumple la norma se señala según el propio RFC, y los datos estructurados se abren elemento a elemento, con la explicación de los parámetros registrados en la IANA. No se envía nada a ningún sitio.

## Qué comprueba y de dónde sale cada regla

RFC 5424 (marzo de 2009), consultado el 2026-10-05:

- El PRI: `<` PRIVAL `>`, PRIVAL = Facility × 8 + Severity, de tres a cinco caracteres; “The only time a value of 0 follows the < is for the Priority value of 0. Otherwise, leading 0s MUST NOT be used” (solo la prioridad cero lleva un cero tras el <; en los demás casos no deben usarse ceros a la izquierda) (§6.2.1). Por encima de 191 no hay facility.
- VERSION: un dígito distinto de cero seguido de hasta dos dígitos; “This document uses a VERSION value of 1” (el valor que usa este documento) (§6.2.2).
- TIMESTAMP: “a formalized timestamp derived from RFC 3339” (una marca de tiempo formalizada, derivada de ese RFC); “The T and Z characters in this syntax MUST be upper case” (la T y la Z deben ir en mayúsculas); “Leap seconds MUST NOT be used” (no deben usarse segundos intercalares); TIME-SECFRAC es un punto y de uno a seis dígitos; o el NILVALUE (§6.2.3 y §6).
- HOSTNAME de 1 a 255, APP-NAME de 1 a 48, PROCID de 1 a 128 y MSGID de 1 a 32 caracteres US-ASCII imprimibles, o el NILVALUE (§6).
- STRUCTURED-DATA: `[` SD-ID *(SP SD-PARAM) `]`, con los elementos contiguos; un SD-ID tiene como máximo 32 caracteres; “The same SD-ID MUST NOT exist more than once in a message” (un mismo SD-ID no debe aparecer más de una vez en un mensaje); los nombres registrados no llevan arroba, y los privados llevan una y un número de empresa; dentro de un PARAM-VALUE, los caracteres `"`, `\` y `]` se escapan con una barra invertida (§6.3). Los SD-ID de la IANA de la §7 son timeQuality (tzKnown, isSynced, syncAccuracy), origin (ip, enterpriseId, software, swVersion) y meta (sequenceId, sysUpTime, language); se señala un parámetro que esté fuera de esas listas bajo uno de esos ID.
- MSG: “If a syslog application encodes MSG in UTF-8, the string MUST start with the Unicode byte order mask (BOM)” (si una aplicación syslog codifica el MSG en UTF-8, la cadena debe empezar con la BOM de Unicode) (§6.4); un texto no ASCII sin la BOM es de codificación desconocida y se señala.
- Longitud: “Any transport receiver MUST be able to accept messages of up to and including 480 octets in length. All transport receiver implementations SHOULD be able to accept messages of up to and including 2048 octets in length” (todo receptor debe poder aceptar mensajes de hasta 480 octetos inclusive, y todas las implementaciones deberían poder aceptarlos de hasta 2048 octetos inclusive) (§6.1).

RFC 3164 (agosto de 2001), consultado el 2026-10-05:

- El paquete “MUST be 1024 bytes or less” (no debe superar ese tamaño) (§4.1).
- TIMESTAMP “Mmm dd hh:mm:ss” en hora local, con el mes como una de las doce abreviaturas inglesas, y “If the day of the month is less than 10, then it MUST be represented as a space and then the number” (si el día del mes es menor que diez, debe escribirse un espacio seguido del número) (§4.1.2).
- HOSTNAME “will contain the hostname, as it knows itself. If it does not have a hostname, then it will contain its own IP address” (contendrá el nombre de host con el que se conoce el propio dispositivo o, si no tiene, su propia dirección IP) (§4.1.2).
- TAG “is a string of ABNF alphanumeric characters that MUST NOT exceed 32 characters. Any non-alphanumeric character will terminate the TAG field” (es una cadena alfanumérica que no debe superar ese máximo; cualquier carácter no alfanumérico termina el campo TAG) (§4.1.3).
- Un paquete cuyo HEADER no se puede leer: el receptor trata todo lo que sigue al PRI como el mensaje (§4.3).

Transportes, consultados el 2026-10-05: UDP en el puerto 514 (RFC 5426 §3.1); TCP con recuento de octetos, “SYSLOG-FRAME = MSG-LEN SP SYSLOG-MSG”, donde “It can be assumed that octet-counting framing is used if a syslog frame starts with a digit” (se puede suponer que se usa el recuento de octetos si la trama empieza por un dígito), o delimitación no transparente con un TRAILER que “most often is ASCII LF” (casi siempre es un LF ASCII) (RFC 6587 §3.4.1 y §3.4.2); TLS en el puerto TCP 6514 (RFC 5425 §4.1). Un recuento inicial o un salto de línea final en el texto pegado se leen como esa delimitación, y el recuento declarado se compara con los octetos reales del mensaje.

## Límites

- Un mensaje cada vez. Un archivo de líneas le corresponde a tu propio pipeline de logs; pega la línea en cuestión.
- El analizador lee el mensaje, no la red: no puede saber por qué transporte llegó el mensaje, solo los bytes de delimitación que lleva.
- La forma del RFC 3164 no tiene año ni zona horaria en su marca de tiempo; el analizador lo dice en lugar de adivinarlos.
- La entrada se corta en 8192 caracteres.

## Compartir resultados

Debajo del veredicto, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva el mensaje tal como se pegó (`#input=...`), y nada más. Antes de que copies nada, la ventana emergente añade una advertencia: un mensaje de log puede nombrar hosts, usuarios y direcciones, así que léelo antes de enviar el enlace. Todo lo que lleva el enlace va después del `#`, que según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27) queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo): el navegador no lo envía al servidor cuando se abre el enlace, pero se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Un enlace lleva como máximo 16.384 caracteres, el límite que el sitio aplica a todo valor después del `#`; si es más largo, no hay enlace, y la ventana emergente indica la longitud que tendría.
- **Al abrir un enlace.** El texto sustituye al del cuadro (la página se abre con el Ejemplo) como lo haría un pegado, y la página lo vuelve a leer. Se acepte o no, los valores salen después de la propia dirección de la página al instante, sin ninguna solicitud, así que al recargar, con un marcador o con el propio botón Compartir de la página no se lleva nada que no hayas decidido compartir.

## Fuentes

- [RFC 5424, The Syslog Protocol, secciones 6 y 7](https://www.rfc-editor.org/rfc/rfc5424.html#section-6) (consultado el 2026-10-05)
- [RFC 3164, The BSD syslog Protocol, secciones 4.1 a 4.3](https://www.rfc-editor.org/rfc/rfc3164.html#section-4.1) (consultado el 2026-10-05)
- [RFC 5426, Transmission of Syslog Messages over UDP](https://www.rfc-editor.org/rfc/rfc5426.html#section-3.1) (consultado el 2026-10-05)
- [RFC 5425, TLS Transport Mapping for Syslog, sección 4.1](https://www.rfc-editor.org/rfc/rfc5425.html#section-4.1) (consultado el 2026-10-05)
- [RFC 6587, Transmission of Syslog Messages over TCP, secciones 3.4.1 y 3.4.2](https://www.rfc-editor.org/rfc/rfc6587.html#section-3.4.1) (consultado el 2026-10-05)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultado el 2026-10-27): sección 3.5, el fragmento, que lleva los valores de un enlace de Compartir resultados
