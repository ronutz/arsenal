# Ordre d’évaluation des politiques PAN-OS

Collez une base de règles qui couvre les couches Panorama et les règles locales du pare-feu. L’outil la remet dans l’ordre où PAN-OS l’évalue réellement, suit au besoin un flux jusqu’à la règle qui le décide, et signale les règles qui ne se déclenchent jamais parce qu’une règle située au-dessus correspond déjà. Tout s’exécute dans le navigateur.

## Le problème traité

Un pare-feu autonome évalue une seule liste ordonnée, facile à lire. Ce n’est pas le cas d’un pare-feu géré par Panorama ni d’un tenant Prisma Access, qui évaluent par couche et par type, dans cet ordre :

1. Pré-règles partagées
2. Pré-règles du device group
3. **Règles locales du pare-feu**
4. Post-règles du device group
5. Post-règles partagées
6. Règles par défaut

Les règles locales, visibles et modifiables sur le pare-feu, sont prises en sandwich entre des couches qu’il est impossible de modifier depuis le pare-feu. C’est la surprise la plus courante dans un parc géré par Panorama : une règle locale en apparence parfaitement correcte ne s’exécute jamais, parce qu’une pré-règle partagée, deux couches plus haut, a déjà correspondu et que l’évaluation s’est arrêtée là.

## Masquage, et pourquoi les outils du constructeur ne le signalent pas

Le document de Palo Alto sur les bonnes pratiques de politique de sécurité reconnaît explicitement cette lacune :

> Commit and Push doesn't provide shadowing information.

Une règle large placée au-dessus d’une règle précise capte le trafic pour lequel la règle précise a été écrite. Celle-ci ne se déclenche jamais. Rien ne vous avertit lors du push, et le symptôme apparaît plus tard : du trafic traité d’une façon que personne n’avait voulue.

L’outil signale le masquage (shadowing) et distingue deux cas. **Le franchissement d’une couche** compte, car une règle locale masquée par une pré-règle partagée ne peut être ni vue ni corrigée depuis le pare-feu ; la correction se fait dans Panorama. **Une action différente** compte, car le résultat n’est alors pas seulement redondant : il est l’inverse de ce pour quoi la règle masquée a été écrite.

Le test de masquage est volontairement prudent. Il ne signale une règle comme masquée que si la règle située au-dessus en est un sur-ensemble sur chacun des champs : tout paquet auquel la règle inférieure pourrait correspondre est alors déjà pris. Les chevauchements partiels ne sont pas signalés, car un chevauchement partiel est souvent voulu, et un rapport de masquage qui crie au loup est un rapport que personne ne lit, ce qui serait pire que la position actuelle du constructeur, qui consiste à ne rien signaler.

## Des règles par défaut asymétriques

Au bas de chaque base de règles se trouvent deux règles par défaut, qui font l’inverse l’une de l’autre :

- **intrazone-default** autorise tout le trafic à l’intérieur d’une zone
- **interzone-default** refuse tout le trafic entre zones

Un modèle qui traiterait « aucune correspondance » comme un refus implicite unique se tromperait pour chaque flux interne à une zone. L’outil applique la règle par défaut qui convient aux zones et indique celle qu’il a utilisée.

Les deux peuvent être modifiées pour journaliser ou appliquer des profils de sécurité, ce qui vaut la peine : le trafic qui atteint les règles par défaut est un trafic qu’aucune règle n’avait prévu.

## Écriture d’une base de règles pour l’outil

Une règle par ligne. La couche vient en premier, délibérément : c’est précisément ce que l’outil a pour but de révéler, et une grammaire qui permettrait de l’omettre vous laisserait oublier ce que vous cherchiez justement à vérifier.

```
shared-pre | block-tor      | deny  | from=any to=any app=tor
dg-pre     | allow-dns      | allow | from=trust to=untrust app=dns svc=application-default
local      | web-out        | allow | from=trust to=untrust app=web-browsing
dg-post    | catch-all-deny | deny  | from=any to=any
```

Les champs s’écrivent `key=value`, avec des virgules dans une valeur pour les listes. Tout champ omis vaut `any`, comme dans PAN-OS. Clés acceptées : `from`, `to`, `src`, `dst`, `app`, `svc`, `user`. Les actions sont `allow`, `deny`, `drop`, `reset-client`, `reset-server`, `reset-both`.

## Ce que l’outil ne fait pas

L’outil ne lit pas votre configuration, ne se connecte pas à Panorama et ne collecte rien. Il ne modélise ni le changement d’App-ID en cours de session, ni les profils de sécurité, ni la traduction d’adresses réseau (NAT, Network Address Translation), ni la politique de déchiffrement. Il raisonne sur l’**ordre** des règles que vous lui donnez, c’est-à-dire la partie fixée au moment du commit, et celle qui est difficile à voir.

## Remarque sur l’autorisation

Ce site ne revendique aucune autorisation ni aucun partenariat de Palo Alto Networks. L’outil raisonne sur l’ordre d’évaluation publié dans la documentation de Palo Alto elle-même. Il s’agit de l’analyse d’une spécification publique, pas d’un document du constructeur, et l’outil ne bénéficie d’aucune caution de sa part.

## Partage des résultats

Sous l’ordre d’évaluation, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient la base de règles telle que saisie (`#input=...`). Le flux que vous suivez n’y figure pas, et la fenêtre contextuelle le précise quand un suivi est actif. Avant toute copie, la fenêtre contextuelle ajoute une mise en garde : une base de règles nomme vos zones, vos adresses et vos utilisateurs, relisez-la donc avant d’envoyer le lien. Tout ce que contient le lien se place après le `#`, que la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) décrit comme séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : un navigateur ne l’envoie pas au serveur à l’ouverture du lien, mais il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Un lien contient au plus 16 384 caractères, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur qu’il aurait.
- **Ouverture d’un lien.** Le lien est la même adresse que celle qu’utilisent les autres liens vers cet outil : les règles remplissent la zone et sont évaluées comme après un collage. Comme pour tout lien vers cet outil, la valeur reste après le `#` jusqu’à ce que vous modifiiez ou effaciez le champ, puis quitte l’adresse sans aucune requête.

## Sources

- Palo Alto Networks, *Device Groups* : un pare-feu évalue les règles de politique par couche et par type, de haut en bas ; les règles locales du pare-feu s’affichent entre les pré-règles et les post-règles
- Palo Alto Networks, *Security Policy Rulebase Best Practices* : la première correspondance l’emporte et la comparaison s’arrête ; Commit and Push ne fournit pas d’informations sur le masquage
- Palo Alto Networks, *Security Policy Rule Best Practices* : définition du masquage ; intrazone-default autorise et interzone-default refuse
- Palo Alto Networks, *Defining Policies on Panorama* : les pré-règles sont évaluées en premier, les post-règles en dernier
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consultée le 27/10/2026) : section 3.5, le fragment, qui contient les valeurs d’un lien créé par Partager les résultats
