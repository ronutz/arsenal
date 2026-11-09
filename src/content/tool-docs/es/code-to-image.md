## Qué hace

Pega código, configuración o salida de terminal y obtén una imagen para una diapositiva, un ticket o un documento: un SVG que conserva el código como texto real y seleccionable, y un PNG a 1x o 2x, con un texto alternativo listo para pegar al lado. Eliges el lenguaje del resaltado, una paleta oscura o clara, el tamaño de fuente, las tabulaciones, los números de línea, un marco de ventana con un título opcional, el relleno y las líneas que se resaltan.

Antes de generar cualquier imagen, una comprobación de secretos busca valores que quizá no quieras publicar, como claves privadas, encabezados Authorization, ID de clave de acceso de AWS, JWT, contraseñas en URL, valores `ENC` de FortiOS y atributos de contraseña o de secreto. Cada hallazgo se enumera y se enmascara en la imagen, salvo que lo desmarques. Todo se ejecuta en tu navegador.

Donde el medio en el que escribes pueda mostrar texto, mejor texto. El criterio de conformidad 1.4.5 de [WCAG 2.2](https://www.w3.org/TR/WCAG22/), Images of Text (imágenes de texto), pide texto en lugar de imágenes de texto siempre que la tecnología pueda presentarlo; un bloque de código delimitado en una wiki, una base de conocimiento o un sistema de tickets que lo renderice es texto, y quien lo lee puede copiarlo. Esta herramienta es para los sitios que no pueden mostrarlo, y el texto alternativo que escribe es el propio código. [Código en diapositivas y en tickets](/learn/code-on-slides-and-in-tickets) repasa esa elección, el texto alternativo, el contraste y los secretos que conserva una captura de pantalla.

## Lenguajes

Solo resaltado: no se analiza, valida ni ejecuta nada, y el código que no es válido en el lenguaje elegido se dibuja igualmente, coloreado hasta donde llegan las reglas de abajo. Las reglas de cada lenguaje proceden de su propia referencia, consultada el 2026-10-27.

| Lenguaje | Qué se colorea | Referencia |
|---|---|---|
| Texto sin formato | Nada | |
| Shell (POSIX sh) | comentarios `#` solo donde podría empezar una palabra (así que `a#b` no lo es); comillas simples, dobles y de dólar con comilla simple; `$name`, `${...}`, `$1`, `$@` y los demás parámetros especiales, activos dentro de comillas dobles; las palabras reservadas `if then else elif fi do done case esac while until for in` donde están reservadas; el nombre de una asignación como `LOG=...`; palabras que son números enteros | [POSIX.1-2024 Shell Command Language](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/V3_chap02.html), secciones 2.2 a 2.6 |
| Python | comentarios `#`; cadenas con cualquier prefijo (`b`, `r`, `u`, `f`, `t` y las combinaciones con `r`, en mayúsculas o minúsculas), cadenas con triple comilla en varias líneas; las 35 palabras clave; las palabras clave suaves `match`, `case`, `type` y `lazy` cuando abren una sentencia; literales enteros, de coma flotante e imaginarios con guiones bajos y `0x`, `0o`, `0b` | [Python 3.15 Lexical analysis](https://docs.python.org/3/reference/lexical_analysis.html), la versión actual de corrección de errores (fin de vida en 2031-10, [Status of Python versions](https://devguide.python.org/versions/)) |
| JSON | los nombres de miembro (una cadena seguida de `:`) como claves; cadenas; números; `true`, `false`, `null`. JSON no tiene comentarios, así que `//` no se colorea | [RFC 8259](https://www.rfc-editor.org/rfc/rfc8259) |
| YAML | comentarios `#` después de un espacio en blanco; directivas `%`; `---` y `...`; claves de mapeo; escalares entre comillas dobles y simples, también en varias líneas; anclas, alias y etiquetas; los nulos, booleanos, enteros y números de coma flotante del esquema core; el contenido de los escalares de bloque `\|` y `>` | [YAML 1.2.2](https://yaml.org/spec/1.2.2/), secciones 5.3, 6.6, 6.8, 6.9, 7.3, 8.1, 9.1.2 y 10.3.2 |
| Tcl, iRules, Expect | comentarios `#` solo donde empieza un comando (así que `;#` después de un comando sí lo es); palabras entre comillas dobles con `$` y `[...]` activos; `$name`, `${name}`, `$name(index)`; la primera palabra de un comando cuando es un comando integrado de Tcl, `when` o un comando de Expect; `then`, `elseif`, `else`; los números tal como los lee `expr`; el nombre del evento después de `when`. Las palabras entre llaves se colorean como scripts, porque los cuerpos de `proc`, `if`, `when` y `expect` son scripts | [Tcl 9.0 Tcl(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/Tcl.html), [expr(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/expr.html), [if(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/if.html); las iRules están [basadas en Tcl](https://clouddocs.f5.com/api/irules/WhatIsAnIRule.html) y empiezan por [`when`](https://clouddocs.f5.com/api/irules/when.html); los comandos de Expect, de [expect(1)](https://www.tcl-lang.org/man/expect5.31/expect.1.html) |
| F5 tmsh | prompts; comentarios `#` al principio de una palabra; cadenas entre comillas; los comandos y los módulos raíz (`auth cli gtm ltm net sys wom`) fuera de las llaves; los nombres de atributo al principio de una línea dentro de un objeto; direcciones y números | [TMSH Reference v17](https://clouddocs.f5.com/cli/tmsh-reference/latest/general/tmsh.html) y sus [comandos](https://clouddocs.f5.com/cli/tmsh-reference/latest/commands/index.html) |
| FortiOS CLI | prompts; una línea que empieza por `#` y no es un prompt (como la primera línea de una copia de seguridad); cadenas entre comillas simples y dobles con `\'`, `\"` y `\\`; `config`, `edit`, `set`, `unset`, `next`, `end` y los demás comandos; el nombre del campo después de `set`; `ENC`; `$USERFROM`, `$USERNAME`, `$SerialNum`; direcciones y números | [FortiOS 7.6.8 CLI basics](https://docs.fortinet.com/document/fortigate/7.6.8/administration-guide/896276/cli-basics), [Command syntax](https://docs.fortinet.com/document/fortigate/7.6.8/administration-guide/508024/command-syntax), [Subcommands](https://docs.fortinet.com/document/fortigate/7.6.8/administration-guide/627485/subcommands) |
| CLI de estilo Cisco | prompts (`Router>`, `Router#`, `Router(config)#`, `Router(config-if)#`, con o sin espacio detrás); comentarios `!`; `no` y `default` y unos pocos comandos documentados al principio de una línea; direcciones, máscaras y números. La CLI de Cisco no tiene una regla general de entrecomillado, así que nada se colorea como cadena | [IOS XE 17.x Managing Configuration Files](https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/syst-mgmt/b-system-management/m_cm-config-files-0.html) (“Precede a comment with an exclamation point”, pon un signo de exclamación delante de un comentario), [Using the Cisco IOS Command-Line Interface](https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/syst-mgmt/b-system-management/m_cf-cli-basics.html), [Catalyst 8400: Using Cisco IOS XE Software](https://www.cisco.com/c/en/us/td/docs/routers/c8400/c8400-software-config-guide/Using-Cisco-IOS-XE-software.html) |

Lo que no hacen los resaltadores: los here-documents del shell, las sustituciones de comandos anidadas dentro de comillas dobles, los campos de sustitución de las f-strings de Python (toda la f-string se colorea como cadena), los escalares de flujo de YAML en varias líneas y todo lo que necesite un analizador sintáctico en lugar de un escáner.

### Sesiones de terminal

En el shell, Python y Tcl, un texto en el que alguna línea empieza por el prompt de ese lenguaje se lee como una sesión. Los prompts son `$ ` (el valor predeterminado de `PS1` en POSIX) y el prompt de bash de BIG-IP `[root@bigip-1:Active:Standalone] config # ` para el shell, `>>> ` y `... ` (`sys.ps1` y `sys.ps2` de Python) para Python, y `% ` (tclsh) para Tcl. Las líneas con prompt se resaltan como comandos, unidas a la siguiente línea con prompt para que una cadena pueda continuar, y las líneas sin prompt son salida de comandos y quedan sin colorear, de modo que un apóstrofo en la salida no abre ninguna cadena. La página indica cuándo ha leído el texto de esta forma.

En tmsh, FortiOS y la CLI de estilo Cisco se colorean los prompts y se resaltan todas las líneas, porque su salida suele ser configuración.

## La comprobación de secretos

Se ejecuta sobre el texto, sea cual sea el lenguaje elegido, antes de dibujar nada. Cada regla sale de la documentación del formato que busca:

| Regla | Qué busca | Qué se enmascara | Fuente |
|---|---|---|---|
| Clave privada PEM | un bloque `-----BEGIN ... PRIVATE KEY-----`: `PRIVATE KEY`, `ENCRYPTED PRIVATE KEY`, el `RSA PRIVATE KEY` tradicional de OpenSSL (con los encabezados `Proc-Type` y `DEK-Info`) y `OPENSSH PRIVATE KEY`; también un bloque escrito en una sola línea con escapes `\n` | cada línea entre los delimitadores (las líneas de los delimitadores se quedan); sin línea END, las líneas que parecen base64 | [RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), secciones 2, 3, 10, 11; [OpenSSL 3.5 PEM_read_bio_PrivateKey](https://docs.openssl.org/3.5/man3/PEM_read_bio_PrivateKey/); [OpenSSH sshkey.c](https://github.com/openssh/openssh-portable/blob/master/sshkey.c) |
| Encabezado Authorization | `Authorization:` o `Proxy-Authorization:` con `Bearer` o `Basic`, en mayúsculas o minúsculas | las credenciales | [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) 5.1, 11.1, 11.4, 11.6.2; [RFC 6750](https://www.rfc-editor.org/rfc/rfc6750) 2.1; [RFC 7617](https://www.rfc-editor.org/rfc/rfc7617) 2 |
| ID de clave de acceso de AWS | `AKIA` (clave de acceso) o `ASIA` (clave temporal de STS) y 16 letras mayúsculas o dígitos, no dentro de una palabra más larga | el ID | [IAM identifiers](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_identifiers.html); [access keys](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html) |
| JWT | tres (JWS) o cinco (JWE) segmentos base64url unidos por puntos cuyo primer segmento se decodifica como un objeto JSON con `alg` | el token | [RFC 7515](https://www.rfc-editor.org/rfc/rfc7515) 2, 4.1.1, 7.1; [RFC 7516](https://www.rfc-editor.org/rfc/rfc7516) 4.1.1, 7.1; [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519) 1 |
| Contraseña en una URL | `scheme://user:password@` | la contraseña | [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) 3.2.1 |
| Valor cifrado de FortiOS | `set <field> ENC <value>` | el valor | [Consejo técnico de Fortinet](https://community.fortinet.com/fortigate-3/technical-tip-command-fail-while-copying-the-preshare-key-from-another-configuration-214348) (`set psksecret ENC ...`) |
| Comando set | `set <name> <value>` con un nombre que parece de secreto: campos de FortiOS y variables de Tcl (scripts de Expect, iRules) | el valor, dentro de sus comillas o llaves | [FortiOS Subcommands](https://docs.fortinet.com/document/fortigate/7.6.8/administration-guide/627485/subcommands); [Tcl set(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/set.html) |
| Atributo password, passphrase o secret | en tmsh, `password`, `passphrase`, `encrypted-password`, `proxy-ca-passphrase`; en Cisco, `password` y `secret` con un dígito de tipo opcional | el valor | tmsh [auth user](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/auth/auth_user.html), [sys file ssl-key](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/sys/sys_file_ssl-key.html), [ltm profile client-ssl](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_profile_client-ssl.html), [ltm monitor http](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_monitor_http.html); [Cisco IOS XE 17.18 passwords](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-18/configuration_guide/sec/b_1718_sec_9300_cg/controlling_switch_access_with_passwords_and_privilege_levels.html) |
| Miembro JSON | `"name": "value"` con un nombre que parece de secreto | el valor | [RFC 8259](https://www.rfc-editor.org/rfc/rfc8259) 4, 7; [RFC 6749](https://www.rfc-editor.org/rfc/rfc6749) 5.1 (`access_token`, `refresh_token`) |
| Clave YAML | `name: value`, en bloque o en flujo, con un nombre que parece de secreto | el valor | [YAML 1.2.2](https://yaml.org/spec/1.2.2/) 7.3, 7.4, 8.2.2 |
| Asignación de shell | `NAME=value` con un nombre que parece de secreto, también en la cadena de consulta de una URL | el valor | [POSIX](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/V3_chap02.html) 2.10.2; el [archivo de credenciales de la AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html) usa la misma forma |
| Asignación | `name = "string"` (Python, y archivos de estilo TOML o INI) con un nombre que parece de secreto | el contenido de la cadena | [Python 3.15 assignment statements](https://docs.python.org/3/reference/simple_stmts.html) |

**Un nombre que parece de secreto** es una regla propia de esta herramienta, no un estándar: la última palabra del nombre (separando por guiones bajos, guiones, puntos y camelCase) es password, passwd, pass, passphrase, secret, token, psk, psksecret, apikey, accesskey, secretkey, privatekey, credential o credentials, o el nombre termina en key después de api, access, private, secret, signing, client, auth, encryption, master o session. Así, `DB_PASSWORD`, `client_secret`, `refresh_token`, `apiKey` y `aws_secret_access_key` parecen de secreto, y `password_file`, `token_type`, `sort_key` y `PWD` (el directorio de trabajo del shell) no.

**No se informa:** de un valor vacío; de un marcador de posición o un ajuste (`none`, `null`, `true`, `false`, `enable`, `disable` y similares); de una referencia que representa el valor, como `$VAR`, `${VAR}`, `$(cmd)`, `$env(PW)`, un `[command]` de Tcl, `{{ template }}` o `<placeholder>`; de un valor ya enmascarado con `*`, `x` o viñetas; de un valor sin ninguna letra ni dígito. Un hash de estilo crypt como `$6$salt$hash` o el `$9$...` de Cisco no es una referencia y sí se informa. Un atributo password, passphrase o secret dentro de un comentario no se informa, porque los comentarios usan esas palabras en prosa; todas las demás reglas buscan también dentro de los comentarios. Cuando dos reglas encuentran los mismos caracteres, se conserva la más específica (un JWT en un encabezado Bearer es un solo hallazgo).

**Enmascaramiento.** Un valor enmascarado se sustituye por ocho viñetas, sea cual sea su longitud, para que la imagen no revele cuánto medía. Los caracteres se sustituyen, no se tapan: no están ni en el texto del SVG, ni en el PNG, ni en el texto alternativo, donde el valor se lee “[enmascarado]”. Desmarca un hallazgo para mostrarlo tal como está escrito; la elección se recuerda por regla, línea y columna mientras editas en otra parte.

**No es un escáner completo.** Conoce los formatos de arriba y nada más, no puede distinguir un secreto real de un ejemplo, y un secreto que no busca se queda en la imagen. Lee la imagen antes de publicarla.

Los secretos de sesión de la salida de `openssl s_client` son un ejemplo: ninguna regla los busca, así que una línea `Resumption PSK:` de TLS 1.3 se dibuja tal cual, y una línea `Master-Key:` de TLS 1.2 solo se enmascara porque tiene la forma de una clave YAML con un nombre que parece de secreto. El [Explicador de openssl s_client](/tools/openssl-s-client-explainer) incluye ambas entre sus hallazgos.

## Cómo se genera la imagen

El motor maqueta la imagen una sola vez (cada rectángulo, punto y tramo de texto con su posición y su color) y los dos archivos salen de esa maqueta, así que no pueden discrepar.

- **Fuente y cuadrícula.** JetBrains Mono, la fuente monoespaciada del sitio, con la [SIL Open Font License 1.1](https://openfontlicense.org/open-font-license-official-text/). Sus métricas, leídas del archivo de la fuente: 1000 unidades por em, cada carácter de 600 unidades de ancho, ascendente 1020, descendente 300. Una columna mide 0,6 veces el tamaño de fuente, una línea mide 1,5 veces el tamaño de fuente redondeado a un píxel entero, y el texto se sitúa en el centro de su línea. Una columna por punto de código: las tabulaciones se expanden hasta las posiciones que elijas, y los caracteres que son más anchos en algunas fuentes (muchos caracteres de Asia oriental y los emoji) siguen ocupando una columna, así que pueden solaparse con el siguiente.
- **El SVG** conserva cada línea como un elemento `<text>` de texto real, coloreado con elementos `<tspan>`, y da a cada carácter su propia posición x: [SVG 2](https://www.w3.org/TR/SVG2/text.html) aplica el enésimo valor de x al enésimo carácter, contado en puntos de código, de modo que las columnas se mantienen incluso con una fuente de reserva. Nombra la fuente (`'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, 'DejaVu Sans Mono', 'Liberation Mono', monospace`) y no la incrusta; donde JetBrains Mono no está instalada, la fuente monoespaciada del visor dibuja las mismas columnas. Los espacios en blanco se conservan (`xml:space="preserve"` y `white-space: pre`), las ligaduras de programación están desactivadas, el documento tiene un `<title>` con la descripción y `role="img"`, y los números de línea son elementos aparte, para que una selección del código no los arrastre. Los caracteres que un documento XML no puede contener (producción [2] de [XML 1.0](https://www.w3.org/TR/xml/): los caracteres de control salvo la tabulación y el salto de línea, los sustitutos sueltos, U+FFFE y U+FFFF) se sustituyen antes por U+FFFD.
- **El PNG** se dibuja en un canvas en tu navegador a 1x o 2x los píxeles CSS, carácter a carácter sobre la misma cuadrícula, con la copia de JetBrains Mono de la propia página. Las imágenes muy grandes pueden superar el tamaño de canvas que permite un navegador; en ese caso la página lo indica, y el SVG sigue funcionando.
- **Copiar el PNG** usa `ClipboardItem` donde el navegador lo tiene; `image/png` es uno de los tipos de datos que la [Clipboard API](https://www.w3.org/TR/clipboard-apis/) exige admitir para escribir.

No se carga nada de ninguna parte ni se envía nada a ninguna parte. La vista previa es un SVG en línea generado a partir de la maqueta, y las descargas son archivos creados en la página.

## Paletas y contraste

Las dos paletas se miden con las propias fórmulas de WCAG 2.2 (luminancia relativa con el umbral 0,04045, relación de contraste (L1 + 0,05) / (L2 + 0,05)). Todos los colores de texto, los números de línea y el título de la ventana cumplen el 4,5:1 del criterio de conformidad 1.4.3 frente a todos los fondos sobre los que pueden quedar: el fondo del código y la franja de la línea resaltada (el título, frente a la barra de título). La marca a la izquierda de una línea resaltada es un objeto gráfico y cumple el 3:1 del 1.4.11. Los tres puntos de la ventana son decoración. Las relaciones se redondean hacia abajo, así que un aprobado nunca se redondea hacia arriba.

| Texto | Clara: sobre el fondo `#ffffff` | Clara: sobre el resaltado `#fff3c4` | Oscura: sobre el fondo `#11151c` | Oscura: sobre el resaltado `#26303d` |
|---|---|---|---|---|
| Normal | `#1f2328` 15,79 | 14,19 | `#e6e9ef` 15,04 | 10,97 |
| Comentario | `#57606a` 6,38 | 5,74 | `#9ba6b2` 7,39 | 5,39 |
| Cadena | `#0a6629` 7,12 | 6,40 | `#9ddba0` 11,38 | 8,31 |
| Número | `#0550ae` 7,59 | 6,82 | `#8fc6ff` 10,18 | 7,43 |
| Palabra clave | `#a40e26` 7,86 | 7,06 | `#ff9c94` 9,09 | 6,63 |
| Variable | `#8a4600` 7,10 | 6,38 | `#f6bd84` 10,91 | 7,96 |
| Prompt | `#0b6874` 6,46 | 5,81 | `#7fd8d0` 11,00 | 8,03 |
| Clave | `#6639ba` 7,34 | 6,59 | `#c9b0ff` 9,70 | 7,08 |
| Valor enmascarado | `#9c1c6f` 7,47 | 6,71 | `#ff8fd0` 8,79 | 6,41 |
| Número de línea | `#5f6872` 5,66 | 5,08 | `#97a1ad` 6,98 | 5,09 |

Título de la ventana sobre la barra de título: clara, `#3a424a` sobre `#eceff3`, 8,84; oscura, `#c3cbd4` sobre `#1d232c`, 9,64. Marca de resaltado (se exige 3:1): clara, `#9a6700`, 4,86 sobre el fondo y 4,37 sobre el resaltado; oscura, `#e3b341`, 9,40 y 6,86.

## Texto alternativo

El texto alternativo es una descripción de una línea (cuántas líneas, qué lenguaje, cuántos valores enmascarados), una línea en blanco y después el código como texto sin formato, con cada valor enmascarado escrito como “[enmascarado]”. Así se cumple el criterio de conformidad 1.1.1, Non-text Content (contenido no textual): la alternativa textual de una imagen de código cumple el mismo propósito cuando es el propio código. Cuando el texto alternativo vaya a ser largo, pon el código como texto junto a la imagen (en una diapositiva, en las notas del orador) y deja solo la descripción como texto alternativo.

## Opciones

- **Lenguaje**: el resaltador (consulta la tabla de arriba).
- **Paleta**: oscura (la predeterminada) o clara.
- **Tamaño de fuente**: 12, 14, 16 (el predeterminado), 18, 20, 24 o 28 píxeles CSS.
- **Tabulaciones**: cada 2, 4 (el predeterminado) u 8 columnas.
- **Relleno**: 16, 32 (el predeterminado), 48 o 64 píxeles CSS alrededor de la ventana, o alrededor del código si no hay marco.
- **Números de línea**: activados de forma predeterminada.
- **Marco de ventana**: activado de forma predeterminada, con tres puntos decorativos y un título opcional de hasta 80 caracteres.
- **Resaltar líneas**: números y rangos separados por comas o espacios, como `3, 5-7`. Un elemento que no es ni un número ni un rango, el cero o un rango al revés se ignoran, y un rango que pasa de la última línea se conserva hasta la última línea; la página enumera lo que ignoró.

## Límites y lo que cambia

La herramienta rechaza, indicando el motivo, un texto de más de 50.000 caracteres, más de 400 líneas, una línea de más de 400 columnas una vez expandidas las tabulaciones, un título de más de 80 caracteres y una lista de resaltado de más de 200 caracteres. Así la imagen se mantiene dentro de lo que puede usar una diapositiva o un ticket y de lo que pueden dibujar los navegadores.

Te avisa cuando ha quitado una marca de orden de bytes, ha leído los retornos de carro como saltos de línea, ha sustituido caracteres que XML no puede contener, ha expandido tabulaciones, ha recortado espacios al final de las líneas (solo ensancharían la imagen) o ha leído el texto como una sesión de terminal. Un salto de línea final no genera una línea más.

## Ejemplo resuelto

El botón Ejemplo carga una fase 1 de IPsec de FortiOS cuya clave precompartida está en la forma cifrada `ENC`, escrita para este ejemplo (base64 de “for-demo-only-not-a-real-key”), con la dirección de documentación 203.0.113.10 del [RFC 5737](https://www.rfc-editor.org/rfc/rfc5737):

```
config vpn ipsec phase1-interface
    edit "to-branch-01"
        set interface "port1"
        set peertype any
        set proposal aes256-sha256
        set remote-gw 203.0.113.10
        set psksecret ENC Zm9yLWRlbW8tb25seS1ub3QtYS1yZWFsLWtleQ==
    next
end
```

La comprobación de secretos informa de un hallazgo, “Valor cifrado de FortiOS (ENC), línea 7, columna 27”, y la imagen muestra `set psksecret ENC ••••••••` en la línea 7, que el Ejemplo también resalta, bajo el título “VPN to branch 01” (VPN: red privada virtual, virtual private network). El SVG mide 451,2 por 348 píxeles CSS con la paleta oscura, y el texto alternativo empieza por “Imagen de código: 9 líneas de FortiOS CLI, 1 valor enmascarado”.

## Compartir resultados

Debajo de los botones de exportación, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva tres cosas después del `#`: el texto tal como lo muestra la imagen, con cada valor que enmascaró la comprobación de secretos sustituido por las mismas ocho viñetas, el lenguaje del resaltado y la paleta. No se llevan el título de la ventana (texto libre que la comprobación de secretos no lee), las líneas resaltadas, el tamaño de fuente, el relleno, las tabulaciones ni las dos opciones. Un valor que desmarcaste va en el enlace tal como lo escribiste, y la ventana emergente nombra cada uno de esos valores por su línea y su etiqueta antes de que copies nada; cuando no hay nada desmarcado, indica que todos los valores encontrados están enmascarados. Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que el texto no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra.

- **Longitud.** Como máximo 16.384 caracteres de texto, el límite que el sitio aplica a todo valor después del `#`; si el texto es más largo, no hay enlace, y la ventana emergente lo indica.
- **Al abrir un enlace.** El texto rellena el cuadro como lo haría un pegado, se establecen el lenguaje y la paleta, y se dibuja la imagen; las demás elecciones de la página que lo recibe se quedan como están. Un valor enmascarado llega como ocho viñetas: en algunas líneas la comprobación de secretos vuelve a encontrarlas y las vuelve a enmascarar, en otras las dibuja como caracteres normales, así que la descripción puede contar menos valores enmascarados, pero no hay ningún valor que revelar. Un lenguaje o una paleta que la herramienta no ofrece hacen que se ignore el enlace entero. En ambos casos, los valores salen de la dirección de la página al instante, sin ninguna solicitud.

## Procedencia

El comportamiento lo fija el conjunto de vectores de referencia `code-to-image-golden-2026-10-27b`: el coloreado de todos los lenguajes (texto sin formato, script y sesión de shell, script y sesión de Python, JSON, YAML, una iRule, un script de Expect, una sesión de tclsh, tmsh, FortiOS, estilo Cisco), tres documentos SVG byte a byte con su texto alternativo (cada uno comprobado como XML bien formado y con una posición x por carácter), cada regla de secretos en positivo y en negativo con los caracteres exactos que se enmascaran (y comprobando que no están en el SVG ni en el texto alternativo cuando se enmascaran), cada límite en su valor y por encima de él, la normalización, los avisos, el analizador del resaltado y cada relación de contraste anterior, cuya luminancia se compara también con la [herramienta de contraste de color](/tools/color-contrast-format) del sitio, y el texto que lleva un enlace de Compartir resultados para siete entradas, byte a byte, con la comprobación de que la página que lo recibe dibuja los mismos caracteres y de que ningún valor enmascarado está en el enlace.

## API

No se expone a través de la API, a propósito. El PNG lo dibuja el navegador de quien lo usa, y la entrada es el tipo de texto que contiene secretos: la configuración, las capturas y los scripts son justo aquello para lo que existe la comprobación de secretos, y el lugar seguro para comprobarlos es el equipo en el que ya están. Enviarlos a un servidor para comprobarlos anularía la comprobación.

## Fuentes

Todas consultadas el 2026-10-27.

- [The Open Group Base Specifications Issue 8 (POSIX.1-2024), Shell Command Language](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/V3_chap02.html)
- [Python 3.15: Lexical analysis](https://docs.python.org/3/reference/lexical_analysis.html), [sys.ps1 and sys.ps2](https://docs.python.org/3/library/sys.html), [assignment statements](https://docs.python.org/3/reference/simple_stmts.html), [Status of Python versions](https://devguide.python.org/versions/)
- [RFC 8259, JSON](https://www.rfc-editor.org/rfc/rfc8259)
- [YAML 1.2.2](https://yaml.org/spec/1.2.2/)
- [Tcl 9.0: Tcl(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/Tcl.html), [expr(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/expr.html), [if(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/if.html), [set(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/set.html), [tclsh(1)](https://www.tcl-lang.org/man/tcl9.0/UserCmd/tclsh.html), [el índice de comandos](https://www.tcl-lang.org/man/tcl9.0/TclCmd/index.html), [las versiones publicadas](https://www.tcl-lang.org/software/tcltk/)
- [F5 iRules: What Is An iRule](https://clouddocs.f5.com/api/irules/WhatIsAnIRule.html) y [when](https://clouddocs.f5.com/api/irules/when.html); [expect(1)](https://www.tcl-lang.org/man/expect5.31/expect.1.html)
- [F5 TMSH Reference v17](https://clouddocs.f5.com/cli/tmsh-reference/latest/) (tmsh, el índice de comandos, el PDF de 17.0.0, auth user, sys file ssl-key, ltm profile client-ssl, ltm monitor http). La política de soporte de software de F5, [K5903](https://my.f5.com/manage/s/article/K5903) (consultado el 2026-10-27), da a las versiones Long-Term Stability Release de 17.x soporte estándar (Standard Support) hasta el 31 de marzo de 2027 (17.1.x) y el 1 de enero de 2029 (17.5.x).
- [FortiOS 7.6.8 Administration Guide](https://docs.fortinet.com/document/fortigate/7.6.8/administration-guide/896276/cli-basics) (CLI basics, Command syntax, Subcommands, Trusted platform module support), [CLI Reference: config system admin](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/390485493/config-system-admin), los consejos técnicos de Fortinet sobre [copiar una clave precompartida](https://community.fortinet.com/fortigate-3/technical-tip-command-fail-while-copying-the-preshare-key-from-another-configuration-214348) y sobre [el fin del soporte de FortiOS 7.4 y 7.6](https://community.fortinet.com/fortigate-3/technical-tip-fortios-end-of-support-change-for-fortios-v7-4-and-v7-6-224876) (7.6: fin del soporte de ingeniería el 25 de julio de 2028, fin del soporte el 25 de enero de 2030)
- Cisco IOS XE 17.x System Management Configuration Guide: [Managing Configuration Files](https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/syst-mgmt/b-system-management/m_cm-config-files-0.html) y [Using the Cisco IOS Command-Line Interface](https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/syst-mgmt/b-system-management/m_cf-cli-basics.html); [Catalyst 8400: Using Cisco IOS XE Software](https://www.cisco.com/c/en/us/td/docs/routers/c8400/c8400-software-config-guide/Using-Cisco-IOS-XE-software.html); [IOS XE 17.18 passwords](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-18/configuration_guide/sec/b_1718_sec_9300_cg/controlling_switch_access_with_passwords_and_privilege_levels.html); [la declaración del ciclo de vida del software IOS XE](https://www.cisco.com/c/en/us/products/collateral/ios-nx-os-software/ios-xe-26/bulletin-c25-2378701.html)
- [RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), [OpenSSL 3.5 PEM_read_bio_PrivateKey](https://docs.openssl.org/3.5/man3/PEM_read_bio_PrivateKey/) (3.5 es la versión de soporte a largo plazo de OpenSSL, con soporte hasta el 2030-04-08 según su [estrategia de versiones](https://openssl-library.org/policies/releasestrat/)), [OpenSSH sshkey.c](https://github.com/openssh/openssh-portable/blob/master/sshkey.c)
- [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), [RFC 6750](https://www.rfc-editor.org/rfc/rfc6750), [RFC 7617](https://www.rfc-editor.org/rfc/rfc7617), [RFC 6749](https://www.rfc-editor.org/rfc/rfc6749)
- AWS: [IAM identifiers](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_identifiers.html), [access keys](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html), [CLI configuration and credential files](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html)
- [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), [RFC 7515](https://www.rfc-editor.org/rfc/rfc7515), [RFC 7516](https://www.rfc-editor.org/rfc/rfc7516), [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), [RFC 5737](https://www.rfc-editor.org/rfc/rfc5737)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [Understanding 1.4.5 Images of Text](https://www.w3.org/WAI/WCAG22/Understanding/images-of-text.html), [Understanding 1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- [SVG 2, Text](https://www.w3.org/TR/SVG2/text.html), [XML 1.0 (Fifth Edition)](https://www.w3.org/TR/xml/), [Clipboard API and events](https://www.w3.org/TR/clipboard-apis/), [Content Security Policy Level 3](https://www.w3.org/TR/CSP3/)
- [SIL Open Font License 1.1](https://openfontlicense.org/open-font-license-official-text/), y el archivo LICENSE del paquete @fontsource/jetbrains-mono 5.2.8 (Copyright 2020 The JetBrains Mono Project Authors)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultado el 2026-10-27): sección 3.5, el fragmento, que lleva los valores de un enlace de Compartir resultados
