## Qué hace

Dos sentidos, detectados automáticamente. Pega texto griego y la herramienta lo descompone letra a letra (nombre, transliteración y la nota sobre la sigma final cuando corresponde) y translitera el conjunto. Escribe nombres de letras (lambda; mu omega) y la herramienta produce los glifos con sus notas de uso. Debajo del conversor está la tabla de referencia completa de las 24 letras: el par de glifos, el nombre, la romanización moderna con la forma clásica entre paréntesis cuando difiere, y el lugar donde lo más probable es que un ingeniero se haya encontrado cada letra.

## La relación con la ingeniería

El alfabeto griego es el segundo alfabeto de todas las disciplinas técnicas: mu es micro, Omega son los ohmios, lambda es la longitud de onda y el cálculo lambda, Sigma suma y sigma mide la desviación, Delta es el propio cambio. La tabla dice dónde se gana el sueldo cada letra.

## La transliteración, explícita

La herramienta sigue el esquema moderno que más se enseña (beta como v, eta como i); donde la romanización clásica difiere (beta como b, eta como e), se muestran las dos, porque una herramienta que elige una en silencio está adivinando en tu lugar.

## Compartir resultados

Debajo de la lectura, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` el cuadro tal como se escribió (texto griego o nombres de letras), una vez que la página tiene una lectura; un texto que rechaza no tiene nada que compartir. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Al abrir un enlace.** El texto rellena el cuadro como lo haría un pegado y la página lo descompone o lo construye. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
