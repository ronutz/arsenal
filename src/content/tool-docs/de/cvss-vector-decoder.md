## Was das Tool tut

Fügen Sie einen Vektor-String nach CVSS v3.1 oder v3.0 ein, und das Tool berechnet die Punktzahl, ordnet sie einer Schweregradstufe zu und erklärt, was jede Metrik bedeutet. Es berechnet die Basispunktzahl und, sofern die entsprechenden Metriken im Vektor stehen, auch die zeitliche und die Umgebungspunktzahl. Es ist reine Mathematik und läuft offline; es wird nichts gesendet.

## Was CVSS ist

CVSS, das Common Vulnerability Scoring System von FIRST.org, ist die Standardmethode, den Schweregrad einer Schwachstelle als eine einzige Zahl von 0,0 bis 10,0 auszudrücken. Diese Zahl wird nicht von Hand vergeben; sie wird aus einem Vektor-String berechnet, einer kompakten Liste von Metriken wie `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H`, in der jedes Feld eine Eigenschaft der Schwachstelle beschreibt. Das Tool übersetzt diesen String zurück in verständliche Sprache und wendet die offizielle Formel darauf an.

## Die Basismetriken

Die Basispunktzahl, der Teil, den jeder Vektor hat, setzt sich aus Metriken in zwei Gruppen zusammen. Die Metriken der Ausnutzbarkeit beschreiben, wie schwer sich die Schwachstelle ausnutzen lässt: **Angriffsvektor** (Attack Vector: Netzwerk, benachbart, lokal oder physisch), **Angriffskomplexität** (Attack Complexity), **Erforderliche Berechtigungen** (Privileges Required) und **Benutzerinteraktion** (User Interaction). Die Metriken der Auswirkung beschreiben, was bei einer Ausnutzung geschieht: die Auswirkung auf **Vertraulichkeit** (Confidentiality), **Integrität** (Integrity) und **Verfügbarkeit** (Availability). Der **Geltungsbereich** (Scope) steht dazwischen und erfasst, ob die Ausnutzung der Komponente Ressourcen jenseits davon beeinträchtigen kann. Das Tool zeigt für jede Metrik den gewählten Wert und seine Bedeutung, sodass ein Vektor kein undurchschaubarer Code mehr ist.

## Punktzahl, Schweregrad und die anderen Gruppen

Die berechnete Basispunktzahl wird einer qualitativen Stufe zugeordnet: Keine, Niedrig, Mittel, Hoch oder Kritisch. Zwei optionale Metrikgruppen verfeinern sie, wenn vorhanden: **Zeitliche** Metriken (Temporal) berücksichtigen den aktuellen Stand von Exploit-Code und Korrekturen, und **Umgebungsmetriken** (Environmental) gewichten die Punktzahl für Ihre konkrete Umgebung neu, einschließlich Ihrer eigenen Anforderungen an Vertraulichkeit, Integrität und Verfügbarkeit. Die Rechnung folgt genau der Spezifikation von FIRST.org, einschließlich ihrer eigenen Rundungsregel, sodass die Zahl, die das Tool anzeigt, mit dem offiziellen Rechner übereinstimmt.

## Verwendung

Fügen Sie einen Vektor nach v3.0 oder v3.1 ein und lesen Sie Punktzahl, Schweregradstufe und dekodierte Metriken ab. Die Berechnung ist deterministisch: Derselbe Vektor ergibt immer dieselbe Punktzahl, weil sie die veröffentlichte Formel ist und sonst nichts.

[PHP2Shell: die PHP-Schwachstellen vom Oktober 2026](/learn/php-october-2026-vulnerabilities) geht einen echten Fall durch: Dieselben Fehler erhielten in v3.1 eine 9,8 oder eine 8,1, je nachdem, welche Angriffskomplexität die jeweilige Bewertung ansetzte.

## Ergebnisse teilen

Unter den Punktzahlen erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen und sobald die Seite den Vektor dekodiert hat. Der Link enthält nach dem `#` den Vektor so, wie eingegeben. Ein CVSS-Vektor ist eine öffentliche Beschreibung des Schweregrads und verrät nichts über Sie. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` folgt, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Öffnen eines Links.** Der Vektor füllt das Feld wie beim Einfügen, und die Seite dekodiert ihn. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
