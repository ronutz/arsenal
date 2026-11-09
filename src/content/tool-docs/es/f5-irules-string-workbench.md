## Qué hace

Ejecuta un subcomando `string` de Tcl 8.4.6 y dibuja el resultado sobre una regla de caracteres: cada carácter de la cadena con su índice, coloreado según lo que hizo el comando con él (buscado, coincidente, devuelto, sustituido, recortado o la primera diferencia en una comparación). Cubre diecisiete subcomandos: `length`, `bytelength`, `tolower`, `toupper`, `range`, `index`, `first`, `last`, `map`, `match`, `compare`, `equal`, `trim`, `trimleft`, `trimright`, `replace` y `repeat`.

## Cómo se lee el resultado

- **El comando** es la línea exacta que hay que pegar en una iRule, entrecomillada como la necesita Tcl.
- **La regla graduada** numera los caracteres desde 0, como cuentan todos los argumentos de índice.
- **Argumentos de índice** muestra cómo se leyó cada índice: `end-1` significa el penúltimo carácter, y un índice escrito `010` es octal, así que significa 8.
- **La única pasada de string map** enumera cada posición: conservada, o sustituida, y con qué clave y qué valor.

## Conviene saber

- `length` cuenta caracteres; `bytelength` cuenta los bytes del UTF-8 interno de Tcl, así que `héllo` tiene 5 caracteres y 6 bytes.
- `string map` hace una sola pasada de izquierda a derecha. En cada posición gana la primera clave de la lista que coincide, y el texto sustituido no se vuelve a examinar: `string map {a 1 ab 2} abab` da `1b1b`, mientras que `{ab 2 a 1}` da `22`.
- `compare` ordena por código de carácter, así que `string compare bench Chair` da 1.
- `string index` y `string range` devuelven una cadena vacía, no un error, cuando el índice está fuera de la cadena.
- `trim` quita un **conjunto** de caracteres, en cualquier orden, no una palabra.
- Tcl 8.4.6 acepta `e` o `en` solos como `end`, pero `e-1` es un error.
- La conversión entre mayúsculas y minúsculas usa las tablas Unicode propias de Tcl 8.4.6, que difieren de las de un navegador moderno en unos mil caracteres (por ejemplo, Tcl 8.4.6 no tiene forma mayúscula para `µ`).

## Compartir resultados

Debajo del resultado, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva el formulario por nombre: el subcomando como `#op=`, después cada campo de argumento que tenga algo, con su propio nombre (`&string=`, `&first=`, `&needle=`, `&haystack=`, `&mapping=`, etc.), y `&nocase=1` cuando **-nocase** está marcado en un subcomando que lo admite. No hay un único `#input=`: el campo que contiene el texto con el que se trabaja cambia según el subcomando. Todo lo que lleva el enlace va después del `#`, que el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27) describe como “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo): el navegador no lo envía al servidor cuando se abre el enlace, pero se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Un enlace lleva como máximo 16.384 caracteres, el límite que el sitio aplica a todo valor después del `#`; si los campos son más largos, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** El subcomando y sus campos se rellenan como si los escribieras (un campo que el enlace no lleva queda vacío) y se calcula el resultado. Un subcomando desconocido, un campo que el subcomando no admite o `-nocase` donde no se aplica hacen que se ignore todo el enlace; el texto de los campos se acepta tal como se escribió, y un índice incorrecto recibe el propio error de Tcl, igual que al escribir. Se acepte o no, los valores salen después de la propia dirección de la página al instante, sin ninguna solicitud, así que al recargar, con un marcador o con el propio botón Compartir de la página no se lleva nada que no hayas decidido compartir.

## Límites

Se rechazan los caracteres que están más allá del plano multilingüe básico (Basic Multilingual Plane), porque Tcl 8.4 no puede guardarlos como un solo carácter. No se modelan `string is`, `totitle`, `wordstart` ni `wordend`. Los resultados de `repeat` se limitan a 100.000 caracteres.

## Fuentes

- [Tcl 8.4 manual: string](https://www.tcl-lang.org/man/tcl8.4/TclCmd/string.htm) (consultado el 2026-10-03)
- [F5 K6091: The version of Tcl used to develop iRules](https://my.f5.com/manage/s/article/K6091) (consultado el 2026-10-03)
- [Tcl 8.4.6 source code, tag core-8-4-6](https://github.com/tcltk/tcl/tree/core-8-4-6) (el intérprete de referencia con el que se prueba el motor)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultado el 2026-10-27): sección 3.5, el fragmento, que lleva los valores de un enlace de Compartir resultados
