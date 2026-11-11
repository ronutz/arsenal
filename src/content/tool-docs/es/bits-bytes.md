## Qué hace

Tres campos: un tamaño, una velocidad y un tiempo. Cualquiera de ellos se explica por sí solo; dos cualesquiera dan el tercero.

- **Un tamaño** (“1,5 GB”, “700 MiB”, “10K”, “8 bits”, “2 kilobytes”) vuelve como un número exacto de bits y de bytes, como valor en todas las unidades de las dos convenciones (bits con prefijos del SI y binarios, bytes con prefijos del SI, bytes con prefijos de la IEC) y, cuando la etiqueta era un prefijo del SI sobre bytes, como esa misma etiqueta leída de las dos formas, con la diferencia entre ambas.
- **Una velocidad** (“100 Mbit/s”, “12,5 MB/s”, “1 Gbps”, “56k”) vuelve en bits y en bytes por segundo, en todas las unidades de velocidad y como la cantidad que mueve en un minuto, en una hora y en un día.
- **Un tiempo** (“90 s”, “2h 30min”, “1 day”) se lee de forma exacta, al milisegundo. Las unidades son ms, s, min, h y d, o sus nombres completos en inglés, portugués, español, alemán, francés o italiano (seconds, minutes, hours, days; segundos, minutos, horas, dias o días; Sekunden, Minuten, Stunden, Tage; secondes, heures, jours, o j para día; secondi, minuti, ore, giorni).
- **Dos de los tres** dan el tercero: el tamaño entre la velocidad es el tiempo de transferencia (con su desglose), el tamaño entre el tiempo es la velocidad conseguida y la velocidad por el tiempo es la cantidad transferida. Con los tres, el tiempo se vuelve a calcular a partir del tamaño y la velocidad.
- **La eficiencia** escala la velocidad: un valor predefinido para TCP sobre IPv4 sobre Ethernet, TCP sobre IPv6 o UDP sobre IPv4, o cualquier porcentaje.
- **La tabla de conexiones** responde a la pregunta del tiempo de transferencia para un conjunto de enlaces estándar a la vez, con la eficiencia elegida.

## Los dos tipos de kilo

Los prefijos tienen dos significados en informática, y la calculadora los mantiene separados por su forma de escribirse, igual que hacen los estándares:

- **Los prefijos del SI son decimales.** k es 1000, M es 1.000.000, y así sucesivamente; un kilobyte (kB) son 1000 bytes y un megabit (Mbit), 1.000.000 bits. Es lo que significan los prefijos en el resto de la ciencia, y lo que quieren decir los fabricantes de discos y de equipos de red.
- **Los prefijos binarios de la IEC son potencias de 1024.** La IEC los aprobó en diciembre de 1998 (IEC 60027-2, enmienda 2, publicada en enero de 1999; hoy IEC 80000-13): kibi Ki 2^10, mebi Mi 2^20, gibi Gi 2^30, tebi Ti 2^40, pebi Pi 2^50, exbi Ei 2^60. Un kibibyte (KiB) son 1024 bytes; un mebibyte (MiB), 1.048.576 bytes. El NIST señala que no forman parte del SI.
- **La costumbre antigua.** Antes de 1998, y todavía en algunos programas, “KB” y “MB” significaban 1024 y 1.048.576 bytes. La diferencia crece con el prefijo: 2,4 % en kilo, 4,86 % en mega, 7,37 % en giga, 10 % en tera, 12,6 % en peta. Un disco de “1 TB” contiene 1.000.000.000.000 bytes, que un sistema que cuenta en potencias de 1024 muestra como 931 GiB y puede etiquetar como “931 GB”; no falta nada. La calculadora imprime las dos lecturas de cualquier etiqueta del SI sobre bytes, para que la cuestión nunca tenga que discutirse.

Cómo se lee la entrada:

