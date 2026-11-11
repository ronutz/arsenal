# Auswertungsreihenfolge von PAN-OS-Richtlinien

Fügen Sie ein Regelwerk ein, das Ebenen von Panorama und lokale Firewall-Regeln umfasst. Das Tool bringt es in die Reihenfolge, in der PAN-OS es tatsächlich auswertet, verfolgt auf Wunsch einen Datenfluss bis zu der Regel, die über ihn entscheidet, und meldet die Regeln, die nie greifen, weil etwas darüber bereits zutrifft. Alles läuft im Browser.

## Das Problem, das das Tool angeht

Eine eigenständige Firewall wertet eine einzige geordnete Liste aus, und sie zu lesen ist einfach. Bei einer von Panorama verwalteten Firewall oder einem Tenant von Prisma Access ist das anders. Ausgewertet wird dort nach Ebene und Typ, in dieser Reihenfolge:

1. Gemeinsame Pre-Regeln
2. Pre-Regeln der Gerätegruppe
3. **Lokale Firewall-Regeln**
4. Post-Regeln der Gerätegruppe
5. Gemeinsame Post-Regeln
6. Standardregeln

Die lokalen Regeln, die Administratoren auf der Firewall sehen und bearbeiten können, liegen in der Mitte eines Sandwichs, das sie von der Firewall aus überhaupt nicht bearbeiten können. Das ist die häufigste Überraschung in einer Panorama-Umgebung: Eine lokale Regel, die völlig korrekt aussieht, greift nie, weil eine gemeinsame Pre-Regel zwei Ebenen darüber bereits zugetroffen hat und die Auswertung dort endete.

## Verdeckung, und warum die eigenen Tools des Herstellers sie nicht melden

Das Best-Practice-Dokument von Palo Alto zur Sicherheitsrichtlinie benennt die Lücke ausdrücklich (Commit und Push melden keine Verdeckung):

> Commit and Push doesn't provide shadowing information.

Eine weit gefasste Regel über einer spezifischen fängt den Datenverkehr ab, für den die spezifische Regel geschrieben wurde. Die spezifische Regel greift nie. Nichts beim Push warnt Sie, und das Symptom zeigt sich später, wenn Datenverkehr auf eine Weise behandelt wird, die niemand beabsichtigt hat.

Das Tool meldet Verdeckung und kennzeichnet zwei Fälle besonders. **Über Ebenen hinweg** ist wichtig, weil eine lokale Regel, die von einer gemeinsamen Pre-Regel verdeckt wird, von der Firewall aus weder zu sehen noch zu beheben ist; die Behebung liegt in Panorama. **Eine abweichende Aktion** ist wichtig, weil das Ergebnis dann nicht bloß redundant ist, sondern das Gegenteil dessen, wofür die verdeckte Regel geschrieben wurde.

Die Prüfung auf Verdeckung ist bewusst zurückhaltend. Sie meldet eine Regel nur dann als verdeckt, wenn die Regel darüber in jedem einzelnen Feld eine Obermenge ist, wenn also jedes Paket, auf das die untere Regel zutreffen könnte, bereits vergeben ist. Teilweise Überlappungen werden nicht gemeldet, denn sie sind oft gewollt, und eine Verdeckungsmeldung, die ständig falschen Alarm schlägt, liest niemand. Das wäre schlechter als die derzeitige Haltung des Herstellers, gar nichts zu melden.

## Die Standardregeln sind nicht symmetrisch

Am Ende jedes Regelwerks stehen zwei Standardregeln, und sie tun Gegensätzliches:

- **intrazone-default** lässt allen Datenverkehr innerhalb einer Zone zu
- **interzone-default** blockiert allen Datenverkehr zwischen Zonen

Ein Modell, das „nichts hat zugetroffen“ als ein einziges implizites Deny behandelte, läge bei jedem Datenfluss innerhalb derselben Zone falsch. Das Tool wendet die Standardregel an, die die Zonen verlangen, und sagt, welche es verwendet hat.

Beide lassen sich so ändern, dass sie protokollieren oder Sicherheitsprofile anwenden, und das lohnt sich: Datenverkehr, der die Standardregeln erreicht, ist Datenverkehr, den keine Regel vorhergesehen hat.

## Ein Regelwerk für das Tool schreiben

Eine Regel pro Zeile. Die Ebene steht bewusst an erster Stelle: Sie ist genau das, was das Tool sichtbar machen soll, und eine Grammatik, die sie weglassen ließe, ließe Sie genau das vergessen, was Sie prüfen wollten.

