## Qué hace

Lee uno o más selectores CSS (uno por línea, separados por comas, o una hoja de estilos completa pegada, de la que se descartan los bloques de declaraciones y los preludios de las reglas @) y calcula la especificidad de cada selector como la tripleta (A, B, C) de Selectors Level 4, con cada selector simple nombrado y la columna a la que suma. Los selectores se ordenan como los ordena la cascada, los empates se señalan (ahí decide el orden de aparición) y cada regla especial en la que se apoya el selector se explica a su lado.

## El recuento

Según Selectors Level 4, “Calculating a selector's specificity”:

- **A** cuenta los selectores de ID (`#main`).
- **B** cuenta los selectores de clase (`.nav`), los selectores de atributo (`[type="text"]`) y las pseudoclases (`:hover`).
- **C** cuenta los selectores de tipo (`li`) y los pseudoelementos (`::before`).
- El selector universal (`*`) se ignora; los combinadores no suman nada.
- Las especificidades se comparan columna por columna: gana la A mayor; si A empata, la B mayor; si B empata, la C mayor; si todo empata, las especificidades son iguales.
- “Repeated occurrences of the same simple selector are allowed and do increase specificity” (se permite repetir el mismo selector simple, y la repetición sí aumenta la especificidad): `.a.a` es (0,2,0).

Los casos especiales que detalla la especificación y que aplica la calculadora:

- `:is()`, `:not()` y `:has()`: la especificidad “is replaced by the specificity of the most specific complex selector in its selector list argument” (se sustituye por la del selector complejo más específico de su lista de argumentos). `:not(em, strong#foo)` es (1,0,1).
- `:nth-child()` y `:nth-last-child()` con una cláusula `of`: una pseudoclase “plus the specificity of the most specific complex selector in its selector list argument” (más la especificidad del selector complejo más específico de su lista de argumentos). `:nth-child(even of li, .item)` es (0,2,0).
- `:where()`: “replaced by zero” (se sustituye por cero). `.qux:where(em, #foo#bar#baz)` es (0,1,0).
- Los pseudoelementos heredados de CSS2 con un solo signo de dos puntos (`:before`, `:after`, `:first-line`, `:first-letter`) son pseudoelementos y cuentan en C.
- Según CSS Shadow Module Level 1: `:host` es una pseudoclase; `:host()` y `:host-context()` son una pseudoclase más su argumento; `::slotted()` es un pseudoelemento más su argumento. `::part()` se cuenta como un pseudoelemento (el módulo remite su regla exacta a CSS Pseudo-Elements Level 4; la página indica esta suposición).

La calculadora reproduce la tabla de ejemplos de la especificación: `*` (0,0,0), `LI` (0,0,1), `UL LI` (0,0,2), `UL OL+LI` (0,0,3), `H1 + *[REL=up]` (0,1,1), `UL OL LI.red` (0,1,3), `LI.red.level` (0,2,1), `#x34y` (1,0,0), `#s12:not(FOO)` (1,0,1), `.foo :is(.bar, #baz)` (1,1,0).

## Antes de la especificidad

La especificidad solo decide cuando todo lo que está por encima de ella en la cascada es igual. CSS Cascading and Inheritance Level 5 ordena las declaraciones por estos criterios, de mayor a menor prioridad: origen e importancia (una declaración de autor `!important` gana a todas las normales, sea cual sea el selector), contexto (árboles shadow), estilos asociados al elemento (un atributo `style` gana a cualquier regla de la misma importancia), capas de cascada (la última capa gana en las declaraciones normales y la primera en las importantes), después la especificidad y después el orden de aparición (gana la última declaración en el orden del documento, con los atributos de estilo colocados después de todas las hojas de estilos). La página enumera estos pasos para que un ganador inesperado se pueda atribuir al paso correcto.

## Compartir resultados

Debajo del resumen, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` los selectores tal como los escribiste, y nada más; la clasificación se calcula solo a partir de ellos, así que la página que abre el enlace muestra la misma tabla. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que el texto no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** Los selectores sustituyen el cuadro como lo haría un pegado y la página calcula; no se envía nada a ninguna parte. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.

## Límites

- La calculadora lee sintaxis, no un documento. No puede saber si un selector coincide con algo, y en una lista de selectores la especificidad que se aplica en una coincidencia real es la del miembro más específico que coincide; la página ordena los miembros por separado.
- Los prefijos de espacio de nombres (`ns|p`) se leen, pero no se resuelven.
- Las pseudoclases y los pseudoelementos desconocidos se cuentan por su forma (un signo de dos puntos, B; dos, C), que es lo que dice la gramática; si un navegador los admite es otra cuestión.
- Las implementaciones pueden limitar los recuentos muy grandes; la calculadora no.

## Fuentes

- [Selectors Level 4, W3C Working Draft 22 January 2026: Calculating a selector's specificity](https://www.w3.org/TR/selectors-4/#specificity-rules) (consultado el 2026-10-05)
- [CSS Cascading and Inheritance Level 5, W3C Candidate Recommendation Snapshot 13 January 2022: Cascade Sorting Order](https://www.w3.org/TR/css-cascade-5/#cascade-sort) (consultado el 2026-10-05)
- [CSS Shadow Module Level 1, Editor's Draft 28 April 2026](https://drafts.csswg.org/css-shadow-1/) (consultado el 2026-10-05)
- [RFC 3986: URI Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultado el 2026-11-01): sección 3.5, el fragmento, que usa un enlace de Compartir resultados
