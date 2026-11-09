## Was das Tool tut

Fügen Sie Persistenzprofile und virtuelle Server von BIG-IP als tmsh-Ausschnitt ein, und das Tool erklärt die Persistenz hinter jedem davon: welche Methode es ist, was als Schlüssel dient, wie sie sich verhält, welche Felder wichtig sind und wie sie in der Praxis scheitert. Für jeden virtuellen Server zeigt es außerdem die Persistenzkette, also die primäre Methode und den Fallback, der greift, wenn die primäre Methode keinen Eintrag liefert. Das Tool parst die Konfiguration in Ihrem Browser und kontaktiert kein Gerät.

## Was Persistenz ist und warum die Methode zählt

Persistenz, auch Sitzungsaffinität genannt, bindet einen Client über mehrere Verbindungen hinweg an dasselbe Pool-Member; zustandsbehaftete Anwendungen brauchen das, damit eine auf einem Server begonnene Sitzung auf diesem Server weiterläuft. BIG-IP bietet mehrere Methoden, und das Entscheidende ist, dass jede einen anderen Schlüssel verwendet und daher auf ihre eigene Weise scheitert. Eine Methode zu wählen, heißt eigentlich, den Schlüssel zu wählen und in Kauf zu nehmen, wie dieser Schlüssel versagen kann.

## Die gängigen Methoden und wie sie scheitern

- **Persistenz nach Quelladresse** verwendet die IP-Adresse des Clients als Schlüssel. Ihr klassisches Versagen: Viele Clients kommen hinter einem einzigen NAT oder Proxy an, teilen sich eine Adresse, werden alle an ein einziges Pool-Member gebunden, und die Last verschiebt sich. Sie bricht auch, wenn sich die Adresse eines Clients mitten in der Sitzung ändert.
- **Cookie-Persistenz** verwendet ein HTTP-Cookie als Schlüssel, das das BIG-IP verwaltet, in Modi, die es einfügen, umschreiben oder passiv lesen. Sie ist präzise, setzt aber HTTP und einen Client voraus, der Cookies annimmt, und gilt daher nicht für Datenverkehr ohne HTTP.
- **SSL-Persistenz** verwendet die TLS-Session-ID als Schlüssel. Sie scheitert, wenn Clients Session-IDs wechseln oder neu aushandeln oder wenn Session-IDs nur kurz gelten; deshalb wird sie so oft mit einem Fallback kombiniert.
- **Universal-Persistenz** verwendet einen Wert als Schlüssel, den eine iRule aus dem Datenverkehr extrahiert; so lässt sich nach fast allem persistieren (einem Token, einem Header, einem Feld), um den Preis, die Regel zu schreiben.

Einstellungen wie match-across-services, match-across-virtuals und match-across-pools erweitern den Bereich, in dem ein Persistenzeintrag gilt, und das Tool wertet sie dort aus, wo sie gesetzt sind.

## Die Kette aus primärer Methode und Fallback

Ein virtueller Server kann ein primäres und ein Fallback-Persistenzprofil angeben. Findet die primäre Methode für eine Verbindung keinen bestehenden Eintrag, verwendet BIG-IP den Fallback, um sie zuzuordnen. Eine bekannte Kombination ist SSL-Persistenz über die Session-ID mit Persistenz nach Quelladresse als Fallback, sodass ein Client, dessen Session-ID noch nicht bekannt ist, trotzdem über seine IP gebunden wird. Das Tool zeigt diese Kette pro virtuellem Server, damit Sie sehen, was tatsächlich über ein Member entscheidet. Für die Bytes in einem Persistenz-Cookie ist der Decoder für BIG-IP-Persistenz-Cookies das ergänzende Tool; dieses hier erklärt die Methode drumherum.

## Verwendung

Fügen Sie Persistenzprofile, virtuelle Server oder beides ein und lesen Sie für jedes Methode, Schlüssel, Felder und Fehlerbilder, dazu die Kette von der primären Methode zum Fallback pro virtuellem Server. Das Parsen ist deterministisch und lokal.

## Ergebnisse teilen

Am Anfang der Auswertung erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` die Profile und virtuellen Server, wobei der Wert jeder geheimen Einstellung durch `[redacted]` ersetzt ist, nie so, wie eingefügt. Ein Cookie-Profil kann eine solche Einstellung enthalten: [`cookie-encryption-passphrase`](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_persistence_cookie.html) „Specifies a passphrase to be used for cookie encryption“, also die Passphrase für die Cookie-Verschlüsselung (tmsh-Referenz von F5, ltm persistence cookie, abgerufen am 27.10.2026). Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Die Kopie stammt aus [tmsh-Konfiguration erklärt](/tools/f5-tmsh-config-explainer) und wird mit demselben Parser erstellt, mit dem diese Seite liest; daher wird in einem größeren eingefügten Text auch jedes Passwort, jede Passphrase, jedes Secret und jeder SNMP-Community-Wert ersetzt, und das Popover nennt, wie viele es waren. `[redacted]` ist ein einzelnes tmsh-Wort, daher liest die empfangende Seite dieselben Profile, Ketten und Felder. Namen von Profilen, virtuellen Servern, Pools und Cookies bleiben so, wie eingefügt; ebenso der Rumpf einer iRule, und das Popover weist darauf hin, wenn einer enthalten ist. Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird die Kopie beim Öffnen des Links nicht an den Server gesendet. Sie bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann sie lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Die Kopie füllt das Feld wie beim Einfügen, und die Seite erklärt sie. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
