# Meilensteine der digitalen Transformation

Dreißig Meilensteine in sieben Bereichen des Alltags, von den ersten Paketen im ARPANET bis zu Prognosen, die noch nicht eingetreten sind. Worauf es bei dem Tool ankommt, ist nicht die Zeitleiste, sondern die **Sicherheitsstufe**, die jeder Zeile beigefügt ist.

## Warum es die Stufen gibt

Ein Tracker mit einem Abschnitt „was als Nächstes kommt“ ist eine Fläche für Prognosen, und die Regel dieser Website lautet, dass Tools rechnen statt raten. Die Lösung: Eine Prognose darf nie wie eine Tatsache aussehen.

- **Umgesetzt**: Es ist geschehen, datiert und überprüfbar.
- **In Kraft**: eine rechtliche Pflicht, die heute bindet.
- **Geplant**: ein festes künftiges Datum, gesetzlich oder durch einen veröffentlichten Zeitplan bestimmt. Hohe Sicherheit beim Datum, keine Aussage über die Folgen.
- **Geplant, aber in Bewegung**: ein Datum, das tatsächlich im Gesetz steht *und* gerade geändert wird. Das Tool zeigt das ursprüngliche Datum, das vorgeschlagene Datum und den Umstand, dass die Änderung noch nicht Gesetz ist.
- **Prognose**: die Vorhersage von jemandem, immer mit dem Namen dessen, der sie aufstellt, und mit einem Gegensignal, wo es eines gibt.

Diese vierte Stufe zeigt sonst niemand. Die Hochrisiko-Pflichten der KI-Verordnung der EU sind das durchgerechnete Beispiel: geplant für den 2. August 2026, am 7. Mai 2026 vorläufig auf den 2. Dezember 2027 verschoben, aber noch nicht Gesetz; für die Planung gilt daher weiterhin das ursprüngliche Datum.

## Was jede Zeile festhält

Jeder Meilenstein beantwortet zwei Fragen: Was hat sich für einen gewöhnlichen Menschen geändert, und was wurde möglich, das vorher nicht möglich war? Der Filter nach Bereich zeigt, wie unterschiedlich die Transformation beim Geld, bei der Arbeit, in der Gesundheit und beim Staat ankam.

## Ergebnisse teilen

Unter der Zählzeile erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` die aktiven Filter mit ihrer ID: `domains` und `certainties`, in der Reihenfolge der Seite (eine Filterzeile ohne aktiven Filter enthält nichts, was wie auf der Seite „alle“ bedeutet). Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Ist kein Filter aktiv, entspricht die Ansicht der Seite, wie sie sich öffnet, und darauf verweist bereits die Schaltfläche „Teilen“ der Seite; daher wartet die Schaltfläche. Die Meilensteine selbst reisen nie mit: Die Seite, die den Link öffnet, liest denselben Datensatz, daher bleibt der Link kurz, und eine korrigierte Zeile erreicht auch alte Links.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird die Ansicht beim Öffnen des Links nicht an den Server gesendet. Sie bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann sie lesen.

- **Öffnen eines Links.** Die Chips werden gesetzt, und die Zeitleiste wird neu gezeichnet, wie beim Antippen. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.

## Datenschutz

Die Filter werden lokal ausgewertet. Es wird nichts übertragen, und der Datensatz wird mit der Seite ausgeliefert.
