## Was das Tool tut

Mit dem Virtual Router Redundancy Protocol (VRRP) teilen sich mehrere Router in einem LAN eine gemeinsame Adresse für das Standardgateway. Einer von ihnen, der Active Router, leitet für die virtuelle Adresse weiter und sendet in jedem Intervall ein ADVERTISEMENT; die anderen, die Backups, warten, und derjenige, der zuerst keine ADVERTISEMENTs mehr hört, übernimmt. Wie lange dieses Warten dauert, wer gewinnt und welche MAC-Adresse die Hosts sehen, legt der Standard fest, und der Rechner ermittelt das exakt, in drei Modi:

- **Timer.** Für die Priorität eines Routers und das Advertisement-Intervall: Skew_Time und die Zeit, die ein Backup wartet, bevor er den Active Router für ausgefallen erklärt, mit offengelegter Rechnung, und wann ein Backup mit dieser Priorität nach einem stillen Ausfall und nach einem sauberen Herunterfahren übernimmt.
- **Wahl.** Für zwei bis acht Router, jeder mit Namen, Priorität, primärer Adresse und der Angabe, ob er die virtuelle Adresse besitzt, mit ein- oder ausgeschaltetem Preempt_Mode: wer zum Active Router wird und warum, wer übernimmt, wenn dieser still ausfällt oder sauber herunterfährt, und wie lange das dauert, was bei seiner Rückkehr geschieht und die Timer jedes Routers.
- **Virtuelle MAC.** Für einen Virtual Router Identifier (VRID) und eine Adressfamilie: die Virtual Router MAC Address in drei Schreibweisen.

