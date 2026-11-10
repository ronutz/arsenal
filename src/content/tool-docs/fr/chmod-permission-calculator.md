## Ce que fait l’outil

Il lit un mode de fichier écrit sous l’une des trois formes habituelles et restitue toutes les autres écritures avec leur lecture. Les trois écritures :

- **Octale**, de un à cinq chiffres : `755`, `0644`, `4755`, `02775`, `00755`. Le quatrième chiffre en partant de la droite porte les bits spéciaux (4 set-user-ID, 2 set-group-ID, 1 suppression restreinte ou sticky) ; les trois chiffres à sa droite correspondent au propriétaire, au groupe et aux autres, chacun étant la somme de lecture 4, écriture 2 et exécution 1.
- **Une chaîne ls**, de neuf caractères, ou dix avec la lettre de type : `rwxr-xr-x`, `-rwsr-xr-x`, `drwxrwxrwt`, `rwSr--r--`. Un `d` initial indique un répertoire.
- **Des clauses chmod** appliquées à un mode de base sous un umask : `u+x,go-w`, `a=rX`, `g+s,o-rwx`, `=755`. La base vaut 644 pour un fichier et 755 pour un répertoire, sauf si vous en indiquez une ; l’umask vaut 022, sauf si vous en indiquez un.

Pour le mode lu, la page affiche les quatre chiffres octaux et la chaîne ls de dix caractères, les douze bits sous forme de grille où un clic inverse chaque bit, la lecture en clair par classe (ce que peuvent faire le propriétaire, le groupe et les autres, formulée pour un fichier ou pour un répertoire), les trois bits spéciaux avec leur signification pour ce type d’objet, les combinaisons qui méritent un second regard, les commandes chmod qui produisent ce mode (octale absolue, symbolique absolue et le changement minimal depuis la base), l’umask qui créerait ce mode à partir de la valeur par défaut d’un programme et, pour les clauses, une trace du mode après chacune d’elles.

## Les règles appliquées

- **La grammaire symbolique est celle de POSIX.** Classes `u`, `g`, `o` et `a` ; opérateurs `+`, `-`, `=` ; permissions `r`, `w`, `x`, `X`, `s`, `t` ; ou une classe dont copier les droits, `u`, `g` ou `o`. Plusieurs actions peuvent suivre une même liste de classes (`u+r-w`), et les clauses sont séparées par des virgules.
- **`X`** positionne l’exécution si le fichier est un répertoire ou si au moins un bit d’exécution est déjà positionné (« if the file is a directory or if the current file mode bits have at least one of the execute bits set », POSIX chmod). Sur un fichier ordinaire sans bit d’exécution, `a+X` ne change rien, et la trace le signale.
- **`=`** efface d’abord les bits des classes nommées (les douze quand aucune classe n’est nommée), puis positionne les permissions indiquées. `o=` sans rien derrière efface les bits des autres.
- **Aucune classe nommée** équivaut aux trois, mais pour `+` et `-`, les bits positionnés dans l’umask ne sont pas touchés (« but bits that are set in the umask are not affected », chmod(1)) ; le calculateur applique l’umask que vous indiquez, 022 par défaut, et signale quand celui-ci a masqué quelque chose.
- **`s`** dépend de la classe : avec `u`, c’est set-user-ID, avec `g`, set-group-ID, et avec `o` seul, il ne change rien (POSIX). **`t`** est l’indicateur de suppression restreinte, appliqué quelle que soit la classe nommée, comme le fait GNU chmod.
- **Les lettres de ls sont celles de POSIX.** `s` là où set-user-ID ou set-group-ID est positionné et où la classe peut exécuter, `S` quand elle ne le peut pas ; `t` là où l’indicateur de suppression restreinte est positionné et où les autres peuvent traverser le répertoire, `T` quand ils ne le peuvent pas.
- **Règle GNU des répertoires.** Quand la base est un répertoire, un mode numérique de quatre chiffres au plus conserve les bits set-user-ID et set-group-ID de la base, comme l’indique chmod(1) : « For directories chmod preserves set-user-ID and set-group-ID bits unless you explicitly specify otherwise. » Écrire `00755`, `-6000` ou `=755` les efface, et la trace nomme la règle quand elle s’est appliquée.
- **Les modes numériques avec opérateur** (`=755`, `+111`, `-022`) sont lus comme GNU les lit : positionner exactement, ajouter, retirer.

