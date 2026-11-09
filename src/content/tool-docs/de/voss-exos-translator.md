## Was das Tool tut

Das Tool ist ein Referenzübersetzer zwischen **VOSS** (Fabric Connect / SPBM von Extreme) und **EXOS**. Es stellt gängige Aufgaben nebeneinander, sodass Sie sehen, wie jede Kommandozeile sie ausdrückt, und es sagt ausdrücklich, wo EXOS keine Entsprechung hat, denn EXOS führt SPBM überhaupt nicht aus. Es ist eine Referenz, kein Konfigurationsgenerator: Jeder Befehl stützt sich auf die Dokumentation von Extreme, aber passen Sie Namen, Ports und Nummern an Ihr eigenes Netzwerk an und prüfen Sie alles, bevor Sie etwas anwenden.

## Der entscheidende Unterschied

EXOS und VOSS sind verschiedene Betriebssysteme, die auf der universellen Hardware von Extreme laufen. VOSS ist Fabric-nativ: Es baut eine SPBM-Fabric mit IS-IS, Nicknames, B-VLANs und I-SIDs auf. EXOS unterstützt SPBM nicht. Es tritt einem Fabric-Connect-Netzwerk als Edge mit **Fabric Attach** bei (als FA Proxy oder FA Client), und der FA Server unter VOSS stellt die I-SID dafür bereit. Für die Aufgaben des Fabric-Core, also die SPBM-Instanz, den Nickname, die B-VLANs und ein L3-VSN, gibt es daher schlicht keinen EXOS-Befehl, und das Tool sagt das klar.

## Verwendung

Geben Sie eine Aufgabe oder einen Teil eines Befehls ein (zum Beispiel `i-sid`, `nickname`, `vlan` oder `fabric attach`), und die Tabelle zeigt nur noch die passenden Zeilen. Jede Zeile zeigt das Konzept, den oder die VOSS-Befehle, den oder die EXOS-Befehle oder einen Hinweis, dass es keine Entsprechung gibt, und eine kurze Erklärung. Leeren Sie das Feld, um die ganze Tabelle zu sehen.

## Was das Tool nicht ist

Es erzeugt keine bereitstellbare Konfiguration und übersetzt keine beliebige Konfigurationsdatei Zeile für Zeile. Eine Fabric-Konfiguration hat große Auswirkungen und ist plattformspezifisch; das Tool soll Ihnen helfen, die beiden CLIs zu lernen und miteinander abzugleichen, und keine Konfiguration erzeugen, die Sie ungeprüft in einen Switch im laufenden Betrieb einfügen würden.

## Ergebnisse teilen

Unter den Zuordnungen erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält die Suche so, wie eingegeben (`#input=i-sid`), und sonst nichts; wer ihn öffnet, sieht dieselben Zuordnungen. Ist die Suche leer, werden alle Zuordnungen aufgelistet, und die Schaltfläche bleibt deaktiviert. Alles, was der Link enthält, steht nach dem `#`, und dieser Teil ist laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt: Ein Browser sendet ihn beim Öffnen des Links nicht an den Server, aber er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann ihn lesen.

- **Länge.** Ein Link enthält höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; eine Suche ist weit kürzer.
- **Öffnen eines Links.** Der Link ist dieselbe Adresse, die auch andere Links in dieses Tool verwenden: Die Wörter füllen das Suchfeld wie bei der Eingabe. Wie bei jedem Link in dieses Tool bleibt der Wert nach dem `#`, bis Sie das Feld ändern oder leeren, und verschwindet dann ohne Anfrage aus der Adresse.
