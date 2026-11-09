## Was das Tool tut

Vierzehn Netzwerkbetriebssysteme (IOS, IOS XE, IOS XR, NX-OS, Junos, Junos Evolved, EOS, TMOS, F5OS, EXOS, VOSS, FortiOS, PAN-OS und Gaia), jedes mit seiner Herkunft, mit dem, worauf es läuft, wie seine Komponenten Zustand teilen, wo sich Steuerung und Weiterleitung trennen, wie Änderungen angewendet werden und was ein Upgrade kostet.

**Wählen Sie eines für ein vollständiges Profil. Wählen Sie zwei, um sie Achse für Achse zu sehen**, mit einem Hinweis zu jeder Achse, warum gerade sie etwas vorhersagt.

## Die Achse, die am meisten zählt

**Wie Zustand geteilt wird** sagt das Ausfallverhalten besser voraus als alles andere:

- **Gemeinsamer Speicher**: Ein Fehler breitet sich aus. Das klassische IOS führt alles in einem Adressraum ohne Speicherschutz aus.
- **Nachrichtenaustausch**: Ein Fehler bleibt eingegrenzt. IOS XR startet den Prozess neu.
- **Ein State Store**: Ein neu gestarteter Prozess **macht weiter**, statt neu aufzubauen. SysDB von Arista und der verteilte Datenspeicher von Junos Evolved arbeiten beide so, und der von Evolved übersteht es, wenn der Prozess auf einem anderen Knoten wieder anläuft.

Die zweite Achse ist **sofort gegenüber Candidate und Commit**. Sofort bedeutet: Ein Fehler ist live. Commit bedeutet: Ein Fehler ist eine verworfene Bearbeitung. Das ist der Unterschied zwischen einem Vorfall und einem Nachmittag.

## Jeder Eintrag nennt Schwächen

**Ein Referenzvektor (Golden Vector) stellt sicher, dass kein Eintrag weniger als zwei hat.** Ein Eintrag ohne aufgeführte Kosten ist Werbung, und wer ihn liest, hätte recht, dem Rest der Tabelle zu misstrauen. Das gilt auch für die Plattformen, die der Autor dieser Website unterrichtet und für die er autorisiert ist.

Dasselbe Audit prüft, dass jeder Eintrag eine Herkunft, mindestens zwei Stärken und eine prägende Idee hat, die gehaltvoll genug ist, um etwas auszusagen; beim ersten Lauf fand es ein zu dünnes Feld.

## Was das Tool nicht tut

Es ist keine Funktionsmatrix und kein Kaufratgeber. Aktuelle Versionen verfolgt es bewusst nicht: **Versionen ändern sich, die Architektur nicht**, und eine Tabelle, die jedes Quartal veraltet, wäre schlechter als keine Tabelle.

Es kann Ihnen auch nicht sagen, welches Sie kaufen sollen. Es kann Ihnen sagen, was jedes tut, wenn etwas kaputtgeht, und das ist die beständigere Frage.

## Ergebnisse teilen

Unter den Fakten des Profils oder unter dem Titel des Vergleichs erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` die gewählten Systeme über ihre IDs: immer `os` (damit der Link seine Bedeutung behält, wenn sich das Startsystem ändert) und `with`, wenn ein zweites System gewählt ist. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird die Auswahl beim Öffnen des Links nicht an den Server gesendet. Sie bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann sie lesen.

- **Öffnen eines Links.** Die beiden Auswahllisten werden gesetzt, und die Seite zeigt das Profil oder den Vergleich, wie bei einer eigenen Auswahl. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
