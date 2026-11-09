# Eine Übersetzung beitragen

ronutz.com ist so gebaut, dass sich eine Sprache mit sehr wenig Aufwand hinzufügen oder verbessern lässt, und Beiträge sind willkommen. Eine Sprache besteht aus zwei Teilen: einem Eintrag in der Locale-Registry und einem Sprachpaket im JSON-Format. Am Code der Anwendung muss nichts geändert werden.

## So funktioniert das System

- **Die Pakete.** Der Text jeder Sprache steht in einer einzigen JSON-Datei mit beschrifteten Sätzen, `src/i18n/messages/<code>.json`. Die Seite „Mitwirken“ bietet jedes aktive Paket zum Herunterladen an; die Downloads werden bei jedem Build aus den Quellpaketen kopiert und sind daher immer aktuell. `en.json` ist die vollständige Referenz; jedes andere Paket braucht nur die Sätze, die es übersetzt.
- **Englisch als Fallback.** Jeder Satz, der in einem Paket fehlt, wird auf Englisch angezeigt. Deshalb ist eine Teilübersetzung sofort nützlich: Das Paket wird veröffentlicht, und die fehlenden Sätze bleiben auf Englisch lesbar, bis jemand sie ergänzt.
- **Die Registry.** `src/i18n/locales.ts` führt jede Sprache mit ihrem Namen in der eigenen Sprache, ihrer Schreibrichtung und ihrem Übersetzungsstatus auf. Die Sprachauswahl, die Webadressen und die Suchmetadaten richten sich danach.

## Übersetzungsstatus

Jede Sprache hat einen `status`:

| Status | Bedeutung |
|---|---|
| `reviewed` | Jemand mit dieser Muttersprache hat das Paket gelesen und freigegeben. |
| `machine-draft` | Ein erster Entwurf, mit KI oder maschineller Übersetzung erstellt und noch nicht muttersprachlich geprüft. |
| `stub` | Noch kein Paket; die Sprache wird auf Englisch angezeigt. |

Maschinell entworfener Text wird nie als ausgefeilter muttersprachlicher Text ausgegeben. Ein `machine-draft` ist ein Ausgangspunkt, den jemand mit dieser Muttersprache auf `reviewed` hochstuft. Englisch ist die Ausgangssprache. Brasilianisches Portugiesisch wird mit KI geschrieben und nach und nach geprüft, ebenso die Oberfläche und die Tools auf Spanisch und auf Deutsch; der Bereich „Lernen“ und die übrigen Inhaltsbereiche auf Spanisch und auf Deutsch sind maschinell übersetzt, ebenso die zwölf weiteren Sprachen. Deshalb behalten brasilianisches Portugiesisch, Spanisch und Deutsch den Status `machine-draft` und ihren Hinweis, bis eine menschliche Prüfung etwas anderes bestätigt.

## Eine Sprache in vier Schritten verbessern

1. **Paket herunterladen.** Laden Sie auf der Seite „Mitwirken“ das Paket herunter, das Sie verbessern möchten (für eine neue Sprache `en.json`, die Referenz).
2. **Den Text nach jeder Beschriftung übersetzen.** Ändern Sie nur die Werte, nie eine Beschriftung (den Schlüssel links), und lassen Sie alles in geschweiften Klammern genau so, wie es ist: `{count}`, `{name}` und Ähnliches werden von der Website ausgefüllt, und eine veränderte Klammer macht die Seite kaputt. Produkt- und Fachnamen bleiben, wie sie sind (BIG-IP, CIDR, F5, Fortinet usw.), und Fachjargon schreiben Sie so, wie Fachleute in Ihrer Sprache ihn tatsächlich verwenden.
3. **Status setzen.** Tragen Sie den Status in `_meta.status` des Pakets ein: `machine-draft` für einen Entwurf mit KI oder maschineller Übersetzung, `reviewed`, wenn die Sprache Ihre Muttersprache ist und Sie den Text geprüft haben.
4. **Zurücksenden.** Senden Sie die bearbeitete Datei über die Seite „Mitwirken“ per E-Mail und nennen Sie die Sprache, oder öffnen Sie einen Pull Request im öffentlichen Repository. Jede Einsendung wird von Hand geprüft.

## Zeichensetzung

- **Englisch** wird ohne Geviertstrich (em dash) geschrieben. Stattdessen stehen dort Komma, Doppelpunkt, Klammern oder ein neuer Satz; der Halbgeviertstrich (en dash) steht nur zwischen den Zahlen eines Bereichs (10–20).
- **Jede andere Sprache behält ihre eigene natürliche Zeichensetzung.** Übernehmen Sie nicht die englische Regel: Romanische und slawische Sprachen setzen ihren eigenen Strich (im Portugiesischen den Travessão, im Spanischen die Raya, im Russischen das тире), wo ihre Typografie ihn verlangt; Deutsch und die skandinavischen Sprachen setzen als Gedankenstrich den Halbgeviertstrich mit Leerzeichen; Chinesisch verwendet seine eigenen Zeichen in voller Breite (，。：；) und seinen eigenen Strich in doppelter Breite. Französisch behält das Leerzeichen vor ; : ! und ?.

## Hinweise

- **Sprachen, die von rechts nach links geschrieben werden** (etwa Arabisch), übernimmt das Layout; die Schreibrichtung kommt aus der Registry, Sie übersetzen also nur den Text.
- **Teilpakete sind willkommen.** Wer nur die Navigation und die Startseite übersetzt, leistet bereits einen wertvollen ersten Beitrag.
- **Eine Sprache steht noch nicht in der Registry?** Ergänzen Sie `LOCALES` in `src/i18n/locales.ts` um eine Zeile mit dem Code, dem Namen in der eigenen Sprache, dem englischen Namen, der Schreibrichtung und `status: "stub"`, und legen Sie dann Ihr Paket an. Oder bitten Sie per E-Mail darum; dann wird die Sprache für Sie ergänzt.
