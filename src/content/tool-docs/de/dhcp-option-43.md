# Generator für DHCP-Option 43

Geben Sie die Adresse eines WLAN-Controllers und den Hersteller der Access Points an, und das Tool liefert den Wert, den dieser Hersteller tatsächlich erwartet. Alles läuft im Browser; die Adresse verlässt die Seite nie.

## Warum das nicht einfach „IP in Hex umwandeln“ ist

RFC 2132 definiert Option 43 als *Vendor Specific Information* und überlässt ihren Inhalt dem jeweiligen Hersteller: „The definition of this information is vendor specific.“ Der RFC empfiehlt nur ein Layout: Ein Hersteller, der mehr als ein Element in die Option packt, „SHOULD encode the option using 'Encapsulated vendor-specific options'“, also eine Folge aus Suboption, Länge und Wert. Was die Suboptionen bedeuten und wie eine Adresse darin geschrieben wird, bleibt trotzdem dem Hersteller überlassen. Das Ergebnis: Hinter einer einzigen Optionsnummer stehen mindestens vier untereinander inkompatible Kodierungen, und wer die falsche wählt, bekommt die schlimmste Art von Fehler: Der Access Point bootet, erhält eine Adresse, liest einen Wert, den er nicht parsen kann, und tritt einfach nie bei. Nirgends erscheint ein Fehler.

Die vier Familien:

**Binäres TLV**: Cisco und UniFi. Die Adresse wird als vier rohe Bytes eingetragen. `192.168.10.5` wird zu `c0a80a05`.

**ASCII-TLV**: RUCKUS. Die Adresse wird als *Text* eingetragen, ein Byte pro Zeichen, Punkte eingeschlossen. Der Artikel 000008703 der Wissensdatenbank von RUCKUS formuliert die Regel so: „For each number, the ASCII translation is “3” plus the number in decimal“ und „For the “.” character, the ASCII code is “2e”“, und das eigene Beispiel dort schreibt `192.168.1.120` als `060d3139322e3136382e312e313230`: Suboption `06`, Länge `0d` (13 Zeichen), dann die 13 Zeichen als Text. 10 als binäres Byte ist also `0a`, als Text geschrieben aber `31 30`. Das sind unterschiedliche Werte, und für einen bestimmten Hersteller funktioniert nur einer davon.

**Text in Suboption 1**: ExtremeWireless. Der Deployment Guide von Extreme deklariert die Suboption als `option HAP.HWC code 1 = text;`, und sein Beispiel enthält zwei Controller in einem Wert, `"10.100.2.36, 10.100.2.22"`. Das Tool schreibt daher Suboption `01`, die Länge und dann die Adressen als Text, getrennt durch Komma und Leerzeichen: Aus diesem Beispiel wird `011831302e3130302e322e33362c2031302e3130302e322e3232`.

**Einfacher String**: Aruba. Überhaupt kein Hex. Der DHCP-Server sendet die Adresse als Text, und ein Hex-Wert ist hier falsch, egal wie sorgfältig er erstellt wurde.

**Eine ganz andere Option**: FortiAP. Es liest die Controller-Adresse aus Option 138, der CAPWAP-Option für Access Controller: „The FortiAP acquires the IP address of an AC in DHCP option 138 (the factory default)“. Fortinet dokumentiert außerdem: „If Option 138 is used for some other purpose on your network, you can use a different option number if you configure the AP units to match.“

## Verwendung

Wählen Sie zuerst den Hersteller. Diese Reihenfolge ist gewollt: Dieselbe Adresse ergibt vier verschiedene Antworten, daher gibt es keinen sinnvollen Wert, solange kein Hersteller gewählt ist.

Geben Sie die Management-IP des Controllers ein. Cisco akzeptiert mehrere, getrennt durch Leerzeichen oder Kommas, und kodiert sie der Reihe nach; die anderen nehmen eine.

Das Ergebnis zeigt den Wert und bei Herstellern mit Hex eine Aufschlüsselung Byte für Byte, wie er zusammengesetzt wurde (Suboption, Länge, dann die Adresse), damit Sie die Rechnung prüfen können, statt ihr zu vertrauen. Darunter stehen Zeilen zum Einfügen für ISC dhcpd, Cisco IOS, Windows Server und MikroTik.

