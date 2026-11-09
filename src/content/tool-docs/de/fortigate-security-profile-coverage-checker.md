## Was das Tool tut

Beschreiben Sie eine Richtlinie (den Datenverkehr, die Einstellung der SSL-Inspektion, den Inspektionsmodus und welche Sicherheitsprofile angehängt sind), und das Tool sagt Ihnen, welche Profile diesen Datenverkehr tatsächlich **sehen** können. Es läuft vollständig in Ihrem Browser.

## Die Abhängigkeitskette

Ein Sicherheitsprofil wirkt nur, wenn jede Voraussetzung davor erfüllt ist:

1. Eine Firewall-Richtlinie **lässt** den Datenverkehr **zu**. Was blockiert wurde, prüft nichts mehr.
2. Die SSL-Inspektion **entschlüsselt** ihn, sofern er verschlüsselt ist.
3. Der Inspektions**modus** unterstützt die Funktion.
4. Erst dann wirkt das Profil.

Das Tool geht diese Kette für jedes Profil durch und nennt das Glied, das gescheitert ist. Die meisten Meldungen, ein Profil funktioniere nicht, klären sich bei **Schritt 2**: Der Datenverkehr ist HTTPS, die Richtlinie nutzt Zertifikatsinspektion statt Deep Inspection, und es gibt schlicht nichts zu lesen. Das Profil wirkt angehängt, die Konfiguration wirkt korrekt, und es ist blind.

## Blind ist nicht dasselbe wie eingeschränkt

Genau diese Unterscheidung will das Tool treffen, und ein Fehler in die eine oder die andere Richtung wäre schlimmer, als gar nichts zu sagen.

**Blind** heißt angehängt, konfiguriert und wirkungslos. AntiVirus, IPS (Intrusion Prevention System), DLP (Data Loss Prevention) und der Dateifilter brauchen alle den Body der Nachricht. Hinter einer Zertifikatsinspektion gibt es keinen Body, also sind sie nicht teilweise wirksam, sondern untätig.

**Eingeschränkt** heißt, dass das Profil mit weniger als dem vollständigen Bild arbeitet. Application Control und Webfilter können manchen Datenverkehr noch anhand von Metadaten aus dem Handshake wie SNI erkennen, daher greift eine Richtlinie nach Hostnamen weiterhin, eine Richtlinie nach URL-Pfad dagegen nicht.

Jemandem zu sagen, ein Profil wirke teilweise, wenn es überhaupt nichts sieht, ist der gefährlichere Fehler; deshalb werden beide Fälle getrennt gemeldet und unterschiedlich dargestellt.

## Zertifikatsinspektion ist etwas anderes, nicht etwas Schwächeres

Sie validiert das Zertifikat und liest den Handshake. Die Nutzdaten entschlüsselt sie nie. Wer sie als „leichtere Deep Inspection“ beschreibt, landet direkt beim blinden Profil; deshalb formuliert das Tool sie als anderen Mechanismus und nicht als niedrigere Einstellung.

Eine Richtlinie auf Deep Inspection umzustellen, ist die eine Änderung, die alle blinden Profile auf einmal behebt, und sie ist eine echte Entscheidung, kein Kontrollkästchen. Deep Inspection heißt, TLS auf der FortiGate zu terminieren, was Folgen für Zertifikatsvertrauen, Datenschutz und Leistung hat, die in diese Entscheidung gehören.

## Einschränkungen je Modus

Selbst wo Abdeckung besteht, schränkt der Flow-Modus manches Verhalten ein, und das Tool sagt, wo. AntiVirus scannt im Flow-Modus die Datei, während sie durchläuft, statt sie vollständig zu puffern; bei sehr großen Dateien und tief verschachtelten Archiven wird die Abdeckung daher dünn. Außerdem markiert das Tool die Aktion für übergroße Dateien, deren Standardwert Dateien oberhalb des Schwellenwerts **durchlässt**, sodass gerade die größten Downloads ungeprüft bleiben, sofern das nicht bewusst geändert wird.

## Was das Tool nicht modelliert

**Abdeckung, nicht Erkennung.** Das Tool beantwortet, ob ein Profil den Datenverkehr sehen kann. Es behauptet nie, ein Profil würde eine bestimmte Bedrohung abfangen, denn das hängt von Signaturen, Datenbanken und der Bedrohung selbst ab, und nichts davon lässt sich aus einer Richtlinienbeschreibung berechnen.

Es bewertet auch nicht die Qualität der Profilkonfiguration: Ein AntiVirus-Profil, in dem jeder Scan deaktiviert ist, gilt hier als wirksam, denn die gestellte Frage betrifft die Sichtbarkeit.

## Ergebnisse teilen

Unter der Tabelle zur Abdeckung erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` den Inhalt des Feldes so, wie eingefügt. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Die Direktivenzeilen nennen Profilarten und Inspektionsmodi, nicht Ihr Netzwerk, daher ergänzt das Popover keinen eigenen Warnhinweis. Bevor ein Link angeboten wird, wird das Feld nach Zugangsdaten durchsucht, die FortiOS oder ein Standard definiert: eine `set`-Zeile einer Einstellung, die in der [CLI-Referenz von FortiOS 7.6.8](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) einen Passworttyp hat (`psksecret`, `password`, `passwd`, `secret`, `key`, `auth-pwd` und die übrigen; abgerufen am 01.11.2026), oder der `name` einer SNMP-Community ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), Abschnitt 3.2.5), jeder `ENC`-Wert (das Advisory [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007) von Fortinet, abgerufen am 01.11.2026, hält zu solchen Daten, die dort veröffentlicht werden, wo andere sie lesen können, fest: „should currently be considered "easy to decrypt"“), ein Paar `psksecret=` oder `password=` mit denselben Namen auf einer Direktivenzeile, ein privater Schlüssel im PEM-Format ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468)), ein JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)), eine Zeile `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), Abschnitt 11.6.2), ein Passwort in einer URL oder eine AWS-Zugriffsschlüssel-ID. Findet sich eines davon, gibt es keinen Link: Das Popover nennt die Zeile, und Sie setzen einen Platzhalter an seine Stelle und wählen die Schaltfläche erneut; so teilen Sie genau das, was Sie gewählt haben (in einem eingefügten Feld wird nie ein Wert ersetzt, denn das würde ändern, was gesendet wird). Ein Wert, dessen Name nur nach einem Secret aussieht, verhindert den Link nicht; das Popover nennt den ersten solchen Wert.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` folgt, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Das Feld wird wie beim Einfügen gefüllt, und die Seite prüft die Abdeckung. Es wird nichts kontaktiert. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.

## Einordnung

Das Tool ergänzt den Artikel zu den Sicherheitsprofilen von FortiGate, der Flow- und Proxy-Modus vollständig erklärt, sowie den Artikel zu den Modi der SSL-Inspektion. Für die Vorbereitung auf NSE 4 unterstützt es die Prüfungsziele 3.02 bis 3.05.
