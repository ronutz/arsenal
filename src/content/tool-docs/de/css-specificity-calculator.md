## Was das Tool tut

Es liest einen oder mehrere CSS-Selektoren (einen pro Zeile, durch Kommas getrennt oder als eingefügtes ganzes Stylesheet, dessen Deklarationsblöcke und At-Rule-Präludien verworfen werden) und berechnet die Spezifität jedes Selektors als Tripel (A, B, C) nach Selectors Level 4, wobei jeder einfache Selektor benannt wird, zusammen mit der Spalte, zu der er beiträgt. Die Selektoren werden so gereiht, wie die Kaskade sie reiht, Gleichstände werden hervorgehoben (dort entscheidet die Reihenfolge des Auftretens), und jede Sonderregel, auf die sich ein Selektor stützt, wird daneben erklärt.

## Die Zählung

Aus Selectors Level 4, „Calculating a selector's specificity“:

- **A** zählt ID-Selektoren (`#main`).
- **B** zählt Klassenselektoren (`.nav`), Attributselektoren (`[type="text"]`) und Pseudoklassen (`:hover`).
- **C** zählt Typselektoren (`li`) und Pseudo-Elemente (`::before`).
- Der Universalselektor (`*`) wird ignoriert; Kombinatoren tragen nichts bei.
- Spezifitäten werden Spalte für Spalte verglichen: Ein größeres A gewinnt; bei Gleichstand in A ein größeres B; bei Gleichstand in B ein größeres C; bei Gleichstand in allen sind die Spezifitäten gleich.
- „Repeated occurrences of the same simple selector are allowed and do increase specificity“: `.a.a` ist (0,2,0).

Die Sonderfälle, die die Spezifikation ausdrücklich nennt und der Rechner anwendet:

- `:is()`, `:not()` und `:has()`: Die Spezifität „is replaced by the specificity of the most specific complex selector in its selector list argument“. `:not(em, strong#foo)` ist (1,0,1).
- `:nth-child()` und `:nth-last-child()` mit einer `of`-Klausel: eine Pseudoklasse „plus the specificity of the most specific complex selector in its selector list argument“. `:nth-child(even of li, .item)` ist (0,2,0).
- `:where()`: „replaced by zero“. `.qux:where(em, #foo#bar#baz)` ist (0,1,0).
- Die veralteten Pseudo-Elemente von CSS2 mit einfachem Doppelpunkt (`:before`, `:after`, `:first-line`, `:first-letter`) sind Pseudo-Elemente und zählen in C.
- Aus CSS Shadow Module Level 1: `:host` ist eine Pseudoklasse; `:host()` und `:host-context()` sind eine Pseudoklasse plus ihr Argument; `::slotted()` ist ein Pseudo-Element plus sein Argument. `::part()` wird als ein Pseudo-Element gezählt (das Modul verweist für die genaue Regel auf CSS Pseudo-Elements Level 4; die Annahme wird auf der Seite genannt).

Der Rechner reproduziert die Beispieltabelle der Spezifikation: `*` (0,0,0), `LI` (0,0,1), `UL LI` (0,0,2), `UL OL+LI` (0,0,3), `H1 + *[REL=up]` (0,1,1), `UL OL LI.red` (0,1,3), `LI.red.level` (0,2,1), `#x34y` (1,0,0), `#s12:not(FOO)` (1,0,1), `.foo :is(.bar, #baz)` (1,1,0).

## Vor der Spezifität

Die Spezifität entscheidet nur, wenn alles, was in der Kaskade vor ihr kommt, gleich ist. CSS Cascading and Inheritance Level 5 sortiert Deklarationen in absteigender Priorität nach: Herkunft und Wichtigkeit (eine Autorendeklaration mit `!important` schlägt jede normale, gleich welcher Selektor), Kontext (Shadow Trees), an Elemente gebundene Stile (ein `style`-Attribut schlägt jede Regel derselben Wichtigkeit), Kaskadenebenen (bei normalen Deklarationen gewinnt die letzte Ebene, bei wichtigen die erste), dann Spezifität, dann Reihenfolge des Auftretens (die letzte Deklaration in Dokumentreihenfolge gewinnt, wobei style-Attribute nach jedem Stylesheet eingeordnet werden). Die Seite listet diese Schritte auf, damit sich ein überraschender Gewinner auf den richtigen Schritt zurückführen lässt.

## Ergebnisse teilen

Unter der Zusammenfassung erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` die Selektoren so, wie eingegeben, und sonst nichts; die Reihung wird allein aus ihnen berechnet, daher zeigt die Seite, die den Link öffnet, dieselbe Tabelle. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird der Text beim Öffnen des Links nicht an den Server gesendet. Er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann ihn lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Die Selektoren ersetzen das Feld wie beim Einfügen, und die Seite rechnet; es wird nichts gesendet. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.

## Grenzen

- Der Rechner liest Syntax, kein Dokument. Er kann nicht wissen, ob ein Selektor auf etwas zutrifft, und bei einer Selektorliste ist die in einem echten Treffer wirksame Spezifität die des spezifischsten zutreffenden Mitglieds; die Seite reiht die Mitglieder einzeln.
- Namespace-Präfixe (`ns|p`) werden gelesen, aber nicht aufgelöst.
- Unbekannte Pseudoklassen und Pseudo-Elemente werden nach ihrer Form gezählt (ein Doppelpunkt B, zwei Doppelpunkte C), wie es die Grammatik vorsieht; ob ein Browser sie unterstützt, ist eine andere Frage.
- Implementierungen können sehr große Zählwerte begrenzen; der Rechner tut das nicht.

## Quellen

- [Selectors Level 4, W3C Working Draft 22 January 2026: Calculating a selector's specificity](https://www.w3.org/TR/selectors-4/#specificity-rules) (abgerufen am 05.10.2026)
- [CSS Cascading and Inheritance Level 5, W3C Candidate Recommendation Snapshot 13 January 2022: Cascade Sorting Order](https://www.w3.org/TR/css-cascade-5/#cascade-sort) (abgerufen am 05.10.2026)
- [CSS Shadow Module Level 1, Editor's Draft 28 April 2026](https://drafts.csswg.org/css-shadow-1/) (abgerufen am 05.10.2026)
- [RFC 3986: URI Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (abgerufen am 01.11.2026): Abschnitt 3.5, das Fragment, das ein Link von „Ergebnisse teilen“ verwendet
