## Was das Tool tut

Geben Sie Text ein, und Sie erhalten seine Hashwerte nach SHA-1, SHA-256, SHA-384 und SHA-512, jeweils hexadezimal und in Base64. Das Hashen übernimmt das native Web Crypto des Browsers (`crypto.subtle.digest`), keine mitgelieferte Implementierung, daher stimmen die Werte mit dem überein, was jede konforme Plattform liefert. Alle vier Hashwerte werden auf einmal berechnet; wenn Sie die Anzeige wechseln, wird also nichts neu berechnet. Alles geschieht in Ihrem Browser. Sie können statt eingegebenem Text auch eine Datei hashen: siehe „Dateien“ unten.

## Was ein kryptografischer Hash ist

Ein kryptografischer Hash bildet eine Eingabe beliebiger Länge auf einen Hashwert fester Länge ab und hat einige bestimmende Eigenschaften: Er ist deterministisch (dieselbe Eingabe ergibt immer denselben Hashwert), eine Einwegfunktion (aus dem Hashwert lässt sich die Eingabe nicht zurückgewinnen) und kollisionsresistent (es ist praktisch unmöglich, zwei Eingaben mit demselben Hashwert zu finden). Ändert sich ein einziges Bit der Eingabe, ändert sich etwa die Hälfte der Ausgabebits, daher verrät ein Hashwert nichts darüber, wie ähnlich sich zwei Eingaben sind. Gehasht wird die Eingabe hier als ihre UTF-8-Bytes.

## Die vier Algorithmen

Alle vier sind in FIPS 180-4 definiert, Referenzcode und Testvektoren finden sich außerdem in RFC 6234. Sie unterscheiden sich in der Länge des Hashwerts:

- **SHA-1** erzeugt 160 Bit (40 Hexzeichen). Er ist noch weit verbreitet, aber in Bezug auf Kollisionsresistenz gebrochen und sollte daher nicht verwendet werden, wo ein Angreifer die Eingaben gestalten könnte; für Prüfsummen und den Abgleich mit Altsystemen bleibt er brauchbar.
- **SHA-256** erzeugt 256 Bit (64 Hexzeichen) und ist der moderne Standard.
- **SHA-384** erzeugt 384 Bit (96 Hexzeichen).
- **SHA-512** erzeugt 512 Bit (128 Hexzeichen).

## Hex und Base64

Der Hashwert ist eine Folge von Bytes; Hex und Base64 sind nur zwei Schreibweisen für dieselben Bytes. Hex verwendet zwei Zeichen pro Byte und ist in den meisten Tools die übliche Form; Base64 ist kompakter und erscheint zum Beispiel in Attributen für Subresource Integrity.

## Dateien

Wählen Sie eine Datei über die Dateiauswahl aus oder legen Sie sie irgendwo auf dem Tool ab, und die vier Hashwerte werden über die Bytes der Datei berechnet, genau so, wie sie auf dem Datenträger liegen. Ihr Browser liest die Datei auf Ihrem Gerät über die File API (`Blob.arrayBuffer()`) und übergibt die Bytes an Web Crypto. Es wird nichts hochgeladen: Die Dateiansicht stellt überhaupt keine Netzwerkanfrage. Die Ablagefläche ist zugleich eine Schaltfläche; die Tastatur erreicht sie also mit Tab und öffnet die Dateiauswahl mit Enter oder Leertaste.

