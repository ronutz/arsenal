## Qué hace

Lee una iRule según la “iRules Style Guide” de DevCentral (publicada por JRahm con Jim_Deucker el 22 de diciembre de 2022), añade dos puntos planteados en el hilo de comentarios de la guía y la somete a un análisis sintáctico real de Tcl 8.4. La iRule se analiza, nunca se ejecuta. Cada hallazgo nombra la regla de la que procede, la línea y lo que hay que cambiar; las líneas señaladas se marcan en una copia numerada de la iRule.

## Qué comprueba

- **Configuración del editor (E1 a E3):** tabulaciones y sangrías que no son múltiplos de 4 espacios, líneas de más de 100 columnas (una advertencia a partir de 120), finales de línea de Windows, espacios en blanco al final de la línea, la falta de un salto de línea final y los caracteres no ASCII, cada uno identificado con su punto de código, su nombre Unicode oficial y su columna.
- **Reglas numeradas:** caracteres que rompen el código (R1), el límite de tamaño de F5 (R2), una `{` sola en su propia línea o un `else` en una línea nueva (R4), comentarios al final de la línea, comentarios sin espacio y comentarios entre patrones de `switch` (R6), varios comandos en una línea (R7), `if` de una sola línea (R8), estado guardado como palabras, como `yes` (R9), los `and` / `or` / `not` de F5 (R10), `}{` sin espacio o una palabra clave pegada a su llave (R11), expresiones sin llaves (R12), variables en expresiones sin espacios alrededor (R13) o sin llaves alrededor del nombre (R14), `switch` y `table` sin `--` (R15), eventos sin prioridad (R16), entradas de `table` sin tiempo de espera (timeout) ni tiempo de vida (lifetime) (R17; si no se indican, la referencia de `table` de F5 aplica un tiempo de espera de 180 segundos y un tiempo de vida indefinido), nombres `static::` sin prefijo (R18), flags de depuración en `static::` (R19) y código comentado (R20).
- **Del hilo de comentarios (D1, D2):** `==` o `!=` con un texto, cuando lo que se quiere es `eq` o `ne` (D1); `break` o `continue` sin ningún bucle alrededor, `break` en una rama de `switch` dentro de un bucle y `return` en una rama de `switch` (D2).
- **Sintaxis:** un error que indica el analizador de Tcl 8.4, como `}{` sin espacio (“extra characters after close-brace”), significa que la iRule no puede cargarse en absoluto.

## Caracteres que se esconden en el código

La primera regla de la guía trata de las comillas tipográficas y los espacios de no separación que cuela un procesador de textos. El comprobador clasifica cada carácter no ASCII con la Unicode Character Database 18.0.0, así que encuentra toda la familia, no solo esos dos:

- **R1, error:** caracteres invisibles (la lista Default_Ignorable_Code_Point de Unicode: espacios y caracteres de unión de ancho cero, la marca de orden de bytes, el guion opcional (soft hyphen), los controles bidireccionales), espacios que no son el espacio ASCII (de no separación, de cuadratín, ideográfico y otros) y comillas tipográficas. Probado en tclsh 8.4.6: un espacio de no separación pega dos palabras en un solo nombre de comando, las comillas curvas no agrupan palabras y un espacio de ancho cero después de una llave de cierre detiene la regla con “extra characters after close-brace”.
- **E3, advertencia:** guiones que no son el guion-menos (hyphen-minus) ASCII. Tcl no los lee ni como guion de opción ni como signo menos: un `switch` con una semirraya (en dash, U+2013) escrita donde va `--` toma ese guion como el valor y, sin avisar, no coincide con nada.
- **E3, nota:** otros caracteres que parecen ASCII (letras de ancho completo, los puntos suspensivos, los números romanos) y cualquier otro carácter no ASCII.

Esto afecta a la propia guía: tal como estaba publicada el 3 de octubre de 2026, su ejemplo de `RULE_INIT` tiene un espacio de ancho cero después de la llave de cierre y su ejemplo de depuración tiene una línea que solo contiene uno, así que copiar cualquiera de los dos tal cual rompe la iRule.

