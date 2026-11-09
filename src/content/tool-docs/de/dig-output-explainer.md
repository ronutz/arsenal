## Was das Tool tut

Fügen Sie die Ausgabe eines `dig`-Befehls ein, und das Tool rekonstruiert die DNS-Nachricht, die sie darstellt, Abschnitt für Abschnitt, und erklärt jeden Teil. Es liest den Header, die Zeile mit Flags und Abschnittszählern, die OPT-Pseudo-Section von EDNS, die vier Abschnitte mit Einträgen, wobei jeder Resource Record in seine Felder zerlegt wird, und die abschließende Abfragestatistik. Es parst nur den Text: Es wird nichts aufgelöst und nichts gesendet.

## Warum die Ausgabe von dig dekodiert werden muss

`dig` gibt eine getreue, aber knappe Darstellung einer DNS-Nachricht aus, und in kurze Token ist viel Bedeutung gepackt. Der **Header** enthält die Operation, einen Statuscode und eine Nachrichten-ID; die Zeile mit den **Flags** enthält Flags aus einem Wort, deren Vorhandensein oder Fehlen alles ändert. `aa` bedeutet, dass die Antwort autoritativ ist, also von einem Server stammt, der für die Zone zuständig ist, und nicht aus einem Cache; `rd` bedeutet, dass Rekursion gewünscht war, und `ra`, dass sie verfügbar ist; `ad` kennzeichnet Daten, die per DNSSEC validiert wurden; `tc` bedeutet, dass die Antwort abgeschnitten wurde und über TCP wiederholt werden sollte. Der Statuscode ist das andere, was Sie zuerst lesen sollten: `NOERROR`, `NXDOMAIN` für einen Namen, der nicht existiert, oder `SERVFAIL` für einen Fehler auf dem Server.

## Die Abschnitte und EDNS

Eine DNS-Nachricht hat vier Abschnitte, und dig beschriftet sie: **QUESTION** (was gefragt wurde), **ANSWER** (die Einträge, die die Frage beantworten), **AUTHORITY** (die zuständigen Nameserver) und **ADDITIONAL** (zusätzliche hilfreiche Einträge). Das Tool zerlegt jeden Resource Record in seine Teile: den Namen, die TTL in Sekunden (umgerechnet, wenn dig Einheiten ausgegeben hat), die Klasse (fast immer `IN`), den Typ (`A`, `AAAA`, `MX` und so weiter) und die Daten des Eintrags. Es dekodiert auch die **OPT-Pseudo-Section**, die EDNS(0)-Erweiterung (RFC 6891), die etwa die größte UDP-Antwort ankündigt, die der Resolver annimmt, und die Unterstützung von DNSSEC. Sie ist kein echter Eintrag, sondern enthält Metadaten über den Austausch.

## Die Statistik

Die Fußzeilen, die dig ausgibt, sind für die Diagnose wirklich nützlich: Die Abfragezeit zeigt, wie lange der Resolver gebraucht hat, die Zeile mit dem Server zeigt, welcher Resolver geantwortet hat, und Nachrichtengröße und Zeitstempel runden das Bild ab. Zusammen gelesen erklären diese Angaben eine langsame oder überraschende Abfrage oft schneller als die Einträge selbst.

## Verwendung

Fügen Sie eine vollständige Antwort von `dig` ein, und lesen Sie Header, Flags, Abschnitte und Statistik in dekodierter Form. Das Parsen ist deterministisch und vollständig lokal; das Tool führt nie selbst eine Abfrage durch.

## Formate, die das Tool liest

Neben dem Standardformat liest der Parser die Formen, die die Ausgabeoptionen von dig erzeugen, jede durch einen Test mit echter Ausgabe von dig 9.20.29 abgesichert:

- `+ttlunits`: TTLs, die mit Einheiten ausgegeben werden (`1h30m`, `1d`, `2w`, `4m16s`; das Handbuch nennt s, m, h, d und w), werden in Sekunden umgerechnet und in beiden Formen angezeigt, zum Beispiel `1h30m = 5400s`.
- `+nottlid`: Einträge, die ohne TTL-Spalte ausgegeben werden, werden trotzdem gelesen; die TTL wird als fehlend markiert.
- `+multiline`: Einträge, die in Klammern über mehrere Zeilen umbrochen sind, mit `;`-Kommentaren, werden wieder zu einer Zeile zusammengefügt, sodass sich ein SOA weiterhin in seine sieben Felder zerlegen lässt.
- Opcode 6 und RCODE 11: dig 9.20 hat für sie keinen Namen und gibt `RESERVED6` und `RESERVED11` aus. Die IANA hat sie DNS Stateful Operations (DSO) und DSOTYPENI (RFC 8490) zugewiesen, und das Tool zeigt beide Namen.

Bei einer negativen Antwort (NXDOMAIN oder NOERROR mit leerem Abschnitt ANSWER), die den SOA der Zone enthält, berechnet das Tool auch die TTL für negatives Caching. Laut RFC 2308, Abschnitt 5, setzt der autoritative Server die TTL des SOA auf das Minimum aus der eigenen TTL des SOA und seinem Feld MINIMUM, und ein Cache zählt von dort aus herunter.

## Beispiele

Die Schaltfläche „Beispiel laden“ und die Tests verwenden echte Ausgabe von dig 9.20.29, aufgezeichnet am 19.10.2026, größtenteils über ein lokales Relay, das jede Anfrage per DNS over HTTPS an einen öffentlichen Resolver weitergab (die Zeile SERVER zeigt das Relay, `127.0.0.1`), der Rest gegen einen lokalen Lab-Server mit einer Kopie von `example.com` und Adressen für Dokumentation, dazu ein Lab-Responder, der eigens RCODE 11 zurückgibt. Namen, die nicht existieren, liegen unter `.invalid`: Laut RFC 6761, Abschnitt 6.4, dürfen Benutzer annehmen, dass sie immer NXDOMAIN liefern, während `example.com` für nicht existierende Namen inzwischen NOERROR ohne Daten liefert (die Compact Denial of Existence aus RFC 9824).

