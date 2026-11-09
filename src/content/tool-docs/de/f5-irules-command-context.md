# iRules-Befehlskontexte erklärt

Eine iRule ist Tcl mit einem Vertrag: Code läuft, wenn Ereignisse ausgelöst werden, Befehle sind in manchen Ereignissen gültig und in anderen nicht, und eine Handvoll Konstrukte kostet Sie still und leise jeden CPU-Kern bis auf einen. Das Tool liest Ihnen diesen Vertrag vor.

Fügen Sie eine iRule ein, und jeder `when`-Block erscheint als Karte. Die Identität des Ereignisses stammt aus der Master List of iRule Events auf clouddocs, getreu verdichtet, mit seinem Modul und einem Link auf seine Referenzseite; Ereignisse außerhalb der kuratierten Tabelle für den Umfang von BIG-IP LTM (Local Traffic Manager) werden trotzdem geparst und markiert, statt dass etwas geraten wird. Die Befehle des Blocks werden inventarisiert, mit und ohne Namespace gleichermaßen, und jeder ist direkt mit seiner Referenzseite verlinkt.

Erscheint ein Ereignis in mehr als einem Block, wird die Auswertungsreihenfolge nach den dokumentierten Regeln des Befehls priority dargestellt: Werte von 0 bis 1000, Standard 500, niedrigere Werte laufen zuerst, gleiche Priorität läuft in der Reihenfolge des Einfügens, und bei mehreren iRules auf einem virtuellen Server entscheidet die Reihenfolge der Regelliste über die verbleibenden Gleichstände.

Das CMP-Audit ist der Teil, der sich bezahlt macht, und jeder Befund ist mit der Seite zur CMP-Kompatibilität belegt. Globale Variablen sind nicht CMP-kompatibel; der Validator erkennt die globale Form ab v10, und der virtuelle Server wird herabgestuft, das heißt, jede Verbindung, die er verarbeitet, landet auf einem einzigen TMM. Die dokumentierte Alternative für gemeinsam genutzte statische Werte ist der Namespace `static::`, und das Tool sagt das, sobald es die Form sieht. In RULE_INIT erzeugte Schlüssel gibt es einmal pro TMM, daher scheitert eine Entschlüsselung über TMMs hinweg; Statistikprofile zählen pro TMM-Instanz. Das Audit nennt jeden dieser Fälle dort, wo es ihn sieht.

Ein Hinweis zur Ehrlichkeit, bewusst so gebaut: Die Listen, in welchen Ereignissen ein Befehl gültig ist, stehen auf der Referenzseite des jeweiligen Befehls und ändern sich je nach Version; daher verlinkt das Tool die Seite jedes Befehls, statt Gültigkeitstabellen wiederzugeben, die es nicht überprüft hat. Ein einzelner Ereignisname zeigt seine Karte; das Wort `events` zeigt den nach Modulen gruppierten Katalog.

Die iRule wird geparst und gelesen, nie ausgeführt. Alles läuft lokal; nichts, was Sie einfügen, verlässt die Seite.

## Ergebnisse teilen

Oben in der Auswertung erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` das Feld (eine iRule, einen Ereignisnamen oder `events`) so, wie eingefügt, und sonst nichts. Bevor Sie etwas kopieren, ergänzt das Popover einen Warnhinweis: Eine iRule kann interne Hosts, Pools und Data Groups nennen.

Bevor die Seite überhaupt einen Link anbietet, durchsucht sie die iRule nach Schlüsseln und Zugangsdaten, die dort ausgeschrieben sind, wo die Referenzen von F5 sie vorsehen (alle abgerufen am 27.10.2026):

- die Passphrase von `HTTP::cookie encrypt` und `decrypt` ([HTTP::cookie](https://clouddocs.f5.com/api/irules/HTTP__cookie.html));
- ein Schlüssel in der String-Form `AES 128 <hex>` oder der ausgeschriebene Schlüssel von `AES::encrypt` und `AES::decrypt` ([AES::key](https://clouddocs.f5.com/api/irules/AES__key.html), [AES::encrypt](https://clouddocs.f5.com/api/irules/AES__encrypt.html));
- der Wert von `-key` oder `-keyhex` bei `CRYPTO::encrypt`, `decrypt`, `sign` und `verify` ([CRYPTO::encrypt](https://clouddocs.f5.com/api/irules/CRYPTO__encrypt.html));
- ein `Authorization`- oder `Proxy-Authorization`-Header, der mit `HTTP::header insert` oder `replace` geschrieben wird ([HTTP::header](https://clouddocs.f5.com/api/irules/HTTP__header.html)) und dessen Wert [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) (Abschnitte 11.6.2 und 11.7.2) als Zugangsdaten definiert;
- ein Literal, das per `set` einer Variablen zugewiesen wird, die an einer dieser Stellen verwendet wird, wie im Beispiel von `CRYPTO::encrypt` selbst;
- und, aus der Secret-Prüfung der Website, ein privater PEM-Schlüssel, ein JWT, eine Zugriffsschlüssel-ID von AWS oder ein Passwort in einer URL.

Findet die Seite einen davon, gibt es keinen Link: Das Popover nennt die Zeile, und Sie ersetzen den Wert durch einen Platzhalter und wählen die Schaltfläche erneut. Ein Wert, dessen Name nur nach einem Secret aussieht (`set static::api_token "..."`), verhindert den Link nicht; stattdessen nennt ihn der Warnhinweis. Keine Prüfung findet jedes Secret, lesen Sie also, was Sie senden.

Alles, was der Link enthält, steht nach dem `#`, und dieser Teil ist laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt: Ein Browser sendet ihn beim Öffnen des Links nicht an den Server, aber er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann ihn lesen.

- **Länge.** Höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist eine iRule länger, gibt es keinen Link, und das Popover nennt ihre Länge.
- **Öffnen eines Links.** Der Text füllt das Feld wie beim Einfügen, und die Seite liest ihn so, wie sie eingefügten Text liest; die iRule wird nie ausgeführt. Ob angenommen oder nicht, die Werte verschwinden danach sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen, ein Lesezeichen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts, was Sie nicht selbst teilen wollten.
