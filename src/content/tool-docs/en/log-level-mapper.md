## What it does

Takes a logging level in one system, by its name or by that system's own number, and reads it against nine other systems through one common scale, OpenTelemetry's SeverityNumber. The answer names the rung chosen, where it sits on the scale (1 to 24, in six ranges of four), the nearest rung in every other ladder, whether that neighbour is exact or at a stated distance, and the ties where a mapping is not one-to-one. Below the answer the whole table is drawn: every ladder with its own numbers, its own words and its own caveat, the chosen rung lit. Nothing is sent anywhere.

## The ladders and where each sits

The scale is OpenTelemetry's. The Logs Data Model defines SeverityNumber as 24 values in six ranges, TRACE 1 to 4, DEBUG 5 to 8, INFO 9 to 12, WARN 13 to 16, ERROR 17 to 20 and FATAL 21 to 24, with 0 meaning unspecified; "smaller numerical values correspond to less severe events" (read 2026-10-05). Appendix B of the same document gives the example mapping this tool follows for the systems it lists:

| System | Direction of the numbers | Where its rungs land (Appendix B) |
| --- | --- | --- |
| syslog, RFC 5424 §6.2.1 Table 2 | 0 is the most severe | Debug 7 to 5, Informational 6 to 9, Notice 5 to 10, Warning 4 to 13, Error 3 to 17, Critical 2 to 18, Alert 1 to 19, Emergency 0 to 21 |
| Windows Event Log (winmeta levels) | 1 is the most severe | Verbose 5 to 5, Informational 4 to 9, Warning 3 to 13, Error 2 to 17, Critical 1 to 18; LogAlways 0 is not a severity |
| Log4j 2 | a lower priority number is more severe | TRACE 600 to 1, DEBUG 500 to 5, INFO 400 to 9, WARN 300 to 13, ERROR 200 to 17, FATAL 100 to 21; OFF 0 and ALL are filters |
| java.util.logging | the numbers grow with severity | FINEST 300 to 1, FINER 400 to 5, FINE 500 to 6, CONFIG 700 to 7, INFO 800 to 9, WARNING 900 to 13, SEVERE 1000 to 17; OFF and ALL are the integer extremes |
| .NET Microsoft.Extensions.Logging | 0 is the least severe | Trace 0 to 1, Debug 1 to 5, Information 2 to 9, Warning 3 to 13, Error 4 to 17, Critical 5 to 21; None 6 is a filter value |

Three ladders are placed by their correspondence with syslog's severities, which they reuse by number and by name:

- Linux kernel printk: KERN_EMERG "0" to KERN_DEBUG "7", written as strings in the message prefix; KERN_DEFAULT and KERN_CONT are not levels (kernel documentation, read 2026-10-05).
- Cisco IOS logging: emergencies 0 to debugging 7, each paired with its LOG_* constant in the command reference, whose table also says the default buffered level "varies by platform but is generally 7" (read 2026-10-05).
- Junos system syslog: emergency, alert, critical, error, warning, notice and info, in that order, with "any" selecting every level and "none" disabling logging; Juniper's page gives the names, not numbers, and has no debug rung (read 2026-10-05).

Python's logging module is placed by the OpenTelemetry SDK for Python itself, whose `_STD_TO_OTEL` table maps 10 DEBUG to 5, 20 INFO to 9, 30 WARNING to 13, 40 ERROR to 17 and 50 CRITICAL to 21, and the integers between to the further steps of the range (read 2026-10-05). NOTSET (0) means "consult the ancestors" and is not a message level.

The equivalents table names an exact match when another ladder has a rung on the same SeverityNumber, and otherwise the nearest rung with its distance on the scale. When two rungs are equally near, both are shown and the row is marked as a tie. Sentinels (OFF, ALL, NOTSET, None, LogAlways, any, none) are shown in their ladder but are never offered as equivalents: they are filter values, not the severity of any message.

## Limits

- The placements are the sources' examples, not a standard: Appendix B is titled "example mappings", and a collector or an agent may choose differently. The tool shows the table it used so the reader can disagree with a specific row.
- A system's own words still matter. Windows "Critical" lands at 18 (ERROR2) while .NET "Critical" lands at 21 (FATAL): the names match, the places do not, and the table says so rather than smoothing it over.
- Ladders not listed (Zap, Ruby, Go slog, Serilog and the rest) are out of scope until a source for their placement is read.
- Custom levels (Python's arbitrary integers, Windows 16 to 255, Log4j custom levels) are not mapped; they carry no standardised severity.

## Sources

- [OpenTelemetry specification, Logs Data Model: field SeverityNumber, and Appendix B, SeverityNumber example mappings](https://opentelemetry.io/docs/specs/otel/logs/data-model/) (read 2026-10-05)
- [RFC 5424, The Syslog Protocol, section 6.2.1 Table 2, the severities](https://www.rfc-editor.org/rfc/rfc5424#section-6.2.1) (read 2026-10-05)
- [The Linux Kernel documentation, Message logging with printk](https://www.kernel.org/doc/html/latest/core-api/printk-basics.html) (read 2026-10-05)
- [Cisco IOS Configuration Fundamentals Command Reference, logging buffered, the severity level table](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/fundamentals/command/cf_command_ref/L_through_mode.html) (read 2026-10-05)
- [Juniper Networks, Junos OS, syslog facilities and severity levels](https://juniper.net/documentation/en_US/junos13.1/topics/reference/general/syslog-facilities-severity-levels.html) (published 2013-07-08, read 2026-10-05)
- [Microsoft Learn, Windows Event Log, LevelType complex type, the predefined levels](https://learn.microsoft.com/en-us/windows/win32/wes/eventmanifestschema-leveltype-complextype) (read 2026-10-05)
- [Microsoft Learn, Microsoft.Extensions.Logging.LogLevel enum](https://learn.microsoft.com/en-us/dotnet/api/microsoft.extensions.logging.loglevel) (read 2026-10-05)
- [Python documentation, logging, Logging Levels](https://docs.python.org/3/library/logging.html#logging-levels) (read 2026-10-05)
- [OpenTelemetry Python SDK, the _STD_TO_OTEL table in the logs SDK](https://github.com/open-telemetry/opentelemetry-python/blob/main/opentelemetry-sdk/src/opentelemetry/sdk/_logs/_internal/__init__.py) (read 2026-10-05)
- [Java SE 21 API, java.util.logging.Level](https://docs.oracle.com/en/java/javase/21/docs/api/java.logging/java/util/logging/Level.html) (read 2026-10-05)
- [Apache Log4j 2.x manual, Levels](https://logging.apache.org/log4j/2.x/manual/customloglevels.html) (read 2026-10-05)
