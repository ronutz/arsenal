## Qué hace

Escribe un texto y obtén sus resúmenes SHA-1, SHA-256, SHA-384 y SHA-512, cada uno en hexadecimal y en Base64. El hash lo calcula la Web Crypto nativa del navegador (`crypto.subtle.digest`), no una implementación incluida en la página, así que los valores coinciden con lo que produce cualquier plataforma conforme. Los cuatro resúmenes se calculan a la vez, así que cambiar el que estás viendo nunca obliga a recalcular. Todo ocurre en tu navegador. También puedes calcular el hash de un archivo en lugar de un texto escrito: consulta Archivos, más abajo.

## Qué es un hash criptográfico

Un hash criptográfico asigna a una entrada de cualquier longitud un resumen de longitud fija, con unas pocas propiedades que lo definen: es determinista (la misma entrada da siempre el mismo resumen), unidireccional (no se puede recuperar la entrada a partir del resumen) y resistente a colisiones (es inviable encontrar dos entradas con el mismo resumen). Cambiar un solo bit de la entrada cambia aproximadamente la mitad de los bits de la salida, así que un resumen no revela nada sobre lo parecidas que son dos entradas. Aquí se calcula el hash de la entrada a partir de sus bytes UTF-8.

## Los cuatro algoritmos

Los cuatro están definidos en FIPS 180-4, y el RFC 6234 recoge también código de referencia y vectores de prueba. Se diferencian en el tamaño del resumen:

- **SHA-1** produce 160 bits (40 caracteres hexadecimales). Todavía se ve mucho, pero está roto en cuanto a resistencia a colisiones, así que no debe usarse donde un atacante pueda fabricar las entradas; sigue sirviendo para sumas de comprobación y para verificar contra sistemas heredados.
- **SHA-256** produce 256 bits (64 caracteres hexadecimales) y es la opción predeterminada moderna.
- **SHA-384** produce 384 bits (96 caracteres hexadecimales).
- **SHA-512** produce 512 bits (128 caracteres hexadecimales).

## Hexadecimal y Base64

El resumen es una secuencia de bytes; el hexadecimal y Base64 son solo dos formas de escribir esos mismos bytes. El hexadecimal usa dos caracteres por byte y es la forma habitual en la mayoría de las herramientas; Base64 es más compacto y es lo que aparece en sitios como los atributos de Subresource Integrity.

## Archivos

Elige un archivo con el selector de archivos, o suéltalo en cualquier parte de la herramienta, y los cuatro resúmenes se calculan sobre los bytes del archivo tal como están en el disco. Tu navegador lee el archivo en tu dispositivo a través de la File API (`Blob.arrayBuffer()`) y le pasa los bytes a Web Crypto. No se sube nada: la vista de archivos no hace ninguna solicitud de red. La zona para soltar es también un botón, así que con el teclado se llega a ella con Tabulador y se abre el selector de archivos con Intro o con la barra espaciadora.

- **Qué se muestra.** El nombre, el tamaño y el tipo del archivo aparecen tal como los indica tu navegador. El navegador deja el tipo vacío cuando no puede determinarlo, y el tipo no interviene en los resúmenes: solo se calcula el hash de los bytes, así que cambiar el nombre de un archivo no altera ninguno.
- **Un archivo son sus bytes.** Un archivo de texto guardado con una marca de orden de bytes o con finales de línea de Windows (CRLF) da un hash distinto del de las mismas palabras escritas en el cuadro de texto, porque esos bytes forman parte del archivo. `hi` escrito en el cuadro de texto y `hi` guardado con una marca de orden de bytes UTF-8 y CRLF (los siete bytes `EF BB BF 68 69 0D 0A`) dan dos resúmenes SHA-256 distintos.
- **El límite de tamaño: 256 MiB.** El `digest()` de Web Crypto recibe el mensaje entero en una sola llamada y empieza copiándolo; no tiene ninguna forma por flujo (streaming). Calcular con él el hash de un archivo implica, por tanto, tener todos sus bytes en memoria, más una segunda copia mientras se calcula cada resumen. La herramienta calcula el hash de archivos de hasta 256 MiB (268.435.456 bytes), ejecuta los cuatro algoritmos uno tras otro para que solo exista una copia a la vez (un pico de aproximadamente el doble del archivo) y rechaza un archivo más grande con un mensaje antes de leer nada de él. El límite es una elección prudente, no una cifra que fije la plataforma. Mientras trabaja, una línea de estado indica el algoritmo en curso, por ejemplo “SHA-384, 2 de 4”.
- **Archivos más grandes.** Usa el comando de tu propio sistema operativo: `sha256sum` de GNU coreutils en Linux (también `sha1sum`, `sha384sum`, `sha512sum`) o `Get-FileHash` en PowerShell, cuyo algoritmo predeterminado es SHA-256.
- **Comparar con una suma de comprobación publicada.** Los resúmenes hexadecimales no dependen de las mayúsculas y minúsculas: `Get-FileHash` imprime en mayúsculas y esta herramienta en minúsculas, así que compara los caracteres sin tener en cuenta las mayúsculas. Con una lista de sumas de comprobación publicadas, `sha256sum --check` (`-c`) compara por ti cada archivo que aparece en ella.
- **Un archivo vacío.** Un archivo de cero bytes tiene los conocidos resúmenes de una entrada vacía (SHA-256 `e3b0c442…7852b855`), y la herramienta lo indica. La documentación de VirusTotal señala que, si un archivo que sabes que no está vacío muestra este resumen, es que algo impidió leerlo.
- **Cuando falla la lectura.** Si el navegador no puede leer el archivo (porque otro programa lo movió, lo eliminó, lo cambió o lo bloqueó después de que lo eligieras, los casos que enumera la File API), la herramienta muestra el nombre del error del navegador y te pide que vuelvas a elegir el archivo. Un archivo cuyo tamaño cambia durante la lectura se indica de la misma forma. Nada se detiene en silencio.