## El límite de tamaño

El K9204 de F5 fija el límite en 65.520 caracteres; BIG-IP se niega a guardar o cargar una iRule más larga, con un error que dice “Max string size exceeded” y “max:65520”. La guía lo redondea a 64 KB. El comprobador cuenta los caracteres y los bytes que ocupan en UTF-8, e informa de R2 cuando cualquiera de las dos cifras supera 65.520.

## Del hilo de comentarios

- **D1:** Kai Wilke señaló que el ejemplo de la regla 10 de la guía compara texto con `==`, y los autores aceptaron añadir un punto sobre `eq` / `ne`. `==` compara como números siempre que los dos lados parecen números: en Tcl 8.4.6, `10 == 012` y `1 == "0x0000001"` son verdaderos los dos. La página How To Write Fast Rules de F5 pide comparar números con números y cadenas con cadenas.
- **D2:** Juergen Mang observó que las ramas de `switch` no necesitan `return` ni `break` para terminar. Una rama de `switch` nunca continúa en la siguiente, `return` sale de todo el evento (página de `return` de F5) y `break` sin ningún bucle alrededor es un error en Tcl 8.4.6 (comprobado en el cuerpo de un proc). F5 no documenta qué hace TMM con él en el cuerpo de un evento.

## Compartir resultados

Debajo del veredicto, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` la iRule tal como se pegó, y nada más. Antes de que copies nada, la ventana emergente añade una precaución: una iRule puede nombrar hosts, pools y data groups internos.

Antes incluso de ofrecer un enlace, la página busca en la iRule claves y credenciales escritas tal cual donde las ponen las propias referencias de F5 (todas consultadas el 2026-10-27):

- la frase de contraseña (pass phrase) de `HTTP::cookie encrypt` y `decrypt` ([HTTP::cookie](https://clouddocs.f5.com/api/irules/HTTP__cookie.html));
- una clave en la forma de cadena `AES 128 <hex>`, o la clave de `AES::encrypt` y `AES::decrypt` escrita tal cual ([AES::key](https://clouddocs.f5.com/api/irules/AES__key.html), [AES::encrypt](https://clouddocs.f5.com/api/irules/AES__encrypt.html));
- el valor de `-key` o `-keyhex` en `CRYPTO::encrypt`, `decrypt`, `sign` y `verify` ([CRYPTO::encrypt](https://clouddocs.f5.com/api/irules/CRYPTO__encrypt.html));
- un encabezado `Authorization` o `Proxy-Authorization` escrito con `HTTP::header insert` o `replace` ([HTTP::header](https://clouddocs.f5.com/api/irules/HTTP__header.html)), cuyo valor el [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) (secciones 11.6.2 y 11.7.2) define como las credenciales;
- un literal asignado con `set` a una variable que se usa en uno de esos lugares, como en el propio ejemplo de `CRYPTO::encrypt`;
- y, por la comprobación de secretos del sitio, una clave privada PEM, un JWT, un ID de clave de acceso de AWS o una contraseña en una URL.

Si la página encuentra alguno, no hay enlace: la ventana emergente nombra la línea, y tú sustituyes el valor por un marcador de posición y vuelves a presionar. Un valor cuyo nombre solo parece el de un secreto (`set static::api_token "..."`) no impide el enlace; en su lugar, la línea de precaución lo nombra. Ninguna comprobación encuentra todos los secretos, así que lee lo que envías.

Todo lo que lleva el enlace va después del `#`, que el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27) describe como “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo): el navegador no lo envía al servidor cuando se abre el enlace, pero se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres, el límite que el sitio aplica a todo valor después del `#`; si la iRule es más larga, no hay enlace, y la ventana emergente indica su longitud. F5 admite iRules de hasta 65.520 caracteres (K9204), así que una iRule larga puede pasar este comprobador y aun así ser demasiado larga para un enlace.
- **Al abrir un enlace.** El texto rellena el cuadro como lo haría un pegado, y la página lo lee igual que lee lo pegado; la iRule nunca se ejecuta. Se acepte o no, los valores salen después de la propia dirección de la página al instante, sin ninguna solicitud, así que al recargar, con un marcador o con el propio botón Compartir de la página no se lleva nada que no hayas decidido compartir.

