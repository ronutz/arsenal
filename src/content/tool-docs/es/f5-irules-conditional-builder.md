## Qué hace

Describe una decisión como reglas ordenadas (“las rutas que empiezan por /api van a api_pool, /login va a login_pool y todo lo demás, a web_pool”) y la herramienta la escribe de tres formas:

- una cadena `if` / `elseif`,
- un `switch` (con `-glob` cuando una regla lo necesita, y `--` antes del valor),
- una búsqueda `class match` en data groups, con las definiciones `tmsh` de esos data groups.

Después, un valor de prueba recorre cada regla generada en el intérprete didáctico, y la página muestra qué pool eligió cada forma.

## Por qué las formas pueden no coincidir

`if` y `switch` toman la **primera** regla que coincide, en el orden escrito. `class match` con `starts_with` o `ends_with` devuelve la entrada coincidente **más larga**, sea cual sea el orden (lo dice la referencia de `class` de F5). Con las reglas `/api` y `/api/v2`, el valor de prueba `/api/v2/users` va a `api_pool` con `if` y con `switch`, pero a `api_v2_pool` con `class match`. La herramienta también señala una regla que nunca puede dispararse porque una regla anterior siempre coincide antes.

## Conviene saber

- Pasar el valor a minúsculas (`string tolower`) hace que la comparación no distinga mayúsculas de minúsculas, pero entonces un valor de regla con mayúsculas no puede coincidir nunca; la herramienta lo advierte.
- `class match` no tiene comparación glob, así que una regla glob descarta la forma de data group.
- Un valor de regla con una llave sin pareja se escribe con una barra invertida delante (`\{`). Tcl cuenta las llaves dentro de un cuerpo entre llaves incluso entre comillas dobles (regla 5 de la página de sintaxis de Tcl 8.4), así que una llave suelta rompería la regla; el Tcl 8.4.6 real se detiene con `missing close-brace`.
- En `HTTP::path`, el valor de prueba se corta en su primer signo de interrogación: `HTTP::path` no incluye la cadena de consulta (referencia de `HTTP::path` de F5), así que las reglas solo comparan la parte anterior.
- Los nombres de registro con caracteres distintos de letras, dígitos y `_ . / : -` se escriben entre comillas dobles en las definiciones `tmsh`. Ese entrecomillado no se ha probado en un BIG-IP: después de crear el data group, lístalo en `tmsh` y comprueba los registros.
- El código generado sigue la guía de estilo de DevCentral (iRules Style Guide): sangría de 4 espacios, una prioridad en el evento, expresiones entre llaves, nombres de variable entre llaves y `--` en `switch` y en `class`. Además, pasa el comprobador de estilo del sitio sin ningún hallazgo.

## Compartir resultados

Debajo del veredicto sobre el valor de prueba, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva toda la decisión por nombre: `#subject=` (y `&header=` para un encabezado), `&lower=1` o `0`, las reglas en orden como una lista de Tcl de listas `{comparison value pool}` (`&rules={starts_with /api api_pool} {equals /login login_pool}`, con codificación por porcentaje en el enlace), y el pool predeterminado, el nombre del data group y el valor de prueba (`&default=`, `&group=`, `&test=`) cuando están definidos. Los nombres de pool, de data group y de encabezado son tuyos; se les aplica la advertencia estándar de la ventana emergente. Todo lo que lleva el enlace va después del `#`, que el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27) describe como “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo): el navegador no lo envía al servidor cuando se abre el enlace, pero se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Un enlace lleva como máximo 16.384 caracteres, el límite que el sitio aplica a todo valor después del `#`; incluso 50 reglas quedan muy por debajo.
- **Al abrir un enlace.** La decisión del enlace sustituye todo el formulario, incluido el Ejemplo con el que se abre la página (un campo que el enlace no lleva se vacía; una decisión sobre un encabezado sin nombre usa `User-Agent`, el de la propia página), y se generan las tres formas. Un valor de solicitud o una comparación desconocidos, un valor de reglas que no sea una lista de listas de tres elementos, más de 50 reglas o un valor más largo de lo que admite la página hacen que se ignore todo el enlace. Se acepte o no, los valores salen después de la propia dirección de la página al instante, sin ninguna solicitud, así que al recargar, con un marcador o con el propio botón Compartir de la página no se lleva nada que no hayas decidido compartir.

## Fuentes

- [F5 iRules reference: class](https://clouddocs.f5.com/api/irules/class.html) (consultado el 2026-10-02)
- [F5 iRules reference: Operators](https://clouddocs.f5.com/api/irules/Operators.html) (consultado el 2026-10-02)
- [Tcl 8.4 manual: switch](https://www.tcl-lang.org/man/tcl8.4/TclCmd/switch.htm) (consultado el 2026-10-03)
- [F5 K15650046: Tcl code injection security exposure](https://my.f5.com/manage/s/article/K15650046) (consultado el 2026-10-03)
- [F5 DevCentral: iRules Style Guide](https://community.f5.com/t/irules-style-guide/71151) (consultado el 2026-10-03)
- [F5 iRules reference: priority](https://clouddocs.f5.com/api/irules/priority.html) (consultado el 2026-10-03)
- [F5 iRules reference: HTTP::path](https://clouddocs.f5.com/api/irules/HTTP__path.html) (consultado el 2026-10-03)
- [Tcl 8.4 manual: Tcl (the substitution rules)](https://www.tcl-lang.org/man/tcl8.4/TclCmd/Tcl.htm) (consultado el 2026-10-03)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultado el 2026-10-27): sección 3.5, el fragmento, que lleva los valores de un enlace de Compartir resultados