## Was das Tool sagt und ein Hex-Feld nicht

**Wann Option 60 ebenfalls nötig ist.** Access Points von Aruba fragen herstellerspezifische Informationen nur an, wenn der Vendor Class Identifier passt; Option 43 ohne Option 60 mit dem Wert `ArubaAP` bewirkt also gar nichts. ExtremeWireless braucht ebenfalls einen VCI, und der hängt von der AP-Generation ab: Ältere Modelle verwenden `HiPath` gefolgt vom Modellnamen, neuere nur das Modell.

**Wann die Antwort kein Hex ist.** Für Aruba liefert das Tool einen String und sagt das, denn einen plausibel aussehenden Hex-Wert zurückzugeben, wäre schlimmer, als gar nichts zurückzugeben.

**Wann Sie nach der falschen Option fragen.** Für FortiAP liefert es Option 138 und erklärt, warum.

## Ergebnisse teilen

Unter dem Wert erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält die Controller-Adresse oder -Adressen so, wie eingegeben (`#input=192.168.1.10`). Der Hersteller wird nicht übertragen: Der Link öffnet mit dem ersten Profil, Cisco Wireless LAN Controller, und ist ein anderer Hersteller gewählt, nennt das Popover den, der nach dem Öffnen zu wählen ist. Bevor Sie etwas kopieren, ergänzt das Popover einen Warnhinweis: Die Management-Adresse eines Controllers gehört zur internen Topologie, prüfen Sie sie also, bevor Sie den Link senden. Alles, was der Link enthält, steht nach dem `#`, und dieser Teil ist laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt: Ein Browser sendet ihn beim Öffnen des Links nicht an den Server, aber er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann ihn lesen.

- **Länge.** Ein Link enthält höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; eine Liste von Adressen ist weit kürzer.
- **Öffnen eines Links.** Der Link ist dieselbe Adresse, die auch andere Links in dieses Tool verwenden: Die Adressen füllen das Feld und werden wie bei der Eingabe kodiert. Wie bei jedem Link in dieses Tool bleibt der Wert nach dem `#`, bis Sie das Feld ändern oder leeren, und verschwindet dann ohne Anfrage aus der Adresse.

## API

Dieselbe Engine beantwortet die Operation `/api/v1/dhcp-option-43` der HTTP-API der Website, Feld für Feld beschrieben im OpenAPI-Vertrag auf der [API-Seite](/api), mit Beispielen aus den Referenzvektoren. Der Vertrag gibt auch an, ob diese Website die API bereitstellt.

- **Anfrage.** `{"vendor": "<id>", "addresses": "<addresses>"}`. Die Hersteller-IDs sind `cisco-wlc`, `ruckus-zonedirector`, `ruckus-smartzone`, `unifi-ip`, `extreme-wireless`, `extreme-cloudiq-switch`, `aruba` und `fortiap`; die Adressen werden durch Leerzeichen, Kommas oder Semikolons getrennt.
- **Antwort.** `vendor` (das verwendete Profil: `encoding`, `subOption`, `addressForm`, `multiple`, `vendorClass`, `useOption` und `source`), `addresses`, `option` (43 oder bei FortiAP 138), `encoding`, `hex` oder `text`, `breakdown`, `serverSnippets` und `notes` (stabile Codes).
- **Fehler.** HTTP 400, `invalid_input`, mit der Meldung der Engine: keine Adresse, ein unbekannter Hersteller, eine Adresse, die keine strikte Punktdezimalschreibweise mit vier Oktetten ist, mehr als eine Adresse bei einem Hersteller, der nur eine annimmt, oder ein Wert über 255 Byte.

Seit dem 19.10.2026 antwortet `extreme-wireless` mit einem Hex-Wert, mit `addressForm` `ascii-list` und `multiple` true: `{"vendor": "extreme-wireless", "addresses": "10.100.2.36, 10.100.2.22"}` ergibt `011831302e3130302e322e33362c2031302e3130302e322e3232`. `source.access_date` und `source.unreachable` geben an, wann die Seite jedes Herstellers zuletzt gelesen wurde oder warum das nicht möglich war.

