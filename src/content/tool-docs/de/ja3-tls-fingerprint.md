## Was das Tool tut

Das Tool berechnet einen passiven TLS-Fingerprint nach JA3. Fügen Sie einen JA3-String ein, also die fünf Felder des ClientHello (TLS-Version, Cipher-Suiten, Erweiterungen, elliptische Kurven und Punktformate der elliptischen Kurven), mit Kommas zwischen den Feldern und Bindestrichen zwischen den Werten, und es berechnet den MD5-Hash von JA3 neu, berechnet die Variante JA3N mit sortierten Erweiterungen, dekodiert jedes Feld mit einer Anzahl und markiert GREASE-Werte. Es läuft vollständig in Ihrem Browser.

## JA3, und warum der Hash so ist, wie er ist

JA3 wurde von Salesforce als kompakte, teilbare Kennung für einen TLS-Client geschaffen. Die fünf Felder, die es verwendet, füllt größtenteils die TLS-Bibliothek des Clients und nicht die Anwendung; derselbe Browser oder derselbe Build eines Tools erzeugt daher meist denselben JA3. Das macht ihn nützlich, um Skripte, Bots und ungewöhnliche Bibliotheken zu erkennen, bevor eine Anwendung irgendeinen anderen Kontext hat. Das Tool folgt genau der ursprünglichen Konstruktion: Es entfernt GREASE-Werte (die reservierten Platzhalter 0x0a0a bis 0xfafa, die Browser laut RFC 8701 einfügen), baut den kanonischen String neu auf und bildet seinen MD5-Hash. Zwei der von Salesforce selbst veröffentlichten Beispiele sind als Tests festgelegt; der Hash, den Sie hier erhalten, ist also der JA3, den das Umfeld erwartet.

## GREASE und das Problem der ständigen Änderung

Zwei Dinge machen einen rohen JA3 weniger stabil, als er aussieht, und das Tool zeigt beide. GREASE-Werte sind zufällige Platzhalter, die sich bei jeder Verbindung ändern; würden sie nicht entfernt, erzeugte derselbe Client jedes Mal einen anderen Hash. JA3 schließt sie daher aus, und das Tool zeigt, welche es gefunden und entfernt hat. Das größere Problem ist die Permutation der Erweiterungen: Seit etwa 2024 wählen Chrome und Firefox die Reihenfolge der TLS-Erweiterungen bei jeder Verbindung zufällig, und weil JA3 die Erweiterungen in ihrer Reihenfolge hasht, erzeugt ein einziger Browser heute Tausende verschiedener JA3-Hashes. Das Tool kennzeichnet, ob Ihre Erweiterungen sortiert waren, und zeigt JA3N neben JA3.

## JA3N und JA4

JA3N ist die einfache Abhilfe: Die Liste der Erweiterungen wird vor dem Hashen sortiert, und die Permutation spielt keine Rolle mehr. Das Tool berechnet ihn für Sie; stammt Ihre Eingabe von einem permutierenden Browser, ist JA3N der Wert, der konstant bleibt. JA3N ist allerdings eine Übergangslösung. Der moderne Nachfolger ist JA4, der von sich aus sortiert, SHA256 verwendet, ein lesbares Präfix hinzufügt und sich auf HTTP, SSH, QUIC und TCP erstreckt. Wählen Sie heute einen Fingerprint, auf dem Sie eine Erkennung aufbauen, ist JA4 das bessere Ziel; der JA3 hier dient dem Lesen und Abgleichen der Fingerprints, in denen ältere Tools und Threat Intelligence noch sprechen.

## Was ein Fingerprint ist und was nicht

Ein JA3 kennzeichnet eine TLS-Implementierung, keine Person und keine Absicht. In Verbindung mit dem Verhalten der Anfragen, Erkenntnissen zu Proxys und dem Verlauf eines Kontos ist er ein starkes Signal, für sich allein ein schwaches: MD5-Kollisionen sind möglich, und zwei verschiedene Clients können denselben Hash haben. Behandeln Sie ihn als eine Eingabe für eine Entscheidung, als Hinweis darauf, dass eine Verbindung wie ein bekannter Bot oder eine unerwartete Bibliothek aussieht, und nicht als Beweis für irgendetwas an sich.

## Ergebnisse teilen

Unter den Hashes erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` den JA3-String so, wie die Seite ihn liest, nicht das Feld so, wie eingegeben. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Ein JA3-String besteht aus fünf durch Kommas getrennten Feldern mit Zahlen aus einem TLS-ClientHello, und die Seite liest nur die Zahlen: In jedem Feld überspringt sie jedes Stück, das keine Ganzzahl ist. Der Link enthält daher die Ganzzahlen jedes Felds so, wie geschrieben (einschließlich GREASE-Werten, da die Seite sie markiert), und lässt Leerstellen und alles weg, was die Auswertung überspringt, etwa Text, der mit dem String eingefügt wurde; die Seite, die den Link öffnet, berechnet dieselben Hashes, Markierungen und denselben Hinweis zur Permutation. Enthält das Feld nichts anderes, enthält der Link es so, wie eingegeben.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird der String beim Öffnen des Links nicht an den Server gesendet. Er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann ihn lesen.

- **Öffnen eines Links.** Der String füllt das Feld wie beim Einfügen, und die Seite berechnet die Hashes; es wird nichts gesendet. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
