## Was das Tool tut

Geben Sie dem Tool eine BIG-IP-Version, und es nennt das Service Check Date, das die Lizenz für diese Version mindestens haben muss; geben Sie ihm ein Service Check Date, und es nennt die neueste Version, auf die Sie aktualisieren können, dazu die neueren Zweige, die Sie noch nicht erreichen, und das Datum, das jeder davon braucht. Es ist ein Nachschlagen in beide Richtungen über eine mitgelieferte Kopie der veröffentlichten Tabelle License Check Date von F5, und es läuft vollständig in Ihrem Browser.

## Die beiden Daten, mit denen das Tool arbeitet

Jede BIG-IP-Version hat ein festes **License Check Date**: das Service Check Date, das eine Lizenz mindestens haben muss, damit diese Version booten darf. Jede Lizenz hat ein **Service Check Date**: das frühere der beiden Daten, an dem sie zuletzt aktiviert wurde und an dem ihr Servicevertrag abläuft. Bei einem Upgrade auf eine neue Major- oder Minor-Version vergleicht das System die beiden, und liegt das Service Check Date der Lizenz vor dem License Check Date der Version, bootet das aktualisierte System zwar, lädt seine Konfiguration aber erst, wenn die Lizenz reaktiviert ist. Das Tool enthält die Tabelle License Check Date von F5 (aus K7727) und nimmt Ihnen diesen Vergleich ab, in beide Richtungen.

Daten werden genau in der Form verarbeitet, die BIG-IP in `bigip.license` schreibt, dem achtstelligen `yyyymmdd` (`20230208` ist also der 8. Februar 2023), und zusätzlich in ISO-Form angezeigt. Der Vergleich ist reine Datumsarithmetik ohne Uhr: Sowohl das Datum der Version als auch das Service Check Date sind Eingaben, daher ergeben dieselben Eingaben immer dieselbe Antwort.

## Durchgerechnete Beispiele

Geben Sie eine Version ein, und Sie erhalten ihre Untergrenze. `17.1.3` wird dem Zweig `17.1.x` zugeordnet und meldet als mindestens erforderliches Service Check Date `2023-02-08` (`20230208`); `21.1` meldet `2026-04-15`; `16.1.x` meldet `2021-06-11`.

Geben Sie ein Service Check Date ein, und Sie erhalten Ihre Obergrenze. Ein Service Check Date von `2023-06-15` reicht bis `17.1.x` als neuestem Zweig und meldet die Zweige, die Sie noch nicht erreichen: `17.5.x` (erfordert `2025-02-12`), `21.0.x` (erfordert `2025-10-29`) und `21.1.x` (erfordert `2026-04-15`). Ein aktuelles Datum wie `2026-05-01` erreicht den neuesten Zweig, ohne dass etwas gesperrt ist; ein Datum, das älter ist als die ganze Tabelle, erreicht nichts, und das ist das Signal, dass die Lizenz vor jedem Upgrade reaktiviert werden muss.

## Nur Major- und Minor-Upgrades werden geprüft

Die Prüfung gilt für ein Upgrade, das F5 als Änderung der ersten oder zweiten Stelle der Versionsnummer definiert. Ein Wechsel zwischen Maintenance- oder Point-Releases innerhalb desselben Zweigs ist ein Update und löst überhaupt keine Prüfung des Service Check Date aus. Deshalb arbeitet das Tool auf der Ebene major.minor: Sobald Ihr Service Check Date neu genug ist, um `17.1.x` zu erreichen, ist es neu genug für jedes Maintenance- und Point-Release in diesem Zweig. Die Antwort für `17.1.0`, `17.1.3` und `17.1.x` ist also dasselbe einzelne Datum.

## Verwendung

