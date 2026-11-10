## Ce que fait l’outil

L’outil écrit un script [Expect](/glossary/expect) complet à partir de quelques choix : le mode de connexion (ssh, telnet ou un autre programme, comme un client de console série), l’hôte et l’utilisateur, la méthode d’authentification de la connexion, un profil d’équipement, les commandes, les délais d’expiration et la destination de la sortie. Le script se connecte, élève les privilèges là où vous le demandez, gère la pagination, exécute les commandes une à une et se déconnecte. Par défaut, il ne modifie rien sur l’équipement : là où désactiver la pagination serait un changement de configuration global, il répond plutôt au pager, et modifier le réglage est un choix explicite qui s’accompagne de sa restauration. Rien n’est exécuté et rien ne quitte le navigateur : vous copiez ou téléchargez le script et l’exécutez vous-même.

Chaque script que l’outil peut écrire passe l’[analyseur de scripts Expect](/tools/expect-script-explainer) sans erreur ni avertissement, et la page exécute l’analyseur sur le script au fur et à mesure que vous le construisez. Les vecteurs de référence (golden vectors) de l’outil vérifient cette promesse pour chaque classe de combinaisons de choix, soit plus de deux mille. Les remarques que l’analyseur peut encore afficher sont délibérées : E5 sur l’Espace unique qui répond à une invite `--More--`, et E12 sur un script qui n’écrit que dans un fichier journal.

## Secrets : jamais dans le script

- **Une clé ssh.** ssh s’exécute avec `BatchMode=yes`, qui, selon ssh_config(5), désactive toute interaction avec l’utilisateur, comme les demandes de mot de passe et de confirmation de clé d’hôte (« user interaction such as password prompts and host key confirmation requests »), pour les scripts et autres traitements par lots. La clé doit fonctionner seule : chargez-la dans `ssh-agent`, ou indiquez un fichier de clé (`-i`, avec `IdentitiesOnly=yes` pour que seule cette clé soit proposée).
- **Un mot de passe tiré d’une variable d’environnement.** Le script vérifie que la variable est définie et non vide (code 2 sinon), la copie, puis la retire de l’environnement avec `unset env(NAME)` avant d’établir la connexion, pour que le programme qu’il lance n’en hérite pas.
- **Un mot de passe demandé à l’exécution.** L’idiome d’expect(1) : `stty -echo`, `send_user`, `expect_user -re "(.*)\n"`, `stty echo`, avec ses propres deux minutes pour la saisie (`-timeout 120` dans le bloc) et l’écho réactivé dans tous les cas. Le script a alors besoin d’un terminal.

Rien de secret n’aboutit non plus dans un journal. La connexion s’exécute avec `log_user 0` : un équipement qui renvoie le mot de passe en écho ne peut donc pas l’afficher à l’écran, et le fichier de transcription, quand vous en demandez un, n’est ouvert qu’après la connexion et l’étape enable. Le journal d’Expect enregistre ce que lit `expect_user` même avec l’écho désactivé, et `exp_internal` affiche chaque `send` en entier : le générateur n’ouvre donc jamais de journal avant l’utilisation des secrets et n’active jamais `exp_internal`. Ces deux faits ont été vérifiés avec le véritable `expect` 5.45.4 et sont expliqués dans [Les secrets dans les scripts Expect](/learn/expect-secrets-and-safe-scripts).

