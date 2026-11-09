## Qué hace

Esta herramienta calcula una huella TLS pasiva JA3. Pega una cadena JA3 (los cinco campos del ClientHello: versión de TLS, conjuntos de cifrado, extensiones, curvas elípticas y formatos de punto de las curvas elípticas, con comas entre los campos y guiones entre los valores) y recalcula el hash MD5 de JA3, calcula la variante JA3N con las extensiones ordenadas, decodifica cada campo con su recuento y señala los valores GREASE. Se ejecuta por completo en tu navegador.

## JA3, y por qué el hash es el que es

Salesforce creó JA3 como identificador compacto y fácil de compartir de un cliente TLS. Los cinco campos que usa los rellena sobre todo la biblioteca TLS del cliente, no la aplicación, así que la misma compilación de un navegador o de una herramienta tiende a producir el mismo JA3, y eso lo hace útil para detectar scripts, bots y bibliotecas poco habituales antes de que una aplicación tenga ningún otro contexto. La herramienta sigue exactamente la construcción original: quita los valores GREASE (los marcadores reservados de 0x0a0a a 0xfafa que el RFC 8701 hace insertar a los navegadores), reconstruye la cadena canónica y calcula su hash MD5. Dos de los ejemplos publicados por la propia Salesforce están fijados como pruebas, así que el hash que obtienes aquí es el JA3 que espera el ecosistema.

## GREASE y el problema de la inestabilidad (churn)

Dos cosas hacen que un JA3 sin procesar sea menos estable de lo que parece, y la herramienta muestra ambas. Los valores GREASE son marcadores aleatorios que cambian en cada conexión; si no se quitan, el mismo cliente produce un hash distinto cada vez, así que JA3 los excluye, y la herramienta te dice cuáles encontró y quitó. El problema mayor es la permutación de extensiones: desde 2024, más o menos, Chrome y Firefox aleatorizan el orden de las extensiones TLS en cada conexión, y como JA3 calcula el hash de las extensiones en orden, un solo navegador produce ahora miles de hashes JA3 distintos. La herramienta indica si tus extensiones estaban en orden y muestra JA3N junto a JA3.

## JA3N y JA4

JA3N es la solución sencilla: ordenar la lista de extensiones antes de calcular el hash, y la permutación deja de importar. La herramienta lo calcula por ti, así que, si tu entrada procede de un navegador que permuta, el JA3N es el valor que se mantiene constante. Aun así, JA3N es un parche. El sucesor moderno es JA4, que ordena de forma nativa, usa SHA256, añade un prefijo legible por personas y se extiende a HTTP, SSH, QUIC y TCP. Si hoy tienes que elegir una huella sobre la que construir detecciones, JA4 es mejor opción; el JA3 de aquí sirve para leer y comparar las huellas en las que todavía se expresan las herramientas antiguas y la inteligencia de amenazas.

## Lo que es y lo que no es una huella

Un JA3 identifica una implementación de TLS, no a una persona ni una intención. Es una señal fuerte cuando se combina con el comportamiento de las solicitudes, la inteligencia sobre proxies y el historial de la cuenta, y una señal débil por sí sola: las colisiones de MD5 son posibles, y dos clientes distintos pueden compartir un hash. Trátalo como un dato más para una decisión (una forma de notar que una conexión se parece a un bot conocido o a una biblioteca inesperada), no como prueba de nada por sí mismo.

## Compartir resultados

Debajo de los hashes, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` la cadena JA3 tal como la lee la página, no el cuadro tal como se escribió. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Una cadena JA3 son cinco campos de números de un ClientHello TLS separados por comas, y la página solo lee los números: en cada campo se salta cualquier fragmento que no sea un entero. Así que el enlace lleva los fragmentos enteros de cada campo tal como se escribieron (incluidos los valores GREASE, porque la página los señala) y deja fuera los vacíos y todo lo que la lectura se salta, como el texto pegado junto con la cadena; la página que abre el enlace calcula los mismos hashes, las mismas señales y la misma nota de permutación. Cuando el cuadro no contiene nada más, el enlace lo lleva tal como se escribió.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que la cadena no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerla.

- **Al abrir un enlace.** La cadena rellena el cuadro como lo haría un pegado y la página calcula los hashes; no se envía nada. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
