## Was das Tool tut

Das Tool berechnet genau den TXT-Eintrag, den Sie veröffentlichen, um eine ACME-Challenge vom Typ dns-01 zu bestehen. Fügen Sie das Challenge-Token und Ihren ACME-Kontoschlüssel ein, als JWK oder als dessen Thumbprint, und Sie erhalten den Namen des Eintrags unter `_acme-challenge`, den Wert für den TXT-Eintrag sowie die Zwischenergebnisse Key Authorization und Thumbprint, aus denen er abgeleitet wurde. Alles läuft in Ihrem Browser mit dem nativen SHA-256 von Web Crypto; Ihr Schlüssel verlässt die Seite nie, und es werden nur seine öffentlichen Bestandteile verwendet.

## Wozu dns-01 dient

ACME (RFC 8555) automatisiert die Ausstellung von Zertifikaten, indem es Sie herausfordert, die Kontrolle über eine Domain nachzuweisen. Die Challenge dns-01 tut das über DNS: Sie veröffentlichen einen bestimmten TXT-Eintrag unter der Domain, und die CA fragt ihn ab. Anders als http-01 braucht dns-01 keine eingehende Verbindung zu Ihrem Server, funktioniert also hinter einer Firewall oder einem Load-Balancer, und sie ist der einzige Challenge-Typ, der einen Wildcard-Namen validieren kann.

## Die Berechnung

Der Wert des Eintrags ist nicht beliebig; die CA berechnet ihn aus Ihrem Kontoschlüssel nach, und genau das bindet die Challenge an Sie. Die Kette hat drei Schritte. Erstens wird der SHA-256-Thumbprint Ihres öffentlichen Kontoschlüssels in der kanonischen Form nach RFC 7638 gebildet und base64url-kodiert. Zweitens entsteht die Key Authorization, indem Token und Thumbprint mit einem Punkt verbunden werden: `token.thumbprint`. Drittens ist der Wert des TXT-Eintrags das base64url des SHA-256-Hashwerts der Key Authorization. Der Eintrag wird unter `_acme-challenge.<domain>` veröffentlicht; ein Wildcard-Name wie `*.example.com` wird unter `_acme-challenge.example.com` validiert.

## Nur Ihr öffentlicher Schlüssel wird verwendet

Der Thumbprint nach RFC 7638 wird nur über die erforderlichen öffentlichen Bestandteile des Schlüssels berechnet: bei einem EC-Schlüssel über die Kurve und die Koordinaten x und y, bei einem RSA-Schlüssel über Modulus und Exponent. Ihr privater Schlüssel wird für die Berechnung des Eintrags nie gebraucht, fügen Sie also nur den öffentlichen JWK ein. Wird ein vollständiger Schlüssel eingefügt, werden seine privaten Felder ignoriert und nie angezeigt.

## Verwendung

Geben Sie das Token aus der Challenge und Ihren Kontoschlüssel ein, optional auch die Domain, um den vollständigen Namen des Eintrags zu sehen. Veröffentlichen Sie den ausgegebenen Wert als TXT-Eintrag unter `_acme-challenge.<domain>`, warten Sie, bis er sich verbreitet hat, und lassen Sie dann Ihren ACME-Client fortfahren. Dasselbe Token und derselbe Schlüssel ergeben immer denselben Wert; Sie können also prüfen, ob das, was Ihr Client veröffentlicht, mit dem übereinstimmt, was dieses Tool berechnet.

## Ergebnisse teilen

Unter dem Eintrag erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` drei Werte: das Challenge-Token, den Thumbprint des Kontoschlüssels (den von der Seite berechneten oder den von Ihnen eingegebenen) und die Domain. Das Schlüsselfeld enthält er nie: Eine Datei mit einem Kontoschlüssel enthält neben den öffentlichen Bestandteilen den privaten Bestandteil `d`, und der Link enthält keinen davon. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Nichts davon ist geheim. Laut [RFC 8555](https://www.rfc-editor.org/rfc/rfc8555) (abgerufen am 27.10.2026) wird die Key Authorization (Token und Thumbprint, mit einem Punkt verbunden) bei der Challenge http-01 im Klartext unter `/.well-known/acme-challenge/<token>` ausgeliefert (Abschnitt 8.3), und der Eintrag für dns-01 weist die Kontrolle über das DNS der Domain nach, die der Link nicht verschafft (Abschnitt 8.4). Nach [RFC 7638](https://www.rfc-editor.org/rfc/rfc7638) (Abschnitt 3.2.1, abgerufen am 27.10.2026) hat ein privater Schlüssel den Thumbprint seines öffentlichen Schlüssels; der Link benennt den Schlüssel also, ohne ihn zu enthalten. Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher werden die Werte beim Öffnen des Links nicht an den Server gesendet. Sie bleiben in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann sie lesen.

- **Öffnen eines Links.** Token und Domain füllen ihre Felder, und der Thumbprint kommt in das Schlüsselfeld, das einen solchen annimmt; die Seite berechnet den Eintrag wie beim Einfügen, mit Web Crypto im Browser. Ein Token oder ein Thumbprint außerhalb des base64url-Alphabets, das die Seite verlangt, führt dazu, dass der ganze Link ignoriert wird. In beiden Fällen verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
- **Nachweis.** Die Prüfungen der Website für geteilte Links erzeugen den Link aus einem privaten Kontoschlüssel (dem P-256-Beispiel aus RFC 7515, einschließlich `d`) und bestätigen, dass darin weder `d` noch ein öffentlicher Bestandteil noch der JWK selbst vorkommt, weder wie eingegeben noch prozentkodiert, formularkodiert oder dekodiert.
