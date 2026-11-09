## Was das Tool tut

Fügen Sie einen Konfigurationsblock ltm pool ein, und das Tool erklärt dessen Lastverteilungsmethode in den Begriffen von F5: wonach die Methode gewichtet, wie sie sich verhält, wann der Hersteller sie empfiehlt und worauf Sie achten müssen. Dann gleicht es die Methode mit dem Rest des Pools ab und markiert die Kombinationen, die still fehlschlagen, etwa Ratio-Gewichte unter einem Modus, der sie ignoriert, oder einen gewichteten Modus ohne die Verbindungslimits, die er braucht. Sie können auch einen einzelnen Methodennamen eingeben, um seine vollständige Erklärung zu sehen, das Wort „methods“ für den ganzen Katalog, oder im Bereich „Hilfe bei der Auswahl“ zwei Fragen beantworten und eine belegte Empfehlung erhalten. Alles läuft in Ihrem Browser und kontaktiert kein Gerät.

## Statisch und dynamisch, Member und Node

Die 19 dokumentierten Modi teilen sich entlang zweier Achsen. Statische Modi, Round Robin und Ratio, entscheiden allein aus der Konfiguration und bemerken den laufenden Zustand der Server nie. Dynamische Modi reagieren auf etwas Gemessenes: offene Verbindungen, Sitzungen, Antwortgeschwindigkeit oder Servermetriken aus Monitoren. Die zweite Achse ist das Suffix für den Geltungsbereich. Ein Member-Modus zählt die Arbeit eines Servers nur innerhalb dieses Pools; ein Node-Modus zählt sie über alle Pools, zu denen der Server gehört, und das ist die faire Zählung, wenn dieselben Maschinen mehrere Pools bedienen.

## Wonach jede Familie gewichtet

Round Robin gewichtet nach nichts außer danach, wer an der Reihe ist, und ist der Standard. Ratio folgt einem Verhältnis, das Sie festlegen. Least Connections wählt das Member mit den wenigsten offenen Verbindungen genau in diesem Moment und gleicht so ungleiche Verbindungsdauern aus. Observed glättet diese Momentaufnahme zu einem Verhältnis pro Sekunde, und Predictive nimmt den Trend hinzu und bevorzugt Member, die besser werden. Weighted Least Connections liest das connection-limit jedes Members als dessen Kapazität und verteilt nach dem Prozentsatz davon. Ratio Least Connections verbindet Ihr festgelegtes Verhältnis mit der aktuellen Zahl. Dynamic Ratio nimmt Ihnen das Verhältnis ganz ab und berechnet es fortlaufend aus Servermessungen neu. Least Sessions und Ratio (session) zählen Persistenzsitzungen statt Verbindungen, und Fastest folgt der Antwortgeschwindigkeit, erfasst als ausstehende Layer-7-Anfragen.

## Die Gegenprüfungen

Die Beobachtungen sind deterministische Auswertungen der eingefügten Konfiguration anhand dokumentierter Regeln. Member-Ratios unter einem Modus ohne Ratio werden markiert, weil Ratios laut K6406 nur unter einer Ratio-Methode gelten. Weighted Least Connections (member) mit einem Member, dessen connection-limit auf dem Standardwert 0 steht, wird markiert, weil die Referenz für jedes Member ein Limit verlangt. Ein Pool mit Least Connections erhält den Hinweis zu Slow Ramp, weil die Referenz diese Kombination eigens hervorhebt und der Standard-Ramp 10 Sekunden beträgt. Least Sessions nennt seine Voraussetzung am virtuellen Server, ein Persistenzprofil, das Sitzungen verfolgt. ignore-persisted-weight wird erklärt, wenn es gilt, und markiert, wenn der Modus außerhalb seines dokumentierten Geltungsbereichs liegt. Prioritätsgruppen werden zusammen mit min-active-members gelesen, der Einstellung, die die prioritätsbasierte Aktivierung tatsächlich scharf schaltet.

## Die Auswahlhilfe

Zwei Fragen steuern eine feste Entscheidungstabelle: wie sich die Kapazitäten der Member unterscheiden (gleich, als Verhältnis festgelegt, als Verbindungslimits beziffert oder für Sie gemessen) und worauf die Methode reagieren soll (auf nichts, auf laufende Verbindungen, auf den Trend, auf Sitzungen oder auf die Antwortgeschwindigkeit). Gleiche Antworten ergeben immer dieselbe Empfehlung, mit Begründung und Voraussetzungen. Die Tabelle bildet die Empfehlungen des Herstellers aus K42275060 ab, keine Meinung.

## Ergebnisse teilen

Die Seite hat zwei Zugänge, daher hat **Ergebnisse teilen** zwei Schaltflächen; jede erzeugt einen Link auf diese Seite, und zwar nur, wenn Sie sie wählen, und dieser Link enthält nach dem `#` einen Teil der Seite. Jedes Popover nennt zuerst, was sein Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

- **Am Anfang der Antwort zum Feld**: das Feld so, wie eingegeben (`#input=`), also einen Pool, einen Methodennamen, `methods` oder eine `choose`-Zeile. Namen von Pools und Membern können Ihre Server identifizieren, daher ergänzt das Popover einen Warnhinweis, bevor Sie etwas kopieren. Ein Pool enthält keine geheime Einstellung ([tmsh-Referenz von F5, ltm pool](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_pool.html), abgerufen am 27.10.2026).
- **Unter der Empfehlung von „Hilfe bei der Auswahl“**: Ihre beiden Antworten mit ihren IDs, `capacity` (`equal`, `ratio`, `connlimit`, `measured`) und `react` (`none`, `connections`, `trend`, `sessions`, `response`), nur wenn beide gewählt sind.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was der Link enthält, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Was der Link enthält, wird eingetragen: das Feld wie beim Einfügen, die beiden Auswahllisten wie gewählt; was er nicht enthält, behält seinen Wert. Eine Antwort, die die Auswahllisten nicht anbieten, oder eine Antwort ohne die andere führt dazu, dass der ganze Link ignoriert wird. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.

## Quellen

Die 19 Tokens, ihre Beschreibungen und die Pool-Optionen stammen aus der Referenz zu tmsh ltm pool. Die Empfehlungen zum Einsatz und die Voraussetzung von Least Sessions stammen aus K42275060. Die Mechanik der dynamischen Modi, der Ausschluss von OneConnect und die Regel, dass Ratios eine Ratio-Methode brauchen, stammen aus K6406.

- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (abgerufen am 27.10.2026): Abschnitt 3.5, das Fragment, das die Werte eines Links von „Ergebnisse teilen“ enthält
