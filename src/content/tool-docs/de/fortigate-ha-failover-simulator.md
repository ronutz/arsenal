## Was das Tool tut

Beschreiben Sie einen FGCP-Cluster (für jede Einheit die ausgefallenen überwachten Schnittstellen, Alter, Priorität und Seriennummer, dazu die Einstellung von Override), und das Tool führt die Wahl der primären Einheit durch, nennt das Kriterium, das sie entschieden hat, und sagt Ihnen, welche Einheit primär wäre, wenn Override umgeschaltet würde. Es läuft vollständig in Ihrem Browser.

## Die Frage, die das Tool beantwortet

„Warum ist die Einheit mit der höheren Priorität nicht die primäre?“

Diese Frage wird ständig gestellt, und die Antwort ist fast immer dieselbe. Ist Override **deaktiviert**, was der Standard ist, vergleicht FGCP das **Alter vor der Priorität**. Eine Einheit, die neu gestartet wurde, hat ein geringes Alter und bleibt daher sekundär, egal wie hoch ihre Priorität ist.

Das ist weder ein Bug noch eine Fehlkonfiguration. Der Standard existiert, damit eine flappende Einheit die primäre Rolle nicht wiederholt an sich reißen und wieder verlieren kann, denn jede Übernahme unterbricht den Datenverkehr. Fortinet hat Stabilität über Präferenz gestellt, und die Einstellung, um das zu ändern, liegt griffbereit.

## Die Vergleichsreihenfolge

| Reihenfolge | Kriterium | Gewinnt |
|---|---|---|
| 1 | Ausgefallene überwachte Schnittstellen | Weniger |
| 2 | Alter (Override deaktiviert) | Höher |
| 3 | Priorität | Höher |
| 4 | Seriennummer | Deterministische Entscheidung bei Gleichstand |

Wird Override aktiviert, rückt die **Priorität vor das Alter**, die Positionen 2 und 3 tauschen also. Die überwachten Schnittstellen stehen in beiden Modi an erster Stelle, die Seriennummer an letzter.

Das Tool zeigt die Reihenfolge, die für Ihre Eingabe tatsächlich gilt, statt der allgemeinen, denn genau diesen Teil haben viele falsch im Kopf.

## Die eigentlich nützliche Ausgabe: der Gegenfall

Neben der siegreichen Einheit berechnet das Tool, welche Einheit mit umgeschaltetem Override primär wäre. Weicht das ab, sagt es das ausdrücklich.

Das zählt, weil „FGT-B ist primär“ eine Tatsache ist, „mit aktiviertem Override wäre stattdessen FGT-A primär, und genau diese eine Einstellung entscheidet über diesen Cluster“ dagegen eine Entscheidung. Das Zweite braucht man tatsächlich, wenn man einen Cluster vor sich hat, der sich unerwartet verhält.

Würde das Umschalten von Override nichts ändern, sagt das Tool auch das und schließt damit in einer Zeile einen ganzen Ermittlungsstrang aus.

## Die anderen Ergebnisse lesen

**Entschieden durch die überwachten Schnittstellen** heißt, dass der Zustand der Schnittstellen den Ausschlag gab, bevor irgendetwas anderes herangezogen wurde. Beheben Sie die ausgefallene Schnittstelle, und der Vergleich geht weiter.

**Entschieden durch die Seriennummer** heißt, dass alles andere gleich war. Das ist deterministisch, aber willkürlich: Soll eine bestimmte Einheit bevorzugt werden, setzen Sie eine Priorität, statt sich darauf zu verlassen, welche Seriennummer höher einsortiert wird.

## Was das Tool nicht modelliert

Nur die Wahl. Es modelliert nicht, ob Sitzungen das Failover überstehen, was von Session Pickup abhängt und davon, ob die Inspektion Proxy-basiert war, und es modelliert kein Split Brain, das ein Ausfall des Heartbeat-Pfads ist und kein Ergebnis der Wahl. Beides behandelt der Artikel zur Hochverfügbarkeit mit FGCP.

## Ergebnisse teilen

Unter der primären Einheit und ihren Befunden erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` den Inhalt des Feldes so, wie eingefügt. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Die Direktivenzeilen nennen Ihre Einheiten und deren Seriennummern (deshalb ergänzt das Popover einen Warnhinweis), und die Seite liest nur die Zeilen `member:` und `override:`; ein daneben eingefügter Block `config system ha` würde also samt Cluster-Passwort mitgesendet. Bevor ein Link angeboten wird, wird das Feld nach Zugangsdaten durchsucht, die FortiOS oder ein Standard definiert: eine `set`-Zeile einer Einstellung, die in der [CLI-Referenz von FortiOS 7.6.8](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) einen Passworttyp hat (`psksecret`, `password`, `passwd`, `secret`, `key`, `auth-pwd` und die übrigen; abgerufen am 01.11.2026), oder der `name` einer SNMP-Community ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), Abschnitt 3.2.5), jeder `ENC`-Wert (das Advisory [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007) von Fortinet, abgerufen am 01.11.2026, hält zu solchen Daten, die dort veröffentlicht werden, wo andere sie lesen können, fest: „should currently be considered "easy to decrypt"“), ein Paar `psksecret=` oder `password=` mit denselben Namen auf einer Direktivenzeile, ein privater Schlüssel im PEM-Format ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468)), ein JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)), eine Zeile `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), Abschnitt 11.6.2), ein Passwort in einer URL oder eine AWS-Zugriffsschlüssel-ID. Findet sich eines davon, gibt es keinen Link: Das Popover nennt die Zeile, und Sie setzen einen Platzhalter an seine Stelle und wählen die Schaltfläche erneut; so teilen Sie genau das, was Sie gewählt haben (in einem eingefügten Feld wird nie ein Wert ersetzt, denn das würde ändern, was gesendet wird). Ein Wert, dessen Name nur nach einem Secret aussieht, verhindert den Link nicht; das Popover nennt den ersten solchen Wert.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` folgt, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Das Feld wird wie beim Einfügen gefüllt, und die Seite führt die Wahl durch, einschließlich des Gegenfalls. Es wird nichts kontaktiert. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.

## Einordnung

Das Tool ergänzt den Artikel zur Hochverfügbarkeit mit FGCP für FortiGate, der erklärt, warum es die Standardreihenfolge gibt und was sich beim Failover sonst noch ändert. Für die Vorbereitung auf NSE 4 unterstützt es Prüfungsziel 1.03.