- **Was angezeigt wird.** Name, Größe und Typ der Datei erscheinen so, wie Ihr Browser sie meldet. Kann der Browser den Typ nicht bestimmen, lässt er ihn leer, und der Typ spielt für die Hashwerte keine Rolle: Gehasht werden nur die Bytes, eine umbenannte Datei ändert also keinen davon.
- **Eine Datei besteht aus ihren Bytes.** Eine Textdatei, die mit Byte Order Mark oder mit Windows-Zeilenenden (CRLF) gespeichert ist, ergibt andere Hashwerte als dieselben Wörter im Textfeld, denn diese Bytes gehören zur Datei. `hi` im Textfeld und `hi`, gespeichert mit UTF-8-Byte-Order-Mark und CRLF (die sieben Bytes `EF BB BF 68 69 0D 0A`), ergeben zwei verschiedene SHA-256-Hashwerte.
- **Die Größengrenze: 256 MiB.** `digest()` von Web Crypto nimmt die ganze Nachricht in einem Aufruf entgegen und kopiert sie zuerst; eine Streaming-Variante gibt es nicht. Eine Datei damit zu hashen, heißt daher, jedes Byte im Arbeitsspeicher zu halten, plus eine zweite Kopie, während jeder Hashwert berechnet wird. Das Tool hasht Dateien bis 256 MiB (268.435.456 Byte), führt die vier Algorithmen nacheinander aus, sodass immer nur eine Kopie existiert (in der Spitze etwa die doppelte Dateigröße), und lehnt eine größere Datei mit einer Meldung ab, bevor es irgendetwas davon liest. Die Grenze ist eine vorsichtige Wahl, keine Zahl, die die Plattform vorgibt. Während der Arbeit nennt eine Statuszeile den laufenden Algorithmus, zum Beispiel „SHA-384, 2 von 4“.
- **Größere Dateien.** Verwenden Sie den Befehl Ihres Betriebssystems: `sha256sum` aus den GNU Coreutils unter Linux (dazu `sha1sum`, `sha384sum`, `sha512sum`) oder `Get-FileHash` in PowerShell, dessen Standardalgorithmus SHA-256 ist.
- **Abgleich mit einer veröffentlichten Prüfsumme.** Hexadezimale Hashwerte hängen nicht von der Groß- und Kleinschreibung ab: `Get-FileHash` gibt Großbuchstaben aus und dieses Tool Kleinbuchstaben; vergleichen Sie also die Zeichen und ignorieren Sie die Schreibung. Bei einer Liste veröffentlichter Prüfsummen vergleicht `sha256sum --check` (`-c`) jede darin genannte Datei für Sie.
- **Eine leere Datei.** Eine Datei mit null Bytes hat die bekannten Hashwerte der leeren Eingabe (SHA-256 `e3b0c442…7852b855`), und das Tool sagt das. Die Dokumentation von VirusTotal weist darauf hin: Zeigt eine Datei, von der Sie wissen, dass sie nicht leer ist, diesen Hashwert, hat etwas verhindert, dass sie gelesen wurde.
- **Wenn das Lesen scheitert.** Kann der Browser die Datei nicht lesen (sie wurde nach der Auswahl verschoben, gelöscht, geändert oder von einem anderen Programm gesperrt, also die Fälle, die die File API aufführt), zeigt das Tool den Fehlernamen des Browsers und bittet Sie, die Datei erneut auszuwählen. Eine Datei, deren Größe sich während des Lesens ändert, wird genauso gemeldet. Nichts bricht stillschweigend ab.

## Eine Datei bei VirusTotal nachschlagen

Unter den Hashwerten einer Datei steht ein Link: **Diesen SHA-256-Hash bei VirusTotal nachschlagen**. Er öffnet in einem neuen Tab die Adresse, die VirusTotal für den neuesten Bericht zu einer Datei dokumentiert, `https://www.virustotal.com/gui/file/<SHA-256>/detection`, mit dem SHA-256 der Datei anstelle von `<SHA-256>`; die anderen drei Hashwerte stehen nie in einem Link. Wenn Sie dem Link folgen, wird der Hash an VirusTotal gesendet, nicht die Datei. Das Tool selbst sendet nichts; der Link ist ein gewöhnlicher Link, dem Sie nur folgen, wenn Sie es selbst wählen, und er überträgt keinen Referrer (`rel="noopener noreferrer"`), VirusTotal erfährt also nicht, von welcher Seite Sie kommen. Was VirusTotal anzeigt und was es mit der Abfrage tut, unterliegt seinen eigenen Bedingungen. Laut seiner Dokumentation führt der Link zum Bericht über eine Datei, die VirusTotal gescannt hat: Gibt es keinen Bericht, hat VirusTotal die Datei nicht gesehen, und das sagt nichts darüber, ob die Datei sicher ist.

## Abgleich mit einem erwarteten Hash