Die Regeln sind die von [RFC 9568](https://www.rfc-editor.org/rfc/rfc9568.txt), VRRP Version 3 für IPv4 und IPv6 (April 2024), der RFC 5798 ablöst, der seinerseits RFC 3768 abgelöst hatte ([RFC 9568](https://www.rfc-editor.org/rfc/rfc9568.txt), Abstract). Ein Schalter oben im Formular wählt stattdessen VRRPv2 mit den Regeln von [RFC 3768](https://www.rfc-editor.org/rfc/rfc3768.txt) (April 2004, abgelöst durch RFC 5798 und heute RFC 9568), für ältere Geräte, auf denen es noch läuft. Alles wird in Ihrem Browser berechnet, und nichts wird gerundet.

## Namen: Active oder Master

RFC 9568 hat den weiterleitenden Router umbenannt: „The term for the VRRP Router assuming forwarding responsibility has been changed to "Active Router" to be consistent with IETF inclusive terminology“ ([RFC 9568](https://www.rfc-editor.org/rfc/rfc9568.txt), Abschnitt 1.1). Die Wartezeit auf ihn heißt Active_Down_Interval und wird vom Active_Down_Timer gemessen. RFC 3768 und, bevor RFC 9568 ihn ersetzte, RFC 5798 sprechen von Master, Master_Down_Interval und Master_Down_Timer, und die Ausgabe vieler Router tut das noch. Die Seite verwendet die Begriffe der jeweiligen Version: Active Router und Active_Down_Interval für VRRPv3, Master und Master_Down_Interval für VRRPv2.

## Timer: die Eingaben

- **VRRP-Version**: VRRPv3 (RFC 9568) oder VRRPv2 (RFC 3768).
- **Priorität**: eine ganze Zahl von 1 bis 255. „The priority value for the VRRP Router that owns the IPvX address associated with the Virtual Router MUST be 255 (decimal)“, und „VRRP Routers backing up a Virtual Router MUST use priority values between 1-254 (decimal). The default priority value for VRRP Routers backing up a Virtual Router is 100 (decimal)“ ([RFC 9568](https://www.rfc-editor.org/rfc/rfc9568.txt), Abschnitt 5.2.4). Vier Vorlagen füllen das Feld: 255 (der Eigentümer), 254, 100 (der Standardwert) und 1.
- **Advertisement-Intervall**: für VRRPv3 Zentisekunden oder eine Zeit mit Einheit: `100`, `1 s`, `250 ms`, `0.5 s`. Das Feld umfasst 12 Bit an Zentisekunden ([RFC 9568](https://www.rfc-editor.org/rfc/rfc9568.txt), Abschnitt 5.2.7), und das verifizierte Erratum 8301 nennt den konfigurierbaren Bereich ausdrücklich: „Configurable value in the range 1-4095 (centiseconds). Default is 100 centiseconds (1 second)“ ([Errata zu RFC 9568](https://www.rfc-editor.org/errata/rfc9568)). Für VRRPv2 ganze Sekunden von 1 bis 255: Das Feld Adver Int hat 8 Bit und „indicates the time interval (in seconds) between ADVERTISEMENTS. The default is 1 second“ ([RFC 3768](https://www.rfc-editor.org/rfc/rfc3768.txt), Abschnitte 5.1 und 5.3.7). Leer bedeutet den Standardwert der Version. Schreiben Sie Dezimalzahlen mit Punkt.

## Timer: was das Tool berechnet

Für VRRPv3 die Formeln aus [RFC 9568](https://www.rfc-editor.org/rfc/rfc9568.txt), Abschnitt 6.1, in Zentisekunden:

```text
Skew_Time            = (((256 - Priority) * Active_Adver_Interval) / 256)
Active_Down_Interval = (3 * Active_Adver_Interval) + Skew_Time
```

Active_Adver_Interval ist das Intervall, das ein Backup in den ADVERTISEMENTs des Active Routers liest; sein „initial value is the same as Advertisement_Interval“, also die eigene Einstellung des Backups (Abschnitt 6.1), und ein Backup übernimmt den angekündigten Wert, sobald er ein ADVERTISEMENT akzeptiert (Abschnitt 6.4.2). Die Seite zeigt beide Formeln mit Ihren Zahlen: Bei Priorität 100 und 100 cs ergibt (256 - 100) x 100 = 15.600, geteilt durch 256 sind das 60,9375 cs, und 3 x 100 + 60,9375 ergibt 360,9375 cs, also 3,609375 Sekunden.

Für VRRPv2 die Formeln aus [RFC 3768](https://www.rfc-editor.org/rfc/rfc3768.txt), Abschnitt 6.1, in Sekunden:

```text
Skew_Time            = ( (256 - Priority) / 256 )
Master_Down_Interval = (3 * Advertisement_Interval) + Skew_time
```

Die beiden Versionen unterscheiden sich in mehr als der Einheit. In VRRPv3 ist der Skew ein Bruchteil des Intervalls, in VRRPv2 ein Bruchteil einer Sekunde, unabhängig vom Intervall. Beim Standardwert von 1 Sekunde ergeben sie dieselben Werte, aber bei 3 Sekunden wartet ein VRRPv2-Backup mit Priorität 100 9,609375 s, ein VRRPv3-Backup bei 300 cs dagegen 1.082,8125 cs (10,828125 s). Deshalb werden die beiden nie in einer Rechnung gemischt: Ein Intervall in Zentisekunden oder Millisekunden wird bei VRRPv2 abgelehnt, ebenso ein Bruchteil einer Sekunde.

**Exakte Werte.** Jeder Timer ist eine ganze Zahl von 256steln der Einheit der Version und hat daher eine exakte Dezimaldarstellung, die die Seite vollständig ausgibt: 0,78125 cs bei Priorität 254, 99,609375 cs bei Priorität 1. „Der RFC legt keine Rundung fest“ ist eine Aussage über den Standard, keine Abkürzung dieses Tools: Eine Implementierung führt ihre Timer in ihrer eigenen Auflösung, daher kann die Anzeige eines Routers einen gerundeten Wert zeigen.

**Wann ein Backup mit dieser Priorität übernimmt.**

- **Nach einem stillen Ausfall.** Der Active Router verstummt, und der Active_Down_Timer eines Backups, „Timer that fires when a VRRP Advertisement has not been received for Active_Down_Interval“ ([RFC 9568](https://www.rfc-editor.org/rfc/rfc9568.txt), Abschnitt 6.2), läuft ein Active_Down_Interval nach dem letzten ADVERTISEMENT ab, das er gehört hat. Ab dem Ausfall selbst gerechnet liegt das zwischen einem Intervall weniger als Active_Down_Interval (der Ausfall lag kurz vor dem nächsten fälligen ADVERTISEMENT) und dem vollen Active_Down_Interval (er lag kurz nach einem): 2,609375 s bis 3,609375 s bei Priorität 100 und 1 s.
- **Nach einem sauberen Herunterfahren.** Ein Active Router, der herunterfährt, sendet „an ADVERTISEMENT with Priority = 0“ (Abschnitt 6.4.3), und ein Backup, der es empfängt, setzt seinen Timer „to Skew_Time“ (Abschnitt 6.4.2): 0,609375 s bei Priorität 100 und 1 s.

Laufzeit- und Verarbeitungsverzögerungen sind nicht enthalten, ebenso wenig die Zeit, die Switches und Hosts brauchen, um der virtuellen MAC zu ihrem neuen Port zu folgen.

**Priorität 255.** Die Timer des Eigentümers werden berechnet, aber in einem funktionierenden Netzwerk wartet er nie darauf: Beim Start sendet ein Router mit Priorität 255 ein ADVERTISEMENT und vollzieht sofort den Übergang „to the {Active} state“ (Abschnitt 6.4.1), und er verdrängt jede niedrigere Priorität „independent of the setting of this flag“ (Abschnitt 6.1). Als Backup würde er nur warten, wenn ein zweiter Router ebenfalls 255 beanspruchte, und „only a single VRRP Router on the link SHOULD be configured with priority 255“ (Abschnitt 8.3.2).

**Intervalle unter einer Sekunde.** Unter 100 cs ergänzt die Seite die Warnung von RFC 9568 selbst: Eine Warteschlangenverzögerung, die länger ist als das Intervall, kann einen Backup dazu bringen, sich selbst hochzustufen und wieder zurückzufallen, und „this process can repeat many times per second, causing a significant disruption of traffic“ (Abschnitt 2.5).

## Wahl: die Eingaben

- **VRRP-Version** und **Advertisement-Intervall** wie oben; das Intervall ist auf jedem Router gleich.
- **Preempt_Mode**: ein (Standard) oder aus, auf jedem Router gleich. „Controls whether a (starting or restarting) higher-priority Backup Router preempts a lower-priority Active Router. Values are True to allow preemption and False to prohibit preemption. Default is True.“ ([RFC 9568](https://www.rfc-editor.org/rfc/rfc9568.txt), Abschnitt 6.1).
- **Zwei bis acht Router**, jeder mit:
  - einem **Namen**: bis zu 32 Buchstaben, Ziffern, Punkte, Bindestriche oder Unterstriche, ohne Leerzeichen; ein leerer Name wird als R1, R2 usw. gelesen;
  - einer **Priorität**, 1 bis 254, oder 255 für den Eigentümer;
  - seiner **primären Adresse**: bei IPv4 „an IPv4 address selected from the set of real interface addresses“ und „In IPv6, the link-local address of the interface over which the packet is transmitted is used“ ([RFC 9568](https://www.rfc-editor.org/rfc/rfc9568.txt), Abschnitt 1.7), daher muss eine primäre IPv6-Adresse in fe80::/10 liegen ([RFC 4291](https://www.rfc-editor.org/rfc/rfc4291.txt), Abschnitt 2.5.6);
  - **Besitzt die virtuelle Adresse**: aktiviert für den Router, dessen echte Schnittstellenadresse die virtuelle Adresse ist. Das Aktivieren setzt die Priorität auf 255.

## Wahl: die angewandten Regeln

Die Seite spielt den Zustandsautomaten von RFC 9568 (Abschnitt 6.4) über vier Zeitpunkte durch, wobei alle Router gemeinsam starten und jedes ADVERTISEMENT sofort ankommt:

1. **Beim Start.** Der Eigentümer sendet ein ADVERTISEMENT und vollzieht sofort den Übergang „to the {Active} state“; jeder andere Router startet als Backup, dessen Active_Down_Timer auf Active_Down_Interval gesetzt ist (Abschnitt 6.4.1). Ohne Eigentümer hat die höchste Priorität das kürzeste Active_Down_Interval, daher läuft deren Timer zuerst ab, und dieser Router wird Active; die anderen akzeptieren sein ADVERTISEMENT, dessen Priorität höher ist als ihre, und bleiben Backup (Abschnitt 6.4.2).
2. **Ein stiller Ausfall des Active Routers.** Der beste verbleibende Backup übernimmt, wenn sein eigener Timer abläuft, mit den Zeiten aus dem Modus „Timer“.
3. **Ein sauberes Herunterfahren des Active Routers.** Sein ADVERTISEMENT mit Priorität 0 setzt den Timer jedes Backups auf dessen eigene Skew_Time, und der beste verbleibende Backup mit dem kürzesten Skew übernimmt zuerst.
4. **Seine Rückkehr.** Der Eigentümer wird sofort wieder Active, unabhängig von Preempt_Mode. Jeder andere Router startet als Backup: Ein Backup setzt seinen Timer bei einem ADVERTISEMENT zurück, „If Preempt_Mode is False, or if the Priority in the ADVERTISEMENT is greater than or equal to the local Priority“, und verwirft es sonst (Abschnitt 6.4.2). Bei eingeschaltetem Preempt_Mode und höherer Priorität ignoriert er also die ADVERTISEMENTs des aktuellen Active Routers, sein eigener Timer läuft ein Active_Down_Interval nach seinem Start ab, und er übernimmt; der aktuelle Active Router empfängt eine höhere Priorität und kehrt zu Backup zurück (Abschnitt 6.4.3). Bei ausgeschaltetem Preempt_Mode oder mit derselben Priorität wie der aktuelle Active Router bleibt er Backup.

**Gleichstand.** Zwei Backups mit derselben höchsten Priorität laufen gleichzeitig in den Timeout und werden beide Active. Ein Active Router kehrt zu Backup zurück, wenn „the Priority in the ADVERTISEMENT is equal to the local Priority and the primary IPvX address of the sender is greater than the local primary IPvX address (based on an unsigned integer comparison of the IPvX addresses in network byte order)“ (Abschnitt 6.4.3), daher bleibt die höhere primäre Adresse Active. Der Vergleich ist numerisch: 192.0.2.10 schlägt 192.0.2.9, und fe80::1:0 schlägt fe80::ff. Die Adresse entscheidet einen Gleichstand nur zwischen Active Routern; deshalb bleibt ein Router, der mit derselben Priorität wie der aktuelle Active Router zurückkommt, Backup, selbst wenn seine Adresse höher ist. Teilen sich zwei Router eine Priorität, warnt die Seite, denn RFC 9568 verlangt: „all Virtual Routers SHOULD be configured with different priorities and with sufficient differences in the priorities“ (Abschnitt 8.3.2).

Das Ergebnis besteht aus der Bewertung (wer Active ist und warum), den vier Zeitpunkten der Reihe nach, jeder mit Regel und Zeit, und einer Tabelle der Router in der Reihenfolge der Wahl mit Skew_Time und Active_Down_Interval jedes Routers.

## Virtuelle MAC

„IPv4 case: 00-00-5E-00-01-{VRID} (in hex, in network byte order)“ und „IPv6 case: 00-00-5E-00-02-{VRID} (in hex, in network byte order)“: „The first three octets are derived from the IANA's Organizationally Unique Identifier (OUI)“, die nächsten beiden sind der Block, der VRRP für die Familie zugewiesen ist, und das letzte ist die VRID ([RFC 9568](https://www.rfc-editor.org/rfc/rfc9568.txt), Abschnitt 7.3). Für die VRID gilt: „Configurable value in the range 1-255 (decimal). There is no default“ (Abschnitt 6.1). Die Seite schreibt die Adresse auf drei Arten: mit Bindestrichen, wie der RFC sie schreibt (00-00-5E-00-01-0A), mit Doppelpunkten (00:00:5e:00:01:0a) und in drei durch Punkte getrennten Vierergruppen (0000.5e00.010a). Sie gibt außerdem das letzte Oktett hexadezimal an und wohin ADVERTISEMENTs gesendet werden: 224.0.0.18 für IPv4, ff02::12 für IPv6, IP-Protokoll 112 (Abschnitte 5.1.1 und 5.1.2). VRRPv2 verwendet denselben IPv4-Block ([RFC 3768](https://www.rfc-editor.org/rfc/rfc3768.txt), Abschnitt 7.3) und hat keinen für IPv6.

Der Active Router beantwortet ARP und Neighbor Solicitations für die virtuelle Adresse mit dieser MAC, „The Active Router MUST NOT respond with its physical MAC address“, und das „allows the host to always use the same MAC address, regardless of the current Active Router“ (Abschnitte 8.1.2 und 8.2.2).

## Was das Tool ablehnt, und warum

- **Priorität 0.** Wird nie konfiguriert: „The priority value zero (0) has special meaning, indicating that the current Active Router has stopped participating in VRRP. This is used to trigger Backup Routers to quickly transition to the Active Router without having to wait for the current Active_Down_Interval“ ([RFC 9568](https://www.rfc-editor.org/rfc/rfc9568.txt), Abschnitt 5.2.4). Die Seite sagt das und fragt nach 1 bis 254 oder 255 für den Eigentümer.
- **Priorität über 255**, die das 8-Bit-Feld nicht aufnehmen kann, und alles, was keine ganze Zahl ist.
- **Ein Eigentümer, dessen Priorität nicht 255 ist**, und **Priorität 255 bei einem Router, der nicht als Eigentümer markiert ist** (Abschnitt 6.1 reserviert sie).
- **Zwei Eigentümer.** Es SHOULD (sollte) nur einen geben (Abschnitt 8.3.2). In der veröffentlichten Fassung lässt Abschnitt 7.1 einen Router jedes ADVERTISEMENT verwerfen, wenn er selbst der Eigentümer ist, sodass zwei Eigentümer beide Active bleiben; das verifizierte Erratum 8298 ändert diese Prüfung so, dass die höhere primäre Adresse gewinnt. Das Ergebnis hängt davon ab, welchem Text eine Implementierung folgt, daher rät die Seite nicht.
- **VRID 0 oder über 255** und eine VRID in Hexadezimalschreibweise: Die VRID wird dezimal eingegeben.
- **Ein Intervall von 0**, das das verifizierte Erratum 8301 ausschließt, weil ein Intervall von null jeden Backup sofort in den Timeout laufen lässt; **über 4095 cs** (40,95 s) bei VRRPv3 oder **über 255 s** bei VRRPv2; und **ein Bruchteil der Einheit der Version** (255 ms sind 25,5 cs).
- **Gemischte Rechnungen aus VRRPv2 und VRRPv3**: ein Intervall in Zentisekunden oder Millisekunden bei VRRPv2 sowie IPv6 mit VRRPv2, das „is intended for use with IPv4 routers only“ ([RFC 3768](https://www.rfc-editor.org/rfc/rfc3768.txt), Abschnitt 1.2).
- **Router, die IPv4 und IPv6 mischen** (ein Virtual Router gehört zu einer Familie, RFC 9568, Abstract), **eine primäre IPv6-Adresse, die nicht Link-Local ist**, **zwei Router mit derselben primären Adresse** (nach Wert verglichen, daher sind fe80::1 und fe80:0:0:0:0:0:0:1 dieselbe), zwei Router mit demselben Namen, weniger als zwei oder mehr als acht Router und eine Adresse mit Präfixlänge oder Zone.

## Durchgerechnete Beispiele

Die Beispiele sind das VRRP-Lab aus Kapitel 4.2 des offenen Kurses [Betrieb und Wartung von LAN-Switches](/materials/lan-switch-operations-and-maintenance): VRID 10 im VLAN 10, das virtuelle Gateway 10.1.10.1, SW-CORE-01 mit Priorität 110 und 10.1.10.2 und SW-CORE-02 mit Priorität 100 und 10.1.10.3, Preemption eingeschaltet, ein Intervall von einer Sekunde.

- **Timer**, Priorität 100 bei 100 cs: Skew_Time 60,9375 cs (0,609375 s), Active_Down_Interval 360,9375 cs (3,609375 s). Ein unterbrochener Link verlagert das Gateway 2,609375 s bis 3,609375 s nach dem Ausfall, die „about 3.6 s“ des Labs; ein geordnetes Herunterfahren verlagert es 0,609375 s nach dem ADVERTISEMENT mit Priorität 0, die „about 0.6 s“ des Labs.
- **Wahl**: SW-CORE-01 hat die höhere Priorität und wird 357,03125 cs (3,5703125 s) nach dem gemeinsamen Start zum Active Router; fällt er aus, übernimmt SW-CORE-02 wie oben; kommt SW-CORE-01 bei eingeschalteter Preemption zurück, übernimmt er die Rolle 3,5703125 s nach seinem Start wieder. Bei ausgeschalteter Preemption bleibt er Backup, und genau das ist der abschließende Tipp des Labs.
- **Virtuelle MAC**, VRID 10, IPv4: 00-00-5E-00-01-0A, die Adresse, die die Hosts des Labs für 10.1.10.1 lernen.
- **Die Tabelle des Artikels**, bei 100 cs: Priorität 254 wartet 300,78125 cs, 200 wartet 321,875 cs, 1 wartet 399,609375 cs; bei 1 cs wartet ein Backup mit Priorität 254 3,0078125 cs, etwa 30 Millisekunden.
- **Die Grenzen**: Bei 4095 cs wartet ein Backup mit Priorität 1 16.364,00390625 cs (163,6400390625 s); ein VRRPv2-Backup mit Priorität 1 und 255 s wartet 765,99609375 s.
- **Ein Gleichstand**: Zwei Router mit Priorität 100 und den Adressen 192.0.2.2 und 192.0.2.3 werden nach 3,609375 s beide Active, und 192.0.2.3 bleibt Active; fällt er aus, übernimmt 192.0.2.2, und wenn 192.0.2.3 zurückkommt, bleibt er Backup, mit oder ohne Preemption.

## Was das Tool nicht tut

Es spricht mit keinem Router: Prioritäten, Adressen und Intervall stammen von Ihnen. Es nimmt an, dass jeder Router dasselbe Intervall und denselben Preempt_Mode hat, dass alle gemeinsam starten und dass ADVERTISEMENTs ohne Verzögerung ankommen. Tracking (das Senken einer Priorität, wenn ein Uplink ausfällt), Preemption-Verzögerungen, Accept_Mode, das Gratuitous ARP und wie schnell Switches die MAC neu lernen, das Zusammenspiel von VRRPv2 und VRRPv3 (RFC 9568, Abschnitt 8.4) und HSRP liegen außerhalb des Tools. Standardwerte und Befehle der Hersteller sind nicht enthalten: Lesen Sie dafür die Dokumentation des Herstellers und die Herstellerfolien des Kurses. Um eine Folge von Ausfällen und Rückkehren Schritt für Schritt durchzuspielen, verwenden Sie das Lab zur Wahl im Artikel [First-Hop-Redundanz](/learn/first-hop-redundancy-vrrp-and-hsrp).

## Ergebnisse teilen

Unter der Bewertung erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` den Modus, die Version und die Felder des angezeigten Modus so, wie eingegeben: immer `mode` (`timers`, `election` oder `mac`) und `version` (`3` oder `2`); im Modus „Timer“ `priority` und, falls eingegeben, `interval`; im Modus „Wahl“ `routers`, ein Router pro Zeile in der Form `<name> <priority> <address>`, mit ` owner` nach dem Eigentümer und `*` für ein leer gelassenes Feld, `preempt` (`1` oder `0`) und, falls eingegeben, `interval`; im Modus „Virtuelle MAC“ `vrid` und `family` (`ipv4` oder `ipv6`). Die Felder der anderen Modi sind nicht enthalten. Im Modus „Wahl“ ergänzt das Popover einen Warnhinweis: Routernamen und primäre Adressen beschreiben ein privates Netzwerk, lesen Sie sie also, bevor Sie den Link senden.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 02.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher werden diese Werte beim Öffnen des Links nicht an den Server gesendet. Sie bleiben in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann sie lesen.

- **Länge.** Ein Link enthält höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; diese Felder sind weit kürzer.
- **Öffnen eines Links.** Modus, Version und die Felder des Modus werden so gesetzt, wie eine Eingabe sie setzen würde (ein Intervall, das der Link nicht enthält, bleibt leer, was den Standardwert bedeutet; ein fehlendes `preempt` bedeutet „ein“), die anderen Modi behalten ihre Werte, und die Seite rechnet. Ein Link mit unbekanntem Modus, unbekannter Version, unbekanntem Wert für `preempt` oder unbekannter Familie, mit einem Feld eines anderen Modus, einem fehlenden Pflichtfeld, einem Wert über zwei Zeilen (außer der Routerliste) oder einer Routerliste, die nicht aus zwei bis acht Zeilen mit drei oder vier Wörtern besteht, wird ignoriert. Ob angenommen oder nicht, die Werte verschwinden danach sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen, ein Lesezeichen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts, was Sie nicht selbst teilen wollten.

## Herkunft

Die Engine ist feste Arithmetik und eine feste Lesart des Zustandsautomaten, ohne Uhr, ohne Netzwerk und ohne Zufall. Sie bringt 133 Referenzvektoren (Golden Vectors) mit (Satz `vrrp-timer-calculator-golden-2026-11-02`): 26 Timer-Zeilen (Prioritäten 1, 100, 200, 254 und 255 beim Standardintervall, bei 1 cs und bei 4095 cs sowie VRRPv2 bei 1 s und 255 s), 14 Wahlen, 12 virtuelle MACs, die drei Beispiele, Schreibweisen und Standardwerte des Intervalls, die Sätze, die die Regeln wiedergeben, und 51 Ablehnungen. Jeder erwartete Wert und jedes Ergebnis einer Wahl wurde von einer getrennten Implementierung abgeleitet, nicht durch Ausführen dieser Engine: die Timer mit den Formeln des RFC in den exakten Brüchen von Python und die Wahlen mit einer ereignisdiskreten Simulation des Zustandsautomaten von RFC 9568 (Timer, ADVERTISEMENTs, Priorität 0, Preemption und Entscheidung über die Adresse bei Gleichstand) über die vier Zeitpunkte, mit dem eigenen Adressvergleich von Python. Die Errata wurden am selben Tag gelesen: RFC 9568 hat sechs verifizierte Errata, von denen 8301 (der Bereich 1 bis 4095) und 8298 (zwei Eigentümer) dieses Tool prägen, während die anderen (7947 und 7949 zum Gratuitous ARP, 8299 und 8300 zu Empfangsprüfungen) keinen Timer ändern; RFC 3768 hat keine.

## API

Dieselbe Engine beantwortet `/api/v1/vrrp-timer-calculator` in der HTTP-API der Website; der Vertrag steht auf der [API-Seite](/api), die auch angibt, ob diese Website die API bereitstellt.

- **Anfrage.** Ein JSON-Objekt. Timer: `{"mode": "timers", "version": 3, "priority": 100, "interval": "100"}`; `version` (standardmäßig 3) und `interval` (Standardwert, wenn es fehlt) sind optional, und ein Intervall ohne Einheit gilt in der Einheit der Version. Wahl: `{"mode": "election", "version": 3, "interval": "100", "preempt": true, "routers": [{"name": "SW-CORE-01", "priority": 110, "address": "10.1.10.2"}, {"name": "SW-CORE-02", "priority": 100, "address": "10.1.10.3"}]}`; `preempt` (standardmäßig true), `name` und `owner` (standardmäßig false) sind optional, und die `priority` eines Eigentümers darf fehlen. Virtuelle MAC: `{"mode": "mac", "vrid": 10, "family": "ipv4"}`.
- **Antwort, Timer.** `mode`, `version`, `unit` (`cs` oder `s`), `names` (`rfc`, `interval`, `down`, `downTimer`, `activeRole`, `activeState`), `priority`, `owner`, `interval`, `intervalSeconds`, `intervalDefault`, `skewTime`, `skewTimeSeconds`, `downInterval`, `downIntervalSeconds`, `skewNumerator`, `arithmetic` (`skew`, `down`: die Formeln mit den Werten, etwa `Skew_Time = ((256 - 100) * 100) / 256 = 15600 / 256 = 60.9375 cs`), `failover` (`silentFrom`, `silentTo`, `shutdown` und ihre `...Seconds`; null bei Priorität 255), `warnings` und `notes`. Jede Zeit ist exakter Dezimaltext mit „.“ als Dezimalzeichen.
- **Antwort, Wahl.** `mode`, `version`, `unit`, `names`, `family`, `preempt`, `preemptDefault`, `interval`, `intervalSeconds`, `intervalDefault`, `routers` (jeder mit `index`, `name`, `priority`, `address`, `owner`, `rank`, `startState`, `skewTime`, `skewTimeSeconds`, `downInterval`, `downIntervalSeconds`), `ranking`, `active`, `activeReason` (`owner`, `priority` oder `address-tie`), `steps` (vier: `event` `start`, `failure`, `shutdown` oder `return`; `outcome`; `active`, `activeName`, `subject`, `tied`, `after`, `afterSeconds`, `from`, `fromSeconds`, `text`), `verdictText`, `warnings` und `notes`.
- **Antwort, virtuelle MAC.** `mode`, `version`, `family`, `vrid`, `vridHex`, `block`, `hyphen`, `colon`, `dotted`, `multicastGroup`, `ipProtocol` und `notes`.
- **Fehler.** HTTP 400, `invalid_input`, mit der Meldung der Engine, zum Beispiel `Priority 0 is never configured: RFC 9568 reserves it for the Active Router to indicate it is relinquishing responsibility for the Virtual Router. ...`.

## Quellen

- [RFC 9568, Virtual Router Redundancy Protocol (VRRP) Version 3 for IPv4 and IPv6, April 2024](https://www.rfc-editor.org/rfc/rfc9568.txt) (abgerufen am 02.11.2026): Abschnitte 1.1, 1.7, 2.5, 5.1, 5.2.4, 5.2.7, 6.1 bis 6.4, 7.3, 8.1.2, 8.2.2 und 8.3.2. Ein Proposed Standard, der RFC 5798 ablöst; weder abgelöst noch aktualisiert
- [Errata zu RFC 9568](https://www.rfc-editor.org/errata/rfc9568) (abgerufen am 02.11.2026): sechs verifizierte Errata; 8301 (Advertisement_Interval 1 bis 4095 Zentisekunden) und 8298 (ein Eigentümer, der ADVERTISEMENTs empfängt) gelten hier
- [RFC 3768, Virtual Router Redundancy Protocol (VRRP), April 2004](https://www.rfc-editor.org/rfc/rfc3768.txt) (abgerufen am 02.11.2026): VRRP Version 2, Abschnitte 1.2, 5.1, 5.3.7, 6.1, 6.4 und 7.3. Ein Draft Standard, abgelöst durch RFC 5798, der seinerseits durch RFC 9568 abgelöst ist; nur für ältere Geräte gelesen; [Errata-Seite](https://www.rfc-editor.org/errata/rfc3768): keine Errata
- [RFC 4291, IP Version 6 Addressing Architecture, February 2006](https://www.rfc-editor.org/rfc/rfc4291.txt) (abgerufen am 02.11.2026): Abschnitte 2.2 und 2.5.6
- [RFC Editor, RFC-Index (XML)](https://www.rfc-editor.org/rfc-index.xml) (abgerufen am 02.11.2026): der Status von RFC 9568, RFC 5798 (abgelöst durch RFC 9568), RFC 3768 (abgelöst durch RFC 5798) und RFC 4291
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (abgerufen am 02.11.2026): Abschnitt 3.5, das Fragment, das die Werte eines Links von „Ergebnisse teilen“ enthält
