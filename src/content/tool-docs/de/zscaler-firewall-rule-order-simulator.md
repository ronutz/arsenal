## Was dieses Tool tut

Fügen Sie eine Regelliste für Firewall Filtering von Zscaler Internet Access (ZIA) in einer kleinen Lerngrammatik ein (eine Regel pro Zeile als `order | name | action | criteria`), dazu optional eine Zeile `flow:`, und der Simulator führt die dokumentierte Semantik der Richtlinie vor Ihren Augen aus: Die Regeln werden in aufsteigende numerische Reihenfolge sortiert, der Flow wird Regel für Regel verfolgt, wobei die Auswertung beim ersten Treffer stoppt, die Bewertung wird benannt (eine Regel oder, für alles, was durchfällt, die Default Firewall Filtering Rule), und eine paarweise Analyse verdeckter Regeln listet die Regeln auf, die nie greifen können, weil eine frühere Regel bereits alles abdeckt, worauf sie zutreffen könnten.

## Die Grammatik

Regeln: `10 | allow-web | allow | proto=tcp port=443 dest=203.0.113.0/24 src=any`, mit den Aktionen `allow`, `block` (stilles Verwerfen) oder `block-icmp` (Blockieren mit Benachrichtigung des Clients) und einem optionalen Token `disabled`. Weggelassene Kriterien bedeuten Any, und Any wird bei der Auswertung ignoriert, genau wie es der Hersteller dokumentiert. Optionale Zeilen: `flow: proto=tcp port=8443 dest=203.0.113.7 src=10.0.0.5` für den Ablauf und `default: allow|block`, um nachzubilden, dass ein Super-Admin die Aktion der Default-Regel ändert. Zeilen, die mit `#` beginnen, sind Kommentare.

## Was die Semantik abbildet

Alles, was simuliert wird, ist von Zscaler veröffentlichtes Verhalten: Die Auswertung steigt in der Rule Order auf und stoppt beim ersten Treffer; eine deaktivierte Regel wird nicht durchgesetzt, behält aber ihren Platz (der Dienst überspringt sie und macht weiter); die Default Firewall Filtering Rule lässt sich nicht löschen, hat immer die niedrigste Priorität, ihre Kriterien sind fest, und nur ihre Aktion lässt sich ändern. Ab Werk blockiert sie den gesamten Datenverkehr, deshalb ist der Standard des Simulators ohne Zeile `default:` block.

## Ehrliche Grenzen

Das Kriterienmodell ist hier eine bewusst gewählte Teilmenge zum Lernen: Protokoll, Ports, Quelle, Ziel. Echte Regeln für Firewall Filtering kennen zusätzlich Benutzer, Gruppen, Abteilungen, Standorte, Netzwerkdienste und Netzwerkanwendungen, Zielländer, Device-Trust-Stufen und Zeitfenster; die Semantik der Reihenfolge, die dieses Tool vermittelt, gilt für sie alle gleichermaßen. Die Analyse verdeckter Regeln ist nur paarweise: Eine Regel, die von mehreren früheren Regeln gemeinsam, aber von keiner allein abgedeckt wird, wird nicht markiert. Vordefinierte Systemregeln (Office 365, Datenverkehr der Zscaler-Dienste) und die Grenzen, die Admin Rank der Reihenfolge setzt, beschreibt der zugehörige Artikel; simuliert werden sie nicht.

## Ergebnisse teilen

Unter der Bewertungskarte (am Anfang der Auswertung, wenn es keine flow-Zeile gibt) erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` die Regeln und den Flow so, wie eingefügt. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Regelnamen und Adressen können Ihre Infrastruktur erkennbar machen (deshalb ergänzt das Popover einen Warnhinweis). Bevor ein Link angeboten wird, wird das Feld auf Zugangsdaten geprüft, die ein Standard definiert: ein privater Schlüssel im PEM-Format ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), Abschnitt 10), eine `Authorization`-Zeile ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), Abschnitt 11.6.2), eine `Cookie`-Zeile mit einem Wert ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), Abschnitt 4.2.1), ein JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), Abschnitt 1), ein Passwort in einer URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), Abschnitt 3.2.1), eine AWS-Zugriffsschlüssel-ID oder ein `ENC`-Wert von FortiOS; alle abgerufen am 01.11.2026. Die Grammatik hat für keinen davon einen Platz, aber Regelnamen und Kommentarzeilen sind Freitext. Enthält das Feld einen davon, gibt es keinen Link: Das Popover nennt die Zeile, und Sie ersetzen den Wert durch einen Platzhalter und wählen die Schaltfläche erneut. Ein Wert, dessen Name nur wie ein Secret aussieht, verhindert den Link nicht; das Popover nennt den ersten.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` folgt, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Das Feld füllt sich wie beim Einfügen, und die Seite simuliert die Regeln. Es wird nichts kontaktiert. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.

## Quellen

Gestützt auf drei Seiten von Zscaler Help, jede mit ihrem Abrufdatum im Manifest des Tools festgehalten: About Firewall Filtering (Auswertungsreihenfolge, die Default-Regel mit Deny-by-Default, die Menge der Aktionen), Configuring the Firewall Filtering Policy (Rule Order, die Konvention „Any wird ignoriert“, Admin Rank) und Editing the Default Firewall Filtering Rule (niedrigste Priorität, nicht löschbar, feste Kriterien, Änderung der Aktion durch Super-Admins).

Die Fragment-Regel hinter „Ergebnisse teilen“ steht in [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), Abschnitt 3.5 (abgerufen am 01.11.2026), und die Zugangsdaten, nach denen die Prüfung sucht, sind in RFC 7468, RFC 9110, RFC 6265 und RFC 7519 definiert (am selben Tag abgerufen).
