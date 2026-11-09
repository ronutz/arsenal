## Was das Tool tut

Fügen Sie eine geordnete Liste von FortiGate-Richtlinien und optional ein Paket ein. Das Tool geht die Liste von oben nach unten durch, zeigt, welches Feld jede Richtlinie ausgeschlossen hat, nennt die siegreiche Richtlinie und meldet, wenn das Paket bis zum impliziten Deny durchfällt. Lokal und offline: Es wertet die Liste aus, die Sie angeben, und berührt nie ein Gerät.

## Die Analyse, die sich auch allein lohnt

Auch ohne Paket meldet das Tool **Richtlinien, die nie erreicht werden können**, weil eine frühere Richtlinie jedes Feld abdeckt, das eine spätere abdeckt. Das ist die häufigste Form von „Meine Regel funktioniert nicht“: Die Regel ist korrekt und wird schlicht nie erreicht. Es lohnt sich, das regelmäßig laufen zu lassen, nicht nur, wenn etwas kaputtgeht.

## Was das Tool richtigstellt

**Die Richtlinien-ID ist eine Kennung, keine Position.** Richtlinie 3 kann unter Richtlinie 47 stehen, und eine Neunummerierung ändert nichts an der Auswertungsreihenfolge. Viel Material im Netz liest sich, als wäre die ID die Reihenfolge; das Tool nennt die Richtigstellung bei jeder Ausführung, und einer seiner Referenzvektoren (Golden Vectors) ist eine Liste, in der Richtlinie 47 über Richtlinie 3 steht und gewinnt.

Außerdem sagt es immer, dass **jede Richtung eine eigene Richtlinie braucht**: Datenverkehr, der von A nach B zugelassen ist, sagt nichts über B nach A.

## Die Regeln für virtuelle IPs

Eine Richtlinie **mit angewendeter VIP wird anders abgeglichen und hat Vorrang** vor einer gewöhnlichen Richtlinie, daher hält die Reihenfolge allein eine Quelle nicht davon ab, sie zu erreichen. Die Deny-Richtlinie braucht **`match-vip`** und muss darüber stehen. Bei neuen Deny-Richtlinien ist es standardmäßig aktiviert; eine **accept**-Richtlinie kann es überhaupt nicht haben, und das Tool markiert diese Kombination als unmöglich.

## Was das Tool nicht tut

Es löst keine Adressobjekte oder Dienstgruppen auf, daher ist ein benanntes Objekt ein undurchsichtiges Token, sofern es nicht `all` oder `any` ist. Es kann Ihnen also sagen, dass `web-servers` und `all` verschieden sind, aber nicht, ob das eine das andere enthält. Dafür ist das Gerät maßgeblich.

## Ergebnisse teilen

Als Erstes in der Auswertung erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` die Richtlinien und die Paketzeile so, wie eingegeben (eine leere Paketzeile wird weggelassen). Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Richtlinien nennen Ihre Schnittstellen, Adressobjekte und Dienste (deshalb ergänzt das Popover einen Warnhinweis). Beide Felder werden gelesen, und eine Meldung zu Zugangsdaten nennt, welches Feld sie enthält. Bevor ein Link angeboten wird, wird das Feld nach Zugangsdaten durchsucht, die FortiOS oder ein Standard definiert: eine `set`-Zeile einer Einstellung, die in der [CLI-Referenz von FortiOS 7.6.8](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) einen Passworttyp hat (`psksecret`, `password`, `passwd`, `secret`, `key`, `auth-pwd` und die übrigen; abgerufen am 01.11.2026), oder der `name` einer SNMP-Community ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), Abschnitt 3.2.5), jeder `ENC`-Wert (das Advisory [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007) von Fortinet, abgerufen am 01.11.2026, hält zu solchen Daten, die dort veröffentlicht werden, wo andere sie lesen können, fest: „should currently be considered "easy to decrypt"“), ein Paar `psksecret=` oder `password=` mit denselben Namen auf einer Direktivenzeile, ein privater Schlüssel im PEM-Format ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468)), ein JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)), eine Zeile `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), Abschnitt 11.6.2), ein Passwort in einer URL oder eine AWS-Zugriffsschlüssel-ID. Findet sich eines davon, gibt es keinen Link: Das Popover nennt die Zeile, und Sie setzen einen Platzhalter an seine Stelle und wählen die Schaltfläche erneut; so teilen Sie genau das, was Sie gewählt haben (in einem eingefügten Feld wird nie ein Wert ersetzt, denn das würde ändern, was gesendet wird). Ein Wert, dessen Name nur nach einem Secret aussieht, verhindert den Link nicht; das Popover nennt den ersten solchen Wert.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` folgt, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Beide Felder werden so, wie eingegeben, gefüllt (eine Paketzeile, die der Link nicht enthält, lässt dieses Feld leer), und die Seite liest sie. Es wird nichts kontaktiert. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
