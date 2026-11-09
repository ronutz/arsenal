## Qué hace

Describe una solicitud (adónde va, cómo se dirige, si el dispositivo está gestionado, si se descifra el TLS, si lleva carga útil) y la herramienta muestra el paso único: qué servicios intervienen, en qué orden, cuáles son **pilares** y cuáles son **transversales**, y qué habría hecho en su lugar una cadena de appliances separados. Determinista y sin conexión; describe una arquitectura, no consulta ninguna.

## Lo que pretende demostrar

**La DLP (prevención de pérdida de datos, data loss prevention) y la protección frente a amenazas no son pilares.** Son transversales: se ejecutan dentro del mismo paso y reciben lo que hayan descifrado los pilares. Por eso un solo perfil de datos cubre por igual la web, el software como servicio y las aplicaciones privadas, y por eso la misma regla, en una arquitectura encadenada, hay que escribirla cuatro veces en cuatro dialectos.

Los pilares dependen de **adónde va el tráfico**: la puerta de enlace web segura para la web en general, el agente de seguridad de acceso a la nube para la actividad en SaaS, el acceso a la red de confianza cero para una aplicación privada y el firewall en la nube para los puertos que los demás no cubren. Cambia el destino en la herramienta y mira qué pilares intervienen mientras los motores transversales siguen igual.

## La afirmación que puedes comprobar

Un solo paso significa que **la carga útil se descifra una vez** y el mismo flujo se entrega a todos los motores. Los appliances encadenados descifran y vuelven a cifrar en cada salto, y esa repetición es la mayor parte de la latencia que se achaca a la inspección.

La herramienta lo plantea como contraste en cada resultado, porque “convergente” suele ser una afirmación de empaquetado comercial y no de arquitectura. La pregunta que conviene hacerle a un fabricante es si la carga útil se descifra una vez o una vez por motor.

## Lo que no hace

No modela ningún tenant concreto y no es un simulador de políticas. Desactiva el descifrado y te dirá que todo lo que está por debajo de la identificación de aplicaciones trabaja con metadatos, que es el modo de fallo que más quiere que interiorice quien aprende, porque una política escrita como si el contenido fuera visible seguirá en la consola pareciendo correcta.

## Fabricante de referencia

Los nombres de las etapas siguen la descripción que Netskope publica de su Zero Trust Engine, porque esa es la plataforma que cubre la capacitación de este sitio. El argumento estructural (un solo paso, inspección transversal, procesamiento completo en el perímetro) es general a SSE y se presenta como tal.

## Compartir resultados

Debajo del resumen, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` todos los campos del formulario, siempre: el destino y el método de direccionamiento por sus identificadores, y las cuatro casillas como 1 o 0, así que un enlace conserva su significado si cambia un valor predeterminado. Los campos describen una solicitud y no nombran ningún sistema ni ninguna persona. La página muestra un paso nada más abrirse, así que el botón está disponible desde el principio. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que lo que va después del `#` no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Longitud.** Como máximo 16.384 caracteres en total, el límite que el sitio aplica a todo valor después del `#`; si lo compartido es más largo, no hay enlace, y la ventana emergente indica su longitud.
- **Al abrir un enlace.** Los campos se establecen como si los eligieras, y a continuación se muestra el paso. Si una opción es desconocida, se ignora el enlace. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
