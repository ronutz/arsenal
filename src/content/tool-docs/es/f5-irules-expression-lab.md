## Qué hace

Evalúa una expresión como lo hacen `expr`, `if` y `while` en una iRule, y muestra la evaluación completa: el valor y cómo se representa, la expresión con los operandos de cada operador entre paréntesis para que se vea la precedencia, un árbol con cada paso y, en una comparación, lo que `==`, `eq`, `<` y `>` hacen cada uno con los mismos dos operandos. Las variables toman sus valores de comandos `set` normales, así que el entrecomillado se comporta exactamente igual que en una iRule.

Hay dos modos: **Tcl 8.4** (Tcl 8.4.6 a secas, la base que F5 indica en el K6091) y el modo **iRules**, que añade los operadores que documenta F5 (`contains`, `starts_with`, `ends_with`, `equals`, `matches_glob`, `matches_regex`, `and`, `or`, `not`) y comandos de solicitud como `[HTTP::uri]`, que responden a partir de una solicitud de ejemplo editable.

## Cómo se lee el árbol

Cada recuadro es una parte de la expresión: su código fuente, una flecha y lo que produjo. Los operandos quedan debajo de su operador. Las notas bajo un recuadro dicen qué pasó ahí, por ejemplo “Se compara como enteros: 10 y 10” para `$x == $y` con `x` definida como `012`, o “Se compara como texto porque el lado izquierdo no es un número”. Una parte marcada como “nunca se evaluó” la saltó `&&`, `||` o `?:`.

## Conviene saber

- `==` y los demás operadores de comparación comparan números cuando los dos lados se leen como números, y texto en caso contrario. `eq` y `ne` siempre comparan texto.
- En una comparación de texto deciden los códigos de carácter, así que cualquier letra mayúscula va antes que cualquier minúscula: `"bench" < "Chair"` es falso.
- `true == 1` es falso: `true` es una palabra booleana, no un número, así que la comparación es entre textos.
- Tcl 8.4 no tiene operador `**`; `2 ** 3` es un error de sintaxis.
- La división entera redondea hacia menos infinito (`7 / -2` da `-4`) y el resto toma el signo del divisor.
- Un literal como `08` escrito en la expresión se rechaza al compilar la expresión, antes de que se ejecute ninguna parte de ella.
- Pon tus expresiones entre llaves. Sin llaves, Tcl sustituye el texto dos veces, lo que es más lento y permite que los datos se ejecuten como código (F5 K57410758 y K15650046). El ejecutor paso a paso de scripts muestra cómo ocurre.

## Compartir resultados

Debajo del resultado, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva lo que lee la evaluación, por nombre: la expresión como `#input=`, los comandos set como `&setup=`, `&mode=irules` en el modo iRules y, en ese modo, los `HTTP::uri` y `HTTP::host` de ejemplo si los cambiaste (`&uri=`, `&host=`). Tcl a secas es el valor predeterminado y no se incluye, ni tampoco un ejemplo que Tcl a secas no lee. Los comandos set son donde acaban los valores copiados de una iRule, así que la página revisa cada campo que llevaría el enlace con la misma comprobación de secretos que las herramientas de este sitio que leen iRules.

Antes incluso de ofrecer un enlace, busca claves y credenciales escritas tal cual donde las ponen las propias referencias de F5 (todas consultadas el 2026-10-27):

