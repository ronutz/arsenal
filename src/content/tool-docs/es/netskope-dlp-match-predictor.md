## Qué hace la herramienta

Responde por qué una regla de DLP (prevención de pérdida de datos, data loss prevention) se disparó, o no, separando tres cosas que suelen tratarse como una sola y que fallan por separado:

1. **Candidatos**: cuántas cadenas tienen la forma correcta
2. **Coincidencias**: cuántas de ellas superan la suma de comprobación
3. **Umbral**: si ese recuento alcanza lo que exige la regla

Una regla que no se disparó falló exactamente en una de las tres, y saber en cuál te dice qué cambiar.

## Por qué la suma de comprobación importa más que el patrón

Un identificador de datos predefinido no es una expresión regular. Una cadena de dieciséis dígitos es un *candidato*; que cuente como coincidencia depende de una cuenta aritmética.

Ese único hecho explica la mayoría de las discusiones sobre el ajuste de la DLP. **“Marcó un número de orden de compra”** suele ser un número que casualmente supera Luhn. **“Se le escapó una tarjeta real”** suele ser una con dos dígitos transpuestos, que no supera Luhn y, por tanto, para el motor no es una tarjeta. Ninguna de las dos quejas se arregla discutiendo el patrón.

## Los identificadores

**Tarjeta de pago**: el algoritmo de Luhn, tal como se especifica para los números de tarjeta. Ten en cuenta que las tarjetas válidas tienen de trece a diecinueve dígitos, así que las reglas escritas en torno a dieciséis se pierden el resto.

**CPF y CNPJ**: los identificadores brasileños, cada uno con dos dígitos de control módulo 11 (mod-11). Las secuencias de dígitos repetidos como `111.111.111-11` cumplen la aritmética, pero nunca se emiten, así que se rechazan.

Estos tres están aquí porque su validación es un algoritmo publicado y sin ambigüedad. Un identificador cuyas reglas no son públicas no se puede modelar con honestidad.

## Privacidad

Todo se queda en tu navegador. Nada de lo que pegas se transmite, se guarda ni se registra, algo que aquí importa más que en la mayoría de las herramientas, porque la idea es precisamente pegar contenido que sospechas que es sensible.

## Límites, sin rodeos

**Este no es el motor de Netskope.** Modela el paso de la suma de comprobación, que es el que sorprende a la gente. Las palabras clave de proximidad, los diccionarios, las huellas digitales de documentos (document fingerprinting), la coincidencia exacta de datos (exact data match), el OCR y la detección del tipo de archivo quedan fuera del alcance, y ninguno se aproxima.

Aquí la detección por forma es sencilla a propósito, así que un resultado de cero candidatos significa *esta herramienta no encontró ninguno*, no *la plataforma no encontraría ninguno*. Y un número repetido se cuenta una sola vez; que una plataforma concreta cuente apariciones o valores distintos cambia el comportamiento del umbral, y esa es una configuración que la herramienta no modela.

## Compartir resultados

Debajo del veredicto, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que nunca lleva tu texto. El cuadro contiene lo que sospechas que es sensible: números de tarjetas de pago (un PAN, “primary account number”, es el “unique payment card number ... that identifies the issuer and the cardholder account”, el número único de la tarjeta de pago que identifica al emisor y la cuenta del titular, según el [glosario del PCI SSC](https://www.pcisecuritystandards.org/glossary/), consultado el 2026-11-01), números de CPF y de CNPJ, y las palabras que los rodean. Lo que diagnostica la página es estructural, así que el enlace lleva después del `#` sustitutos: una línea por candidato, en el orden de la página, cada una con los separadores y la longitud del propio candidato y con dígitos que genera la página (ceros, la posición del candidato en la lista y dígitos de control elegidos para que la suma de comprobación se supere o falle exactamente igual que con el candidato, confirmado con las mismas comprobaciones de Luhn y de módulo 11 que ejecuta la página); una secuencia de dígitos repetidos, que no es el número de nadie, va tal cual. También van el identificador y el umbral. Antes de ofrecer el enlace, la página vuelve a leer los sustitutos y tiene que llegar al mismo diagnóstico (los mismos candidatos por forma, resultado y motivo, el mismo recuento, el mismo veredicto y los mismos hallazgos); si no, no hay enlace. Un texto sin ningún candidato no obtiene enlace, porque su diagnóstico trata del propio texto. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** Los sustitutos rellenan el cuadro, se establecen el identificador y el umbral, y la página evalúa; una nota debajo del veredicto indica que los números son sustitutos. Se ignora un enlace cuyas líneas no sean sustitutos acordes con su posición. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
