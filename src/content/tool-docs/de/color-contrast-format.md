## Was das Tool tut

Es nimmt zwei Farben in einer beliebigen Notation, die CSS Color Level 4 definiert, und beantwortet die Frage, die ein Stylesheet bei jedem Text und jedem Bedienelement aufwirft: Lässt sich dies vor jenem lesen? Es berechnet das WCAG-Kontrastverhältnis zwischen beiden, prüft es gegen jede Stufe der drei Kontrastkriterien, zeigt das Paar in einer Vorschau, rechnet jede Farbe samt ihrer relativen Leuchtdichte in jede Notation um und findet, wo eine Stufe nicht bestanden wird, die nächstgelegene Vordergrundfarbe, die sie bestehen würde.

## Was das Tool liest

- **Benannte Farben**: die 148 Namen aus CSS Color Level 4, Abschnitt 6.1 (gray und grey, beide Schreibweisen), sowie `transparent` (transparentes Schwarz).
- **Hex**: `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`; Groß- und Kleinschreibung der Buchstaben spielt keine Rolle, und eine Kurzform wird durch Verdoppeln jeder Ziffer erweitert.
- **rgb() / rgba()**: Zahlen von 0 bis 255 oder Prozentwerte, veraltete Kommas oder moderne Leerzeichen mit `/ alpha`; Komponenten außerhalb des Bereichs werden begrenzt, wie es die Spezifikation beim Parsen des Werts vorsieht.
- **hsl() / hsla()** und **hwb()**: ein Farbton als Zahl oder Winkel (deg, grad, rad, turn), dann Prozentwerte oder Zahlen von 0 bis 100.
- **lab()**, **lch()**, **oklab()**, **oklch()**: mit den Bezugsbereichen der Spezifikation für Prozentwerte (lab a und b: 100 % = 125; lch C: 100 % = 150; oklab a und b: 100 % = 0,4; oklch C: 100 % = 0,4; L: 100 % = 100 für Lab, 1 für OKLab).
- **color()**: `srgb`, `srgb-linear`, `display-p3`, `display-p3-linear`, `xyz`, `xyz-d65`, `xyz-d50`.
- `none` als Komponente zählt als null, wie es die Spezifikation festlegt.

Neben jedem Feld öffnet sich die Farbauswahl des Browsers mit der Farbe, die das Feld enthält, und schreibt die gewählte als `#rrggbb` hinein, sodass sich eine Farbe ohne Tippen auswählen lässt.

## Was das Tool berechnet

- **Relative Leuchtdichte** (WCAG 2.2): Jeder sRGB-Kanal wird linearisiert (c / 12.92 bis 0.04045, sonst ((c + 0.055) / 1.055) ^ 2.4) und gewichtet, L = 0.2126 R + 0.7152 G + 0.0722 B. WCAG 2.0 und 2.1 schrieben den Schwellenwert als 0.03928; bei 8-Bit-Kanalwerten ordnen beide Schwellenwerte jeden Wert identisch ein.
- **Kontrastverhältnis**: (L1 + 0.05) / (L2 + 0.05), heller durch dunkler, von 1:1 bis 21:1.
- **Stufen**: Erfolgskriterium 1.4.3 Kontrast (Minimum), Stufe AA, 4,5:1 für Text und 3:1 für großen Text; 1.4.6 Kontrast (erweitert), Stufe AAA, 7:1 und 4,5:1; 1.4.11 Nicht-Text-Kontrast, Stufe AA, 3:1 für Bestandteile der Benutzeroberfläche und grafische Objekte. Großer Text hat mindestens 18 Punkt oder 14 Punkt fett.
- **Alpha**: Eine durchscheinende Vordergrundfarbe wird vor der Messung über den Hintergrund gelegt (einfaches Alpha-Blending in sRGB, so wie ein Display sie darstellt), weil WCAG den Kontrast zwischen den Farben so definiert, wie sie angezeigt werden. Alpha beim Hintergrund wird ignoriert.
- **Farbumfang**: Eine Farbe außerhalb von sRGB (ein Gelb in display-p3, ein gesättigtes oklch()) wird für die sRGB-Notationen und für die Leuchtdichte auf den Farbumfang abgeschnitten und gekennzeichnet; die Formen Lab, LCH, OKLab, OKLCH und XYZ behalten den nicht abgeschnittenen Wert.
- **Korrekturen**: Für jede Stufe, die das Paar verfehlt, wird die Helligkeit der Vordergrundfarbe in OKLCH heller und dunkler verschoben, bei gleichem Farbton und gleicher Chroma (die Chroma wird nur verringert, wenn das Ergebnis den Farbumfang verlassen würde), bis das Ziel erreicht ist; das Ergebnis wird als Hex und oklch() mit dem erreichten Verhältnis angegeben.

