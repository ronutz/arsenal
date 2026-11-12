## Was das Tool tut

Sie beschreiben die Anfrage, und die Seite schreibt die Kommandozeile für `dig`. Fünf Gruppen von Bedienelementen entsprechen den fünf Angaben, die ein Aufruf von dig macht:

- **Was nachgeschlagen wird:** ein Name und ein Eintragstyp (standardmäßig A, jede Mnemonik aus der IANA-Registry, `TYPEnn` oder die Anfragetypen ANY, AXFR und IXFR mit der Seriennummer, die Sie haben), eine Klasse (standardmäßig IN; CH und HS) oder eine Adresse für einen Reverse Lookup mit `-x`; in diesem Fall leitet dig den PTR-Namen selbst ab, und Name, Typ und Klasse werden nicht geschrieben.
- **Wo gefragt wird:** der Server (`@server`, ein Hostname oder eine einzelne IPv4- oder IPv6-Adresse), ein vom Standard abweichender Port (`-p`), der Transport (UDP, `+tcp`, `+tls`, `+https` mit seinem Endpunkt), eine einzige Adressfamilie (`-4`, `-6`) und eine Quelladresse (`-b`).
- **Wie gefragt wird:** `+trace`, `+nssearch`, `+norecurse`, `+dnssec`, `+cd`, `+ignore`; die Einstellungen für EDNS `+bufsize`, `+subnet`, `+nsid`, `+nocookie`, `+noedns`; und die Timer `+timeout`, `+tries`, `+retry`.
- **Was ausgegeben wird:** die ganze Nachricht, `+short` (mit `+identify`), `+noall +answer` oder `+yaml`; dazu `+multiline`, `+ttlunits` und `+qr`.
- **Auf Ihrem Rechner:** `-k keyfile` für eine signierte Anfrage und `-r`, um `~/.digrc` zu ignorieren.

Zurück kommen drei Dinge: der Befehl in einer kanonischen Reihenfolge, mit der Schaltfläche „Kopieren“; Befunde, wo eine Kombination widersprüchlich, redundant oder vermutlich überraschend ist; und eine Zusammenfassung dessen, was die Anfrage enthält, abgeleitet aus den Standardwerten und Wechselwirkungen, die das Handbuch nennt: die Frage, die dig in die Nachricht schreibt, welche Server gefragt werden, Transport und Port nach den typabhängigen Standardwerten, ob eine abgeschnittene UDP-Antwort über TCP wiederholt wird, außerdem die Bits RD, DO, CD und AD, der OPT-Eintrag von EDNS mit seiner Puffergröße, das Cookie und ob die Anfrage signiert ist. Darunter wird jedes Token erklärt.

## Die Reihenfolge des Befehls

dig liest die ganze Zeile, und die Reihenfolge spielt kaum eine Rolle, mit zwei Ausnahmen, die das Handbuch nennt: Bei Anfrageoptionen (den `+`-Wörtern) kommt es auf die Reihenfolge an, und `+short` und `+cmd` gelten global. Der Generator schreibt eine feste Reihenfolge, damit dieselbe Absicht immer dieselben Bytes ergibt: `dig`, `@server`, die Optionen (`-r`, `-4`/`-6`, `-b`, `-p`, `-k`), die Frage (`-x address` oder der Name, dann der Typ, dann die Klasse), danach die Anfrageoptionen, gruppiert nach Transport, Modus, Header-Bits, EDNS, Timern und Ausgabe. `+noall` steht immer vor `+answer`, weil beide nacheinander wirken.

Standardwerte werden nicht geschrieben: Typ A, Klasse IN, Port 53 (853 bei TLS, 443 bei HTTPS), UDP. Ein Name, der zugleich eine Typ- oder Klassen-Mnemonik ist (die Top-Level-Domain `ch`, ein Host, der tatsächlich `mx` heißt), wird mit `-q` geschrieben, weil dig einzelne Wörter als Typen und Klassen liest, bevor es sie als Namen liest; der Hinweis des Handbuchs selbst zu den Top-Level-Domains IN und CH ist der Grund, warum es diese Option gibt.

## Was die Befunde prüfen

Jede Regel verweist auf den Satz im Handbuch oder im RFC, der sie begründet:

