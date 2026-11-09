## Was das Tool tut

Beschreiben Sie eine Anfrage (wohin sie geht, wie sie per Steering umgeleitet wird, ob das Gerät verwaltet ist, ob TLS entschlüsselt wird, ob sie Nutzdaten enthält), und das Tool zeigt den einzelnen Durchlauf: welche Dienste aktiv werden, in welcher Reihenfolge, welche davon **Säulen** und welche **übergreifend** sind und was eine Kette einzelner Appliances stattdessen getan hätte. Deterministisch und offline; das Tool beschreibt eine Architektur, statt eine abzufragen.

## Worum es geht

**DLP (Data Loss Prevention) und Bedrohungsschutz sind keine Säulen.** Sie sind übergreifend: Sie laufen innerhalb desselben Durchlaufs und erhalten, was immer die Säulen entschlüsselt haben. Deshalb deckt ein einziges Datenprofil Web-, Software-as-a-Service- und private Anwendungen gleichermaßen ab, und deshalb muss dieselbe Regel in einer verketteten Architektur viermal in vier Dialekten geschrieben werden.

Bei den Säulen geht es darum, **wohin der Datenverkehr geht**: Secure Web Gateway für das allgemeine Web, Cloud Access Security Broker für Aktivitäten in SaaS, Zero Trust Network Access für eine private Anwendung und Cloud-Firewall für die Ports, die die anderen nicht abdecken. Ändern Sie im Tool das Ziel und beobachten Sie, welche Säulen aktiv werden, während die übergreifenden Engines gleich bleiben.

## Die Behauptung, die Sie prüfen können

Single-Pass bedeutet: **Die Nutzdaten werden einmal entschlüsselt**, und derselbe Datenstrom geht an jede Engine. Verkettete Appliances entschlüsseln und verschlüsseln bei jedem Hop neu, und diese Wiederholung macht den größten Teil der Latenz aus, die man der Inspektion anlastet.

Das Tool nennt diesen Kontrast bei jedem Ergebnis, weil „konvergent“ oft eher eine Behauptung über Bündelung ist als eine über die Architektur. Die Frage, die man einem Hersteller stellen sollte, lautet: Werden die Nutzdaten einmal entschlüsselt oder einmal pro Engine?

## Was das Tool nicht tut

Es modelliert keinen bestimmten Tenant und ist kein Richtliniensimulator. Schalten Sie die Entschlüsselung aus, und das Tool sagt Ihnen, dass alles unterhalb der Anwendungserkennung nur mit Metadaten arbeitet. Das ist der Fehlerfall, den Lernende vor allem verinnerlichen sollen, denn eine Richtlinie, die so geschrieben ist, als wäre der Inhalt sichtbar, steht in der Konsole und sieht korrekt aus.

## Herstellerbezug

Die Namen der Stufen folgen der veröffentlichten Beschreibung der Zero Trust Engine von Netskope, weil die Schulungsinhalte dieser Website diese Plattform behandeln. Das strukturelle Argument (einzelner Durchlauf, übergreifende Inspektion, volle Rechenleistung an der Edge) gilt allgemein für SSE und wird auch so dargestellt.

## Ergebnisse teilen

Unter der Zusammenfassung erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` immer jedes Feld des Formulars: das Ziel und die Steering-Methode als IDs und die vier Kontrollkästchen als 1 oder 0, sodass ein Link seine Bedeutung behält, falls sich ein Standardwert ändert. Die Felder beschreiben eine Anfrage und nennen weder ein System noch eine Person. Die Seite zeigt schon beim Öffnen einen Durchlauf, daher steht die Schaltfläche sofort zur Verfügung. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` folgt, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Die Felder werden gesetzt, als wären sie ausgewählt worden, und der Durchlauf folgt. Ein Link mit einer unbekannten Auswahl wird ignoriert. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