## Ergebnisse teilen

Oberhalb der Auswertung erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält die dig-Ausgabe so, wie eingefügt (`#input=...`), und sonst nichts. Bevor Sie etwas kopieren, fügt das Popover einen Warnhinweis hinzu: Die Ausgabe von dig kann interne Hosts, Adressen und den befragten Resolver nennen; lesen Sie sie daher, bevor Sie den Link senden. Alles, was der Link enthält, steht nach dem `#`, und dieser Teil ist laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt: Ein Browser sendet ihn beim Öffnen des Links nicht an den Server, aber er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann ihn lesen.

- **Länge.** Ein Link enthält höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der Inhalt länger, gibt es keinen Link, und das Popover nennt die Länge, die er hätte.
- **Öffnen eines Links.** Der Text füllt das Feld wie beim Einfügen, und die Seite erklärt ihn erneut; es wird nichts aufgelöst oder gesendet. Text, der keine Ausgabe von dig ist, erhält den eigenen Hinweis der Seite. Ob angenommen oder nicht, die Werte verschwinden danach sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen, ein Lesezeichen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts, was Sie nicht selbst teilen wollten.

## API

Dieselbe Engine beantwortet die Operation `/api/v1/dig-output-explainer` der HTTP-API der Website, Feld für Feld beschrieben im OpenAPI-Vertrag auf der [API-Seite](/api), mit Beispielen aus den Referenzvektoren. Der Vertrag gibt auch an, ob diese Website die API bereitstellt.

- **Anfrage.** Die Ausgabe von dig als Text, einschließlich Zeilenumbrüchen und Tabs.
- **Antwort.** `versionLine`, `digVersion`, `queryArgs`, `header` (`opcode`, `status` und `id` so, wie ausgegeben, dazu `opcodeName` oder `statusName`, wo dig RESERVED6 oder RESERVED11 ausgibt), `flags` mit den vier Abschnittszählern, `opt`, `sections` (jeder Eintrag mit `name`, `ttl` in Sekunden oder `null`, `ttlText`, wenn dig die TTL mit Einheiten ausgegeben hat, `class`, `type`, `rdata` und `isQuestion`), `footer`, `negative` (`owner`, `soaTtl`, `minimum` und `ttl`) bei einer negativen Antwort mit einem SOA in AUTHORITY, `warnings` (stabile Codes) und `hadHeader`.
- **Fehler.** Text, der keine Ausgabe von dig ist, führt nicht zu einem HTTP-Fehler: `hadHeader` ist `false`.

`ttlText`, `negative`, `opcodeName`, `statusName` und die Warnungen `ttl-units` und `ttl-absent` kamen am 19.10.2026 hinzu; eine als `1d` ausgegebene TTL ergibt jetzt `ttl` 86400, während sie früher als 1 gelesen wurde.

## Quellen

- [RFC 1035: Domain Names - Implementation and Specification](https://www.rfc-editor.org/rfc/rfc1035) (abgerufen am 19.10.2026): das Nachrichtenformat und die Header-Flags
- [RFC 6891: Extension Mechanisms for DNS (EDNS(0))](https://www.rfc-editor.org/rfc/rfc6891) (abgerufen am 19.10.2026): die OPT-Pseudo-Section
- [RFC 2308: Negative Caching of DNS Queries](https://www.rfc-editor.org/rfc/rfc2308) (abgerufen am 19.10.2026): Abschnitt 5, die TTL für negatives Caching
- [RFC 4034: Resource Records for the DNS Security Extensions](https://www.rfc-editor.org/rfc/rfc4034) (abgerufen am 19.10.2026): RRSIG, DNSKEY, DS, NSEC
- [RFC 9499: DNS Terminology](https://www.rfc-editor.org/rfc/rfc9499) (März 2024, ersetzt RFC 8499; abgerufen am 19.10.2026)
- [RFC 8490: DNS Stateful Operations](https://www.rfc-editor.org/rfc/rfc8490) (abgerufen am 19.10.2026): Abschnitte 10.1 und 10.2, Opcode 6 (DSO) und RCODE 11 (DSOTYPENI)
- [RFC 6761: Special-Use Domain Names](https://www.rfc-editor.org/rfc/rfc6761) (abgerufen am 19.10.2026): Abschnitt 6.4, Namen unter `.invalid`
- [RFC 9824: Compact Denial of Existence in DNSSEC](https://www.rfc-editor.org/rfc/rfc9824) (abgerufen am 19.10.2026): NOERROR ohne Daten für einen Namen, der nicht existiert
- [ISC, BIND 9 9.20.29 documentation, Manual Pages: dig](https://bind9.readthedocs.io/en/stable/manpages.html) (abgerufen am 19.10.2026): `+ttlunits`, `+ttlid`, `+multiline`, `+opcode`
- [BIND 9 source at tag v9.20.29, bin/dig/dig.c](https://github.com/isc-projects/bind9/blob/v9.20.29/bin/dig/dig.c) (abgerufen am 19.10.2026): die Opcode-Namen, die dig ausgibt, darunter `RESERVED6`; `RESERVED11` stammt aus lib/dns/rcode.c
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (abgerufen am 27.10.2026): Abschnitt 3.5, das Fragment, das die Werte eines Links von „Ergebnisse teilen“ enthält
