## Qué hace

Lee el archivo que reproduce un monitor Scripted de BIG-IP LTM (las líneas send y expect que se guardan en `/config/eav/`) y lo explica tal como la documentación de F5 dice que lo lee el monitor. Cada línea se muestra tal como se escribió y tal como se lee: la palabra clave, el texto sin sus comillas y con las secuencias de escape de F5 resueltas, cómo termina un send (CR LF, solo LF, solo CR o nada) y qué significa una respuesta o un comando conocidos en SMTP, POP3, IMAP o FTP, con la sección del RFC. Los hallazgos comprueban el archivo contra todas las reglas que F5 establece y señalan todo lo que F5 deja abierto, reglas S1 a S16, cada una vinculada a una línea.

Si además le das una transcripción del servidor, simula la comprobación: cada send sale, cada expect se compara con la siguiente respuesta del servidor y el resultado es **pasa**, **falla en la línea N** con el motivo según F5, o **indeterminado en la línea N** cuando el texto de F5 no dice qué hace el monitor. Nada se conecta a ninguna parte: la transcripción es texto que pegas, y el script se lee, nunca se ejecuta. El [laboratorio del monitor Scripted](/learn/bigip-ltm-scripted-monitors#lab-scripted-monitor-dialogue) del artículo reproduce un script contra un servidor que sigue los RFC, línea a línea, y muestra qué regla de F5 lo detiene.

Los datos son de F5: la BIG-IP 21.1.0 LTM Monitors Reference, “Scripted monitor settings”, y la TMSH Reference de `ltm monitor scripted`. Los datos de los protocolos salen del RFC 5321 (SMTP), el RFC 1939 (POP3), el RFC 9051 (IMAP4rev2) y el RFC 959 (FTP). Todos se consultaron el 27 de octubre de 2026.

## Las reglas que establece F5

- **S1, un CR dentro de una línea (error).** F5: los scripts “must use hard-return line endings (LF), not soft-return line endings (CR-LF)” (deben terminar las líneas con LF, no con CR-LF). Un archivo guardado en Windows tiene un CR antes de cada LF. El hallazgo indica si el CR termina la línea o está dentro de ella.
- **S2, no hay exactamente un espacio después de la palabra clave (error).** F5: “Exactly one character space must be used to separate the send or expect instruction keywords from the text” (entre la palabra clave send o expect y el texto debe haber exactamente un espacio). Se señalan dos o más espacios, o una tabulación.
- **S3, caracteres después de una comilla de cierre (error).** F5: “The text to send or match extends to the end of the line, even when using quotation marks. Any characters that follow a closing quotation mark will break the match.” (el texto llega hasta el final de la línea aunque se usen comillas, y cualquier carácter detrás de la comilla de cierre rompe la coincidencia). Por eso, en una línea expect el simulador hace fallar ahí la comprobación; en una línea send, F5 no dice qué se envía, así que el simulador se detiene como indeterminado.
- **S4, una primera palabra que no es send ni expect (error).** F5 solo documenta esas dos palabras clave. El hallazgo indica cuándo la palabra es una palabra clave con mayúscula (`Expect`), un comentario (`#`) o una señal de que se pegó un script de Expect (Tcl) (`spawn`, `set`, `#!/usr/bin/expect` y similares).
- **S5, una secuencia de escape que F5 no lista (advertencia).** La tabla de F5: `\a` campana, `\b` retroceso, `\f` avance de página, `\n` nueva línea, `\r` retorno de carro, `\t` tabulación, `\v` tabulación vertical, `\\` barra invertida, `\'` comilla simple. Cualquier otra cosa detrás de una barra invertida, como `\x0d` o `\"`, no está documentada.
- **La regla del prefijo (la coincidencia del simulador).** F5: “Matching text can match the prefix of a response, but cannot match a substring that is not a prefix, that is, a substring that starts other than at the beginning of the response.” (el texto puede coincidir con el principio de una respuesta, pero no con una subcadena que empiece en otro punto). Cuando el texto aparece más adelante en la respuesta, el paso indica en qué carácter.
- **El orden.** F5: “the lines of the file are always read in the sequence specified” (las líneas del archivo se leen siempre en el orden indicado). El simulador recorre el archivo de arriba abajo y se detiene en la primera línea que falla o que no se puede decidir.

## Lo que F5 deja abierto

El texto de F5 no resuelve estos casos, así que el explicador los señala como advertencias y el simulador se detiene ahí con **indeterminado** y el motivo, en lugar de adivinar:

- **S9, una línea en blanco.** Las líneas en blanco después de la última instrucción se anotan, pero no pueden cambiar una coincidencia.
- **S10, espacio en blanco antes de la palabra clave.**
- **S11, una forma de entrecomillado que F5 no describe:** comillas simples (F5 lista un escape para la comilla simple, pero no dice si las comillas simples delimitan un texto), una comilla de apertura sin la de cierre o una comilla dentro de un texto sin entrecomillar.
- **S12, un texto vacío** (`expect` solo, o `expect ""`).
- **S13, una última línea sin LF.** Un expect en esa línea detiene la simulación; un send ahí solo se anota.
- **S14, ninguna línea expect:** nunca se comprueba nada de lo que dice el servidor.
- **Mayúsculas y minúsculas.** Cuando la respuesta empieza por el texto con otra combinación de mayúsculas y minúsculas (`+ok` frente a `+OK`), el simulador dice indeterminado: F5 no dice si la comparación distingue mayúsculas de minúsculas.
- **Qué es una respuesta.** F5 no dice cuánto de una respuesta de varias líneas lee el monitor antes de comparar. Cuando una coincidencia exigiría que el monitor hubiera leído más allá del final de la primera línea de la respuesta, el simulador dice indeterminado.
- **Una línea sin comillas que termina en CR** (un archivo CR-LF sin comillas): F5 dice solo LF, pero no cómo se lee entonces una línea así.

## Consejos de los RFC

- **S6, un send sin final de línea (advertencia).** SMTP, POP3, IMAP y FTP terminan cada comando con CR LF (RFC 5321 2.3.8, RFC 1939 sección 3, RFC 9051 2.2, RFC 959 sección 4), así que un servidor de esos protocolos espera uno. El propio ejemplo de F5 escribe `\r\n` al final de cada send; nada en el texto de F5 dice que el monitor añada un final de línea.
- **S7, un send que termina solo en LF o solo en CR (nota).** RFC 5321 2.3.8: una implementación conforme no debe reconocer ningún terminador de línea distinto de CR LF.
- **S8, un expect escrito como un patrón (nota):** un `^` inicial, un `$` final, `.*` o `.+`, o los `-re`, `-gl`, `-ex` o `-nocase` de Expect. El texto se compara literalmente; F5 dice que los únicos monitores que admiten coincidencia por expresiones regulares son HTTP, HTTPS, HTTP/2, TCP y UDP.
- **S15, una credencial en un send (advertencia):** `PASS` (POP3, FTP) o `LOGIN` (IMAP). La contraseña se enmascara en toda la salida, incluida la comparación con la transcripción. El archivo la guarda en claro, la referencia de tmsh no recoge ninguna opción TLS para este tipo de monitor y la sección 6.2.3 del RFC 9051 dice que LOGIN no debe usarse en redes no seguras. POP3 permite QUIT e IMAP permite LOGOUT antes de la autenticación, así que normalmente es posible una comprobación que nunca inicia sesión.
- **S16, un expect sobre un código de respuesta y un espacio (nota),** como `"250 "`. En las respuestas de varias líneas de SMTP y FTP, todas las líneas salvo la última empiezan por el código y un guion (RFC 5321 4.2.1, RFC 959 4.2), así que `"250 "` nunca es el principio de una respuesta a EHLO; espera solo el código.

## La transcripción y cómo la lee la simulación

Escribe la sesión como lo hacen los RFC: `S:` delante de cada línea que envía el servidor y `C:` delante de cada línea que envía el cliente.

```
S: 220 foo.com Simple Mail Transfer Service Ready
C: HELO bigip1.somecompany.net
S: 250 foo.com
C: quit
S: 221 foo.com Service closing transmission channel
```

- Una **respuesta** es una serie de líneas `S:`; la termina una línea `C:` o una línea en blanco. Deja una línea en blanco entre dos series `S:` cuando el servidor las envía como respuestas separadas.
- Cada línea `S:` se lee como terminada en **CR LF**, como exigen los cuatro protocolos. Los espacios después de `S:` y `C:` son notación, no datos (el RFC 1939 escribe `S:  +OK` con dos).
- Cada **expect** se compara con la **siguiente respuesta**, desde su primer carácter. Es el único supuesto del simulador: F5 no dice qué cuenta como “the response” (la respuesta) cuando una respuesta tiene varias líneas. Siempre que eso pueda cambiar el veredicto, el simulador dice indeterminado.
- Cada **send** se compara con la siguiente línea `C:`, si la hay; una diferencia se anota (la transcripción puede venir de otro cliente), pero nunca es un fallo.
- Cuando a la transcripción **no le quedan respuestas** para un expect, la comprobación falla ahí: la fila Timeout de F5 dice que un destino que no responde dentro del Timeout se considera down.
- Las líneas que no empiezan ni por `S:` ni por `C:` se ignoran y se listan.

Los motivos por los que falla una comprobación: el texto aparece en la respuesta, pero no al principio (con el desplazamiento); la respuesta no empieza por el texto ni lo contiene; la respuesta termina antes que el texto; hay caracteres detrás de una comilla de cierre, o el CR de un final CR-LF; no llega ninguna respuesta.

## Lectura de la salida

El resumen cuenta las líneas, los send, los expect y los hallazgos, y avisa cuando el archivo no termina en LF. La simulación muestra el veredicto y después una fila por cada línea alcanzada: la línea, lo que envía o espera tal como la lee el monitor, la respuesta con la que se comparó (numerada como en la transcripción) o, para un send, si la transcripción muestra la misma línea del cliente, y el resultado. La tabla de líneas muestra cada línea tal como se escribió: un carácter de control que el archivo contiene de verdad (el CR de un final CR-LF, una tabulación) aparece con su símbolo Unicode, como ␍ o ␉, y un escape escrito como barra invertida y letra se queda tal como se escribió; en el resto de la salida, el texto se muestra con las secuencias de escape de F5 y cada barra invertida como dos.

El botón **Ejemplo** carga, al pie de la letra, el propio script SMTP de F5 de la Monitors Settings Reference, con una sesión que tiene la forma de la del RFC 5321: pasa.

## Temporización

En la documentación de F5, el script no tiene temporizador propio. El Interval del monitor (10 segundos de forma predeterminada para Scripted, según la referencia de tmsh) y su Timeout (31 segundos, tres veces el Interval más uno) deciden cuándo se marca un miembro como down, igual que en cualquier monitor; el [artículo sobre los monitores de estado de LTM](/learn/ltm-health-monitors) y su [laboratorio de temporización de monitores](/learn/ltm-health-monitors#lab-f5-monitor-timing) muestran cómo se combinan.

## Compartir resultados

Al final del resumen, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` los dos cuadros (`input` para el script y `transcript` para la transcripción, si la hay) con cada contraseña de PASS y LOGIN sustituida por los puntos que muestra esta página, tanto en el script tal como se escribió como en las líneas `C:` de la transcripción, así que ninguna contraseña viaja tal como se escribió. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Son las contraseñas que enmascara la regla S15: `PASS` ([RFC 1939](https://www.rfc-editor.org/rfc/rfc1939), sección 7) y el último argumento de `LOGIN` ([RFC 9051](https://www.rfc-editor.org/rfc/rfc9051), sección 6.2.3), consultados el 2026-10-27. Un punto por carácter, como en esta página, para que la página que recibe el enlace lea exactamente las mismas líneas, los mismos hallazgos y la misma simulación: los vectores de uso compartido de la herramienta comparan los dos resultados completos. Una contraseña escrita con secuencias de escape no se puede localizar tal como está escrita (la página enmascara todo ese texto), así que no recibe ningún enlace, y la ventana emergente indica la línea. Las demás credenciales van tal como se escribieron, por ejemplo un intercambio SMTP AUTH ([RFC 4954](https://www.rfc-editor.org/rfc/rfc4954), Base64 que se decodifica en la contraseña); la ventana emergente lo dice antes de que copies. Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que la copia no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerla.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** Los dos cuadros se rellenan como lo haría un pegado (si el enlace no lleva transcripción, ese cuadro se vacía) y la página los lee. Nada se conecta a nada y nada se ejecuta. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.

## Límites

- El explicador aplica las reglas que F5 publica. Lo que haga una versión concreta de BIG-IP más allá de ellas no lo puede saber; donde la documentación calla, dice indeterminado.
- La transcripción la pones tú: el simulador no sabe cómo responde de verdad tu servidor, con qué rapidez ni si solo envía parte de una respuesta.
- La comprobación de credenciales es un patrón: `PASS x` y `tag LOGIN user password`. Una contraseña enviada de otra forma (con AUTH, por ejemplo) no se reconoce.
- Prueba el monitor real en el sistema: `tmsh run ltm monitor scripted NAME destination ADDRESS:PORT` y después `tmsh show ltm monitor scripted NAME test-result`, o el botón Test de la Configuration utility.

## API

El mismo motor responde a la operación `/api/v1/bigip-scripted-monitor-explainer` de la API HTTP del sitio, descrita en el contrato OpenAPI de la [página de la API](/api); el contrato también indica si este sitio sirve la API.

- **Solicitud.** Un objeto JSON, `{"script": "...", "transcript": "..."}`, en el cuerpo de un POST o en el parámetro de consulta `input` de un GET; la transcripción puede ir vacía u omitirse. El script está limitado a 32.768 caracteres y la transcripción, a 65.536.
- **Respuesta.** `lines` (cada una con `line`, `raw`, `kind`, `keyword`, `written`, `quoted`, `decoded`, `length`, `ending`, `hint`, `secret`, `breaks` y `open`), `findings` (`rule`, `severity`, `line`, `params`), `counts`, `sends`, `expects`, `endsWithLf`, `transcript` (`replies`, `clientLines`, `ignoredLines`) y `simulation` (`verdict`, `stopLine`, `reason`, `steps`, `unreadReplies`, `unusedClientLines`, `notes`); los dos últimos son null si no se da transcripción. Las contraseñas se enmascaran en todos los campos.

## Fuentes

- [F5, BIG-IP 21.1.0 LTM Monitors Reference, Monitors Settings Reference: Scripted monitor settings, the escape sequences and F5's SMTP example; the TCP Receive String and which monitors support regular expressions](https://techdocs.f5.com/en-us/bigip-21-1-0/big-ip-local-traffic-manager-monitors-reference/monitors-settings-reference.html#scripted-monitor-settings) (consultado el 2026-10-27)
- [F5 TMSH Reference v17, ltm monitor scripted: options and defaults, run and show test-result](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_monitor_scripted.html) (consultado el 2026-10-27)
- [RFC 5321, Simple Mail Transfer Protocol](https://www.rfc-editor.org/rfc/rfc5321) (consultado el 2026-10-27)
- [RFC 1939, Post Office Protocol, Version 3](https://www.rfc-editor.org/rfc/rfc1939) (consultado el 2026-10-27)
- [RFC 9051, Internet Message Access Protocol (IMAP), Version 4rev2](https://www.rfc-editor.org/rfc/rfc9051) (consultado el 2026-10-27)
- [RFC 959, File Transfer Protocol](https://www.rfc-editor.org/rfc/rfc959) (consultado el 2026-10-27)
- Artículos: [Monitores Scripted de BIG-IP LTM](/learn/bigip-ltm-scripted-monitors), [Cómo deciden los monitores de estado de LTM entre up y down](/learn/ltm-health-monitors). Relacionados: el [Explicador de scripts de Expect](/tools/expect-script-explainer), para el propio Expect, y el [Explicador de configuración tmsh](/tools/f5-tmsh-config-explainer), para el objeto `ltm monitor scripted` que nombra el archivo.
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultado el 2026-10-27): sección 3.5, el fragmento, que lleva los valores de un enlace de Compartir resultados
