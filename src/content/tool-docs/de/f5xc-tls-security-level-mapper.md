## Was das Tool tut

Das Tool ordnet die TLS-Sicherheitsstufen von F5 Distributed Cloud (XC) und die Cipher-Suiten, die sie aushandeln, einander zu, in beide Richtungen. Wählen Sie eine Stufe (**High**, **Medium** oder **Low**), und es zeigt die genaue minimale und maximale TLS-Version und die vollständige Liste der Cipher-Suiten, jede mit Schlüsselaustausch, Forward Secrecy und Stärke versehen. Oder fügen Sie eine Cipher-Suite (IANA-Form `TLS_*` oder OpenSSL-Form mit Bindestrichen) oder eine ganze Scannerzeile ein, und es sagt Ihnen, welche Stufen diese Cipher-Suite enthalten. Alles läuft in Ihrem Browser.

## Die Tabelle, auf der das Tool beruht

Die Listen der Cipher-Suiten sind wörtlich aus der TLS Reference von F5 übernommen. Zwei Dinge an dieser Tabelle überraschen immer wieder. Erstens ist **Default die Stufe High**, also mindestens TLS 1.2 und höchstens TLS 1.3, und genau das verwendet ein HTTPS-Load-Balancer mit automatischem Zertifikat. Zweitens sind die Stufen **kumulativ**: Medium umfasst alle Cipher-Suiten von High plus vier ECDHE-CBC-Suiten, Low alle von Medium plus vier Suiten mit statischem RSA. Jede Stufe reicht bis höchstens TLS 1.3.

## Warum Ihr Scanner einen Load-Balancer bemängelt

Zwei Fragen aus der Praxis tauchen ständig auf, und das Tool beantwortet beide. Meldet ein Scanner **TLS 1.0 oder 1.1 aktiviert**, steht der Load-Balancer auf **Medium oder Low**: Diese Stufen beginnen bei TLS 1.0. Die Stufe Default/High beginnt bei TLS 1.2 und bietet die alten Protokolle daher nicht an (K000148226). Meldet ein Scanner **schwache Cipher-Suiten**, sind es fast immer die **Suiten mit statischem RSA, die die Stufe Low hinzufügt**: Sie haben keine Forward Secrecy, und genau das wertet ein Scanner ab (K000148079).

## Die Anmerkungen lesen

Jede Cipher-Suite ist mit ihrem Schlüsselaustausch (TLS 1.3, ECDHE-ECDSA, ECDHE-RSA oder RSA) markiert, mit der Angabe, ob sie Forward Secrecy (PFS) bietet, und mit einer Stärke. Die ECDHE-Suiten bieten PFS, die Suiten mit statischem RSA nicht. TLS 1.3 und die AEAD-Suiten (GCM / ChaCha20) sind stark, die CBC-SHA-Suiten mittel, die Suiten mit statischem RSA schwach.

## Ergebnisse teilen

Jeder Modus hat unter seiner eigenen Antwort eine eigene Schaltfläche **Ergebnisse teilen**, die einen Link auf diese Seite erzeugt, und zwar nur, wenn Sie sie wählen. Der Link enthält nach dem `#` den Wert dieses Modus: unter den Cipher-Suiten der Stufe die gewählte Stufe; unter den Stufen der Cipher-Suite die eingegebene Zeile, sobald darin eine Cipher-Suite erkannt wird. Eine Stufe oder eine Cipher-Suite nennt kein System und keine Person. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` folgt, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Die Stufe wird ausgewählt und die Zeile gefüllt, als wären sie angeklickt und eingegeben; beide Auswertungen folgen. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