## Umrechnungen

Die Umrechnungen sind der übertragene Beispielcode der Spezifikation selbst: die sRGB-Übertragungsfunktion, die rationalen Matrizen von sRGB nach XYZ und von display-p3 nach XYZ, die Bradford-Anpassung zwischen D65 und D50, CIE Lab mit seinen rationalen Konstanten, die beiden Matrizen von OKLab, die Polarformen mit ihren Schwellenwerten für einen wirkungslosen Farbton (Powerless Hue) sowie die Algorithmen für HSL und HWB. Die Engine reproduziert die durchgerechneten Beispiele der Spezifikation: `#7654CD` ist `lab(44.36% 36.05 -58.99)` und `color(xyz-d65 0.21661 0.14602 0.59452)`; die Beispielfarben für lab() und oklch() stimmen miteinander überein; `color(display-p3 1 1 0)` landet bei `oklch(0.9648 0.245 110.23)`.

## Ergebnisse teilen

Unter dem Verhältnis und seinen Stufen erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` die beiden Farben so, wie eingegeben, unter den Namen, die die Seite den Feldern gibt (`foreground` und `background`), und sonst nichts; welche Vorlage Sie geladen haben, wird nicht übertragen. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird das Paar beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Beide Felder werden so ersetzt, wie eine Eingabe sie füllen würde, und die Seite berechnet das Verhältnis; es wird nichts gesendet. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.

## Grenzen

- Das Verhältnis ist die Formel von WCAG, die die Kriterien vorschreiben; sie ist kein Wahrnehmungsmodell, und ein Paar, das besteht, kann für manche Lesende trotzdem schwer lesbar sein (dünne Schrift, kleine Größen, Unterschiede im Farbsehen). Die Vorschau ist dafür da, dass auch die Augen mitentscheiden.
- Farbmanagement wird nicht modelliert: Das eigene Profil des Displays wird nicht herangezogen, und Farben mit großem Farbumfang werden nach ihrer auf sRGB abgeschnittenen Form beurteilt.
- Korrekturen ändern nur die Helligkeit. Im Design wird man vielleicht lieber Farbton oder Chroma ändern; das Tool zeigt, was die Verschiebung der Helligkeit allein erreicht.
- Benannte Systemfarben (`Canvas`, `LinkText`) und `currentcolor` hängen von der Seite ab und werden nicht gelesen.

## Quellen

- [WCAG 2.2, W3C Recommendation 12 December 2024](https://www.w3.org/TR/WCAG22/) (abgerufen am 05.10.2026): relative Leuchtdichte, Kontrastverhältnis, Erfolgskriterien 1.4.3, 1.4.6, 1.4.11, großer Text
- [CSS Color Module Level 4, W3C Candidate Recommendation Draft 30 September 2026](https://www.w3.org/TR/css-color-4/) (abgerufen am 05.10.2026): Notationen, Bezugsbereiche für Prozentwerte, benannte Farben
- [CSS Color Level 4 sample code in the csswg-drafts repository](https://github.com/w3c/csswg-drafts/tree/main/css-color-4) (abgerufen am 05.10.2026): conversions.js, utilities.js, rgbToHsl.js, hslToRgb.js, hwbToRgb.js, rgbToHwb.js
- [RFC 3986: URI Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (abgerufen am 01.11.2026): Abschnitt 3.5, das Fragment, das ein Link von „Ergebnisse teilen“ verwendet