## Lecture des bits spéciaux

| Bit | Valeur | Sur un fichier | Sur un répertoire |
|---|---|---|---|
| set-user-ID | 4000 | le processus s’exécute avec l’ID utilisateur effectif du propriétaire | aucune signification portable |
| set-group-ID | 2000 | le processus s’exécute avec le groupe du fichier | les nouvelles entrées prennent le groupe du répertoire (la plupart des systèmes) |
| suppression restreinte ou sticky | 1000 | aucune signification portable aujourd’hui ; certains anciens systèmes gardaient le code du programme dans l’espace d’échange (swap) | seuls le propriétaire d’une entrée, le propriétaire du répertoire ou un utilisateur privilégié peuvent la supprimer ou la renommer |

Ce sont les majuscules qu’il faut remarquer : `S` signifie que le bit spécial est positionné mais que le bit d’exécution correspondant ne l’est pas, si bien que le bit n’a aucun effet tant que l’exécution n’est pas accordée ; `T` signifie que l’indicateur de suppression restreinte est positionné sur un répertoire que les autres ne peuvent pas traverser.

## La ligne umask

Un programme qui crée un fichier demande 666, et un programme qui crée un répertoire demande 777 ; le noyau efface les bits positionnés dans l’umask du processus. Le calculateur peut donc indiquer quel umask crée le mode saisi, et quand aucun ne le peut : un mode de fichier avec un bit d’exécution n’est jamais produit par la seule création, et les bits spéciaux ne viennent jamais d’un umask.

## Limites

- Le calculateur connaît les douze bits de mode, pas le système de fichiers. Il ne voit ni le propriétaire, ni les listes de contrôle d’accès, ni les capabilities, ni les options de montage, ni les attributs d’immuabilité, ni le contrôle d’accès obligatoire, chacun pouvant l’emporter sur ce que disent les bits.
- Les comportements propres à GNU sont modélisés tels que les décrit chmod(1) de coreutils 9.11. D’autres implémentations peuvent traiter différemment un mode numérique sur un répertoire, ou `=755`.
- L’effacement des bits set-user-ID et set-group-ID lorsque tous les bits d’exécution sont effacés dépend de l’implémentation (POSIX chmod) ; le calculateur ne les efface pas de lui-même.
- Chaque champ est tronqué à 64 caractères.

## Partage des résultats

Sous les deux écritures principales, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient après le `#` le mode tel que saisi (octal, une chaîne `ls` ou des clauses chmod), le type (fichier ou répertoire), ainsi que le mode de base et l’umask si vous les avez renseignés ; laissés vides, chacun prend sa valeur par défaut des deux côtés. Un mode ne révèle rien de vous. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Ouverture d’un lien.** Les quatre champs se remplissent comme si vous les aviez saisis, et la page lit le mode. Un mode vide, un type inconnu ou un champ plus long que celui de la page (64 caractères) font ignorer le lien. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.

## Sources

- [POSIX.1-2024 (IEEE Std 1003.1-2024) : chmod](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/chmod.html) (consulté le 03/10/2026)
- [POSIX.1-2024 (IEEE Std 1003.1-2024) : ls](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/ls.html) (consulté le 03/10/2026)
- [Manuel de GNU coreutils : Mode Structure](https://www.gnu.org/software/coreutils/manual/html_node/Mode-Structure.html) (consulté le 03/10/2026)
- [chmod(1), GNU coreutils 9.11, man7.org](https://man7.org/linux/man-pages/man1/chmod.1.html) (consulté le 03/10/2026)
