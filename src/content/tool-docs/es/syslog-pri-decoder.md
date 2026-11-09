## Qué hace

Todo mensaje de syslog empieza con un valor de prioridad, el PRI: un número pequeño entre corchetes angulares, como `<134>`, justo al principio de la línea. Ese número empaqueta dos datos. Esta herramienta decodifica un PRI en su facility y su severidad, y codifica una facility y una severidad de nuevo en un PRI y en su forma `<PRI>` en el cable. Todo se ejecuta en tu navegador.

## La fórmula del PRI

El PRI combina una facility y una severidad con la aritmética que define el RFC 5424:

    PRI = Facility * 8 + Severity
    Facility = PRI / 8   (integer division)
    Severity = PRI % 8

Como la severidad ocupa solo los tres bits bajos, puedes leer un PRI de un vistazo una vez que conoces las piezas. El rango válido va de 0 a 191, ya que la facility va de 0 a 23 y la severidad de 0 a 7.

## Facility y severidad

- La **facility** (de 0 a 23) nombra el subsistema que generó el mensaje: el kernel, el sistema de correo, el sistema de autenticación, el propio daemon de syslog, etc., hasta las ocho posiciones de `local0` a `local7` que los dispositivos de red y los appliances suelen usar para sus propios mensajes.
- La **severidad** (de 0 a 7) indica la urgencia, y va en el sentido contrario al intuitivo: 0 es la más grave (Emergency) y 7 la menos grave (Debug), con Error en el 3 e Informational en el 6 entre medias.

## Ejemplo resuelto

- `<134>` se decodifica como facility 16 (`local0`) y severidad 6 (Informational), porque `134 = 16 * 8 + 6`. Ese valor concreto es un valor predeterminado habitual en los dispositivos de red que registran eventos rutinarios.

## Uso

Escribe un PRI para dividirlo en facility y severidad, o elige una facility y una severidad para obtener el PRI y la cadena `<PRI>` que verías en el cable. El RFC 5424 define el formato moderno de syslog; el formato BSD, más antiguo, del RFC 3164 usa la misma aritmética del PRI.

## Compartir resultados

Debajo del resultado, en cualquiera de los dos modos, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva un PRI y nada más: en el modo Decodificar PRI, el campo tal como se escribió (`#input=%3C34%3E`); en el modo Codificar PRI, el PRI que forman la facility y la severidad, en su forma en el cable (`#input=%3C134%3E` para local0 e informational), así que el enlace se abre en el modo Decodificar PRI con la misma facility y la misma severidad. Todo lo que lleva el enlace va después del `#`, que según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27) queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo): el navegador no lo envía al servidor cuando se abre el enlace, pero se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Un enlace lleva como máximo 16.384 caracteres, el límite que el sitio aplica a todo valor después del `#`; un PRI tiene como máximo cinco caracteres.
- **Al abrir un enlace.** El enlace es la misma dirección que usan los demás enlaces a esta herramienta: el PRI rellena el campo del modo Decodificar PRI como si lo escribieras. Como en todo enlace a esta herramienta, el valor se queda después del `#` hasta que cambias o borras el campo, y entonces sale de la dirección sin ninguna solicitud.