Geben Sie eine BIG-IP-Version (`17.1.3`, `21.1`, `16.1.x`) oder ein Service Check Date (`20230611`, `2023-06-11` oder `2023/06/11`) ein; das Tool erkennt, was Sie angegeben haben, und antwortet entsprechend. Ohne Tastatur verwenden Sie die beiden Bedienelemente unter dem Feld: Die Datumsauswahl füllt es mit einem Service Check Date in der Form `yyyy-mm-dd`, und die Versionsliste enthält jede Zeile der Tabelle aus K7727, die das Tool mitbringt, mit der Bezeichnung von F5, und füllt das Feld mit einer Version, die diese Zeile abdeckt (`17.1.x` für einen Zweig, die erste Version eines Bereichs wie `10.2.2 - 10.2.4`). Beide füllen das Feld genau so, als wäre der Wert eingegeben. Weil das Tool Herstellerdokumentation abbildet und keinen festen Standard, und weil F5 mit jedem Release eine Zeile hinzufügt, prüfen Sie jeden Wert vor einem Upgrade in der Produktion gegen F5 K7727 oder die Datei `/etc/version_date` des Zielsystems.

## Eine Lizenz oder tmsh-Ausgabe einfügen

Sie können den gesamten Inhalt von `/config/bigip.license`, ein beliebiges Bruchstück davon oder die Ausgabe von `tmsh show sys license` einfügen; das Tool findet die Zeile mit dem Service Check Date und beantwortet dieselbe Frage nach der Upgrade-Berechtigung. Beide veröffentlichten Zeilenformen werden erkannt: die Dateiform `Service check date : 20151008` (mit beliebigen Leerzeichen um den Doppelpunkt) und die tmsh-Form `Service Check Date 2016/08/18`. Eine Lizenz enthält genau eine solche Zeile, daher gilt der erste Treffer, und die gefundene Zeile wird angezeigt, damit Sie prüfen können, dass der richtige Wert übernommen wurde. Alles andere im eingefügten Text wird ignoriert, und wie immer verlässt nichts Ihren Browser.

## Ergebnisse teilen

Unter der Antwort erzeugt **Ergebnisse teilen** einen Link auf diese Seite, und zwar nur, wenn Sie die Schaltfläche wählen. Der Link enthält nach dem `#` die Version oder das Datum so, wie eingegeben, oder, wenn Sie eine Lizenz oder die Ausgabe von `tmsh show sys license` eingefügt haben, nur die Zeile mit dem Service Check Date, die die Seite daraus gelesen hat (die Zeile, die sie Ihnen zeigt, etwa `Service check date : 20230611`), nie die Lizenz. Das Popover nennt zuerst, was der Link enthält, und bietet dann „Link kopieren“ und, sofern der Browser eines bietet, das Teilen-Menü an; die Adresse der Seite bleibt unverändert.

Eine Lizenz enthält den Registration Key, und laut der tmsh-Referenz von F5 ([sys license](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/sys/sys_license.html), abgerufen am 27.10.2026) gilt nach einem Widerruf: „the registration key may subsequently be re-used to relicense this or another VE instance“, der Key lässt sich danach also erneut verwenden. Die eine Zeile genügt: Die empfangende Seite liest dasselbe Datum daraus und zeigt dieselbe Zeile. Laut [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (Abschnitt 3.5, abgerufen am 27.10.2026) ist das Fragment „separated from the rest of the URI prior to a dereference“, also vor der Dereferenzierung vom Rest der URI getrennt; daher wird der Wert beim Öffnen des Links nicht an den Server gesendet. Er bleibt in der Adressleiste und im Verlauf dessen, der den Link öffnet, und wer den Link hat, kann ihn lesen.

- **Länge.** Eine Zeile, weit unter den 16.384 Zeichen, die die Website nach dem `#` zulässt.
- **Öffnen eines Links.** Der Wert füllt das Feld, als wäre er eingegeben, und die Seite antwortet. Danach verschwinden die Werte sofort aus der Adresse der Seite, ohne dass eine Anfrage gesendet wird; ein Neuladen oder die Schaltfläche „Teilen“ der Seite überträgt daher nichts.
