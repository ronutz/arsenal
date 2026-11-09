## Was das Tool tut

Erzeugen Sie UUIDs, oder fügen Sie eine vorhandene ein, um sie zu prüfen. Die Erzeugung liefert entweder eine zufällige UUID der Version 4 oder eine zeitlich geordnete UUID der Version 7 und nutzt dafür die sichere Zufallsquelle des Browsers (`crypto.getRandomValues`). Die Prüfung nimmt jede UUID an und meldet, ob sie gültig ist, welche Version und Variante sie hat und, bei einem Wert der Version 7, den darin eingebetteten Erstellungszeitpunkt. Alles läuft in Ihrem Browser.

## Was eine UUID ist

Eine UUID ist eine 128-Bit-Kennung, geschrieben als 32 Hexadezimalziffern in der vertrauten Gruppierung 8-4-4-4-12, zum Beispiel `f47ac10b-58cc-4372-a567-0e02b2c3d479`. Sie soll eindeutig sein, ohne dass eine zentrale Stelle Nummern vergibt: Jede Partei kann eine erzeugen und sich darauf verlassen, dass sie mit keiner anderen kollidiert. Zwei feste Felder kodieren ihren Aufbau: ein Versions-Nibble, das angibt, wie die UUID entstanden ist, und ein Variantenfeld, das sie als UUID nach RFC 4122/9562 kennzeichnet.

## Version 4 und Version 7

- **Version 4** ist fast vollständig zufällig: 122 ihrer 128 Bit stammen aus der Zufallsquelle, die übrigen 6 sind die festen Versions- und Variantenbits. Sie ist der richtige Standard, wenn Sie nur eine unvorhersehbare, kollisionsresistente ID brauchen und die Reihenfolge keine Rolle spielt.
- **Version 7** ist zeitlich geordnet. Ihre höchstwertigen 48 Bit sind ein Unix-Zeitstempel in Millisekunden, gefolgt von 74 Zufallsbits. Weil der Zeitstempel vorne steht, sortieren sich UUIDs der Version 7 in der Reihenfolge ihrer Erzeugung, und das macht sie als Primärschlüssel in Datenbanken weit besser geeignet als Version 4: Sequenzielle Einfügungen halten einen Index kompakt, statt die Schreibvorgänge über ihn zu verstreuen.

Version 7 ist neu in RFC 9562, der Spezifikation von 2024, die den ursprünglichen RFC 4122 aktualisiert und abgelöst hat.

## Eine UUID prüfen

Fügen Sie eine beliebige UUID ein, und das Tool parst sie, ohne etwas zu erzeugen: Es bestätigt das Format, liest Version und Variante an ihren festen Positionen und dekodiert bei einer UUID der Version 7 den eingebetteten 48-Bit-Zeitstempel zurück in ein Datum. Dieser letzte Teil ist der nützliche Kniff: Eine ID der Version 7 enthält unauffällig den Moment ihrer Erzeugung, sodass Sie die Erstellungszeit eines Datensatzes direkt an seinem Schlüssel ablesen können.

## Verwendung

Erzeugen Sie mit einem Klick eine UUID v4 oder v7, oder fügen Sie eine vorhandene UUID ein, um Version, Variante und, bei v7, den Zeitstempel zu lesen. Die Erzeugung nutzt die sichere Zufallsquelle, daher sind v4-Werte unvorhersehbar; die Prüfung ist reines Parsen und zeigt nur, was die UUID selbst kodiert.

## Ergebnisse teilen

Unter der Auswertung von „UUID prüfen“ erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` den Wert aus dem Prüffeld. Die erzeugten UUIDs sind nicht enthalten: Jede stammt aus der Zufallsquelle Ihres Browsers, und wer den Link öffnet, wählt selbst „Erzeugen“. Eine UUID verrät nichts über Sie. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` steht, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Öffnen eines Links.** Der Wert füllt das Prüffeld wie beim Einfügen, und die Seite liest ihn (ein Wert, der keine UUID ist, zeigt „Keine gültige UUID“, wie bei der Eingabe). Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