## Buscar un archivo en VirusTotal

Debajo de los resúmenes de un archivo hay un enlace, **Buscar este SHA-256 en VirusTotal**. Abre, en una pestaña nueva, la dirección que VirusTotal documenta para el informe más reciente sobre un archivo, `https://www.virustotal.com/gui/file/<SHA-256>/detection`, con el SHA-256 del archivo en lugar de `<SHA-256>`; los otros tres resúmenes nunca se ponen en un enlace. Al seguir el enlace se envía a VirusTotal el hash, no el archivo. La herramienta en sí no envía nada; el enlace es uno normal que solo tú puedes decidir seguir, y no transmite la página de origen (`rel="noopener noreferrer"`), así que a VirusTotal no se le dice de qué página vienes. Lo que muestra VirusTotal, y lo que hace con la búsqueda, se rige por sus propias condiciones. VirusTotal documenta que el enlace lleva al informe de un archivo que ha analizado: si no existe ningún informe, VirusTotal no ha visto ese archivo, lo que no dice nada sobre si el archivo es seguro.

## Comparar con un hash esperado

Debajo de las dos vistas hay un cuadro, **Comparar con un hash esperado**. Pega el hash que publica una página de descarga y la herramienta dice si es igual a uno de los cuatro resúmenes que ha calculado: los del archivo cuando se calculó el hash de un archivo y, si no, los del texto. Lee las formas que usan quienes publican hashes: hexadecimal a secas, en mayúsculas o en minúsculas; hexadecimal escrito en pares de bytes separados por espacios o por dos puntos; una línea tal como la imprime `sha256sum` (la suma de comprobación, un espacio, un espacio o un asterisco, y el nombre del archivo: lo que GNU Coreutils llama el formato sin etiqueta); una línea con etiqueta como `SHA256 (file.iso) = …`; un valor etiquetado `sha256:` (la forma que adoptan los resúmenes de las imágenes OCI: el algoritmo, dos puntos y el valor codificado); y Base64, estándar o seguro para URL, con o sin relleno, incluido un valor de Subresource Integrity como `sha384-…` (el algoritmo, un guion y el valor en Base64). Cuando el valor lleva una etiqueta de algoritmo, solo se compara ese algoritmo, así que un valor etiquetado como SHA-512 nunca coincide por accidente con un SHA-256. Una coincidencia nombra el algoritmo y la codificación. Si no coincide, se indica si el valor tiene al menos la longitud de uno de los cuatro resúmenes, lo que suele significar que los bytes de los que se calculó aquí el hash no son aquellos para los que se publicó, o que el hash se copió mal. Un MD5, de 32 caracteres hexadecimales, no es ninguno de los cuatro y nunca coincide. No se vuelve a calcular ningún hash y no se envía nada: la comparación es entre cadenas que ya están en la página.

## Ejemplo resuelto

- El SHA-256 de `abc` es `ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad`, el vector de prueba estándar de la especificación SHA.
- Con `abc` escrito, pegar `sha256-ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0=` en el cuadro de comparación da una coincidencia: el SHA-256 del texto, en Base64.

## Uso

Escribe o pega un texto y lee los cuatro resúmenes, o elige o suelta un archivo y lee los resúmenes de sus bytes. Como un hash es unidireccional, esta herramienta no puede convertir un resumen en su entrada; recuperar una entrada solo es viable cuando tenía muy poca entropía, como demuestra el [Buscador de preimágenes de hash](/tools/hash-preimage-finder).

## Compartir resultados

La página tiene dos respuestas, así que tiene dos botones **Compartir resultados**, y un enlace nunca las mezcla. Cada uno genera un enlace a esta página solo cuando lo presionas; su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

