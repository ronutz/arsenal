## Was das Tool tut

Es liest einen Dateimodus in jeder der drei üblichen Schreibweisen und gibt alle anderen Schreibweisen samt Bedeutung zurück. Die drei Schreibweisen:

- **Oktal**, eine bis fünf Ziffern: `755`, `0644`, `4755`, `02775`, `00755`. Die vierte Ziffer von rechts enthält die besonderen Bits (4 set-user-ID, 2 set-group-ID, 1 eingeschränktes Löschen bzw. Sticky); die drei rechts davon gelten für Besitzer, Gruppe und Andere, jede die Summe aus Lesen 4, Schreiben 2 und Ausführen 1.
- **Ein ls-String**, neun Zeichen oder zehn mit dem Typbuchstaben: `rwxr-xr-x`, `-rwsr-xr-x`, `drwxrwxrwt`, `rwSr--r--`. Ein führendes `d` setzt die Art auf Verzeichnis.
- **chmod-Klauseln**, angewendet auf einen Basismodus unter einer umask: `u+x,go-w`, `a=rX`, `g+s,o-rwx`, `=755`. Die Basis ist 644 für eine Datei und 755 für ein Verzeichnis, sofern Sie keine angeben; die umask ist 022, sofern Sie keine angeben.

Für den gelesenen Modus zeigt die Seite die vier Oktalziffern und den zehnstelligen ls-String, die zwölf Bits als Raster, in dem Sie jedes Bit per Klick umschalten, die Bedeutung je Klasse in Klartext (was Besitzer, Gruppe und Andere dürfen, formuliert für eine Datei oder für ein Verzeichnis), die drei besonderen Bits mit ihrer Bedeutung für diese Art, die Kombinationen, die einen zweiten Blick wert sind, die chmod-Befehle, die den Modus erreichen (absolut oktal, absolut symbolisch und die minimale Änderung ausgehend von der Basis), die umask, die den Modus aus der Vorgabe eines Programms erzeugen würde, und bei Klauseln einen Ablauf des Modus nach jeder einzelnen.

## Die angewendeten Regeln

- **Die symbolische Grammatik ist die von POSIX.** Klassen `u`, `g`, `o` und `a`; Operatoren `+`, `-`, `=`; Rechte `r`, `w`, `x`, `X`, `s`, `t`; oder eine Klasse, von der kopiert wird: `u`, `g` oder `o`. Auf eine Klassenliste dürfen mehrere Aktionen folgen (`u+r-w`), und Klauseln werden durch Kommas getrennt.
- **`X`** setzt das Ausführungsrecht „if the file is a directory or if the current file mode bits have at least one of the execute bits set“ (POSIX chmod). Bei einer einfachen Datei ohne Ausführungsbit ändert `a+X` nichts, und der Ablauf sagt das.
- **`=`** löscht zuerst die Bits der genannten Klassen (alle zwölf, wenn keine Klasse genannt ist) und setzt dann die angegebenen Rechte. `o=` ohne etwas dahinter löscht die Bits von Andere.
- **Keine Klasse genannt** bedeutet alle drei, „but bits that are set in the umask are not affected“ für `+` und `-` (chmod(1)); der Rechner wendet die angegebene umask an, standardmäßig 022, und vermerkt, wenn sie etwas maskiert hat.
- **`s`** richtet sich nach der Klasse: Mit `u` ist es set-user-ID, mit `g` set-group-ID, mit nur `o` ändert es nichts (POSIX). **`t`** ist das Flag für eingeschränktes Löschen (Restricted Deletion), angewendet unabhängig von der genannten Klasse, wie es GNU chmod tut.
- **Die ls-Buchstaben sind die von POSIX.** `s`, wo set-user-ID oder set-group-ID gesetzt ist und die Klasse ausführen darf, `S`, wenn sie es nicht darf; `t`, wo das Flag für eingeschränktes Löschen gesetzt ist und Andere suchen dürfen, `T`, wenn sie es nicht dürfen.
- **GNU-Regel für Verzeichnisse.** Ist die Basis ein Verzeichnis, behält ein numerischer Modus mit bis zu vier Ziffern die Bits set-user-ID und set-group-ID der Basis, wie chmod(1) festhält: „For directories chmod preserves set-user-ID and set-group-ID bits unless you explicitly specify otherwise.“ Wer `00755`, `-6000` oder `=755` schreibt, löscht sie, und der Ablauf nennt die Regel, wenn sie gegriffen hat.
- **Numerische Modi mit einem Operator** (`=755`, `+111`, `-022`) werden so gelesen, wie GNU sie liest: exakt setzen, hinzufügen, entfernen.

