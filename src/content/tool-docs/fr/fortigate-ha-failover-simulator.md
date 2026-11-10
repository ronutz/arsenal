## Ce que fait l’outil

Décrivez un cluster FGCP (pour chaque unité : les pannes d’interfaces surveillées, l’âge, la priorité et le numéro de série, plus le paramètre override) : l’outil déroule l’élection de l’unité principale, nomme le critère qui l’a décidée et vous indique quelle unité serait principale si l’option override était inversée. Tout s’exécute dans votre navigateur.

## La question à laquelle l’outil répond

« Pourquoi l’unité dont la priorité est la plus élevée n’est-elle pas l’unité principale ? »

Cette question revient sans cesse, et la réponse est presque toujours la même. Avec l’option override **désactivée**, la valeur par défaut, FGCP compare **l’âge avant la priorité**. Une unité qui a redémarré a un âge faible : elle reste donc secondaire, aussi élevée que soit sa priorité.

Ce n’est ni un bug ni une erreur de configuration. Ce comportement par défaut existe pour qu’une unité instable ne puisse pas prendre et perdre le rôle principal à répétition, car chaque prise de rôle perturbe le trafic. Fortinet a privilégié la stabilité plutôt que la préférence, et le paramètre qui permet de changer ce comportement est à portée de main.

## L’ordre de comparaison

| Ordre | Critère | Qui l’emporte |
|---|---|---|
| 1 | Interfaces surveillées en panne | Le moins grand nombre |
| 2 | Âge (override désactivé) | La valeur la plus haute |
| 3 | Priorité | La valeur la plus haute |
| 4 | Numéro de série | Départage déterministe |

Activer override fait passer **la priorité avant l’âge** : les positions 2 et 3 s’échangent. Les interfaces surveillées restent en tête dans les deux modes, et le numéro de série reste en dernier.

L’outil affiche l’ordre réellement en vigueur pour votre saisie plutôt que l’ordre générique, car c’est précisément le point que l’on retient mal.

## Le contrefactuel, le résultat vraiment utile

En plus du gagnant, l’outil calcule quelle unité serait principale avec l’option override inversée. Quand le résultat diffère, il le dit explicitement.

C’est important, car « FGT-B est l’unité principale » est un fait, tandis que « avec override activé, ce serait FGT-A, et c’est ce seul paramètre qui décide de ce cluster » est une décision. C’est la seconde dont a réellement besoin la personne qui examine un cluster au comportement inattendu.

Quand inverser override ne changerait rien, l’outil le dit aussi, ce qui écarte en une ligne toute une piste d’investigation.

## Lecture des autres issues

**Critère décisif : interfaces surveillées en panne** signifie que l’état des interfaces a tranché avant que quoi que ce soit d’autre soit consulté. Réparez l’interface tombée, et la comparaison passe au critère suivant.

**Critère décisif : numéro de série** signifie que tout le reste était à égalité. C’est déterministe mais arbitraire : si vous voulez qu’une unité précise soit préférée, définissez une priorité plutôt que de compter sur le numéro de série qui se classe le plus haut.

## Ce que l’outil ne modélise pas

L’élection seulement. L’outil ne modélise ni la survie des sessions au basculement, qui dépend du session pickup et du mode d’inspection (proxy ou non), ni le split brain, qui est une panne du chemin de heartbeat et non l’issue d’une élection. Ces sujets sont traités dans l’article sur la haute disponibilité FGCP.

## Partage des résultats

Sous l’unité principale et ses constats, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, la zone telle que collée. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

Les lignes de directive nomment vos unités et leurs numéros de série (d’où la ligne de mise en garde qu’ajoute la fenêtre contextuelle), et la page ne lit que les lignes `member:` et `override:` : un bloc `config system ha` collé à côté partirait donc lui aussi, avec le mot de passe du cluster. Avant qu’un lien soit proposé, la zone est examinée à la recherche d’identifiants définis par FortiOS ou par une norme : une ligne `set` d’un paramètre dont la [référence CLI de FortiOS 7.6.8](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) fait un mot de passe (`psksecret`, `password`, `passwd`, `secret`, `key`, `auth-pwd`, etc. ; consultée le 01/11/2026) ou le `name` d’une communauté SNMP ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), section 3.2.5), toute valeur `ENC` (l’avis [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007) de Fortinet, consulté le 01/11/2026 : publiées là où d’autres peuvent les lire, ces données doivent être considérées comme faciles à déchiffrer, « should currently be considered “easy to decrypt” »), une paire `psksecret=` ou `password=` de mêmes noms sur une ligne de directive, une clé privée PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468)), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)), une ligne `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), section 11.6.2), un mot de passe dans une URL ou un ID de clé d’accès AWS. Si l’un d’eux est présent, pas de lien : la fenêtre contextuelle nomme sa ligne, vous le remplacez par une valeur fictive et vous appuyez de nouveau ; ce que vous partagez est ainsi exactement ce que vous avez choisi (une valeur n’est jamais remplacée à l’intérieur d’une zone collée, ce qui changerait ce qui a été envoyé). Une valeur dont seul le nom évoque un secret n’empêche pas le lien ; la fenêtre contextuelle nomme la première.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** La zone se remplit comme lors d’un collage et la page déroule l’élection, contrefactuel compris. Rien n’est contacté. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.

## Contexte d’utilisation

Il se combine avec l’article sur la haute disponibilité FGCP de FortiGate, qui explique la raison d’être de l’ordre par défaut et ce qui change d’autre lors d’un basculement. Pour la préparation à l’examen NSE 4, il couvre l’objectif 1.03.
