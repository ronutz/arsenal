## Qué hace

Fabric Connect (SPBM) de Extreme nombra las cosas con tres números, y esta herramienta decodifica el que pegues, detectándolo automáticamente por su forma:

- un **I-SID**, un identificador de servicio de 24 bits (de 1 a 16.777.215) que nombra una instancia de servicio en el fabric;
- un **nickname**, un identificador de nodo de 20 bits que se escribe `X.XX.XX` en hexadecimal; y
- un **system-id / B-MAC**, una dirección de 48 bits con forma de MAC que se escribe como un trío separado por puntos, como `00bb.0021.0001`.

Se ejecuta por completo en tu navegador.

## El I-SID

El I-SID es el corazón de un servicio del fabric. Una VLAN de cliente asignada a un I-SID es una VSN de capa 2; una VRF (enrutamiento y reenvío virtuales, virtual routing and forwarding) asignada a un I-SID es una VSN de capa 3; la tabla de enrutamiento global transportada por IS-IS sin ningún I-SID es IP Shortcuts. El número en sí no codifica cuál de estos casos es (eso lo determina cómo lo aprovisionas), así que la herramienta valida el rango de 24 bits y explica el uso en lugar de adivinar un tipo. El I-SID predeterminado de la red Fabric Attach (FAN) es 16777001, y la herramienta lo señala.

## El nickname

Cada nodo SPBM lleva un nickname de 20 bits, que se escribe como un dígito hexadecimal, un punto, dos dígitos hexadecimales, un punto y dos dígitos hexadecimales (por ejemplo, `C.30.00`). Tiene que ser único en todo el fabric, también entre áreas IS-IS adyacentes. La herramienta convierte la forma `X.XX.XX` en su valor entero y viceversa, y comprueba el rango. La asignación dinámica de nicknames los reparte a partir de un rango de prefijos de servidor como `C.30.00-C.3F.FF`.

## El system-id / B-MAC

La B-MAC nodal, configurada como system-id de IS-IS, es una dirección de 48 bits. La herramienta lee los dos bits significativos de su primer octeto: el bit U/L (la recomendación de Extreme es usar una dirección administrada localmente, con el primer octeto `02`) y el bit I/G (una dirección de nodo debe ser individual, no de grupo).

## Uso

Pega un I-SID decimal, un nickname `X.XX.XX` o una B-MAC en trío separado por puntos. La detección es por la forma, así que no hay nada que seleccionar.

## Compartir resultados

Debajo de la lectura, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva el identificador tal como se escribió (`#input=C.30.00`), y nada más. Todo lo que lleva el enlace va después del `#`, que el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27) describe como “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo): el navegador no lo envía al servidor cuando se abre el enlace, pero se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Un enlace lleva como máximo 16.384 caracteres, el límite que el sitio aplica a todo valor después del `#`; un identificador es mucho más corto.
- **Al abrir un enlace.** El enlace es la misma dirección que usan los demás enlaces a esta herramienta: el identificador rellena el campo y se decodifica como si lo escribieras. Como en todo enlace a esta herramienta, el valor se queda después del `#` hasta que cambias o borras el campo, y entonces sale de la dirección sin ninguna solicitud.
