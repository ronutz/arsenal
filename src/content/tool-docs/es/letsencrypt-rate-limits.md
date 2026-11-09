## Qué hace

Pega la lista de nombres de host que piensas incluir en certificados de Let's Encrypt y la herramienta los agrupa por **dominio registrado** (eTLD+1) y muestra cómo encajan en los límites de emisión de Let's Encrypt. Te dice el mínimo de certificados que necesita el conjunto, señala dónde un comodín (wildcard) agruparía varios subdominios y avisa cuando el planteamiento ingenuo de un certificado por nombre superaría el límite semanal por dominio. Todo se ejecuta en local, en tu navegador; no se envía nada a ningún sitio.

## Por qué importa el dominio registrado

El límite principal de Let's Encrypt cuenta los certificados nuevos por **dominio registrado**, no por nombre de host. Así, `www.example.com`, `api.example.com` y `blog.example.com` consumen un único presupuesto semanal, el de `example.com`. La herramienta calcula esa agrupación con la Public Suffix List (lista de sufijos públicos), así que acierta también con los sufijos de varias etiquetas: `shop.example.co.uk` y `www.example.co.uk` se agrupan bajo `example.co.uk`, con tres etiquetas, no bajo `co.uk`. Equivocarse con este límite es el motivo habitual por el que un error de límite de tasa toma a alguien por sorpresa.

## Qué calcula

Para cada dominio registrado muestra cuántos nombres hay previstos (frente al límite semanal por dominio), el mínimo de certificados necesarios si metes hasta 100 nombres por certificado y los **candidatos a comodín**: un dominio padre con dos o más subdominios directos, que un único nombre `*.parent` podría cubrir en su lugar. El resumen totaliza los nombres, los dominios registrados distintos y el mínimo de certificados para todo el conjunto, y lanza una advertencia si algún dominio registrado superaría el límite semanal emitiendo un certificado por nombre. Las direcciones IP introducidas se enumeran aparte, porque usan su propia unidad, y se señala todo lo que no sea un nombre de host válido (incluido un sufijo público suelto como `co.uk`).

## Los límites que usa

Las cifras que se muestran son una instantánea fechada y con fuente de los límites que publica Let's Encrypt: 50 certificados nuevos por dominio registrado cada 7 días, 300 pedidos nuevos por cuenta cada 3 horas, 5 certificados para el mismo conjunto exacto de nombres cada 7 días y hasta 100 nombres por certificado. El dato más útil para planificar es que **las renovaciones coordinadas por ARI están exentas de todos los límites de tasa**, así que, una vez emitidos los certificados, mantenerlos renovados no plantea problemas de límite de tasa. Como Let's Encrypt puede cambiar estas cifras, la herramienta muestra la fecha de la instantánea y enlaza la fuente; consulta esa página para ver los valores vigentes antes de confiar en un margen ajustado.

## Compartir resultados

Al final del resumen, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` los nombres de host tal como los escribiste, uno por línea. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que los nombres no se envían al servidor cuando se abre el enlace; se quedan en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlos.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** Los nombres rellenan el cuadro como lo haría un pegado y la página los planifica. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
