# Cron-Ausdrücke erklärt

Fügen Sie einen Crontab-Zeitplan mit fünf Feldern oder eines der `@`-Makros ein, und das Tool liest ihn zurück: jedes Feld in verständlicher Sprache erklärt, mit genau der Menge der Werte, auf die es zutrifft, die nächsten fünf Vorkommen und, schon während der Eingabe, die Fallstricke des Dialekts.

## Die fünf Felder

`minute hour day-of-month month day-of-week`, mit Bereichen `a-b`, Listen `a,b`, Schrittweiten `*/n` und `a-b/n` sowie Namen (`JAN`–`DEC`, `SUN`–`SAT`). Die `@`-Makros (`@yearly`, `@monthly`, `@weekly`, `@daily`, `@hourly` und verwandte) werden zu ihren Formen mit fünf Feldern erweitert; `@reboot` hat überhaupt keinen Zeitplan, und das Tool sagt das, statt einen zu erfinden.

## Die Fallstricke, auf die das Tool hinweist

Der wichtigste: Sind Tag des Monats **und** Wochentag beide eingeschränkt, führt cron den Befehl aus, wenn **einer von beiden** zutrifft: ein ODER, nicht das UND, das fast alle erwarten. Außerdem: `0` und `7` sind beide Sonntag; eine Schrittweite, die ihre Spanne nicht glatt teilt, läuft unregelmäßig um (`*/7` bei den Minuten endet bei 56 und springt dann auf 0); Namen in Bereichen mit Schrittweite sind über die Implementierungen hinweg seit jeher unzuverlässig; und eine Eingabe mit sechs Feldern wird als Sekunden-Dialekt von Quartz erkannt und als solcher benannt.

## Zu den vorausberechneten Zeiten

cron wertet Zeitpläne in der **lokalen** Zeit des Daemons aus. Die Vorkommen hier werden auf der Uhrzeit des aktuellen Moments in Ihrem Browser berechnet, ohne Zeitzonendatenbank, mit derselben deterministischen Engine, die die Referenzvektoren (Golden Vectors) gegen einen festen Referenzzeitpunkt absichern.

Alles läuft lokal; der Zeitplan verlässt die Seite nie. Grundlage sind `crontab(5)` und die POSIX-Spezifikation.

## Ergebnisse teilen

Über den Feldbereichen erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen und sobald die Seite den Zeitplan gelesen hat. Der Link enthält nach dem `#` den Zeitplan so, wie eingegeben. Die Seite liest nur einen Zeitplan, also fünf Zeitfelder oder ein @Makro: Eine Crontab-Zeile mit ihrem Befehl wird abgelehnt (die Anzahl der Felder stimmt nicht), daher gelangt ein Befehl und jedes darin geschriebene Passwort oder Token nie in einen Link. Die nächsten Ausführungen werden aus der Uhr der Person berechnet, die den Link öffnet. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` folgt, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Öffnen eines Links.** Der Zeitplan füllt das Feld wie beim Einfügen, und die Seite erklärt ihn. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
