## Qué hace

`scan` es la forma barata de descomponer un valor en una iRule; la referencia de `matches_regex` de F5 señala que un comando de cadena es más eficiente que una expresión regular y que la mayoría de los casos se pueden resolver con `string match` o `scan`. Dale a la herramienta un valor, un formato y los nombres de las variables, y alineará cada directiva del formato con los caracteres que consumió, el valor que produjo y la variable que lo recibió, y después dirá exactamente por qué se detuvo el escaneo. El valor se dibuja sobre una regla graduada, con los caracteres de cada conversión en su propio color.

## Cómo se lee el resultado

- **scan devolvió** es el resultado del comando: con nombres de variables, el número de variables que recibieron un valor; sin nombres, una lista de los valores convertidos.
- **Directiva a directiva** tiene una fila por directiva: un literal que tenía que coincidir, un espacio en blanco que omite cualquier cantidad de espacios, o una conversión como `%d`, `%s` o `%[^&]`.
- **Variables después** muestra lo que contiene cada variable con nombre. Una variable posterior al punto en el que se detuvo el escaneo no la define este scan.

## Conviene saber

- `-1` significa que la entrada se acabó antes de la primera conversión; `0` significa que se intentó una conversión y no coincidió. Comprueba los dos casos cuando un valor pueda estar vacío.
- `%d` omite los espacios en blanco iniciales y lee en decimal; `%i` toma la base de un prefijo, así que `08` leído con `%i` da 0 y se detiene en el 8. Usa `%d` para horas y códigos con ceros a la izquierda.
- `%s` se detiene en un espacio en blanco; `%[^&]` lee todo hasta un ampersand.
- Tcl 8.4.6 guarda las conversiones de enteros a través de un `int` de C: `3000000000` leído con `%d` vuelve como `-1294967296`, y el modificador `l` no cambia eso en 8.4.6. Para conservar intacto un número grande, léelo como texto con `%[0-9]` y deja que `expr` lo interprete.
- `%n` guarda la cantidad de entrada consumida hasta ese momento. El manual dice caracteres, pero Tcl 8.4.6 cuenta bytes de su UTF-8 interno, así que cada carácter fuera de ASCII cuenta 2 o 3.

## Compartir resultados

Debajo del resultado, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva los tres campos tal como se escribieron: el valor que se descompone como `#input=`, el formato como `&format=` y los nombres de las variables como `&vars=`, y omite cada uno cuando está vacío. Todo lo que lleva el enlace va después del `#`, que el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27) describe como “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo): el navegador no lo envía al servidor cuando se abre el enlace, pero se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Un enlace lleva como máximo 16.384 caracteres, el límite que el sitio aplica a todo valor después del `#`; si los campos son más largos, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** Los campos se rellenan como si los escribieras (un campo que el enlace no lleva queda vacío, como lo tenía quien lo envió) y se explica el scan. Se acepta cualquier texto, igual que al escribir: un formato incorrecto recibe el propio error de Tcl. Se acepte o no, los valores salen después de la propia dirección de la página al instante, sin ninguna solicitud, así que al recargar, con un marcador o con el propio botón Compartir de la página no se lleva nada que no hayas decidido compartir.

## Límites

El motor sigue `Tcl_ScanObjCmd` de Tcl 8.4.6 y se comprobó con un intérprete real de Tcl 8.4.6 en miles de casos generados. Se marcan los resultados enteros que dependen de la biblioteca de C de la plataforma.

## Fuentes

- [Tcl 8.4 manual: scan](https://www.tcl-lang.org/man/tcl8.4/TclCmd/scan.htm) (consultado el 2026-10-03)
- [F5 iRules reference: matches_regex](https://clouddocs.f5.com/api/irules/matches_regex.html) (consultado el 2026-10-02)
- [F5 K6091: The version of Tcl used to develop iRules](https://my.f5.com/manage/s/article/K6091) (consultado el 2026-10-03)
- [Tcl 8.4.6 source code, tag core-8-4-6](https://github.com/tcltk/tcl/tree/core-8-4-6) (el intérprete de referencia)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultado el 2026-10-27): sección 3.5, el fragmento, que lleva los valores de un enlace de Compartir resultados