## Límites

- Las variables de array como `$static::pools($key)` son Tcl válido, pero el motor de Tcl del sitio no las modela. El comprobador lee cada una como una variable simple, sigue comprobando el resto de la iRule y lo indica en una nota.
- Algunas reglas no se pueden juzgar solo a partir del texto. Si una línea que empieza por `#` es código comentado o un comentario al que le falta el espacio es una suposición basada en la primera palabra, así que esos hallazgos son notas.
- La regla R3 (dividir la iRule en bloques funcionales) es una decisión de diseño que el comprobador no juzga. R5 (la sangría de 4 espacios que se mantiene en valores anidados, como las ramas de `switch`) la cubre la comprobación de sangría. La recomendación de configuración del editor de evitar las continuaciones de línea no se comprueba.

## Fuentes

- [F5 DevCentral: iRules Style Guide, con su hilo de comentarios](https://community.f5.com/t/irules-style-guide/71151) (consultado el 2026-10-03)
- [F5 K9204: iRules are limited to 65,520 characters](https://my.f5.com/manage/s/article/K9204) (consultado el 2026-10-03)
- [F5 K15650046: Tcl code injection security exposure](https://my.f5.com/manage/s/article/K15650046) (consultado el 2026-10-03)
- [F5 K57410758: use curly braces to avoid double substitution](https://my.f5.com/manage/s/article/K57410758) (consultado el 2026-10-03)
- [F5 iRules reference: How To Write Fast Rules](https://clouddocs.f5.com/api/irules/HowToWriteFastRules.html) (consultado el 2026-10-03)
- [F5 iRules reference: return](https://clouddocs.f5.com/api/irules/return.html) (consultado el 2026-10-03)
- [F5 iRules reference: priority](https://clouddocs.f5.com/api/irules/priority.html) (consultado el 2026-10-03)
- [F5 iRules reference: table](https://clouddocs.f5.com/api/irules/table.html) (consultado el 2026-10-03)
- [Tcl 8.4 manual: switch](https://www.tcl-lang.org/man/tcl8.4/TclCmd/switch.htm) (consultado el 2026-10-03)
- [Tcl 8.4 manual: break](https://www.tcl-lang.org/man/tcl8.4/TclCmd/break.htm) (consultado el 2026-10-03)
- [Unicode Character Database 18.0.0: PropList.txt](https://www.unicode.org/Public/UCD/latest/ucd/PropList.txt) (consultado el 2026-10-03)
- [Unicode Character Database 18.0.0: DerivedCoreProperties.txt](https://www.unicode.org/Public/UCD/latest/ucd/DerivedCoreProperties.txt) (consultado el 2026-10-03)
- [Unicode Character Database 18.0.0: UnicodeData.txt](https://www.unicode.org/Public/UCD/latest/ucd/UnicodeData.txt) (consultado el 2026-10-03)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultado el 2026-10-27): sección 3.5, el fragmento, que lleva los valores de un enlace de Compartir resultados
- [F5 iRules reference: HTTP::cookie](https://clouddocs.f5.com/api/irules/HTTP__cookie.html), [AES::key](https://clouddocs.f5.com/api/irules/AES__key.html), [AES::encrypt](https://clouddocs.f5.com/api/irules/AES__encrypt.html), [CRYPTO::encrypt](https://clouddocs.f5.com/api/irules/CRYPTO__encrypt.html) y [HTTP::header](https://clouddocs.f5.com/api/irules/HTTP__header.html) (consultado el 2026-10-27): dónde guarda una iRule una frase de contraseña, una clave o credenciales, que impiden un enlace de Compartir resultados
- [RFC 9110, HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110) (consultado el 2026-10-27): secciones 11.6.2 y 11.7.2, los valores de Authorization y de Proxy-Authorization son credenciales
