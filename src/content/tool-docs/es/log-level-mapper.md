## Qué hace

Toma un nivel de log de un sistema, por su nombre o por el número propio de ese sistema, y lo lee frente a otros nueve sistemas a través de una escala común, el SeverityNumber de OpenTelemetry. La respuesta nombra el peldaño elegido, dónde queda en la escala (de 1 a 24, en seis rangos de cuatro), el peldaño más cercano en cada una de las demás escaleras, si ese vecino coincide exactamente o está a una distancia indicada, y los empates allí donde la correspondencia no es biunívoca. Debajo de la respuesta se dibuja la tabla completa: cada escalera con sus propios números, sus propias palabras y su propia salvedad, con el peldaño elegido resaltado. No se envía nada a ningún sitio.

## Las escaleras y dónde queda cada una

La escala es la de OpenTelemetry. El Logs Data Model define SeverityNumber como 24 valores en seis rangos: TRACE de 1 a 4, DEBUG de 5 a 8, INFO de 9 a 12, WARN de 13 a 16, ERROR de 17 a 20 y FATAL de 21 a 24, con 0 para “sin especificar”; “smaller numerical values correspond to less severe events” (los valores numéricos más bajos corresponden a eventos menos graves) (consultado el 2026-10-05). El apéndice B del mismo documento da la correspondencia de ejemplo que sigue la herramienta para los sistemas que enumera:

| Sistema | Sentido de los números | Dónde caen sus peldaños (apéndice B) |
| --- | --- | --- |
| syslog, RFC 5424 §6.2.1, tabla 2 | 0 es el más grave | Debug 7 → 5, Informational 6 → 9, Notice 5 → 10, Warning 4 → 13, Error 3 → 17, Critical 2 → 18, Alert 1 → 19, Emergency 0 → 21 |
| Windows Event Log (niveles de winmeta) | 1 es el más grave | Verbose 5 → 5, Informational 4 → 9, Warning 3 → 13, Error 2 → 17, Critical 1 → 18; LogAlways 0 no es una severidad |
| Log4j 2 | un número de prioridad más bajo es más grave | TRACE 600 → 1, DEBUG 500 → 5, INFO 400 → 9, WARN 300 → 13, ERROR 200 → 17, FATAL 100 → 21; OFF 0 y ALL son filtros |
| java.util.logging | los números crecen con la severidad | FINEST 300 → 1, FINER 400 → 5, FINE 500 → 6, CONFIG 700 → 7, INFO 800 → 9, WARNING 900 → 13, SEVERE 1000 → 17; OFF y ALL son los extremos enteros |
| .NET Microsoft.Extensions.Logging | 0 es el menos grave | Trace 0 → 1, Debug 1 → 5, Information 2 → 9, Warning 3 → 13, Error 4 → 17, Critical 5 → 21; None 6 es un valor de filtro |

Tres escaleras se colocan por su correspondencia con las severidades de syslog, que reutilizan por número y por nombre:

- printk del kernel de Linux: de KERN_EMERG “0” a KERN_DEBUG “7”, escritos como cadenas en el prefijo del mensaje; KERN_DEFAULT y KERN_CONT no son niveles (documentación del kernel, consultada el 2026-10-05).
- logging de Cisco IOS: de emergencies 0 a debugging 7, cada uno emparejado con su constante LOG_* en la referencia de comandos, cuya tabla también dice que el nivel buffered predeterminado “varies by platform but is generally 7” (varía según la plataforma, pero suele ser 7) (consultado el 2026-10-05).
- system syslog de Junos: emergency, alert, critical, error, warning, notice e info, en ese orden, con “any” para seleccionar todos los niveles y “none” para desactivar el registro; la página de Juniper da los nombres, no números, y no tiene peldaño debug (consultado el 2026-10-05).

El módulo logging de Python se coloca según el propio SDK (kit de desarrollo de software, software development kit) de OpenTelemetry para Python, cuya tabla `_STD_TO_OTEL` asigna 10 DEBUG a 5, 20 INFO a 9, 30 WARNING a 13, 40 ERROR a 17 y 50 CRITICAL a 21, y los enteros intermedios a los pasos siguientes del rango (consultado el 2026-10-05). NOTSET (0) significa “consult the ancestors” (consultar a los antecesores) y no es un nivel de mensaje.

