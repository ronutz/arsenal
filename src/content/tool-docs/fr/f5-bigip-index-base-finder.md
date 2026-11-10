## Ce que fait l’outil

Sur un BIG-IP, la question « est-ce que ça commence à 0 ou à 1 ? » n’a pas de réponse unique. Tcl, le langage sous-jacent des iRules, compte toutes les positions à partir de 0. Plusieurs commandes ajoutées par F5 comptent à partir de 1. Les compteurs renvoient 1 pour le premier élément. Beaucoup de zéros dans la configuration sont des valeurs et non des positions. L’outil rassemble 76 de ces endroits, chacun avec sa source, pour que vous puissiez vérifier celui sur lequel vous vous apprêtez à vous appuyer.

Il a deux modes :

- **Recherche** liste les endroits, regroupés par partie du système : Tcl dans les iRules, commandes ajoutées par F5 aux iRules, objets de configuration, plateforme et matériel, API, journalisation et capture de paquets. Recherchez par commande ou par terme, ou filtrez selon le point de départ du comptage.
- **Traduire une position** prend une position telle qu’on la compte d’habitude, où 1 est le premier, la convertit dans le nombre qu’attend chaque commande, exécute chaque commande dans le moteur Tcl 8.4.6 pédagogique du site, et affiche à côté la version décalée d’un.

## Lecture d’une entrée

- **Le badge** indique comment l’endroit compte : `0` commence à 0, `1` commence à 1, `←` compte depuis la droite (`end`, `end-1`, les N derniers), `0·1` signifie que les deux bases se rencontrent au même endroit, `=0` signifie que 0 est une valeur qui a un sens (valeur par défaut, pas de limite, tout, succès, égalité), et `n` désigne un nombre d’éléments qu’on prend facilement pour une position.
- **Compte**, **Premier**, **Dernier** et **Si rien** indiquent ce qui est compté, comment atteindre le premier et le dernier élément, et ce qui est renvoyé quand il n’y a rien (-1, 0 ou une chaîne vide).
- **Exemple** montre le code et ce qu’il renvoie. Chaque exemple Tcl a été exécuté dans un véritable tclsh 8.4.6.
- **Attention** est le piège réputé de cette entrée.
- **Les pages de F5 se contredisent** apparaît quand deux affirmations de F5 ne peuvent pas être vraies en même temps.
- **Degré de certitude** distingue quatre niveaux : affirmé par le manuel Tcl et exécuté dans tclsh 8.4.6 ; affirmé par la source ; montré seulement par un exemple sur la page source ; et deux affirmations de F5 qui se contredisent.
- **Sources** liste chaque page sur laquelle repose l’entrée, avec sa date de consultation.

## Règles empiriques

1. Les positions Tcl comptent à partir de 0, et `end` est le dernier indice, soit la longueur moins un.
2. Les numéros de type champ de F5 comptent à partir de 1 : les champs de `getfield`, les profondeurs de `URI::path`, les indices de segment de chemin des politiques LTM, l’ancien `matchclass`.
3. Les compteurs renvoient 1 pour le premier élément : `HTTP::request_num`, `table incr`.
4. Beaucoup de zéros sont des valeurs et non des positions : route domain 0, port 0, `connection-limit 0`, `SSL::verify_result` 0, et le `0.0` de tcpdump.
5. Le plus petit passe en premier presque partout (priorité des évènements, ordinaux des politiques, ordre de BIG-IP DNS, gravité syslog), sauf dans les groupes de priorité des pools, où le plus grand l’emporte.
6. Dans un `if`, 0 est faux et tout autre nombre est vrai, -1 compris : comparez un indice avec `>= 0` au lieu de le tester directement, et stockez vos propres indicateurs sous forme de 0 ou de 1, comme le demande le DevCentral iRules Style Guide.

## Le traducteur

Choisissez une question, indiquez une valeur et N (1 est le premier) :

- **Le N-ième caractère** : `string index` et `string range` avec N-1, et le `substr` de F5, à côté de `string index` avec N.
- **Le N-ième champ après un découpage** : le `getfield` de F5 avec N, et `split` puis `lindex` avec N-1, à côté des deux comptés dans le mauvais sens.
- **Le N-ième segment d’un chemin** : les deux mêmes commandes, en tenant compte du morceau vide qui précède une barre oblique initiale, à côté de la version qui l’oublie.
- **Les N derniers labels d’un nom d’hôte** : le `domain` de F5, et `split`, `lrange` depuis la fin et `join`, à côté de la version qui prend un label de trop.
- **Le N-ième élément d’une liste Tcl** : `lindex` avec N-1, à côté de `lindex` avec N.
- **Première occurrence d’un texte** : `string first`, et le test `>= 0`, à côté d’un `if` sur l’indice lui-même.

Chaque ligne est marquée **Sa propre numérotation** (le bon nombre pour cette commande), **Décalé d’un** ou **Réponse voisine**. La réponse affichée en tête est ce qu’a renvoyé la première ligne correcte, et une remarque apparaît quand des lignes correctes ne concordent pas entre elles. Les remarques expliquent les cas qui changent les nombres : une valeur qui commence par le séparateur, un chemin avec une chaîne de requête (`HTTP::uri` l’inclut, `HTTP::path` non), un séparateur de plus d’un caractère (`split` traite chaque caractère comme un séparateur, `getfield` utilise la chaîne entière), et une correspondance à l’indice 0 ou une absence de correspondance à -1.

