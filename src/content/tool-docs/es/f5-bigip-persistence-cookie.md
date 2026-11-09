## Qué hace

Decodifica el valor de una cookie de persistencia `BIGipServer` de F5 BIG-IP para obtener la dirección IP y el puerto del miembro del pool de backend, o hace el camino inverso y codifica el valor de una cookie a partir de una dirección y un puerto. Admite las cuatro codificaciones sin cifrar que usa BIG-IP y se ejecuta por completo en tu navegador.

## Qué es la cookie y por qué importa decodificarla

Cuando la persistencia por cookie de BIG-IP funciona en su modo predeterminado de inserción (insert), añade una cookie llamada `BIGipServer<pool>` cuyo valor codifica a qué miembro del pool se envió al cliente, para que el cliente vuelva al mismo miembro. El problema es que la codificación no es un cifrado: en su forma predeterminada, la cookie codifica a la vista la dirección IP interna y el puerto del miembro del pool. Cualquiera que pueda ver la cookie, es decir, el cliente y cualquier equipo del camino, puede decodificarla y conocer una parte de tu topología interna. Demostrarlo es el objetivo de esta herramienta, que avisa cuando una dirección decodificada cae en un rango privado del RFC 1918, porque ese es exactamente el detalle interno que no pretendías publicar.

## Las codificaciones y su orden de bytes

La sutileza, y el motivo por el que ayuda un decodificador hecho a medida, es el orden de bytes. En la codificación IPv4 predeterminada, la dirección es un único número decimal cuyos bytes se toman en little-endian, es decir, invertidos, y el puerto es un campo decimal con sus dos bytes intercambiados. Por ejemplo, la dirección `10.1.1.100` se codifica como el decimal `1677787402`, y el puerto `80`, con los bytes intercambiados, como `20480`. BIG-IP define cuatro codificaciones de este tipo en total, que cubren IPv4, IPv6 y las variantes con route domain, cada una con su propia regla, y la herramienta las implementa a partir de la propia documentación de F5 (K6917), contrastada con un decodificador de referencia muy conocido.

## La solución, que esta herramienta no puede deshacer

La mitigación es sencilla y conviene decirla: configura el cifrado de cookies en el perfil de persistencia (F5 K7784). Una cookie de persistencia cifrada no lleva ninguna dirección legible, y esta herramienta no puede decodificarla, a propósito. Si puedes decodificar aquí tu cookie de producción, cualquiera puede hacerlo, y esa es la señal para activar el cifrado.

## Uso

Pega el valor de una cookie `BIGipServer` para decodificar la dirección y el puerto del miembro, o introduce una dirección y un puerto para generar el valor de una cookie. El cálculo es determinista y local; no se envía nada a ningún sitio.

## Compartir resultados

Cada modo tiene su propio botón **Compartir resultados** debajo de su respuesta. Genera un enlace a esta página, solo cuando lo presionas, que lleva los valores después del `#`. En Decodificar, el enlace lleva una copia de la cookie que decodificó la página, su nombre y su valor, nunca la línea tal como se pegó: la página solo lee lo que hay antes del primer `;`, y una línea pegada puede contener más, como los atributos de una línea `Set-Cookie` o el valor `Cookie` de un navegador, donde una cookie de sesión va detrás de la cookie de persistencia ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), el ejemplo de la sección 4.2.1, `Cookie: SID=31d4d96e407aad42; lang=en-US`; sección 8.4: una cookie suele contener un identificador de sesión; consultado el 2026-11-01). Así, la página que recibe el enlace decodifica el mismo miembro del pool, y el resto se queda contigo. En Codificar, el enlace lleva la dirección, el puerto y el route domain tal como los leyó la página. Su ventana emergente dice primero qué lleva el enlace, y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia. Como la dirección decodificada o escrita suele ser la de un miembro del pool interno, la ventana emergente añade una línea que te pide revisarla antes de enviar el enlace.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Al abrir un enlace.** Se abre el modo y sus campos se rellenan como si los hubieras escrito, y la página decodifica o codifica como de costumbre. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
