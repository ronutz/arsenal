## Ce que fait l’outil

Cet outil décode la spec d’un origin_pool F5 Distributed Cloud (XC). Collez l’objet origin_pool issu de la vue JSON de la console, le corps de sa spec ou une enveloppe create/get : l’outil expose ce que fait réellement le pool, c’est-à-dire le type et l’adresse de chaque serveur d’origine, le port du pool, l’algorithme d’équilibrage de charge et la sélection des endpoints, les contrôles de santé qu’il référence et les paramètres TLS vers l’origine. Tout s’exécute dans votre navigateur.

## Serveurs d’origine : type et emplacement

Un origin pool peut désigner ses origines de plusieurs façons, et l’outil nomme chacune. Une IP publique ou un nom DNS public atteint les origines par Internet. Une IP ou un nom DNS « on given sites » atteint les origines via un Customer Edge ou un Regional Edge, et porte un localisateur de site ou de site virtuel : l’outil affiche cet emplacement. Les noms de service K8s et Consul s’appuient sur la découverte de services d’un site. Il existe aussi des variantes réseau virtuel et endpoint personnalisé. Chaque origine peut en outre porter des labels, que l’outil liste.

## L’emplacement réel des poids et des priorités

Une idée reçue veut que les serveurs d’origine d’un pool aient des poids et des priorités. Ce n’est pas le cas. À l’intérieur d’un pool, les serveurs d’origine forment une liste à plat, servie selon l’algorithme du pool. Les poids et les priorités se définissent un niveau au-dessus, sur la référence au pool dans une route ou dans les pools par défaut de l’équilibreur de charge : chaque référence associe un pool, un poids et une priorité. L’outil le précise pour que vous cherchiez au bon endroit.

## Le port du pool et la sélection des endpoints

Le port peut être explicite, repris de l’endpoint ou automatique ; automatique signifie 443 quand le TLS vers l’origine est activé, 80 sinon. La sélection des endpoints détermine par quel Regional Edge le trafic sort vers l’origine : Local Preferred (la valeur par défaut) sort par le RE local quand celui-ci dispose d’une entrée d’origine saine, et sinon transmet le trafic par le réseau global de F5 à un RE qui en dispose. C’est pourquoi la même origine peut apparaître plusieurs fois dans la console, une fois par RE.

## TLS vers l’origine

Si le TLS vers l’origine est activé, l’outil décode le niveau de sécurité (avec les données de niveaux de l’outil Suites de chiffrement par niveau de sécurité TLS : High correspond donc au minimum à TLS 1.2), ainsi que le mode SNI (utiliser l’en-tête Host, une valeur explicite ou pas de SNI), le choix de vérification du serveur et l’activation ou non du mTLS. Il signale le cas qui compte le plus : l’absence de vérification du serveur d’origine. La connexion reste chiffrée, mais le certificat de l’origine n’est pas validé : l’outil le met donc en évidence.

## Partage des résultats

Sous les serveurs d’origine, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, une copie du pool, jamais le pool tel que collé. Un pool avec mTLS vers ses origines contient la clé privée de chaque certificat client, en PEM non chiffré, éventuellement protégée par BlindFold (« TLS Private Key data in unencrypted PEM format ... may be optionally secured using BlindFold », [référence de l’API XC pour l’origin pool](https://docs.cloud.f5.com/docs-v2/api/views-origin-pool), consultée le 01/11/2026). Le schéma de F5 Distributed Cloud signale ces secrets : SecretType, qui sert à indiquer dans un objet un champ sensible ou confidentiel (« used in an object to indicate a sensitive/confidential field »), contient le secret soit en clair (`clear_secret_info.url`, avec cette précision : « For string:/// scheme, Secret needs to be encoded Base64 format »), soit chiffré par Blindfold (`blindfold_secret_info.location`). La page lit si le mTLS est activé, jamais la clé. La copie remplace donc chaque secret SecretType par `[redacted]`, et conserve tous les autres octets tels que collés. Avant que le lien soit proposé, la page relit la copie, qui doit donner la même lecture, sinon il n’y a pas de lien ; la copie est ensuite examinée à la recherche d’identifiants encore présents (une clé privée hors SecretType, la valeur d’un comparateur d’en-tête `Authorization`, un JWT, un mot de passe dans une URL, détectés comme dans les autres outils du site) : un seul suffit à empêcher le lien, et la fenêtre contextuelle nomme sa ligne ; une valeur dont seul le nom évoque un secret est, elle, simplement nommée dans la fenêtre contextuelle.

Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas. Elle indique aussi combien de valeurs ont été remplacées, et qu’un pool nomme ses serveurs d’origine, leurs adresses et leurs sites. Aucune option ne permet d’inclure les valeurs remplacées : un pool ne contient aucune valeur d’en-tête ou de cookie, et les secrets que définit le schéma ne sont jamais envoyés.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** La copie remplit la zone comme le ferait un collage, et la page la lit. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
