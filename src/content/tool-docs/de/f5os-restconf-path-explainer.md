## Was das Tool tut

Fügen Sie einen RESTCONF-Pfad von F5OS ein, und das Tool dekodiert ihn Segment für Segment: den API-Root, die Präfixe der YANG-Module, die Hierarchie der Container und etwaige Listenschlüssel wie `tenant=tenant1`. Es nennt die Module, die es erkennt, und sagt, wofür jedes zuständig ist. Es parst nur den Text des Pfads: Es wird nichts abgerufen, kein Schema herangezogen, und nichts verlässt den Browser.

## Warum ein F5OS-Pfad dekodiert werden muss

F5OS, die Plattformschicht unter den Tenants auf VELOS und rSeries, wird über **RESTCONF** (RFC 8040) mit in **YANG** modellierten Daten gesteuert, nicht über iControl REST mit dem Objektmodell von TMOS. Wer `/mgmt/tm/ltm/virtual` fließend liest und auf `/restconf/data/f5-tenants:tenants/tenant=tenant1/config` trifft, kann nicht erkennen, welcher Teil ein Modul ist, welcher ein Container und welcher eine Instanz auswählt. Das ist eher ein Vokabelproblem als ein schwieriges, und genau das beseitigt das Tool.

## Das Modulpräfix und die Präfixkonvention

`f5-tenants:tenants` ist der Knoten `tenants` im YANG-Modul `f5-tenants`. F5OS verwendet herstellerneutrale **OpenConfig**-Module (`openconfig-system`, `openconfig-interfaces`, `openconfig-vlan`) neben den eigenen `f5-`-Modulen von F5. **Nur der erste Knoten eines Moduls hat das Präfix**; die Knoten darunter werden ohne Präfix geschrieben, weil sie es erben. Taucht weiter unten im Pfad wieder ein Präfix auf, hat der Pfad in ein anderes Modul gewechselt, und das ist beim Lesen eines Pfads das Nützlichste, was man bemerken kann.

## Listenschlüssel und die zwei Ports

RESTCONF adressiert einen Listeneintrag, indem es seinen Schlüssel in den Pfad schreibt, und nicht über einen Query-Parameter; so wählt `tenant=tenant1` einen Tenant aus der Liste `tenants`. Das Tool kennzeichnet diese Schlüssel getrennt von einfachen Containern.

Es erklärt auch die Port-Anordnung, über die viele stolpern: F5OS stellte RESTCONF ursprünglich auf **Port 8888** unter `/restconf` bereit, und ab **F5OS 1.8** ist dieselbe API über den Standardport für HTTPS unter `/api` erreichbar. Zwei Pfade, die verschieden aussehen, können also dieselbe Ressource adressieren. Die Version ist die, die F5 selbst auf DevCentral nennt: Ein Codeshare vom Dezember 2022 zur Automatisierung von F5OS-Backups hält fest, dass sich ab F5OS 1.8 die Form `:8888/restconf` durch `:443/api` ersetzen lässt; die Release Notes zu F5OS-A 1.8.0 enthalten eine passende Korrektur, 1572137-2, für die Upload- und Download-API, die mit `/api` und mit `/restconf` funktioniert. Die Automatisierungsleitfäden von F5 für rSeries und VELOS dokumentieren beide Zugänge, ohne eine Version zu nennen. Die Authentifizierung verwendet einen Header `X-Auth-Token`, und dieses Token ist selbst ein JWT, läuft also ab.

## Was das Tool nicht tut

Die Modultabelle ist endlich und bewusst kurz. Verwendet ein Pfad ein Modul, das das Tool nicht kennt, dekodiert es die Struktur und **sagt, dass das Modul nicht erkannt wurde, statt es geraten zu beschreiben**. Es validiert auch nichts gegen ein Schema, weil es keines hat: Es kann Ihnen nicht sagen, ob ein Knoten in Ihrem F5OS-Release existiert, nur wie der eingegebene Pfad aufgebaut ist.

## Verwendung

Fügen Sie einen reinen Pfad, eine vollständige URL oder einen Pfad mit Query-String ein. Query-Parameter werden beiseitegelegt und benannt, weil sie die Anfrage näher bestimmen, statt die Ressource zu identifizieren.

## Ergebnisse teilen

Unter der Übersicht erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` das Feld so, wie eingegeben, und sonst nichts. Das Popover nennt zuerst, was der Link enthält, dann einen eigenen Warnhinweis: Eine vollständige Adresse nennt den Management-Host und den Port Ihrer Plattform, lesen Sie sie also, bevor Sie den Link senden. Dann bietet es „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Eine Adresse kann vor ihrem `@` auch ein Passwort enthalten (`https://admin:secret@host:8888/...`). [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.2.1, abgerufen am 27.10.2026) erklärt das Format „user:password“ im Feld userinfo für veraltet und legt fest, dass Anwendungen „should not render as clear text any data after the first colon“, also nichts nach dem ersten Doppelpunkt im Klartext anzeigen sollen. Diese Seite würde es als Teil des Hosts anzeigen, daher gibt es keinen Link, solange der eingefügte Text ein solches Passwort enthält; entfernen Sie es und wählen Sie die Schaltfläche erneut. Ein Benutzername allein (`admin@host`) wird übernommen.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird der Text beim Öffnen des Links nicht an den Server gesendet. Er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann ihn lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Der Text füllt das Feld wie beim Einfügen, und die Seite liest ihn; es wird nichts gesendet. Danach verschwindet der Wert sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
