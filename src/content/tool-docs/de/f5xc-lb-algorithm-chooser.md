## Was das Tool tut

Das Tool ist eine geführte Auswahlhilfe für den Lastverteilungsalgorithmus eines Origin-Pools in F5 Distributed Cloud (XC). Beantworten Sie drei Fragen: ob Sitzungen beim selben Origin bleiben müssen, was eine Sitzung kennzeichnet (Quell-IP, ein Cookie, ein eigener Header oder „Unterschiedlich je Route/Domain“) und ob der Origin-Pool dynamisch ist. Das Tool empfiehlt dann einen der Algorithmen von XC, nennt die Entsprechung in BIG-IP, listet die Einschränkungen auf, die für Ihre Antworten gelten, und sagt Ihnen, wo Sie ihn einstellen. Alles läuft in Ihrem Browser.

## Das Persistenzmodell von XC, für alle, die BIG-IP kennen

Genau das will das Tool zeigen. In BIG-IP sind die Lastverteilungsmethode (Round Robin, Least Connections usw.) und das Persistenzprofil (Source Address Affinity, Cookie) zwei unabhängige Einstellungen am virtuellen Server. XC legt beides zusammen. Die Algorithmen mit konsistentem Hashing (Source IP Stickiness, Cookie Based Stickiness und Ring Hash) sind nicht nur Verteilungsmethoden; jeder davon ist per Definition zugleich die Persistenzmethode. Wählen Sie einen, erhalten Sie beides auf einmal. Die Algorithmen ohne Hash (Round Robin, Least Active Request, Random) persistieren überhaupt nicht. Ein eigenes Persistenzprofil-Objekt zum Anhängen gibt es nicht.

## Die sieben Algorithmen

Round Robin sendet Anfragen der Reihe nach an die Origins. Least Active Request sendet jede Anfrage an den Origin mit den wenigsten laufenden Anfragen, was zu ungleich aufwendigen Anfragen oder langlebigen Verbindungen passt. Random wählt einen Origin zufällig und ist über große Pools statistisch gleichmäßig. Source IP Stickiness, Cookie Based Stickiness und Ring Hash bilden die Familie des konsistenten Hashings: Sie bilden einen Hash über die Quell-IP, ein Cookie oder eine selbst definierte Hash-Richtlinie (meist einen Header mit Session-ID) und halten einen Client beim selben Origin. Load Balancer Override ist der Notausgang: Es überlässt die Wahl dem HTTP-Load-Balancer, sodass Sie Stickiness pro Route oder pro Domain festlegen können.

## Warum die Einschränkungen wichtig sind

Eine Empfehlung ist nur so gut, wie sie passt, deshalb zeigt das Tool die Fallen. Ein Hash über die Quell-IP bündelt Clients, die sich eine IP teilen (hinter NAT oder einem Proxy), auf einem Origin und verteilt die Last damit ungleich. Cookie-Stickiness braucht einen Namen, eine TTL und einen Pfad und hält nur, wenn der Client das Cookie zurücksendet. Ein Hash über einen eigenen Header braucht einen Wert, der pro Sitzung stabil ist, nicht pro Anfrage. Und für einen dynamischen Pool, also Kubernetes-Pods, die hoch- und herunterskalieren, ist konsistentes Hashing die richtige Familie, weil es bei geänderter Mitgliedschaft die wenigsten Clients neu zuordnet.

## Ergebnisse teilen

Unter dem Namen des empfohlenen Algorithmus erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` Ihre Antworten anhand ihrer IDs: ob Sie Persistenz brauchen; die Verteilung oder den Sitzungsschlüssel, je nachdem, was die Empfehlung auswertet; und ob der Pool dynamisch ist, sobald Sie das beantwortet haben. Im Fragebogen gibt es nichts einzugeben, daher wird nichts Eingegebenes übertragen. Die Schaltfläche steht bereit, sobald die Empfehlung vollständig ist. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` folgt, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Die Antworten werden gesetzt, als wären sie angeklickt, und die Empfehlung folgt. Ein Link mit einer unbekannten Antwort oder mit Antworten aus beiden Zweigen wird ignoriert. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