- `+trace` setzt `+dnssec` und `+cookie` und schaltet die Rekursion ab; `@server` betrifft dann nur die erste Anfrage nach den Root-Servern. Zusätzlich angegebenes `+dnssec` oder `+norecurse` wird als redundant markiert, und der Hinweis zum Server wird angezeigt.
- `+nssearch` schaltet die Rekursion ebenfalls ab.
- Typ ANY und `ixfr=N` verwenden standardmäßig TCP; AXFR verwendet immer TCP, und ein Zonentransfer ohne `@server` ginge an die Resolver in `/etc/resolv.conf` statt an einen Server, der die Zone hält (RFC 5936). Auf ANY kann minimal oder mit einem synthetisierten HINFO-Eintrag geantwortet werden (RFC 8482).
- `+bufsize` reicht von 0 bis 65535; ein Wert unter 512 wird vom Empfänger als 512 behandelt (RFC 6891, Abschnitt 6.2.3); ein Wert über 4096 liegt über dem Ausgangspunkt, den RFC 6891 vorschlägt; der DNS Flag Day 2020 nennt 1232 als minimale sichere Größe.
- `+bufsize=0` wird mit „prüfen“ markiert: Es kündigt einen EDNS-UDP-Puffer von 0 Byte an, den der Empfänger als 512 behandelt. Den Standardwert stellt es nicht wieder her; diese Aufgabe weist das Handbuch `+bufsize` ohne Wert zu. Der Standardwert von dig ist 1232 Byte (`DEFAULT_EDNS_BUFSIZE` im Quellcode von 9.20.29). Die Änderung von 4096 auf 1232 ist Eintrag 5516 der BIND-CHANGES, veröffentlicht in 9.17.6 und damit in jedem Release ab 9.18.0; im Zweig 9.16 erreichte derselbe Eintrag `named`, aber nicht dig, das bis 9.16.50 bei 4096 blieb.
- `+dnssec`, `+trace`, `+bufsize`, `+nsid` und `+subnet` stehen im OPT-Eintrag (RFC 6891; das DO-Bit stammt aus RFC 3225), daher lässt sich `+noedns` nicht mit ihnen kombinieren und wird nicht geschrieben, wenn sie vorhanden sind.
- `+subnet=0` (oder eine Präfixlänge von 0) bittet den Resolver, Ihre Adresse nicht zu verwenden (RFC 7871).
- `-4` zusammen mit einer IPv6-Adresse als Server oder `-6` zusammen mit einer IPv4-Adresse lässt dig kein Ziel, an das es die Anfrage senden kann.
- Ein `+timeout` unter 1 und ein `+tries` von 0 hebt dig stillschweigend auf 1 an.
- `+identify` bewirkt nichts ohne `+short`; `+ignore` bewirkt nichts ohne UDP.
- Für TSIG wird nur `-k` angeboten. Laut Handbuch soll es statt `-y` verwendet werden, weil `-y` das Shared Secret auf die Kommandozeile setzt, wo `ps` und der Verlauf der Shell es sehen können.

## Grenzen

- Der Generator erzeugt eine Abfrage pro Befehl. dig kann mehrere Anfragen in einer Zeile annehmen, jede mit eigenen Optionen, sowie eine Batch-Datei mit `-f`; beides wird nicht abgebildet.
- Er führt dig nicht aus, löst nichts auf und prüft nicht, ob ein Server existiert. Die Zusammenfassung ist aus den Aussagen des Handbuchs abgeleitet, nicht beobachtet.
- Nicht angebotene Optionen (`+aaonly`, `+besteffort`, `+cmd`, `+comments`, `+crypto`, `+domain`, `+ednsopt`, `+expire`, `+header-only`, `+keepopen`, `+ndots`, `+onesoa`, `+opcode`, `+padding`, `+proxy`, `+qid`, `+search`, `+split`, `+stats`, `+tls-ca` und die übrigen TLS-Dateien, `+unknownformat`, `+zoneversion`, `-c` als Option, `-f`, `-F`, `-m`, `-t` als Option, `-u`, `-y`) sind im Handbuch dokumentiert; die gängigen sind hier enthalten.
- Namen werden auf ihre Form geprüft (Labels aus Buchstaben, Ziffern, Bindestrichen und Unterstrichen, jedes höchstens 63 Zeichen lang, insgesamt höchstens 253; ein einzelnes Sternchen als Wildcard-Label); ob ein Name existiert, weiß der Generator nicht.
- Für diese Seite wurde das dig-Handbuch der BIND-9-Dokumentation „latest“ (9.21) gelesen, für `+bufsize` das Handbuch der stabilen Version 9.20.29 (abgerufen am 19.10.2026). Ältere dig-Versionen kennen manche Anfrageoptionen nicht (`+tls`, `+https`, `+yaml` sind neu); für ein Wort, das es nicht kennt, gibt dig „Invalid option“ aus.

