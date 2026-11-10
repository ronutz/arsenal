## Ce que fait l’outil

Collez la liste des noms d’hôte que vous prévoyez de placer sur des certificats Let's Encrypt : l’outil les regroupe par **domaine enregistré** (eTLD+1) et montre comment ils se placent face aux limites d’émission de Let's Encrypt. Il indique le nombre minimal de certificats nécessaires pour l’ensemble, signale les cas où un wildcard regrouperait plusieurs sous-domaines, et avertit quand l’approche naïve d’un certificat par nom dépasserait la limite hebdomadaire par domaine. Tout s’exécute localement dans votre navigateur ; rien n’est envoyé nulle part.

## L’importance du domaine enregistré

La limite principale de Let's Encrypt décompte les nouveaux certificats par **domaine enregistré**, et non par nom d’hôte. Ainsi, `www.example.com`, `api.example.com` et `blog.example.com` puisent tous dans un même budget hebdomadaire, celui de `example.com`. L’outil calcule ce regroupement avec la Public Suffix List : il reste donc juste pour les suffixes à plusieurs labels. `shop.example.co.uk` et `www.example.co.uk` se regroupent sous `example.co.uk`, à trois labels de profondeur, et non sous `co.uk`. Une erreur sur cette frontière est la cause habituelle des mauvaises surprises devant une erreur de limite de débit.

## Ce que calcule l’outil

Pour chaque domaine enregistré, l’outil affiche le nombre de noms prévus (rapporté à la limite hebdomadaire par domaine), le nombre minimal de certificats nécessaires si vous placez jusqu’à 100 noms par certificat, et les éventuels **candidats wildcard** : un parent qui a au moins deux sous-domaines directs, qu’un seul nom `*.parent` pourrait couvrir à leur place. Le résumé totalise les noms, les domaines enregistrés distincts et le nombre minimal de certificats pour l’ensemble, et affiche un avertissement si un domaine enregistré dépassait la limite hebdomadaire avec un certificat par nom. Les adresses IP saisies sont listées à part, car elles ont leur propre unité, et tout ce qui n’est pas un nom d’hôte valide (y compris un suffixe public seul, comme `co.uk`) est signalé.

## Les limites utilisées

Les chiffres affichés sont un instantané daté et sourcé des limites publiées par Let's Encrypt : 50 nouveaux certificats par domaine enregistré sur 7 jours, 300 nouvelles commandes par compte sur 3 heures, 5 certificats pour exactement le même ensemble de noms sur 7 jours, et jusqu’à 100 noms par certificat. Le fait le plus utile pour la planification : **les renouvellements coordonnés par ARI sont exemptés de toutes les limites de débit**. Une fois les certificats émis, les maintenir renouvelés ne pose donc pas de problème de limite de débit. Comme Let's Encrypt peut modifier ces chiffres, l’outil affiche la date de l’instantané et renvoie vers la source ; consultez cette page pour connaître les valeurs actuelles avant de compter sur une marge serrée.

## Partage des résultats

À la fin du résumé, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, les noms d’hôte tels que vous les avez saisis, un par ligne. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : les noms ne sont donc pas envoyés au serveur à l’ouverture du lien ; ils restent dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut les lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** Les noms remplissent la zone comme le ferait un collage, et la page les planifie. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
