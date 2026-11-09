## Was das Tool tut

Dies ist ein Lehr-Tool. Es führt in Ihrem Browser eine begrenzte Brute-Force-Suche aus, die eine Eingabe zu finden versucht, deren Hash einem vorgegebenen Hashwert entspricht. Bei einer schwachen Eingabe, etwa einer kurzen PIN oder wenigen Kleinbuchstaben, hat sie in Sekunden Erfolg; bei allem mit echter Entropie schöpft sie ihren gedeckelten Suchraum aus und hält ohne Antwort an. Genau um diesen Kontrast geht es: Er zeigt aus erster Hand, warum ein schneller Hash ohne Salt ein Passwort schlecht schützt und warum ein Secret mit hoher Entropie selbst einer direkten Suche standhält.

## Was ein Urbild ist und wie die Suche funktioniert

Ein Hash ist eine Einwegfunktion, daher gibt es keine Formel, die einen Hashwert in seine Eingabe zurückverwandelt. Der einzige allgemeine Weg, einen Hash umzukehren, ist Raten: einen Kandidaten wählen, ihn hashen und prüfen, ob der Hashwert übereinstimmt. Genau das tut die Urbildsuche. Sie zählt Kandidaten über ein Alphabet und eine Länge Ihrer Wahl auf (Ziffern, Kleinbuchstaben usw.) und hasht jeden lokal, bis sie einen Treffer findet oder ihr die Kandidaten ausgehen. Sie verwendet kein Wörterbuch, keine Wortliste und keine vorberechnete Tabelle; sie demonstriert also ausschließlich die erschöpfende Suche und ist kein Baukasten zum Knacken von Passwörtern.

## Warum schwache Eingaben fallen und starke nicht

Die Zahl der Kandidaten ist die Größe des Alphabets hoch der Länge. Eine 4-stellige PIN ergibt nur 10^4, also 10.000 Möglichkeiten, trivial zu durchsuchen; sechs Kleinbuchstaben ergeben 26^6, etwa 300 Millionen, für einen Computer immer noch wenig. Doch jedes weitere Zeichen vervielfacht den Raum, und ein wirklich zufälliges Secret treibt die Zahl weit über das hinaus, was eine begrenzte lokale Suche abdecken kann. Genau deshalb eignen sich schnelle Hashes wie MD5 oder SHA-256, die sich milliardenfach pro Sekunde berechnen lassen, nicht für Passwörter, und deshalb fügen echte Systeme einen Salt hinzu und verwenden eine absichtlich langsame Schlüsselableitungsfunktion, wie es die Empfehlungen von OWASP zur Passwortspeicherung (Password Storage) und NIST SP 800-63B vorsehen.

## Was das Tool nicht kann

Weil der Suchraum gedeckelt ist und es keine Wortliste gibt, findet das Tool nur Eingaben, von denen ohnehin feststand, dass sie schwach sind. Einen Hash mit Salt kann es nicht angreifen, ebenso wenig einen Hash aus einer langsamen Schlüsselableitungsfunktion wie bcrypt, scrypt, Argon2 oder PBKDF2, die gerade dafür gebaut sind, jeden Rateversuch teuer zu machen.

Eine Liste geleakter Passwörter hat es ebenfalls nicht. Um zu prüfen, ob ein bestimmtes Passwort schon in einem Datenleck aufgetaucht ist, ohne es zu senden, verwenden Sie die [Prüfung mit Pwned Passwords](/dev/out/pwned-passwords) im roten Raum: Sie sendet nur die ersten fünf Zeichen des SHA-1-Hashes des Passworts, und nur, wenn Sie „Abfragen“ wählen oder Enter drücken.

## Verwendung

Geben Sie einen Ziel-Hashwert ein oder hashen Sie eine Beispieleingabe, um einen zu erzeugen, wählen Sie das Alphabet und die maximale Länge für die Suche und sehen Sie der Suche zu. Probieren Sie eine kurze numerische Eingabe, um einen schnellen Erfolg zu sehen; verlängern Sie dann die Eingabe oder erweitern Sie das Alphabet, um zu beobachten, wie der Suchraum der Suche davonläuft.

## Ergebnisse teilen

Unter der Suche und einem etwaigen Ergebnis erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` die Suche so, wie Sie sie eingerichtet haben: den Hash, das Alphabet und die maximale Länge. Was eine Suche gefunden hat, enthält er nie, und das Öffnen startet nie eine Suche. Das Popover nennt zuerst, was der Link enthält, dann einen eigenen Warnhinweis, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Der Warnhinweis zählt hier mehr als irgendwo sonst: Die Seite ist dafür da, zu zeigen, dass ein schneller Hash ohne Salt über eine schwache Eingabe die Eingabe selbst ist. Wer den Link öffnet, kann „Suche starten“ wählen und erhält dieselbe Antwort wie Sie. Senden Sie daher Hashes von Testwerten, nie von einem echten Passwort.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher werden die Werte beim Öffnen des Links nicht an den Server gesendet. Sie bleiben in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann sie lesen.

- **Öffnen eines Links.** Die drei Felder werden gefüllt, eine laufende Suche hält an, und ein Hinweis bittet Sie, „Suche starten“ zu wählen: Die Suche läuft nur, wenn Sie es wollen, und zwar in Ihrem Browser. Ein Hash, dessen Algorithmus die Seite nicht an seiner Länge erkennt, ein Alphabet, das die Seite nicht anbietet, oder eine Länge außerhalb von 1 bis zur Obergrenze dieses Alphabets führen dazu, dass der ganze Link ignoriert wird. In beiden Fällen verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
