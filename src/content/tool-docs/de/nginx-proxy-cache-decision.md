## Was das Tool tut

Fügen Sie Ihre Cache-Direktiven, die Anfrage und die Upstream-Antwort ein. Das Tool beantwortet **zwei getrennte Fragen**: Wird diese Antwort **gespeichert**, und wird eine spätere passende Anfrage aus ihr **ausgeliefert**? Hinter jeder Antwort steht der geordnete Durchlauf der Regeln, dazu der berechnete Cache-Schlüssel.

Sie sind bewusst getrennt. Eine Antwort kann einwandfrei cachefähig sein und trotzdem nie ausgeliefert werden, weil der Schlüssel abweicht; eine Antwort kann ausgeliefert werden, obwohl sie es nicht sollte, weil der Schlüssel etwas ignoriert, das wichtig war.

## Die Regeln für das Speichern, der Reihe nach

Caching ist ganz ausgeschaltet, solange `proxy_cache` keine Zone nennt; das ist mit Abstand der häufigste Grund, warum nie etwas gecacht wird. Gecacht werden nur die Methoden in `proxy_cache_methods`, standardmäßig GET und HEAD. Eine Antwort mit `Set-Cookie` wird nicht gespeichert, unter der Annahme, dass sie benutzerspezifisch ist. `Cache-Control: no-cache`, `no-store` oder `private` vom Upstream verhindert das Speichern. Ein Status ohne `proxy_cache_valid` und ohne Frische-Header hat keine Lebensdauer, unter der er gespeichert werden könnte. Und `proxy_no_cache` mit einem Wert, der weder leer noch null ist, verhindert das Schreiben.

## Das Paar, das man verwechselt

`proxy_no_cache` verhindert das **Schreiben**. `proxy_cache_bypass` überspringt das **Nachschlagen** und schreibt das Ergebnis trotzdem. Sie lesen sich wie Synonyme und sind in der Hälfte, die zählt, Gegenteile: Wer bypass verwendet, wo no_cache gemeint war, füllt den Cache mit genau dem, was draußen bleiben sollte.

## Die Asymmetrie, durch die Daten durchsickern

NGINX schließt **Antworten** mit Cookies vom Speichern aus. **Anfragen** mit Cookies schließt es **nicht** davon aus, einen geteilten Eintrag ausgeliefert zu bekommen.

Das ist meist harmlos, weil die personalisierten Antworten nie gespeichert wurden, bis jemand `proxy_ignore_headers Set-Cookie` hinzufügt, damit Caching auf einem Backend „funktioniert“, das bei jeder Antwort ein Sitzungs-Cookie setzt. Dann liegen benutzerspezifische Antworten unter einem Schlüssel, den alle Benutzer teilen. Das Tool warnt genau vor dieser Kombination, weil sie eine Änderung von zwei Zeilen ist, die wie eine Performance-Optimierung aussieht.

## Ehrliche Grenzen

Ein einzelner Austausch, nicht der Lebenszyklus des Caches: kein `proxy_cache_use_stale`, kein `proxy_cache_lock`, keine Revalidierung, keine Zählung für `min_uses`, keine Behandlung von `Vary`. Frische wird als vorhanden oder fehlend behandelt, nicht berechnet; ein abgelaufener Eintrag liegt daher außerhalb des Umfangs. Beim Darstellen des Schlüssels werden die üblichen Variablen ersetzt, und alles andere bleibt so, wie geschrieben.

## Ergebnisse teilen

Unter den beiden Bewertungen erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` eine Kopie des Felds; das Feld so, wie eingegeben, enthält er nur, wenn Sie den unten beschriebenen Schalter aktivieren. Die Header des Austauschs sind die eigentliche Lektion, und aus den Entwicklertools eines Browsers eingefügt sind sie aktiv: Cookie-Werte sind häufig Sitzungskennungen ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), Abschnitt 8.4, abgerufen am 01.11.2026), und ein `Authorization`-Wert „consists of credentials“ ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), Abschnitt 11.6.2, abgerufen am 01.11.2026). Die Entscheidung prüft, ob diese Header vorhanden sind, nie ihre Werte; nur der dargestellte Cache-Schlüssel zeigt einen Wert, wo der Schlüssel `$cookie_<name>` oder `$http_<name>` nennt ([ngx_http_core_module, Embedded Variables](https://nginx.org/en/docs/http/ngx_http_core_module.html#variables), abgerufen am 01.11.2026). Die Kopie ersetzt daher jeden Cookie-Wert einer Zeile `request_header Cookie:`, den Cookie-Wert einer Zeile `response_header Set-Cookie:` (Name und Attribute bleiben), die Zugangsdaten nach dem Schema einer Zeile `Authorization` oder `Proxy-Authorization` (das Schema bleibt) und den ganzen Wert eines Headers, dessen Name nach einem Secret aussieht (`X-Api-Key`, `X-Auth-Token`), durch `[redacted]`; jedes andere Byte bleibt so, wie eingegeben, Kommentare eingeschlossen. Bevor der Link angeboten wird, wird die Kopie erneut entschieden und muss zur selben Entscheidung führen (gespeichert, ausgeliefert, das Ergebnis jeder Regel, jede Warnung), sonst gibt es keinen Link; der Schlüssel und der Schritt, der ihn zitiert, zeigen dann `[redacted]`, wo ein Wert stand. Danach wird die Kopie nach verbliebenen Zugangsdaten durchsucht (ein JWT in der URI, ein Schlüssel): Findet sich welche, gibt es keinen Link, und das Popover nennt die Zeile.

Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert. Es nennt auch, wie viele Werte ersetzt wurden. Wurde etwas ersetzt, können Sie die Werte über einen Schalter unter der ersten Zeile, **Die ersetzten Werte in den Link aufnehmen**, doch mitsenden, etwa für einen Austausch mit erfundenen Werten oder einen Schlüssel, der ein Cookie nennt: Er ist bei jedem Öffnen des Popovers ausgeschaltet; ist er aktiviert, enthält der Link das Feld so, wie eingegeben, und das Popover warnt, dass Cookie-Werte oft aktive Sitzungen und `Authorization`-Werte Zugangsdaten sind. Der Schalter wird nicht angeboten, wenn Zugangsdaten den Link bereits verhindert haben.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` folgt, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Die Kopie (oder, mit dem Schalter, das Feld) füllt das Feld wie beim Einfügen, und die Seite entscheidet. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