Unter beiden Ansichten steht ein Feld: **Mit einem erwarteten Hash vergleichen**. Fügen Sie den Hash ein, den eine Download-Seite veröffentlicht, und das Tool sagt, ob er einem der vier berechneten Hashwerte entspricht: dem der Datei, wenn eine Datei gehasht wurde, sonst dem des Textes. Es liest die Formen, die Herausgeber verwenden: reines Hex in Groß- oder Kleinschreibung; Hex in Bytepaaren mit Leerzeichen oder Doppelpunkten; eine Zeile, wie `sha256sum` sie ausgibt (die Prüfsumme, ein Leerzeichen, ein Leerzeichen oder ein Sternchen, der Dateiname; die GNU Coreutils nennen das Format „untagged“); eine Zeile mit Tag wie `SHA256 (file.iso) = …`; einen mit `sha256:` bezeichneten Wert (die Form von OCI-Image-Digests: der Algorithmus, ein Doppelpunkt, der kodierte Wert); und Base64, Standard oder URL-sicher, mit oder ohne Padding, einschließlich eines Werts für Subresource Integrity wie `sha384-…` (der Algorithmus, ein Bindestrich, der Base64-Wert). Trägt der Wert eine Algorithmusbezeichnung, wird nur dieser Algorithmus verglichen, sodass ein als SHA-512 bezeichneter Wert nie zufällig einem SHA-256 entspricht. Ein Treffer nennt Algorithmus und Kodierung. Kein Treffer gibt an, ob der Wert wenigstens die Länge eines der vier Hashwerte hat; das heißt meist, dass die hier gehashten Bytes nicht die sind, für die der Hash veröffentlicht wurde, oder dass der Hash falsch kopiert wurde. Ein MD5, 32 Hexzeichen, ist keiner der vier und passt nie. Es wird nichts erneut gehasht und nichts gesendet: Verglichen werden Zeichenfolgen, die bereits auf der Seite stehen.

## Durchgerechnetes Beispiel

- Der SHA-256 von `abc` ist `ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad`, der Standard-Testvektor aus der SHA-Spezifikation.
- Ist `abc` eingegeben, ergibt das Einfügen von `sha256-ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0=` in das Vergleichsfeld einen Treffer: den SHA-256 des Textes in Base64.

## Verwendung

Geben Sie Text ein oder fügen Sie ihn ein und lesen Sie die vier Hashwerte, oder wählen Sie eine Datei aus bzw. legen Sie sie ab und lesen Sie die Hashwerte ihrer Bytes. Da ein Hash eine Einwegfunktion ist, kann das Tool einen Hashwert nicht in seine Eingabe zurückverwandeln; eine Eingabe zurückzugewinnen, ist nur machbar, wenn sie sehr wenig Entropie hatte, wie die [Urbildsuche für Hashes](/tools/hash-preimage-finder) vorführt.

## Ergebnisse teilen

Die Seite hat zwei Antworten und daher zwei Schaltflächen **Ergebnisse teilen**, und ein Link vermischt sie nie. Jede erzeugt einen Link auf diese Seite, und zwar nur, wenn Sie sie wählen. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

- **Unter den Hashwerten des Textes.** Der Link enthält nach dem `#` den Text so, wie eingegeben, den angezeigten Algorithmus, wenn es nicht SHA-256 ist, und den Inhalt des Vergleichsfelds, wenn dieses mit dem Text vergleicht. Der Text kann ein Passwort sein, und ein Hashwert verbirgt es nicht: Ein schneller Hash ohne Salt über ein schwaches Passwort fällt in Sekunden, wie die [Urbildsuche für Hashes](/tools/hash-preimage-finder) zeigt. Daher warnt das Popover davor, ein Passwort, einen Schlüssel oder ein Token zu senden, und ein Text, in dem die Secret-Prüfung der Website Zugangsdaten findet, erhält überhaupt keinen Link: einen privaten Schlüssel, einen Authorization-Header, eine AWS-Zugriffsschlüssel-ID, ein JWT, ein Passwort in einer URL, einen `ENC`-Wert von FortiOS oder einen Wert, der einem Namen zugewiesen ist, der nach einem Secret aussieht. Das Popover nennt, was es gefunden hat und in welcher Zeile; kopieren Sie stattdessen den Hashwert.
- **Unter den Hashwerten einer Datei.** Kein Byte der Datei und auch nicht ihr Name kommt je in einen Link. Der Link enthält den Hashwert der Datei für den angezeigten Algorithmus an der Stelle des Vergleichsfelds; die lesende Person wählt dieselbe Datei aus, und das Feld zeigt, ob sie passt, und genau dafür ist ein veröffentlichter Hash da.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher werden die Werte beim Öffnen des Links nicht an den Server gesendet. Sie bleiben in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann sie lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der Text länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Ein Text-Link füllt das Textfeld, und die Seite hasht den Text; ein Datei-Link füllt das Vergleichsfeld, mit einem Hinweis, der um die Datei bittet, und wartet: Es wird nichts vom Datenträger gelesen, bis Sie eine Datei auswählen. Algorithmus und Vergleichsfeld übernehmen die Werte des Links. Ein Algorithmus, den die Seite nicht anbietet, ein Vergleichswert über mehr als eine Zeile, ein Datei-Link, dessen Wert kein Hashwert in der Länge des Algorithmus ist, oder ein Text mit Zugangsdaten führt dazu, dass der ganze Link ignoriert wird. In beiden Fällen verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.

