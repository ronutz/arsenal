## Was das Tool tut

Fügen Sie eine rohe HTTP-Antwort ein, und das Tool benotet ihre Sicherheitsaufstellung: die Sicherheits-Header, die sie setzt (und die, die ihr fehlen), die Flags ihrer Cookies und ihre Cross-Origin-Richtlinie. Jeder Befund wird gegen den zugehörigen Standard und die Empfehlungen von OWASP Secure Headers geprüft, und das Ergebnis ist eine benotete Aufschlüsselung, nach der Sie handeln können. Das Tool läuft vollständig in Ihrem Browser.

## Die geprüften Header

Moderne Browsersicherheit ist größtenteils Opt-in über Antwort-Header, und das Tool betrachtet die, auf die es ankommt:

- **Strict-Transport-Security** (HSTS, RFC 6797) weist den Browser an, nur HTTPS zu verwenden; das Tool liest `max-age` und `includeSubDomains`.
- **Content-Security-Policy** (CSP Level 3) schränkt ein, woher Skripte, Styles und Frames kommen dürfen, und ist der stärkste Schutz vor Cross-Site-Scripting; das Tool vermerkt abschwächende Schlüsselwörter wie `unsafe-inline`.
- **X-Content-Type-Options: nosniff** hindert den Browser daran, Inhaltstypen zu erraten, und **X-Frame-Options** (oder `frame-ancestors` in der CSP) schützt vor Clickjacking.
- **Referrer-Policy** und **Permissions-Policy** steuern, was die Seite im Header Referer preisgibt und welche Browserfunktionen sie nutzen darf.
- Die **Cross-Origin-Richtlinien** (COOP, COEP, CORP), die die Isolation zwischen Ursprüngen regeln.

## Cookies und ihre Flags

Die Sicherheit eines Cookies steckt in seinen Attributen, und das Tool prüft sie gegen die aktuelle Cookie-Spezifikation (RFC 6265bis): **Secure** (nur über HTTPS gesendet), **HttpOnly** (vor JavaScript verborgen, was Diebstahl per Cross-Site-Scripting erschwert) und **SameSite** (begrenzt das Senden über Websites hinweg und mildert CSRF). Es erkennt außerdem die Namenspräfixe `__Host-` und `__Secure-`, die einige dieser Eigenschaften über den Namen erzwingen.

## Die Note lesen

Der Sinn der Note ist die Priorisierung: Sie sagt Ihnen nicht nur, was vorhanden ist, sondern auch, was fehlt oder schwach ist und warum jeder Header zählt, sodass Sie die Lücken mit der größten Wirkung zuerst schließen können. Die Prüfungen folgen dem von OWASP empfohlenen Satz und den zugrunde liegenden Spezifikationen statt der Meinung eines einzelnen Tools.

## Verwendung

Fügen Sie eine HTTP-Antwort samt Headern ein und lesen Sie die benotete Analyse von Headern, Cookies und Cross-Origin-Richtlinie. Die Analyse ist deterministisch und lokal, daher können Sie sie gefahrlos auf eine Antwort anwenden, die Sie von einer beliebigen Website mitgeschnitten haben.

## Ergebnisse teilen

Unter der Note erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` eine Kopie der Antwort; die Antwort so, wie eingefügt, enthält er nur, wenn Sie den unten beschriebenen Schalter aktivieren. Eine eingefügte Antwort enthält Cookies, deren Werte üblicherweise Sitzungskennungen sind ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), Abschnitt 8.4, abgerufen am 01.11.2026), und Header, die diese Seite nie liest, etwa einen `Location`-Header mit einem Autorisierungscode in seiner Query ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), Abschnitt 4.1.2, abgerufen am 01.11.2026). Die Seite bewertet die Sicherheits-Header, die sie kennt, und von jedem Cookie Namen und Attribute, nie seinen Wert. Die Kopie behält daher die Statuszeile und jede Header-Zeile mit ihrem Namen, die Werte der bewerteten Header so, wie geparst, und jedes `Set-Cookie` mit Namen und Attributen; der Wert jedes Cookies und der Wert jedes anderen Headers wird zu `[redacted]`. Bevor der Link angeboten wird, wird die Kopie erneut bewertet und muss denselben Bericht ergeben, und sie durchläuft die Prüfung der Website auf Zugangsdaten, die noch in einem bewerteten Wert stehen. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert. Das Popover nennt außerdem, wie viele Werte ersetzt wurden. Wurden welche ersetzt, können Sie sie über einen Schalter unter seiner ersten Zeile, **Die ersetzten Werte in den Link aufnehmen**, doch mitsenden: Er ist bei jedem Öffnen des Popovers ausgeschaltet; ist er aktiviert, enthält der Link die Antwort so, wie eingefügt, mit allen Werten, und das Popover sagt das und warnt, dass Cookie-Werte oft aktive Sitzungen sind und andere Header Token enthalten können; der Link ist also für jemanden gedacht, dem Sie die Antwort auch zeigen würden. Der Schalter wird nicht angeboten, wenn Zugangsdaten in einem bewerteten Wert den Link bereits verhindert haben.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` folgt, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Die Kopie füllt das Feld wie beim Einfügen, und die Seite bewertet sie. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
