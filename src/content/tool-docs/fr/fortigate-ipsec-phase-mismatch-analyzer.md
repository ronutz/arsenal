## Ce que fait l’outil

Décrivez les deux extrémités d’un tunnel IPsec : l’outil nomme leurs points de désaccord, puis l’élément qui compte vraiment, **la phase qui échouerait**. Tout s’exécute dans votre navigateur.

## Pourquoi la phase fait tout le diagnostic

La phase 1 authentifie les pairs et protège la négociation. La phase 2 se déroule dans ce canal protégé et négocie les associations de sécurité et les sélecteurs.

C’est ce découpage qui fait que connaître la phase circonscrit immédiatement une panne. Un échec en phase 1 porte sur l’identité ou sur les propositions, et aucune phase 2 n’est jamais tentée : son absence dans les journaux est donc normale, et non un second problème. Un échec en phase 2 signifie que les pairs se sont authentifiés avec succès, *puis* ont été en désaccord sur ce qu’il faut protéger, ce qui désigne les sélecteurs, les transformations ou la PFS, et rien d’autre.

Inverser les deux fait chercher dans la mauvaise moitié de la configuration ; c’est pourquoi l’outil commence par le verdict plutôt que par un tableau champ par champ.

## Les trois faux positifs que l’outil refuse de produire

Un analyseur d’incompatibilités qui signale des configurations saines comme cassées est pire que pas d’analyseur du tout, car plus personne ne le lit. Trois différences ressemblent à des pannes et n’en sont pas :

**Les listes de propositions n’ont pas à être identiques.** FortiOS accepte une liste, et le tunnel monte s’il existe une valeur commune. Comparer `aes256` à `aes128 aes256` et parler d’incompatibilité serait une erreur : l’outil calcule donc l’intersection et considère une valeur partagée comme correcte.

**Les durées de vie n’ont pas à correspondre.** La plus courte l’emporte. L’outil nomme la valeur effective et précise explicitement que ce n’est pas un échec. Des valeurs très différentes signifient seulement des renouvellements de clés à des intervalles malcommodes.

**Les sélecteurs sont en miroir.** Le sous-réseau local d’un pair est le sous-réseau distant de l’autre : comparer local à local signalerait tout tunnel correctement construit. La comparaison est délibérément croisée.

Les constats sont répartis entre désaccords bloquants et différences sans conséquence, et séparés visuellement. Présenter « vos durées de vie diffèrent » avec le même poids que « aucun chiffrement commun », c’est ainsi qu’un résultat devient du bruit.

## Ce que l’outil détecte

Phase 1 : version d’IKE, méthode d’authentification, mode IKEv1, et absence de chiffrement, de hachage ou de groupe DH communs. Le mode n’est comparé que si la version est v1, car signaler main contre aggressive en IKEv2 serait précisément un faux positif du type décrit plus haut.

Phase 2 : absence de transformation commune, PFS activée d’un seul côté, incompatibilité du groupe DH de la PFS quand les deux côtés l’ont activée, et incompatibilités de sélecteurs dans un sens ou dans l’autre.

Le cas de la PFS mérite une mention à part : le message de journal associé à cet échec ne parle généralement pas de PFS, d’où le temps qu’il fait perdre, et tout l’intérêt d’un outil qui le nomme.

## Des sélecteurs exacts, pas approximatifs

`10.1.0.0/16` face à `10.1.0.0/24` est une **incompatibilité**, pas une quasi-correspondance. Les deux côtés doivent s’accorder exactement sur les réseaux que transporte le tunnel. Quand l’un des pairs est un équipement dont la prise en charge des sélecteurs est limitée, les deux extrémités doivent être configurées symétriquement, et non par commodité.

## Ce que l’outil ne vous dira pas

Il compare ce que vous fournissez. Un champ présent d’un côté et absent de l’autre est traité comme *non précisé* plutôt que comme un désaccord, car un collage partiel ne prouve pas une panne.

Il ne diagnostique pas non plus le cas qui fait perdre le plus de temps en pratique : un tunnel qui se déclare **up mais ne fait passer aucun trafic**. Ce n’est pas du tout un problème IPsec : c’est une route manquante ou une politique de pare-feu manquante, et l’outil le dit quand il ne trouve aucun désaccord fatal.

## Partage des résultats

Sous le verdict, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, les deux pairs tels que collés. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

Les noms des pairs et les sous-réseaux protégés décrivent votre réseau (d’où la ligne de mise en garde qu’ajoute la fenêtre contextuelle). La page ne lit aucune clé prépartagée, mais la personne qui décrit un tunnel peut en écrire une sur une ligne `phase1:` ou coller un bloc phase1-interface à côté des directives. Avant qu’un lien soit proposé, la zone est examinée à la recherche d’identifiants définis par FortiOS ou par une norme : une ligne `set` d’un paramètre dont la [référence CLI de FortiOS 7.6.8](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) fait un mot de passe (`psksecret`, `password`, `passwd`, `secret`, `key`, `auth-pwd`, etc. ; consultée le 01/11/2026) ou le `name` d’une communauté SNMP ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), section 3.2.5), toute valeur `ENC` (l’avis [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007) de Fortinet, consulté le 01/11/2026 : publiées là où d’autres peuvent les lire, ces données doivent être considérées comme faciles à déchiffrer, « should currently be considered “easy to decrypt” »), une paire `psksecret=` ou `password=` de mêmes noms sur une ligne de directive, une clé privée PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468)), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)), une ligne `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), section 11.6.2), un mot de passe dans une URL ou un ID de clé d’accès AWS. Si l’un d’eux est présent, pas de lien : la fenêtre contextuelle nomme sa ligne, vous le remplacez par une valeur fictive et vous appuyez de nouveau ; ce que vous partagez est ainsi exactement ce que vous avez choisi (une valeur n’est jamais remplacée à l’intérieur d’une zone collée, ce qui changerait ce qui a été envoyé). Une valeur dont seul le nom évoque un secret n’empêche pas le lien ; la fenêtre contextuelle nomme la première.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** La zone se remplit comme lors d’un collage et la page compare les deux pairs. Rien n’est contacté. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.

## Contexte d’utilisation

Il se combine avec l’article sur le VPN (Virtual Private Network, réseau privé virtuel) IPsec de FortiGate, organisé autour de la même question, qui couvre les choix de topologie que l’outil ne modélise pas. Pour la préparation à l’examen NSE 4, il couvre l’objectif 5.01.
