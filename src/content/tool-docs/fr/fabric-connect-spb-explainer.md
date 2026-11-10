## Ce que fait l’outil

Indiquez un I-SID, un nickname SPB ou un rôle de commutateur : l’outil remet en ordre pour vous le vocabulaire Shortest Path Bridging, c’est-à-dire quel VLAN de backbone transporte le service et pourquoi, à quoi se rattachent réellement un L2VSN et un L3VSN, ce qu’est un B-VLAN et ce qu’il n’est pas, et ce qui change entre un backbone edge bridge et un backbone core bridge. Déterministe et hors ligne : l’outil explique des identifiants, il n’interroge aucune fabric.

## Le comportement à vérifier

**Les I-SID pairs empruntent un VLAN de backbone, les impairs l’autre.** Avec les valeurs par défaut d’Extreme, 4051 et 4052, l’I-SID 20010 est transporté sur 4052 et le 20011 sur 4051. Deux arbres du plus court chemin, chacun transportant environ la moitié des services.

L’outil précise qu’il s’agit de **la répartition par défaut, et non d’une règle de la norme**, car un déploiement peut répartir autrement ; et quand un service se comporte autrement que ses voisins, l’arbre sur lequel il se trouve est la première chose à vérifier.

## Le fait que l’outil répète à chaque résultat

**Un B-VLAN n’est pas un VLAN.** Il n’inonde ni l’unicast inconnu, ni la diffusion (broadcast), ni le multicast. Il ne transfère que selon des tables de MAC de backbone qu’IS-IS a provisionnées à partir d’arbres du plus court chemin. Pas de Spanning Tree, rien de bloqué.

Tout le reste en découle : si le transfert est calculé, le cœur n’apprend rien ; si le cœur n’apprend rien, il n’a pas besoin de savoir que vos services existent. C’est pourquoi **ajouter un service ne touche que les commutateurs de bordure où il apparaît.**

## Les validations effectuées

Un I-SID doit se trouver dans la plage des 24 bits, et l’outil refuse les valeurs hors de cette plage plutôt que d’expliquer un nombre qui ne peut pas exister. Un nickname doit avoir la forme `x.xx.xx`, et un nickname mal formé déclenche un avertissement, car **un nickname dupliqué ou mal formé est l’une des rares erreurs de ce domaine qui cassent quelque chose loin de l’endroit où elles ont été saisies.**

## Ce que l’outil ne fait pas

Il ne voit pas votre fabric. Il ne connaît ni votre topologie, ni vos adjacences, ni l’état réel d’IS-IS. Il explique ce que signifient vos valeurs dans une fabric, pas ce que fait votre fabric.

## Différence avec le décodeur d’identifiants de fabric VOSS

Les deux outils acceptent un I-SID et un nickname, mais ils répondent à des questions différentes :

- **Le décodeur d’identifiants de fabric valide un identifiant.** Collez une valeur : il détermine s’il s’agit d’un I-SID sur 24 bits, d’un nickname sur 20 bits ou d’un system-id, et si elle est dans la plage.
- **Cet outil explique ce que signifie l’identifiant dans une fabric.** Quel VLAN de backbone le transporte et pourquoi, à quoi se rattachent un L2VSN et un L3VSN, ce qu’est un B-VLAN et ce qu’il n’est pas, et ce qui change entre un pont de bordure (edge bridge) et un pont de cœur (core bridge).

Décodez la valeur avec le décodeur ; comprenez l’organisation ici.

## Partage des résultats

Sous les faits, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, chaque champ du formulaire tel que saisi : `isid`, `primary`, `secondary` et `nickname` (un champ laissé vide ne transmet rien et arrive vide), ainsi que les deux listes déroulantes par leur identifiant, `service` et `role`. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

Les I-SID, les B-VLAN, les nicknames et les rôles sont les valeurs que vous saisissez pour voir comment la fabric les traite ; rien en eux n’est secret.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : le formulaire n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Ouverture d’un lien.** Chaque champ est rempli et la page l’explique, comme lors d’une saisie ; rien n’est envoyé. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