- `b` es un bit y `B`, un byte; se aceptan `bit`, `bits`, `byte`, `bytes` y `octet`, y también los prefijos escritos con todas sus letras (kilobyte, mebibit).
- `k`, `K`, `M`, `G`, `T`, `P`, `E`, `Z` son decimales; `Ki`, `Mi`, `Gi`, `Ti`, `Pi`, `Ei`, `Zi` son binarios.
- Un prefijo solo, sin unidad (`10K`, `1.5M`), se lee como potencia de 1024 de bytes, que es como imprimen los tamaños `ls -h` y `du -h` (según la página de GNU ls, K, M, G, T, P, E, Z, Y, R y Q son potencias de 1024, KB, MB, etc., potencias de 1000, y KiB equivale a K); el resultado lo indica.
- `Kb`, `Mb`, `Gb` (un prefijo en mayúscula con una b minúscula) se leen como bits, que es lo que dice el símbolo, y se señalan, porque algunas fichas técnicas de producto escriben así los bytes.
- Una velocidad es un tamaño seguido de `/s` o de `ps`: `Mbit/s`, `MB/s`, `Mbps`, `kbps`. Un `56k` solo, como velocidad, es 56.000 bit/s.
- En la entrada se acepta como separador decimal una coma o un punto (`1,5 GB` y `1.5 GB` son el mismo tamaño); los resultados se imprimen con el separador del idioma de la página.

## Valores predefinidos de eficiencia

La velocidad nominal de un enlace cuenta todos los bits que pasan por el cable. La carga útil (payload) avanza más despacio, porque cada trama lleva encabezados, un preámbulo y un intervalo entre tramas. Con tramas completas de 1500 bytes:

| Valor predefinido | Carga útil por trama | En el cable por trama | Eficiencia |
|---|---|---|---|
| TCP sobre IPv4 sobre Ethernet | 1500 − 20 (IPv4) − 20 (TCP) = 1460 | 1500 + 14 + 4 + 8 + 12 = 1538 | 94,93 % |
| TCP sobre IPv6 sobre Ethernet | 1500 − 40 (IPv6) − 20 (TCP) = 1440 | 1538 | 93,63 % |
| UDP sobre IPv4 sobre Ethernet | 1500 − 20 (IPv4) − 8 (UDP) = 1472 | 1538 | 95,71 % |

Los mínimos de encabezado salen del RFC 791 (IPv4, 20 octetos), el RFC 8200 (IPv6, 40 octetos, que su sección 8.3 describe como 20 octetos más que el encabezado IPv4 mínimo), el RFC 9293 (TCP, 20 octetos) y el RFC 768 (UDP, 8 octetos). La sobrecarga por trama sale del apéndice B del RFC 2544, “Maximum frame rates reference”: “Preamble 64 bits, Frame 8 x N bits, Gap 96 bits”, donde N es la trama con el encabezado de 14 bytes y la FCS de 4 bytes; las 812 tramas por segundo de 1518 bytes a 10 Mb/s del mismo apéndice son 10.000.000 / (1538 × 8), y el vector de referencia `rfc2544-frame-time` lo reproduce. Estos valores predefinidos son techos: una transferencia TCP real también gasta capacidad en confirmaciones, arranque lento y retransmisiones.

## La tabla de conexiones

| Enlace | Velocidad nominal | Fuente |
|---|---|---|
| Módem de 56k | 56.000 bit/s de bajada | ITU-T V.90 (09/98) |
| RDSI (ISDN), un canal B | 64 kbit/s | la tabla de la calculadora de 2004 |
| T1 | 1544 kbit/s | ITU-T G.704 (10/98) |
| E1 | 2048 kbit/s | ITU-T G.704 (10/98) |
| Ethernet de 10 Mb/s a 400 Gb/s | 10, 100 y 1000 Mb/s; 2,5 Gb/s, 5, 10, 25, 40, 100 y 400 Gb/s | IEEE 802.3-2022 |

Las filas marcadas con 2004 estaban en la tabla de conexiones de la calculadora de bits y bytes de nutzmann.net en 2004 y de ntz.com.br en 2013, el antepasado más antiguo de las herramientas de este sitio. Su ejemplo resuelto es aquí el botón Ejemplo: un archivo de “56k” por un módem de “56k” tarda unos 8,2 segundos, no uno, porque el archivo tiene 56 KiB (57.344 bytes, 458.752 bits) y el módem mueve 56.000 bits por segundo: exactamente 8192 ms.

## Exactitud

Cada cantidad se guarda como una mantisa entera y una potencia de diez, y cada velocidad y cada tiempo como el cociente de dos de esos números, así que nada se redondea hasta que se imprime. Los valores impresos conservan hasta seis decimales; un valor cuya forma exacta no termina (un tercio de segundo) se marca como redondeado. Las duraciones se desglosan en días, horas, minutos, segundos y milisegundos, con redondeo al milisegundo hacia arriba desde la mitad, y el total también se da en segundos con seis decimales. Un zettabyte en bits se escribe completo.

