## Ce que fait l’outil

Collez du code, une configuration ou une sortie de terminal et obtenez-en une image pour une diapositive, un ticket ou un document : un SVG qui conserve le code sous forme de vrai texte sélectionnable, et un PNG en 1x ou en 2x, avec un texte alternatif prêt à coller à côté. Vous choisissez le langage pour la coloration, une palette sombre ou claire, la taille de police, les taquets de tabulation, les numéros de ligne, un cadre façon fenêtre avec un titre facultatif, la marge intérieure et les lignes à mettre en évidence.

Avant toute création d’image, un contrôle des secrets recherche les valeurs que vous ne souhaitez peut-être pas publier, comme des clés privées, des en-têtes Authorization, des ID de clé d’accès AWS, des JWT, des mots de passe dans des URL, des valeurs FortiOS `ENC` et des attributs de mot de passe ou de secret. Chaque constat est listé et masqué dans l’image, sauf si vous le décochez. Tout s’exécute dans votre navigateur.

Là où le support dans lequel vous écrivez peut afficher du texte, préférez le texte. Le critère de succès 1.4.5 (Images of Text) des [WCAG 2.2](https://www.w3.org/TR/WCAG22/) demande du texte plutôt que des images de texte chaque fois que la technologie peut le présenter ; un bloc de code délimité dans un wiki, une base de connaissances ou un outil de ticketing qui sait l’afficher, c’est du texte, et la personne qui le lit peut le copier. Cet outil est fait pour les supports qui ne peuvent pas l’afficher, et le texte alternatif qu’il rédige est le code lui-même. [Du code sur les diapositives et dans les tickets](/learn/code-on-slides-and-in-tickets) détaille ce choix, le texte alternatif, le contraste et les secrets que conserve une capture d’écran.

## Langages

Coloration uniquement : rien n’est analysé, validé ni exécuté, et un code qui n’est pas valide dans le langage choisi est tout de même dessiné, coloré aussi loin que portent les règles ci-dessous. Les règles de chaque langage viennent de sa propre référence, consultée le 27 octobre 2026.

| Langage | Ce qui est coloré | Référence |
|---|---|---|
| Texte brut | Rien | |
| Shell (POSIX sh) | les commentaires `#`, seulement là où un mot pourrait commencer (`a#b` n’en est donc pas un) ; les guillemets simples, doubles et dollar-simples ; `$name`, `${...}`, `$1`, `$@` et les autres paramètres spéciaux, actifs entre guillemets doubles ; les mots réservés `if then else elif fi do done case esac while until for in` là où ils sont réservés ; le nom d’une affectation comme `LOG=...` ; les mots composés de nombres entiers | [POSIX.1-2024 Shell Command Language](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/V3_chap02.html), sections 2.2 à 2.6 |
| Python | les commentaires `#` ; les chaînes avec tous les préfixes (`b`, `r`, `u`, `f`, `t` et les combinaisons avec `r`, en majuscules comme en minuscules), les chaînes entre triples guillemets sur plusieurs lignes ; les 35 mots-clés ; les mots-clés contextuels `match`, `case`, `type` et `lazy` quand ils ouvrent une instruction ; les littéraux entiers, flottants et imaginaires avec tirets bas et `0x`, `0o`, `0b` | [Python 3.15 Lexical analysis](https://docs.python.org/3/reference/lexical_analysis.html), la version de correctifs en cours (fin de vie 2031-10, [Status of Python versions](https://devguide.python.org/versions/)) |
| JSON | les noms de membres (une chaîne suivie de `:`) comme clés ; les chaînes ; les nombres ; `true`, `false`, `null`. JSON n’a pas de commentaires : `//` n’est donc pas coloré | [RFC 8259](https://www.rfc-editor.org/rfc/rfc8259) |
| YAML | les commentaires `#` après un espace ; les directives `%` ; `---` et `...` ; les clés de mapping ; les scalaires entre guillemets doubles et simples, y compris sur plusieurs lignes ; les ancres, alias et tags ; les null, booléens, entiers et flottants du schéma core ; le contenu des scalaires de bloc `\|` et `>` | [YAML 1.2.2](https://yaml.org/spec/1.2.2/), sections 5.3, 6.6, 6.8, 6.9, 7.3, 8.1, 9.1.2 et 10.3.2 |
| Tcl, iRules, Expect | les commentaires `#`, seulement là où une commande commence (`;#` après une commande en est donc un) ; les mots entre guillemets doubles avec `$` et `[...]` actifs ; `$name`, `${name}`, `$name(index)` ; le premier mot d’une commande quand c’est une commande intégrée de Tcl, `when` ou une commande Expect ; `then`, `elseif`, `else` ; les nombres tels que les lit `expr` ; le nom d’évènement après `when`. Les mots entre accolades sont colorés comme des scripts, car les corps de `proc`, `if`, `when` et `expect` sont des scripts | [Tcl 9.0 Tcl(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/Tcl.html), [expr(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/expr.html), [if(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/if.html) ; les iRules sont [fondées sur Tcl](https://clouddocs.f5.com/api/irules/WhatIsAnIRule.html) et commencent par [`when`](https://clouddocs.f5.com/api/irules/when.html) ; les commandes d’Expect viennent d’[expect(1)](https://www.tcl-lang.org/man/expect5.31/expect.1.html) |
| F5 tmsh | les invites ; les commentaires `#` en début de mot ; les chaînes entre guillemets ; les commandes et les modules racines (`auth cli gtm ltm net sys wom`) hors accolades ; les noms d’attributs en début de ligne à l’intérieur d’un objet ; les adresses et les nombres | [TMSH Reference v17](https://clouddocs.f5.com/cli/tmsh-reference/latest/general/tmsh.html) et ses [commandes](https://clouddocs.f5.com/cli/tmsh-reference/latest/commands/index.html) |
| CLI FortiOS | les invites ; une ligne qui commence par `#` et qui n’est pas une invite (comme la première ligne d’une sauvegarde) ; les chaînes entre guillemets simples et doubles avec `\'`, `\"` et `\\` ; `config`, `edit`, `set`, `unset`, `next`, `end` et les autres commandes ; le nom de champ après `set` ; `ENC` ; `$USERFROM`, `$USERNAME`, `$SerialNum` ; les adresses et les nombres | [FortiOS 7.6.8 CLI basics](https://docs.fortinet.com/document/fortigate/7.6.8/administration-guide/896276/cli-basics), [Command syntax](https://docs.fortinet.com/document/fortigate/7.6.8/administration-guide/508024/command-syntax), [Subcommands](https://docs.fortinet.com/document/fortigate/7.6.8/administration-guide/627485/subcommands) |
| CLI de type Cisco | les invites (`Router>`, `Router#`, `Router(config)#`, `Router(config-if)#`, suivies ou non d’un espace) ; les commentaires `!` ; `no` et `default` et quelques commandes documentées en début de ligne ; les adresses, les masques et les nombres. La CLI de Cisco n’a pas de règle générale de mise entre guillemets : rien n’est donc coloré comme une chaîne | [IOS XE 17.x Managing Configuration Files](https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/syst-mgmt/b-system-management/m_cm-config-files-0.html) (« Precede a comment with an exclamation point »), [Using the Cisco IOS Command-Line Interface](https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/syst-mgmt/b-system-management/m_cf-cli-basics.html), [Catalyst 8400: Using Cisco IOS XE Software](https://www.cisco.com/c/en/us/td/docs/routers/c8400/c8400-software-config-guide/Using-Cisco-IOS-XE-software.html) |

Ce que les coloriseurs ne font pas : les here-documents du shell, les substitutions de commandes imbriquées entre guillemets doubles, les champs de remplacement des f-strings Python (toute la f-string est colorée comme une chaîne), les scalaires flow YAML sur plusieurs lignes, et tout ce qui exige un analyseur syntaxique plutôt qu’un simple lexeur.

### Sessions de terminal

Pour le shell, Python et Tcl, un texte dont une ligne au moins commence par l’invite de ce langage est lu comme une session. Les invites sont `$ ` (la valeur par défaut de `PS1` dans POSIX) et l’invite bash de BIG-IP `[root@bigip-1:Active:Standalone] config # ` pour le shell, `>>> ` et `... ` (`sys.ps1` et `sys.ps2` de Python) pour Python, et `% ` (tclsh) pour Tcl. Les lignes avec une invite sont colorées comme des commandes, rattachées à la ligne d’invite suivante pour qu’une chaîne puisse se poursuivre, et les lignes sans invite sont la sortie des commandes, laissée sans couleur : une apostrophe dans la sortie n’ouvre donc aucune chaîne. La page indique quand elle a lu le texte de cette façon.

Pour tmsh, FortiOS et la CLI de type Cisco, les invites sont colorées et chaque ligne est colorée, car leur sortie est généralement de la configuration.

## Le contrôle des secrets

Il s’exécute sur le texte quel que soit le langage choisi, avant que quoi que ce soit ne soit dessiné. Chaque règle est tirée de la documentation du format qu’elle recherche :

| Règle | Ce qu’elle recherche | Ce qui est masqué | Source |
|---|---|---|---|
| Clé privée PEM | un bloc `-----BEGIN ... PRIVATE KEY-----` : `PRIVATE KEY`, `ENCRYPTED PRIVATE KEY`, le format traditionnel `RSA PRIVATE KEY` d’OpenSSL (avec les en-têtes `Proc-Type` et `DEK-Info`) et `OPENSSH PRIVATE KEY` ; aussi un bloc écrit sur une seule ligne avec des séquences d’échappement `\n` | chaque ligne entre les délimiteurs (les lignes de délimitation restent) ; sans ligne END, les lignes qui ressemblent à du base64 | [RFC 7468](https://www.rfc-editor.org/rfc/rfc7468) sections 2, 3, 10, 11 ; [OpenSSL 3.5 PEM_read_bio_PrivateKey](https://docs.openssl.org/3.5/man3/PEM_read_bio_PrivateKey/) ; [OpenSSH sshkey.c](https://github.com/openssh/openssh-portable/blob/master/sshkey.c) |
| En-tête Authorization | `Authorization:` ou `Proxy-Authorization:` avec `Bearer` ou `Basic`, quelle que soit la casse | les identifiants | [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) 5.1, 11.1, 11.4, 11.6.2 ; [RFC 6750](https://www.rfc-editor.org/rfc/rfc6750) 2.1 ; [RFC 7617](https://www.rfc-editor.org/rfc/rfc7617) 2 |
| ID de clé d’accès AWS | `AKIA` (clé d’accès) ou `ASIA` (clé STS temporaire) suivi de 16 lettres majuscules ou chiffres, hors d’un mot plus long | l’ID | [IAM identifiers](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_identifiers.html) ; [access keys](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html) |
| JWT | trois (JWS) ou cinq (JWE) segments base64url reliés par des points, dont le premier se décode en un objet JSON contenant `alg` | le jeton | [RFC 7515](https://www.rfc-editor.org/rfc/rfc7515) 2, 4.1.1, 7.1 ; [RFC 7516](https://www.rfc-editor.org/rfc/rfc7516) 4.1.1, 7.1 ; [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519) 1 |
| Mot de passe dans une URL | `scheme://user:password@` | le mot de passe | [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) 3.2.1 |
| Valeur chiffrée FortiOS | `set <field> ENC <value>` | la valeur | [Astuce technique Fortinet](https://community.fortinet.com/fortigate-3/technical-tip-command-fail-while-copying-the-preshare-key-from-another-configuration-214348) (`set psksecret ENC ...`) |
| Commande set | `set <name> <value>` avec un nom évoquant un secret : champs FortiOS et variables Tcl (scripts Expect, iRules) | la valeur, à l’intérieur de ses guillemets ou de ses accolades | [FortiOS Subcommands](https://docs.fortinet.com/document/fortigate/7.6.8/administration-guide/627485/subcommands) ; [Tcl set(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/set.html) |
| Attribut password, passphrase ou secret | tmsh `password`, `passphrase`, `encrypted-password`, `proxy-ca-passphrase` ; Cisco `password` et `secret` avec un chiffre de type facultatif | la valeur | tmsh [auth user](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/auth/auth_user.html), [sys file ssl-key](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/sys/sys_file_ssl-key.html), [ltm profile client-ssl](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_profile_client-ssl.html), [ltm monitor http](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_monitor_http.html) ; [mots de passe Cisco IOS XE 17.18](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-18/configuration_guide/sec/b_1718_sec_9300_cg/controlling_switch_access_with_passwords_and_privilege_levels.html) |
| Membre JSON | `"name": "value"` avec un nom évoquant un secret | la valeur | [RFC 8259](https://www.rfc-editor.org/rfc/rfc8259) 4, 7 ; [RFC 6749](https://www.rfc-editor.org/rfc/rfc6749) 5.1 (`access_token`, `refresh_token`) |
| Clé YAML | `name: value`, en style bloc ou flow, avec un nom évoquant un secret | la valeur | [YAML 1.2.2](https://yaml.org/spec/1.2.2/) 7.3, 7.4, 8.2.2 |
| Affectation shell | `NAME=value` avec un nom évoquant un secret, y compris dans la chaîne de requête d’une URL | la valeur | [POSIX](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/V3_chap02.html) 2.10.2 ; le [fichier d’identifiants de l’AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html) a la même forme |
| Affectation | `name = "string"` (Python, et fichiers de type TOML ou INI) avec un nom évoquant un secret | le contenu de la chaîne | [Python 3.15 assignment statements](https://docs.python.org/3/reference/simple_stmts.html) |

**Un nom évoquant un secret** relève d’une règle propre à cet outil, pas d’une norme : le dernier mot du nom (découpé aux tirets bas, aux traits d’union, aux points et au camelCase) est password, passwd, pass, passphrase, secret, token, psk, psksecret, apikey, accesskey, secretkey, privatekey, credential ou credentials, ou bien le nom se termine par key après api, access, private, secret, signing, client, auth, encryption, master ou session. Ainsi, `DB_PASSWORD`, `client_secret`, `refresh_token`, `apiKey` et `aws_secret_access_key` évoquent un secret, alors que `password_file`, `token_type`, `sort_key` et `PWD` (le répertoire de travail du shell) ne l’évoquent pas.

**Non signalés :** une valeur vide ; une valeur fictive ou un réglage (`none`, `null`, `true`, `false`, `enable`, `disable` et autres) ; une référence qui tient lieu de valeur, comme `$VAR`, `${VAR}`, `$(cmd)`, `$env(PW)`, une `[command]` Tcl, `{{ template }}` ou `<placeholder>` ; une valeur déjà masquée par des `*`, des `x` ou des puces ; une valeur sans aucune lettre ni aucun chiffre. Un hachage de type crypt comme `$6$salt$hash` ou le `$9$...` de Cisco n’est pas une référence et il est signalé. Un attribut password, passphrase ou secret situé dans un commentaire n’est pas signalé, car les commentaires emploient ces mots en prose ; toutes les autres règles examinent aussi les commentaires. Quand deux règles trouvent les mêmes caractères, la plus spécifique l’emporte (un JWT dans un en-tête Bearer constitue un seul constat).

**Masquage.** Une valeur masquée est remplacée par huit puces, quelle que soit sa longueur, si bien que l’image ne montre pas sa longueur. Les caractères eux-mêmes sont remplacés, pas recouverts : ils ne figurent ni dans le texte du SVG, ni dans le PNG, ni dans le texte alternatif, où la valeur se lit « [masqué] ». Décochez un constat pour l’afficher tel qu’écrit ; ce choix est mémorisé par règle, ligne et colonne pendant que vous modifiez ailleurs.

**Ce n’est pas un scanner complet.** Il connaît les formats ci-dessus et rien d’autre, il ne sait pas distinguer un vrai secret d’un exemple, et un secret qu’il ne recherche pas reste dans l’image. Relisez l’image avant de la publier.

Les secrets de session dans la sortie d’`openssl s_client` en sont un exemple : aucune règle ne les recherche, si bien qu’une ligne TLS 1.3 `Resumption PSK:` est dessinée telle qu’affichée, et qu’une ligne TLS 1.2 `Master-Key:` n’est masquée que parce qu’elle a la forme d’une clé YAML dont le nom évoque un secret. L’[analyseur openssl s_client](/tools/openssl-s-client-explainer) liste les deux parmi ses constats.

## Fabrication de l’image

Le moteur met l’image en page une seule fois (chaque rectangle, chaque point et chaque segment de texte avec sa position et sa couleur), et les deux fichiers proviennent de cette mise en page : ils ne peuvent donc pas diverger.

- **Police et grille.** JetBrains Mono, la police à chasse fixe du site, sous [SIL Open Font License 1.1](https://openfontlicense.org/open-font-license-official-text/). Ses métriques, lues dans le fichier de la police : 1000 unités par em, chaque caractère large de 600 unités, jambage supérieur 1020, jambage inférieur 300. Une colonne vaut 0,6 fois la taille de police, une ligne vaut 1,5 fois la taille de police arrondie au pixel entier, et le texte se place au milieu de sa ligne. Une colonne par point de code : les tabulations s’étendent jusqu’aux taquets que vous choisissez, et les caractères plus larges dans certaines polices (de nombreux caractères d’Asie de l’Est et les emoji) occupent tout de même une colonne, si bien qu’ils peuvent chevaucher leur voisin.
- **Le SVG** conserve chaque ligne sous forme d’un élément `<text>` de vrai texte, coloré par des éléments `<tspan>`, et donne à chaque caractère sa propre position x : [SVG 2](https://www.w3.org/TR/SVG2/text.html) applique la n-ième valeur x au n-ième caractère, compté en points de code, si bien que les colonnes tiennent même avec une police de repli. Il nomme la police (`'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, 'DejaVu Sans Mono', 'Liberation Mono', monospace`) sans l’intégrer ; là où JetBrains Mono n’est pas installée, la police à chasse fixe de la visionneuse dessine les mêmes colonnes. Les espaces sont conservés (`xml:space="preserve"` et `white-space: pre`), les ligatures de programmation sont désactivées, le document a un `<title>` contenant la description et `role="img"`, et les numéros de ligne sont des éléments distincts, pour qu’une sélection du code ne les emporte pas. Les caractères qu’un document XML ne peut pas contenir ([XML 1.0](https://www.w3.org/TR/xml/), production [2] : les caractères de contrôle autres que la tabulation et le saut de ligne, les surrogates isolés, U+FFFE et U+FFFF) sont d’abord remplacés par U+FFFD.
- **Le PNG** est dessiné sur un canvas dans votre navigateur à 1x ou 2x les pixels CSS, caractère par caractère sur la même grille, avec la copie de JetBrains Mono propre à la page. Les très grandes images peuvent dépasser la taille de canvas qu’autorise un navigateur ; la page le signale alors, et le SVG fonctionne toujours.
- **La copie du PNG** utilise `ClipboardItem` là où le navigateur le prend en charge ; `image/png` fait partie des types de données que l’[API Clipboard](https://www.w3.org/TR/clipboard-apis/) impose pour l’écriture.

Rien n’est chargé depuis ni envoyé vers où que ce soit. L’aperçu est un SVG en ligne construit à partir de la mise en page, et les téléchargements sont des fichiers produits dans la page.

## Palettes et contraste

Les deux palettes sont mesurées avec les formules des WCAG 2.2 elles-mêmes (luminance relative avec le seuil de 0,04045, rapport de contraste (L1 + 0,05) / (L2 + 0,05)). Chaque couleur de texte, les numéros de ligne et le titre de la fenêtre atteignent le 4,5:1 du critère de succès 1.4.3 sur chaque fond où ils peuvent se trouver : le fond du code et la bande de la ligne en surbrillance (le titre, sur la barre de titre). Le repère à gauche d’une ligne en surbrillance est un objet graphique et atteint le 3:1 du critère 1.4.11. Les trois points de la fenêtre sont décoratifs. Les rapports sont arrondis à l’inférieur, si bien qu’un succès n’est jamais obtenu par arrondi.

| Texte | Clair : sur le fond `#ffffff` | Clair : sur la surbrillance `#fff3c4` | Sombre : sur le fond `#11151c` | Sombre : sur la surbrillance `#26303d` |
|---|---|---|---|---|
| Texte normal | `#1f2328` 15,79 | 14,19 | `#e6e9ef` 15,04 | 10,97 |
| Commentaire | `#57606a` 6,38 | 5,74 | `#9ba6b2` 7,39 | 5,39 |
| Chaîne | `#0a6629` 7,12 | 6,40 | `#9ddba0` 11,38 | 8,31 |
| Nombre | `#0550ae` 7,59 | 6,82 | `#8fc6ff` 10,18 | 7,43 |
| Mot-clé | `#a40e26` 7,86 | 7,06 | `#ff9c94` 9,09 | 6,63 |
| Variable | `#8a4600` 7,10 | 6,38 | `#f6bd84` 10,91 | 7,96 |
| Invite | `#0b6874` 6,46 | 5,81 | `#7fd8d0` 11,00 | 8,03 |
| Clé | `#6639ba` 7,34 | 6,59 | `#c9b0ff` 9,70 | 7,08 |
| Valeur masquée | `#9c1c6f` 7,47 | 6,71 | `#ff8fd0` 8,79 | 6,41 |
| Numéro de ligne | `#5f6872` 5,66 | 5,08 | `#97a1ad` 6,98 | 5,09 |

Titre de la fenêtre sur la barre de titre : clair `#3a424a` sur `#eceff3`, 8,84 ; sombre `#c3cbd4` sur `#1d232c`, 9,64. Repère de surbrillance (3:1 exigé) : clair `#9a6700`, 4,86 sur le fond et 4,37 sur la surbrillance ; sombre `#e3b341`, 9,40 et 6,86.

## Texte alternatif

Le texte alternatif se compose d’une description d’une ligne (le nombre de lignes, le langage, le nombre de valeurs masquées), d’une ligne vide, puis du code en texte brut, chaque valeur masquée y étant écrite « [masqué] ». Cela suit le critère de succès 1.1.1 (Non-text Content) : l’équivalent textuel d’une image de code remplit la même fonction quand il est le code lui-même. Si le texte alternatif devient long, placez le code sous forme de texte à côté de l’image (sur une diapositive, dans les notes du présentateur) et ne gardez que la description comme texte alternatif.

## Options

- **Langage** : le coloriseur (voir le tableau ci-dessus).
- **Palette** : sombre (par défaut) ou claire.
- **Taille de police** : 12, 14, 16 (par défaut), 18, 20, 24 ou 28 pixels CSS.
- **Taquets de tabulation** : toutes les 2, 4 (par défaut) ou 8 colonnes.
- **Marge intérieure** : 16, 32 (par défaut), 48 ou 64 pixels CSS autour de la fenêtre, ou autour du code sans cadre.
- **Numéros de ligne** : activés par défaut.
- **Cadre de fenêtre** : activé par défaut, avec trois points décoratifs et un titre facultatif de 80 caractères au plus.
- **Lignes à mettre en évidence** : des numéros et des plages séparés par des virgules ou des espaces, comme `3, 5-7`. Un élément qui n’est ni un numéro ni une plage, un zéro ou une plage à l’envers est ignoré, et une plage qui dépasse la dernière ligne est conservée jusqu’à la dernière ligne ; la page liste ce qu’elle a ignoré.

## Limites et modifications apportées

L’outil refuse, en indiquant la raison, un texte de plus de 50 000 caractères, plus de 400 lignes, une ligne de plus de 400 colonnes une fois les tabulations étendues, un titre de plus de 80 caractères et une liste de lignes à mettre en évidence de plus de 200 caractères. Ces limites gardent l’image dans ce qu’une diapositive ou un ticket peut accueillir, et dans ce que les navigateurs peuvent dessiner.

Il vous signale quand il a supprimé un indicateur d’ordre des octets (BOM), lu des retours chariot comme des sauts de ligne, remplacé des caractères que XML ne peut pas contenir, étendu des tabulations, supprimé des espaces en fin de ligne (ils ne feraient qu’élargir l’image) ou lu le texte comme une session de terminal. Un saut de ligne final ne produit pas de ligne supplémentaire.

## Exemple commenté

Le bouton Exemple charge une phase 1 IPsec FortiOS dont la clé prépartagée est sous la forme chiffrée `ENC`, écrite pour cet exemple (le base64 de « for-demo-only-not-a-real-key »), avec l’adresse de documentation 203.0.113.10 de la [RFC 5737](https://www.rfc-editor.org/rfc/rfc5737) :

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

Le contrôle des secrets signale un constat, « Valeur chiffrée FortiOS (ENC), ligne 7, colonne 27 », et l’image affiche `set psksecret ENC ••••••••` à la ligne 7, que l’Exemple met aussi en évidence, sous le titre « VPN to branch 01 » (VPN : Virtual Private Network, réseau privé virtuel). Le SVG mesure 451,2 sur 348 pixels CSS dans la palette sombre, et le texte alternatif commence par « Image de code : 9 lignes de CLI FortiOS, 1 valeur masquée ».

## Partage des résultats

Sous les boutons d’export, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient trois éléments après le `#` : le texte tel que l’image le montre, chaque valeur masquée par le contrôle des secrets étant remplacée par les mêmes huit puces, le langage de coloration et la palette. Le titre de la fenêtre (du texte libre que le contrôle des secrets ne lit pas), les lignes en surbrillance, la taille de police, la marge intérieure, les taquets de tabulation et les deux interrupteurs ne sont pas transmis. Une valeur que vous avez décochée figure dans le lien telle que vous l’avez saisie, et la fenêtre contextuelle nomme chacune de ces valeurs par sa ligne et son libellé avant que vous ne copiiez quoi que ce soit ; quand rien n’est décoché, elle indique que toutes les valeurs trouvées sont masquées. La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : le texte n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre.

- **Longueur.** 16 384 caractères de texte au plus, la limite que le site applique à toute valeur placée après le `#` ; un texte plus long n’obtient pas de lien, et la fenêtre contextuelle le signale.
- **Ouverture d’un lien.** Le texte remplit la zone comme lors d’un collage, le langage et la palette sont appliqués, et l’image est dessinée ; les autres choix de la page qui reçoit le lien restent tels quels. Une valeur masquée arrive sous forme de huit puces : sur certaines lignes, le contrôle des secrets les retrouve et les masque de nouveau, sur d’autres, il les dessine comme des caractères ordinaires, si bien que la description peut compter moins de valeurs masquées, mais aucune valeur n’est là pour être révélée. Un langage ou une palette que l’outil ne propose pas fait ignorer tout le lien. Dans les deux cas, les valeurs quittent aussitôt l’adresse de la page, sans aucune requête.

## Provenance

Le comportement est figé par le jeu de vecteurs de référence `code-to-image-golden-2026-10-27b` : la coloration de chaque langage (texte brut, script et session shell, script et session Python, JSON, YAML, une iRule, un script Expect, une session tclsh, tmsh, FortiOS, type Cisco), trois documents SVG octet par octet avec leur texte alternatif (chacun vérifié comme XML bien formé et pour une position x par caractère), chaque règle du contrôle des secrets en cas positif et négatif avec les caractères exacts masqués (et dont l’absence est vérifiée dans le SVG et le texte alternatif quand ils sont masqués), chaque limite à sa valeur et au-delà, la normalisation, les remarques, l’analyseur des lignes à mettre en évidence, et chaque rapport de contraste ci-dessus, dont la luminance est aussi comparée à celle de l’[outil de contraste des couleurs](/tools/color-contrast-format) du site, ainsi que le texte que transporte un lien Partager les résultats pour sept saisies, octet par octet, avec la vérification que la page qui le reçoit dessine les mêmes caractères et qu’aucune valeur masquée ne figure dans le lien.

## API

Non exposé par l’API, délibérément. Le PNG est dessiné par le navigateur de la personne qui l’utilise, et la saisie est le genre de texte qui contient des secrets : configurations, captures et scripts sont précisément ce pour quoi le contrôle des secrets existe, et l’endroit sûr pour les vérifier est la machine où ils se trouvent déjà. Les envoyer à un serveur pour vérification irait à l’encontre de la vérification elle-même.

## Sources

Toutes consultées le 27/10/2026.

- [The Open Group Base Specifications Issue 8 (POSIX.1-2024), Shell Command Language](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/V3_chap02.html)
- [Python 3.15 : Lexical analysis](https://docs.python.org/3/reference/lexical_analysis.html), [sys.ps1 et sys.ps2](https://docs.python.org/3/library/sys.html), [assignment statements](https://docs.python.org/3/reference/simple_stmts.html), [Status of Python versions](https://devguide.python.org/versions/)
- [RFC 8259, JSON](https://www.rfc-editor.org/rfc/rfc8259)
- [YAML 1.2.2](https://yaml.org/spec/1.2.2/)
- [Tcl 9.0 : Tcl(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/Tcl.html), [expr(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/expr.html), [if(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/if.html), [set(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/set.html), [tclsh(1)](https://www.tcl-lang.org/man/tcl9.0/UserCmd/tclsh.html), [l’index des commandes](https://www.tcl-lang.org/man/tcl9.0/TclCmd/index.html), [les versions publiées](https://www.tcl-lang.org/software/tcltk/)
- [F5 iRules : What Is An iRule](https://clouddocs.f5.com/api/irules/WhatIsAnIRule.html) et [when](https://clouddocs.f5.com/api/irules/when.html) ; [expect(1)](https://www.tcl-lang.org/man/expect5.31/expect.1.html)
- [F5 TMSH Reference v17](https://clouddocs.f5.com/cli/tmsh-reference/latest/) (tmsh, l’index des commandes, le PDF 17.0.0, auth user, sys file ssl-key, ltm profile client-ssl, ltm monitor http). La politique de support logiciel de F5, [K5903](https://my.f5.com/manage/s/article/K5903) (consulté le 27/10/2026), donne aux versions Long-Term Stability 17.x un Standard Support jusqu’au 31 mars 2027 (17.1.x) et jusqu’au 1er janvier 2029 (17.5.x).
- [FortiOS 7.6.8 Administration Guide](https://docs.fortinet.com/document/fortigate/7.6.8/administration-guide/896276/cli-basics) (CLI basics, Command syntax, Subcommands, Trusted platform module support), [CLI Reference : config system admin](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/390485493/config-system-admin), les astuces techniques Fortinet sur [la copie d’une clé prépartagée](https://community.fortinet.com/fortigate-3/technical-tip-command-fail-while-copying-the-preshare-key-from-another-configuration-214348) et sur [la fin du support de FortiOS 7.4 et 7.6](https://community.fortinet.com/fortigate-3/technical-tip-fortios-end-of-support-change-for-fortios-v7-4-and-v7-6-224876) (7.6 : fin du support d’ingénierie le 25 juillet 2028, fin du support le 25 janvier 2030)
- Cisco IOS XE 17.x System Management Configuration Guide : [Managing Configuration Files](https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/syst-mgmt/b-system-management/m_cm-config-files-0.html) et [Using the Cisco IOS Command-Line Interface](https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/syst-mgmt/b-system-management/m_cf-cli-basics.html) ; [Catalyst 8400: Using Cisco IOS XE Software](https://www.cisco.com/c/en/us/td/docs/routers/c8400/c8400-software-config-guide/Using-Cisco-IOS-XE-software.html) ; [mots de passe IOS XE 17.18](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-18/configuration_guide/sec/b_1718_sec_9300_cg/controlling_switch_access_with_passwords_and_privilege_levels.html) ; [la déclaration de cycle de vie des logiciels IOS XE](https://www.cisco.com/c/en/us/products/collateral/ios-nx-os-software/ios-xe-26/bulletin-c25-2378701.html)
- [RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), [OpenSSL 3.5 PEM_read_bio_PrivateKey](https://docs.openssl.org/3.5/man3/PEM_read_bio_PrivateKey/) (3.5 est la version à support long terme d’OpenSSL, prise en charge jusqu’au 8 avril 2030 selon sa [stratégie de versions](https://openssl-library.org/policies/releasestrat/)), [OpenSSH sshkey.c](https://github.com/openssh/openssh-portable/blob/master/sshkey.c)
- [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), [RFC 6750](https://www.rfc-editor.org/rfc/rfc6750), [RFC 7617](https://www.rfc-editor.org/rfc/rfc7617), [RFC 6749](https://www.rfc-editor.org/rfc/rfc6749)
- AWS : [IAM identifiers](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_identifiers.html), [access keys](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html), [CLI configuration and credential files](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html)
- [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), [RFC 7515](https://www.rfc-editor.org/rfc/rfc7515), [RFC 7516](https://www.rfc-editor.org/rfc/rfc7516), [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), [RFC 5737](https://www.rfc-editor.org/rfc/rfc5737)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [Understanding 1.4.5 Images of Text](https://www.w3.org/WAI/WCAG22/Understanding/images-of-text.html), [Understanding 1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- [SVG 2, Text](https://www.w3.org/TR/SVG2/text.html), [XML 1.0 (Fifth Edition)](https://www.w3.org/TR/xml/), [Clipboard API and events](https://www.w3.org/TR/clipboard-apis/), [Content Security Policy Level 3](https://www.w3.org/TR/CSP3/)
- [SIL Open Font License 1.1](https://openfontlicense.org/open-font-license-official-text/), et le fichier LICENSE du paquet @fontsource/jetbrains-mono 5.2.8 (Copyright 2020 The JetBrains Mono Project Authors)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consulté le 27/10/2026) : section 3.5, le fragment, qui transporte les valeurs d’un lien Partager les résultats