## Contradictions entre les pages de F5

La lecture attentive des sources a mis au jour des endroits où deux affirmations de F5 ne peuvent pas être vraies en même temps. Aucune n’a été testée sur un BIG-IP pour cet outil ; traitez donc chacune comme une question à vérifier sur votre version. Il s’agit du décompte à 0 de `substr`, des commentaires d’exemple de `URI::path`, de la valeur de `matchclass` en l’absence de correspondance, de la plage indiquée sur la page `priority`, du nom de variable de l’exemple de `DNSMSG::record`, de la description d’un ordinal de politique dans iControl REST, de l’ordre des listes de contrôle d’accès (ACL, Access Control List) d’APM, et de la priorité que renvoie `LB::server` pour un membre qui n’en a aucune de configurée. Chaque contradiction figure sur son entrée, avec les deux sources.

## Partage des résultats

Sous la première réponse de chaque mode (le nombre de correspondances dans Recherche, la réponse dans Traduire une position), le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, les champs de ce mode sous forme de valeurs nommées : dans Recherche, `search`, `base` et `area` quand ils sont renseignés (sans mots ni filtre, il n’y a rien à partager et le bouton est désactivé) ; dans Traduire une position, `mode=translate`, `question`, `value`, ainsi que `n`, `sep` ou `needle` selon la question. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : les valeurs ne sont donc pas envoyées au serveur à l’ouverture du lien ; chacune reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut les lire.

- **Longueur.** Les champs contiennent au plus 2000 caractères (la valeur), bien en deçà des 16 384 que le site autorise après le `#`.
- **Ouverture d’un lien.** Le mode s’ouvre, ses champs sont renseignés et la page calcule comme lors d’une saisie ; le moteur Tcl 8.4.6 pédagogique s’exécute dans la page, et rien n’est récupéré. Un champ de l’autre mode, une base, une partie du système ou une question inconnue, une valeur qui dépasse la limite de son champ ou un N hors de la plage de 1 à 1000, et c’est tout le lien qui est ignoré. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.

## Limites

- Le traducteur accepte une valeur de 2000 caractères au plus, un N de 1 à 1000, un séparateur de 20 caractères au plus et un texte à rechercher de 200 caractères au plus, et chaque commande s’arrête après 200 étapes.
- Les commandes F5 du traducteur se comportent comme les décrivent les pages de F5. Là où une page ne dit rien, la ligne le signale : la page `getfield` de F5 ne donne aucun exemple où la chaîne commence par le séparateur, si bien que la lecture de ce cas par l’outil est marquée comme une hypothèse.
- Les entrées sur la plateforme, la configuration et les API proviennent de la documentation de F5 et n’ont pas été testées sur du matériel pour cet outil.
- Tout s’exécute dans votre navigateur. Rien n’est envoyé nulle part, et rien ne s’exécute sur un BIG-IP.

## Sources

L’outil liste chaque source avec sa date de consultation, 109 au total. Les principales :

- [F5 K6091: The version of Tcl used to develop iRules](https://my.f5.com/manage/s/article/K6091) (consulté le 03/10/2026)
- [F5 K36322151: List of disabled Tcl commands for iRules (12.x - 17.x)](https://my.f5.com/manage/s/article/K36322151) (consulté le 03/10/2026)
- [Tcl 8.4 manual: string](https://www.tcl-lang.org/man/tcl8.4/TclCmd/string.htm) (consulté le 03/10/2026)
- [Tcl 8.4 manual: lindex](https://www.tcl-lang.org/man/tcl8.4/TclCmd/lindex.htm) (consulté le 03/10/2026)
- [Tcl 8.4 manual: split](https://www.tcl-lang.org/man/tcl8.4/TclCmd/split.htm) (consulté le 03/10/2026)
- [Tcl 8.4 manual: if](https://www.tcl-lang.org/man/tcl8.4/TclCmd/if.htm) (consulté le 03/10/2026)
- [F5 iRules reference: getfield](https://clouddocs.f5.com/api/irules/getfield.html) (consulté le 03/10/2026)
- [F5 iRules reference: substr](https://clouddocs.f5.com/api/irules/substr.html) (consulté le 03/10/2026)
- [F5 iRules reference: domain](https://clouddocs.f5.com/api/irules/domain.html) (consulté le 03/10/2026)
- [F5 iRules reference: URI::path](https://clouddocs.f5.com/api/irules/URI__path.html) (consulté le 03/10/2026)
- [F5 iRules reference: priority](https://clouddocs.f5.com/api/irules/priority.html) (consulté le 03/10/2026)
- [F5 tmsh reference: ltm policy](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_policy.html) (consulté le 03/10/2026)
- [F5 tmsh reference: ltm pool](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_pool.html) (consulté le 03/10/2026)
- [F5 K411: Overview of packet tracing with the tcpdump utility](https://my.f5.com/manage/s/article/K411) (consulté le 03/10/2026)
- [F5 DevCentral: iRules Style Guide](https://community.f5.com/t/irules-style-guide/71151) (consulté le 03/10/2026)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultée le 27/10/2026) : section 3.5, le fragment, qui contient les valeurs d’un lien Partager les résultats
