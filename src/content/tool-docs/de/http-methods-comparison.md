## Was das Tool tut

Geben Sie ein bis vier Namen von HTTP-Methoden (Hypertext Transfer Protocol) ein, und das Tool liefert zu jeder die Fakten auf Protokollebene: ob sie sicher, idempotent und cachebar ist, welche Semantik ihr Anfrage-Body hat, ob CORS (Cross-Origin Resource Sharing) Browsern erlaubt, sie ohne Preflight zu senden (die OPTIONS-Anfrage, mit der ein Browser vor jeder nicht einfachen Cross-Origin-Anfrage um Erlaubnis fragt), ob HTML-Formulare sie deklarativ erzeugen können und welcher RFC sie definiert. Fragen Sie nach zwei oder mehr („get vs query“), nennt es außerdem genau die Eigenschaften, in denen sie sich unterscheiden. Die Tabelle umfasst die neun Kernmethoden aus RFC 9110, PATCH (RFC 5789), das WebDAV-Trio PROPFIND, REPORT und SEARCH sowie die wichtigste Zeile: QUERY, im Juni 2026 durch RFC 10008 registriert, die erste neue HTTP-Methode seit PATCH im Jahr 2010.

Unter dem Feld fügt eine Schaltfläche pro Methode der Tabelle diese Methode der Zeile hinzu oder entfernt sie wieder; ein Vergleich lässt sich so ohne Tippen zusammenstellen. Sind vier genannt, warten die anderen.

## Die Begriffe, genau genommen

Sicher heißt, dass der Client keine Zustandsänderung anfordert; idempotent heißt, dass die Wiederholung der identischen Anfrage den Server im selben Zustand hinterlässt, und genau das macht automatische Wiederholungen zulässig. Beides sind bei der IANA registrierte Zusagen über die Absicht: Ein generischer Cache, Proxy oder eine Wiederholungsschicht kann danach handeln, ohne etwas über Ihre API zu wissen. Keine von beiden sagt etwas über den Inhalt: Ein QUERY-Body kann denselben Injection-Versuch enthalten wie ein POST-Body, weshalb der abschließende Hinweis des Tools für QUERY auf eine Prüfung wie bei POST besteht.

Cachebarkeit hat in der Tabelle drei ehrliche Werte: GET und HEAD sind das cachebare Paar; Antworten auf POST und PATCH sind nur dann cachebar, wenn ausdrückliche Angaben zur Freshness vorhanden sind (in der Praxis fast nie); QUERY ist von vornherein cachebar, mit der Vorgabe aus RFC 10008, dass der Cache-Schlüssel den Inhalt der Anfrage einbezieht. Das ist der Mechanismus, der eine Anfrage mit Body cachebar macht, und genau die Stelle, an der eine nachlässige Cache-Implementierung zu Cache-Poisoning wird.

Die Semantik des Anfrage-Bodys trennt vier Fälle, die in der Praxis ständig vermengt werden: Bodys, die der eigentliche Zweck sind (POST, PUT, PATCH, QUERY, das WebDAV-Trio), Bodys ohne definierte Semantik, die Server rundweg ablehnen dürfen (GET, HEAD, DELETE; RFC 9110 hält das ausdrücklich fest), Bodys, die erlaubt, aber bedeutungslos sind (OPTIONS), und Bodys, die verboten sind (CONNECT, TRACE).

## Warum QUERY die interessante Zeile ist

QUERY ist die fehlende Mitte, die die Tabelle sichtbar macht: sicher + idempotent + cachebar wie GET, Body wie POST. Es gibt QUERY, weil GET Abfragen in die URL zwingt (Längengrenzen, mühsame Kodierung, Lecks über Logs und Referer), während POST /search die Infrastruktur belügt: Nichts im Protokoll kennzeichnet die Anfrage als nur lesend, also kann nichts dazwischen sie cachen oder wiederholen. Der Vergleich „post vs query“ zeigt fünf Eigenschaften, die auf einmal umschlagen; „get vs query“ zeigt die drei, die für die Einführung zählen: den Body, den CORS-Preflight (QUERY steht nicht auf der Safelist) und HTML-Formulare (ein Formular mit method="query" fällt heute auf GET zurück und verwirft den Body).

## Durchgerechnete Beispiele

`query` allein ergibt die vollständige Zeile aus RFC 10008. `get vs query` beantwortet die klassische Frage mit drei Unterschieden. `post,query` zeigt die Geschichte der Migration: fünf Umschläge. `put delete` zeigt das Paar, das idempotent ist, ohne sicher zu sein. `trace` und `connect` zeigen die beiden Methoden, denen ein Body verboten ist. `search` erzählt die Geschichte des Namens: Die frühen Entwürfe von QUERY hießen SEARCH, bis zur Umbenennung 2021.

## Ergebnisse teilen

Unter den Bereichen erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` die Zeile so, wie eingegeben, und sonst nichts: ein bis vier Methodennamen, die nichts über Sie verraten. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert. Die Links des Decoders für HTTP-Nachrichten, die eine Methode an diese Seite übergeben, verwenden dasselbe `#input=` und füllen das Feld auf dieselbe Weise.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird die Zeile beim Öffnen des Links nicht an den Server gesendet. Sie bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann sie lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Die Zeile füllt das Feld wie beim Tippen, und die Seite vergleicht die Methoden; es wird nichts gesendet. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.

## Herkunft

Jeder Wert für sicher und idempotent stammt aus der entsprechenden Spalte der HTTP Method Registry der IANA, abgeglichen mit RFC 9110 §9.3, RFC 10008, RFC 5789 und den WebDAV-Spezifikationen (RFC 4918, 3253, 5323); die Safelist von CORS folgt der Fetch-Spezifikation der WHATWG, der Stand bei Formularen der offenen Diskussion zu HTML bei der WHATWG. Alle Quellen wurden am 20.07.2026 abgerufen. Das Tool wird mit 19 Referenzvektoren (Golden Vectors) ausgeliefert, die jede Zeile festlegen, sodass jede Abweichung in der Tabelle den Build scheitern lässt.
