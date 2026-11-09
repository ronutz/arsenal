# Auswahlhilfe für OAuth-Flows

Die erste Frage jeder Integration von OAuth oder OpenID Connect, ob mit PingFederate, PingAM, PingOne oder etwas anderem, lautet: *welcher Flow*? Das Tool bildet die heutige Antwort als deterministische Entscheidung ab und nennt zu jeder Zeile den RFC dahinter.

## Drei Fragen

Welche Art von App ist es (serverseitige Webanwendung, SPA, native App, Dienst zu Dienst oder ein Gerät mit eingeschränkter Eingabe)? Muss sie wissen, **wer** der Benutzer ist (das ist die Aufgabe von OpenID Connect, aufgesetzt auf denselben Flow)? Braucht sie Zugriff, während der Benutzer abwesend ist (Refresh Token)?

## Die Antworten des Tools

Server-, SPA- und native Apps erhalten alle **Authorization Code**: vertraulich mit einem Secret, wo es ein Backend gibt, öffentlich **mit PKCE** (RFC 7636), wo nicht, und für native Apps ausdrücklich mit der Regel aus RFC 8252, den Systembrowser zu verwenden. Dienst zu Dienst erhält **Client Credentials** (RFC 6749 §4.4), mit dem Hinweis, dass dafür gilt: Refresh Token SHOULD NOT (sollten nicht) ausgestellt werden. Fernseher und Kioske erhalten den **Device Grant** (RFC 8628) mit seinem Ablauf, bei dem der user_code auf einem zweiten Gerät eingegeben wird.

## Die Hälfte, die genauso zählt

Jedes Ergebnis enthält die Liste der *vermiedenen* Flows: **Implicit** und **ROPC (password)** werden gemäß der OAuth 2.0 Security Best Current Practice (RFC 9700) namentlich ausgemustert, und die Gründe (Token in Fragmenten, Zugangsdaten in Apps) werden klar benannt. Öffentliche Clients, die Offline-Zugriff anfordern, erhalten die Anforderung der **Rotation** von Refresh Token; wer bei einem Machine-to-Machine-Flow nach der Identität eines Endbenutzers fragt, erhält eine Warnung vor dem Widerspruch statt einer falschen Antwort.

Alles wird lokal entschieden; die drei Antworten enthalten keine Secrets, und es wird nichts übertragen.

## Ergebnisse teilen

Unter Name und Grant des empfohlenen Flows erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` Ihre drei Antworten: den Anwendungstyp über seinen festen Namen (`app=spa`) und jede Frage, die Sie mit Ja beantwortet haben (`identity=1`, `offline=1`). Nichts Eingetipptes geht mit, denn es gibt nichts einzutippen. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher werden die Antworten beim Öffnen des Links nicht an den Server gesendet. Sie bleiben in der Adressleiste und im Verlauf dessen, der den Link öffnet.

- **Öffnen eines Links.** Die drei Antworten ersetzen die des Formulars, und die Seite empfiehlt im Browser denselben Flow. Ein Anwendungstyp, den die Seite nicht anbietet, oder eine andere Antwort als 1 oder 0 führt dazu, dass der ganze Link ignoriert wird. In beiden Fällen verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
