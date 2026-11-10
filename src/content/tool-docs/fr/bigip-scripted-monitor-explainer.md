## Ce que fait l’outil

L’outil lit le fichier que joue un moniteur Scripted de BIG-IP LTM (les lignes send et expect conservées dans `/config/eav/`) et l’explique tel que, selon la documentation de F5, le moniteur le lit. Chaque ligne s’affiche telle qu’écrite et telle que lue : le mot-clé, le texte débarrassé de ses guillemets et avec les séquences d’échappement de F5 résolues, la terminaison d’un send (CR LF, LF seul, CR seul ou rien), et la signification d’une réponse ou d’une commande connue en SMTP, POP3, IMAP ou FTP, avec la section de la RFC. Les constats confrontent le fichier à chaque règle énoncée par F5 et signalent tout ce que F5 laisse ouvert : ce sont les règles S1 à S16, chacune rattachée à une ligne.

Fournissez aussi une transcription de la session du serveur, et l’outil simule le contrôle : chaque send part, chaque expect est comparé à la réponse suivante du serveur, et le résultat est **réussi**, **échec à la ligne N**, avec la raison donnée par F5, ou **indéterminé à la ligne N** là où le texte de F5 ne dit pas ce que fait le moniteur. Rien ne se connecte nulle part : la transcription est un texte que vous collez, et le script est lu, jamais exécuté. Le [lab du moniteur Scripted](/learn/bigip-ltm-scripted-monitors#lab-scripted-monitor-dialogue) de l’article de la rubrique Apprendre joue un script face à un serveur qui suit les RFC, ligne par ligne, et montre quelle règle de F5 l’arrête.

Les faits sont ceux de F5 : la BIG-IP 21.1.0 LTM Monitors Reference, section « Scripted monitor settings », et la TMSH Reference pour `ltm monitor scripted`. Les faits protocolaires viennent de la RFC 5321 (SMTP), de la RFC 1939 (POP3), de la RFC 9051 (IMAP4rev2) et de la RFC 959 (FTP). Tous ces documents ont été consultés le 27 octobre 2026.

## Les règles énoncées par F5

- **S1, un CR dans une ligne (erreur).** F5 impose des fins de ligne LF et non CR-LF : les scripts « must use hard-return line endings (LF), not soft-return line endings (CR-LF) ». Un fichier enregistré sous Windows a un CR avant chaque LF. Le constat indique si le CR termine la ligne ou se trouve à l’intérieur.
- **S2, pas exactement un espace après le mot-clé (erreur).** F5 exige un seul espace entre le mot-clé et le texte : « Exactly one character space must be used to separate the send or expect instruction keywords from the text ». Deux espaces ou plus, ou une tabulation, sont signalés.
- **S3, des caractères après un guillemet fermant (erreur).** Pour F5, le texte va jusqu’à la fin de la ligne, même entre guillemets, et tout caractère qui suit le guillemet fermant empêche la correspondance : « The text to send or match extends to the end of the line, even when using quotation marks. Any characters that follow a closing quotation mark will break the match. » Sur une ligne expect, le simulateur fait donc échouer le contrôle à cet endroit ; sur une ligne send, F5 ne dit pas ce qui est envoyé, et le simulateur s’arrête donc sur un résultat indéterminé.
- **S4, un premier mot autre que send ou expect (erreur).** F5 ne documente que ces deux mots-clés. Le constat précise quand le mot est un mot-clé avec une majuscule (`Expect`), un commentaire (`#`), ou le signe qu’un script Expect (Tcl) a été collé (`spawn`, `set`, `#!/usr/bin/expect`, etc.).
- **S5, une séquence d’échappement absente de la liste de F5 (avertissement).** Le tableau de F5 : `\a` sonnerie (bell), `\b` retour arrière, `\f` saut de page, `\n` nouvelle ligne, `\r` retour chariot, `\t` tabulation, `\v` tabulation verticale, `\\` barre oblique inverse, `\'` guillemet simple. Tout autre caractère après une barre oblique inverse, comme `\x0d` ou `\"`, n’est pas documenté.
- **La règle du préfixe (la correspondance du simulateur).** Pour F5, le texte peut correspondre au préfixe d’une réponse, mais pas à une sous-chaîne qui commence ailleurs qu’au début de la réponse : « Matching text can match the prefix of a response, but cannot match a substring that is not a prefix, that is, a substring that starts other than at the beginning of the response. » Quand le texte apparaît plus loin dans la réponse, l’étape indique à quel caractère.
- **L’ordre.** Pour F5, les lignes du fichier sont toujours lues dans l’ordre indiqué : « the lines of the file are always read in the sequence specified ». Le simulateur parcourt le fichier de haut en bas et s’arrête à la première ligne qui échoue ou ne peut pas être tranchée.

## Ce que F5 laisse ouvert

Le texte de F5 ne tranche pas ces points : l’analyseur les signale donc comme avertissements, et le simulateur s’y arrête sur un résultat **indéterminé**, avec la raison, plutôt que de deviner :

- **S9, une ligne vide.** Les lignes vides après la dernière instruction sont notées, mais ne peuvent pas modifier une correspondance.
- **S10, des espaces avant le mot-clé.**
- **S11, une forme de guillemets que F5 ne décrit pas :** des guillemets simples (F5 liste un échappement pour le guillemet simple, sans dire si des guillemets simples délimitent un texte), un guillemet ouvrant sans guillemet fermant, ou un guillemet à l’intérieur d’un texte sans guillemets.
- **S12, un texte vide** (`expect` seul, ou `expect ""`).
- **S13, une dernière ligne sans LF.** Un expect sur une telle ligne arrête la simulation ; un send n’y est que noté.
- **S14, aucune ligne expect :** rien de ce que dit le serveur n’est jamais vérifié.
- **Casse.** Quand la réponse commence par le texte dans une autre casse (`+ok` face à `+OK`), le simulateur rend un résultat indéterminé : F5 ne dit pas si la comparaison tient compte de la casse.
- **Ce qu’est une réponse.** F5 ne dit pas quelle part d’une réponse sur plusieurs lignes le moniteur lit avant de comparer. Quand une correspondance exigerait que le moniteur lise au-delà de la fin de la première ligne de la réponse, le simulateur rend un résultat indéterminé.
- **Une ligne sans guillemets qui se termine par CR** (un fichier CR-LF sans guillemets) : F5 impose LF seul, mais ne dit pas comment une telle ligne est alors lue.

## Conseils tirés des RFC

- **S6, un send sans fin de ligne (avertissement).** SMTP, POP3, IMAP et FTP terminent chaque commande par CR LF (RFC 5321 2.3.8, RFC 1939 section 3, RFC 9051 2.2, RFC 959 section 4) : un serveur de ces protocoles en attend donc une. L’exemple de F5 lui-même écrit `\r\n` à la fin de chaque send ; rien dans le texte de F5 n’indique que le moniteur ajoute une fin de ligne.
- **S7, un send terminé par LF seul ou par CR seul (remarque).** RFC 5321 2.3.8 : une implémentation conforme ne doit reconnaître aucun autre terminateur de ligne que CR LF.
- **S8, un expect écrit comme un motif (remarque) :** un `^` initial, un `$` final, `.*` ou `.+`, ou les options `-re`, `-gl`, `-ex` ou `-nocase` d’Expect. Le texte est comparé littéralement ; F5 indique que les seuls moniteurs qui prennent en charge les expressions régulières sont HTTP, HTTPS, HTTP/2, TCP et UDP.
- **S15, des identifiants dans un send (avertissement) :** `PASS` (POP3, FTP) ou `LOGIN` (IMAP). Le mot de passe est masqué partout dans la sortie, comparaison avec la transcription comprise. Le fichier le conserve en clair, la référence tmsh ne liste aucune option TLS pour ce type de moniteur, et la RFC 9051 6.2.3 précise que LOGIN ne doit pas être utilisé sur des réseaux non sécurisés. POP3 autorise QUIT et IMAP autorise LOGOUT avant l’authentification : un contrôle qui ne s’authentifie jamais est donc généralement possible.
- **S16, un expect sur un code de réponse suivi d’un espace (remarque),** comme `"250 "`. Dans les réponses SMTP et FTP sur plusieurs lignes, chaque ligne sauf la dernière commence par le code et un trait d’union (RFC 5321 4.2.1, RFC 959 4.2) : `"250 "` n’est donc jamais le début d’une réponse à EHLO ; écrivez un expect sur le code seul.

## La transcription, et sa lecture par la simulation

Écrivez la session comme le font les RFC : `S:` avant chaque ligne envoyée par le serveur, `C:` avant chaque ligne envoyée par le client.

```
S: 220 foo.com Simple Mail Transfer Service Ready
C: HELO bigip1.somecompany.net
S: 250 foo.com
C: quit
S: 221 foo.com Service closing transmission channel
```

- Une **réponse** est une suite de lignes `S:` ; une ligne `C:` ou une ligne vide la termine. Placez une ligne vide entre deux suites `S:` quand le serveur les envoie comme des réponses distinctes.
- Chaque ligne `S:` est lue comme terminée par **CR LF**, comme l’exigent les quatre protocoles. Les espaces après `S:` et `C:` relèvent de la notation, pas des données (la RFC 1939 écrit `S:  +OK` avec deux espaces).
- Chaque **expect** est comparé à la **réponse suivante**, à partir de son premier caractère. C’est la seule hypothèse du simulateur : F5 ne dit pas ce qui compte comme « the response » quand une réponse a plusieurs lignes. Partout où cela pourrait changer le verdict, le simulateur rend un résultat indéterminé.
- Chaque **send** est comparé à la ligne `C:` suivante, s’il y en a une ; une différence est notée (la transcription peut venir d’un autre client), jamais traitée comme un échec.
- Quand la transcription n’a **plus de réponse** pour un expect, le contrôle échoue à cet endroit : la ligne Timeout du tableau de F5 indique qu’une cible qui ne répond pas dans le délai Timeout est considérée comme down.
- Les lignes qui ne commencent ni par `S:` ni par `C:` sont ignorées et listées.

Les raisons pour lesquelles un contrôle échoue : le texte apparaît dans la réponse, mais pas à son début (avec le décalage) ; la réponse ne commence pas par le texte et ne le contient pas ; la réponse se termine avant le texte ; des caractères, ou le CR d’une fin de ligne CR-LF, suivent un guillemet fermant ; aucune réponse n’arrive.

## Lecture de la sortie

Le résumé compte les lignes, les send, les expect et les constats, et signale quand le fichier ne se termine pas par un LF. La simulation affiche le verdict, puis une rangée par ligne atteinte : la ligne, ce qu’elle envoie ou attend tel que le moniteur le lit, la réponse à laquelle elle a été comparée (numérotée comme dans la transcription) ou, pour un send, si la transcription montre la même ligne client, et le résultat. Le tableau des lignes affiche chaque ligne telle qu’écrite : un caractère de contrôle réellement présent dans le fichier (le CR d’une fin CR-LF, une tabulation) y apparaît sous la forme de son pictogramme Unicode, comme ␍ ou ␉, et un échappement saisi sous la forme d’une barre oblique inverse suivie d’une lettre reste tel que saisi ; ailleurs, le texte s’affiche avec les séquences d’échappement de F5, et une barre oblique inverse s’y écrit doublée.

Le bouton **Exemple** charge tel quel le script SMTP de F5 tiré de la Monitors Settings Reference, avec une session calquée sur celles de la RFC 5321 : il réussit.

## Temporisation

Dans la documentation de F5, le script n’a pas de temporisateur propre. L’Interval du moniteur (10 secondes par défaut pour Scripted, selon la référence tmsh) et son Timeout (31 secondes, trois fois l’Interval plus une) décident du moment où un membre est marqué down, comme pour tout moniteur ; [l’article sur les moniteurs de santé LTM](/learn/ltm-health-monitors) et son [lab sur la temporisation des moniteurs](/learn/ltm-health-monitors#lab-f5-monitor-timing) montrent comment ils se combinent.

## Partage des résultats

À la fin du résumé, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, les deux zones (`input` pour le script, `transcript` pour la transcription s’il y en a une), chaque mot de passe PASS et LOGIN y étant remplacé par les puces qu’affiche cette page, dans le script tel qu’écrit comme dans les lignes `C:` de la transcription : aucun mot de passe ne part tel que saisi. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

Ce sont les mots de passe que masque la règle S15 : `PASS` ([RFC 1939](https://www.rfc-editor.org/rfc/rfc1939), section 7) et le dernier argument de `LOGIN` ([RFC 9051](https://www.rfc-editor.org/rfc/rfc9051), section 6.2.3), RFC consultées le 27/10/2026. Une puce par caractère, comme sur cette page : la page qui reçoit le lien lit donc exactement les mêmes lignes, les mêmes constats et la même simulation, et les vecteurs de partage de l’outil comparent les deux résultats dans leur intégralité. Un mot de passe écrit avec des séquences d’échappement ne peut pas être retrouvé tel qu’écrit (la page masque alors tout le texte) : il n’obtient donc aucun lien, et la fenêtre contextuelle indique la ligne. Les autres identifiants partent tels que saisis, par exemple un échange SMTP AUTH ([RFC 4954](https://www.rfc-editor.org/rfc/rfc4954), du Base64 qui se décode en mot de passe) ; la fenêtre contextuelle le signale avant que vous ne copiiez quoi que ce soit. La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : la copie n’est donc pas envoyée au serveur à l’ouverture du lien ; elle reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut la lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** Les deux zones se remplissent comme lors d’un collage (une transcription absente du lien est vidée) et la page les lit. Rien ne se connecte à quoi que ce soit et rien ne s’exécute. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.

## Limites

- L’analyseur applique les règles publiées par F5. Ce que fait une version donnée de BIG-IP au-delà de ces règles, il ne peut pas le savoir ; là où la documentation est muette, il rend un résultat indéterminé.
- La transcription vous appartient : le simulateur ne sait pas comment votre serveur répond réellement, à quelle vitesse, ni s’il n’envoie qu’une partie d’une réponse.
- Le contrôle des identifiants repose sur un motif : `PASS x` et `tag LOGIN user password`. Un mot de passe envoyé autrement (par AUTH, par exemple) n’est pas reconnu.
- Testez le vrai moniteur sur le système : `tmsh run ltm monitor scripted NAME destination ADDRESS:PORT`, puis `tmsh show ltm monitor scripted NAME test-result`, ou le bouton Test de l’utilitaire de configuration (Configuration utility).

## API

Le même moteur répond à l’opération `/api/v1/bigip-scripted-monitor-explainer` de l’API HTTP du site, décrite dans le contrat OpenAPI de la [page API](/api) ; le contrat indique aussi si ce site sert l’API.

- **Requête.** Un objet JSON, `{"script": "...", "transcript": "..."}`, dans le corps d’un POST ou dans le paramètre de requête `input` d’un GET ; la transcription peut être vide ou omise. Le script est limité à 32 768 caractères et la transcription à 65 536.
- **Réponse.** `lines` (chacune avec `line`, `raw`, `kind`, `keyword`, `written`, `quoted`, `decoded`, `length`, `ending`, `hint`, `secret`, `breaks` et `open`), `findings` (`rule`, `severity`, `line`, `params`), `counts`, `sends`, `expects`, `endsWithLf`, `transcript` (`replies`, `clientLines`, `ignoredLines`) et `simulation` (`verdict`, `stopLine`, `reason`, `steps`, `unreadReplies`, `unusedClientLines`, `notes`), ces deux derniers valant null quand aucune transcription n’est fournie. Un mot de passe est masqué dans chaque champ.

## Sources

- [F5, BIG-IP 21.1.0 LTM Monitors Reference, Monitors Settings Reference: Scripted monitor settings, les séquences d’échappement et l’exemple SMTP de F5 ; la TCP Receive String et les moniteurs qui prennent en charge les expressions régulières](https://techdocs.f5.com/en-us/bigip-21-1-0/big-ip-local-traffic-manager-monitors-reference/monitors-settings-reference.html#scripted-monitor-settings) (consulté le 27/10/2026)
- [F5 TMSH Reference v17, ltm monitor scripted : options et valeurs par défaut, run et show test-result](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_monitor_scripted.html) (consulté le 27/10/2026)
- [RFC 5321, Simple Mail Transfer Protocol](https://www.rfc-editor.org/rfc/rfc5321) (consultée le 27/10/2026)
- [RFC 1939, Post Office Protocol, Version 3](https://www.rfc-editor.org/rfc/rfc1939) (consultée le 27/10/2026)
- [RFC 9051, Internet Message Access Protocol (IMAP), Version 4rev2](https://www.rfc-editor.org/rfc/rfc9051) (consultée le 27/10/2026)
- [RFC 959, File Transfer Protocol](https://www.rfc-editor.org/rfc/rfc959) (consultée le 27/10/2026)
- Articles : [Moniteurs Scripted de BIG-IP LTM](/learn/bigip-ltm-scripted-monitors), [Décision up ou down des moniteurs de santé LTM](/learn/ltm-health-monitors). Outils associés : l’[analyseur de scripts Expect](/tools/expect-script-explainer), pour Expect lui-même, et l’[analyseur de configuration tmsh](/tools/f5-tmsh-config-explainer), pour l’objet `ltm monitor scripted` qui désigne le fichier.
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultée le 27/10/2026) : section 3.5, le fragment, qui contient les valeurs d’un lien créé par Partager les résultats
