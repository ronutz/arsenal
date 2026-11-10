## Ce que fait l’outil

Collez une chaîne de vecteur CVSS v3.1 ou v3.0 et l’outil calcule le score, le rattache à un niveau de gravité et explique ce que signifie chaque métrique. Il calcule le score de base (Base) et aussi les scores temporel (Temporal) et environnemental (Environmental) quand ces métriques figurent dans le vecteur. Ce n’est que du calcul, qui fonctionne hors ligne ; rien n’est envoyé nulle part.

## Ce qu’est CVSS

CVSS, le Common Vulnerability Scoring System du FIRST.org, est la façon standard d’exprimer la gravité d’une vulnérabilité par un nombre unique de 0,0 à 10,0. Ce nombre n’est pas attribué à la main ; il est calculé à partir d’une chaîne de vecteur, une liste compacte de métriques comme `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H`, où chaque champ représente une caractéristique de la vulnérabilité. L’outil retraduit cette chaîne en langage clair et lui applique la formule officielle.

## Les métriques de base

Le score de base, la partie que possède tout vecteur, se construit à partir de métriques réparties en deux groupes. Les métriques d’exploitabilité décrivent la difficulté d’exploiter la vulnérabilité : **Attack Vector** (réseau, adjacent, local ou physique), **Attack Complexity**, **Privileges Required** et **User Interaction**. Les métriques d’impact décrivent ce qui se passe si elle est exploitée : l’effet sur la **Confidentiality** (confidentialité), l’**Integrity** (intégrité) et l’**Availability** (disponibilité). **Scope** se situe entre les deux et indique si l’exploitation du composant peut affecter des ressources au-delà de celui-ci. L’outil affiche la valeur retenue pour chaque métrique et sa signification, si bien qu’un vecteur cesse d’être un code opaque.

## Score, gravité et autres groupes

Le score de base calculé se rattache à un niveau qualitatif : aucune, faible, moyenne, élevée ou critique. Deux groupes de métriques facultatifs l’affinent quand ils sont présents : les métriques **Temporal** l’ajustent selon l’état actuel du code d’exploitation et des correctifs, et les métriques **Environmental** repondèrent le score pour votre déploiement particulier, y compris vos propres exigences de confidentialité, d’intégrité et de disponibilité. L’arithmétique suit exactement la spécification du FIRST.org, y compris sa propre règle d’arrondi, si bien que le nombre qu’affiche l’outil correspond à celui du calculateur officiel.

## Utilisation

Collez un vecteur v3.0 ou v3.1 et lisez le score, le niveau de gravité et les métriques décodées. Le calcul est déterministe : un même vecteur donne toujours le même score, car il s’agit de la formule publiée et de rien d’autre.

[PHP2Shell : les vulnérabilités PHP d’octobre 2026](/learn/php-october-2026-vulnerabilities) étudie un cas réel : les mêmes failles ont obtenu 9,8 ou 8,1 en v3.1, selon l’Attack Complexity retenue par chaque évaluateur.

## Partage des résultats

Sous les scores, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient le vecteur tel que saisi après le `#`, une fois que la page l’a décodé. Un vecteur CVSS est un descripteur de gravité public et ne révèle rien de vous. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Ouverture d’un lien.** Le vecteur remplit la zone comme lors d’un collage et la page le décode. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