## Ergebnisse teilen

Unter dem Befehl erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält jedes Feld, das Sie gesetzt haben, mit seinem Namen: den nachzuschlagenden Namen als `#input=`, dann zum Beispiel `&type=MX&server=192.0.2.53&dnssec=1`. Ein Schalter wird nur dann als `1` übertragen, wenn er eingeschaltet ist, eine Auswahl mit ihrem Wert (`transport=tls`). Bevor Sie etwas kopieren, fügt das Popover einen Warnhinweis hinzu: Der Befehl kann Ihren DNS-Server, eine Quelladresse oder den Pfad einer Schlüsseldatei nennen; prüfen Sie ihn daher, bevor Sie den Link senden. Das Formular enthält selbst keinen Schlüssel: `-k` von dig nimmt den Pfad einer Schlüsseldatei entgegen. Alles, was der Link enthält, steht nach dem `#`, und dieser Teil ist laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt: Ein Browser sendet ihn beim Öffnen des Links nicht an den Server, aber er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann ihn lesen.

- **Länge.** Ein Link enthält höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; die Felder zusammen sind weit kürzer.
- **Öffnen eines Links.** Das Formular aus dem Link ersetzt das ganze Formular, auch das Beispiel, mit dem die Seite öffnet (ein Feld, das der Link nicht enthält, wird geleert), und der Befehl wird zusammengesetzt; es wird nichts ausgeführt oder gesendet. Eine Auswahl, die das Formular nicht anbietet, ein Schalter mit einem anderen Wert als `1` oder `0` oder ein Wert, der länger ist, als sein Feld erlaubt, führt dazu, dass der ganze Link ignoriert wird. Ob angenommen oder nicht, die Werte verschwinden danach sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen, ein Lesezeichen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts, was Sie nicht selbst teilen wollten.

## API

Dieselbe Engine beantwortet die Operation `/api/v1/dig-command-builder` der HTTP-API der Website, Feld für Feld beschrieben im OpenAPI-Vertrag auf der [API-Seite](/api), mit Beispielen aus den Referenzvektoren. Der Vertrag gibt auch an, ob diese Website die API bereitstellt.

- **Anfrage.** Ein JSON-Objekt mit den Feldern des Formulars: `name`, `type`, `ixfrSerial`, `klass`, `reverse`, `server`, `port`, `ipv`, `source`, `transport`, `httpsEndpoint`, `bufsize`, `subnet`, `timeout`, `tries`, `retry`, `output` und `keyfile` als Strings und die Schalter `trace`, `nssearch`, `norecurse`, `dnssec`, `cd`, `noedns`, `nocookie`, `nsid`, `ignore`, `identify`, `multiline`, `ttlunits`, `qr` und `norc` als boolesche Werte.
- **Antwort.** `ok`, `command`, `parts` (`text`, `kind` und `explain`, die ID der Erklärung), `findings` (`code`, `severity` und `params`) und `effective`, also das, was die Anfrage enthält.
- **Fehler.** Ein Befund der Stufe Fehler ist kein HTTP-Fehler: `ok` ist `false`, `command` ist leer und `effective` ist `null`. Ein Body, der kein JSON-Objekt ist, wird mit HTTP 400 beantwortet.

Seit dem 19.10.2026 liefert `{"name": "example.com", "bufsize": "0"}` den Befund `bufsize-default` mit dem Schweregrad `warning`; zuvor war es ein `info`, laut dem 0 den Standardwert wiederherstellt.

## Quellen

