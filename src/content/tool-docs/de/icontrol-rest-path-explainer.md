## Was das Tool tut

Fügen Sie eine iControl-REST-URL ein, und das Tool dekodiert sie: das TMOS-Modul, die Collection, Partition und Ordnerpfad in Tilde-Kodierung samt ihrer Entsprechung in `tmsh`, eine etwaige Sub-Collection wie die Pool-Member und die Query-Optionen. Es parst nur den Text der URL: Es wird nichts abgerufen, und nichts verlässt den Browser.

## Die Tilde

`/mgmt/tm/ltm/pool/~Common~apps~web_pool` adressiert `/Common/apps/web_pool`. Die Tilde ist ein Ordnertrenner, weil **eine URL den Schrägstrich bereits für ihre eigene Struktur verwendet**. Das Tool zeigt neben den dekodierten Teilen immer die `tmsh`-Form, weil die meisten Lesenden diese Form schon kennen.

## Das Detail zur Partition, das 404-Fehler verursacht

Ein Name, der ohne Partition geschrieben ist, wird **in der aktuellen Partition des Aufrufers** aufgelöst. Dieselbe Anfrage kann bei einem Administrator gelingen und bei einem anderen 404 liefern, ohne dass in einem der beiden Fälle etwas falsch ist. Das Tool weist darauf hin, sobald der Objektname nicht qualifiziert ist.

## Query-Optionen

`$select`, `$filter`, `$top`, `$skip`, `expandSubcollections`, `options` und `ver` werden einzeln erklärt. Die wichtigste ist **`expandSubcollections`**: Ohne sie kommt ein Pool ohne Member zurück, und das ist die häufigste Überraschung in dieser API.

## Was das Tool nicht tut

Die Tabelle der Module ist endlich. Verwendet ein Pfad ein Modul, das das Tool nicht kennt, dekodiert es die Struktur und **meldet das Modul als unbekannt, statt es aus einer Vermutung heraus zu beschreiben**. Es validiert nichts gegen ein Gerät und kann Ihnen nicht sagen, ob das Objekt existiert.

## Ergebnisse teilen

Unter der Übersicht erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` den Pfad, wobei etwaige Zugangsdaten darin ersetzt sind, nie so, wie eingegeben. Das Popover nennt zuerst, was der Link enthält und wie viele Werte ersetzt wurden, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

- **Ein Authentifizierungs-Token im Pfad** wird unter Wahrung seiner Form maskiert (Großbuchstaben werden zu `X`, Kleinbuchstaben zu `x`, Ziffern zu `0`), sodass die Seite es weiterhin als das Objekt liest, das es adressiert hat. Der Leitfaden von F5 selbst verlängert ein Token mit `PATCH /mgmt/shared/authz/tokens/{{ bigip_auth_token }}` ([AS3, Authentication and Authorization](https://clouddocs.f5.com/products/extensions/f5-appsvcs-extension/latest/userguide/authentication.html), abgerufen am 27.10.2026), womit das Token selbst im Pfad steht.
- **Ein Passwort vor dem Host** (`https://user:password@host/...`) wird zu `[redacted]`: Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), Abschnitt 3.2.1 (abgerufen am 27.10.2026), „should not render as clear text any data after the first colon“, Anwendungen sollten also nichts nach dem ersten Doppelpunkt einer Userinfo im Klartext anzeigen.
- **Ein Header `X-F5-Auth-Token` oder `Authorization`**, der mit dem Pfad eingefügt wird, verliert seine Zugangsdaten an `[redacted]` (derselbe Leitfaden sendet das Token in `X-F5-Auth-Token`; [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), Abschnitt 11.6.2).

Host, Modul, Collection, Objektnamen und Query-Optionen bleiben so, wie eingegeben; die Share-Vektoren des Tools prüfen, dass die empfangende Seite dieselben Teile liest. Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird die Kopie beim Öffnen des Links nicht an den Server gesendet. Sie bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann sie lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Die Kopie füllt das Feld wie beim Einfügen, und die Seite dekodiert sie. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.

## Das begleitende Tool

„F5OS-RESTCONF-Pfade erklärt“ dekodiert die Plattformschicht unter einem Tenant, die RESTCONF über YANG statt dieses Objektmodells verwendet. Die beiden APIs sehen sich in nichts ähnlich, weil sie aus verschiedenen Traditionen stammen, nicht aus verschiedenen Versionen.
