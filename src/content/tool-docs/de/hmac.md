## Was das Tool tut

Das Tool berechnet einen HMAC, einen Hash mit Schlüssel, über eine Nachricht mit einem geheimen Schlüssel und zeigt das Ergebnis hexadezimal und in Base64. Als zugrunde liegenden Hash wählen Sie SHA-256, SHA-384 oder SHA-512. Die Berechnung nutzt das native Web Crypto des Browsers, und Ihr Schlüssel verlässt Ihren Browser nie. Es ist dieselbe Konstruktion über denselben Codepfad, mit dem die JWT-Prüfung eine HS256-Signatur prüft; beide stimmen also schon vom Aufbau her überein.

## Wofür HMAC gedacht ist

Ein einfacher Hash belegt, dass sich Daten nicht verändert haben, doch jeder kann ihn neu berechnen; er kann also nicht belegen, wer ihn erzeugt hat. HMAC fügt dem Hash einen geheimen Schlüssel hinzu und macht ihn damit zu einem Message Authentication Code: einem Wert, der belegt, dass die Nachricht unversehrt ist und von jemandem stammt, der den Schlüssel besitzt. Der Absender berechnet den HMAC und sendet ihn mit der Nachricht; der Empfänger, der den Schlüssel teilt, berechnet ihn neu und prüft, ob beide übereinstimmen. HMAC ist in RFC 2104 und FIPS 198-1 definiert, mit Testvektoren in RFC 4231.

## Von Natur aus symmetrisch

HMAC verwendet ein einziges Shared Secret, um den Code zu erzeugen und um ihn zu prüfen. Das macht es schnell und einfach, bedeutet aber auch: Wer einen HMAC prüfen kann, kann auch einen fälschen, denn beide Operationen verwenden denselben Schlüssel. HMAC ist das richtige Werkzeug, wenn dieselbe Partei, oder zwei Parteien, die bereits ein vertrauenswürdiges Secret teilen, die Codes sowohl erzeugen als auch prüfen. Müssen unabhängige Parteien prüfen können, ohne fälschen zu können, passt eine asymmetrische Signatur besser; das ist dieselbe Abwägung, die bei JWTs HS256 von RS256 trennt.

## Wie HMAC aufgebaut ist

HMAC ist nicht einfach der Hash aus Schlüssel und angehängter Nachricht, der für Length-Extension-Angriffe anfällig wäre. Es ist eine verschachtelte Konstruktion: Die Nachricht wird zusammen mit einer abgeleiteten Form des Schlüssels gehasht, und dieses Ergebnis wird mit einer zweiten abgeleiteten Form erneut gehasht. Diese Struktur verschafft HMAC seinen Sicherheitsbeweis, und deshalb sollten Sie HMAC verwenden, statt einen eigenen Hash mit Schlüssel zu erfinden.

## Verwendung

Geben Sie eine Nachricht und einen geheimen Schlüssel ein, wählen Sie den Hash und lesen Sie den HMAC als Hex oder Base64. Geben Sie dieselbe Nachricht und denselben Schlüssel in zwei Systeme ein, stimmen die Codes überein; ändern Sie die Nachricht oder den Schlüssel um ein Zeichen, ändert sich der Code vollständig.

## Ergebnisse teilen

Unter dem MAC erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` die Nachricht so, wie eingegeben, und den Algorithmus, nie aber den Schlüssel. Wer den Link liest, gibt den Schlüssel ein, den Sie ihm auf anderem Weg mitteilen, und erhält denselben MAC; auch der MAC selbst ist nicht enthalten, weil er neben der Nachricht es jedem erlauben würde, Rateversuche für einen schwachen Schlüssel offline zu testen. Eine Ausnahme: Der Schlüssel `Jefe` geht mit, weil er der veröffentlichte Testschlüssel aus [RFC 4231](https://www.rfc-editor.org/rfc/rfc4231) ist (Testfall 2, abgerufen am 01.11.2026), den das „Beispiel“ der Seite verwendet. Das Popover nennt zuerst, was der Link enthält, dann einen eigenen Warnhinweis (die Nachricht bleibt so, wie eingegeben, lesen Sie sie also, bevor Sie den Link senden), und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Ein HMAC-Schlüssel ist ein Schlüssel: [RFC 2104](https://www.rfc-editor.org/rfc/rfc2104) (Abschnitt 3, abgerufen am 01.11.2026) verlangt Schlüssel, die „chosen at random“ und „periodically refreshed“ sind, also zufällig gewählt und regelmäßig erneuert, eine Praxis, die „limits the damage of an exposed key“; wer den Schlüssel besitzt, kann für jede Nachricht einen gültigen MAC berechnen.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher werden die Werte beim Öffnen des Links nicht an den Server gesendet. Sie bleiben in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann sie lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Nachricht und Algorithmus füllen die Seite. Das Schlüsselfeld übernimmt den veröffentlichten Testschlüssel, wenn er mitkommt, und behält sonst, was die lesende Person eingegeben hat; auf einer frisch geladenen Seite ist es leer, und ein Hinweis erklärt, dass der Schlüssel nie mitgesendet wird. Der MAC wird mit Web Crypto im Browser berechnet, sobald beide Felder gefüllt sind. Ein Algorithmus, den die Seite nicht anbietet, oder ein Schlüssel, der nicht der veröffentlichte ist, führt dazu, dass der ganze Link ignoriert wird. In beiden Fällen verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
