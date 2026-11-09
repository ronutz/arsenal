## Was das Tool tut

Fügen Sie die Ausgabe von `diagnose sys session list` ein, und das Tool liest sie Ihnen vor: das Protokoll und seinen Zustand, welche Richtlinie den Flow zugelassen hat, was auf jedem Abschnitt übersetzt wurde, die Timer und ob die Gegenseite überhaupt geantwortet hat. Es läuft vollständig in Ihrem Browser und kontaktiert nie ein Gerät.

## Warum es sich lohnt, die Sitzungstabelle zu lesen

Die Sitzungstabelle ist die maßgebliche Aufzeichnung dessen, was die FortiGate tatsächlich getan hat. Die Richtlinienliste sagt Ihnen, was geschehen sollte; die Sitzung sagt Ihnen, was geschehen ist. Wenn jemand darauf besteht, dass die Firewall den Datenverkehr blockiert, klärt ein Sitzungseintrag, der den Flow als von Richtlinie 7 zugelassen zeigt, mit gezählten Bytes in beide Richtungen, die Frage in einer Zeile.

Das Problem ist die Darstellung. Die Ausgabe ist dicht, positionsabhängig und schwer zu merken; die Information ist also vorhanden und wird nicht gelesen.

## Die Auswertung, die gern übersprungen wird

```
statistic(bytes/packets/allow_err): org=240/4/0 reply=0/0/0
```

Ausgehende Pakete, null Antworten. Die FortiGate hat den Datenverkehr weitergeleitet, und **es kam nichts zurück**. Die Sitzung existiert, also hat eine Richtlinie sie zugelassen; die Firewall blockiert hier nichts. Das Problem liegt jenseits dieses Geräts: beim Routing auf dem Rückweg, beim Zielhost oder bei einem Filter weiter hinten im Pfad.

Das Tool stellt diese Auswertung an den Anfang, statt zwei Zahlen zu melden, denn sie als Firewall-Problem fehlzudiagnostizieren ist der häufigste und teuerste Fehler, der mit dieser Ausgabe gemacht wird.

Bei UDP sagt `proto_state` dasselbe direkter: `00` heißt einseitig, `01` beidseitig.

## Die NAT-Hooks

In den Zeilen `hook=` wird die Übersetzung sichtbar.

```
hook=post dir=org  act=snat 192.168.1.10:52345->93.184.216.34:443(203.0.113.5:52345)
hook=pre  dir=reply act=dnat 93.184.216.34:443->203.0.113.5:52345(192.168.1.10:52345)
```

Das Tupel in Klammern ist die übersetzte Form. `hook=post dir=org act=snat` enthält die Quelle nach NAT, also das, was die Gegenseite sieht. `hook=pre dir=reply act=dnat` enthält das Ziel vor NAT. Eine Sitzung ohne `snat` oder `dnat` auf irgendeinem Abschnitt wurde ohne Übersetzung geroutet, und das Tool sagt das ausdrücklich, statt es nur anzudeuten.

## Was das Tool Ihnen nicht sagt

Felder, deren vollständige Wertetabellen in der Herstellerdokumentation stehen, werden **roh** angezeigt; ihre Bedeutung nennt das Tool nur dort, wo sie dokumentiert und eindeutig ist. TCP-`proto_state` ist der deutlichste Fall: Die beiden Ziffern sind der Verbindungszustand in jeder Richtung, `01` ist die aufgebaute Sitzung, die alle kennen, und den Rest der Tabelle zu veröffentlichen ist Sache von Fortinet. Das Tool sagt, was die Ziffern bedeuten, und erfindet die Zuordnung nicht.

Das ist eine bewusste Grenze. Ein Decoder, der eine Wertetabelle errät, wirkt vollständiger und liegt genau dann falsch, wenn der Wert ungewöhnlich ist, und genau dann lesen Sie die Sitzungstabelle überhaupt.

## Ergebnisse teilen

Als Erstes in der Auswertung erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` die Sitzungen so, wie eingefügt. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Die Ausgabe von `diagnose sys session list` nennt Adressen, Ports, NAT-Übersetzungen und die Richtlinie jedes Flows und kann einen authentifizierten Benutzer nennen (deshalb ergänzt das Popover einen Warnhinweis). Bevor ein Link angeboten wird, wird das Feld nach Zugangsdaten durchsucht, die FortiOS oder ein Standard definiert: eine `set`-Zeile einer Einstellung, die in der [CLI-Referenz von FortiOS 7.6.8](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) einen Passworttyp hat (`psksecret`, `password`, `passwd`, `secret`, `key`, `auth-pwd` und die übrigen; abgerufen am 01.11.2026), oder der `name` einer SNMP-Community ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), Abschnitt 3.2.5), jeder `ENC`-Wert (das Advisory [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007) von Fortinet, abgerufen am 01.11.2026, hält zu solchen Daten, die dort veröffentlicht werden, wo andere sie lesen können, fest: „should currently be considered "easy to decrypt"“), ein Paar `psksecret=` oder `password=` mit denselben Namen auf einer Direktivenzeile, ein privater Schlüssel im PEM-Format ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468)), ein JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)), eine Zeile `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), Abschnitt 11.6.2), ein Passwort in einer URL oder eine AWS-Zugriffsschlüssel-ID. Findet sich eines davon, gibt es keinen Link: Das Popover nennt die Zeile, und Sie setzen einen Platzhalter an seine Stelle und wählen die Schaltfläche erneut; so teilen Sie genau das, was Sie gewählt haben (in einem eingefügten Feld wird nie ein Wert ersetzt, denn das würde ändern, was gesendet wird). Ein Wert, dessen Name nur nach einem Secret aussieht, verhindert den Link nicht; das Popover nennt den ersten solchen Wert.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` folgt, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Das Feld wird wie beim Einfügen gefüllt, und die Seite liest jede Sitzung. Es wird nichts kontaktiert. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.

## Einordnung

Das Tool ergänzt „FortiGate-Richtlinienabgleich erklärt“: Jenes Tool sagt voraus, welche Richtlinie zutreffen *sollte*, dieses bestätigt, welche tatsächlich zugetroffen *hat*. Zusammen schließen sie den Kreis zwischen Konfiguration und Verhalten. Für die Vorbereitung auf NSE 4 unterstützt es die Prüfungsziele 1.02 und 1.04.
