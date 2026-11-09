## Was das Tool tut

Fügen Sie die Ausgabe eines `nslookup`-Befehls ein, und das Tool dekodiert sie in eine strukturierte, erklärte Aufschlüsselung: welcher Resolver geantwortet hat, ob die Antwort autoritativ war, jeder Eintrag mit ausgeschriebenen Feldern und jeder gemeldete Fehler. Es parst nur den Text: Es wird nichts aufgelöst und nichts gesendet.

## Das Layout von nslookup lesen

`nslookup` gibt DNS-Antworten in einem lockeren, fast prosaartigen Layout aus, das sich deutlich von `dig` unterscheidet, und in diesem Layout steckt Bedeutung, die es wert ist, ausdrücklich gemacht zu werden. Jede Antwort beginnt mit den Zeilen **Server** und **Address**, die den abgefragten Resolver nennen. Eine Zeile **Non-authoritative answer:** bedeutet, dass das AA-Bit nicht gesetzt war: Die Antwort kam von einem Resolver, nicht von einem für den Namen autoritativen Server. RFC 1035 (Abschnitt 4.1.1) und RFC 2181 (Abschnitt 6) definieren Autorität über den Namen, nicht über das Caching; die Zeile sagt daher nicht, ob der Resolver aus seinem Cache geantwortet oder die Antwort für Sie geholt hat, beides sieht gleich aus. Fehlt sie bei einer direkten Anfrage, deutet das auf eine autoritative Antwort hin. Scheitert eine Abfrage, gibt nslookup eine Zeile wie `** server can't find NAME: NXDOMAIN` aus, und das Tool zeigt diesen Fehler und was der Status bedeutet.

## Einträge und ihre Felder

Für die meisten Eintragstypen gibt nslookup eine einfache Zeile `name = value` aus, einige packen aber mehrere Felder in eine Zeile oder einen Block, und genau die lohnt es zu dekodieren:

- **MX**-Einträge lauten `mail exchanger = 10 mail.example.com`; die Zahl ist die Präferenz (die niedrigere wird bevorzugt), der Name der Mailhost. Das Tool trennt beides.
- **SRV**-Einträge (RFC 2782) enthalten Priorität, Gewichtung, Port und Ziel in einer Zeile; das Tool zerlegt sie, damit Sie sehen, auf welchen Diensthost und Port sie verweisen.
- **SOA**-Einträge erstrecken sich über mehrere Zeilen: der primäre Nameserver der Zone, das Postfach der verantwortlichen Stelle sowie die Seriennummer und die Timer (refresh, retry, expire, minimum). Das Tool legt diese Felder einzeln dar.

## Verwendung

Fügen Sie eine Antwort von `nslookup` ein, und lesen Sie den Resolver, den Autoritätsstatus, jeden Eintrag mit seinen Feldern und jeden Fehler. Das Parsen ist deterministisch und vollständig lokal; das Tool führt nie selbst eine Abfrage durch, und deshalb lässt sich damit auch Ausgabe gefahrlos lesen, die anderswo aufgezeichnet wurde.

## Beispiele

Die Schaltfläche „Beispiel laden“ und die Tests des Tools verwenden echte Ausgabe von `nslookup` aus dem Build von BIND 9.20.29, aufgezeichnet am 19.10.2026 über ein lokales Relay, das jede Anfrage per DNS over HTTPS an einen öffentlichen Resolver weitergab; die Zeile Server zeigt daher die Adresse des Relays, `127.0.0.1#5311`. Das Beispiel für einen Fehler fragt `nonexistent.invalid` ab: Laut RFC 6761, Abschnitt 6.4, dürfen Benutzer annehmen, dass Anfragen nach Namen unter `.invalid` immer NXDOMAIN liefern, während `example.com` für nicht existierende Namen inzwischen NOERROR ohne Daten liefert (die Compact Denial aus RFC 9824).

## Ergebnisse teilen

