## Was das Tool tut

Fügen Sie ein JSON Web Key Set ein, und das Tool schlüsselt es Schlüssel für Schlüssel auf: Für jeden Schlüssel liest es den Typ, die Schlüssel-ID, die vorgesehene Verwendung und den Algorithmus sowie die typspezifischen Parameter, und es markiert jeden Schlüssel, der privates Material enthält. Fügen Sie zusätzlich ein JWT ein, ordnet es das Token über den Vergleich der Schlüssel-IDs dem Schlüssel zu, der es prüfen soll. Nichts verlässt Ihren Browser.

## Was ein JWKS ist

Ein JSON Web Key Set (JWKS) ist das JSON-Dokument, das ein Identity Provider veröffentlicht, meist unter `/.well-known/jwks.json`, damit jeder die von ihm signierten Token ohne Shared Secret prüfen kann. Es ist einfach eine Liste von Schlüsseln:

    { "keys": [ {JWK}, {JWK}, ... ] }

Jeder Eintrag ist ein JSON Web Key (JWK), der einen Schlüssel beschreibt: seinen Typ (`kty`, etwa RSA, EC oder OKP), eine optionale Schlüssel-ID (`kid`), wofür er gedacht ist (`use`, typischerweise `sig` zum Signieren oder `enc` zum Verschlüsseln), den zugehörigen Algorithmus (`alg`) und die Parameter, die für diesen Schlüsseltyp spezifisch sind.

## Öffentliches und privates Material

Diese Unterscheidung ist der Sicherheitskern des Tools. Ein JWKS, das zur Prüfung veröffentlicht wird, sollte nur öffentliche Schlüssel enthalten. Jeder Schlüsseltyp hat öffentliche und private Parameter: Ein RSA-Schlüssel veröffentlicht Modulus und Exponent (`n`, `e`) und hält seinen privaten Exponenten (`d`) geheim; ein Schlüssel auf einer elliptischen Kurve veröffentlicht seine Koordinaten (`x`, `y`) und hält seinen privaten Skalar (`d`) geheim; ein symmetrischer Schlüssel (`oct`) besteht nur aus dem Secret (`k`). Enthält ein Schlüssel im Set eines der privaten Felder, ist privates Schlüsselmaterial offengelegt worden, ein schwerer Fehler; das Tool markiert ihn daher ausdrücklich.

## Ein Token seinem Schlüssel zuordnen

Ein signiertes JWT nennt in seinem Header meist die Schlüssel-ID (`kid`) des Schlüssels, der es signiert hat. Ein Prüfer sucht im JWKS den Schlüssel mit dieser `kid` und verwendet ihn. Das Tool tut dasselbe: Mit einem JWT und einem Set findet es den Schlüssel, dessen `kid` zu der des Tokens passt; genau diese Suche führt ein echter Prüfer durch, bevor er die Signatur prüft. Die Schlüsselparameter folgen RFC 7517 und RFC 7518, mit dem Schlüsseltyp OKP für Schlüssel auf Edwards-Kurven (etwa Ed25519), definiert in RFC 8037.

## Verwendung

Fügen Sie ein JWKS ein, um jeden Schlüssel zu untersuchen und offengelegtes privates Material zu finden, und fügen Sie optional ein JWT ein, um zu sehen, welcher Schlüssel im Set es prüfen soll.

## Ergebnisse teilen

Unter der Zusammenfassung der Schlüssel (im Modus „JWT zuordnen“ unter der Zuordnung) erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` eine Kopie des Schlüssel-Sets: jeder private Wert durch `[redacted]` ersetzt, jedes andere Zeichen so, wie eingefügt. Das Popover nennt zuerst, was der Link enthält und wie viele Werte ersetzt wurden, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Ein eingefügtes Schlüssel-Set kann privates Schlüsselmaterial enthalten, und das darf ein Link nie enthalten. [RFC 7518](https://www.rfc-editor.org/rfc/rfc7518) (abgerufen am 01.11.2026) definiert für einen privaten RSA-Schlüssel die Einträge `d`, `p`, `q`, `dp`, `dq`, `qi` und `oth` (Abschnitt 6.3.2, mit `r`, `d` und `t` jedes `oth`-Eintrags), für einen privaten Schlüssel auf einer elliptischen Kurve `d` (Abschnitt 6.2.2) und für einen symmetrischen Schlüssel `k` (Abschnitt 6.4.1); [RFC 8037](https://www.rfc-editor.org/rfc/rfc8037) (Abschnitt 2, abgerufen am 01.11.2026) gibt einem OKP-Schlüssel ein privates `d`. Die Kopie behält die Namen der Einträge und ersetzt nur ihre Werte, sodass die Seite, die den Link öffnet, dasselbe private Material markiert und jeden Schlüssel genau so erklärt wie bei Ihnen: Diese Seite zeigt diese Werte nie an. Die Prüfungen der Website legen das unter anderem an den privaten Schlüsseln aus RFC 7517, Anhang A.2 und A.3, und RFC 8037, Anhang A.1 fest.

Im Modus „JWT zuordnen“ enthält der Link außerdem den Header des JWT und sonst nichts vom Token: Die Seite liest nur den Header, und ein JWT dient, solange es gültig ist, als Bearer-Zugangsdaten ([RFC 6750](https://www.rfc-editor.org/rfc/rfc6750), Abschnitt 1.2, abgerufen am 01.11.2026). Ist das erste Segment im JWT-Feld kein JSON-Header, enthält der Link nichts davon, sodass nie ein opakes Access Token an seine Stelle tritt; enthält der Eintrag `jwk` eines Headers privates Schlüsselmaterial, gibt es keinen Link.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher werden die Werte beim Öffnen des Links nicht an den Server gesendet. Sie bleiben in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann sie lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Die Kopie füllt das Feld für das Schlüssel-Set, der Modus „JWT zuordnen“ öffnet sich, wenn der Link das vorsieht, und der Header füllt das JWT-Feld; die Seite erklärt und ordnet zu wie beim Einfügen und ruft nie eine `jwks_uri` ab. Ein Schlüssel-Set, das sich nicht parsen lässt oder noch einen privaten Wert enthält, ein Modus, den die Seite nicht anbietet, oder ein Header, der mehr als ein Header ist, führt dazu, dass der ganze Link ignoriert wird. In beiden Fällen verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