```
shared-pre | block-tor      | deny  | from=any to=any app=tor
dg-pre     | allow-dns      | allow | from=trust to=untrust app=dns svc=application-default
local      | web-out        | allow | from=trust to=untrust app=web-browsing
dg-post    | catch-all-deny | deny  | from=any to=any
```

Felder haben die Form `key=value`, mit Kommas innerhalb eines Werts für Listen. Was fehlt, ist standardmäßig `any`, so wie bei PAN-OS. Akzeptierte Schlüssel: `from`, `to`, `src`, `dst`, `app`, `svc`, `user`. Aktionen sind `allow`, `deny`, `drop`, `reset-client`, `reset-server`, `reset-both`.

## Was das Tool nicht tut

Es liest Ihre Konfiguration nicht, verbindet sich nicht mit Panorama und sammelt nichts. Es bildet weder den Wechsel der App-ID mitten in einer Sitzung ab noch Sicherheitsprofile, NAT (Network Address Translation) oder Richtlinien zur Entschlüsselung. Es betrachtet die **Reihenfolge** der Regeln, die Sie ihm geben, also den Teil, der beim Commit festgelegt wird und der schwer zu überblicken ist.

## Ein Hinweis zur Autorisierung

Diese Website beansprucht keine Autorisierung durch Palo Alto Networks und keine Partnerschaft mit dem Unternehmen. Das Tool betrachtet die Auswertungsreihenfolge, die Palo Alto in der eigenen Dokumentation veröffentlicht. Es ist die Analyse einer öffentlichen Spezifikation, kein Material des Herstellers, und es ist nicht vom Hersteller gebilligt.

## Ergebnisse teilen

Unter der Auswertungsreihenfolge erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält das Regelwerk so, wie eingegeben (`#input=...`). Der verfolgte Datenfluss ist nicht enthalten; ist eine Verfolgung aktiv, sagt das Popover das. Bevor Sie etwas kopieren, ergänzt das Popover einen Warnhinweis: Ein Regelwerk nennt Ihre Zonen, Adressen und Benutzer, lesen Sie es also, bevor Sie den Link senden. Alles, was der Link enthält, steht nach dem `#`, und dieser Teil ist laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt: Ein Browser sendet ihn beim Öffnen des Links nicht an den Server, aber er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann ihn lesen.

- **Länge.** Ein Link enthält höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; für einen längeren gibt es keinen Link, und das Popover nennt die Länge, die er hätte.
- **Öffnen eines Links.** Der Link ist dieselbe Adresse, die auch andere Links in dieses Tool verwenden: Die Regeln füllen das Feld und werden wie beim Einfügen ausgewertet. Wie bei jedem Link in dieses Tool bleibt der Wert nach dem `#`, bis Sie das Feld ändern oder leeren, und verschwindet dann ohne Anfrage aus der Adresse.

## Quellen

- [Palo Alto Networks, Device Groups](https://docs.paloaltonetworks.com/panorama/getting-started/panorama-overview/centrally-manage-firewall-configuration-and-updates-with-panorama/device-groups) (abgerufen am 11.11.2026): Eine Firewall wertet Richtlinienregeln nach Ebene und Typ von oben nach unten aus; lokale Firewall-Regeln erscheinen zwischen den Pre- und den Post-Regeln
- [Palo Alto Networks, Security Policy Rulebase Best Practices](https://docs.paloaltonetworks.com/best-practices/security-policy-best-practices/security-policy-best-practices/deploy-security-policy-best-practices/security-policy-rulebase-best-practices) (abgerufen am 11.11.2026): Der erste Treffer gewinnt, und der Vergleich endet; Commit and Push liefert keine Informationen zur Verdeckung
- [Palo Alto Networks, Security Policy Rule Best Practices](https://docs.paloaltonetworks.com/best-practices/security-policy-best-practices/security-policy-best-practices/deploy-security-policy-best-practices/security-policy-rule-best-practices) (abgerufen am 11.11.2026): Definition der Verdeckung; intrazone-default lässt zu, interzone-default blockiert
- [Palo Alto Networks, Defining Policies on Panorama](https://docs.paloaltonetworks.com/ngfw/help/11-1/panorama-web-interface/defining-policies-on-panorama) (abgerufen am 11.11.2026): Pre-Regeln stehen am Anfang der Regelreihenfolge und werden zuerst ausgewertet; Post-Regeln stehen am Ende und werden nach den Pre-Regeln und den lokalen Regeln der Firewall ausgewertet
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (abgerufen am 27.10.2026): Abschnitt 3.5, das Fragment, das die Werte eines Links von „Ergebnisse teilen“ enthält
