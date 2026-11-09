# Explicador de códigos de estado HTTP

Pega códigos de estado (sueltos, como `404`; varios a la vez, como `301 302 307`; o familias enteras, como `5xx`) y obtén cada uno decodificado: la familia a la que pertenece, su nombre registrado, su significado documentado y las notas operativas que importan cuando el código aparece en un log a las 3 de la madrugada.

## Qué explica

El registro en el que se apoya la herramienta se basa en el catálogo de estados del RFC 9110 más las extensiones registradas (428/429/431/511 del RFC 6585, 451 del RFC 7725, 103 del RFC 8297). Las notas recogen las distinciones que enseña el [artículo complementario](/learn/http-status-codes-the-five-families): qué redirecciones conservan el método (307/308) y cuáles históricamente no lo hacían (301/302), por qué 304 es un intercambio con la caché y no una redirección, por qué 401 tiene que llegar con `WWW-Authenticate` mientras que 403 rechaza en cualquier caso, y la lectura para el triaje de incidentes del trío de los proxies: 502 culpa a la conversación con el backend; 503, a la capacidad del servicio; 504, al reloj.

## La regla de reserva, como funcionalidad

Pega un código válido que el registro no conozca (un `599` de algún middlebox) y la herramienta no da error. Responde con la propia regla de compatibilidad futura del protocolo: un cliente que no reconoce un código tiene que tratarlo como el `x00` de su familia, así que el primer dígito basta para definir el comportamiento exigido. Gracias a esa regla, el registro de estados ha podido crecer durante treinta años sin romper ni un solo cliente antiguo, y la herramienta la considera una respuesta que merece mostrarse, no una laguna por la que haya que disculparse.

## Gramática de la entrada

Tokens separados por espacios, comas o saltos de línea. Cada token es o bien tres dígitos entre 100 y 599, o bien una familia de la forma `1xx` a `5xx`. Los duplicados se eliminan conservando el orden; el límite es de veinte tokens por ejecución. Todo se ejecuta en local en tu navegador.

## Compartir resultados

Al principio de la lectura, encima de las tarjetas, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` el cuadro tal como se escribió, y nada más: códigos de estado y familias, que no dicen nada de ti. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia. Los enlaces del Decodificador de mensajes HTTP que pasan un código de estado a esta página usan el mismo `#input=` y rellenan el cuadro de la misma forma.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que el texto no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** El texto rellena el cuadro como lo haría la escritura y la página lo explica; no se envía nada a ningún sitio. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.

## Fuentes

- [RFC 9110, HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110) (consultado el 2026-11-09): el catálogo básico, las reglas de las familias y la reserva x00
- [RFC 6585, Additional HTTP Status Codes](https://www.rfc-editor.org/rfc/rfc6585) (consultado el 2026-11-09): 428, 429, 431 y 511
- [RFC 7725, An HTTP Status Code to Report Legal Obstacles](https://www.rfc-editor.org/rfc/rfc7725) (consultado el 2026-11-09): 451 Unavailable For Legal Reasons
- [RFC 8297, An HTTP Status Code for Indicating Hints](https://www.rfc-editor.org/rfc/rfc8297) (consultado el 2026-11-09): 103 Early Hints
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultado el 2026-11-01): sección 3.5, el fragmento, que usa un enlace de Compartir resultados
