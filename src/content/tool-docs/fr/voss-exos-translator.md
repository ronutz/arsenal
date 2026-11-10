## Ce que fait l’outil

Cet outil est une table de correspondance de référence entre **VOSS** (Fabric Connect / SPBM d’Extreme) et **EXOS**. Il place les tâches courantes côte à côte pour vous montrer comment chaque ligne de commande les exprime, et il indique explicitement les cas où EXOS n’a pas d’équivalent, puisque EXOS n’exécute pas du tout SPBM. C’est une référence, pas un générateur de configuration : chaque commande s’appuie sur la documentation d’Extreme, mais vous devez adapter les noms, les ports et les numéros à votre propre réseau et vérifier avant d’appliquer quoi que ce soit.

## La différence essentielle

EXOS et VOSS sont deux systèmes d’exploitation distincts qui tournent sur le matériel universel d’Extreme. VOSS est conçu pour la fabric : il construit une fabric SPBM avec IS-IS, des nicknames, des B-VLAN et des I-SID. EXOS ne prend pas en charge SPBM. Il rejoint un réseau Fabric Connect en tant que périphérie **Fabric Attach** (FA Proxy ou FA Client), et c’est le FA Server VOSS qui provisionne l’I-SID pour lui. Pour les tâches du cœur de fabric (l’instance SPBM, le nickname, les B-VLAN, un VSN de couche 3), il n’existe donc tout simplement aucune commande EXOS, et l’outil le dit clairement.

## Utilisation

Saisissez une tâche ou un fragment de commande (par exemple `i-sid`, `nickname`, `vlan` ou `fabric attach`) : le tableau ne garde que les lignes correspondantes. Chaque ligne montre le concept, la ou les commandes VOSS, la ou les commandes EXOS ou une remarque indiquant qu’il n’y a pas d’équivalent, ainsi qu’une courte explication. Videz la zone pour revoir tout le tableau.

## Ce que l’outil n’est pas

Il ne génère pas de configuration déployable, et il ne traduit pas ligne à ligne un fichier de configuration quelconque. La configuration d’une fabric a un fort impact et dépend de la plateforme ; cet outil est fait pour vous aider à apprendre les deux CLI et à les comparer, pas pour produire une configuration que vous colleriez sans vérification dans un commutateur en production.

## Partage des résultats

Sous les correspondances, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient la recherche telle que saisie (`#input=i-sid`), et rien d’autre ; la personne qui l’ouvre voit les mêmes correspondances. Quand la recherche est vide, toutes les correspondances sont listées et le bouton reste désactivé. Tout ce que contient le lien se place après le `#`, que la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) décrit comme séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : un navigateur ne l’envoie pas au serveur à l’ouverture du lien, mais il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Un lien contient au plus 16 384 caractères, la limite que le site applique à toute valeur placée après le `#` ; une recherche est bien plus courte.
- **Ouverture d’un lien.** Le lien est la même adresse que celle qu’utilisent les autres liens vers cet outil : les mots remplissent le champ de recherche comme lors d’une saisie. Comme pour tout lien vers cet outil, la valeur reste après le `#` jusqu’à ce que vous modifiiez ou effaciez le champ, puis quitte l’adresse sans aucune requête.