- [BIND 9 Administrator Reference Manual, Manual Pages: dig](https://bind9.readthedocs.io/en/latest/manpages.html#man-dig) (abgerufen am 04.10.2026): jede Option und Anfrageoption, die Standardwerte und die oben zitierten Wechselwirkungen
- [BIND 9 source, bin/dig/dig.c](https://github.com/isc-projects/bind9/blob/main/bin/dig/dig.c) (abgerufen am 04.10.2026): die Reihenfolge, in der ein einzelnes Wort geprüft wird (ixfr=, Typ, Klasse, Name), und der TCP-Standard für ANY und ixfr
- [RFC 1035: Domain Names - Implementation and Specification](https://www.rfc-editor.org/rfc/rfc1035) (abgerufen am 04.10.2026): die Werte für TYPE und CLASS, Port 53, die UDP-Grenze von 512 Byte, IN-ADDR.ARPA, die Längen von Labels und Namen, das RD-Bit
- [RFC 3596: DNS Extensions to Support IP Version 6](https://www.rfc-editor.org/rfc/rfc3596) (abgerufen am 04.10.2026): AAAA und die Nibble-Form unter IP6.ARPA
- [RFC 6891: Extension Mechanisms for DNS (EDNS(0))](https://www.rfc-editor.org/rfc/rfc6891) (abgerufen am 04.10.2026): der OPT-Eintrag, die Regeln zur Payload-Größe, 4096 als Ausgangspunkt
- [RFC 3225: Indicating Resolver Support of DNSSEC](https://www.rfc-editor.org/rfc/rfc3225) (abgerufen am 04.10.2026): das DO-Bit
- [RFC 4034](https://www.rfc-editor.org/rfc/rfc4034) und [RFC 4035](https://www.rfc-editor.org/rfc/rfc4035) (abgerufen am 04.10.2026): die DNSSEC-Eintragstypen; die Bits CD und AD
- [RFC 5936: DNS Zone Transfer Protocol (AXFR)](https://www.rfc-editor.org/rfc/rfc5936) und [RFC 1995: Incremental Zone Transfer in DNS](https://www.rfc-editor.org/rfc/rfc1995) (abgerufen am 04.10.2026)
- [RFC 8482: Providing Minimal-Sized Responses to DNS Queries That Have QTYPE=ANY](https://www.rfc-editor.org/rfc/rfc8482) (abgerufen am 04.10.2026)
- [RFC 7858: DNS over TLS](https://www.rfc-editor.org/rfc/rfc7858) und [RFC 8484: DNS Queries over HTTPS](https://www.rfc-editor.org/rfc/rfc8484) (abgerufen am 04.10.2026)
- [RFC 5001: NSID](https://www.rfc-editor.org/rfc/rfc5001), [RFC 7871: Client Subnet in DNS Queries](https://www.rfc-editor.org/rfc/rfc7871), [RFC 7873: DNS Cookies](https://www.rfc-editor.org/rfc/rfc7873) (abgerufen am 04.10.2026)
- [IANA: Domain Name System (DNS) Parameters](https://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml) (abgerufen am 04.10.2026): die Registry der RR-Typen, die das Typfeld akzeptiert, und die Codes der EDNS-Optionen
- [ISC, BIND 9 9.20.29 documentation, Manual Pages: dig](https://bind9.readthedocs.io/en/v9.20.29/manpages.html) (abgerufen am 19.10.2026): `+bufsize[=B]` setzt die angekündigte Größe auf B Byte, 0 bis 65535; `+bufsize` ohne Wert stellt den Standardwert wieder her
- [BIND 9 source at tag v9.20.29, bin/dig/dighost.h](https://github.com/isc-projects/bind9/blob/v9.20.29/bin/dig/dighost.h) (abgerufen am 19.10.2026): `DEFAULT_EDNS_BUFSIZE 1232`
- [ISC, BIND 9.18.0 CHANGES](https://downloads.isc.org/isc/bind9/9.18.0/CHANGES) (abgerufen am 19.10.2026): Eintrag 5516 unter 9.17.6, die Standardgröße des EDNS-Puffers wurde von 4096 auf 1232 Byte geändert
- [BIND 9 source at tag v9.16.50, bin/dig/include/dig/dig.h](https://github.com/isc-projects/bind9/blob/v9.16.50/bin/dig/include/dig/dig.h) (abgerufen am 19.10.2026): `DEFAULT_EDNS_BUFSIZE 4096`, der Standardwert von dig im Zweig 9.16
- [DNS Flag Day 2020](https://www.dnsflagday.net/2020/) (abgerufen am 04.10.2026): 1232 Byte als minimale sichere Größe des EDNS-Puffers
- [RFC 5737](https://www.rfc-editor.org/rfc/rfc5737) und [RFC 3849](https://www.rfc-editor.org/rfc/rfc3849) (abgerufen am 04.10.2026): die Adressbereiche für Dokumentation, die in den Beispielen verwendet werden (192.0.2.0/24, 2001:db8::/32)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (abgerufen am 27.10.2026): Abschnitt 3.5, das Fragment, das die Werte eines Links von „Ergebnisse teilen“ enthält