La tabla de equivalencias indica una correspondencia exacta cuando otra escalera tiene un peldaño en el mismo SeverityNumber y, si no, el peldaño más cercano con su distancia en la escala. Cuando dos peldaños están igual de cerca, se muestran los dos y la fila se marca como empate. Los valores centinela (OFF, ALL, NOTSET, None, LogAlways, any, none) se muestran en su escalera, pero nunca se ofrecen como equivalentes: son valores de filtro, no la severidad de ningún mensaje.

## Compartir resultados

Debajo del veredicto, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` el nivel tal como lo escribiste (`input`) y el sistema por su clave (`system`). Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

El valor predefinido que se resaltó no viaja en el enlace: solo marca qué chip se presionó.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-11-01), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que el nivel no se envía al servidor cuando se abre el enlace; se queda en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlo.

- **Al abrir un enlace.** Se establecen el sistema y el nivel y la página los asigna, igual que al elegir y escribir. Después, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.

## Límites

- Las ubicaciones son los ejemplos de las fuentes, no un estándar: el apéndice B se titula “example mappings” (correspondencias de ejemplo), y un colector o un agente puede elegir otras. La herramienta muestra la tabla que usó para que quien la lea pueda discrepar de una fila concreta.
- Las palabras propias de cada sistema siguen importando. “Critical” de Windows cae en 18 (ERROR2), mientras que “Critical” de .NET cae en 21 (FATAL): los nombres coinciden, las posiciones no, y la tabla lo dice en lugar de disimularlo.
- Las escaleras que no aparecen (Zap, Ruby, Go slog, Serilog y las demás) quedan fuera del alcance hasta que se consulte una fuente para su ubicación.
- Los niveles personalizados (los enteros arbitrarios de Python, del 16 al 255 en Windows, los niveles personalizados de Log4j) no se asignan; no tienen una severidad estandarizada.

## Fuentes

- [OpenTelemetry specification, Logs Data Model: el campo SeverityNumber y el apéndice B, SeverityNumber example mappings](https://opentelemetry.io/docs/specs/otel/logs/data-model/) (consultado el 2026-10-05)
- [RFC 5424, The Syslog Protocol, sección 6.2.1, tabla 2, las severidades](https://www.rfc-editor.org/rfc/rfc5424.html#section-6.2.1) (consultado el 2026-10-05)
- [The Linux Kernel documentation, Message logging with printk](https://www.kernel.org/doc/html/latest/core-api/printk-basics.html) (consultado el 2026-10-05)
- [Cisco IOS Configuration Fundamentals Command Reference, logging buffered, la tabla de niveles de severidad](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/fundamentals/command/cf_command_ref/L_through_mode.html) (consultado el 2026-10-05)
- [Juniper Networks, Junos OS, syslog facilities and severity levels](https://juniper.net/documentation/en_US/junos13.1/topics/reference/general/syslog-facilities-severity-levels.html) (publicado el 2013-07-08, consultado el 2026-10-05)
- [Microsoft Learn, Windows Event Log, LevelType complex type, los niveles predefinidos](https://learn.microsoft.com/en-us/windows/win32/wes/eventmanifestschema-leveltype-complextype) (consultado el 2026-10-05)
- [Microsoft Learn, Microsoft.Extensions.Logging.LogLevel enum](https://learn.microsoft.com/en-us/dotnet/api/microsoft.extensions.logging.loglevel) (consultado el 2026-10-05)
- [Python documentation, logging, Logging Levels](https://docs.python.org/3/library/logging.html#logging-levels) (consultado el 2026-10-05)
- [OpenTelemetry Python SDK, la tabla _STD_TO_OTEL del SDK de logs](https://github.com/open-telemetry/opentelemetry-python/blob/main/opentelemetry-sdk/src/opentelemetry/sdk/_logs/_internal/__init__.py) (consultado el 2026-10-05)
- [Java SE 21 API, java.util.logging.Level](https://docs.oracle.com/en/java/javase/21/docs/api/java.logging/java/util/logging/Level.html) (consultado el 2026-10-05)
- [Apache Log4j 2.x manual, Levels](https://logging.apache.org/log4j/2.x/manual/customloglevels.html) (consultado el 2026-10-05)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax, sección 3.5](https://www.rfc-editor.org/rfc/rfc3986#section-3.5) (consultado el 2026-11-01): el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), algo en lo que se apoya Compartir resultados