## Die besonderen Bits lesen

| Bit | Wert | Bei einer Datei | Bei einem Verzeichnis |
|---|---|---|---|
| set-user-ID | 4000 | der Prozess läuft mit der effektiven User-ID des Besitzers | keine portable Bedeutung |
| set-group-ID | 2000 | der Prozess läuft mit der Gruppe der Datei | neue Einträge übernehmen die Gruppe des Verzeichnisses (bei den meisten Systemen) |
| eingeschränktes Löschen bzw. Sticky | 1000 | heute keine portable Bedeutung; manche älteren Systeme hielten den Programmtext im Swap | nur der Besitzer eines Eintrags, der Besitzer des Verzeichnisses oder ein privilegierter Benutzer darf ihn entfernen oder umbenennen |

Auf die Großbuchstaben kommt es an: `S` bedeutet, dass das besondere Bit gesetzt ist, das zugehörige Ausführungsbit aber nicht, sodass das Bit nichts bewirkt, bis das Ausführungsrecht gewährt wird; `T` bedeutet, dass das Flag für eingeschränktes Löschen auf einem Verzeichnis gesetzt ist, das Andere nicht durchsuchen dürfen.

## Die umask-Zeile

Ein Programm, das eine Datei anlegt, fordert 666 an, ein Programm, das ein Verzeichnis anlegt, 777; der Kernel löscht die Bits, die in der umask des Prozesses gesetzt sind. Daher kann der Rechner sagen, welche umask den eingegebenen Modus erzeugt, und wann keine es kann: Ein Dateimodus mit einem Ausführungsbit entsteht nie allein durch das Anlegen, und die besonderen Bits stammen nie aus einer umask.

## Grenzen

- Der Rechner kennt die zwölf Modusbits, nicht das Dateisystem. Er sieht weder Besitzverhältnisse noch Access Control Lists, Capabilities, Mount-Optionen, unveränderliche Attribute oder Mandatory Access Control, die alle außer Kraft setzen können, was die Bits sagen.
- Das GNU-spezifische Verhalten ist so modelliert, wie chmod(1) aus coreutils 9.11 es beschreibt. Andere Implementierungen behandeln einen numerischen Modus auf einem Verzeichnis oder `=755` möglicherweise anders.
- Ob das Löschen aller Ausführungsbits auch set-user-ID und set-group-ID löscht, ist implementierungsabhängig (POSIX chmod); der Rechner löscht sie nicht von sich aus.
- Jedes Feld wird nach 64 Zeichen abgeschnitten.

## Ergebnisse teilen

Unter den beiden Schreibweisen in der Überschrift erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` den Modus so, wie eingegeben (oktal, ein `ls`-String oder chmod-Klauseln), ob es sich um eine Datei oder ein Verzeichnis handelt, und den Basismodus und die umask, sofern Sie sie ausgefüllt haben; leer gelassen, bedeutet jedes Feld auf beiden Seiten seinen Standardwert. Ein Modus verrät nichts über Sie. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 01.11.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird, was nach dem `#` folgt, beim Öffnen des Links nicht an den Server gesendet. Es bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann es lesen.

- **Öffnen eines Links.** Die vier Felder füllen sich so, wie Sie sie eingeben würden, und die Seite liest den Modus. Ein leerer Modus, eine unbekannte Art oder ein Feld, das länger ist als das der Seite (64 Zeichen), führt dazu, dass der Link ignoriert wird. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.

## Quellen

- [POSIX.1-2024 (IEEE Std 1003.1-2024): chmod](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/chmod.html) (abgerufen am 03.10.2026)
- [POSIX.1-2024 (IEEE Std 1003.1-2024): ls](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/ls.html) (abgerufen am 03.10.2026)
- [GNU coreutils manual: Mode Structure](https://www.gnu.org/software/coreutils/manual/html_node/Mode-Structure.html) (abgerufen am 03.10.2026)
- [chmod(1), GNU coreutils 9.11, man7.org](https://man7.org/linux/man-pages/man1/chmod.1.html) (abgerufen am 03.10.2026)
