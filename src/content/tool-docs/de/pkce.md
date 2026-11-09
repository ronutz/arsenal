## Was das Tool tut

Das Tool arbeitet mit den beiden Werten, um die sich die PKCE-Erweiterung von OAuth 2.0 dreht. Es erzeugt einen zufälligen `code_verifier` und leitet mit der Methode S256 dessen `code_challenge` ab, oder es nimmt einen eingefügten `code_verifier`, prüft ihn gegen die Regeln von RFC 7636 zu Länge und Zeichen und leitet dieselbe Challenge ab, die Ihr Autorisierungsserver erwartet. Die Ableitung ist genau der Schritt aus SHA-256 und Base64url, den der Standard definiert, und alles läuft in Ihrem Browser.

## Wovor PKCE schützt

Der Authorization Code Flow von OAuth 2.0 schickt einen kurzlebigen Code über den Browser des Benutzers zurück, und bei einer mobilen App oder einer Single-Page-App kann eine andere Anwendung diese Weiterleitung abfangen. PKCE, „Proof Key for Code Exchange“, schließt diese Lücke. Zu Beginn des Flows erfindet der Client ein Secret, den `code_verifier`, und sendet mit der ersten Anfrage nur eine umgewandelte Fassung davon, die `code_challenge`. Wenn er den Code später gegen Token eintauscht, legt er den ursprünglichen `code_verifier` vor; der Server leitet die Challenge erneut ab und prüft, ob sie übereinstimmt. Ein Angreifer, der den Code stiehlt, kann ihn nicht verwenden, weil er den Verifier nie gesehen hat.

## Verifier und Challenge

- Der **code_verifier** ist eine Zufallszeichenfolge mit hoher Entropie aus 43 bis 128 Zeichen, gezogen aus der Menge der nicht reservierten Zeichen `A-Z a-z 0-9 - . _ ~`.
- Die **code_challenge** wird daraus abgeleitet. Die empfohlene Methode `S256` ist `BASE64URL(SHA256(ASCII(verifier)))`, die Base64url-Kodierung des SHA-256-Hashwerts des Verifiers ohne Padding. Die Methode `plain`, bei der die Challenge einfach gleich dem Verifier ist, gibt es für eingeschränkte Clients; von ihr wird aber abgeraten, weil sie keinen Schutz bietet, wenn die Challenge mitgelesen wird.

## Warum das heute wichtig ist

PKCE begann als Abhilfe für mobile Apps, ist heute aber die Grundlage. Die aktuelle Best Current Practice zur Sicherheit von OAuth, RFC 9700, verlangt PKCE für jeden Client, der den Authorization Code Flow verwendet, nicht nur für öffentliche. Wenn Sie einen OAuth-Client entwickeln oder debuggen, können Sie hier einen Verifier erzeugen und seine S256-Challenge bestätigen und so Ihre Implementierung direkt mit der Spezifikation abgleichen.

## Verwendung

Erzeugen Sie einen neuen `code_verifier` und lesen Sie seine `S256`-`code_challenge` ab, oder fügen Sie einen vorhandenen Verifier ein, um Länge und Zeichen zu prüfen und die passende Challenge abzuleiten. Weil S256 ein Einweg-Hash ist, verrät die Challenge nichts über den Verifier.

## Ergebnisse teilen

Unter den Badges zur Gültigkeit bietet **Ergebnisse teilen** einen Link auf diese Seite nur für einen einzigen Verifier an: das Beispiel, das [RFC 7636](https://www.rfc-editor.org/rfc/rfc7636) in Anhang B abdruckt (`dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk`, der Wert hinter „Beispiel“); der Link enthält es nach dem `#`. Für jeden anderen Verifier sagt das Popover, dass es keinen Link gibt, und warum.

Ein code_verifier ist das Secret des Flows. RFC 7636 (abgerufen am 01.11.2026) führt ihn als „cryptographically random key“ ein, also als kryptografisch zufälligen Schlüssel, der einen abgefangenen Autorisierungscode wertlos macht, „since the attacker would not know this one-time key“ (Abschnitt 1), und stützt die Sicherheit des Protokolls darauf, dass der Verifier nicht „learned or guessed by the attacker“ wird (Abschnitt 7.1), also vom Angreifer weder erfahren noch erraten. Nichts Abgeleitetes kann ihn ersetzen, denn die Seite berechnet alles aus dem Verifier selbst: Die Challenge ohne den Verifier ließe nichts zu zeigen übrig. Ein Link enthält den Verifier daher nur, wenn er der Testwert des Standards selbst ist.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird der Wert beim Öffnen des Links nicht an den Server gesendet. Er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann ihn lesen.

- **Öffnen eines Links.** Das Beispiel füllt das Feld, und die Seite leitet beide Challenges ab, mit Web Crypto im Browser. Ein Link mit einem anderen Wert wird ignoriert und füllt das Feld nie. In beiden Fällen verschwindet der Wert sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