## Quellen

Jedes Herstellerprofil beruht auf der eigenen Dokumentation dieses Herstellers, und jeder Referenzvektor nennt ein Dokument, das seine Bytes abdruckt, zitiert so, wie abgedruckt. Ein Vektor, den der zu prüfende Code erzeugt und der dann einem Hersteller zugeschrieben wird, würde nur beweisen, dass der Code mit sich selbst übereinstimmt; deshalb gibt es keinen solchen. Zwei Werte stammen aus Sekundärquellen und sind als solche gekennzeichnet: ein durchgerechnetes Beispiel für Cisco aus einem Community-Repository auf Cisco Code Exchange und ein Beispiel für RUCKUS aus einem Beitrag in der RUCKUS Community. Die Wissensdatenbank von RUCKUS gibt die Suboption nur als „03 or 06“ an; die Zuordnung von 3 zu ZoneDirector stammt aus einem Beitrag in der RUCKUS Community, daher legt der Vektor für ZoneDirector nur die beiden Bytes fest, die die Dokumente abdrucken.

- RFC 2132, Abschnitt 8.4, Vendor Specific Information (abgerufen am 19.10.2026)
- Cisco-Dokument 97066, *Configure DHCP OPTION 43 for Lightweight Access Points*, aktualisiert am 22. Juli 2026 (abgerufen am 19.10.2026)
- Cisco Code Exchange, README von cisco43calc von Brett Verney, ein Community-Repository (sekundär; abgerufen am 19.10.2026)
- Artikel 000008703 der Wissensdatenbank von RUCKUS, *Understanding DHCP Option 43 Hexadecimal code in Ruckus*, aktualisiert am 6. Mai 2020 (abgerufen am 19.10.2026)
- RUCKUS Networks Community, *How the APs discover the IP address of the controller* und *AP Discovery: How to configure DHCP option 43 to discover the controller*, Beiträge von RUCKUS Team Members (sekundär; abgerufen am 19.10.2026)
- Fortinet, *FortiWiFi and FortiAP Configuration Guide*: *Discovering, authorizing, and deauthorizing FortiAP units* (7.2.5) und *Advanced WiFi controller discovery* (8.0.1) (abgerufen am 19.10.2026)
- Hilfeartikel 204909754 von Ubiquiti, *Layer 3 Adoption for Remote UniFi Controllers* (konnte am 19.10.2026 nicht erneut gelesen werden: Die Website antwortete mit einer Bot-Abfrage)
- Extreme Networks, *ExtremeCloud IQ Controller Deployment Guide*, und das Fabric Engine User Guide für Suboption 226 (die Seiten zu ExtremeCloud IQ Controller wurden am 18.10.2026 mit HTTP 200 gelesen; am 19.10.2026 antwortete die Dokumentationswebsite mit 401 und konnte nicht erneut gelesen werden)
- HPE Aruba Networking, DHCP-Optionen für Access Points (konnte am 19.10.2026 nicht erneut gelesen werden: Zugriff verweigert)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (abgerufen am 27.10.2026): Abschnitt 3.5, das Fragment, das die Werte eines Links von „Ergebnisse teilen“ enthält

## Eine bewusste Auslassung

Aerohive wird nicht angeboten. Extreme hat Aerohive 2019 übernommen und in ExtremeCloud IQ eingegliedert, und es fand sich keine Herstellerdokumentation zu einer eigenständigen Aerohive-Suboption, nur Behauptungen aus der Community. Die einzige dokumentierte Suboption 226 gehört zu Switches mit Fabric Engine, die mit ExtremeCloud IQ kommunizieren: eine andere Geräteklasse, die eine andere Frage beantwortet. Ein Wert, der in eine produktive DHCP-Konfiguration eingefügt wird, ist der denkbar schlechteste Ort, um ungefähr richtig zu liegen; solange es keine Herstellerquelle gibt, bleibt Aerohive daher draußen. Wenn Sie diese Dokumentation haben, lässt sie sich an einem Nachmittag ergänzen.