Ganz oben in der Auswertung erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält die nslookup-Ausgabe so, wie eingefügt (`#input=...`), und sonst nichts. Bevor Sie etwas kopieren, fügt das Popover einen Warnhinweis hinzu: Die Ausgabe von nslookup kann interne Hosts, Adressen und den befragten Server nennen; lesen Sie sie daher, bevor Sie den Link senden. Alles, was der Link enthält, steht nach dem `#`, und dieser Teil ist laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt: Ein Browser sendet ihn beim Öffnen des Links nicht an den Server, aber er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann ihn lesen.

- **Länge.** Ein Link enthält höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der Inhalt länger, gibt es keinen Link, und das Popover nennt die Länge, die er hätte.
- **Öffnen eines Links.** Der Text füllt das Feld wie beim Einfügen, und die Seite erklärt ihn erneut; es wird nichts aufgelöst oder gesendet. Text, der keine Ausgabe von nslookup ist, erhält den eigenen Hinweis der Seite. Ob angenommen oder nicht, die Werte verschwinden danach sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen, ein Lesezeichen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts, was Sie nicht selbst teilen wollten.

## API

Dieselbe Engine beantwortet die Operation `/api/v1/nslookup-output-explainer` der HTTP-API der Website, Feld für Feld beschrieben im OpenAPI-Vertrag auf der [API-Seite](/api), mit Beispielen aus den Referenzvektoren. Der Vertrag gibt auch an, ob diese Website die API bereitstellt.

- **Anfrage.** Die Ausgabe von nslookup als Text, einschließlich Zeilenumbrüchen und Tabs.
- **Antwort.** `server` (`server` und `address`), `authority` (`authoritative`, `non-authoritative` oder `unknown`), `records` (`name`, `type`, `value` und `fields` für MX, SRV und SOA), `errors` (`name` und `code`), `referralNote`, `warnings` (stabile Codes) und `recognized`.
- **Fehler.** Text, der keine Ausgabe von nslookup ist, führt nicht zu einem HTTP-Fehler: `recognized` ist `false`.

Die Antwort hat sich am 19.10.2026 nicht geändert; die Beispiele wurden durch Aufzeichnungen von diesem Tag ersetzt.

## Quellen

- [RFC 1035: Domain Names - Implementation and Specification](https://www.rfc-editor.org/rfc/rfc1035) (abgerufen am 19.10.2026): das AA-Bit, Abschnitt 4.1.1
- [RFC 2181: Clarifications to the DNS Specification](https://www.rfc-editor.org/rfc/rfc2181) (abgerufen am 19.10.2026): Autorität einer Zone, Abschnitt 6
- [RFC 2308: Negative Caching of DNS Queries](https://www.rfc-editor.org/rfc/rfc2308) (abgerufen am 19.10.2026): NXDOMAIN, NODATA und das SOA-Minimum
- [RFC 2782: A DNS RR for specifying the location of services (DNS SRV)](https://www.rfc-editor.org/rfc/rfc2782) (abgerufen am 19.10.2026): die SRV-Felder
- [RFC 9499: DNS Terminology](https://www.rfc-editor.org/rfc/rfc9499) (März 2024, ersetzt RFC 8499; abgerufen am 19.10.2026): autoritativer Server und Resolver
- [RFC 6761: Special-Use Domain Names](https://www.rfc-editor.org/rfc/rfc6761) (abgerufen am 19.10.2026): Abschnitt 6.4, Namen unter `.invalid`
- [RFC 9824: Compact Denial of Existence in DNSSEC](https://www.rfc-editor.org/rfc/rfc9824) (abgerufen am 19.10.2026): NOERROR ohne Daten für einen Namen, der nicht existiert
- [RFC 7505: A "Null MX" No Service Resource Record for Domains That Accept No Mail](https://www.rfc-editor.org/rfc/rfc7505) (abgerufen am 19.10.2026): das MX-Beispiel, Präferenz 0 und Exchange `.`
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (abgerufen am 27.10.2026): Abschnitt 3.5, das Fragment, das die Werte eines Links von „Ergebnisse teilen“ enthält
