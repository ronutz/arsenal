## Was dieses Tool tut

Fügen Sie eine Access-Control-Richtlinie von Check Point in einer kleinen Lerngrammatik ein (eine oder mehrere `layer`-Deklarationen, ihre Regeln und eine `test`-Zeile), und die Auswertung führt die Verbindung vor Ihren Augen durch die Layer. Jeder Schritt nennt die Regel, die zutraf, sagt, was dieser Treffer tatsächlich bedeutete, und markiert die Drops, die nichts protokollieren. Die Ausgabe ist ein Ablauf, keine bloße Bewertung, denn die Bewertung allein lehrt nichts: Es geht darum, zu sehen, wie eine Verbindung von einem Layer akzeptiert und vom nächsten verworfen wird.

## Der Satz, um den es geht

**Geordnete Layer sind ein UND, kein ODER.** Accept in einem Layer bedeutet, dass die Verbindung *zum nächsten Layer weitergeht*; erlaubt ist sie erst, wenn der letzte geordnete Layer akzeptiert. Ein Drop in einem beliebigen Layer beendet die Auswertung sofort, daher kann ein Permit in einem frühen Layer keinen Datenverkehr retten, den ein späterer Layer ablehnt: Die Ausnahme gehört in den Layer, der ihn sonst ablehnen würde. Genau dieses Verhalten verstehen Leute, die von FortiGate, BIG-IP oder einer einfachen iptables-Chain kommen, am zuverlässigsten falsch, und deshalb zeigt der Ablauf „akzeptiert, weiter zum nächsten Layer“ statt eines Häkchens.

## Die Grammatik

Layer: `layer Network ordered` oder `layer DMZ inline`. Regeln: `1 | permit internal | accept | src=10.0.0.0/8 dst=any svc=443`, mit den Aktionen `accept`, `drop` oder `inline:<layer>`, um eine Unterrichtlinie vorzuschalten. Fügen Sie `nolog` hinzu, um eine Regel mit Track auf None nachzubilden. Alles Weggelassene bedeutet Any. Eine Zeile `test src=... dst=... svc=...` liefert die Verbindung. Zeilen, die mit `#` beginnen, sind Kommentare.

## Was das Tool außerdem meldet

Über den Ablauf hinaus prüft die Auswertung die Richtlinie selbst: eine fehlende explizite Cleanup-Regel, eine Cleanup-Regel ohne Protokollierung (die damit ihren einzigen Zweck verfehlt), Regeln mit Track auf None und paarweise Verdeckung: eine Regel, die nie greifen kann, weil eine frühere bereits auf alles zutrifft, worauf sie zutreffen würde.

Die Warnung vor dem stillen Drop verdient eine eigene Erwähnung. Trifft nichts zu, verwirft die implizite Cleanup-Regel die Verbindung und protokolliert überhaupt nichts. Das ist für alle, die Fehler suchen, die teuerste Tatsache in einem Regelwerk von Check Point, denn das Symptom ist eine Verbindung, die ohne erklärenden Log-Eintrag scheitert, und sie sieht wie ein Netzwerkfehler aus statt wie eine Entscheidung der Richtlinie.

## Ehrliche Grenzen

Service-**Namen** werden nicht aufgelöst: `443` ist eine Portnummer, nicht `https`. Namen auf Ports abzubilden, wäre eine Vermutung über die Objektdatenbank eines anderen. Die Analyse der Verdeckung ist **paarweise**, daher wird eine Regel, die von mehreren früheren Regeln gemeinsam, aber von keiner allein abgedeckt wird, nicht markiert. Nur IPv4. Die Grammatik ist eine bewusst gewählte Teilmenge zum Lernen (echte Regeln kennen zusätzlich VPN (Virtual Private Network), Content, Time, Install On und Negation), doch die hier vermittelte Semantik der Layer gilt für sie alle gleichermaßen.

## Ergebnisse teilen

Unter der Bewertung und der beurteilten Verbindung erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` die Richtlinie so, wie eingefügt. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Regelnamen, Subnetze und die Testverbindung beschreiben Ihr Netzwerk (deshalb ergänzt das Popover einen Warnhinweis). Bevor ein Link angeboten wird, wird das Feld auf Zugangsdaten geprüft, die ein Standard definiert: ein privater Schlüssel im PEM-Format ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), Abschnitt 10), eine `Authorization`-Zeile ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), Abschnitt 11.6.2), eine `Cookie`-Zeile mit einem Wert ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), Abschnitt 4.2.1), ein JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), Abschnitt 1), ein Passwort in einer URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), Abschnitt 3.2.1), eine AWS-Zugriffsschlüssel-ID oder ein `ENC`-Wert von FortiOS; alle abgerufen am 01.11.2026. Die Grammatik hat für keinen davon einen Platz, aber Regelnamen und Kommentarzeilen sind Freitext. Enthält das Feld einen davon, gibt es keinen Link: Das Popover nennt die Zeile, und Sie ersetzen den Wert durch einen Platzhalter und wählen die Schaltfläche erneut. Ein Wert, dessen Name nur wie ein Secret aussieht, verhindert den Link nicht; das Popover nennt den ersten.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` folgt, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Das Feld füllt sich wie beim Einfügen, und die Seite wertet die Layer aus. Es wird nichts kontaktiert. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
