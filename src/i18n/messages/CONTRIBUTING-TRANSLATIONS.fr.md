# Contribuer à la traduction

ronutz.com est conçu pour que l’ajout ou l’amélioration d’une langue demande très peu d’effort, et les contributions sont les bienvenues. Une langue tient en deux éléments : une entrée dans le registre des langues et un pack de messages au format JSON. Aucune modification du code de l’application n’est nécessaire.

## Fonctionnement du système

- **Les packs.** Le texte de chaque langue se trouve dans un seul fichier JSON de phrases étiquetées, `src/i18n/messages/<code>.json`. La page Contribuer propose en téléchargement chaque pack en ligne, et les fichiers proposés sont copiés depuis les packs sources à chaque build : ils sont donc toujours à jour. `en.json` est la référence complète ; les autres packs n’ont besoin que des phrases qu’ils traduisent.
- **Repli sur l’anglais.** Toute phrase absente d’un pack s’affiche en anglais. Une traduction partielle est donc utile tout de suite : elle est publiée, et les phrases manquantes restent lisibles en anglais jusqu’à ce que quelqu’un les complète.
- **Le registre.** `src/i18n/locales.ts` recense chaque langue avec son nom dans la langue elle-même, son sens d’écriture et le statut de sa traduction. Le sélecteur de langue, les adresses web et les métadonnées de recherche en découlent tous.

## Statut de la traduction

Chaque langue porte un `status` :

| Statut | Signification |
|---|---|
| `reviewed` | Une personne dont c’est la langue maternelle a lu et approuvé le pack. |
| `machine-draft` | Un premier jet produit avec l’IA ou par traduction automatique, pas encore relu par une personne de langue maternelle. |
| `stub` | Pas encore de pack ; la langue s’affiche en anglais. |

Un texte dont le premier jet vient d’une machine n’est jamais présenté comme un texte natif abouti. Un `machine-draft` est un point de départ qu’une personne de langue maternelle fait passer à `reviewed`. L’anglais est la langue source. Le portugais du Brésil est rédigé avec l’IA et relu progressivement, tout comme l’interface et les outils en espagnol, en allemand et en français ; la section Apprendre et les autres sections de contenu en espagnol, en allemand et en français, ainsi que les onze autres langues, sont des traductions automatiques. C’est pourquoi le portugais du Brésil, l’espagnol, l’allemand et le français conservent le statut `machine-draft` et leur avertissement jusqu’à ce qu’une relecture humaine atteste le contraire.

## Améliorer une langue en quatre étapes

1. **Téléchargez le pack** que vous voulez améliorer depuis la page Contribuer (pour une nouvelle langue, téléchargez `en.json`, la référence).
2. **Traduisez le texte qui suit chaque étiquette.** Modifiez uniquement les valeurs. Ne changez jamais une étiquette (la clé à gauche), et laissez tout ce qui se trouve entre accolades exactement tel quel : le site remplit lui-même `{count}`, `{name}` et leurs semblables, et une accolade modifiée casse la page. Gardez tels quels les noms de produits et les noms techniques (BIG-IP, CIDR, F5, Fortinet, etc.), et écrivez le jargon technique tel que le métier l’emploie réellement dans votre langue.
3. **Indiquez le statut** dans le champ `_meta.status` du pack : `machine-draft` pour un premier jet produit avec l’IA ou par traduction automatique, `reviewed` si c’est votre langue maternelle et que vous avez vérifié le texte.
4. **Renvoyez-le.** Envoyez le fichier modifié par e-mail depuis la page Contribuer en précisant la langue, ou ouvrez une pull request dans le dépôt public. Chaque contribution est relue à la main.

## Ponctuation

- **L’anglais** s’écrit sans tiret cadratin (em dash). À sa place, employez une virgule, un deux-points, des parenthèses ou une nouvelle phrase ; le tiret demi-cadratin (en dash) n’apparaît qu’entre les nombres d’un intervalle (10–20).
- **Toutes les autres langues gardent leur propre ponctuation naturelle.** N’importez pas la règle de l’anglais : les langues romanes et slaves emploient leur tiret (le travessão portugais, la raya espagnole, le тире russe) là où leur propre typographie le demande ; l’allemand et les langues scandinaves emploient le tiret demi-cadratin entouré d’espaces ; le chinois emploie ses signes natifs pleine chasse (，。：；) et son propre tiret double chasse. Le français garde son espace insécable avant ; : ! et ?.

## Remarques

- **Les langues qui s’écrivent de droite à gauche** (l’arabe, par exemple) sont prises en charge par la mise en page ; le sens d’écriture vient du registre, vous n’avez donc qu’à traduire le texte.
- **Les packs partiels sont les bienvenus.** Traduire seulement la navigation et la page d’accueil constitue déjà une première contribution précieuse.
- **Une langue qui ne figure pas encore dans le registre ?** Ajoutez une ligne à `LOCALES` dans `src/i18n/locales.ts` avec le code, le nom dans la langue elle-même, le nom en anglais, le sens d’écriture et `status: "stub"`, puis ajoutez votre pack ; ou demandez-le par e-mail, et la langue sera ajoutée pour vous.