- **Debajo de los resúmenes del texto.** El enlace lleva después del `#` el texto tal como se escribió, el algoritmo que se muestra cuando no es SHA-256 y lo que contiene el cuadro de comparación cuando compara con el texto. El texto puede ser una contraseña, y un resumen no la protege: un hash rápido y sin sal de una contraseña débil cae en segundos, como muestra el [Buscador de preimágenes de hash](/tools/hash-preimage-finder). Por eso la ventana emergente te advierte que no envíes una contraseña, una clave ni un token, y un texto en el que la comprobación de secretos del sitio encuentra una credencial no recibe ningún enlace: una clave privada, un encabezado Authorization, un ID de clave de acceso de AWS, un JWT, una contraseña en una URL, un valor `ENC` de FortiOS o un valor asignado a un nombre que parece el de un secreto. La ventana emergente nombra lo que encontró y en qué línea; copia el resumen en su lugar.
- **Debajo de los resúmenes de un archivo.** Ningún byte del archivo, ni su nombre, va nunca en un enlace. El enlace lleva el resumen del archivo para el algoritmo que se muestra, en el lugar del cuadro de comparación, así que quien lo recibe elige el mismo archivo y el cuadro le dice si coincide, que es para lo que sirve un hash publicado.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que los valores no se envían al servidor cuando se abre el enlace; se quedan en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlos.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si un texto es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** Un enlace de texto rellena el cuadro de texto y la página calcula su hash; un enlace de archivo rellena el cuadro de comparación, con una nota que pide el archivo, y espera: no se lee nada del disco hasta que eliges un archivo. El algoritmo y el cuadro de comparación toman los valores del enlace. Un algoritmo que la página no ofrece, un valor de comparación de más de una línea, un enlace de archivo cuyo valor no es un resumen con la longitud del algoritmo o un texto que contiene una credencial hacen que se ignore el enlace entero. En cualquier caso, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.

## Fuentes

- [W3C File API (borrador de trabajo del 12 de septiembre de 2026)](https://www.w3.org/TR/FileAPI/): [tamaño y tipo de Blob](https://www.w3.org/TR/FileAPI/#attributes-blob), [arrayBuffer()](https://www.w3.org/TR/FileAPI/#arraybuffer-method-algo), [la interfaz File](https://www.w3.org/TR/FileAPI/#file-section) y [Errors and Exceptions](https://www.w3.org/TR/FileAPI/#ErrorAndException) (consultado el 2026-10-27)
- [W3C Web Cryptography Level 2, 14.3.5 The digest method](https://www.w3.org/TR/webcrypto/#SubtleCrypto-method-digest) y [32 SHA](https://www.w3.org/TR/webcrypto/#sha) (el borrador publicado; el borrador del editor del 22 de octubre de 2026 tiene los mismos pasos) (consultado el 2026-10-27)
- [WHATWG HTML: the File Upload state (input type=file)](https://html.spec.whatwg.org/multipage/input.html#file-upload-state-(type=file)), [la interfaz DataTransfer](https://html.spec.whatwg.org/multipage/dnd.html#the-datatransfer-interface) y los tipos de enlace [noopener](https://html.spec.whatwg.org/multipage/links.html#link-type-noopener) y [noreferrer](https://html.spec.whatwg.org/multipage/links.html#link-type-noreferrer) (consultado el 2026-10-27)
- [VirusTotal: How can I link to the most recent report on a given file or URL?](https://docs.virustotal.com/docs/most-recent-report) y [Empty file and VirusTotal uploads](https://docs.virustotal.com/docs/empty-file) (consultado el 2026-10-27)
- [GNU Coreutils manual: sha2 utilities](https://www.gnu.org/software/coreutils/manual/html_node/sha2-utilities.html) y [cksum common options (--check)](https://www.gnu.org/software/coreutils/manual/html_node/cksum-common-options.html) (el manual de Coreutils 9.12, la versión actual; consultado el 2026-10-27)
- [Microsoft Learn: Get-FileHash](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/get-filehash?view=powershell-7.6) (la referencia de PowerShell 7.6, la versión actual con soporte a largo plazo; consultado el 2026-10-27)
- [W3C Subresource Integrity](https://www.w3.org/TR/sri/), 3.5 The integrity attribute (la gramática `hash-expression = hash-algorithm "-" base64-value`) (consultado el 2026-10-27)
- [GNU Coreutils manual: cksum output modes](https://www.gnu.org/software/coreutils/manual/html_node/cksum-output-modes.html) (los formatos con etiqueta y sin etiqueta; Coreutils 9.12; consultado el 2026-10-27)
- [OCI Image Format Specification: Descriptor](https://github.com/opencontainers/image-spec/blob/main/descriptor.md), sección Digests (`digest ::= algorithm ":" encoded`) (consultado el 2026-10-27)
- [RFC 6234: US Secure Hash Algorithms](https://www.rfc-editor.org/rfc/rfc6234) (sus mensajes de prueba están entre los vectores de archivos de la herramienta; consultado el 2026-10-27)
- [RFC 3986: Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986), sección 3.5 Fragment (consultado el 2026-11-01)
