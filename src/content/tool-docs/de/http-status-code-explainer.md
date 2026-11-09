# HTTP-Statuscodes erklärt

Fügen Sie Statuscodes ein, einzeln (`404`), mehrere auf einmal (`301 302 307`) oder ganze Klassen (`5xx`), und jeder wird dekodiert: die Klasse, zu der er gehört, sein registrierter Name, seine dokumentierte Bedeutung und die betrieblichen Hinweise, die zählen, wenn der Code um 3 Uhr nachts in einem Log auftaucht.

## Was das Tool erklärt

Die Registry hinter dem Tool stützt sich auf den Statuskatalog aus RFC 9110 und die registrierten Erweiterungen (428/429/431/511 aus RFC 6585, 451 aus RFC 7725, 103 aus RFC 8297). Die Hinweise enthalten die Unterscheidungen, die der [begleitende Artikel](/learn/http-status-codes-the-five-families) der Website vermittelt: welche Weiterleitungen die Methode beibehalten (307/308) und welche das historisch nicht taten (301/302), warum 304 ein Handshake mit dem Cache ist und keine Weiterleitung, warum 401 mit `WWW-Authenticate` ankommen muss, während 403 unabhängig davon ablehnt, und die Lesart des Proxy-Trios bei der Triage von Vorfällen: 502 gibt dem Gespräch mit dem Backend die Schuld, 503 der Kapazität des Dienstes, 504 der Uhr.

## Die Fallback-Regel als Feature

Fügen Sie einen gültigen Code ein, den die Registry nie gesehen hat, etwa ein `599` von irgendeiner Middlebox, und das Tool meldet keinen Fehler. Es antwortet mit der Regel des Protokolls für Vorwärtskompatibilität: Ein Client, der einen Code nicht kennt, muss ihn als das `x00` seiner Klasse behandeln, sodass die erste Ziffer allein das geforderte Verhalten festlegt. Dieser Regel ist es zu verdanken, dass die Registry der Statuscodes dreißig Jahre lang wachsen konnte, ohne einen einzigen alten Client zu brechen, und das Tool betrachtet sie als Antwort, die es wert ist, angezeigt zu werden, nicht als Lücke, für die es sich entschuldigen müsste.

## Eingabesyntax

Token, getrennt durch Leerzeichen, Kommas oder Zeilenumbrüche. Jedes Token besteht entweder aus drei Ziffern im Bereich 100-599 oder ist eine Klasse der Form `1xx` bis `5xx`. Duplikate werden unter Wahrung der Reihenfolge entfernt; die Obergrenze liegt bei zwanzig Token pro Durchlauf. Alles läuft lokal in Ihrem Browser.

## Ergebnisse teilen

Ganz oben in der Auswertung, über den Karten, erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` den Inhalt des Feldes so, wie eingegeben, und sonst nichts: Statuscodes und Klassen, die nichts über Sie verraten. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert. Die Links des Decoders für HTTP-Nachrichten, die einen Statuscode an diese Seite übergeben, verwenden dasselbe `#input=` und füllen das Feld auf dieselbe Weise.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird der Text beim Öffnen des Links nicht an den Server gesendet. Er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann ihn lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Der Text füllt das Feld wie beim Tippen, und die Seite erklärt ihn; es wird nichts gesendet. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.

## Quellen

- [RFC 9110, HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110) (abgerufen am 09.11.2026): der Kernkatalog, die Regeln der Klassen und der Fallback auf x00
- [RFC 6585, Additional HTTP Status Codes](https://www.rfc-editor.org/rfc/rfc6585) (abgerufen am 09.11.2026): 428, 429, 431 und 511
- [RFC 7725, An HTTP Status Code to Report Legal Obstacles](https://www.rfc-editor.org/rfc/rfc7725) (abgerufen am 09.11.2026): 451 Unavailable For Legal Reasons
- [RFC 8297, An HTTP Status Code for Indicating Hints](https://www.rfc-editor.org/rfc/rfc8297) (abgerufen am 09.11.2026): 103 Early Hints
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (abgerufen am 01.11.2026): Abschnitt 3.5, das Fragment, das ein Link von „Ergebnisse teilen“ verwendet
