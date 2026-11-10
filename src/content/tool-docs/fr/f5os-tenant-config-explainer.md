## Ce que fait l’outil

Collez un bloc `f5-tenants:tenants`, sous sa forme CLI ou en JSON RESTCONF : l’outil vous le relit, avec l’état du cycle de vie et sa signification, l’image et la plateforme à laquelle elle appartient, les lames et les VLAN, et l’explication de chaque champ. Local et hors ligne : il analyse le texte et ne contacte aucune plateforme.

## Le contrôle qui en fait plus qu’un glossaire

F5 publie la mémoire minimale sous la forme **(3,5 × 1024 × vCPU) + 512** : deux vCPU exigent donc 7680 Mo, et quatre en exigent 14 848. L’outil calcule ce minimum et **l’affiche à côté de la valeur configurée**, avec un avertissement quand l’allocation est inférieure.

Il avertit aussi quand un nombre de vCPU apparaît sans valeur de mémoire, car **les deux vont de pair** : augmenter seulement les cœurs laisse le tenant sous son nouveau minimum.

## La règle de cycle de vie qu’il énonce

**Pour modifier les vCPU ou la mémoire d’un tenant déployé, vous devez d’abord le repasser à l’état `provisioned`**, faire la modification, puis le remettre à l’état `deployed`. Ce n’est pas une opération à chaud, et l’outil le rappelle sur chaque tenant déployé au lieu d’attendre qu’on le lui demande.

## Forme de la plateforme

L’outil signale ce qui relève de quelle machine. **VELOS** est un châssis, où `nodes` désigne des lames au sein d’une partition de châssis, et un tenant peut s’étendre sur plusieurs d’entre elles. **rSeries** est une appliance sans partitions ni lames, et `vcpu-cores-per-node` doit être un multiple de quatre. Un tenant VELOS valide à deux vCPU **ne sera pas validé (commit) sur un rSeries**, et un bundle d’image nommé `ALL-VELOS` ne s’y déploiera pas non plus, ce que l’outil signale à partir du seul nom de fichier.

## Ce que l’outil ne fait pas

Il ne peut pas savoir quelle part de votre plateforme est déjà allouée : il valide donc un tenant par rapport à la formule publiée, et non par rapport à la capacité restante. Savoir si la lame dispose de la mémoire libre est une question qui relève de la plateforme.

## Partage des résultats

Sous la synthèse, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, la zone telle que saisie, et rien d’autre. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis ajoute une mise en garde qui lui est propre : le bloc nomme l’adresse d’administration, la passerelle et les VLAN du tenant, relisez-le donc avant d’envoyer le lien. Elle propose ensuite le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

Un bloc de tenant ne contient ni mot de passe ni clé : la [référence du cycle de vie des tenants de l’API VELOS](https://clouddocs.f5.com/api/velos-api/api-chassis-tenant.html) de F5 (consultée le 27/10/2026) configure un tenant avec son nom, son type, son image, ses nœuds, son adresse d’administration, sa longueur de préfixe, sa passerelle, ses VLAN, ses cryptos, ses vCPU, sa mémoire, son état d’exécution et son appliance mode. Les identifiants qu’utilise cette page appartiennent à la requête d’API, pas au bloc.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : le texte n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** Le texte remplit la zone comme le ferait un collage et la page le lit ; rien n’est envoyé nulle part. La valeur quitte ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
