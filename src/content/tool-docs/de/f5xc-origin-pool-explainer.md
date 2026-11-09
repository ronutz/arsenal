## Was das Tool tut

Das Tool dekodiert eine origin_pool-Spezifikation von F5 Distributed Cloud (XC). Fügen Sie das Objekt origin_pool aus der JSON-Ansicht der Konsole ein, seinen spec-Teil oder einen Umschlag von create oder get; das Tool legt dar, was der Pool tatsächlich tut: Typ und Adresse jedes Origin-Servers, den Pool-Port, den Lastverteilungsalgorithmus und die Endpunktauswahl, die referenzierten Zustandsprüfungen (Health Checks) und die Einstellungen für TLS zum Origin. Es läuft vollständig in Ihrem Browser.

## Origin-Server: Typ und Ort

Ein Origin-Pool kann auf verschiedene Arten auf Origins verweisen, und das Tool benennt jede. Eine öffentliche IP oder ein öffentlicher DNS-Name erreicht Origins über das Internet. Eine IP oder ein DNS-Name „on given sites“ erreicht Origins über ein Customer Edge oder ein Regional Edge und enthält einen Locator für eine Site oder eine virtuelle Site; das Tool zeigt diesen Ort. Dienstnamen von K8s und Consul nutzen die Service Discovery auf einer Site. Daneben gibt es Varianten für virtuelle Netzwerke und eigene Endpunkte. Jeder Origin kann außerdem Labels haben, die das Tool auflistet.

## Wo Gewichtungen und Prioritäten tatsächlich stehen

Ein verbreiteter Irrtum ist, dass Origin-Server in einem Pool Gewichtungen und Prioritäten haben. Das ist nicht so. Innerhalb eines Pools sind die Origin-Server eine flache Liste, die nach dem Algorithmus des Pools bedient wird. Gewichtungen und Prioritäten werden eine Ebene höher festgelegt, am Verweis auf den Pool in einer Route oder in den Standard-Pools des Load-Balancers: Jeder Verweis besteht aus einem Pool, einer Gewichtung und einer Priorität. Das Tool sagt das ausdrücklich, damit Sie an der richtigen Stelle suchen.

## Pool-Port und Endpunktauswahl

Der Port kann explizit sein, vom Endpunkt übernommen werden oder automatisch sein, und automatisch heißt 443, wenn TLS zum Origin aktiviert ist, und 80, wenn nicht. Die Endpunktauswahl steuert, über welches Regional Edge der Datenverkehr zum Origin austritt: Local Preferred (der Standard) lässt ihn am lokalen RE austreten, wenn dieses einen verfügbaren Origin-Eintrag hat, und leitet ihn sonst über das globale Netzwerk von F5 an ein RE weiter, das einen hat. Deshalb kann derselbe Origin in der Konsole viele Male erscheinen, einmal pro RE.

## TLS zum Origin

Ist TLS zum Origin aktiviert, dekodiert das Tool die Sicherheitsstufe (mit denselben Stufendaten wie das Tool „F5XC-TLS-Sicherheitsstufen und Cipher-Suiten“, sodass High mindestens TLS 1.2 bedeutet), dazu den SNI-Modus (Host-Header verwenden, ein expliziter Wert oder keine SNI), die gewählte Serverprüfung und ob mTLS aktiv ist. Es markiert den Fall, auf den es am meisten ankommt: das Überspringen der Prüfung des Origin-Servers. Die Verbindung bleibt dann zwar verschlüsselt, das Zertifikat des Origins wird aber nicht validiert, deshalb weist das Tool eigens darauf hin.

## Ergebnisse teilen

Unter den Origin-Servern erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` eine Kopie des Pools, nie den Pool so, wie eingefügt. Ein Pool mit mTLS zu seinen Origins enthält den privaten Schlüssel jedes Client-Zertifikats: „TLS Private Key data in unencrypted PEM format ... may be optionally secured using BlindFold“ ([XC-API-Referenz für den Origin-Pool](https://docs.cloud.f5.com/docs-v2/api/views-origin-pool), abgerufen am 01.11.2026). Das Schema von F5 Distributed Cloud kennzeichnet diese Schlüssel: SecretType, „used in an object to indicate a sensitive/confidential field“, enthält das Secret entweder im Klartext (`clear_secret_info.url`: „For string:/// scheme, Secret needs to be encoded Base64 format“) oder mit Blindfold verschlüsselt (`blindfold_secret_info.location`). Die Seite liest, ob mTLS aktiv ist, nie den Schlüssel. Deshalb ersetzt die Kopie jedes SecretType-Secret durch `[redacted]` und behält jedes andere Byte so, wie eingefügt. Bevor der Link angeboten wird, liest die Seite die Kopie erneut und muss zur selben Auswertung kommen, sonst gibt es keinen Link; danach wird die Kopie nach Zugangsdaten durchsucht, die noch darin stehen (ein privater Schlüssel außerhalb von SecretType, der Wert eines Matchers für den Header `Authorization`, ein JWT, ein Passwort in einer URL, erkannt wie in den anderen Tools der Website): Findet sich eines davon, gibt es keinen Link, und das Popover nennt die Zeile; ein Wert, dessen Name nur nach einem Secret aussieht, wird stattdessen im Popover genannt.

Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert. Es nennt außerdem, wie viele Werte ersetzt wurden, und dass ein Pool seine Origin-Server mit ihren Adressen und Sites nennt. Einen Schalter, um die ersetzten Werte aufzunehmen, gibt es nicht: Ein Pool enthält keine Header- oder Cookie-Werte, und die Secrets, die das Schema definiert, werden nie gesendet.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` folgt, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Die Kopie füllt das Feld wie beim Einfügen, und die Seite liest sie. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
