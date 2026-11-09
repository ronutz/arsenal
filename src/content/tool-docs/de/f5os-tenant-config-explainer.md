## Was das Tool tut

Fügen Sie einen Block `f5-tenants:tenants` ein, entweder in der CLI-Form oder als RESTCONF-JSON, und das Tool gibt ihn Ihnen erklärt wieder: den Lebenszykluszustand und was er bedeutet, das Image und zu welcher Plattform es gehört, die Blades und VLANs und eine Erklärung jedes Felds. Lokal und offline; das Tool parst den Text und kontaktiert keine Plattform.

## Die Prüfung, die mehr als ein Glossar daraus macht

F5 veröffentlicht den Mindestspeicher als **(3.5 × 1024 × vCPU) + 512**, zwei vCPUs brauchen also 7.680 MB und vier 14.848 MB. Das Tool berechnet dieses Minimum und **zeigt es neben dem konfigurierten Wert**, mit einer Warnung, wenn die Zuteilung darunter liegt.

Es warnt auch, wenn eine vCPU-Anzahl ohne Speicherwert erscheint, denn **beide gehören zusammen**: Wer nur die Kerne erhöht, lässt den Tenant unter seinem neuen Minimum.

## Die Lebenszyklusregel, die das Tool nennt

**Um vCPU oder Speicher eines Tenants im Zustand deployed zu ändern, müssen Sie ihn zuerst zurück auf `provisioned` setzen**, die Änderung vornehmen und ihn dann wieder auf `deployed` setzen. Das ist keine Operation im laufenden Betrieb, und das Tool sagt das bei jedem Tenant im Zustand deployed, ohne dass Sie fragen müssen.

## Die Bauform der Plattform

Das Tool markiert, was zu welcher Maschine gehört. **VELOS** ist ein Chassis, in dem `nodes` die Blades innerhalb einer Chassis-Partition benennt und ein Tenant sich über mehrere davon erstrecken kann. **rSeries** ist eine Appliance ohne Partitionen oder Blades, und `vcpu-cores-per-node` muss ein Vielfaches von vier sein. Ein gültiger VELOS-Tenant mit zwei vCPUs **wird auf einer rSeries nicht übernommen (commit)**, und ein Image-Bundle namens `ALL-VELOS` lässt sich dort ebenfalls nicht bereitstellen, worauf das Tool allein anhand des Dateinamens hinweist.

## Was das Tool nicht tut

Es kann nicht wissen, wie viel Ihrer Plattform bereits zugeteilt ist, daher prüft es einen Tenant gegen die veröffentlichte Formel, nicht gegen die verbleibende Kapazität. Ob auf dem Blade noch genug Speicher frei ist, muss die Plattform beantworten.

## Ergebnisse teilen

Unter der Zusammenfassung erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` das Feld so, wie eingegeben, und sonst nichts. Das Popover nennt zuerst, was der Link enthält, dann einen eigenen Warnhinweis: Der Block nennt die Management-Adresse, das Gateway und die VLANs des Tenants, lesen Sie ihn also, bevor Sie den Link senden. Dann bietet es „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Ein Tenant-Block enthält kein Passwort und keinen Schlüssel: Die [Referenz von F5 zum Tenant-Lebenszyklus für die VELOS-API](https://clouddocs.f5.com/api/velos-api/api-chassis-tenant.html) (abgerufen am 27.10.2026) konfiguriert einen Tenant mit Name, Typ, Image, Knoten, Management-Adresse, Präfixlänge, Gateway, VLANs, Cryptos, vCPUs, Speicher, Betriebszustand und Appliance-Modus. Die Zugangsdaten, die diese Seite verwendet, gehören zur API-Anfrage, nicht zum Block.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird der Text beim Öffnen des Links nicht an den Server gesendet. Er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann ihn lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Der Text füllt das Feld wie beim Einfügen, und die Seite liest ihn; es wird nichts gesendet. Danach verschwindet der Wert sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
