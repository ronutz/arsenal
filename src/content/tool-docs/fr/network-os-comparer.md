## Ce que fait l’outil

Quatorze systèmes d’exploitation réseau (IOS, IOS XE, IOS XR, NX-OS, Junos, Junos Evolved, EOS, TMOS, F5OS, EXOS, VOSS, FortiOS, PAN-OS et Gaia), chacun avec sa filiation, ce sur quoi il tourne, la façon dont ses composants partagent l’état, la séparation entre contrôle et transfert, la manière dont les modifications s’appliquent et le coût d’une mise à niveau.

**Choisissez-en un pour un profil complet. Choisissez-en deux pour les comparer axe par axe**, avec pour chaque axe une remarque qui explique ce qu’il permet de prévoir.

## L’axe qui compte le plus

**Le partage de l’état** prédit le comportement en cas de panne mieux que tout autre critère :

- **Mémoire partagée** : une défaillance se propage. L’IOS classique exécute tout dans un même espace d’adressage, sans protection de la mémoire.
- **Passage de messages** : une défaillance reste confinée. IOS XR redémarre le processus.
- **Un magasin d’état** : un processus redémarré **reprend** au lieu de tout reconstruire. Le SysDB d’Arista et le magasin de données distribué de Junos Evolved fonctionnent tous deux ainsi, et celui d’Evolved survit même au redémarrage du processus sur un autre nœud.

Le deuxième axe oppose **l’application immédiate à la configuration candidate validée par commit**. En mode immédiat, une erreur part aussitôt en production. Avec commit, une erreur n’est qu’une modification abandonnée : toute la différence entre un incident et un après-midi.

## Chaque entrée liste ses faiblesses

**Un vecteur de référence (golden vector) vérifie qu’aucune entrée n’en compte moins de deux.** Une entrée sans aucun coût indiqué est une publicité, et le lecteur aurait raison de se méfier du reste du tableau. Cela vaut aussi pour les plateformes que l’auteur du site enseigne et pour lesquelles il est agréé.

Le même audit vérifie que chaque entrée a une filiation, au moins deux forces et un élément distinctif assez substantiel pour dire quelque chose ; il a repéré un champ trop maigre dès la première exécution.

## Ce que l’outil ne fait pas

Ce n’est ni une matrice de fonctionnalités, ni un guide d’achat. L’outil ne suit pas les versions actuelles, délibérément : **les versions bougent, l’architecture non**, et un tableau périmé chaque trimestre serait pire que pas de tableau du tout.

Il ne peut pas non plus vous dire lequel acheter. Ce qu’il peut vous dire, c’est ce que chacun fera quand quelque chose casse, une question plus durable.

## Partage des résultats

Sous les caractéristiques du profil, ou sous le titre de la comparaison, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, les systèmes choisis, par leurs identifiants : `os` toujours (pour que le lien garde son sens si le système de départ change) et `with` quand un second système est choisi. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : le choix n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Ouverture d’un lien.** Les deux listes déroulantes sont positionnées et la page affiche le profil ou la comparaison, comme si vous les aviez choisis. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
