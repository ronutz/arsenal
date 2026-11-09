## Qué hace

Escribe un número (de 1 a 3999) y lee su numeral romano; escribe un numeral y lee su valor. La herramienta siempre muestra la forma sustractiva canónica y cómo se construye posición a posición: 1994 es M + CM + XC + IV. Todo se calcula en tu navegador.

## Validación honesta

Las escrituras aditivas históricas que usaban los propios romanos (IIII en las esferas de los relojes, MDCCCCX en las fachadas de los edificios) se aceptan, se valoran correctamente y se señalan con la forma canónica al lado. Las cadenas realmente mal formadas se rechazan indicando la regla concreta que incumplen: IL no es un par sustractivo válido (solo restan IV, IX, XL, XC, CD y CM), VV repite un símbolo que nunca se repite, IIX resta dos símbolos donde solo se puede restar uno.

## Por qué termina en 3999

El sistema clásico tiene siete símbolos, ningún cero y nada por encima de M (1000). Para valores mayores, los romanos escribían un vinculum (una barra superior que multiplica por 1000), que no tiene forma en texto plano. En lugar de inventar una convención, la herramienta indica el límite.

## Compartir resultados

Debajo del resultado, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` el número o el numeral tal como se escribió, una vez que la página lo ha convertido; un valor que rechaza no tiene nada que compartir. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Al abrir un enlace.** El valor rellena el cuadro como lo haría un pegado y la página lo convierte. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
