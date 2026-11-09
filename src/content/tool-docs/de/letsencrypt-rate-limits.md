## Was das Tool tut

Fügen Sie die Liste der Hostnamen ein, die Sie in Zertifikate von Let's Encrypt aufnehmen wollen; das Tool gruppiert sie nach **registrierter Domain** (eTLD+1) und zeigt, wie sie sich auf die Ausstellungslimits von Let's Encrypt verteilen. Es nennt die kleinste Zahl an Zertifikaten, die die Gruppe braucht, markiert, wo ein Wildcard-Zertifikat mehrere Subdomains zusammenfassen würde, und warnt, wenn der naive Ansatz mit einem Zertifikat pro Name das wöchentliche Limit pro Domain überschreiten würde. Alles läuft lokal in Ihrem Browser; es wird nichts gesendet.

## Warum die registrierte Domain zählt

Das wichtigste Limit von Let's Encrypt rechnet neue Zertifikate der **registrierten Domain** an, nicht jedem einzelnen Hostnamen. `www.example.com`, `api.example.com` und `blog.example.com` zehren daher alle vom selben Wochenbudget unter `example.com`. Das Tool berechnet diese Gruppierung mit der Public Suffix List und liegt deshalb auch bei mehrteiligen Suffixen richtig: `shop.example.co.uk` und `www.example.co.uk` landen unter `example.co.uk`, drei Labels tief, nicht unter `co.uk`. Eine falsch gezogene Grenze ist der übliche Grund, warum ein Rate-Limit-Fehler überrascht.

## Was das Tool berechnet

Für jede registrierte Domain zeigt das Tool die Anzahl der geplanten Namen (gemessen am wöchentlichen Limit pro Domain), die kleinste Zahl an Zertifikaten, wenn Sie bis zu 100 Namen in ein Zertifikat packen, und alle **Kandidaten für Wildcards**: eine übergeordnete Domain mit zwei oder mehr direkten Subdomains, die stattdessen ein einziger Name `*.parent` abdecken könnte. Die Zusammenfassung summiert die Namen, die unterschiedlichen registrierten Domains und die Mindestanzahl an Zertifikaten über alles und warnt, wenn eine einzelne registrierte Domain das Wochenlimit überschreiten würde, sobald pro Name ein Zertifikat ausgestellt wird. IP-Adressen in der Eingabe werden getrennt aufgeführt, weil für sie eine eigene Einheit gilt, und alles, was kein gültiger Hostname ist (auch ein bloßes Public Suffix wie `co.uk`), wird eigens ausgewiesen.

## Die verwendeten Limits

Die angezeigten Zahlen sind ein datierter Snapshot der veröffentlichten Limits von Let's Encrypt mit Quellenangabe: 50 neue Zertifikate pro registrierter Domain in 7 Tagen, 300 neue Orders pro Konto in 3 Stunden, 5 Zertifikate für genau dieselbe Gruppe von Namen in 7 Tagen und bis zu 100 Namen pro Zertifikat. Die für die Planung nützlichste Tatsache: **Über ARI koordinierte Verlängerungen sind von allen Rate Limits ausgenommen**; sind die Zertifikate einmal ausgestellt, ist ihre Verlängerung also keine Frage der Rate Limits. Da Let's Encrypt diese Zahlen ändern kann, zeigt das Tool das Datum des Snapshots und verlinkt die Quelle; prüfen Sie dort die aktuellen Werte, bevor Sie sich auf einen knappen Spielraum verlassen.

## Ergebnisse teilen

Am Ende der Zusammenfassung erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` die Hostnamen so, wie eingegeben, einen pro Zeile. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher werden die Namen beim Öffnen des Links nicht an den Server gesendet. Sie bleiben in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann sie lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Die Namen füllen das Feld wie beim Einfügen, und die Seite plant sie. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
