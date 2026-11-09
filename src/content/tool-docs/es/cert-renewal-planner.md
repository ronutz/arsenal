## Qué hace

Dale a la herramienta las fechas de inicio y de fin de un certificado, su `notBefore` y su `notAfter`, y calcula las consecuencias prácticas: cuánto tiempo es válido el certificado, en qué fase del calendario de reducción de la validez del CA/Browser Forum se emitió y si su duración cabe en el máximo de esa fase, cuántas renovaciones al año implica esa cadencia, las ventanas de reutilización de la validación del dominio y de la identidad en esa etapa, y un margen de antelación recomendado con su fecha de “renovar antes de”. Es aritmética de fechas pura y se ejecuta por completo sin conexión.

## Por qué se acorta la vida de los certificados

Los certificados TLS de confianza pública llevan años acortándose, y la votación (ballot) SC-081v3 del CA/Browser Forum fija un calendario que reduce la validez máxima de 398 días, pasando por 200 y 100 días, hasta 47 días en 2029. Los certificados más cortos limitan el tiempo que sigue siendo útil un certificado comprometido o emitido por error, pero también hacen impracticable la renovación manual, y esa es la idea: en la práctica, el calendario obliga a automatizar. Junto con la validez se reducen dos ventanas relacionadas: el periodo durante el que se puede reutilizar una validación del control del dominio (DCV, domain control validation) y el periodo durante el que se puede reutilizar la información de identidad del titular ya validada (SII, Subject Identity Information), así que hay que repetir más partes del proceso con más frecuencia.

## Qué te dice el plan

Con solo las dos fechas, la herramienta deduce el panorama completo:

- la **duración de la validez** y la fase de SC-081v3 a la que corresponde, con un sí o un no claros sobre si la duración está dentro del máximo de esa fase;
- la **cadencia de renovación**, expresada en renovaciones al año, tanto para el máximo actual como para cada máximo futuro, para que veas cómo crece la carga de trabajo;
- las **ventanas de reutilización de DCV y SII** que se aplican a la etapa de emisión, y
- un **margen de antelación recomendado para la renovación** y la fecha de “renovar antes de” que resulta, para que la renovación termine antes de la caducidad y no en el último momento.

## La respuesta de verdad es la automatización

Como el final de este calendario es un certificado de 47 días, renovar a mano muchas veces al año cada certificado no escala. La respuesta estándar es el protocolo ACME (RFC 8555), la emisión y la renovación automatizadas que usan herramientas como certbot; las cifras de cadencia del planificador son, en realidad, un argumento para adoptarlo.

## Uso

Introduce las fechas `notBefore` y `notAfter` del certificado y lee la validez, el encaje en el calendario, la cadencia de renovación, las ventanas de reutilización y la fecha de renovación recomendada. El cálculo es una función pura de esas dos fechas; si un certificado está caducado en este momento se muestra aparte, según el reloj de tu dispositivo.

## Compartir resultados

Al final del resumen, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` las dos fechas, la de emisión y la de caducidad: `/tools/cert-renewal-planner#input=2026-01-01&notafter=2027-02-02`. Los días restantes no se llevan: la página los cuenta con el reloj de quien abre el enlace. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que las fechas no se envían al servidor cuando se abre el enlace; se quedan en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlas.

- **Al abrir un enlace.** Se establecen las dos fechas y la página planifica. Cada una debe ser un día real con la forma AAAA-MM-DD, la única que admite un campo de fecha; cualquier otra cosa hace que se ignore el enlace entero. En ambos casos, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
