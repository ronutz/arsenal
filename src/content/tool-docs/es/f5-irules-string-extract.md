## Qué hace

`findstr`, `substr` y `getfield` son comandos que F5 añade a las iRules para recortar un trozo de un valor. La herramienta ejecuta el que elijas sobre tu cadena y marca el resultado sobre una regla graduada: la cadena de búsqueda encontrada, los caracteres saltados, el terminador, los separadores y el campo devuelto. Al lado, el Tcl puro que hace el mismo trabajo se ejecuta en el mismo motor, para que veas si los dos coinciden de verdad.

## Los tres comandos

- `findstr string search ?skip? ?terminator?` busca `search`, avanza `skip` caracteres desde el inicio de la coincidencia y devuelve lo que hay hasta el terminador. El ejemplo de F5: `findstr "<sip:+12065551234@sip.example.com>" "@" 1 ">"` devuelve `sip.example.com`.
- `substr string skip ?terminator?` empieza en el índice `skip`, donde 0 es el primer carácter. `substr "abcdefghijklm" 2 "gh"` devuelve `cdef`.
- `getfield string separator field` divide la cadena en cada aparición del separador, que puede ser un carácter o una cadena, y devuelve ese campo, contando desde 1.

En `findstr` y `substr`, un terminador numérico es una longitud (hasta esa cantidad de caracteres, menos si la cadena termina antes); cualquier otro terminador es un texto ante el que detenerse. Las pruebas de la herramienta reproducen exactamente todos los ejemplos publicados por F5 para estos comandos.

## Lo que F5 no documenta

Donde las páginas de F5 no dicen nada, la herramienta indica la suposición que hizo, marcada con “No documentado por F5”:

- `findstr` cuando la cadena de búsqueda no está. La herramienta devuelve una cadena vacía. F5 dice que `findstr` equivale a `string range` con `string first`, pero ese equivalente devuelve la cadena entera en este caso, así que las dos descripciones no pueden ser correctas a la vez.
- Un recuento de 0. La regla de F5 (“that many characters”, esa cantidad de caracteres) no devolvería nada, pero el propio ejemplo de `substr` de F5 con 0 devuelve el resto de la cadena; la herramienta sigue el ejemplo, y una nota de un colaborador en la página de referencia de la API de F5 indica que 0 no funcionaba en 11.5.4 ni en 11.6.0.
- Un salto más allá del final, un salto o un recuento negativos, un terminador vacío y un número de campo de `getfield` fuera de los campos que hay.

Comprueba estos casos en un BIG-IP antes de confiar en ellos.

## Compartir resultados

Debajo del resultado, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva el formulario por nombre: la cadena como `#input=`, el comando como `&command=` y los campos del comando que tengan algo (`&search=`, `&skip=`, `&terminator=`, `&separator=`, `&field=`). Todo lo que lleva el enlace va después del `#`, que el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27) describe como “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo): el navegador no lo envía al servidor cuando se abre el enlace, pero se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Un enlace lleva como máximo 16.384 caracteres, el límite que el sitio aplica a todo valor después del `#`; si los campos son más largos, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** El comando, la cadena y los campos se rellenan como si los escribieras (un campo que el enlace no lleva queda vacío; un enlace sin comando abre `findstr`, el primero de la página) y se calcula el resultado. Un comando desconocido o un campo que el comando no admite hace que se ignore todo el enlace. Se acepte o no, los valores salen después de la propia dirección de la página al instante, sin ninguna solicitud, así que al recargar, con un marcador o con el propio botón Compartir de la página no se lleva nada que no hayas decidido compartir.

## Fuentes

- [F5 tmsh reference: findstr](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_rule_command_findstr.html) (consultado el 2026-10-03)
- [F5 tmsh reference: substr](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_rule_command_substr.html) (consultado el 2026-10-03)
- [F5 tmsh reference: getfield](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_rule_command_getfield.html) (consultado el 2026-10-03)
- [F5 iRules reference: substr, con la nota del colaborador sobre el recuento 0](https://clouddocs.f5.com/api/irules/substr.html) (consultado el 2026-10-02)
- [Tcl 8.4 manual: string](https://www.tcl-lang.org/man/tcl8.4/TclCmd/string.htm) (consultado el 2026-10-03)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultado el 2026-10-27): sección 3.5, el fragmento, que lleva los valores de un enlace de Compartir resultados
