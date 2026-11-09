## Was das Tool tut

Fügen Sie die `location`-Zeilen eines server-Blocks und eine Zeile `request <uri>` ein; das Tool führt den dokumentierten Auswahlalgorithmus von NGINX vor Ihren Augen aus. Es nennt den Block, der gewinnt, und zeigt den ganzen Durchlauf: was bei jedem Schritt geschah und warum, auch bei den Schritten, die nichts entschieden haben. Ein Query-String in der request-Zeile ist erlaubt; er bleibt beim Abgleich außen vor und speist nur die Variablen `$arg_<name>`.

## Die Regel, für die es das Tool gibt

**NGINX wählt weder die erste passende Location noch die letzte.** Es versucht zuerst einen exakten Treffer und hält an, wenn einer zutrifft. Dann prüft es jede Präfix-Location und merkt sich den **längsten** Treffer, nicht den ersten. Hat dieses Präfix `^~`, gewinnt es sofort. Andernfalls werden reguläre Ausdrücke **in Dateireihenfolge** probiert, und der erste passende gewinnt und schlägt das gemerkte Präfix. Ab nginx 1.31.5 werden, wenn kein regulärer Ausdruck passt, Prädikat-Locations (`location $variable`) in Dateireihenfolge probiert, und die erste, deren Variable weder leer noch `0` ist, gewinnt. Erst wenn in diesen beiden Runden nichts passt, gewinnt am Ende doch das Präfix.

Die Dateireihenfolge entscheidet nur in den Runden der regulären Ausdrücke und der Prädikate; deshalb führt es Sie beim Ergebnis regelrecht in die Irre, eine Konfiguration von oben nach unten zu lesen.

## Die zwei Ergebnisse, die man auf die harte Tour kennenlernt

Ein Präfixblock `/images/` verliert gegen einen darunter geschriebenen Block `~ \.(gif|jpg|png)$`, weil reguläre Ausdrücke nach der Präfixrunde probiert werden und sie schlagen. Der spezifischer wirkende Block, der zuerst steht, wird planmäßig übertrumpft.

Und `^~` bedeutet nicht „höhere Priorität“: Es bedeutet **vor den regulären Ausdrücken anhalten** (und ab 1.31.5 auch vor den Prädikat-Locations). Genau deshalb behebt es den Fall oben.

Dieselbe Reihenfolge entscheidet, welcher Block eine `.php`-URL an PHP-FPM übergibt; was danach zwischen NGINX und PHP ausgetauscht wird, behandelt [PHP-FPM und FastCGI](/learn/php-fpm-and-fastcgi).

## Was das Tool außerdem meldet

Neben dem Durchlauf prüft das Tool die Konfiguration selbst: Präfixblöcke, die ein regulärer Ausdruck übernehmen könnte (mit `^~` als genannter Abhilfe), doppelte Locations, das Fehlen einer Catch-all-Location `location /`, die nginx-Version, die eine Prädikat-Location braucht, und jedes Prädikat, dessen Variable keinen Wert hat.

## Ehrliche Grenzen

Ein server-Block: keine Auswahl über `server_name` und kein Abgleich des listen-Ports. Die Muster `~` und `~*` werden zu regulären Ausdrücken von JavaScript kompiliert; PCRE und JS stimmen bei der Syntax üblicher location-Blöcke überein, sind aber verschiedene Engines, verlassen Sie sich bei allem Exotischen also auf NGINX selbst. Die Portabilitätsansicht des [Regex-Toolkits](/tools/regex) führt Konstrukt für Konstrukt auf, wo PCRE2 und JavaScript ein Muster unterschiedlich lesen. Kein `rewrite`, kein `try_files` und keine internen Weiterleitungen: Das Tool beantwortet, welcher Block gewählt wird, nicht, was mit der ganzen Anfrage geschieht. Die URI wird so abgeglichen, wie sie geschrieben ist, denn NGINX dekodiert vor dem Abgleich, und das hier nur zur Hälfte zu tun, wäre schlechter, als es gar nicht zu tun. Variablen werden nicht ausgewertet: Ein Prädikat `$arg_<name>` liest den Query-String, jede andere Variable erhält den Wert, den Sie ihr in einer Zeile `variable $name value` geben, und eine nicht deklarierte Variable gilt als leer, sodass ihr Prädikat nicht zutrifft.

## Ergebnisse teilen

Unter dem Gewinner erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen und sobald die Seite einen Durchlauf hat. Der Link enthält nach dem `#` das Feld so, wie eingegeben. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert. Die Grammatik nimmt location-Zeilen, `variable`-Zeilen und die `request`-Zeile an, sonst nichts, daher kann keine andere Direktive mitreisen; eine request-Zeile kann aber einen Query-String enthalten und eine `variable`-Zeile einen Wert. Bevor ein Link angeboten wird, wird das Feld nach Zugangsdaten durchsucht, die ein Standard definiert: ein privater Schlüssel im PEM-Format, eine `Authorization`- oder `Proxy-Authorization`-Zeile mit beliebigem Schema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), Abschnitte 11.6.2 und 11.7.2: Der Wert „consists of credentials“), eine `Cookie`- oder `Set-Cookie`-Zeile mit einem Wert ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), Abschnitt 8.4: Server „commonly store a nonce (or "session identifier") in a cookie“), ein JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), Abschnitt 1), ein Passwort in einer URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), Abschnitt 3.2.1), eine AWS-Zugriffsschlüssel-ID oder ein `ENC`-Wert von FortiOS; alle abgerufen am 01.11.2026. Enthält das Feld einen davon, gibt es keinen Link: Das Popover nennt die Zeile, und Sie ersetzen den Wert durch einen Platzhalter und wählen die Schaltfläche erneut. Ein Wert, dessen Name nur wie ein Secret aussieht (ein JSON-Eintrag `token`, ein `token=` in einer Query), blockiert den Link nicht; das Popover nennt den ersten, damit Sie ihn prüfen können.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` folgt, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Das Feld füllt sich wie beim Einfügen, und die Seite geht es durch. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.

## Quellen

- [NGINX-Dokumentation, ngx_http_core_module, location](https://nginx.org/en/docs/http/ngx_http_core_module.html#location) (abgerufen am 26.10.2026): die Auswahlreihenfolge, `^~`, das reguläre Ausdrücke und Prädikat-Locations überspringt, die Regel für Prädikate und das durchgerechnete Beispiel (Konfigurationen A bis F), das die Tests des Tools nachstellen
- [NGINX-Dokumentation, How nginx processes a request](https://nginx.org/en/docs/http/request_processing.html) (abgerufen am 26.10.2026): Locations prüfen nur den URI-Teil der Anfragezeile, ohne Argumente
- [NGINX-Änderungsprotokoll, nginx 1.31.5, 02 Sep 2026](https://nginx.org/en/CHANGES) (abgerufen am 26.10.2026): „Feature: predicate locations“