## Compartir resultados

Debajo de la primera respuesta, **Compartir resultados** genera un enlace a esta página, solo cuando lo presionas, que lleva después del `#` los campos que rellenaste, tal como los escribiste: `size`, `rate`, `time` y `eff` (la eficiencia, un valor predefinido o un porcentaje): `/tools/bits-bytes#size=56+KiB&rate=56+kbit%2Fs`. Su ventana emergente dice primero qué lleva el enlace y después ofrece Copiar enlace y, si el navegador lo tiene, el menú Compartir del sistema; la dirección de la página no cambia.

Según el [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (sección 3.5, consultado el 2026-10-27), el fragmento queda “separated from the rest of the URI prior to a dereference” (separado del resto del URI antes de resolverlo), así que los valores no se envían al servidor cuando se abre el enlace; se quedan en la barra de direcciones y en el historial de quien lo abra, y cualquiera que tenga el enlace puede leerlos.

- **Al abrir un enlace.** Los cuatro campos se establecen a la vez, y el que falta se vacía, así que el resultado es el de quien envió el enlace; la página calcula. Un valor más largo de lo que admite su campo hace que se ignore el enlace entero. En ambos casos, los valores salen de la dirección de la página al instante, sin ninguna solicitud, así que al recargar, o con el propio botón Compartir de la página, no se lleva nada.
- **Enlaces desde otras páginas.** Un tamaño entregado como `#input=` sigue rellenando el campo de tamaño exactamente igual que antes; Compartir resultados usa nombres propios, así que los dos nunca se mezclan.

## Límites

- No se modelan las ventanas TCP ni el tiempo de ida y vuelta, las pérdidas, la compresión ni la diferencia entre la velocidad nominal de un enlace y lo que entrega un proveedor. Los valores predefinidos de eficiencia son techos por trama.
- La calculadora indica qué significa una etiqueta en cada convención. Qué convención usa un sistema operativo concreto para mostrar los tamaños es algo que debe indicar la documentación de ese sistema; la calculadora no lo afirma.
- Cada campo se corta a 64 caracteres y se lee con una única expresión anclada; la aritmética es BigInt, así que ningún valor se desborda.

## Fuentes

- [NIST: Prefixes for binary multiples](https://physics.nist.gov/cuu/Units/binary.html) (consultado el 2026-10-04)
- [ls(1), GNU coreutils (man7.org)](https://man7.org/linux/man-pages/man1/ls.1.html) (consultado el 2026-10-04): -h, --si y el argumento SIZE
- [RFC 2544, Appendix B, Maximum frame rates reference](https://www.rfc-editor.org/rfc/rfc2544.html#page-22) (consultado el 2026-10-26)
- [RFC 791: Internet Protocol](https://www.rfc-editor.org/rfc/rfc791) (consultado el 2026-10-04)
- [RFC 8200: IPv6, section 8.3](https://www.rfc-editor.org/rfc/rfc8200.html#section-8.3) (consultado el 2026-10-04)
- [RFC 9293: TCP](https://www.rfc-editor.org/rfc/rfc9293) (consultado el 2026-10-04)
- [RFC 768: UDP](https://www.rfc-editor.org/rfc/rfc768) (consultado el 2026-10-04)
- [ITU-T V.90 (09/98)](https://www.itu.int/rec/T-REC-V.90/en) (consultado el 2026-10-04)
- [ITU-T G.704 (10/98)](https://www.itu.int/rec/T-REC-G.704/en) (consultado el 2026-10-04)
- [IEEE 802.3-2022](https://standards.ieee.org/ieee/802.3/10422/) (consultado el 2026-10-04)
- [nutzmann.net, Calculadora de bits e bytes (2004), Internet Archive](https://web.archive.org/web/20041009131549/http://nutzmann.net:80/bitsandbytes.htm) (consultado el 2026-10-04): el ejemplo resuelto de la calculadora de 2004, su nota sobre la IEC y su tabla de conexiones
- [ntz.com.br, Calculadora e conversão de bits e bytes (2013), Internet Archive](https://web.archive.org/web/2013/http://ntz.com.br/bitsandbytes.html) (consultado el 2026-10-04): la misma calculadora en el sitio de 2013, con su tabla de prefijos de la IEC
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultado el 2026-10-27): sección 3.5, el fragmento, que lleva los valores de un enlace de Compartir resultados