ssh reçoit toujours `-o StrictHostKeyChecking=accept-new` : selon ssh_config(5), ssh ajoute alors automatiquement les nouvelles clés d’hôte au fichier known_hosts de l’utilisateur, mais refuse les connexions vers les hôtes dont la clé a changé (« ssh will automatically add new host keys to the user's known_hosts file, but will not permit connections to hosts with changed host keys »). Le générateur n’écrit jamais `no`, qui accepte une clé modifiée.

## Profils d’équipement

Les profils proviennent du module de données de la suite ; chaque valeur a été lue dans la documentation du constructeur le 27 octobre 2026 et est expliquée dans [Expect face aux équipements réseau](/learn/expect-against-network-devices) :

- **Cisco IOS XE :** `terminal length 0` pour la session, `--More--` auquel on répond par Espace, `enable` avec sa question `Password:`.
- **F5 BIG-IP (tmsh) :** `modify /cli preference pager disabled display-threshold 0`, une préférence de l’utilisateur dont la référence n’indique pas la durée, sans valeur documentée à restaurer.
- **Fortinet FortiOS :** par défaut, le script répond à chaque `--More--` par un Espace et `exp_continue`, et la configuration de l’équipement reste telle quelle. Désactiver la pagination est un choix explicite : `config system console`, `set output standard`, `end`, un changement de configuration global que voit la session de chaque administrateur ; le générateur avertit alors et ajoute la restauration documentée (`set output more`), que vous pouvez refuser.
- **Extreme Switch Engine :** `disable cli paging session`, pour la session.
- **Extreme Fabric Engine :** `terminal more disable`, dont la référence n’indique pas la portée, avec `terminal more enable` pour revenir en arrière ; `enable` peut poser des questions que la documentation n’affiche pas, si bien que le générateur ne le propose que sans mot de passe.
- **Générique :** votre propre expression régulière d’invite, et une commande de pagination si vous en avez une.

Chaque expression régulière d’invite est écrite littéralement entre accolades, `-re {...}`, pour que Tcl n’y substitue rien.

## Construction du script

- Le délai d’expiration est défini avant le premier `expect` : rien n’attend donc sur la valeur par défaut de 10 secondes.
- Un seul `expect` gère toute la connexion : chaque question (nom d’utilisateur, mot de passe) reçoit une seule réponse, une seconde question signifie un refus et arrête le script avec le code 1, l’invite termine la connexion, et les branches `timeout` et `eof` arrêtent le script avec un message.
- Chaque bloc entre accolades commence par un saut de ligne après l’accolade. Expect 5.45.4 ne lit un argument entre accolades comme une suite de motifs et de corps que dans ce cas ; écrit sur une seule ligne, le bloc serait un motif unique (la règle E19 de l’analyseur).
- `run_command` envoie une ligne terminée par `\r` et attend l’invite. Un motif qui correspond à n’importe quelle fin de ligne, avec `exp_continue`, relance le temporisateur à chaque ligne : le délai d’expiration de commande mesure donc le silence plutôt que la durée totale de la commande, et une longue sortie n’expire pas tant qu’elle continue d’arriver.
- Quand le script répond au pager, le motif s’écrit `-ex "--More--"`, car `expect` lit tout mot commençant par `-` comme une option (la règle E20 de l’analyseur).
- La fin est la commande de déconnexion suivie de `expect eof`, ou un `close` si vous ne donnez pas de commande de déconnexion, puis `wait`, pour que le processus soit récupéré.

Codes de sortie : 0 terminé ; 1 échec de la connexion ; 2 saisie manquante ou incorrecte ; 3 une commande ne s’est pas terminée ; 4 la session s’est fermée prématurément.

## Contrôles de la saisie

- Uniquement des noms d’hôte et des adresses (sans trait d’union initial, pour qu’une valeur ne puisse jamais atteindre ssh comme option) ; quand l’hôte est pris sur la ligne de commande, le script contrôle l’argument de la même façon à l’exécution.
- Un port uniquement pour ssh (`-p`) ; pour telnet sur un autre port, utilisez Autre programme.
- Des fichiers de clé et des fichiers journaux sous forme de chemins simples, sans espace, sans `~` ni caractère que Tcl substituerait ; la ligne de commande d’un programme sous forme de mots séparés par des espaces, dont aucun ne contient `~` ou un tel caractère, et dont le nom du programme ne commence pas par un trait d’union.
- Des commandes en texte brut, 40 au plus, de 300 caractères chacune au plus ; chaque `\`, `"`, `$`, `[`, `]`, `{` et `}` est protégé par une barre oblique inverse pour que l’équipement reçoive la commande telle que saisie.
- Des délais d’expiration de 1 à 3600 secondes, jamais `-1`.
- Une expression régulière d’invite générique aux accolades équilibrées, et jamais une expression qui correspond immédiatement (`.*`, `^`, `$`).

Une commande qui pose une question ne reçoit pas de réponse : le script s’arrête avec le code 3 une fois le délai d’expiration de commande écoulé. Quand une commande commence comme l’une des confirmations documentées du profil (`reload`, `save configuration`, `reboot`, `reset`, `execute restore`), le générateur le signale.

## Limites

- Le générateur écrit le script ; il ne l’exécute jamais. Exécutez-le d’abord sur un équipement de lab.
- Il attend le motif d’invite du profil. Une ligne de bannière ou une ligne de commande qui se termine elle-même par `>` ou `#` et qui arrive dans un fragment séparé peut être prise pour l’invite ; [l’article sur les équipements réseau](/learn/expect-against-network-devices) traite des motifs d’invite.
- Les commentaires et les messages du script sont en anglais, comme les commandes elles-mêmes.
- Il ne répond pas aux confirmations, ne gère pas plusieurs équipements dans un même script et ne sépare pas la sortie de chaque commande ; modifiez le script pour cela, puis vérifiez-le de nouveau avec l’[analyseur](/tools/expect-script-explainer).

## Outils et lectures associés

- **Ce que collecte le script.** Quand il s’agit de configuration, l’analyseur de la plateforme la lit : l’[analyseur de configuration tmsh](/tools/f5-tmsh-config-explainer), l’[analyseur de configuration CLI FortiOS](/tools/fortios-cli-config-explainer) et l’[analyseur de configuration ExtremeXOS](/tools/exos-config-explainer).
- **Pourquoi le script est écrit ainsi.** Les règles de citation de Tcl, qui décident de ce qui atteint l’équipement, sont dans [Tcl pour les auteurs de scripts Expect](/learn/tcl-for-expect-writers) ; le temporisateur que relance `exp_continue` dans `run_command`, dans [Délais d’expiration, eof et boucles dans Expect](/learn/expect-timeouts-eof-and-loops) ; et ce qu’Expect écrit dans un journal, dans [Débogage d’Expect](/learn/expect-debugging-and-logging).

## Partage des résultats

Sous le script, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, le formulaire, jamais le script : chaque choix (transport, connexion, profil d’équipement, enable, pagination, sortie, les options à cocher et les deux délais d’expiration) et chaque champ de texte que le formulaire affiche pour ces choix. La page écrit le même script à partir du même formulaire, à l’octet près. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas. Le générateur ne prend jamais de mot de passe : il le lit dans une variable d’environnement, dont le nom est le seul champ, ou le demande à l’exécution. Le formulaire nomme tout de même votre hôte, votre utilisateur et vos commandes : la fenêtre contextuelle vous demande donc de les relire avant d’envoyer le lien. Avant qu’un lien soit proposé, le texte est examiné à la recherche d’identifiants définis par une norme : une clé privée PEM, une ligne `Authorization` ou `Proxy-Authorization` avec n’importe quel schéma ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sections 11.6.2 et 11.7.2 : la valeur se compose d’identifiants, « consists of credentials »), une ligne `Cookie` ou `Set-Cookie` avec une valeur ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sections 4.1.1 et 4.2.1), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1), un mot de passe dans une URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1 : la forme « user:password » est déconseillée, « is deprecated »), un ID de clé d’accès AWS ou une valeur FortiOS `ENC` ; toutes consultées le 01/11/2026. Si l’un d’eux est présent, pas de lien : la fenêtre contextuelle nomme le champ, vous le remplacez par une valeur fictive et vous appuyez de nouveau. Une valeur dont seul le nom évoque un secret (`username admin secret ...` dans une commande, `set password ...`) ne bloque pas le lien ; la fenêtre contextuelle nomme la première pour que vous puissiez la vérifier.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Ouverture d’un lien.** Le formulaire est réglé comme vous le feriez vous-même, les champs que le lien ne contient pas restant à leur valeur par défaut, et la page construit le script. Chaque choix doit faire partie de ceux que la page propose, et aucun champ masqué ne doit être présent ; sinon, le lien est ignoré. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.

## Sources

- [expect(1), Expect 5.45.4 manual source, core.tcl-lang.org](https://core.tcl-lang.org/expect/raw?name=expect.man&ci=expect-5-45-4) (consulté le 27/10/2026)
- [expect.c, Expect 5.45.4: how expect reads its arguments](https://core.tcl-lang.org/expect/raw?name=expect.c&ci=expect-5-45-4) (consulté le 27/10/2026)
- [OpenSSH ssh(1)](https://man.openbsd.org/ssh.1) (consulté le 27/10/2026)
- [OpenSSH ssh_config(5): StrictHostKeyChecking, BatchMode, IdentitiesOnly](https://man.openbsd.org/ssh_config.5) (consulté le 27/10/2026)
- [RFC 854, Telnet Protocol Specification](https://www.rfc-editor.org/rfc/rfc854) (consultée le 27/10/2026)
- La documentation des constructeurs pour les profils d’équipement, recensée avec ses dates dans [Expect face aux équipements réseau](/learn/expect-against-network-devices) (consultée le 27/10/2026)
