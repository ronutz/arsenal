## Was das Tool tut

Fabric Connect (SPBM) von Extreme benennt Dinge mit drei Nummern, und das Tool dekodiert die, die Sie einfügen, wobei es sie automatisch an ihrer Form erkennt:

- eine **I-SID**, eine 24-Bit-Dienstkennung (1 bis 16.777.215), die eine Dienstinstanz in der Fabric benennt;
- einen **Nickname**, eine 20-Bit-Knotenkennung, hexadezimal als `X.XX.XX` geschrieben; und
- eine **System-ID / B-MAC**, eine 48-Bit-Adresse in MAC-Form, geschrieben als Dreiergruppe mit Punkten wie `00bb.0021.0001`.

Es läuft vollständig in Ihrem Browser.

## Die I-SID

Die I-SID ist das Herzstück eines Fabric-Dienstes. Ein Kunden-VLAN, das auf eine I-SID abgebildet ist, ist ein Layer-2-VSN; eine VRF (Virtual Routing and Forwarding), die auf eine I-SID abgebildet ist, ist ein Layer-3-VSN; die globale Routingtabelle, die ohne I-SID über IS-IS übertragen wird, ist IP Shortcuts. Die Nummer selbst kodiert nicht, welcher dieser Fälle vorliegt, denn das legt die Bereitstellung fest. Daher prüft das Tool den 24-Bit-Bereich und erklärt die Verwendung, statt einen Typ zu raten. Die Standard-I-SID des Fabric-Attach-Netzwerks (FAN) ist 16777001, und das Tool weist eigens darauf hin.

## Der Nickname

Jeder SPBM-Knoten hat einen 20-Bit-Nickname, geschrieben als eine Hexziffer, ein Punkt, zwei Hexziffern, ein Punkt, zwei Hexziffern (zum Beispiel `C.30.00`). Er muss in der gesamten Fabric eindeutig sein, auch über benachbarte IS-IS-Areas hinweg. Das Tool rechnet die Form `X.XX.XX` in ihren Ganzzahlwert um und zurück und prüft den Wertebereich. Die dynamische Vergabe von Nicknames teilt Nicknames aus einem Präfixbereich des Servers zu, etwa `C.30.00-C.3F.FF`.

## Die System-ID / B-MAC

Die B-MAC des Knotens, konfiguriert als System-ID von IS-IS, ist eine 48-Bit-Adresse. Das Tool liest die beiden signifikanten Bits ihres ersten Oktetts: das U/L-Bit (Extreme empfiehlt eine lokal verwaltete Adresse, erstes Oktett `02`) und das I/G-Bit (eine Knotenadresse sollte eine Einzeladresse sein, keine Gruppenadresse).

## Verwendung

Fügen Sie eine dezimale I-SID, einen Nickname der Form `X.XX.XX` oder eine B-MAC als Dreiergruppe mit Punkten ein. Die Erkennung erfolgt an der Form, daher müssen Sie nichts auswählen.

## Ergebnisse teilen

Unter der Auswertung erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält die Kennung so, wie eingegeben (`#input=C.30.00`), und sonst nichts. Alles, was der Link enthält, steht nach dem `#`, und dieser Teil ist laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt: Ein Browser sendet ihn beim Öffnen des Links nicht an den Server, aber er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann ihn lesen.

- **Länge.** Ein Link enthält höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; eine Kennung ist weit kürzer.
- **Öffnen eines Links.** Der Link ist dieselbe Adresse, die auch andere Links in dieses Tool verwenden: Die Kennung füllt das Feld und wird wie bei der Eingabe dekodiert. Wie bei jedem Link in dieses Tool bleibt der Wert nach dem `#`, bis Sie das Feld ändern oder leeren, und verschwindet dann ohne Anfrage aus der Adresse.
