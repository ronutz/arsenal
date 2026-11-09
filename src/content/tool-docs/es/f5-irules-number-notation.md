## Qué hace

Escribe un valor tal como aparece en una iRule, como `010`, `0x1F`, `08`, `1e3` o `" 12 "`, y la herramienta muestra cómo lo lee Tcl 8.4.6. F5 indica en el K6091 que el conjunto de comandos de iRules se desarrolló a partir de la versión base 8.4.6 de Tcl, así que estas son las reglas que aplica un BIG-IP. El motor de la herramienta se comprobó con un intérprete real de Tcl 8.4.6 compilado a partir del código fuente oficial.

## Cómo se lee el resultado

- **El titular** dice si el texto es un entero, un double (coma flotante) o no es un número, en qué base se escribió un entero y cómo lo imprime Tcl. `010` es el entero 8, escrito en octal.
- **Otras notaciones** muestra el mismo entero en decimal, hexadecimal, octal y binario, y cómo escribirlo en una iRule. Tcl 8.4 no tiene notación binaria, así que esa fila no tiene forma de Tcl.
- **Dentro del double** muestra lo que ocultan las 12 cifras impresas: Tcl 8.4 imprime los doubles con 12 cifras significativas (su `tcl_precision` vale 12 de forma predeterminada), así que `0.1` se imprime como `0.1` mientras que el valor guardado es `0.1000000000000000055511151231257827021181583404541015625`.
- **Dos lugares donde Tcl lee números** compara el valor escrito directamente en una expresión (`expr {08}`, un error antes de que se ejecute nada) con el mismo texto guardado en una variable (`set x 08; expr {$x + 0}`, un error solo cuando la aritmética necesita el número).
- **Comparación con** ejecuta `==`, `eq`, `<` y `>` contra un segundo valor que eliges tú, con el motivo de cada resultado.

## Conviene saber

- Un 0 inicial significa octal: `010 == 8` es verdadero y `010 eq 8` es falso, porque `eq` compara texto.
- `08` y `09` no son números en absoluto. En aritmética fallan con “can't use invalid octal number”; en una comparación pasan a ser texto sin avisar, así que `"08" == 8` es falso.
- Para Tcl, un double nunca es un entero: `3.0 == 3` es verdadero, pero `3.0` se imprime con su punto decimal y `%` lo rechaza.
- Los valores desde 2 elevado a 63 hasta 2 elevado a 64 menos 1 se aceptan y dan la vuelta hasta números negativos; cualquier valor mayor se rechaza.

## Compartir resultados

Debajo del titular y de sus notas, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva el valor exactamente como se escribió, espacios incluidos (forman parte del valor que lee Tcl), como `#input=`, y el valor con el que se compara como `&other=` cuando ese campo tiene algo. Todo lo que lleva el enlace va después del `#`, que el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27) describe como “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo): el navegador no lo envía al servidor cuando se abre el enlace, pero se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Un enlace lleva como máximo 16.384 caracteres, el límite que el sitio aplica a todo valor después del `#`; un número ocupa mucho menos.
- **Al abrir un enlace.** Los dos campos se rellenan como si los escribieras y la página lee el valor; si el enlace no lleva comparación, ese campo queda vacío, como lo tenía quien lo envió. Se acepta cualquier valor, igual que al escribir: la página dice qué hace Tcl con él. Se acepte o no, los valores salen después de la propia dirección de la página al instante, sin ninguna solicitud, así que al recargar, con un marcador o con el propio botón Compartir de la página no se lleva nada que no hayas decidido compartir.

## Límites

Los enteros se modelan con 64 bits de ancho. Tcl 8.4 usa el `long` de C de la plataforma para la que se compiló, así que una compilación de 32 bits leería de otra forma los valores grandes; la herramienta lo indica cuando un valor no cabe en 32 bits.

## Fuentes

- [F5 K6091: The version of Tcl used to develop iRules](https://my.f5.com/manage/s/article/K6091) (consultado el 2026-10-03)
- [Tcl 8.4 manual: expr](https://www.tcl-lang.org/man/tcl8.4/TclCmd/expr.htm) (consultado el 2026-10-03)
- [F5 iRules reference: Operators](https://clouddocs.f5.com/api/irules/Operators.html) (consultado el 2026-10-02)
- [Tcl 8.4.6 source code, tag core-8-4-6](https://github.com/tcltk/tcl/tree/core-8-4-6) (el intérprete de referencia; `doc/tclvars.n` documenta el `tcl_precision` predeterminado de 12)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultado el 2026-10-27): sección 3.5, el fragmento, que lleva los valores de un enlace de Compartir resultados
