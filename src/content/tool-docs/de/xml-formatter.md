## Was das Tool tut

Fügen Sie ein XML-Dokument ein, und das Tool sagt Ihnen zuerst, ob es wohlgeformt ist. Ist es das nicht, erhalten Sie die Zeile, die Spalte (in Zeichen gezählt), einen stabilen Fehlercode, eine verständliche Meldung, die die Regel und ihren Abschnitt in der XML-1.0-Empfehlung nennt, und die fehlerhafte Zeile mit einem Caret unter der Spalte. Ist es wohlgeformt, erhalten Sie es lesbar formatiert mit zwei Leerzeichen, vier Leerzeichen oder einem Tab pro Ebene oder minimiert zurück, mit behaltenen oder entfernten Kommentaren. Alles läuft in Ihrem Browser.

Seine Regeln stammen aus der W3C-Empfehlung [Extensible Markup Language (XML) 1.0 (Fifth Edition)](https://www.w3.org/TR/xml/) vom 26. November 2008. Es steht neben dem [JSON-Formatierer](/tools/json-formatter) und dem [Konverter JSON ↔ YAML](/tools/json-yaml-convert). Der [XML-Decoder](/tools/xml-decoder) ist ein anderes Tool: Er liest die Struktur eines Dokuments und seine Angriffsfläche (DOCTYPE, externe Entitäten, Entity-Expansion) und schreibt es nicht um.

## Was die Bewertung prüft

Diese Regeln, jede aus der Empfehlung, entscheiden hier über die Wohlgeformtheit:

- **Ein Wurzelelement** (Abschnitt 2.1): genau ein Element auf der obersten Ebene; davor und danach nur Kommentare, Verarbeitungsanweisungen und Whitespace.
- **Zulässige Zeichen** (Abschnitt 2.2): Tabulator, Zeilenvorschub, Wagenrücklauf und die Unicode-Bereiche der Produktion `Char`. Ein Steuerzeichen wie U+0001, ein einzelnes Surrogat, U+FFFE oder U+FFFF wird abgelehnt, wo immer es steht.
- **Namen** (Abschnitt 2.3): Element- und Attributnamen, Ziele von Verarbeitungsanweisungen und Entitätsnamen folgen der Produktion `Name`, einschließlich Buchstaben außerhalb von ASCII.
- **Zeichendaten** (Abschnitt 2.4): `&` und `<` stehen im Text nie für sich allein, und die Folge `]]>` kommt im Text nie vor.
- **Kommentare** (Abschnitt 2.5): kein `--` im Inneren und kein `--->` am Ende.
- **Verarbeitungsanweisungen** (Abschnitt 2.6): ein Zielname, dann Whitespace oder `?>`; das Ziel lautet in keiner Schreibweise aus Groß- und Kleinbuchstaben `xml`.
- **CDATA-Abschnitte** (Abschnitt 2.7): Sie enden beim ersten `]]>` und stehen nur innerhalb eines Elements.
- **Die XML-Deklaration** (Abschnitt 2.8): nur ganz am Anfang, ohne etwas davor, und in der Form `<?xml version="1.x" encoding="..." standalone="..."?>`, wobei encoding und standalone optional sind und in dieser Reihenfolge stehen.
- **Die Dokumenttyp-Deklaration** (Abschnitt 2.8): einmal, vor dem Wurzelelement, mit einem Namen, einem optionalen Bezeichner `SYSTEM` oder `PUBLIC` (ein öffentlicher Bezeichner verwendet nur die Zeichen, die Produktion [13] zulässt) und einer optionalen internen Teilmenge, die nur Markup-Deklarationen, Kommentare, Verarbeitungsanweisungen, Parameter-Entitätsreferenzen und Whitespace enthält, ohne Parameter-Entitätsreferenz innerhalb einer Deklaration (die Regel PEs in Internal Subset). Entitätsdeklarationen in der internen Teilmenge werden gegen ihre Grammatik geprüft (Abschnitt 4.2).
- **Tags und Attribute** (Abschnitt 3.1): Start-Tags, End-Tags und Tags für leere Elemente (Empty-Element Tags); jedes End-Tag passt zum offenen Element (Element Type Match); kein Attribut kommt in einem Tag zweimal vor (Unique Att Spec); jeder Attributwert steht in Anführungszeichen und enthält kein `<`.
- **Referenzen** (Abschnitt 4.1): Jedes `&` leitet eine wohlgeformte Referenz ein; eine Zeichenreferenz bezeichnet ein zulässiges Zeichen; eine Entitätsreferenz bezeichnet eine deklarierte Entität, wenn die Regel Entity Declared gilt, also ohne DTD, mit nur einer internen Teilmenge ohne Parameter-Entitätsreferenzen oder mit `standalone="yes"`. Ohne Deklaration gibt es nur `&amp;`, `&lt;`, `&gt;`, `&apos;` und `&quot;`, daher werden HTML-Namen wie `&nbsp;` abgelehnt. Eine Referenz auf eine mit `NDATA` deklarierte Entität wird abgelehnt (Parsed Entity), ebenso eine direkte Referenz auf eine externe Entität innerhalb eines Attributwerts (No External Entity References).

Was das Tool **nicht** prüft, offen benannt:

- **Gültigkeit.** Ob das Dokument einer DTD, einem XML Schema oder einem anderen Schema folgt, ist eine eigene Frage; dieses Tool prüft nur die Wohlgeformtheit.
- **Die innere Grammatik der Deklarationen `<!ELEMENT`, `<!ATTLIST` und `<!NOTATION`** sowie alles in einer externen DTD, die nie gelesen wird.
- **Regeln, die den Ersetzungstext einer Entität brauchen**, weil nie eine Entität expandiert wird: eine indirekte Referenz auf eine externe Entität in einem Attributwert, ein `<`, das über eine Entität in einen Attributwert gelangt, Rekursion zwischen Entitäten und die Wohlgeformtheit des Ersetzungstexts selbst.
- **Namen, wenn der DOCTYPE anderswohin verweist.** Nennt der DOCTYPE eine externe DTD oder verwendet die interne Teilmenge Parameter-Entitäten (und die Deklaration enthält nicht `standalone="yes"`), kann ein Entitätsname an einer Stelle deklariert sein, die dieses Tool nie liest; unbekannte Namen werden daher akzeptiert, und ein Hinweis weist darauf hin.
- **Namespaces.** Präfixe bleiben Teil der Namen; ob jedes Präfix deklariert ist, regelt die eigene Empfehlung Namespaces in XML, nicht XML 1.0, und es wird nicht geprüft.
- **Die Kodierungsdeklaration.** Was Sie einfügen, ist bereits Text, daher bleibt der Name der Kodierung so, wie er geschrieben ist, und wird mit nichts verglichen.

## Was „nicht signifikant“ hier heißt

Abschnitt 2.10 der Empfehlung legt fest, dass ein XML-Prozessor „MUST always pass all characters in a document that are not markup through to the application“, also alle Zeichen, die kein Markup sind, immer an die Anwendung weitergeben muss. Whitespace in einem Dokument gehört zu den Daten, sofern nichts anderes festgelegt ist. Ein Formatierer muss daher entscheiden, welchen Whitespace er als Layout behandeln darf, und dieser entscheidet eng:

- **Der einzige Text, den er ändert, ist Whitespace zwischen Elementen**: ein Textknoten nur aus Leerzeichen, Tabs und Zeilenumbrüchen innerhalb eines Elements, das mindestens ein Kindelement hat und keine anderen Zeichendaten enthält. Der Modus „Lesbar“ ersetzt jeden solchen Knoten durch einen Zeilenumbruch und die Einrückung der nächsten Zeile; „Minimiert“ entfernt ihn. Whitespace außerhalb des Wurzelelements ist nach Abschnitt 2.4 Markup und wird daher genauso angeordnet.
- **Gemischter Inhalt bleibt unangetastet.** Laut Abschnitt 3.2.2 hat ein Element gemischten Inhalt (Mixed Content), wenn es „may contain character data, optionally interspersed with child elements“, also Zeichendaten enthalten kann, optional durchsetzt mit Kindelementen. Enthält ein Element anderen Text als Whitespace, eine Zeichen- oder Entitätsreferenz oder einen CDATA-Abschnitt, wird sein gesamter Inhalt einschließlich der Kindelemente genau so übernommen, wie er geschrieben ist: Ein Zeilenumbruch dort würde den Text ändern.
- **`xml:space="preserve"` wird beachtet.** Abschnitt 2.10 definiert das besondere Attribut `xml:space` mit den Werten `default` und `preserve`; `preserve` signalisiert, dass Anwendungen den gesamten Whitespace erhalten sollen, und diese Absicht gilt für jedes Element darin, „unless overridden with another instance of the xml:space attribute“, also sofern keine weitere Instanz des Attributs sie aufhebt. Inhalt unter `preserve` wird so übernommen, wie er geschrieben ist, und ein Element darin mit `xml:space="default"` wird wieder formatiert. Jeder andere Wert ist ein Fehler, von dem sich ein Prozessor laut Empfehlung erholen darf, indem er das Attribut ignoriert; dieses Tool ignoriert es beim Formatieren, belässt es so, wie es geschrieben ist, und ergänzt einen Hinweis.
- **Ein Element ohne Kindelement behält seinen Inhalt so, wie er geschrieben ist**, auch wenn dieser nur aus Whitespace oder aus Whitespace und Kommentaren besteht. `<a>   </a>` bleibt `<a>   </a>`, und wenn Kommentare entfernt werden, behält ein `<a>` mit einem Kommentar zwischen zwei Zeilenumbrüchen die beiden Zeilenumbrüche.

**Ein Schema kann diesem Whitespace dennoch Bedeutung geben.** Ohne eine DTD oder ein Schema zu lesen, kann ein Parser nicht wissen, ob ein Element Elementinhalt oder gemischten Inhalt hat; Abschnitt 2.10 verlangt nur von einem validierenden Prozessor, der Anwendung mitzuteilen, welcher Whitespace in Elementinhalt steht. Ein Schema, das ein Element als Text deklariert, könnte sogar den Whitespace zwischen seinen Kindelementen zum Teil seines Werts machen. Kommt es einem Empfänger Ihres Dokuments darauf an, behalten Sie das Original.

## Was genau so bleibt, wie es geschrieben ist

- Text, CDATA-Abschnitte, Kommentare (sofern Sie sie nicht entfernen) und Verarbeitungsanweisungen, Zeichen für Zeichen.
- Die XML-Deklaration, so, wie eingegeben, einschließlich der Anführungszeichen.
- Jeder Attributwert zwischen seinen Anführungszeichen, mit dem Anführungszeichen, mit dem er geschrieben wurde: Einfache bleiben einfach, doppelte bleiben doppelt. Nur der Whitespace innerhalb eines Tags wird bereinigt: ein Leerzeichen vor jedem Attribut, keines um `=` und keines vor `>` oder `/>`.
- Ein Tag für ein leeres Element bleibt ein solches Tag (`<b/>`), und ein Start-Tag mit folgendem End-Tag bleibt so (`<c></c>`).
- Zeichenreferenzen (`&#169;`, `&#x2122;`) und Entitätsreferenzen (`&amp;`, `&org;`) werden so übernommen, wie sie geschrieben sind, und nie durch die Zeichen ersetzt, für die sie stehen.
- Der DOCTYPE wird einschließlich der internen Teilmenge als Text übernommen, mitsamt allen Zeilenumbrüchen.

Zwei Änderungen erfolgen immer, und das Ergebnis weist darauf hin, wenn sie eintreten: Eine Byte Order Mark (U+FEFF) am Anfang wird entfernt, und ein Wagenrücklauf mit folgendem Zeilenvorschub oder ein einzelner Wagenrücklauf wird als Zeilenvorschub gelesen, wie es Abschnitt 2.11 von jedem XML-Prozessor verlangt. Die Ausgabe endet ohne abschließenden Zeilenumbruch.

## Sicherheit: nichts wird expandiert, nichts abgerufen

Das Tool expandiert nie eine Entität, liest nie eine externe DTD und ruft nie einen Bezeichner `SYSTEM` oder `PUBLIC` ab: Der DOCTYPE bleibt Text, und das Einzige, was das Tool aus einer internen Teilmenge erfährt, ist, welche allgemeinen Entitäten wie deklariert sind. Ein Dokument, das für einen Angriff über externe XML-Entitäten oder für einen Angriff per Entity-Expansion gebaut ist, ist hier daher nur Text. Die Eingabe ist auf 2.000.000 Zeichen und 1.000 Verschachtelungsebenen begrenzt, und der Parser liest den Text in einem einzigen Durchgang, daher kann ein feindseliges Dokument die Seite nicht zum Hängen bringen. Um zu sehen, was ein solches Dokument bei einem Parser anrichten würde, der Entitäten tatsächlich expandiert, verwenden Sie den XML-Decoder.

## Signierte Dokumente

Formatieren Sie ein signiertes Dokument nicht um, etwa eine signierte SAML-Assertion. Um eine Referenz zu validieren, beschafft die prüfende Seite die signierten Daten, wendet die Transforms der Signatur an, bildet den Digest des Ergebnisses und vergleicht ihn mit dem Digest-Wert in der Signatur; jede Abweichung lässt die Validierung scheitern ([XML Signature 1.1, Abschnitt 3.2.1](https://www.w3.org/TR/xmldsig-core1/)). Laut der Core-Spezifikation von SAML SHOULD (sollten) Implementierungen Exclusive XML Canonicalization verwenden, sowohl für die signierten Informationen als auch als Transform ([SAML 2.0 Core, Abschnitt 5.4.3](https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf)). Die exklusive Kanonisierung behandelt Whitespace wie Canonical XML ([Exclusive XML Canonicalization, Abschnitte 1.1 und 3](https://www.w3.org/TR/xml-exc-c14n/)), und Canonical XML behält „all whitespace in character content“, also allen Whitespace im Zeicheninhalt, einschließlich des Whitespace zwischen Tags ([Canonical XML 1.1, Abschnitt 1.1 und Beispiel 3.2](https://www.w3.org/TR/xml-c14n/)). Wer ein signiertes Dokument neu einrückt, ändert daher den Digest, und die Signatur lässt sich nicht mehr verifizieren. Eine formatierte Kopie zu lesen, ist unbedenklich; sie weiterzugeben, nicht. Um zu lesen, was eine SAML-Nachricht zusichert und ob und wie sie signiert ist, verwenden Sie den [SAML-Decoder](/tools/saml-decoder).

## Optionen

- **Modus.** „Lesbar“ setzt jedes Kind eines Elements mit Elementinhalt in eine eigene Zeile, eine Ebene tiefer eingerückt als das Elternelement, mit dem End-Tag wieder auf der Ebene des Elternelements. „Minimiert“ entfernt denselben Whitespace und fügt keinen hinzu.
- **Einrückung.** Zwei Leerzeichen, vier Leerzeichen oder ein Tab pro Ebene (nur im Modus „Lesbar“).
- **Kommentare behalten.** Standardmäßig aktiviert. Ist die Option deaktiviert, wird jeder Kommentar weggelassen, innerhalb und außerhalb des Wurzelelements, und die Zähler nennen, wie viele.

## Fehlercodes

| Code | Bedeutung | Abschnitt |
|---|---|---|
| `empty` | Nur Whitespace (von der API gemeldet; die Seite wartet einfach) | |
| `too-large` | Mehr als 2.000.000 Zeichen | |
| `too-deep` | Mehr als 1.000 verschachtelte Elemente | |
| `illegal-character` | Ein Zeichen außerhalb von `Char` | 2.2 |
| `bad-xml-declaration` | Eine fehlerhafte XML-Deklaration oder `<?XML` am Anfang | 2.8 |
| `misplaced-xml-declaration` | Eine XML-Deklaration an einer anderen Stelle als ganz am Anfang | 2.6, 2.8 |
| `bad-pi` | Eine Verarbeitungsanweisung ohne gültiges Ziel | 2.6 |
| `unterminated-pi` | Kein `?>` | 2.6 |
| `unterminated-comment` | Kein `-->` | 2.5 |
| `comment-double-hyphen` | `--` in einem Kommentar oder `--->` | 2.5 |
| `unterminated-cdata` | Kein `]]>` | 2.7 |
| `cdata-outside-root` | Ein CDATA-Abschnitt außerhalb jedes Elements | 2.7 |
| `bad-doctype` | Ein fehlerhafter DOCTYPE | 2.8 |
| `unterminated-doctype` | Ein DOCTYPE, der nie geschlossen wird | 2.8 |
| `bad-internal-subset` | In der internen Teilmenge etwas anderes als Deklarationen, Kommentare, PIs, Parameter-Entitätsreferenzen und Whitespace, eine Parameter-Entitätsreferenz dort innerhalb einer Deklaration oder eine fehlerhafte Entitätsdeklaration | 2.8, 4.2 |
| `misplaced-doctype` | Ein DOCTYPE nach dem Beginn des Wurzelelements oder ein zweiter | 2.8 |
| `unknown-markup` | `<!`, das weder einen Kommentar noch einen CDATA-Abschnitt noch den DOCTYPE einleitet | |
| `bad-start-tag` | Ein Start-Tag ohne gültigen Namen oder mit einem verirrten Zeichen darin | 3.1 |
| `bad-attribute` | Kein `=`, keine Anführungszeichen oder kein Whitespace vor einem Attribut | 3.1 |
| `duplicate-attribute` | Dasselbe Attribut zweimal in einem Tag | 3.1 |
| `lt-in-attribute` | Ein `<` in einem Attributwert | 3.1 |
| `unterminated-tag` | Die Eingabe endet innerhalb eines Tags | 3.1 |
| `bad-end-tag` | Etwas anderes als Whitespace zwischen dem Namen eines End-Tags und seinem `>` | 3.1 |
| `mismatched-end-tag` | Ein End-Tag, das nicht zum offenen Element passt | 3.1 |
| `unexpected-end-tag` | Ein End-Tag ohne offenes Element | 3.1 |
| `unclosed-element` | Ein Element, das nie geschlossen wird (gemeldet an der Stelle, an der es geöffnet wird) | 3.1 |
| `bad-reference` | `&`, auf das keine wohlgeformte Referenz folgt | 2.4, 4.1 |
| `illegal-char-reference` | Eine Zeichenreferenz auf ein Zeichen außerhalb von `Char` | 4.1 |
| `undeclared-entity` | Eine Referenz auf eine nicht deklarierte Entität, wenn Entity Declared gilt | 4.1 |
| `unparsed-entity-reference` | Eine Referenz auf eine mit `NDATA` deklarierte Entität | 4.1 |
| `external-entity-in-attribute` | Eine direkte Referenz auf eine externe Entität in einem Attributwert | 3.1 |
| `cdata-end-in-text` | `]]>` im Text | 2.4 |
| `text-outside-root` | Text vor oder nach dem Wurzelelement | 2.1, 2.8 |
| `multiple-roots` | Ein zweites Element der obersten Ebene | 2.1 |
| `no-root` | Überhaupt kein Element | 2.1 |

## Durchgerechnete Beispiele

- **Die Schaltfläche „Beispiel“**: eine SAML-2.0-ähnliche Response in einer Zeile, wie sie von einem Binding ankommt, mit den Namespaces `samlp` und `saml`, einem Statuscode `Success` und einer NameID `emailAddress` (die Namen aus dem Standard [OASIS SAML 2.0 Core](https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf); die Nachricht ist nicht signiert). Lesbar formatiert mit zwei Leerzeichen werden daraus 18 Zeilen; minimiert man diese Zeilen, erhält man die eine Zeile Byte für Byte zurück. Das `&amp;` in `<saml:AttributeValue>admin &amp; auditor</saml:AttributeValue>` bleibt `&amp;`.
- **Gemischter Inhalt**: In `<para>Use <code>--force</code> only when <emphasis>all</emphasis> nodes agree.</para>` wird nichts neu eingerückt, und ein `<para>`, dessen Text über drei Zeilen läuft, behält seine Zeilenumbrüche, seine Leerzeichen und die Position seines End-Tags.
- **`xml:space`**: Unter `<poem xml:space="preserve">` bleiben der Zeilenumbruch und die drei Leerzeichen vor dem zweiten `<line>` erhalten; innerhalb von `<listing xml:space="preserve">` wird ein Kind `<meta xml:space="default">` mit zwei Kindelementen wieder neu angeordnet.
- **CDATA, Kommentare, Verarbeitungsanweisungen**: `<step id="1"><![CDATA[if (a < b && c) { go(); }]]></step>` bleibt so, wie geschrieben, in einer Zeile; `<?xml-stylesheet type="text/xsl" href="view.xsl"?>` ist eine Verarbeitungsanweisung (ihr Ziel beginnt mit `xml-`, und das ist nicht das reservierte `xml`) und bleibt erhalten; `<step id='2'>` behält seine einfachen Anführungszeichen.
- **Ein DOCTYPE mit Referenzen**: `<from>&org;</from>` behält `&org;` (in der internen Teilmenge deklariert, nie expandiert), `<sign>&#169; 2026 &#x2122;</sign>` behält beide Zeichenreferenzen, und `<to   lang = "pt-BR" >` wird zu `<to lang="pt-BR">`.
- **Ablehnungen**: `<a>AT&T</a>` stoppt in Zeile 1, Spalte 6 mit `bad-reference`; `<a>&nbsp;</a>` mit `undeclared-entity`; ein Zeilenumbruch vor `<?xml version="1.0"?>` mit `misplaced-xml-declaration` in Zeile 2, Spalte 1.

## Herkunft

Die Engine ist ein einziger Durchgang über den Text mit einem expliziten Element-Stack, ohne Uhr, ohne Netzwerk und ohne Zufall. Sie bringt Referenzvektoren (Golden Vectors) mit (Satz `xml-formatter-golden-2026-10-26`): 20 akzeptierte Dokumente, deren Ausgabe Byte für Byte festgelegt ist und die von Hand aus den obigen Regeln ausgeschrieben wurden, bevor die Engine lief, und 42 Ablehnungen, festgelegt nach Code, Zeile und Spalte, mindestens eine für jeden Fehlercode. Jedes akzeptierte Dokument wird außerdem auf zwei Eigenschaften geprüft: Ein erneutes Formatieren der Ausgabe ändert nichts, und das Minimieren der Ausgabe ergibt denselben Text wie das Minimieren der Eingabe. Während der Entwicklung wurden die Bewertungen an rund 500.000 erzeugten Dokumenten mit denen des Parsers Expat 2.6.1 verglichen, der mit Python 3.13 ausgeliefert wird, und stimmten bei allen überein, bis auf eine Klasse: Expat akzeptiert eine Versionsnummer, die nicht „1.“ gefolgt von Ziffern ist, etwa `"10"` oder `"2.0"`, was Produktion [26] der Empfehlung (`'1.' [0-9]+`) nicht zulässt. Die Errata-Seite der Empfehlung wurde am selben Tag gelesen: Ihre vorgeschlagene Korrektur S01 formuliert die reservierten Namen neu und erklärt das Ziel `xml` für verboten, was Produktion [17] bereits ausschließt, und E01 ergänzt einen Hinweis zur Unicode-Normalisierung; keine von beiden ändert eine Regel, die die Engine anwendet.

## API

Dieselbe Engine beantwortet die Operation `/api/v1/xml-formatter` der HTTP-API der Website, beschrieben im OpenAPI-Vertrag auf der [API-Seite](/api), die auch angibt, ob diese Website die API bereitstellt.

- **Anfrage.** Das XML-Dokument als Text, im Body eines POST oder im Query-Parameter `input` eines GET. Die API wendet die Standardoptionen an: lesbar, zwei Leerzeichen, Kommentare behalten.
- **Antwort.** `ok`; bei Wohlgeformtheit `output` und `stats` (`elements`, `attributes`, `comments`, `commentsDropped`, `cdataSections`, `processingInstructions`, `maxDepth`, `mixedContentElements`, `preserveElements`, `insignificantWhitespaceNodes`); andernfalls `error` mit `code`, einer englischen `message`, `line`, `column`, `offset`, `excerpt`, `excerptColumn` und `params`. Beide enthalten `notes` (`bom-removed`, `line-endings-normalised`, `doctype-kept`, `entities-unchecked`, `xml-space-invalid`) und die angewendeten `options`. Ein fehlerhaftes Dokument ist eine normale Antwort mit `ok` gleich false, kein HTTP-Fehler.

## Ergebnisse teilen

Unter der Bewertung (oder unter der fehlerhaften Zeile, die ebenfalls die Bewertung ist) erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` das Dokument so, wie eingefügt, und die drei Einstellungen (lesbar oder minimiert, die Einrückung, Kommentare behalten oder entfernt). Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert. XML kann Token, interne Hosts und Namen von Personen enthalten, daher bittet das Popover Sie, es zu lesen, bevor Sie den Link senden. Bevor ein Link angeboten wird, wird der Text nach Zugangsdaten durchsucht, die ein Standard definiert: ein privater Schlüssel im PEM-Format, eine Zeile `Authorization` oder `Proxy-Authorization` mit beliebigem Schema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), Abschnitte 11.6.2 und 11.7.2: Der Wert „consists of credentials“), eine Zeile `Cookie` oder `Set-Cookie` mit einem Wert ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), Abschnitte 4.1.1 und 4.2.1), ein JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), Abschnitt 1), ein Passwort in einer URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), Abschnitt 3.2.1, nennt die Form „user:password“ veraltet: „is deprecated“), eine AWS-Zugriffsschlüssel-ID oder ein `ENC`-Wert von FortiOS; alle abgerufen am 01.11.2026. Findet sich eines davon, gibt es keinen Link: Das Popover nennt die Zeile, und Sie setzen einen Platzhalter an seine Stelle und wählen die Schaltfläche erneut. Ein Wert, dessen Name nur nach einem Secret aussieht (ein Element `password`, ein Attribut `apiKey`), blockiert den Link nicht; das Popover nennt den ersten solchen Wert, damit Sie ihn prüfen können. Zwei weitere Stellen gelten als Zugangsdaten, wie beim XML-Decoder: das `Password` eines `UsernameToken` von WS-Security ([OASIS UsernameToken Profile 1.1.1](https://docs.oasis-open.org/wss-m/wss/v1.1.1/os/wss-UsernameTokenProfile-v1.1.1-os.html): Es „provides password information (or equivalent such as a hash)“) und eine signierte oder verschlüsselte SAML-Assertion. Das Beispiel der Seite, eine nicht signierte SAML-ähnliche Response, enthält keines von beiden und erhält einen Link.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` folgt, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Der Text füllt das Feld, die Einstellungen werden so gesetzt, wie Sie sie setzen würden, und die Seite prüft und formatiert ihn lokal: Keine Entität wird expandiert, und nichts wird abgerufen. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.

## Quellen

- [W3C, Extensible Markup Language (XML) 1.0 (Fifth Edition), W3C Recommendation 26 November 2008](https://www.w3.org/TR/xml/) (abgerufen am 26.10.2026): Abschnitte 2.1 bis 2.11, 3.1, 3.2.2, 4.1 und 4.2; [Errata](https://www.w3.org/XML/xml-V10-5e-errata) (abgerufen am 26.10.2026)
- [W3C, Canonical XML Version 1.1, W3C Recommendation 2 May 2008](https://www.w3.org/TR/xml-c14n/) (abgerufen am 26.10.2026; diese Adresse liefert inzwischen Version 1.1): Abschnitt 1.1 und Beispiel 3.2
- [W3C, Exclusive XML Canonicalization Version 1.0, W3C Recommendation 18 July 2002](https://www.w3.org/TR/xml-exc-c14n/) (abgerufen am 26.10.2026): Abschnitte 1.1 und 3
- [W3C, XML Signature Syntax and Processing Version 1.1, W3C Recommendation 11 April 2013](https://www.w3.org/TR/xmldsig-core1/) (abgerufen am 26.10.2026): Abschnitt 3.2.1
- [OASIS, Assertions and Protocols for the OASIS Security Assertion Markup Language (SAML) V2.0, OASIS Standard, 15 March 2005](https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf) (abgerufen am 26.10.2026): Abschnitt 5.4.3 sowie die Namespace-Namen, der Statuscode Success und das NameID-Format emailAddress, die im Beispiel verwendet werden
