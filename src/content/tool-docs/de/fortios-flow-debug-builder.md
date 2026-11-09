## Was das Tool tut

Geben Sie an, was Sie verfolgen möchten (eine Adresse, optional Ports, ein Protokoll, eine Paketanzahl), und das Tool stellt die vollständige Befehlsfolge `diagnose debug flow` für eine FortiGate zusammen: das Zurücksetzen auf einen sauberen Ausgangszustand, den Filter, die Anzeigeoptionen, den Trace und das Aktivieren, gefolgt vom Aufräumen. Jede Zeile wird einzeln erklärt. Das Tool erzeugt Text und kontaktiert nichts.

Für den Großteil des Formulars ist Tippen optional: Neben den Portfeldern und der Paketanzahl stehen Pfeile nach oben und unten, und unter dem Protokollfeld gibt es eine Schaltfläche pro Protokollname, den das Tool in seine Nummer umsetzt (`tcp`, `udp`, `icmp`, `icmpv6`, `gre`, `esp`, `ah`, `sctp`); wählen Sie die hervorgehobene, wird das Feld wieder geleert. Eine Protokollnummer, die Adressen und die VDOM werden weiterhin eingegeben.

## Warum ein Generator statt einer Referenz

`diagnose debug flow` ist kein einzelner Befehl, sondern ein Rezept aus vier oder fünf Befehlen, die nur zusammen funktionieren. Die Reihenfolge zählt, das Aufräumen noch mehr, und das Ganze wird so selten gebraucht, dass sich kaum jemand genau daran erinnert. Genau diese Art von Problem löst ein deterministischer Generator.

## Die ausgegebene Reihenfolge und warum

Das Tool gibt **zuerst den Filter und zuletzt das Aktivieren** aus. Der Administrationsleitfaden von Fortinet selbst zeigt `diagnose debug enable` zuerst, vor dem Filter, und **beides funktioniert**; das Tool sagt das in seinen Hinweisen, statt stillschweigend eine Variante zu wählen. Der Grund, den Filter zuerst zu setzen, ist praktisch: Auf einer stark ausgelasteten Firewall wird alles verfolgt, wenn die Ausgabe vor dem Filter eingeschaltet wird, bis der Filter greift.

## Drei Dinge, die das Tool immer sagt

- **Die Anzahl zählt Pakete, keine Sekunden.** `trace start 100` sind hundert Pakete, und eine ausgelastete Schnittstelle kann sie in weniger als einer Sekunde aufbrauchen.
- **Ausgelagerter Datenverkehr erreicht diesen Code nie.** Auf Plattformen mit NP oder SP kann ein korrekter Filter überhaupt nichts liefern, während offensichtlich Datenverkehr fließt. Das ist der häufigste Grund, warum ein guter Trace kaputt aussieht.
- **Zeilennummern in der Ausgabe sind zwischen Versionen nicht stabil.** Gleichen Sie auf den Funktionsnamen ab.

## Was das Tool nicht tut

Es kann Ihre Plattform, Ihre VDOM-Aufteilung oder die Frage, ob Ihre Sitzung ausgelagert wird, nicht kennen, und es prüft nichts gegen ein Gerät. Einen ungefilterten Trace baut es nicht, denn ein ungefilterter Debug-Flow auf einer produktiven Firewall ist der schnellste Weg, eine Konsole unbrauchbar zu machen.

## Ergebnisse teilen

Unter den Befehlen, nach „Kopieren“, erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` das Formular als benannte Werte, immer jedes Feld: `addr`, `saddr`, `daddr`, `port`, `sport`, `dport`, `proto`, `vdom` und `count` so, wie eingegeben (ein leeres Feld wird weggelassen), sowie `iprope` und `timestamp` als 1 oder 0. Die Schaltfläche bleibt deaktiviert, bis ein Filter gesetzt ist, denn ohne Filter erzeugt die Seite nichts. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Das Formular enthält kein Secret (der Generator formatiert Text und führt nichts aus), aber seine Filter nennen Hosts, Ports und eine virtuelle Domain Ihres Netzwerks, daher ergänzt das Popover einen Warnhinweis, bevor Sie etwas kopieren. Jedes Feld wird mitgesendet, nicht nur die, die von den Standardwerten abweichen, sodass ein alter Link seine Bedeutung behält, falls sich ein Standardwert ändert.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` folgt, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Die Werte des Links ersetzen das ganze Formular (ein Textfeld, das der Link nicht enthält, wird geleert), und die Seite erzeugt die Befehle; es wird nichts ausgeführt. Ein anderer Schalterwert als 1 oder 0 oder ein Link ohne Filter führt dazu, dass der ganze Link ignoriert wird. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
