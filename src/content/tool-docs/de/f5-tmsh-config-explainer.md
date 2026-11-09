## Was das Tool tut

Fügen Sie einen Ausschnitt einer `bigip.conf` von BIG-IP ein, und das Tool parst ihn und erklärt jedes Objekt in verständlicher Sprache, zusammen mit der Struktur, die die Objekte verbindet. Es liest nur die Konfiguration, vollständig in Ihrem Browser; es ändert nichts und kontaktiert kein Gerät.

## Wie eine BIG-IP-Konfiguration aufgebaut ist

BIG-IP speichert seine Konfiguration als tmsh-Objekte, und alle folgen derselben Form:

    <module> <component> [<type>] <name> {
        <key> <value>
        <key> { <nested body> }
        <bare-list-item>
    }

Die führenden Wörter ordnen das Objekt in die Hierarchie aus Modulen und Komponenten von BIG-IP ein (`ltm virtual`, `ltm pool`, `net vlan` und so weiter), der Name identifiziert es, und die geschweiften Klammern enthalten seine Felder. Innerhalb eines Rumpfs trennen Zeilenumbrüche die Einträge, Klammerblöcke können beliebig tief verschachtelt sein, Strings in Anführungszeichen dürfen Leerzeichen enthalten, und ein `#` leitet einen Kommentar ein. Eine Backslash-Sequenz in Anführungszeichen wird so angezeigt, wie sie geschrieben ist: Der send-String eines Monitors enthält `\r\n`, und das BIG-IP macht aus jedem `\r` einen Wagenrücklauf und aus jedem `\n` einen Zeilenvorschub erst, wenn es die Anfrage formatiert ([F5 K2167](https://my.f5.com/manage/s/article/K2167), abgerufen am 27.10.2026). Das Tool folgt genau dieser Grammatik, um einen Ausschnitt in seine Objekte und jedes Objekt in seine Felder zu zerlegen.

## Was das Tool erklärt

Statt Sie jedes Feld selbst erkennen zu lassen, beschreibt das Tool, was die gängigen Objekte und Einstellungen bedeuten: `destination`, `pool`, `profiles` und `source-address-translation` eines virtuellen Servers; `members`, `monitor` und `load-balancing-mode` eines Pools; und die vielen anderen Objekte, die eine Konfiguration verknüpft. Das Ergebnis ist eine lesbare Karte dessen, was eine Konfiguration tatsächlich tut; das hilft, wenn Sie ein Gerät übernehmen, eine Änderung prüfen oder das Objektmodell lernen.

## Die eine Ausnahme, die kein tmsh ist

Es gibt eine bewusste Ausnahme. Ein Objekt `ltm rule` enthält in seinem Rumpf eine Tcl-iRule, und dieser Rumpf ist ein Skript, keine tmsh-Konfiguration. Der Parser erkennt das und übernimmt die iRule wörtlich, statt sie als Objekte und Felder zu parsen; so bleibt Ihre Regel genau so erhalten, wie sie geschrieben ist, statt verstümmelt zu werden.

## Verwendung

Fügen Sie einen Ausschnitt aus `bigip.conf` ein, von einem einzelnen Objekt bis zu einem großen Block, und lesen Sie die strukturierte, erklärte Aufschlüsselung. Das Parsen ist deterministisch und lokal und damit auch ein sicherer Weg, eine Konfiguration zu lesen, die von einem Gerät exportiert wurde, das Sie nicht direkt abfragen können oder sollten.

## Ergebnisse teilen

Unter der Zusammenfassung der gefundenen Objekte erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` die Konfiguration, wobei der Wert jeder geheimen Einstellung durch `[redacted]` ersetzt ist, nie so, wie eingefügt, weil diese Seite den Wert jedes Felds anzeigt. Das Popover nennt zuerst, was der Link enthält und wie viele Werte ersetzt wurden, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Die Einstellungen sind `password` (die Monitore, [ltm monitor http](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_monitor_http.html): „the password if the monitored target requires authentication“), `passphrase` ([client-ssl](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_profile_client-ssl.html), server-ssl, sys file ssl-key), `secret` ([auth radius-server](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/auth/auth_radius-server.html), auth tacacs, ltm monitor radius), `bind-pw` ([auth ldap](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/auth/auth_ldap.html)), `preshared-key` ([net ipsec ike-peer](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/net/net_ipsec_ike-peer.html)), die SNMP-Einstellungen `community-name`, `community` und `trap-community` ([sys snmp](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/sys/sys_snmp.html)) sowie jede Einstellung, deren Name auf `-password`, `-passphrase` oder `-secret` endet (`encrypted-password`, `auth-password`, `privacy-password`, [`cookie-encryption-passphrase`](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_persistence_cookie.html), [`encrypt-cookie-secret`](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_profile_http.html), `proxy-ca-passphrase`); Quelle sind die Seiten der tmsh-Referenz von F5, abgerufen am 27.10.2026. Der `send`-String eines Monitors behält seinen Text, außer den Zugangsdaten eines `Authorization`- oder `Proxy-Authorization`-Headers ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), Abschnitte 11.6.2 und 11.7.2, abgerufen am 27.10.2026), die ebenfalls zu `[redacted]` werden. `none` bleibt. `[redacted]` ist ein einzelnes tmsh-Wort, daher liest sich die Kopie als dieselben Objekte, Felder und Verschachtelungen: Die Share-Vektoren des Tools prüfen, dass die empfangende Seite denselben Baum parst. Namen, Adressen und Partitionen bleiben so, wie eingefügt.

Der Rumpf einer iRule (`ltm rule`) ist Tcl, wird hier wörtlich angezeigt und bleibt so, wie eingefügt: Enthält die Konfiguration eine iRule, weist das Popover darauf hin, damit Sie sie zuerst auf ein fest eingetragenes Token oder Passwort prüfen können. Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird die Kopie beim Öffnen des Links nicht an den Server gesendet. Sie bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann sie lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Die Kopie füllt das Feld wie beim Einfügen, und die Seite erklärt sie. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.

## Verwandte Tools

- Ein Scripted-Monitor (`ltm monitor scripted`) spielt eine Datei mit send- und expect-Zeilen ab, die in `/config/eav/` liegt; [Scripted-Monitore von BIG-IP erklärt](/tools/bigip-scripted-monitor-explainer) liest diese Datei und simuliert die Prüfung anhand eines Servertranskripts.
- Um eine Konfiguration per Skript von einem BIG-IP abzuholen, schreibt der [Generator für Expect-Skripte](/tools/expect-script-builder) ein Skript zum Anmelden und Ausführen mit einem tmsh-Profil, das den Pager von tmsh mit `modify /cli preference pager disabled display-threshold 0` abschaltet.
