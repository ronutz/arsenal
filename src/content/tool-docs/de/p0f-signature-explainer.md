## Was das Tool tut

Fügen Sie eine SYN-Signatur von p0f v3 in der kanonischen Grammatik ein (ver:ittl:olen:mss:wsize,scale:olayout:quirks:pclass), und das Tool dekodiert alle acht Felder, erklärt die Schlüsse aus initialer TTL und Fenster, benennt jede TCP-Option und jedes Quirk-Token und gleicht die Form der Felder mit den dokumentierten Referenzsignaturen von p0f für Betriebssysteme ab. Es akzeptiert eine bloße Signatur oder die Form „label = sig“.

## Warum das Verfahren passiv ist

p0f erstellt Fingerprints, indem es Pakete beobachtet, die ein Host ohnehin gesendet hat (das SYN einer normalen Verbindung), und sendet selbst nie ein Testpaket. Das bedeutet „passiv“ hier, und deshalb bleibt das Verfahren für das Ziel unsichtbar. Das Tool geht noch einen Schritt weiter, hin zum reinen Lernen: Sie fügen eine Signatur ein, die Sie bereits haben, und es wird nichts von Ihrem eigenen Rechner gelesen oder irgendwohin gesendet.

## Der Hinweis auf einen Proxy

Die aufschlussreichste Angabe ist die initiale TTL. Weil jeder Router die TTL verringert, spricht ein Wert nahe 64 für Linux/BSD/Darwin, nahe 128 für Windows und nahe 255 für Netzwerkgeräte. Widerspricht diese TTL des Stacks dem Betriebssystem, das ein User-Agent angibt, haben Sie es mit ziemlicher Sicherheit mit einem Proxy oder NAT zu tun: Das Paket stammt aus dem Stack des Vermittlers, nicht aus dem des Clients. Optionslayout und Quirks verfeinern die Schätzung; das Tool zeigt, was jedes davon beiträgt.

## Ergebnisse teilen

Unter dem Hinweis auf das Betriebssystem erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` die Signatur so, wie eingegeben (`input`), und sonst nichts. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Eine p0f-Signatur beschreibt, wie ein Host ein TCP-SYN aufbaut (TTL, Optionen, Fenster, Quirks); sie nennt weder einen Host noch eine Person.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird die Signatur beim Öffnen des Links nicht an den Server gesendet. Sie bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann sie lesen.

- **Öffnen eines Links.** Die Signatur füllt das Feld wie beim Einfügen, und die Seite dekodiert sie; es wird nichts gesendet. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
