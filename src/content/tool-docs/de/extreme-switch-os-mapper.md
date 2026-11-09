## Was das Tool tut

Geben Sie eine Modellserie oder einen OS-Namen an, und das Tool sagt, welche Benennung gilt, mit welchen Versionen die Umbenennung kam und was speziell für diese Serie gilt. Die beiden Namenspaare werden **schon vor jeder Eingabe** angezeigt, denn wer kommt, weil ein Dokument das eine Wort sagte und der Switch das andere, braucht die Antwort sofort.

## Die Umbenennung, je in einer Zeile

- **ExtremeXOS (EXOS) → Switch Engine**, ab 31.6
- **VOSS → Fabric Engine**, ab 8.6

Beide gelten **nur für Universal-Hardware**: 4120, 4220, 5320, 5420, 5520, 5720, 7520, 7720. Alles andere behält die ursprünglichen Namen, und **auch Image-Dateinamen und Bootmenüs verwenden sie weiterhin**; ein Bootmenü, das auf einem Switch mit Fabric Engine anbietet, das OS „to VOSS“ zu ändern, ist also weder ein Fehler noch ein veralteter Build.

## Die Warnung, die das Tool immer ausgibt

**Ein Wechsel der Persona löscht die Konfiguration.** Sinngemäß nach Extreme: Ein Wechsel des Netzwerkbetriebssystems löscht alle Konfigurationsdateien, Debug-Informationen, Logs, Ereignisse und Statistiken, die zum vorherigen gehören. **Das ist ein Neuaufbau, keine Migration**, und das Tool sagt das bei jeder Abfrage, nicht nur, wenn es ein Modell erkennt.

Es weist auch darauf hin, dass die Switch Engine bei der Frage beim Booten mit einem Nein gewählt wird: Auf „Would you like to change the switch OS to VOSS? [y/N/q]“ ([Release Notes von Switch Engine 33.1.100](https://documentation.extremenetworks.com/release_notes/SwitchEngine/33.1.100/GUID-EEE4A4A1-99DC-4691-B6B5-F88A6FA8042F.shtml), abgerufen am 09.11.2026) **behält N die Switch Engine, y wechselt zu Fabric Engine**.

## Besonderheiten der Serien, die das Tool anzeigt

- **7520**: Stacking funktioniert unter Switch Engine und **nicht** unter Fabric Engine. Braucht das Design Stacking, ist die Wahl der Persona bereits getroffen.
- **5420 und 5520**: Ein Upgrade auf Switch Engine 31.6 **ändert die SNMP-SysObjectID**, sodass ein Monitoring, das das Gerät anhand dieses Werts identifiziert, es nicht mehr erkennt, während in der Konsole alles normal aussieht.
- **Die Mindestversionen von Fabric Engine unterscheiden sich**: 8.6 auf 5320, 5420 und 5520; 8.7 auf 5720.

## Was das Tool nicht tut

Es arbeitet bewusst auf Ebene der Serie statt der einzelnen Teilenummer: Die Frage der Benennung wird pro Serie beantwortet, und eine Tabelle von SKUs würde schneller veralten, als sie hilft. Ihren Bestand und Ihre installierten Versionen kennt es nicht.

## Ergebnisse teilen

Unter der Antwort erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` die Modellserie oder den OS-Namen so, wie eingegeben (`input`), und sonst nichts. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Die beiden Namenspaare und die Liste der Serien gehören zur Seite selbst, daher stehen sie nicht im Link.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird der Name beim Öffnen des Links nicht an den Server gesendet. Er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann ihn lesen.

- **Öffnen eines Links.** Der Name füllt das Feld wie bei der Eingabe, und die Seite ordnet ihn zu; es wird nichts gesendet. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
