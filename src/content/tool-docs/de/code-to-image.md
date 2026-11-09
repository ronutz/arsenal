## Was das Tool tut

Fügen Sie Code, Konfiguration oder Terminalausgabe ein und erhalten Sie ein Bild davon für eine Folie, ein Ticket oder ein Dokument: ein SVG, das den Code als echten, markierbaren Text behält, und ein PNG in 1x oder 2x, dazu einen Alternativtext, den Sie daneben einfügen können. Sie wählen die Sprache für die Hervorhebung, eine dunkle oder helle Palette, die Schriftgröße, die Tabstopps, Zeilennummern, einen Fensterrahmen mit optionalem Titel, den Innenabstand und die hervorzuhebenden Zeilen.

Bevor ein Bild entsteht, sucht eine Secret-Prüfung nach Werten, die Sie vielleicht nicht veröffentlichen wollen, etwa private Schlüssel, Authorization-Header, AWS-Zugriffsschlüssel-IDs, JWTs, Passwörter in URLs, `ENC`-Werte von FortiOS und Attribute für Passwörter oder Secrets. Jeder Befund wird aufgelistet und im Bild maskiert, sofern Sie sein Kontrollkästchen nicht deaktivieren. Alles läuft in Ihrem Browser.

Wo die Stelle, an der Sie schreiben, Text darstellen kann, ist Text vorzuziehen. [WCAG 2.2](https://www.w3.org/TR/WCAG22/), Erfolgskriterium 1.4.5, Bilder eines Textes (Images of Text), verlangt Text statt Bildern von Text, wann immer die Technik ihn darstellen kann; ein Codeblock in einem Wiki, einer Wissensdatenbank oder einem Ticketsystem, das ihn rendert, ist Text, und wer ihn liest, kann ihn kopieren. Dieses Tool ist für die Stellen gedacht, die das nicht können, und der Alternativtext, den es schreibt, ist der Code selbst. [Code auf Folien und in Tickets](/learn/code-on-slides-and-in-tickets) erläutert diese Wahl, den Alternativtext, den Kontrast und die Secrets, die ein Screenshot festhält.

## Sprachen

Nur Hervorhebung: Nichts wird geparst, validiert oder ausgeführt, und Code, der in der gewählten Sprache ungültig ist, wird trotzdem gezeichnet, so weit gefärbt, wie die Regeln unten reichen. Die Regeln jeder Sprache stammen aus ihrer eigenen Referenz, abgerufen am 27.10.2026.

| Sprache | Was gefärbt wird | Referenz |
|---|---|---|
| Reiner Text | Nichts | |
| Shell (POSIX sh) | `#`-Kommentare nur dort, wo ein Wort beginnen könnte (daher ist `a#b` keiner); einfache und doppelte Anführungszeichen sowie Dollar-Single-Quotes; `$name`, `${...}`, `$1`, `$@` und die anderen Sonderparameter, auch innerhalb doppelter Anführungszeichen wirksam; die reservierten Wörter `if then else elif fi do done case esac while until for in` dort, wo sie reserviert sind; der Name einer Zuweisung wie `LOG=...`; Wörter aus ganzen Zahlen | [POSIX.1-2024 Shell Command Language](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/V3_chap02.html), Abschnitte 2.2 bis 2.6 |
| Python | `#`-Kommentare; Strings mit jedem Präfix (`b`, `r`, `u`, `f`, `t` und die Kombinationen mit `r`, in beliebiger Schreibung), Strings in dreifachen Anführungszeichen über mehrere Zeilen; die 35 Schlüsselwörter; die weichen Schlüsselwörter (Soft Keywords) `match`, `case`, `type` und `lazy`, wenn sie eine Anweisung eröffnen; Ganzzahl-, Gleitkomma- und imaginäre Literale mit Unterstrichen und `0x`, `0o`, `0b` | [Python 3.15 Lexical analysis](https://docs.python.org/3/reference/lexical_analysis.html), das aktuelle Bugfix-Release (End of Life 2031-10, [Status of Python versions](https://devguide.python.org/versions/)) |
| JSON | Namen von Einträgen (ein String gefolgt von `:`) als Schlüssel; Strings; Zahlen; `true`, `false`, `null`. JSON hat keine Kommentare, daher wird `//` nicht gefärbt | [RFC 8259](https://www.rfc-editor.org/rfc/rfc8259) |
| YAML | `#`-Kommentare nach Whitespace; `%`-Direktiven; `---` und `...`; Mapping-Schlüssel; doppelt und einfach quotierte Skalare, auch über mehrere Zeilen; Anker, Aliase und Tags; Null, boolesche Werte, Ganzzahlen und Gleitkommazahlen des Core-Schemas; der Inhalt von Block-Skalaren mit `\|` und `>` | [YAML 1.2.2](https://yaml.org/spec/1.2.2/), Abschnitte 5.3, 6.6, 6.8, 6.9, 7.3, 8.1, 9.1.2 und 10.3.2 |
| Tcl, iRules, Expect | `#`-Kommentare nur dort, wo ein Befehl beginnt (daher ist `;#` nach einem Befehl einer); Wörter in doppelten Anführungszeichen mit wirksamem `$` und `[...]`; `$name`, `${name}`, `$name(index)`; das erste Wort eines Befehls, wenn es ein eingebauter Tcl-Befehl, `when` oder ein Expect-Befehl ist; `then`, `elseif`, `else`; Zahlen so, wie `expr` sie liest; der Ereignisname nach `when`. Wörter in geschweiften Klammern werden als Skripte gefärbt, weil die Rümpfe von `proc`, `if`, `when` und `expect` Skripte sind | [Tcl 9.0 Tcl(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/Tcl.html), [expr(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/expr.html), [if(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/if.html); iRules [basieren auf Tcl](https://clouddocs.f5.com/api/irules/WhatIsAnIRule.html) und beginnen mit [`when`](https://clouddocs.f5.com/api/irules/when.html); die Befehle von Expect aus [expect(1)](https://www.tcl-lang.org/man/expect5.31/expect.1.html) |
| F5 tmsh | Prompts; `#`-Kommentare am Anfang eines Worts; Strings in Anführungszeichen; die Befehle und die Root-Module (`auth cli gtm ltm net sys wom`) außerhalb geschweifter Klammern; Attributnamen am Zeilenanfang innerhalb eines Objekts; Adressen und Zahlen | [TMSH Reference v17](https://clouddocs.f5.com/cli/tmsh-reference/latest/general/tmsh.html) und ihre [Befehle](https://clouddocs.f5.com/cli/tmsh-reference/latest/commands/index.html) |
| FortiOS CLI | Prompts; eine Zeile, die mit `#` beginnt und kein Prompt ist (etwa die erste Zeile eines Backups); Strings in einfachen und doppelten Anführungszeichen mit `\'`, `\"` und `\\`; `config`, `edit`, `set`, `unset`, `next`, `end` und die anderen Befehle; der Feldname nach `set`; `ENC`; `$USERFROM`, `$USERNAME`, `$SerialNum`; Adressen und Zahlen | [FortiOS 7.6.8 CLI basics](https://docs.fortinet.com/document/fortigate/7.6.8/administration-guide/896276/cli-basics), [Command syntax](https://docs.fortinet.com/document/fortigate/7.6.8/administration-guide/508024/command-syntax), [Subcommands](https://docs.fortinet.com/document/fortigate/7.6.8/administration-guide/627485/subcommands) |
| CLI im Cisco-Stil | Prompts (`Router>`, `Router#`, `Router(config)#`, `Router(config-if)#`, mit oder ohne Leerzeichen danach); `!`-Kommentare; `no` und `default` sowie einige dokumentierte Befehle am Zeilenanfang; Adressen, Masken und Zahlen. Die CLI von Cisco hat keine allgemeine Regel für Anführungszeichen, daher wird nichts als String gefärbt | [IOS XE 17.x Managing Configuration Files](https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/syst-mgmt/b-system-management/m_cm-config-files-0.html) („Precede a comment with an exclamation point“), [Using the Cisco IOS Command-Line Interface](https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/syst-mgmt/b-system-management/m_cf-cli-basics.html), [Catalyst 8400: Using Cisco IOS XE Software](https://www.cisco.com/c/en/us/td/docs/routers/c8400/c8400-software-config-guide/Using-Cisco-IOS-XE-software.html) |

Was die Hervorhebung nicht leistet: Here-Documents der Shell, verschachtelte Befehlssubstitutionen innerhalb doppelter Anführungszeichen, Ersetzungsfelder in f-Strings von Python (der ganze f-String wird als String gefärbt), Flow-Skalare in YAML über mehrere Zeilen und alles, was einen Parser statt eines Scanners braucht.

### Terminalsitzungen

Bei Shell, Python und Tcl wird ein Text, in dem eine beliebige Zeile mit dem Prompt der Sprache beginnt, als Sitzung gelesen. Die Prompts sind `$ ` (der Standard von POSIX `PS1`) und der Bash-Prompt von BIG-IP `[root@bigip-1:Active:Standalone] config # ` für die Shell, `>>> ` und `... ` (`sys.ps1` und `sys.ps2` von Python) für Python sowie `% ` (tclsh) für Tcl. Zeilen mit Prompt werden als Befehle hervorgehoben und mit der nächsten Prompt-Zeile verbunden, damit ein String weiterlaufen kann; die Zeilen ohne Prompt sind Befehlsausgabe und bleiben ungefärbt, sodass ein Apostroph in der Ausgabe keinen String eröffnet. Die Seite sagt, wenn sie den Text so gelesen hat.

Bei tmsh, FortiOS und der CLI im Cisco-Stil werden die Prompts gefärbt und jede Zeile hervorgehoben, weil deren Ausgabe meist Konfiguration ist.

## Die Secret-Prüfung

Sie läuft auf dem Text, gleich welche Sprache Sie gewählt haben, bevor etwas gezeichnet wird. Jede Regel stammt aus der Dokumentation des Formats, nach dem sie sucht:

| Regel | Wonach sie sucht | Was maskiert wird | Quelle |
|---|---|---|---|
| Privater PEM-Schlüssel | einen Block `-----BEGIN ... PRIVATE KEY-----`: `PRIVATE KEY`, `ENCRYPTED PRIVATE KEY`, das traditionelle `RSA PRIVATE KEY` von OpenSSL (mit den Headern `Proc-Type` und `DEK-Info`) und `OPENSSH PRIVATE KEY`; auch einen Block, der in einer Zeile mit `\n`-Escapes geschrieben ist | jede Zeile zwischen den Begrenzungen (die Begrenzungszeilen bleiben); ohne END-Zeile die Zeilen, die wie Base64 aussehen | [RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), Abschnitte 2, 3, 10, 11; [OpenSSL 3.5 PEM_read_bio_PrivateKey](https://docs.openssl.org/3.5/man3/PEM_read_bio_PrivateKey/); [OpenSSH sshkey.c](https://github.com/openssh/openssh-portable/blob/master/sshkey.c) |
| Authorization-Header | `Authorization:` oder `Proxy-Authorization:` mit `Bearer` oder `Basic`, in beliebiger Schreibung | die Zugangsdaten | [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) 5.1, 11.1, 11.4, 11.6.2; [RFC 6750](https://www.rfc-editor.org/rfc/rfc6750) 2.1; [RFC 7617](https://www.rfc-editor.org/rfc/rfc7617) 2 |
| AWS Access Key ID | `AKIA` (Zugriffsschlüssel) oder `ASIA` (temporärer STS-Schlüssel) und 16 Großbuchstaben oder Ziffern, nicht innerhalb eines längeren Worts | die ID | [IAM identifiers](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_identifiers.html); [Zugriffsschlüssel](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html) |
| JWT | drei (JWS) oder fünf (JWE) Base64url-Segmente, durch Punkte verbunden, deren erstes Segment zu einem JSON-Objekt mit `alg` dekodiert | das Token | [RFC 7515](https://www.rfc-editor.org/rfc/rfc7515) 2, 4.1.1, 7.1; [RFC 7516](https://www.rfc-editor.org/rfc/rfc7516) 4.1.1, 7.1; [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519) 1 |
| Passwort in einer URL | `scheme://user:password@` | das Passwort | [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) 3.2.1 |
| Verschlüsselter FortiOS-Wert | `set <field> ENC <value>` | der Wert | [Technical Tip von Fortinet](https://community.fortinet.com/fortigate-3/technical-tip-command-fail-while-copying-the-preshare-key-from-another-configuration-214348) (`set psksecret ENC ...`) |
| set-Befehl | `set <name> <value>` mit einem Namen, der nach Secret aussieht: FortiOS-Felder und Tcl-Variablen (Expect-Skripte, iRules) | der Wert, innerhalb seiner Anführungszeichen oder geschweiften Klammern | [FortiOS Subcommands](https://docs.fortinet.com/document/fortigate/7.6.8/administration-guide/627485/subcommands); [Tcl set(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/set.html) |
| Attribut password, passphrase oder secret | tmsh `password`, `passphrase`, `encrypted-password`, `proxy-ca-passphrase`; Cisco `password` und `secret` mit optionaler Typziffer | der Wert | tmsh [auth user](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/auth/auth_user.html), [sys file ssl-key](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/sys/sys_file_ssl-key.html), [ltm profile client-ssl](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_profile_client-ssl.html), [ltm monitor http](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_monitor_http.html); [Passwörter in Cisco IOS XE 17.18](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-18/configuration_guide/sec/b_1718_sec_9300_cg/controlling_switch_access_with_passwords_and_privilege_levels.html) |
| JSON-Eintrag | `"name": "value"` mit einem Namen, der nach Secret aussieht | der Wert | [RFC 8259](https://www.rfc-editor.org/rfc/rfc8259) 4, 7; [RFC 6749](https://www.rfc-editor.org/rfc/rfc6749) 5.1 (`access_token`, `refresh_token`) |
| YAML-Schlüssel | `name: value`, Block oder Flow, mit einem Namen, der nach Secret aussieht | der Wert | [YAML 1.2.2](https://yaml.org/spec/1.2.2/) 7.3, 7.4, 8.2.2 |
| Shell-Zuweisung | `NAME=value` mit einem Namen, der nach Secret aussieht, auch im Query-String einer URL | der Wert | [POSIX](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/V3_chap02.html) 2.10.2; die [Datei mit den Zugangsdaten der AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html) verwendet dieselbe Form |
| Zuweisung | `name = "string"` (Python sowie Dateien im Stil von TOML oder INI) mit einem Namen, der nach Secret aussieht | der Inhalt des Strings | [Zuweisungen in Python 3.15](https://docs.python.org/3/reference/simple_stmts.html) |

**Ein Name, der nach Secret aussieht,** folgt einer eigenen Regel dieses Tools, keinem Standard: Das letzte Wort des Namens (getrennt an Unterstrichen, Bindestrichen, Punkten und camelCase) ist password, passwd, pass, passphrase, secret, token, psk, psksecret, apikey, accesskey, secretkey, privatekey, credential oder credentials, oder der Name endet auf key nach api, access, private, secret, signing, client, auth, encryption, master oder session. Daher sehen `DB_PASSWORD`, `client_secret`, `refresh_token`, `apiKey` und `aws_secret_access_key` nach Secret aus, `password_file`, `token_type`, `sort_key` und `PWD` (das Arbeitsverzeichnis der Shell) dagegen nicht.

**Nicht gemeldet:** ein leerer Wert; ein Platzhalter oder eine Einstellung (`none`, `null`, `true`, `false`, `enable`, `disable` und Ähnliches); ein Verweis, der für den Wert steht, etwa `$VAR`, `${VAR}`, `$(cmd)`, `$env(PW)`, ein Tcl-`[command]`, `{{ template }}` oder `<placeholder>`; ein Wert, der bereits mit `*`, `x` oder Punkten maskiert ist; ein Wert ohne Buchstaben oder Ziffer. Ein Hash im crypt-Stil wie `$6$salt$hash` oder `$9$...` von Cisco ist kein Verweis und wird gemeldet. Ein Attribut password, passphrase oder secret in einem Kommentar wird nicht gemeldet, weil Kommentare diese Wörter in Fließtext verwenden; jede andere Regel sucht auch in Kommentaren. Finden zwei Regeln dieselben Zeichen, bleibt die spezifischere (ein JWT in einem Bearer-Header ist ein Befund).

**Maskierung.** Ein maskierter Wert wird unabhängig von seiner Länge durch acht Punkte ersetzt, sodass das Bild nicht zeigt, wie lang er war. Die Zeichen selbst werden ersetzt, nicht abgedeckt: Sie stehen weder im Text des SVG noch im PNG noch im Alternativtext, wo der Wert als „[maskiert]“ erscheint. Deaktivieren Sie das Kontrollkästchen eines Befunds, um ihn so zu zeigen, wie er geschrieben ist; die Wahl wird nach Regel, Zeile und Spalte gespeichert, während Sie an anderer Stelle bearbeiten.

**Sie ist kein vollständiger Scanner.** Sie kennt die Formate oben und sonst nichts, sie kann ein echtes Secret nicht von einem Beispiel unterscheiden, und ein Secret, nach dem sie nicht sucht, bleibt im Bild. Lesen Sie das Bild, bevor Sie es veröffentlichen.

Die Sitzungs-Secrets in der Ausgabe von `openssl s_client` sind ein Beispiel: Keine Regel sucht nach ihnen, daher wird eine `Resumption PSK:`-Zeile von TLS 1.3 so gezeichnet, wie sie ausgegeben wird, und eine `Master-Key:`-Zeile von TLS 1.2 wird nur maskiert, weil sie die Form eines YAML-Schlüssels mit einem Namen hat, der nach Secret aussieht. [openssl s_client erklärt](/tools/openssl-s-client-explainer) führt beide unter seinen Befunden auf.

## Wie das Bild entsteht

Die Engine legt das Layout des Bilds einmal fest (jedes Rechteck, jeden Punkt und jeden Textabschnitt mit Position und Farbe), und beide Dateien entstehen aus diesem Layout, sodass sie nicht voneinander abweichen können.

- **Schrift und Raster.** JetBrains Mono, die Monospace-Schrift der Website, unter der [SIL Open Font License 1.1](https://openfontlicense.org/open-font-license-official-text/). Ihre Metriken, aus der Schriftdatei gelesen: 1000 Einheiten pro Em, jedes Zeichen 600 Einheiten breit, Oberlänge 1020, Unterlänge 300. Eine Spalte ist das 0,6-Fache der Schriftgröße, eine Zeile das 1,5-Fache der Schriftgröße, auf ganze Pixel gerundet, und der Text sitzt in der Mitte seiner Zeile. Eine Spalte pro Codepunkt: Tabs werden auf die gewählten Stopps erweitert, und Zeichen, die in manchen Schriften breiter sind (viele ostasiatische Zeichen und Emojis), belegen trotzdem eine Spalte und können daher ihren Nachbarn überlappen.
- **Das SVG** behält jede Zeile als ein `<text>`-Element mit echtem Text, gefärbt mit `<tspan>`-Elementen, und gibt jedem Zeichen eine eigene x-Position: [SVG 2](https://www.w3.org/TR/SVG2/text.html) wendet den n-ten x-Wert auf das n-te Zeichen an, gezählt in Codepunkten, sodass die Spalten auch in einer Ersatzschrift halten. Es nennt die Schrift (`'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, 'DejaVu Sans Mono', 'Liberation Mono', monospace`) und bettet sie nicht ein; wo JetBrains Mono nicht installiert ist, zeichnet die Monospace-Schrift des Betrachters dieselben Spalten. Whitespace bleibt erhalten (`xml:space="preserve"` und `white-space: pre`), Programmierligaturen sind ausgeschaltet, das Dokument hat ein `<title>` mit der Beschreibung und `role="img"`, und Zeilennummern sind eigene Elemente, sodass eine Markierung des Codes sie nicht mitnimmt. Zeichen, die ein XML-Dokument nicht enthalten kann ([XML 1.0](https://www.w3.org/TR/xml/), Produktion [2]: Steuerzeichen außer Tab und Zeilenvorschub, einzelne Surrogate, U+FFFE und U+FFFF), werden zuvor durch U+FFFD ersetzt.
- **Das PNG** wird in Ihrem Browser auf einem Canvas in 1x oder 2x der CSS-Pixel gezeichnet, Zeichen für Zeichen auf demselben Raster, mit der eigenen Kopie von JetBrains Mono der Seite. Sehr große Bilder können überschreiten, was ein Browser für ein Canvas zulässt; die Seite sagt das dann, und das SVG funktioniert weiterhin.
- **Das Kopieren des PNG** verwendet `ClipboardItem`, wo der Browser es anbietet; `image/png` gehört zu den Datentypen, die die [Clipboard API](https://www.w3.org/TR/clipboard-apis/) für das Schreiben vorschreibt.

Es wird nichts von irgendwoher geladen oder irgendwohin gesendet. Die Vorschau ist Inline-SVG, aufgebaut aus dem Layout, und die Downloads sind Dateien, die in der Seite entstehen.

## Paletten und Kontrast

Beide Paletten sind mit den eigenen Formeln von WCAG 2.2 gemessen (relative Leuchtdichte mit dem Schwellenwert 0,04045, Kontrastverhältnis (L1 + 0.05) / (L2 + 0.05)). Jede Textfarbe, die Zeilennummern und der Fenstertitel erfüllen die 4,5:1 von Erfolgskriterium 1.4.3 gegenüber jedem Hintergrund, auf dem sie stehen können: dem Hintergrund des Codes und dem Band einer hervorgehobenen Zeile (der Titel gegenüber der Titelleiste). Die Markierung links an einer hervorgehobenen Zeile ist ein grafisches Objekt und erfüllt die 3:1 von 1.4.11. Die drei Fensterpunkte sind Dekoration. Die Verhältnisse werden abgerundet, sodass ein Bestehen nie durch Aufrunden entsteht.

| Text | Hell: auf Hintergrund `#ffffff` | Hell: auf Hervorhebung `#fff3c4` | Dunkel: auf Hintergrund `#11151c` | Dunkel: auf Hervorhebung `#26303d` |
|---|---|---|---|---|
| Normal | `#1f2328` 15,79 | 14,19 | `#e6e9ef` 15,04 | 10,97 |
| Kommentar | `#57606a` 6,38 | 5,74 | `#9ba6b2` 7,39 | 5,39 |
| String | `#0a6629` 7,12 | 6,40 | `#9ddba0` 11,38 | 8,31 |
| Zahl | `#0550ae` 7,59 | 6,82 | `#8fc6ff` 10,18 | 7,43 |
| Schlüsselwort | `#a40e26` 7,86 | 7,06 | `#ff9c94` 9,09 | 6,63 |
| Variable | `#8a4600` 7,10 | 6,38 | `#f6bd84` 10,91 | 7,96 |
| Prompt | `#0b6874` 6,46 | 5,81 | `#7fd8d0` 11,00 | 8,03 |
| Schlüssel | `#6639ba` 7,34 | 6,59 | `#c9b0ff` 9,70 | 7,08 |
| Maskierter Wert | `#9c1c6f` 7,47 | 6,71 | `#ff8fd0` 8,79 | 6,41 |
| Zeilennummer | `#5f6872` 5,66 | 5,08 | `#97a1ad` 6,98 | 5,09 |

Fenstertitel auf der Titelleiste: hell `#3a424a` auf `#eceff3`, 8,84; dunkel `#c3cbd4` auf `#1d232c`, 9,64. Markierung der Hervorhebung (3:1 erforderlich): hell `#9a6700`, 4,86 auf dem Hintergrund und 4,37 auf der Hervorhebung; dunkel `#e3b341`, 9,40 und 6,86.

## Alternativtext

Der Alternativtext besteht aus einer einzeiligen Beschreibung (wie viele Zeilen, welche Sprache, wie viele Werte maskiert), einer Leerzeile und dann dem Code als reiner Text, in dem jeder maskierte Wert als „[maskiert]“ steht. Das folgt Erfolgskriterium 1.1.1, Nicht-Text-Inhalt: Die Textalternative zu einem Bild von Code erfüllt denselben Zweck, wenn sie der Code ist. Wird der Alternativtext lang, setzen Sie den Code als Text neben das Bild (auf einer Folie in die Sprechernotizen) und behalten Sie nur die Beschreibung als Alternativtext.

## Optionen

- **Sprache**: die Hervorhebung (siehe die Tabelle oben).
- **Palette**: dunkel (der Standard) oder hell.
- **Schriftgröße**: 12, 14, 16 (der Standard), 18, 20, 24 oder 28 CSS-Pixel.
- **Tabstopps**: alle 2, 4 (der Standard) oder 8 Spalten.
- **Innenabstand**: 16, 32 (der Standard), 48 oder 64 CSS-Pixel um das Fenster herum oder ohne Rahmen um den Code.
- **Zeilennummern**: standardmäßig eingeschaltet.
- **Fensterrahmen**: standardmäßig eingeschaltet, mit drei dekorativen Punkten und einem optionalen Titel mit bis zu 80 Zeichen.
- **Zeilen hervorheben**: Nummern und Bereiche, getrennt durch Kommas oder Leerzeichen, etwa `3, 5-7`. Ein Element, das weder Zahl noch Bereich ist, eine Null oder ein rückwärts laufender Bereich wird ignoriert, und ein Bereich über die letzte Zeile hinaus wird bis zur letzten Zeile übernommen; die Seite listet auf, was sie ignoriert hat.

## Grenzen und was sich ändert

Das Tool lehnt mit Angabe des Grunds ab: Text mit mehr als 50.000 Zeichen, mehr als 400 Zeilen, eine Zeile, die nach dem Expandieren der Tabs breiter als 400 Spalten ist, einen Titel mit mehr als 80 Zeichen und eine Liste der hervorzuhebenden Zeilen mit mehr als 200 Zeichen. Diese Grenzen halten das Bild innerhalb dessen, was eine Folie oder ein Ticket verwenden kann und was Browser zeichnen können.

Es sagt Ihnen, wenn es eine Byte Order Mark entfernt, Wagenrückläufe als Zeilenumbrüche gelesen, Zeichen ersetzt hat, die XML nicht enthalten kann, Tabs expandiert, Leerzeichen am Zeilenende entfernt hat (sie würden das Bild nur verbreitern) oder den Text als Terminalsitzung gelesen hat. Ein abschließender Zeilenumbruch ergibt keine zusätzliche Zeile.

## Durchgerechnetes Beispiel

Die Schaltfläche „Beispiel“ lädt eine IPsec-Phase-1 von FortiOS, deren Pre-shared Key in der verschlüsselten Form `ENC` steht, geschrieben für dieses Beispiel (Base64 von „for-demo-only-not-a-real-key“), mit der Dokumentationsadresse 203.0.113.10 aus [RFC 5737](https://www.rfc-editor.org/rfc/rfc5737):

```
config vpn ipsec phase1-interface
    edit "to-branch-01"
        set interface "port1"
        set peertype any
        set proposal aes256-sha256
        set remote-gw 203.0.113.10
        set psksecret ENC Zm9yLWRlbW8tb25seS1ub3QtYS1yZWFsLWtleQ==
    next
end
```

Die Secret-Prüfung meldet einen Befund, „Verschlüsselter FortiOS-Wert (ENC), Zeile 7, Spalte 27“, und das Bild zeigt `set psksecret ENC ••••••••` in Zeile 7, die das Beispiel auch hervorhebt, unter dem Titel „VPN to branch 01“ (VPN: Virtual Private Network). Das SVG ist in der dunklen Palette 451,2 × 348 CSS-Pixel groß, und der Alternativtext beginnt mit „Codebild: 9 Zeilen FortiOS CLI, 1 Wert maskiert“.

## Ergebnisse teilen

Unter den Schaltflächen für den Export erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` drei Dinge: den Text so, wie das Bild ihn zeigt, wobei jeder Wert, den die Secret-Prüfung maskiert hat, durch dieselben acht Punkte ersetzt ist, die Sprache der Hervorhebung und die Palette. Fenstertitel (Freitext, den die Secret-Prüfung nicht liest), hervorgehobene Zeilen, Schriftgröße, Innenabstand, Tabstopps und die beiden Schalter werden nicht übertragen. Ein Wert, dessen Kontrollkästchen Sie deaktiviert haben, steht im Link so, wie eingegeben, und das Popover nennt jeden solchen Wert mit Zeile und Bezeichnung, bevor Sie etwas kopieren; ist kein Kontrollkästchen deaktiviert, sagt es, dass jeder gefundene Wert maskiert ist. Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird der Text beim Öffnen des Links nicht an den Server gesendet. Er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet.

- **Länge.** Höchstens 16.384 Zeichen Text, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist ein Text länger, gibt es keinen Link, und das Popover sagt das.
- **Öffnen eines Links.** Der Text füllt das Feld wie beim Einfügen, Sprache und Palette werden gesetzt, und das Bild wird gezeichnet; die übrigen Einstellungen der empfangenden Seite bleiben, wie sie sind. Ein maskierter Wert kommt als acht Punkte an: In manchen Zeilen findet die Secret-Prüfung sie erneut und maskiert sie wieder, in anderen zeichnet sie sie als gewöhnliche Zeichen, daher zählt die Beschreibung möglicherweise weniger maskierte Werte, aber es gibt keinen Wert, der sich aufdecken ließe. Eine Sprache oder Palette, die das Tool nicht anbietet, führt dazu, dass der ganze Link ignoriert wird. In beiden Fällen verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird.

## Herkunft

Das Verhalten ist durch den Satz an Referenzvektoren (Golden Vectors) `code-to-image-golden-2026-10-27b` festgelegt: die Färbung jeder Sprache (reiner Text, Shell als Skript und Sitzung, Python als Skript und Sitzung, JSON, YAML, eine iRule, ein Expect-Skript, eine tclsh-Sitzung, tmsh, FortiOS, Cisco-Stil), drei SVG-Dokumente Byte für Byte mit ihrem Alternativtext (jedes zusätzlich darauf geprüft, dass es wohlgeformtes XML ist und genau eine x-Position pro Zeichen hat), jede Secret-Regel positiv und negativ mit den genau maskierten Zeichen (und, wenn maskiert, darauf geprüft, dass sie weder im SVG noch im Alternativtext stehen), jede Grenze an und hinter ihrem Wert, die Normalisierung, die Hinweise, der Parser für hervorgehobene Zeilen und jedes Kontrastverhältnis oben, dessen Leuchtdichte außerdem mit dem [Tool für Farbkontrast](/tools/color-contrast-format) der Website verglichen wird, sowie der Text, den ein Link von „Ergebnisse teilen“ für sieben Eingaben enthält, Byte für Byte, mit der Prüfung, dass die empfangende Seite dieselben Zeichen zeichnet und dass kein maskierter Wert im Link steht.

## API

Bewusst nicht über die API verfügbar. Das PNG zeichnet der Browser des Lesers, und die Eingabe ist genau die Art Text, die Secrets enthält: Konfigurationen, Mitschnitte und Skripte sind genau das, wofür es die Secret-Prüfung gibt, und der sichere Ort, sie zu prüfen, ist der Rechner, auf dem sie bereits liegen. Sie zur Prüfung an einen Server zu senden, würde die Prüfung ad absurdum führen.

## Quellen

Alle abgerufen am 27.10.2026.

- [The Open Group Base Specifications Issue 8 (POSIX.1-2024), Shell Command Language](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/V3_chap02.html)
- [Python 3.15: Lexical analysis](https://docs.python.org/3/reference/lexical_analysis.html), [sys.ps1 und sys.ps2](https://docs.python.org/3/library/sys.html), [Zuweisungen](https://docs.python.org/3/reference/simple_stmts.html), [Status of Python versions](https://devguide.python.org/versions/)
- [RFC 8259, JSON](https://www.rfc-editor.org/rfc/rfc8259)
- [YAML 1.2.2](https://yaml.org/spec/1.2.2/)
- [Tcl 9.0: Tcl(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/Tcl.html), [expr(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/expr.html), [if(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/if.html), [set(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/set.html), [tclsh(1)](https://www.tcl-lang.org/man/tcl9.0/UserCmd/tclsh.html), [der Befehlsindex](https://www.tcl-lang.org/man/tcl9.0/TclCmd/index.html), [die Releases](https://www.tcl-lang.org/software/tcltk/)
- [F5 iRules: What Is An iRule](https://clouddocs.f5.com/api/irules/WhatIsAnIRule.html) und [when](https://clouddocs.f5.com/api/irules/when.html); [expect(1)](https://www.tcl-lang.org/man/expect5.31/expect.1.html)
- [F5 TMSH Reference v17](https://clouddocs.f5.com/cli/tmsh-reference/latest/) (tmsh, der Befehlsindex, das PDF zu 17.0.0, auth user, sys file ssl-key, ltm profile client-ssl, ltm monitor http). Die Software-Support-Richtlinie von F5, [K5903](https://my.f5.com/manage/s/article/K5903) (abgerufen am 27.10.2026), nennt für die Long-Term Stability Releases von 17.x Standard Support bis 31. März 2027 (17.1.x) und 1. Januar 2029 (17.5.x).
- [FortiOS 7.6.8 Administration Guide](https://docs.fortinet.com/document/fortigate/7.6.8/administration-guide/896276/cli-basics) (CLI basics, Command syntax, Subcommands, Trusted platform module support), [CLI Reference: config system admin](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/390485493/config-system-admin), die Technical Tips von Fortinet zum [Kopieren eines Pre-shared Key](https://community.fortinet.com/fortigate-3/technical-tip-command-fail-while-copying-the-preshare-key-from-another-configuration-214348) und zum [Supportende von FortiOS 7.4 und 7.6](https://community.fortinet.com/fortigate-3/technical-tip-fortios-end-of-support-change-for-fortios-v7-4-and-v7-6-224876) (7.6: Ende des Engineering-Supports am 25. Juli 2028, Supportende am 25. Januar 2030)
- Cisco IOS XE 17.x System Management Configuration Guide: [Managing Configuration Files](https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/syst-mgmt/b-system-management/m_cm-config-files-0.html) und [Using the Cisco IOS Command-Line Interface](https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/syst-mgmt/b-system-management/m_cf-cli-basics.html); [Catalyst 8400: Using Cisco IOS XE Software](https://www.cisco.com/c/en/us/td/docs/routers/c8400/c8400-software-config-guide/Using-Cisco-IOS-XE-software.html); [Passwörter in IOS XE 17.18](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-18/configuration_guide/sec/b_1718_sec_9300_cg/controlling_switch_access_with_passwords_and_privilege_levels.html); [die Lifecycle-Erklärung zur Software IOS XE](https://www.cisco.com/c/en/us/products/collateral/ios-nx-os-software/ios-xe-26/bulletin-c25-2378701.html)
- [RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), [OpenSSL 3.5 PEM_read_bio_PrivateKey](https://docs.openssl.org/3.5/man3/PEM_read_bio_PrivateKey/) (3.5 ist das Long-Term-Support-Release von OpenSSL, unterstützt bis 08.04.2030 laut seiner [Release-Strategie](https://openssl-library.org/policies/releasestrat/)), [OpenSSH sshkey.c](https://github.com/openssh/openssh-portable/blob/master/sshkey.c)
- [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), [RFC 6750](https://www.rfc-editor.org/rfc/rfc6750), [RFC 7617](https://www.rfc-editor.org/rfc/rfc7617), [RFC 6749](https://www.rfc-editor.org/rfc/rfc6749)
- AWS: [IAM identifiers](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_identifiers.html), [Zugriffsschlüssel](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html), [CLI configuration and credential files](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html)
- [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), [RFC 7515](https://www.rfc-editor.org/rfc/rfc7515), [RFC 7516](https://www.rfc-editor.org/rfc/rfc7516), [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), [RFC 5737](https://www.rfc-editor.org/rfc/rfc5737)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [Understanding 1.4.5 Images of Text](https://www.w3.org/WAI/WCAG22/Understanding/images-of-text.html), [Understanding 1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- [SVG 2, Text](https://www.w3.org/TR/SVG2/text.html), [XML 1.0 (Fifth Edition)](https://www.w3.org/TR/xml/), [Clipboard API and events](https://www.w3.org/TR/clipboard-apis/), [Content Security Policy Level 3](https://www.w3.org/TR/CSP3/)
- [SIL Open Font License 1.1](https://openfontlicense.org/open-font-license-official-text/) und die LICENSE-Datei des Pakets @fontsource/jetbrains-mono 5.2.8 (Copyright 2020 The JetBrains Mono Project Authors)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (abgerufen am 27.10.2026): Abschnitt 3.5, das Fragment, das die Werte eines Links von „Ergebnisse teilen“ enthält