## Quellen

- [W3C File API (Working Draft, 12 September 2026)](https://www.w3.org/TR/FileAPI/): [Blob size and type](https://www.w3.org/TR/FileAPI/#attributes-blob), [arrayBuffer()](https://www.w3.org/TR/FileAPI/#arraybuffer-method-algo), [the File interface](https://www.w3.org/TR/FileAPI/#file-section) und [Errors and Exceptions](https://www.w3.org/TR/FileAPI/#ErrorAndException) (abgerufen am 27.10.2026)
- [W3C Web Cryptography Level 2, 14.3.5 The digest method](https://www.w3.org/TR/webcrypto/#SubtleCrypto-method-digest) und [32 SHA](https://www.w3.org/TR/webcrypto/#sha) (der veröffentlichte Entwurf; der Editor's Draft vom 22. Oktober 2026 enthält dieselben Schritte) (abgerufen am 27.10.2026)
- [WHATWG HTML: the File Upload state (input type=file)](https://html.spec.whatwg.org/multipage/input.html#file-upload-state-(type=file)), [the DataTransfer interface](https://html.spec.whatwg.org/multipage/dnd.html#the-datatransfer-interface) und die Linktypen [noopener](https://html.spec.whatwg.org/multipage/links.html#link-type-noopener) und [noreferrer](https://html.spec.whatwg.org/multipage/links.html#link-type-noreferrer) (abgerufen am 27.10.2026)
- [VirusTotal: How can I link to the most recent report on a given file or URL?](https://docs.virustotal.com/docs/most-recent-report) und [Empty file and VirusTotal uploads](https://docs.virustotal.com/docs/empty-file) (abgerufen am 27.10.2026)
- [GNU Coreutils manual: sha2 utilities](https://www.gnu.org/software/coreutils/manual/html_node/sha2-utilities.html) und [cksum common options (--check)](https://www.gnu.org/software/coreutils/manual/html_node/cksum-common-options.html) (das Handbuch von Coreutils 9.12, der aktuellen Version; abgerufen am 27.10.2026)
- [Microsoft Learn: Get-FileHash](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/get-filehash?view=powershell-7.6) (die Referenz für PowerShell 7.6, das aktuelle Release mit Long-Term-Servicing; abgerufen am 27.10.2026)
- [W3C Subresource Integrity](https://www.w3.org/TR/sri/), 3.5 The integrity attribute (die Grammatik `hash-expression = hash-algorithm "-" base64-value`) (abgerufen am 27.10.2026)
- [GNU Coreutils manual: cksum output modes](https://www.gnu.org/software/coreutils/manual/html_node/cksum-output-modes.html) (das Format mit und ohne Tag; Coreutils 9.12; abgerufen am 27.10.2026)
- [OCI Image Format Specification: Descriptor](https://github.com/opencontainers/image-spec/blob/main/descriptor.md), Abschnitt Digests (`digest ::= algorithm ":" encoded`) (abgerufen am 27.10.2026)
- [RFC 6234: US Secure Hash Algorithms](https://www.rfc-editor.org/rfc/rfc6234) (seine Testnachrichten gehören zu den Datei-Vektoren des Tools; abgerufen am 27.10.2026)
- [RFC 3986: Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986), Abschnitt 3.5 Fragment (abgerufen am 01.11.2026)
