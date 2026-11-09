## Qué hace

Toma dos colores, escritos en cualquier notación que defina CSS Color Level 4, y responde a la pregunta que plantea una hoja de estilos en cada texto y en cada control: ¿esto se puede leer sobre aquello? Calcula la relación de contraste WCAG entre ellos, la comprueba frente a todos los niveles de los tres criterios de contraste, muestra una vista previa del par, convierte cada color a todas las notaciones con su luminancia relativa y, cuando un nivel no se cumple, encuentra el color de primer plano más cercano que lo cumpliría.

## Qué lee

- **Colores con nombre**: los 148 nombres de la sección 6.1 de CSS Color Level 4 (gray y grey, con las dos grafías) y `transparent` (negro transparente).
- **Hexadecimal**: `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`; da igual que las letras estén en mayúsculas o minúsculas, y una forma corta se expande repitiendo cada dígito.
- **rgb() / rgba()**: números de 0 a 255 o porcentajes, con las comas heredadas o con los espacios modernos y `/ alpha`; los componentes fuera de rango se recortan, como hace la especificación al analizar el valor.
- **hsl() / hsla()** y **hwb()**: un tono como número o como ángulo (deg, grad, rad, turn), y después porcentajes o números de 0 a 100.
- **lab()**, **lch()**, **oklab()**, **oklch()**: con los rangos de referencia de porcentaje de la especificación (a y b de lab: 100 % = 125; C de lch: 100 % = 150; a y b de oklab: 100 % = 0,4; C de oklch: 100 % = 0,4; L: 100 % = 100 para Lab y 1 para OKLab).
- **color()**: `srgb`, `srgb-linear`, `display-p3`, `display-p3-linear`, `xyz`, `xyz-d65`, `xyz-d50`.
- `none` como componente cuenta como cero, como dice la especificación.

Junto a cada campo, el selector de color del navegador se abre en el color que contiene el campo y escribe en él el que elijas como `#rrggbb`, para que puedas elegir un color sin escribirlo.

## Qué calcula

- **Luminancia relativa** (WCAG 2.2): cada canal sRGB se linealiza (c / 12.92 hasta 0.04045 y, por encima, ((c + 0.055) / 1.055) ^ 2.4) y se pondera, L = 0.2126 R + 0.7152 G + 0.0722 B. WCAG 2.0 y 2.1 escribían el umbral como 0.03928; para valores de canal de 8 bits, los dos umbrales clasifican todos los valores de forma idéntica.
- **Relación de contraste**: (L1 + 0,05) / (L2 + 0,05), el más claro sobre el más oscuro, de 1:1 a 21:1.
- **Niveles**: el criterio de conformidad 1.4.3 Contrast (Minimum), nivel AA, 4,5:1 para el texto y 3:1 para el texto de gran tamaño; el 1.4.6 Contrast (Enhanced), nivel AAA, 7:1 y 4,5:1; el 1.4.11 Non-text Contrast, nivel AA, 3:1 para los componentes de la interfaz de usuario y los objetos gráficos. El texto de gran tamaño es el de al menos 18 puntos, o 14 puntos en negrita.
- **Alfa**: un primer plano translúcido se compone sobre el fondo antes de medir (mezcla alfa simple en sRGB, como lo pinta una pantalla), porque WCAG define el contraste entre los colores tal como se muestran. El alfa del fondo se ignora.
- **Gama**: un color fuera de sRGB (un amarillo display-p3, un oklch() saturado) se recorta a la gama para las notaciones sRGB y para la luminancia, y se marca; las formas Lab, LCH, OKLab, OKLCH y XYZ conservan el valor sin recortar.
- **Correcciones**: para cada nivel que el par no alcanza, se mueve la luminosidad del primer plano en OKLCH, hacia más claro y hacia más oscuro, conservando el tono y el croma (el croma solo se reduce cuando el resultado se saldría de la gama), hasta alcanzar el objetivo; el resultado se da en hexadecimal y en oklch() con la relación que alcanza.

## Conversiones

Las conversiones son el propio código de ejemplo de la especificación, transcrito: la función de transferencia de sRGB, las matrices racionales de sRGB a XYZ y de display-p3 a XYZ, la adaptación de Bradford entre D65 y D50, CIE Lab con sus constantes racionales, las dos matrices de OKLab, las formas polares con sus umbrales de tono sin efecto (powerless hue) y los algoritmos de HSL y HWB. El motor reproduce los ejemplos resueltos de la especificación: `#7654CD` es `lab(44.36% 36.05 -58.99)` y `color(xyz-d65 0.21661 0.14602 0.59452)`; los colores de ejemplo de lab() y de oklch() coinciden entre sí; `color(display-p3 1 1 0)` queda en `oklch(0.9648 0.245 110.23)`.

## Compartir resultados

Debajo de la relación y sus niveles, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` los dos colores tal como los escribiste, con los nombres que la página da a los campos (`foreground` y `background`), y nada más; no se lleva qué ejemplo predefinido cargaste. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que el par no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** Los dos campos se sustituyen como si los escribieras y la página calcula la relación; no se envía nada a ninguna parte. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.

## Límites

- La relación es la fórmula de WCAG, que es la que exigen los criterios; no es un modelo de la percepción, y un par que la cumple puede seguir siendo difícil para algunas personas (tipografía fina, tamaños pequeños, diferencias en la visión del color). La vista previa está para que los ojos también voten.
- No se modela la gestión del color: no se consulta el perfil de la pantalla, y los colores de gama amplia se juzgan por su recorte a sRGB.
- Las correcciones solo cambian la luminosidad. Quien diseña puede preferir cambiar el tono o el croma; la herramienta muestra lo que consigue por sí solo el cambio de luminosidad.
- Los colores de sistema con nombre (`Canvas`, `LinkText`) y `currentcolor` dependen de la página y no se leen.

## Fuentes

- [WCAG 2.2, W3C Recommendation 12 December 2024](https://www.w3.org/TR/WCAG22/) (consultado el 2026-10-05): luminancia relativa, relación de contraste, criterios 1.4.3, 1.4.6 y 1.4.11, texto de gran tamaño
- [CSS Color Module Level 4, W3C Candidate Recommendation Draft 30 September 2026](https://www.w3.org/TR/css-color-4/) (consultado el 2026-10-05): notaciones, rangos de referencia de porcentaje, colores con nombre
- [CSS Color Level 4 sample code in the csswg-drafts repository](https://github.com/w3c/csswg-drafts/tree/main/css-color-4) (consultado el 2026-10-05): conversions.js, utilities.js, rgbToHsl.js, hslToRgb.js, hwbToRgb.js, rgbToHwb.js
- [RFC 3986: URI Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultado el 2026-11-01): sección 3.5, el fragmento, que usa un enlace de Compartir resultados
