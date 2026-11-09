## Was das Tool tut

Erzeugen und prüfen Sie die Einmalcodes der Zwei-Faktor-Authentifizierung: zeitbasierte Passwörter (TOTP, RFC 6238), also die sechsstelligen Codes, die eine Authenticator-App anzeigt, und zählerbasierte Passwörter (HOTP, RFC 4226), also die Codes, die ein Hardware-Token erzeugt. Sie können die Hashfunktion (SHA-1, SHA-256 oder SHA-512), die Anzahl der Stellen und die Schrittweite wählen. Die Berechnung nutzt das native Web Crypto des Browsers, und Ihr Shared Secret verlässt den Browser nie.

## Eine Konstruktion, zwei Moving Factors

HOTP und TOTP sind im Kern derselbe Algorithmus. Beide nehmen ein Shared Secret und einen Moving Factor, berechnen einen HMAC des Moving Factors mit dem Secret als Schlüssel und wenden dann die in RFC 4226 definierte dynamische Kürzung („dynamic truncation“) an, um diesen MAC auf einen kurzen dezimalen Code zu reduzieren. Der einzige Unterschied ist, woher der Moving Factor stammt:

- **HOTP** verwendet einen ausdrücklichen Ereigniszähler, der bei jeder Verwendung eines Codes um eins steigt. Token und Server müssen bei diesem Zähler im Gleichschritt bleiben.
- **TOTP** verwendet die Uhr: Der Moving Factor ist die Anzahl der Zeitschritte seit einer Epoche, `floor((current time - T0) / step)`, standardmäßig mit `T0` bei 0 und einer Schrittweite von 30 Sekunden. Anders gesagt ist TOTP einfach HOTP mit dem aktuellen Zeitabschnitt als Zähler, und deshalb ändert sich ein TOTP-Code alle 30 Sekunden.

## Das Shared Secret

Das Secret ist der Seed, den beide Seiten besitzen. Es wird meist als Base32-String ausgetauscht, und genau das kodiert eine `otpauth://`-URI oder ein QR-Code zur Einrichtung; daher dekodiert das Tool Base32, um die Bytes des Schlüssels zurückzugewinnen. Der Standard-Hash ist SHA-1, den die meisten Authenticator-Apps und Token für Einmalpasswörter noch verwenden; SHA-256 und SHA-512 stehen zur Verfügung, wo beide Seiten sie unterstützen.

## Prüfung und Abweichung der Uhr

Weil die Uhr eines Geräts und die eines Servers nie perfekt übereinstimmen, akzeptiert eine TOTP-Prüfung normalerweise Codes aus einem kleinen Fenster benachbarter Zeitschritte statt nur aus dem aktuellen und tauscht so ein wenig Strenge gegen Zuverlässigkeit. HOTP hat das entsprechende Problem beim Zähler, denn ein Token kann vorauslaufen, wenn ein erzeugter Code nicht verwendet wird; daher akzeptieren Server ein Vorausschaufenster und synchronisieren neu.

## Verwendung

Geben Sie das Shared Secret ein und erzeugen Sie den aktuellen TOTP-Code, oder setzen Sie einen Zähler, um einen HOTP-Code zu erzeugen, und passen Sie Hashfunktion, Stellenzahl und Schrittweite an Ihr System an. Sie können auch einen Code prüfen, den Sie erhalten haben. Der Algorithmus ist bei gegebenem Secret und Moving Factor deterministisch, daher erzeugen dieselben Eingaben immer denselben Code.

## Ergebnisse teilen

Unter dem Einmalcode erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` die Einstellungen: den Modus, den Algorithmus, die Anzahl der Stellen, die Kodierung des Secrets und die Schrittweite oder den Zähler, die Unix-Zeit aber nur, wenn Sie eine eingegeben haben, statt die Uhr zu verwenden. Das Shared Secret enthält er nie. Wer den Link öffnet, gibt das Secret ein, das Sie auf anderem Weg weitergeben, und erhält dieselben Codes. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Das Secret ist der zweite Faktor selbst: Wer es besitzt, kann jeden Code erzeugen. [RFC 4226](https://www.rfc-editor.org/rfc/rfc4226) (Abschnitt 7.5, abgerufen am 01.11.2026) verlangt, dass Operationen mit Shared Secrets „be performed securely, in order to mitigate risks of any leakage of sensitive information“, und [RFC 6238](https://www.rfc-editor.org/rfc/rfc6238) (Abschnitt 3, Anforderung R7, abgerufen am 01.11.2026), dass Schlüssel „SHOULD be protected against unauthorized access and usage“. Eine Ausnahme: Die veröffentlichten Testschlüssel kommen mit in den Link, weil sie ohnehin jeder lesen kann. Das sind das Secret aus Anhang D von RFC 4226 (der ASCII-String `12345678901234567890`) und die Seeds aus RFC 6238 mit 32 und 64 Byte für HMAC-SHA-256 und HMAC-SHA-512 (sein Anhang A), abgedruckt in den Standards, deren Tabellen sich mit der manuellen Zeiteingabe nachrechnen lassen sollen; und der Schlüssel, mit dem diese Seite öffnet, `JBSWY3DPEHPK3PXP`, den diese Website selbst abdruckt (auf der Seite, in ihrer API-Beschreibung und im [Artikel zu Provisioning-URIs](/learn/totp-provisioning-uris-and-qr)), damit sich die Seite, im Ausgangszustand geteilt, genau so wieder öffnet. Sie werden an ihren Bytes erkannt, in jeder der drei Kodierungen.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher werden die Werte beim Öffnen des Links nicht an den Server gesendet. Sie bleiben in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann sie lesen.

- **Öffnen eines Links.** Die Einstellungen ersetzen die des Formulars; die Uhr wird nur ausgeschaltet, wenn eine Zeit mitkommt. Das Feld für das Secret übernimmt einen veröffentlichten Testschlüssel, wenn einer mitkommt (auch den der Seite selbst), und wird sonst geleert, mit einem Hinweis, der um das Secret bittet; so zeigt die Seite nie einen Code für einen Schlüssel, den die sendende Person nicht verwendet hat. Die Codes werden mit Web Crypto im Browser berechnet. Eine Auswahl, die das Formular nicht anbietet, eine Zahl außerhalb des Bereichs, ein Feld des anderen Modus oder ein Secret, das kein veröffentlichter Testschlüssel ist, führt dazu, dass der ganze Link ignoriert wird. In beiden Fällen verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
