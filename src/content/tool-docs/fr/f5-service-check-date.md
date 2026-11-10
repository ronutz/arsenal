## Ce que fait l’outil

Donnez à l’outil une version BIG-IP : il renvoie la date de service check (Service Check Date) minimale que doit porter la licence pour cette version. Donnez-lui une date de service check : il renvoie la version la plus récente vers laquelle vous pouvez faire une mise à niveau, ainsi que les branches plus récentes encore inaccessibles et la date qu’exige chacune. C’est une recherche dans les deux sens sur une copie intégrée de la table License Check Date publiée par F5, et elle s’exécute entièrement dans votre navigateur.

## Les deux dates sur lesquelles l’outil s’appuie

Chaque version de BIG-IP porte une **License Check Date** statique : la date de service check minimale qu’une licence doit avoir pour pouvoir démarrer cette version. Chaque licence porte une **Service Check Date** : la plus ancienne des deux dates entre sa dernière activation et l’expiration de son contrat de service. Lors d’une mise à niveau vers une nouvelle version majeure ou mineure, le système compare les deux, et si la Service Check Date de la licence est antérieure à la License Check Date de la version, le système mis à niveau démarre mais ne charge pas sa configuration tant que la licence n’est pas réactivée. L’outil encode la table License Check Date de F5 (issue du K7727) et effectue cette comparaison pour vous, dans un sens comme dans l’autre.

Les dates sont traitées sous la forme exacte que BIG-IP écrit dans `bigip.license`, les huit chiffres `yyyymmdd` (ainsi, `20230208` est le 8 février 2023), et affichées aussi au format ISO. La comparaison relève de la pure arithmétique de dates, sans aucune horloge : la date de la version comme la date de service check sont des entrées, si bien que les mêmes entrées donnent toujours la même réponse.

## Exemples commentés

Saisissez une version, obtenez son plancher. `17.1.3` est rattachée à la branche `17.1.x` et indique une date de service check minimale de `2023-02-08` (`20230208`) ; `21.1` indique `2026-04-15` ; `16.1.x` indique `2021-06-11`.

Saisissez une date de service check, obtenez votre plafond. Une date de service check de `2023-06-15` permet d’atteindre `17.1.x` comme branche la plus récente, et indique les branches encore inaccessibles : `17.5.x` (exige `2025-02-12`), `21.0.x` (exige `2025-10-29`) et `21.1.x` (exige `2026-04-15`). Une date récente comme `2026-05-01` atteint la branche la plus récente sans aucun blocage ; une date plus ancienne que toute la table n’atteint rien, signe que la licence doit être réactivée avant toute mise à niveau.

## Seules les mises à niveau majeures et mineures sont contrôlées

Le contrôle s’applique à une mise à niveau (upgrade), que F5 définit comme un changement du premier ou du deuxième numéro de version. Le passage d’une version de maintenance ou intermédiaire à une autre au sein d’une même branche est une mise à jour (update), et elle ne déclenche aucune vérification de la date de service check. C’est pourquoi l’outil travaille à la granularité majeure.mineure : dès que votre date de service check est assez récente pour atteindre `17.1.x`, elle l’est pour toutes les versions de maintenance et intermédiaires de cette branche. La réponse pour `17.1.0`, `17.1.3` et `17.1.x` est donc la même date unique.

## Utilisation

Saisissez une version BIG-IP (`17.1.3`, `21.1`, `16.1.x`) ou une date de service check (`20230611`, `2023-06-11` ou `2023/06/11`) ; l’outil détecte ce que vous avez fourni et répond en conséquence. Sans clavier, utilisez les deux éléments placés sous le champ : le sélecteur de date le remplit avec une date de service check au format `yyyy-mm-dd`, et la liste des versions contient chaque ligne de la table K7727 que l’outil embarque, sous le libellé de F5 lui-même, et remplit le champ avec une version que couvre cette ligne (`17.1.x` pour une branche, la première version d’une plage comme `10.2.2 - 10.2.4`). L’un comme l’autre remplit le champ exactement comme le ferait la saisie. Comme ces données encodent une documentation de constructeur et non une norme figée, et que F5 ajoute une ligne à chaque version, vérifiez toute valeur avec le K7727 de F5 ou le fichier `/etc/version_date` du système cible avant une mise à niveau en production.

## Collage d’une licence ou d’une sortie tmsh

Vous pouvez coller tout le contenu de `/config/bigip.license`, n’importe quel fragment de ce fichier, ou la sortie de `tmsh show sys license` : l’outil trouve la ligne de date de service check et répond à la même question d’éligibilité à la mise à niveau. Les deux formes de ligne publiées sont reconnues : la forme du fichier, `Service check date : 20151008` (espacement libre autour des deux-points), et la forme tmsh, `Service Check Date 2016/08/18`. Une licence contient exactement une ligne de ce type : la première correspondance l’emporte donc, et la ligne trouvée est réaffichée pour que vous puissiez vérifier que la bonne valeur a été retenue. Tout le reste du collage est ignoré et, comme toujours, rien ne quitte votre navigateur.

## Partage des résultats

Sous la réponse, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, la version ou la date telle que saisie ou, si vous avez collé une licence ou une sortie de `tmsh show sys license`, uniquement la ligne de date de service check que la page en a extraite (la ligne qu’elle vous montre, comme `Service check date : 20230611`), jamais la licence. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

Une licence contient la clé d’enregistrement, et la référence tmsh de F5 ([sys license](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/sys/sys_license.html), consultée le 27/10/2026) indique qu’après une révocation, cette clé peut être réutilisée pour attribuer une licence à la même instance VE ou à une autre (« the registration key may subsequently be re-used to relicense this or another VE instance »). Cette seule ligne suffit : la page qui reçoit le lien en extrait la même date et affiche la même ligne. La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : la valeur n’est donc pas envoyée au serveur à l’ouverture du lien ; elle reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut la lire.

- **Longueur.** Une ligne, bien en deçà des 16 384 caractères que le site autorise après le `#`.
- **Ouverture d’un lien.** La valeur remplit le champ comme à la saisie, et la page répond. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
