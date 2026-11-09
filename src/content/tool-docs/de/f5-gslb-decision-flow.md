# GSLB-Entscheidungsablauf erklärt

Fügen Sie Konfigurationsblöcke `gtm wideip` und `gtm pool` ein (so, wie `tmsh list gtm wideip a <name>` und `tmsh list gtm pool a <name>` sie ausgeben), und die zweistufige Entscheidung des Global Server Load Balancing (GSLB) von BIG-IP DNS (früher GTM, Global Traffic Manager) wird so dargestellt, wie sie tatsächlich abläuft.

Die Stufe der Wide IP zeigt die Methode der Poolauswahl (`pool-lb-mode`, Standard round-robin) mit den zugeordneten Pools, ihrer Reihenfolge und ihren Ratio-Werten sowie die Einstellungen der Wide IP, die die Antworten prägen: Persistenz, last-resort-pool, das Verhalten von failure-rcode und die Stellschraube für die Ausführlichkeit des Decision-Logs, mit der Sie genau diesen Ablauf in den Logs verfolgen können.

Die Pool-Stufe zeigt die Kette aus drei Schritten: bevorzugt (`load-balancing-mode`), alternativ (`alternate-mode`), Fallback (`fallback-mode`), jeder Schritt mit der Semantik des Herstellers für die Stufe und die Methode. Fehlt ein Attribut, werden die Standardwerte angewendet und gekennzeichnet: round-robin, round-robin, return-to-dns.

Darunter gleichen deterministische Beobachtungen die Konfiguration mit der dokumentierten Grammatik und den Regeln des Handbuchs zu Load Balancing ab: Methoden außerhalb der Liste zulässiger Tokens einer Stufe, die Eigenschaft der Fallback-Stufe, die Verfügbarkeit zu ignorieren, die bei jeder aufgelösten Kette genannt wird, die Verdrahtung von Fallback IP (die Methode ohne Adresse oder eine Adresse, die keine Stufe nutzt), die Methoden, für die dynamic-ratio gilt, auf null gesetzte QoS-Koeffizienten, Member-Ratios, die keine Stufe verwendet, die Paarungsregel für Global Availability und die Warnung zu Topology auf beiden Stufen, nach der die Fallback-Methode jedes Pools auf None stehen sollte.

Ein einzelner Methodenname erklärt genau diese Methode, einschließlich der Stufen, die sie zulassen, und der Herkunft ihres Entscheidungssignals (Probing über den LDNS-Pfad, serverseitige Statistiken oder keines). Das Wort `methods` listet beide Kataloge auf.

Alles läuft lokal; nichts, was Sie einfügen, verlässt die Seite.

## Ergebnisse teilen

Oben in der Auswertung erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` das Feld so, wie eingegeben, und sonst nichts. Das Popover nennt zuerst, was der Link enthält, dann einen eigenen Warnhinweis: Namen von Wide IPs und Pools identifizieren Ihre Infrastruktur, lesen Sie den eingefügten Text also, bevor Sie den Link senden. Dann bietet es „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Die Seite überspringt jeden Konfigurationsblock, den sie nicht erklärt; auch eine ganze Konfigurationsdatei erhält also eine Auswertung, und ein Link dazu würde alles enthalten, was darin steht. Solange der eingefügte Text eine geheime Einstellung enthält, gibt es daher keinen Link, und das Popover nennt die Einstellung: ein tmsh-Attribut namens `password`, `passphrase` oder `secret` oder eines, dessen Name darauf endet (`encrypted-password`, `proxy-ca-passphrase`, `shared-secret`), `bind-pw` oder `community-name`, gefolgt von einem anderen Wert als `none`; oder ein `Authorization`-Header an beliebiger Stelle, etwa im `send`-String eines Monitors. Die [tmsh-Referenz von F5 zu gtm monitor http](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/gtm/gtm_monitor_http.html) (abgerufen am 27.10.2026) führt `password` neben `send` auf, und [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) (Abschnitt 11.6.2, abgerufen am 27.10.2026) definiert den Wert von Authorization als Zugangsdaten. Entfernen Sie diese Zeile und wählen Sie die Schaltfläche erneut: Die Seite zeigt diese Werte nie an, daher liest sich der Rest genauso.

Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird der Text beim Öffnen des Links nicht an den Server gesendet. Er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann ihn lesen.

- **Länge.** Insgesamt höchstens 16.384 Zeichen, die Grenze, die die Website für jeden Wert nach dem `#` setzt; ist der geteilte Inhalt länger, gibt es keinen Link, und das Popover nennt seine Länge.
- **Öffnen eines Links.** Der Text füllt das Feld wie beim Einfügen, und die Seite liest ihn; es wird nichts gesendet. Danach verschwindet der Wert sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
