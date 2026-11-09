## Was das Tool tut

Fügen Sie die Ausgabe des F5-Befehls `iqdump`, Zeilen aus `/var/log/gtm` oder den Namen eines Themas ein, und das Tool erklärt das iQuery-Protokoll von F5, ohne ein Gerät anzufassen. iQuery ist das proprietäre, XML-basierte Protokoll, mit dem BIG-IP DNS (früher GTM) mit dem Agenten `big3d` auf sich selbst und auf jedem anderen BIG-IP spricht, das es kennt. Das Tool dekodiert, was Sie einfügen, und erklärt die Architektur dahinter. Es dekodiert und erklärt, läuft vollständig in Ihrem Browser und stützt sich auf die eigene Dokumentation von F5 zu BIG-IP DNS/GTM.

## Ausgabe von iqdump dekodieren

`iqdump` gibt die laufenden iQuery-Daten zwischen zwei Systemen als Strom aus, sodass Sie den Pfad und die SSL-Authentifizierung prüfen können. Fügen Sie die Ausgabe ein, und das Tool liest die Kommentarzeilen im Kopf, den lokalen Hostnamen, auf dem Sie den Befehl ausgeführt haben, den `big3d`-Peer, zu dem die Verbindung bestand, und den Port (4353), die Synchronisierungsgruppe, die abonniert wurde, und den Zeitstempel, dann die Felder des Abschnitts `<xml_connection>` wie `version`, die Build-Zeichenfolge von `big3d` und `connection_id`. Jedes Feld wird erklärt, und eine vorhandene Zeile zum `big3d`-Peer wird als Beleg dafür hervorgehoben, dass der TCP-Pfad und das SSL-Vertrauen zu diesem Agenten funktionieren, denn bei einem gestörten Pfad meldet `iqdump` stattdessen einen Fehler.

## Zeilen aus /var/log/gtm dekodieren

Der Prozess `gtmd` protokolliert den Zustand des iQuery-Mesh in `/var/log/gtm`. Fügen Sie diese Zeilen ein, und das Tool dekodiert die Meldungen zu Zustandswechseln der Systeme, zum Beispiel einen Übergang `green --> red`, der bedeutet, dass ein BIG-IP über iQuery nicht mehr verfügbar ist, dazu die Einträge `SNMP_TRAP` und die Meldungen zu aufgebauten oder verlorenen `big3d`-Verbindungen. Ein Übergang `green --> red` wird mit dem nächsten Prüfschritt markiert: der iQuery-Pfad (TCP 4353, SSL-Vertrauen) zu diesem System und ob dessen `big3d` läuft und in der Version kompatibel ist.

## Die Architektur erklären

Geben Sie ein Thema ein oder klicken Sie darauf, und das Tool erklärt es in den Begriffen von F5: das iQuery-Mesh aus langlebigen Verbindungen, TCP-Port 4353, das zertifikatsbasierte SSL-Vertrauen, das `bigip_add`, `big3d_install` und `gtm_add` einrichten, den Befehl `iqdump` selbst, was iQuery überträgt (die Verfügbarkeit von Objekten und die Metriken zur Lastverteilung, die dynamisches GSLB (Global Server Load Balancing) braucht), die Agenten `gtmd` und `big3d` und die VLAN-Regel, nach der iQuery nur in dem VLAN gesendet wird, in dem ein System es empfängt.

## Ergebnisse teilen

Ganz oben in der Auswertung erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` das Feld so, wie eingegeben, und sonst nichts. Das Popover nennt zuerst, was der Link enthält, dann einen eigenen Warnhinweis: Die Ausgabe kann Ihre BIG-IP-Systeme, Self-IPs und Versionen nennen, lesen Sie sie also, bevor Sie den Link senden. Dann bietet es „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Die Themenübersicht ist kein Ergebnis: Solange sie angezeigt wird (bei leerem Feld, bei `list` oder bei Text, den das Tool nicht erkennt), ist die Schaltfläche deaktiviert. Weder die Ausgabe von `iqdump` noch diese Log-Zeilen enthalten Zugangsdaten: Das Vertrauen in iQuery beruht auf den Zertifikaten, die die Systeme austauschen.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird der Text beim Öffnen des Links nicht an den Server gesendet. Er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann ihn lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Der Text füllt das Feld wie beim Einfügen, und die Seite liest ihn; es wird nichts gesendet. Danach verschwindet der Wert sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.

## Umfang und Grundlagen

Das Tool erklärt und dekodiert; es öffnet nie einen Socket, führt kein `iqdump` aus und ruft nichts ab, und dieselbe Eingabe ergibt immer dieselbe Ausgabe. Es liest die Form der Ausgabe von `iqdump` und von Log-Text, statt einen ganzen iQuery-Austausch zu validieren. Jede Angabe stammt aus den Handbüchern von F5 zu Konzepten und Implementierungen von BIG-IP DNS/GTM, dem Betriebsleitfaden zu LTM und DNS und den K-Artikeln zu Vertrauen und Fehlersuche bei iQuery; das Beispiel ist eine echte, von F5 veröffentlichte Ausgabe von `iqdump`. Beachten Sie, dass das Modul Link Controller in BIG-IP 21.0.0 entfernt wurde. Nichts, was Sie einfügen, verlässt die Seite.
