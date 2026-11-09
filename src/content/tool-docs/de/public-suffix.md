## Was das Tool tut

Das Tool nimmt einen Hostnamen und ermittelt zwei Dinge dazu: das **Public Suffix** (die effektive Top-Level-Domain, eTLD) und die **registrierte Domain** (die eTLD plus ein Label, oft eTLD+1 genannt). Für `www.blog.example.co.uk` ist das Public Suffix `co.uk` und die registrierte Domain `example.co.uk`. Alles läuft lokal in Ihrem Browser, abgeglichen mit einer mitgelieferten Kopie der Public Suffix List; es wird nichts gesendet.

## Warum das wichtig ist

Die registrierte Domain ist die Einheit, nach der viele Systeme zählen. Zertifizierungsstellen wie Let's Encrypt wenden ihr Rate Limit für Ausstellungen pro Domain auf die registrierte Domain an; `api.example.com` und `www.example.com` teilen sich also ein Kontingent unter `example.com`. Browser bestimmen mit derselben Grenze den Geltungsbereich von Cookies und das Same-Site-Verhalten. Der Haken: Sie lässt sich nicht einfach über die letzten beiden Labels finden. `example.co.uk` braucht drei Labels, weil `.co.uk` selbst ein Public Suffix ist, und das lässt sich nur über die Public Suffix List zuverlässig wissen.

## Wie es funktioniert

Das Tool implementiert den veröffentlichten Algorithmus der Public Suffix List. Es sucht die Regel, die für Ihren Host gilt, wobei eine Ausnahmeregel (eine `!`-Regel) jeder normalen Regel vorgeht; sonst gilt die Regel mit den meisten Labels. Wildcard-Regeln wie `*.ck` passen auf jedes einzelne Label an dieser Position. Passt überhaupt keine Regel, gilt das Label ganz rechts als Suffix. Die registrierte Domain ist dann das Public Suffix plus das nächste Label links davon, sofern es ein solches Label gibt.

## Die Abschnitte ICANN und PRIVATE

Die Liste hat zwei Teile. Der Abschnitt **ICANN** ist die Menge der von Registries betriebenen Suffixe, die Browser durchsetzen. Der Abschnitt **PRIVATE** umfasst von Anbietern delegierte Namen wie `github.io` oder `*.compute.amazonaws.com`, unter denen ein Anbieter Subdomains vergibt. Die beiden können sich widersprechen: Mit der vollständigen Liste ist `user.github.io` eine eigene registrierte Domain, nach den ICANN-Regeln allein ist die registrierte Domain dagegen `github.io`. Entscheidet eine PRIVATE-Regel die Antwort, zeigt das Tool zusätzlich die Nur-ICANN-Sicht, denn das ist die Lesart, die Rate Limits für Zertifikate und Same-Site-Prüfungen verwenden.

## Hinweise

Geben Sie einen bloßen Hostnamen ein; Schema, Port, Pfad oder ein führendes Wildcard-Label `*.` werden automatisch entfernt, und internationalisierte Namen werden vor dem Abgleich in ihre Punycode-Form umgewandelt. IP-Adressen werden als solche gemeldet und nicht als Domains geparst, da sie kein Public Suffix haben. Weil sich die Public Suffix List mit der Zeit ändert, ist die mitgelieferte Kopie ein datierter Snapshot; betrachten Sie das Ergebnis als korrekt zum Stand dieses Snapshots, und gleichen Sie mit publicsuffix.org ab, wenn Sie die allerneuesten Regeln brauchen.

## Ergebnisse teilen

Unter der Hauptantwort erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält den Hostnamen so, wie eingegeben (`#input=www.blog.example.co.uk`), und sonst nichts. Alles, was der Link enthält, steht nach dem `#`, und dieser Teil ist laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt: Ein Browser sendet ihn beim Öffnen des Links nicht an den Server, aber er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann ihn lesen.

- **Länge.** Ein Link enthält höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ein Hostname ist weit kürzer.
- **Öffnen eines Links.** Der Hostname füllt das Feld wie bei der Eingabe, und die Seite schlägt ihn erneut in ihrer mitgelieferten Kopie der Liste nach; eine IP-Adresse oder ein fehlerhafter Name erhält den eigenen Hinweis der Seite. Ob angenommen oder nicht, die Werte verschwinden danach sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen, ein Lesezeichen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts, was Sie nicht selbst teilen wollten.
