## Was das Tool tut

Geben Sie einen Text und eine Passphrase ein, wählen Sie „Verschlüsseln“, und Sie erhalten eine einzige Zeichenfolge, die mit `aesgcm1.` beginnt. Fügen Sie diese Zeichenfolge im Modus „Entschlüsseln“ wieder ein, geben Sie dieselbe Passphrase ein, und Sie erhalten den Text zurück, genau so, wie er war. Alles geschieht in Ihrem Browser über dessen Web Cryptography API: Text und Passphrase werden nie gesendet, nie gespeichert und nie in die Adresse geschrieben.

Das Tool ist für Ihren eigenen Text und Ihre eigene Passphrase gedacht: eine Notiz, die Sie in einer Datei oder einem Nachrichtenverlauf aufbewahren wollen, ohne dass sie lesbar bleibt, oder ein Secret, das Sie in zwei Teilen übergeben wollen (die Zeichenfolge auf einem Weg, die Passphrase auf einem anderen). Es öffnet nur, was mit einer Passphrase versiegelt wurde, die Sie kennen. Es rät, knackt und rekonstruiert nichts anderes, und eine falsche Passphrase liefert nichts zurück.

## Wie es funktioniert

Jeder Schritt ist ein Primitiv der [Web Cryptography API](https://www.w3.org/TR/WebCryptoAPI/), also der eigenen Implementierung des Browsers; in der Seite steht kein kryptografischer Code.

1. **Die Passphrase wird aufbereitet.** Jedes Nicht-ASCII-Leerzeichen (Unicode-Kategorie Zs, etwa das geschützte Leerzeichen) wird zu einem normalen Leerzeichen, dann wird die Unicode-Normalisierungsform C angewandt: die beiden Abbildungsregeln des Profils OpaqueString aus [RFC 8265](https://www.rfc-editor.org/rfc/rfc8265) (Abschnitt 4.2.2, Regeln 2 und 4). Ein „ç“, als ein Zeichen eingegeben, und ein „ç“, eingefügt als „c“ plus kombinierende Cedille, ergeben dann denselben Schlüssel. Sonst wird nichts geändert: Groß- und Kleinschreibung bleiben erhalten, und kein Zeichen wird abgelehnt außer einem ungepaarten Surrogat, das UTF-8 nicht darstellen kann. Das Ergebnis wird als UTF-8 kodiert ([RFC 3629](https://www.rfc-editor.org/rfc/rfc3629)).
2. **Ein Schlüssel wird abgeleitet.** PBKDF2 (Password-Based Key Derivation Function 2, [RFC 8018](https://www.rfc-editor.org/rfc/rfc8018), Abschnitt 5.2) mit HMAC-SHA-256 als Pseudozufallsfunktion macht aus der Passphrase, einem zufälligen 16-Byte-Salt und 600.000 Iterationen einen 256-Bit-Schlüssel für AES (Advanced Encryption Standard).
3. **Der Text wird versiegelt.** AES im Galois/Counter Mode (GCM, [NIST SP 800-38D](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf)) verschlüsselt den Text als UTF-8 unter diesem Schlüssel mit einem zufälligen 12-Byte-Initialisierungsvektor (IV) und erzeugt ein 128-Bit-Authentifizierungs-Tag. Die ersten vier Felder der Zeichenfolge werden GCM als zusätzliche authentifizierte Daten übergeben, sodass das Tag auch sie abdeckt.
4. **Eine Zeichenfolge wird geschrieben.** Das Versions-Tag, die Iterationszahl, das Salt, der IV und der Chiffretext mit seinem Tag, durch Punkte verbunden.

Das Entschlüsseln kehrt das um: Die Felder werden gelesen, die Passphrase wird auf dieselbe Weise aufbereitet, aus dem Salt und der Iterationszahl der Zeichenfolge wird derselbe Schlüssel abgeleitet, und AES-GCM prüft das Tag, bevor es irgendetwas zurückgibt. Das ist die Form, die RFC 8018 PBES2 nennt (Abschnitt 6.2): ein Schlüssel aus PBKDF2, dann ein Verschlüsselungsverfahren. Das Format der Zeichenfolge darum herum ist ein eigenes dieses Tools und unten ausgeschrieben, damit jeder es nachimplementieren kann.

Salt und IV zieht die Seite mit `crypto.getRandomValues`, das laut Web Cryptography API ein Array mit „cryptographically secure random bytes“ füllt (Abschnitt 10.1.1). Die Engine selbst nimmt sie als Eingaben entgegen und zieht nichts, und deshalb lässt sie sich mit festem Salt und IV Byte für Byte testen. Deshalb ergibt es auch zwei verschiedene Zeichenfolgen, wenn Sie denselben Text zweimal mit derselben Passphrase verschlüsseln, und beide lassen sich entschlüsseln.

## Die Zeichenfolge

```
aesgcm1.600000.AAECAwQFBgcICQoLDA0ODw.EBESExQVFhcYGRob.3lWZqiea5CBm...
```

| Feld | Inhalt | Kodierung |
|---|---|---|
| 1 | `aesgcm1`: diese Konstruktion, Formatversion 1 | ASCII |
| 2 | Die Iterationszahl von PBKDF2 | Dezimal, ohne Vorzeichen, ohne führende Null, 1.000 bis 10.000.000 |
| 3 | Das Salt, 16 Byte | base64url ohne Padding, 22 Zeichen |
| 4 | Der IV, 12 Byte | base64url ohne Padding, 16 Zeichen |
| 5 | Der Chiffretext, gefolgt vom 16-Byte-Tag | base64url ohne Padding |

- **base64url** ist das URL- und dateinamensichere Alphabet aus [RFC 4648](https://www.rfc-editor.org/rfc/rfc4648) (Abschnitt 5): A bis Z, a bis z, 0 bis 9, `-` und `_`. Das Padding `=` entfällt, was Abschnitt 3.2 erlaubt, wenn die Spezifikation es so festlegt: Hier endet das Feld am nächsten Punkt. Die Dekodierung ist strikt: Jedes andere Zeichen, eine Länge, die keine ganzen Bytes kodieren kann, oder ein letztes Zeichen, dessen ungenutzte Bits nicht null sind, wird abgelehnt (Abschnitt 3.5 erlaubt einem Decoder, eine nicht kanonische Kodierung zurückzuweisen). Der Punkt gehört nicht zu diesem Alphabet, daher kann ein Feld nie einen enthalten.
- **Die zusätzlichen authentifizierten Daten** sind der Text der Felder 1 bis 4 mit ihren drei Punkten, genau so, wie er geschrieben ist. Ändern Sie Version, Iterationszahl, Salt oder IV, und das Tag lässt sich nicht mehr verifizieren, selbst wenn der Rest der Zeichenfolge intakt ist.
- **Whitespace** (Leerzeichen, Tabulatoren, Zeilenumbrüche) an beliebiger Stelle einer eingefügten Zeichenfolge wird vor dem Lesen entfernt, weil E-Mail-Programme lange Zeilen umbrechen; das Ergebnis sagt, wenn das geschehen ist.
- **Länge.** Der Chiffretext ist so lang wie der Text in UTF-8, plus das 16-Byte-Tag. Die Länge der Zeichenfolge zeigt daher ungefähr, wie lang der Text ist.

## Warum diese Zahlen

- **600.000 Iterationen.** Das [Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) von OWASP nennt „PBKDF2-HMAC-SHA256: 600,000 iterations (recommended)“ (abgerufen am 27.10.2026). Jede Iteration ist eine HMAC-Berechnung mehr für jeden, der Passphrasen an Ihrer Zeichenfolge ausprobiert, und für Sie einmal pro Ver- oder Entschlüsselung: Rechnen Sie damit, dass die Schaltfläche einen Moment braucht.
- **1.000 bis 10.000.000 beim Entschlüsseln.** Die Iterationszahl steht in der Zeichenfolge, daher folgt die Entschlüsselung ihr, innerhalb der Spanne, die [NIST SP 800-132](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-132.pdf) festlegt (Abschnitt 5.2): „A minimum iteration count of 1,000 is recommended“, und für besonders kritische Schlüssel „an iteration count of 10,000,000 may be appropriate“. RFC 8018 zitiert denselben Text (Abschnitt 4.2). Die Obergrenze bedeutet auch, dass eine präparierte Zeichenfolge die Seite nicht minutenlang einen Schlüssel ableiten lassen kann.
- **Ein 16-Byte-Salt.** SP 800-132, Abschnitt 5.1: „The length of the randomly-generated portion of the salt shall be at least 128 bits.“ RFC 8018 (Abschnitt 3) hält fest, dass Salt und Iterationszahl „need not be kept secret“, also nicht geheim gehalten werden müssen; sie reisen in der Zeichenfolge mit.
- **Ein zufällig gezogener 12-Byte-IV.** SP 800-38D empfiehlt, IVs auf 96 Bit zu beschränken, „to promote interoperability, efficiency, and simplicity of design“ (Abschnitt 5.2.1.1). Seine zentrale Regel ist, dass derselbe IV unter demselben Schlüssel nicht zweimal verwendet werden darf (Abschnitt 8, eine Wahrscheinlichkeit „no greater than 2^-32“), und bei zufälligen IVs begrenzt es die Anzahl der Verschlüsselungen unter einem Schlüssel auf 2^32 (Abschnitt 8.3). Hier hat jede Verschlüsselung ein neues zufälliges Salt, also einen neuen Schlüssel, und dazu einen neuen zufälligen IV.
- **Ein 128-Bit-Tag**, das längste, das GCM erlaubt (Abschnitt 5.2.1.2), und der Standardwert der Web Cryptography API.
- **AES-256.** PBKDF2 leitet 32 Byte ab, die als AES-GCM-Schlüssel importiert werden, der sich nicht aus dem Schlüsselobjekt des Browsers exportieren lässt.

## Was es schützt und was nicht

**Es schützt** den Inhalt des Texts, solange er in der Zeichenfolge steht, gegen jeden, der die Zeichenfolge hat, aber nicht die Passphrase, und es erkennt jede Änderung an der Zeichenfolge: AES-GCM gibt entweder den ganzen Text zurück oder die einzige Antwort FAIL (SP 800-38D, Abschnitt 7.2), und die Seite zeigt FAIL als „Falsche Passphrase oder veränderter Text“ und sonst nichts. Es gibt kein Teilergebnis zu lesen.

**Es schützt nicht:**

- **Eine schwache Passphrase.** Wer die Zeichenfolge hat, kann auf eigener Hardware beliebig oft und beliebig schnell Passphrasen ausprobieren; die Seite ist nicht beteiligt und kann das nicht bremsen. RFC 8018 hält das offen fest: Passwortbasierte Kryptografie „is generally limited in the security that it can provide“, besonders „where offline password search is possible“ (Abschnitt 8). Die Iterationszahl vervielfacht die Kosten jedes Versuchs; sie verhindert nicht, dass eine Passphrase gefunden wird, die auf der Liste weit vorne steht. SP 800-132 (Anhang A.1) ergänzt, dass sich solche Suchen parallelisieren lassen und auf einem System laufen können, das „much more powerful“ ist als Ihres.
- **Gegen jeden, der die Passphrase kennt.** Wer sowohl die Zeichenfolge als auch die Passphrase hat, liest den Text. Senden Sie beides getrennt und nie in derselben Nachricht.
- **Ein Gerät, dem Sie nicht vertrauen können.** Malware oder ein Keylogger sieht, was Sie eingeben, bevor irgendetwas verschlüsselt wird; das NIST hält fest, dass Keylogging „equally effective on lengthy and complex passwords as they are on simple ones“ ist ([SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html), Anhang A). Die Sicherheitshinweise der Web Cryptography API selbst halten fest, dass in eine Seite eingeschleustes Skript „may allow for the exfiltration of keys or data“ und dass Browser Schlüsselmaterial nicht aus Arbeitsspeicher oder Ablage löschen müssen (Abschnitt 6.2).
- **Die Länge.** Die Zeichenfolge zeigt ungefähr, wie lang der Text ist.
- **Was nach dem Entschlüsseln geschieht.** Der Text wird in der Seite angezeigt. Wenn Sie ihn kopieren, landet er in der Zwischenablage Ihres Systems, wo andere Programme ihn lesen können.

## Der Hinweis zur Passphrase

Während Sie im Modus „Verschlüsseln“ eine Passphrase eingeben, zeigt die Seite ihre Länge in Zeichen und in UTF-8-Bytes und welche Arten von Zeichen sie enthält (Klein- und Großbuchstaben, Buchstaben ohne Groß- und Kleinschreibung, Ziffern, Leerzeichen, Satz- oder Sonderzeichen). Sie sagt auch, wenn die Passphrase mit Whitespace beginnt oder endet und wenn die Aufbereitung sie verändert. Sie berechnet bewusst **keine Bewertung der Stärke**:

- Wer rät, probiert Passphrasen nicht zufällig aus, sondern zuerst die wahrscheinlichen (Wörter, Namen, Daten, Zitate, Passwörter aus früheren Leaks). Die Seite kann nicht wissen, wo Ihre auf einer solchen Liste steht, eine Zahl wäre also erfunden.
- Das NIST betrachtet die Länge als „a primary factor in characterizing password strength“ und stellt fest, dass Zusammensetzungsregeln (Ziffern, Großbuchstaben und Sonderzeichen vorschreiben) weniger bringen als erwartet, weil Menschen sie vorhersehbar erfüllen: Aus „password“ wird „Password1!“ (SP 800-63B-4, Anhang A). Es hält auch fest, dass Widerstand gegen Offline-Angriffe Passwörter erfordert, die „orders of magnitude more complex“ sind als für den Widerstand gegen Online-Raten.
- SP 800-132 (Anhang A.1) hält fest, dass Passwörter mit weniger als 10 Zeichen gewöhnlich als schwach gelten, ebenso Passphrasen mit weniger als 20 Zeichen. Derselbe Anhang rät von Zahlen- oder Buchstabenfolgen ab und von persönlichen Angaben wie einem Namen, einer Telefonnummer oder einem Geburtsdatum.

Der Modus „Verschlüsseln“ fragt die Passphrase zweimal ab und bleibt deaktiviert, bis beide übereinstimmen: Ein Text, der mit einer vertippten Passphrase verschlüsselt wurde, lässt sich von niemandem wiederherstellen.

## Nichts verlässt die Seite

- **Keine Anfrage.** Ver- und Entschlüsselung sind Aufrufe der Web Cryptography API des Browsers. Es wird nichts an diese Website oder anderswohin gesendet.
- **Keine Speicherung.** Text, Passphrase und Ergebnisse existieren nur im Arbeitsspeicher der Seite, solange sie geöffnet ist; „Leeren“ leert jedes Feld. Nichts wird in den Local Storage, in Cookies oder in einen anderen Speicher geschrieben.
- **Nichts in der Adresse.** Die Seite schreibt nichts in ihre eigene Adresse. Ein Link entsteht nur, wenn Sie „Ergebnisse teilen“ wählen, und er enthält nur die verschlüsselte Zeichenfolge (nächster Abschnitt).
- **Keine Rechtschreibprüfung** in den Feldern (das HTML-Attribut `spellcheck="false"`). Die [erweiterte Rechtschreibprüfung](https://support.google.com/chrome/answer/12027911?hl=en) von Chrome „sends the text you enter in your browser to Google“; der [HTML Standard](https://html.spec.whatwg.org/multipage/interaction.html) (Abschnitt 6.8.5) erlaubt, dass eine eigene Einstellung des Benutzers das Attribut übersteuert. Wenn Sie die Rechtschreibprüfung also überall erzwungen haben, schalten Sie sie aus, bevor Sie Secrets eingeben. Die Passphrasefelder sind Passwortfelder und gehören nicht zu den Feldern, die Browser laut dem Standard prüfen sollten (Eingabefelder für Text, Suche, URL und E-Mail sowie Textbereiche), bis Sie „Anzeigen“ wählen.
- **Kein Formular.** Die Felder stehen in keinem Formular und haben keinen Namen, daher kann nichts sie absenden.
- **Die Web Cryptography API braucht einen sicheren Kontext.** Ihre Schnittstelle `subtle` gibt es nur auf Seiten, die sicher ausgeliefert werden (die Spezifikation kennzeichnet sie mit `[SecureContext]`); ohne sie sagt die Seite das und tut nichts.

## Ergebnisse teilen

Unter der verschlüsselten Zeichenfolge (und im Modus „Entschlüsseln“ unter der Schaltfläche „Entschlüsseln“) erzeugt die Schaltfläche **Ergebnisse teilen** einen Link auf diese Seite, der die verschlüsselte Zeichenfolge enthält und sonst nichts: nie die Passphrase, nie den Text. Sie erzeugt den Link nur, wenn Sie sie wählen, nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an. Die Adresse der Seite bleibt unverändert.

- **Wo die Zeichenfolge steht.** Nach dem `#`: `/tools/text-encryption#input=aesgcm1...`. Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher sendet ein Browser es beim Öffnen des Links nicht an den Server. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, hat die Zeichenfolge. Deshalb muss die Passphrase auf einem anderen Weg übermittelt werden.
- **Länge.** Ein Link enthält höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt. Bei 600.000 Iterationen entspricht das einem Text von bis zu 12.230 Byte in UTF-8; eine längere Zeichenfolge erhält keinen Link, und das Popover sagt das: Kopieren Sie stattdessen die Zeichenfolge.
- **Öffnen eines Links.** Die Seite öffnet sich im Modus „Entschlüsseln“ mit eingetragener Zeichenfolge, sagt, dass diese aus einem Link stammt, und leert jede Passphrase, die Sie eingegeben hatten. Sie entschlüsselt erst, wenn Sie die Passphrase eingeben und „Entschlüsseln“ wählen. Ein Wert, der keine wohlgeformte Zeichenfolge dieses Formats ist, wird ignoriert. Ob angenommen oder nicht, die Seite entfernt den Wert sofort aus ihrer Adresse, ohne dass eine Anfrage gesendet wird; ein Neuladen, ein Lesezeichen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
- **Nachweis.** Für jeden Referenzvektor (Golden Vector) mit Hin- und Rückweg und für das Beispiel erzeugen die Share-Prüfungen der Website den Link und bestätigen, dass weder die Passphrase noch der Text darin vorkommt, weder wie eingegeben noch prozentkodiert, formularkodiert oder dekodiert.

## Fehlercodes

| Code | Bedeutung |
|---|---|
| `empty-text` | Verschlüsseln: Es gibt keinen Text |
| `text-too-large` | Der Text ist in UTF-8 größer als 1.048.576 Byte (1 MiB), die Grenze der Seite (GCM selbst erlaubt bis zu 2^39 - 256 Bit) |
| `lone-surrogate` | Der Text oder die Passphrase enthält ein ungepaartes Surrogat, das UTF-8 nicht darstellen kann |
| `empty-passphrase` | Keine Passphrase |
| `passphrase-too-long` | Mehr als 1.024 Zeichen nach der Aufbereitung |
| `bad-salt-length` | Ein Salt, das nicht 16 Byte lang ist |
| `bad-iv-length` | Ein IV, der nicht 12 Byte lang ist |
| `iterations-out-of-range` | Eine Iterationszahl außerhalb von 1.000 bis 10.000.000 |
| `empty-input` | Entschlüsseln: nichts außer Whitespace |
| `input-too-large` | Entschlüsseln: mehr als 2.000.000 Zeichen |
| `bad-format` | Nicht fünf durch Punkte getrennte Felder |
| `unknown-version` | Ein erstes Feld, das nicht `aesgcm1` lautet (beim Tag wird Groß- und Kleinschreibung unterschieden) |
| `bad-iterations` | Ein zweites Feld, das keine dezimale Ganzzahl ohne führende Null ist |
| `bad-encoding` | Ein Feld für Salt, IV oder Chiffretext, das kein kanonisches base64url ohne Padding ist |
| `too-short` | Ein Feld für den Chiffretext, das kürzer ist als das 16-Byte-Tag |
| `auth-failed` | Das Tag wurde nicht verifiziert: falsche Passphrase oder eine Zeichenfolge, die nach ihrer Erzeugung verändert wurde |
| `not-utf8` | Das Tag wurde verifiziert, aber der Inhalt ist kein UTF-8-Text (dieses Tool schreibt nie eine solche Zeichenfolge) |
| `no-crypto` | Die Seite hat keine Web Cryptography API |
| `crypto-error` | Die Web Cryptography API hat aus einem anderen Grund abgelehnt |

Die Seite liest eine eingefügte Zeichenfolge schon beim Einfügen und zeigt Format, Iterationszahl und Größen oder den Grund, warum sie nicht lesbar ist, bevor Sie die Passphrase eingeben.

## Durchgerechnete Beispiele

- **Die Schaltfläche „Beispiel“ im Modus „Verschlüsseln“** trägt den Text „Lab notes: the core switch maintenance window moves to Saturday 02:00 (São Paulo).“ und in beide Felder die Passphrase `Password` ein. `Password` ist das Testpasswort aus RFC 7914, Abschnitt 11, das jeder nachlesen kann; die Seite kennzeichnet es als Passphrase des Beispiels, sobald es im Feld steht. Verwenden Sie es nie für echten Text. Wählen Sie „Verschlüsseln“, und Sie erhalten eine Zeichenfolge aus 187 Zeichen (83 Byte Text, 99 Byte nach dem Versiegeln), jedes Mal eine andere.
- **Die Schaltfläche „Beispiel“ im Modus „Entschlüsseln“** trägt die Zeichenfolge ein, die der Referenzvektor „example“ festschreibt: `aesgcm1.600000.AAECAwQFBgcICQoLDA0ODw.EBESExQVFhcYGRob.3lWZ...` (die vollständige Zeichenfolge steht in der Seite). Sie wurde mit festem Salt (Bytes 00 bis 0f) und festem IV (Bytes 10 bis 1b) erzeugt, die die Seite selbst nie verwendet. Mit `Password` entschlüsselt sie zum obigen Text; mit `password` ergibt sie `auth-failed`.
- **Ein Zeichen ändern.** Ändern Sie ein beliebiges Zeichen im Chiffretext, im Salt, im IV oder in der Iterationszahl einer gültigen Zeichenfolge, und die Entschlüsselung ergibt `auth-failed`, nie einen verstümmelten Text.
- **Dieselbe Passphrase, anders eingegeben.** „coração de exemplo“, eingegeben mit zusammengesetzten Zeichen, mit zerlegten Zeichen oder mit einem geschützten Leerzeichen zwischen den Wörtern, leitet denselben Schlüssel ab, daher entschlüsseln alle drei Varianten dieselbe Zeichenfolge.

## Herkunft

Die Engine ist eine Sammlung reiner Funktionen rund um die Web Cryptography API: Bei gleichem Text, gleicher Passphrase, gleichem Salt, gleichem IV und gleicher Iterationszahl schreibt sie immer dieselbe Zeichenfolge. Sie bringt Referenzvektoren mit (Satz `text-encryption-golden-2026-10-27`, 207 Prüfungen):

- **Bekannte Antworten für die Primitive**: die beiden Vektoren für PBKDF2-HMAC-SHA-256 aus [RFC 7914](https://www.rfc-editor.org/rfc/rfc7914), Abschnitt 11; sieben Verschlüsselungsvektoren für AES-GCM aus der Datei `gcmEncryptExtIV256.rsp` des Cryptographic Algorithm Validation Program von NIST (AES-256, 96-Bit-IV, 128-Bit-Tag; Klartexte von 0 bis 408 Bit, zusätzliche Daten von 0 bis 720 Bit), jeder auch wieder entschlüsselt; und zwei Entschlüsselungsvektoren aus `gcmDecrypt256.rsp`, von denen die Datei einen als FAIL kennzeichnet und die Engine ihn ablehnt.
- **Die Kodierung**: die Zeichenfolgen aus RFC 4648, Abschnitt 10, und sieben Zeichenfolgen, die der strikte Decoder ablehnen muss.
- **Hin- und Rückwege** mit festen Salts und IVs (das Beispiel mit 600.000 Iterationen; ASCII, Portugiesisch mit Zeilenumbrüchen und einem Tabulator, Zeichen außerhalb der Basic Multilingual Plane, eine führende Byte Order Mark; drei Schreibweisen einer Passphrase), jeder in beide Richtungen geprüft. Jede erwartete Zeichenfolge wurde zuerst von einem separaten Python-Skript (hashlib und das Paket cryptography) aus dem hier beschriebenen Format berechnet, nicht von der Engine.
- **Ablehnungen**: 35 Ablehnungen beim Entschlüsseln (jeder Formatfehler, die Grenzen der Iterationszahl, falsche Passphrasen, ein geänderter Chiffretext, ein geändertes Tag, ein geänderter IV, ein geändertes Salt und eine geänderte Iterationszahl, der Chiffretext einer anderen Zeichenfolge und authentische Bytes, die kein UTF-8 sind) und 11 Ablehnungen beim Verschlüsseln, jede mit ihrem Code, dazu eine Prüfung, dass keine Ablehnung Text enthält.
- **Ergebnisse teilen**: 5 Zeichenfolgen, die ein Link enthalten darf (kompakt, Whitespace entfernt), und 9 Texte, die er nicht enthalten darf (ein Klartext, eine Passphrase, gekürzt, eine andere Version, Iterationszahlen außerhalb des Bereichs, fehlerhafte Kodierungen, eine als sechstes Feld angehängte Passphrase).

## API

Keine, mit Absicht. Die HTTP-API der Website führt Tools auf einem Server aus; dieses Tool müsste dort eine Passphrase oder einen Klartext empfangen, und genau das soll es nicht tun. Es steht in der Liste der Tools, die von der API ausgeschlossen sind, mit dieser Begründung.

## Quellen

- [NIST SP 800-38D, Recommendation for Block Cipher Modes of Operation: Galois/Counter Mode (GCM) and GMAC, November 2007](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf) (abgerufen am 27.10.2026): Abschnitte 5.2.1, 7.1, 7.2, 8, 8.2.2 und 8.3. Seine [CSRC-Seite](https://csrc.nist.gov/pubs/sp/800/38/d/final) (abgerufen am 27.10.2026) enthält einen Planungshinweis vom 6. März 2024: Das NIST hat beschlossen, das Dokument zu überarbeiten.
- [NIST CAVP, GCM test vectors (gcmtestvectors.zip)](https://csrc.nist.gov/CSRC/media/Projects/Cryptographic-Algorithm-Validation-Program/documents/mac/gcmtestvectors.zip) (abgerufen am 27.10.2026): `gcmEncryptExtIV256.rsp` und `gcmDecrypt256.rsp`, CAVS 14.0
- [RFC 8018, PKCS #5: Password-Based Cryptography Specification Version 2.1](https://www.rfc-editor.org/rfc/rfc8018) (abgerufen am 27.10.2026): Abschnitte 3, 4.1, 4.2, 5.2, 6.2 und 8; seine vier verifizierten Errata betreffen nur die ASN.1-Anhänge, und RFC 9579 und RFC 9879 aktualisieren ihn nur für PKCS #12
- [RFC 7914, The scrypt Password-Based Key Derivation Function](https://www.rfc-editor.org/rfc/rfc7914) (abgerufen am 27.10.2026): Abschnitt 11, die Testvektoren für PBKDF2-HMAC-SHA-256
- [OWASP Cheat Sheet Series, Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) (abgerufen am 27.10.2026): PBKDF2, 600.000 Iterationen für PBKDF2-HMAC-SHA256
- [NIST SP 800-132, Recommendation for Password-Based Key Derivation, Part 1: Storage Applications, December 2010](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-132.pdf) (abgerufen am 27.10.2026): Abschnitte 5.1 und 5.2, Anhang A. Seine [CSRC-Seite](https://csrc.nist.gov/pubs/sp/800/132/final) enthält einen Planungshinweis vom 11. Mai 2023: Das NIST plant, das Dokument zu überarbeiten.
- [W3C, Web Cryptography API, Recommendation 26 January 2017](https://www.w3.org/TR/2017/REC-WebCryptoAPI-20170126/) und [Web Cryptography Level 2, First Public Working Draft 22 April 2025](https://www.w3.org/TR/WebCryptoAPI/), der inzwischen unter der Adresse der API-Spezifikation ausgeliefert wird (beide abgerufen am 27.10.2026): getRandomValues, AES-GCM, PBKDF2, die Regel zum sicheren Kontext und die Sicherheitshinweise
- [RFC 4648, The Base16, Base32, and Base64 Data Encodings](https://www.rfc-editor.org/rfc/rfc4648) (abgerufen am 27.10.2026): Abschnitte 3.2, 3.5, 5 und 10
- [RFC 8265, Preparation, Enforcement, and Comparison of Internationalized Strings Representing Usernames and Passwords](https://www.rfc-editor.org/rfc/rfc8265) (abgerufen am 27.10.2026): Abschnitt 4.2.2
- [RFC 3629, UTF-8, a transformation format of ISO 10646](https://www.rfc-editor.org/rfc/rfc3629) (abgerufen am 27.10.2026)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (abgerufen am 27.10.2026): Abschnitt 3.5, das Fragment
- [NIST SP 800-63B-4, Authentication and Authenticator Management](https://pages.nist.gov/800-63-4/sp800-63b.html) (abgerufen am 27.10.2026): Anhang A, Strength of Passwords
- [Google Chrome Help, Turn Chrome spell check on and off](https://support.google.com/chrome/answer/12027911?hl=en) (abgerufen am 27.10.2026) und der [HTML Standard, section 6.8.5, Spelling and grammar checking](https://html.spec.whatwg.org/multipage/interaction.html) (abgerufen am 27.10.2026)
