## Ce que fait l’outil

PingFederate permet d’écrire des expressions OGNL dans les mappages d’attributs et les critères d’émission, pour les cas où un simple mappage ne suffit pas. L’outil lit l’une de ces expressions et l’explique construction par construction, puis relève ce qui a tendance à casser en production plutôt qu’en test. Il s’exécute dans votre navigateur et n’évalue jamais l’expression.

## Importance du sélecteur de contexte

Un mappage d’attributs et un critère d’émission sont tous deux des expressions, mais ils sont censés renvoyer des choses différentes. Un mappage produit la valeur transmise ensuite dans l’assertion ou le jeton. Un critère produit true ou false, et l’émission n’a lieu que s’il vaut true. Se tromper de contexte est une erreur de configuration courante, et elle ne se manifeste pas bruyamment : un critère qui renvoie une chaîne plutôt qu’un booléen se comportera d’une façon qui ressemble à un problème d’autorisation situé tout à fait ailleurs. Le sélecteur sert à ce que l’outil puisse vous dire quand ce que vous avez écrit ne correspond pas à l’endroit où vous le placez.

## Ce que l’outil explique

Les constructions reconnues sont celles que l’on trouve dans les vrais mappages : lecture d’un attribut par son nom, test de nullité, conversion d’une valeur en chaîne, normalisation de la casse, opérations sur les chaînes qui retirent le domaine d’un nom d’utilisateur ou nettoient des espaces qu’un annuaire traîne depuis 2004, conditions qui fournissent une valeur par défaut, maps littérales qui traduisent des noms de groupes d’annuaire en noms de rôles applicatifs, et projections et sélections qui traitent les attributs multivalués comme l’appartenance à des groupes.

## Les diagnostics, et la raison de chacun

**Attributs lus sans test de nullité.** C’est de loin la cause la plus fréquente d’une expression qui fonctionne en test et échoue en production, et la raison n’a rien de spectaculaire : les comptes utilisés pour les tests sont mieux tenus que l’annuaire. Un attribut toujours présent sur votre propre compte ne l’est pas forcément sur celui de tout le monde ; absent ne veut pas dire vide, et les deux cas se produisent. L’outil nomme les attributs qu’il a vu lire, pour que vous décidiez sur lesquels vous pouvez vraiment compter.

**Appels de méthodes Java statiques.** Des constructions comme `@java.lang.String@format` sont prises en charge et parfois exactement ce qu’il faut. Elles sont aussi la raison pour laquelle la rédaction d’expressions est un rôle d’administration distinct dans le produit : la même construction qui met en forme une date peut atteindre bien plus qu’une date. Le signalement n’invite pas à la supprimer ; il note que cette expression fait quelque chose que seul le rôle dédié aux expressions devrait pouvoir faire.

**Un critère qui ne compare rien.** Si un critère d’émission ne contient aucune comparaison, aucun test d’appartenance et aucune correspondance de motif, il y a peu de chances qu’il renvoie un booléen, quoi qu’il renvoie à la place.

**Un mappage qui transmet simplement un attribut.** C’est légitime, et généralement possible sans aucune expression. Mieux vaut s’en passer quand vous le pouvez, car un mappage simple est visible de tous les administrateurs, alors qu’une expression n’est modifiable que par le rôle dédié aux expressions, et la personne qui la déboguera un jour n’aura peut-être pas ce rôle.

**Des expressions devenues longues.** Les expressions longues sont difficiles à relire, plus encore à transmettre, et invisibles pour quiconque n’a pas le rôle dédié aux expressions, ce qui inclut la plupart des personnes qui en auront un jour la responsabilité.

## Pourquoi l’outil n’évalue jamais rien

Un analyseur d’expressions qui évaluerait les expressions serait un service d’exécution de code, c’est-à-dire précisément ce qui fait de la rédaction d’expressions un privilège contrôlé dans PingFederate lui-même. L’outil analyse et décrit. Pour savoir ce qu’une expression renvoie pour un utilisateur donné, il faut passer par une connexion de test dans un environnement hors production, pas par une page web.

## Partage des résultats

En tête de la lecture, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, l’expression telle que saisie et, lorsqu’il s’agit d’un critère d’émission, son contexte d’utilisation (le mappage d’attributs est la valeur par défaut et n’est donc pas inclus). Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis une mise en garde qui lui est propre : les expressions nomment des attributs réels et parfois des groupes réels, relisez donc l’expression avant d’envoyer le lien. Elle propose ensuite le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

Une expression dans laquelle le contrôle des secrets du site trouve des identifiants écrits sous une forme qu’il reconnaît n’obtient pas de lien, et la fenêtre contextuelle les nomme, avec leur ligne : une clé privée PEM, un en-tête Authorization, un ID de clé d’accès AWS, un JWT, un mot de passe dans une URL ou une valeur FortiOS `ENC`. Remplacez-les par une valeur fictive, puis appuyez de nouveau sur le bouton ; la page explique les mêmes constructions dans les deux cas.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : les valeurs ne sont donc pas envoyées au serveur à l’ouverture du lien ; elles restent dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut les lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** L’expression et son contexte remplissent la page, qui l’explique comme après un collage ; rien n’est évalué, comme toujours, et rien n’est envoyé. Un contexte que la page ne propose pas, ou une expression qui contient des identifiants, fait ignorer tout le lien. Dans les deux cas, les valeurs quittent aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