- la frase de contraseña (pass phrase) de `HTTP::cookie encrypt` y `decrypt` ([HTTP::cookie](https://clouddocs.f5.com/api/irules/HTTP__cookie.html));
- una clave en la forma de cadena `AES 128 <hex>`, o la clave de `AES::encrypt` y `AES::decrypt` escrita tal cual ([AES::key](https://clouddocs.f5.com/api/irules/AES__key.html), [AES::encrypt](https://clouddocs.f5.com/api/irules/AES__encrypt.html));
- el valor de `-key` o `-keyhex` en `CRYPTO::encrypt`, `decrypt`, `sign` y `verify` ([CRYPTO::encrypt](https://clouddocs.f5.com/api/irules/CRYPTO__encrypt.html));
- un encabezado `Authorization` o `Proxy-Authorization` escrito con `HTTP::header insert` o `replace` ([HTTP::header](https://clouddocs.f5.com/api/irules/HTTP__header.html)), cuyo valor el [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) (secciones 11.6.2 y 11.7.2) define como las credenciales;
- un literal asignado con `set` a una variable que se usa en uno de esos lugares, como en el propio ejemplo de `CRYPTO::encrypt`;
- y, por la comprobación de secretos del sitio, una clave privada PEM, un JWT, un ID de clave de acceso de AWS o una contraseña en una URL.

Si la página encuentra alguno, no hay enlace: la ventana emergente nombra el campo y la línea, y tú sustituyes el valor por un marcador de posición y vuelves a presionar. Un valor cuyo nombre solo parece el de un secreto (`set static::api_token "..."`) no impide el enlace; en su lugar, la línea de precaución lo nombra. Ninguna comprobación encuentra todos los secretos, así que lee lo que envías.

Todo lo que lleva el enlace va después del `#`, que el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27) describe como “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo): el navegador no lo envía al servidor cuando se abre el enlace, pero se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Un enlace lleva como máximo 16.384 caracteres, el límite que el sitio aplica a todo valor después del `#`; si el conjunto de campos es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** Los campos se rellenan como si los escribieras (si el enlace cambió la solicitud de ejemplo, se muestra abierta) y la página los retiene: una nota indica que vienen de un enlace compartido, y no se evalúa nada hasta que presionas **Evaluar** o cambias un campo. El intérprete didáctico nunca ejecuta por sí solo el texto de un enlace. Un modo distinto de `tcl` o `irules`, o un valor de ejemplo en el modo Tcl a secas, hace que se ignore todo el enlace. Se acepte o no, los valores salen después de la propia dirección de la página al instante, sin ninguna solicitud, así que al recargar, con un marcador o con el propio botón Compartir de la página no se lleva nada que no hayas decidido compartir.

## Límites

F5 documenta sus operadores de palabra, pero no su precedencia respecto a los operadores de Tcl; la herramienta coloca `contains`, `starts_with` y los demás con `==`, y `and` y `or` con `&&` y `||`. `rand()` y `srand()` se rechazan porque sus resultados no se pueden reproducir. Los comandos que se ejecutan dentro de una expresión (entre corchetes) usan el mismo intérprete reducido que el ejecutor paso a paso de scripts, limitado a 2000 comandos. Esta herramienta no se ofrece a través de la API, porque ejecuta el Tcl que le das.

## Fuentes

- [F5 K6091: The version of Tcl used to develop iRules](https://my.f5.com/manage/s/article/K6091) (consultado el 2026-10-03)
- [Tcl 8.4 manual: expr](https://www.tcl-lang.org/man/tcl8.4/TclCmd/expr.htm) (consultado el 2026-10-03)
- [F5 iRules reference: Operators](https://clouddocs.f5.com/api/irules/Operators.html) (consultado el 2026-10-02)
- [F5 K57410758: use curly braces to avoid double substitution](https://my.f5.com/manage/s/article/K57410758) (consultado el 2026-10-03)
- [F5 K15650046: Tcl code injection security exposure](https://my.f5.com/manage/s/article/K15650046) (consultado el 2026-10-03)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultado el 2026-10-27): sección 3.5, el fragmento, que lleva los valores de un enlace de Compartir resultados
- [F5 iRules reference: HTTP::cookie](https://clouddocs.f5.com/api/irules/HTTP__cookie.html), [AES::key](https://clouddocs.f5.com/api/irules/AES__key.html), [AES::encrypt](https://clouddocs.f5.com/api/irules/AES__encrypt.html), [CRYPTO::encrypt](https://clouddocs.f5.com/api/irules/CRYPTO__encrypt.html) y [HTTP::header](https://clouddocs.f5.com/api/irules/HTTP__header.html) (consultado el 2026-10-27): dónde guarda una iRule una frase de contraseña, una clave o credenciales, que impiden un enlace de Compartir resultados
- [RFC 9110, HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110) (consultado el 2026-10-27): secciones 11.6.2 y 11.7.2, los valores de Authorization y de Proxy-Authorization son credenciales
