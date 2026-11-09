## Qué hace

Es un traductor de referencia entre **VOSS** (Fabric Connect / SPBM de Extreme) y **EXOS**. Pone tareas habituales lado a lado para que veas cómo las expresa cada línea de comandos, y deja claro dónde EXOS no tiene equivalente, porque EXOS no ejecuta SPBM en absoluto. Es una referencia, no un generador de configuraciones: cada comando se basa en documentación de Extreme, pero debes adaptar los nombres, los puertos y los números a tu propia red y verificar antes de aplicar nada.

## La diferencia clave

EXOS y VOSS son sistemas operativos distintos que se ejecutan en el hardware universal de Extreme. VOSS es nativo de fabric: construye un fabric SPBM con IS-IS, nicknames, B-VLAN e I-SID. EXOS no admite SPBM. Se une a una red Fabric Connect como borde **Fabric Attach** (un FA Proxy o Client), y el FA Server de VOSS le aprovisiona el I-SID. Así que para las tareas del núcleo del fabric (la instancia SPBM, el nickname, las B-VLAN, una L3 VSN) sencillamente no hay ningún comando de EXOS, y la herramienta lo dice sin rodeos.

## Cómo se usa

Escribe una tarea o un fragmento de un comando (por ejemplo, `i-sid`, `nickname`, `vlan` o `fabric attach`) y la tabla se filtra a las filas que coinciden. Cada fila muestra el concepto, el comando o los comandos de VOSS, el comando o los comandos de EXOS (o una nota de que no hay equivalente) y una explicación breve. Borra el cuadro para ver la tabla entera.

## Qué no es

No genera una configuración desplegable, y no traduce línea por línea un archivo de configuración cualquiera. La configuración del fabric tiene mucho impacto y depende de cada plataforma; esta herramienta está pensada para ayudarte a aprender y a cotejar las dos CLI, no para producir una configuración que pegarías sin revisar en un switch en producción.

## Compartir resultados

Debajo de las equivalencias, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva la búsqueda tal como se escribió (`#input=i-sid`), y nada más; quien lo abre ve las mismas equivalencias. Con la búsqueda vacía se listan todas las equivalencias, y el botón sigue desactivado. Todo lo que lleva el enlace va después del `#`, que el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27) describe como “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo): el navegador no lo envía al servidor cuando se abre el enlace, pero se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Un enlace lleva como máximo 16.384 caracteres, el límite que el sitio aplica a todo valor después del `#`; una búsqueda es mucho más corta.
- **Al abrir un enlace.** El enlace es la misma dirección que usan los demás enlaces a esta herramienta: las palabras rellenan el campo de búsqueda como si las escribieras. Como en todo enlace a esta herramienta, el valor se queda después del `#` hasta que cambias o borras el campo, y entonces sale de la dirección sin ninguna solicitud.
