## Was das Tool tut

Sie sehen ein Ereignis einer WAF (Web Application Firewall) oder eine Zeile aus einem Anwendungslog, und darin steht etwas wie `%{(#_memberAccess["allowStaticMethodAccess"]=true)...}`. Das Tool liest diese Zeichenfolge und sagt Ihnen, was sie bezweckte: welche Konstrukte sie enthält, ob diese darauf hinauslaufen, die Sandbox für Ausdrücke abzuschalten, einen Befehl auszuführen, beides oder keines davon, und zu welcher veröffentlichten Advisory-Familie die Form passt. Es läuft vollständig in Ihrem Browser und wertet nie einen Teil dessen aus, was Sie einfügen.

## Was das Tool nicht ist

Es ist ein Decoder. Es liest Payloads, die bereits irgendwo angekommen sind, und erklärt sie. Es baut keine Payloads, schlägt keine Varianten des eingefügten vor und hat keine Vorlagenbibliothek, aus der es schöpfen könnte: Alles, was es erkennt, ist öffentliche Syntax, dokumentiert in den eigenen Security Bulletins von Apache und sichtbar in den Logs aller, die einen Webserver im öffentlichen Internet betreiben. Ein aufgezeichnetes Artefakt zu erklären, ist die defensive Hälfte der Arbeit. Neue zu erzeugen, ist nicht der Zweck dieser Website, und das Tool ist so gebaut, dass Ihnen sein Quellcode nichts liefert, was Sie nicht auch aus dem Advisory erfahren könnten.

## OGNL in einem Absatz

Object-Graph Navigation Language ist eine Ausdruckssprache, um die Eigenschaften von Java-Objekten zu lesen und zu schreiben. Sie existiert, damit ein Framework der Konfiguration erlauben kann, in eine laufende Anwendung hineinzugreifen: diese Eigenschaft holen, jene Methode aufrufen, das Ergebnis formatieren. Das ist wirklich nützlich, und genau darin liegt das ganze Problem: Ein Ausdruck, der Methoden auf lebenden Objekten aufrufen kann, ist nur sicher, solange die ausgewerteten Ausdrücke von jemandem stammen, dem Sie vertrauen. Apache Struts hat mehrere Jahre damit verbracht, eine Familie von Schwachstellen zu patchen, die alle dieselbe Form hatten: Eingaben von Angreifern erreichten einen Evaluator, der sie als Konfiguration behandelte.

## Die zwei Hälften, nach denen das Tool sucht

Ein funktionierender Versuch gegen die Struts-Familie brauchte zwei Dinge, und das Tool meldet sie getrennt, weil der Unterschied Ihnen sagt, womit Sie es zu tun haben. Das erste ist ein Sandbox-Ausbruch: OGNL beschränkt über ein Objekt namens `_memberAccess`, worauf ein Ausdruck zugreifen darf, und der Ausbruch funktioniert, indem er dieses Objekt erreicht und seine Beschränkungen abschaltet. Das zweite ist ein Ausführungsprimitiv, meist ein Aufruf des Objekts `Runtime` der JVM, gefolgt von `exec`, das einen Prozess des Betriebssystems startet.

Ein Payload mit beidem ist ein echter Ausnutzungsversuch und verdient die volle Behandlung: Klären Sie, ob die Anfrage blockiert wurde, was die Anwendung damit gemacht hat und ob die Laufzeitumgebung gepatcht war. Ein Payload nur mit dem Ausführungsaufruf ist weit häufiger und weit weniger alarmierend, weil eine gepatchte Laufzeitumgebung diesen Aufruf einfach verweigert; meist bedeutet er, dass ein Scanner eine Liste abarbeitet, nicht, dass sich jemand Ihre Anwendung angesehen hat. Ein Payload mit Ausdruckssyntax und sonst nichts ist meist eine Sondierung, die prüft, ob Eingaben überhaupt ausgewertet werden, bevor etwas Aufwendiges gesendet wird. Diese Antwort ist wichtiger, als es klingt: Lautet sie nein, funktioniert auch nichts anderes auf der Liste.

## Advisory-Familien

Wo die Form charakteristisch ist, nennt das Tool die Advisory-Familie: die Schwachstelle im Multipart-Parser von 2017, bei der der `Content-Type`-Header selbst ausgewertet wurde, wenn das Parsen scheiterte, die breitere Member-Access-Familie, deren Fixes immer wieder einschränkten, was ein Ausdruck erreichen konnte, und das Problem von 2018, bei dem Namespace- und Result-Werte ausgewertet wurden, sodass ein URL-Pfad zum Ausführungsvektor wurde. Diese werden als mit dem Payload vereinbar gemeldet, nicht als Identifizierung, denn mehrere Familien teilen eine Form, und ein Payload belegt, was versucht wurde, nicht, was vorhanden war.

## Was das Tool Ihnen bewusst nicht sagt

Drei Dinge, und sie werden jedes Mal angezeigt, statt hinter einem Schalter versteckt, denn die gefährlichste Art, diese Seite zu lesen, ist, keine Befunde zu sehen und daraus zu schließen, dass alles in Ordnung ist.

Es kann Ihnen nicht sagen, ob die Anfrage blockiert wurde. Das steht im WAF-Ereignis, nicht im Payload. Es kann Ihnen nicht sagen, ob die Anwendung den Ausdruck ausgewertet hat; das hängt von Version und Konfiguration des Frameworks ab, nicht von der Zeichenfolge. Und das Fehlen eines erkannten Konstrukts ist kein Fehlen von Risiko: Payloads werden routinemäßig URL-kodiert, doppelt kodiert oder auf mehrere Parameter verteilt; dekodieren Sie also zuerst und lesen Sie danach. Ein sauberes Ergebnis bei einem kodierten Payload bedeutet, dass das Tool die Kodierung gelesen hat, nicht den Angriff.
