## Qué hace

La herramienta toma un nombre de host y averigua dos cosas sobre él: el **sufijo público** (el dominio de nivel superior efectivo o eTLD, effective top-level domain) y el **dominio registrado** (el eTLD más una etiqueta, que a menudo se llama eTLD+1). Para `www.blog.example.co.uk`, el sufijo público es `co.uk` y el dominio registrado es `example.co.uk`. Todo se ejecuta en local en tu navegador, con una copia incluida de la Public Suffix List; no se envía nada a ninguna parte.

## Por qué importa

El dominio registrado es la unidad con la que cuentan muchos sistemas. Las autoridades de certificación como Let's Encrypt aplican su límite de tasa de emisión por dominio al dominio registrado, así que `api.example.com` y `www.example.com` comparten un mismo cupo bajo `example.com`. Los navegadores usan esa misma frontera para decidir el alcance de las cookies y el comportamiento same-site. El problema es que no se puede encontrar simplemente tomando las dos últimas etiquetas: `example.co.uk` necesita tres porque `.co.uk` es en sí mismo un sufijo público, y la única forma correcta de saberlo es la Public Suffix List.

## Cómo funciona

La herramienta implementa el algoritmo publicado de la Public Suffix List. Busca la regla que se aplica a tu host, prefiriendo una regla de excepción (una regla `!`) a cualquier regla normal y, si no la hay, la regla con más etiquetas. Las reglas comodín como `*.ck` coinciden con cualquier etiqueta única en esa posición. Si no coincide ninguna regla, la etiqueta situada más a la derecha se trata como sufijo. El dominio registrado es entonces el sufijo público más la siguiente etiqueta a su izquierda, cuando la hay.

## Secciones ICANN y PRIVATE

La lista tiene dos partes. La sección **ICANN** es el conjunto de sufijos gestionados por los registros de dominios que aplican los navegadores. La sección **PRIVATE** cubre nombres delegados por proveedores, como `github.io` o `*.compute.amazonaws.com`, en los que un proveedor reparte subdominios. Las dos pueden no coincidir: con la lista completa, `user.github.io` es su propio dominio registrado, pero solo con las reglas de ICANN el dominio registrado es `github.io`. Cuando una regla PRIVATE decide la respuesta, la herramienta también muestra la vista solo ICANN, porque es la interpretación que usan los límites de tasa de los certificados y las comprobaciones same-site.

## Notas

Escribe un nombre de host sin más; el esquema, el puerto, la ruta o una etiqueta comodín `*.` inicial se quitan automáticamente, y los nombres internacionalizados se convierten a su forma punycode antes de buscar la coincidencia. Las direcciones IP se indican como tales en lugar de analizarse como dominios, porque no tienen sufijo público. Como la Public Suffix List cambia con el tiempo, la copia incluida es una instantánea con fecha; considera que el resultado es exacto a fecha de esa instantánea y consulta publicsuffix.org si necesitas las reglas más recientes.

## Compartir resultados

Debajo de la respuesta principal, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva el nombre de host tal como se escribió (`#input=www.blog.example.co.uk`), y nada más. Todo lo que lleva el enlace va después del `#`, que según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27) queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo): el navegador no lo envía al servidor cuando se abre el enlace, pero se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Un enlace lleva como máximo 16.384 caracteres, el límite que el sitio aplica a todo valor después del `#`; un nombre de host es mucho más corto.
- **Al abrir un enlace.** El nombre de host rellena el campo como lo haría la escritura y la página lo vuelve a buscar en su copia incluida de la lista; una dirección IP o un nombre mal formado recibe la nota propia de la página. Se acepte o no, después los valores salen de la propia dirección de la página al instante, sin ninguna solicitud, así que al recargar, con un marcador o con el propio botón Compartir de la página no se lleva nada que no hayas decidido compartir.
