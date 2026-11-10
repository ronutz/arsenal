## Ce que fait l’outil

L’outil prend un nom d’hôte et en déduit deux choses : le **suffixe public** (le domaine de premier niveau effectif, ou eTLD) et le **domaine enregistré** (l’eTLD plus un label, souvent appelé eTLD+1). Pour `www.blog.example.co.uk`, le suffixe public est `co.uk` et le domaine enregistré est `example.co.uk`. Tout s’exécute localement dans votre navigateur, à partir d’une copie intégrée de la Public Suffix List ; rien n’est envoyé nulle part.

## Pourquoi c’est important

Le domaine enregistré est l’unité sur laquelle de nombreux systèmes font leurs comptes. Les autorités de certification comme Let's Encrypt appliquent leur limite de débit d’émission par domaine au domaine enregistré : `api.example.com` et `www.example.com` partagent donc un même quota sous `example.com`. Les navigateurs utilisent la même frontière pour décider de la portée des cookies et du comportement same-site. Le piège, c’est qu’on ne peut pas le trouver en prenant simplement les deux derniers labels : `example.co.uk` en exige trois, car `.co.uk` est lui-même un suffixe public, et la seule façon correcte de le savoir est la Public Suffix List.

## Fonctionnement

L’outil implémente l’algorithme publié de la Public Suffix List. Il cherche la règle qui s’applique à votre hôte en préférant une règle d’exception (une règle `!`) à toute règle normale, et sinon en prenant la règle qui compte le plus de labels. Les règles génériques comme `*.ck` correspondent à n’importe quel label unique à cette position. Si aucune règle ne correspond, le label le plus à droite est traité comme le suffixe. Le domaine enregistré est alors le suffixe public plus le label situé immédiatement à sa gauche, quand ce label existe.

## Sections ICANN et PRIVATE

La liste comporte deux parties. La section **ICANN** regroupe les suffixes gérés par les registres, que les navigateurs appliquent. La section **PRIVATE** couvre les noms délégués par des fournisseurs, comme `github.io` ou `*.compute.amazonaws.com`, sous lesquels un fournisseur distribue des sous-domaines. Les deux peuvent diverger : avec la liste complète, `user.github.io` est son propre domaine enregistré, mais avec les seules règles ICANN, le domaine enregistré est `github.io`. Quand une règle PRIVATE tranche, l’outil affiche aussi la vue ICANN seule, car c’est l’interprétation qu’utilisent les limites de débit des certificats et les vérifications same-site.

## Remarques

Saisissez un nom d’hôte seul ; un schéma, un port, un chemin ou un label générique `*.` en tête sont retirés automatiquement, et les noms internationalisés sont convertis sous leur forme punycode avant la recherche de correspondance. Les adresses IP sont signalées comme telles plutôt qu’analysées comme des domaines, car elles n’ont pas de suffixe public. Comme la Public Suffix List évolue, la copie intégrée est un instantané daté : considérez le résultat comme exact à la date de cet instantané, et vérifiez sur publicsuffix.org si vous avez besoin des toutes dernières règles.

## Partage des résultats

Sous la réponse principale, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient le nom d’hôte tel que saisi (`#input=www.blog.example.co.uk`), et rien d’autre. Tout ce que contient le lien se place après le `#`, que la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) décrit comme séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : un navigateur ne l’envoie pas au serveur à l’ouverture du lien, mais il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Un lien contient au plus 16 384 caractères, la limite que le site applique à toute valeur placée après le `#` ; un nom d’hôte est bien plus court.
- **Ouverture d’un lien.** Le nom d’hôte remplit le champ comme à la saisie, et la page le recherche de nouveau dans sa copie intégrée de la liste ; une adresse IP ou un nom mal formé reçoit la remarque habituelle de la page. Que le lien soit accepté ou non, les valeurs quittent ensuite aussitôt l’adresse de la page elle-même, sans aucune requête : un rechargement, un favori ou le bouton Partager de la page n’emporte donc rien que vous n’ayez choisi de partager.
