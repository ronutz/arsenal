## Was das Tool tut

Beschreiben Sie beide Enden eines IPsec-Tunnels, und das Tool nennt, worin sie sich uneinig sind, und dann den Teil, auf den es wirklich ankommt: **welche Phase scheitern würde**. Es läuft vollständig in Ihrem Browser.

## Warum die Phase schon die ganze Diagnose ist

Phase 1 authentifiziert die Peers und schützt die Aushandlung. Phase 2 läuft innerhalb dieses geschützten Kanals und handelt die Security Associations und die Selektoren aus.

Wegen dieser Aufteilung grenzt die Kenntnis der Phase einen Fehler sofort ein. Ein Fehler in Phase 1 betrifft Identität oder Proposal, und Phase 2 wird gar nicht erst versucht; dass sie in den Logs fehlt, ist also zu erwarten und kein zweites Problem. Ein Fehler in Phase 2 heißt, dass sich die Peers erfolgreich authentifiziert haben und sich *danach* uneinig waren, was geschützt werden soll; das weist auf Selektoren, Transforms oder PFS hin und auf nichts anderes.

Wer das verwechselt, sucht in der falschen Hälfte der Konfiguration; deshalb beginnt das Tool mit der Bewertung statt mit einer Tabelle Feld für Feld.

## Die drei False Positives, die das Tool bewusst vermeidet

Ein Analysetool, das gesunde Konfigurationen als defekt meldet, ist schlimmer als keines, weil niemand seine Ausgabe mehr liest. Drei Unterschiede sehen wie Fehler aus und sind keine:

**Proposal-Listen müssen nicht identisch sein.** FortiOS akzeptiert eine Liste, und der Tunnel kommt hoch, wenn irgendein Wert gemeinsam ist. `aes256` mit `aes128 aes256` zu vergleichen und das einen Konflikt zu nennen, wäre falsch; das Tool bildet daher die Schnittmenge und meldet einen gemeinsamen Wert als in Ordnung.

**Lebensdauern müssen nicht übereinstimmen.** Die kürzere gewinnt. Das Tool nennt den wirksamen Wert und sagt ausdrücklich, dass das kein Fehler ist. Stark abweichende Werte bedeuten nur Rekeys in ungünstigen Abständen.

**Selektoren sind gespiegelt.** Das lokale Subnetz des einen Peers ist das entfernte des anderen; ein Vergleich von lokal mit lokal würde also jeden korrekt aufgebauten Tunnel markieren. Der Vergleich ist bewusst über Kreuz angelegt.

Die Befunde sind getrennt in blockierende Konflikte und Unterschiede, die keine Fehler sind, und optisch voneinander abgesetzt. Wer „Ihre Lebensdauern weichen ab“ genauso gewichtet wie „keine gemeinsame Verschlüsselung“, macht die Ausgabe zu Rauschen.

## Was das Tool erkennt

Phase 1: IKE-Version, Authentifizierungsmethode, IKEv1-Modus sowie keine gemeinsame Verschlüsselung, kein gemeinsamer Hash und keine gemeinsame DH-Gruppe. Der Modus wird nur verglichen, wenn die Version v1 ist, denn Main gegen Aggressive bei IKEv2 zu markieren wäre genau ein False Positive der oben beschriebenen Art.

Phase 2: kein gemeinsamer Transform, PFS nur auf einer Seite aktiviert, abweichende DH-Gruppe für PFS, wenn beide Seiten es aktiviert haben, und Konflikte bei den Selektoren in beide Richtungen.

Der Fall PFS verdient eine eigene Erwähnung: Die Logmeldung bei diesem Fehler nennt PFS meist nicht, deshalb kostet er so viel Zeit, und deshalb lohnt sich ein Tool, das ihn benennt.

## Selektoren gelten exakt, nicht ungefähr

`10.1.0.0/16` gegen `10.1.0.0/24` ist ein **Konflikt**, kein Beinahe-Treffer. Beide Seiten müssen sich exakt auf die Netze einigen, die der Tunnel überträgt. Ist ein Peer ein Gerät mit eingeschränkter Unterstützung für Selektoren, müssen beide Enden symmetrisch konfiguriert werden statt bequem.

## Was das Tool Ihnen nicht sagt

Es vergleicht, was Sie angeben. Ein Feld, das auf einer Seite steht und auf der anderen fehlt, gilt als *nicht angegeben* und nicht als Konflikt, denn ein unvollständig eingefügter Text ist kein Beleg für einen Fehler.

Es diagnostiziert auch nicht den Fall, der in der Praxis am meisten Zeit kostet: einen Tunnel, der **up meldet und keinen Datenverkehr überträgt**. Das ist überhaupt kein IPsec-Problem, sondern eine fehlende Route oder eine fehlende Firewall-Richtlinie, und das Tool sagt das, wenn es keinen fatalen Konflikt findet.

## Ergebnisse teilen

Unter der Bewertung erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` beide Peers so, wie eingefügt. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Peer-Namen und geschützte Subnetze beschreiben Ihr Netzwerk (deshalb ergänzt das Popover einen Warnhinweis). Die Seite liest keinen Pre-shared Key, aber wer einen Tunnel beschreibt, schreibt vielleicht einen in eine Zeile `phase1:` oder fügt neben den Direktiven einen phase1-interface-Block ein. Bevor ein Link angeboten wird, wird das Feld nach Zugangsdaten durchsucht, die FortiOS oder ein Standard definiert: eine `set`-Zeile einer Einstellung, die in der [CLI-Referenz von FortiOS 7.6.8](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) einen Passworttyp hat (`psksecret`, `password`, `passwd`, `secret`, `key`, `auth-pwd` und die übrigen; abgerufen am 01.11.2026), oder der `name` einer SNMP-Community ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), Abschnitt 3.2.5), jeder `ENC`-Wert (das Advisory [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007) von Fortinet, abgerufen am 01.11.2026, hält zu solchen Daten, die dort veröffentlicht werden, wo andere sie lesen können, fest: „should currently be considered "easy to decrypt"“), ein Paar `psksecret=` oder `password=` mit denselben Namen auf einer Direktivenzeile, ein privater Schlüssel im PEM-Format ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468)), ein JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)), eine Zeile `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), Abschnitt 11.6.2), ein Passwort in einer URL oder eine AWS-Zugriffsschlüssel-ID. Findet sich eines davon, gibt es keinen Link: Das Popover nennt die Zeile, und Sie setzen einen Platzhalter an seine Stelle und wählen die Schaltfläche erneut; so teilen Sie genau das, was Sie gewählt haben (in einem eingefügten Feld wird nie ein Wert ersetzt, denn das würde ändern, was gesendet wird). Ein Wert, dessen Name nur nach einem Secret aussieht, verhindert den Link nicht; das Popover nennt den ersten solchen Wert.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` folgt, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Das Feld wird wie beim Einfügen gefüllt, und die Seite vergleicht die beiden Peers. Es wird nichts kontaktiert. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.

## Einordnung

Das Tool ergänzt den Artikel zu IPsec-VPN (Virtual Private Network) auf FortiGate, der um dieselbe Frage herum aufgebaut ist und die Topologieentscheidungen behandelt, die das Tool nicht modelliert. Für die Vorbereitung auf NSE 4 unterstützt es Prüfungsziel 5.01.
