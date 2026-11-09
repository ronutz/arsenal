## Was dieses Tool tut

Es beantwortet eine einzige Frage: Erreicht Datenverkehr zur übersetzten Adresse tatsächlich das Gateway? Nicht, ob die Richtlinie ihn zulässt, sondern ob das Paket überhaupt ankommt.

Der Unterschied ist wichtig, weil der übliche Fehler eine Schicht unter dem Regelwerk liegt. Liegt die übersetzte Adresse in einem Subnetz, mit dem das Gateway direkt verbunden ist, fragt irgendein Gerät per ARP nach ihr, und solange das Gateway nicht antwortet, wird nie etwas gesendet.

## Die Regel

**Automatisches NAT (Network Address Translation)** legt den Proxy-ARP-Eintrag bei der Richtlinieninstallation selbst an, sofern *Automatic ARP configuration* in den Global Properties aktiviert ist.

**Manuelles NAT tut das nicht.** Das hat es noch nie getan. Den Eintrag legt die Administration an.

**Beides spielt keine Rolle**, wenn die übersetzte Adresse in keinem verbundenen Subnetz liegt. Dann fragt im Segment niemand per ARP nach ihr, und etwas weiter vorne muss sie routen; Proxy-ARP ist dann die falsche Stelle für die Suche.

## Das diagnostische Muster

Ein manuelles Static NAT auf eine Adresse im eigenen Subnetz des Gateways, ohne Proxy-ARP-Eintrag, erzeugt eine ganz bestimmte Art von Stille. Die Richtlinie lässt sich sauber installieren. Das Regelwerk sieht richtig aus. Der Server ist intakt.

Und in den Firewall-Logs steht **überhaupt nichts**, kein Drop, kein Reject. Es kam nichts an, das protokolliert werden könnte. Ein Mitschnitt auf der Außenschnittstelle zeigt ARP-Anfragen, die unbeantwortet bleiben.

## Ein Fall, in dem „einfach automatisches NAT verwenden“ nicht genügt

Automatisches NAT legt trotzdem nichts an, wenn *Automatic ARP configuration* in den Global Properties ausgeschaltet ist. Das Tool behandelt diese Kombination genau wie eine manuelle Regel, weil das Ergebnis identisch ist.

Fügen Sie neben automatischen Einträgen auch welche von Hand hinzu, muss *Merge manual proxy ARP configuration* aktiviert sein, sonst bestehen sie nicht nebeneinander.

## Was das Tool bewusst nicht tut

**Es bringt das NAT-Regelwerk nicht in eine Rangfolge.** Veröffentlichte Quellen widersprechen sich, ob manuelle Regeln vor oder nach den automatischen ausgewertet werden: Ein Leitfaden nennt die manuellen zuerst, ein anderer die automatischen Stufen zuerst, und der Administration Guide von Check Point selbst beschreibt beide Arten als unterschiedlich durchgesetzt, ohne die Reihenfolge festzulegen.

Eine Rangfolge hieße, sich für eine Seite zu entscheiden und eine Vermutung als Berechnung auszugeben. Das Verhalten von Proxy-ARP wird überall übereinstimmend beschrieben, deshalb beantwortet das Tool genau das.

## Ehrliche Grenzen

Eine Schnittstelle auf einmal; ein Gateway mit mehreren Schnittstellen zum selben Datenverkehr hin ist eine Frage der Topologie, die das Tool nicht modelliert. Nur IPv4. Und es betrachtet die Erreichbarkeit auf Layer 2, nicht, ob die Zugriffsrichtlinie die Verbindung zulässt, sobald sie ankommt.

## Ergebnisse teilen

Unter der Bewertung erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` das Formular als benannte Werte, immer jedes Feld: `method`, `type`, `natip`, `gateway`, `prefix` und `autoarp` (1 oder 0). Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Das Formular enthält zwei Adressen, ein Präfix und drei Auswahlen, keine davon ein Secret, daher ergänzt das Popover nichts zur Standardwarnung der Website. Jedes Feld kommt mit, nicht nur die, die von den Standardwerten abweichen, sodass ein alter Link seine Bedeutung behält, falls sich ein Standardwert ändert.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` folgt, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Die Werte des Links ersetzen das ganze Formular, und die Seite wertet es aus (Subnetzrechnung; es wird kein ARP gesendet und nichts abgefragt). Eine unbekannte Methode oder ein unbekannter Typ, ein `autoarp` außer 1 oder 0 oder Adressen, die die Seite ablehnt, führen dazu, dass der ganze Link ignoriert wird. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
