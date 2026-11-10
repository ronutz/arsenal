# Générateur de l’option DHCP 43

Indiquez l’adresse d’un contrôleur sans fil et le constructeur des points d’accès, et l’outil renvoie la valeur qu’attend réellement ce constructeur. Tout s’exécute dans le navigateur ; l’adresse ne quitte jamais la page.

## Pourquoi il ne suffit pas de « convertir une IP en hexadécimal »

La RFC 2132 définit l’option 43 comme *Vendor Specific Information* et laisse son contenu à chaque constructeur : « The definition of this information is vendor specific. » Elle ne fait que recommander une structure : un constructeur qui place plus d’un élément dans l’option devrait (SHOULD) l’encoder sous forme d’options encapsulées propres au constructeur (« SHOULD encode the option using “Encapsulated vendor-specific options” »), soit une suite de champs sous-option, longueur et valeur. La signification des sous-options, et la façon d’y écrire une adresse, restent le choix du constructeur. Résultat : un même numéro d’option transporte au moins quatre encodages mutuellement incompatibles, et choisir le mauvais mène au pire mode de défaillance qui soit. Le point d’accès démarre, obtient une adresse, lit une valeur qu’il ne sait pas analyser, et ne rejoint tout simplement jamais le contrôleur. Aucune erreur n’apparaît nulle part.

Les quatre familles :

**TLV binaire** : Cisco et UniFi. L’adresse est insérée sous forme de quatre octets bruts. `192.168.10.5` devient `c0a80a05`.

**TLV ASCII** : RUCKUS. L’adresse est insérée sous forme de *texte*, un octet par caractère, points compris. L’article 000008703 de la base de connaissances RUCKUS formule la règle ainsi : « For each number, the ASCII translation is “3” plus the number in decimal » et « For the “.” character, the ASCII code is “2e” », et son propre exemple écrit `192.168.1.120` sous la forme `060d3139322e3136382e312e313230` : sous-option `06`, longueur `0d` (13 caractères), puis les 13 caractères sous forme de texte. Ainsi, 10 écrit comme un octet binaire donne `0a`, mais écrit comme du texte donne `31 30`. Ce sont des valeurs différentes, et une seule des deux fonctionne pour un constructeur donné.

**Texte dans la sous-option 1** : ExtremeWireless. Le guide de déploiement d’Extreme déclare la sous-option sous la forme `option HAP.HWC code 1 = text;` et son exemple place deux contrôleurs dans une seule valeur, `"10.100.2.36, 10.100.2.22"` : l’outil écrit donc la sous-option `01`, la longueur, puis les adresses sous forme de texte séparées par une virgule et un espace ; cet exemple devient `011831302e3130302e322e33362c2031302e3130302e322e3232`.

**Chaîne simple** : Aruba. Pas d’hexadécimal du tout. Le serveur DHCP envoie l’adresse sous forme de texte, et une valeur hexadécimale est ici fausse, avec quelque soin qu’elle ait été construite.

**Une tout autre option** : FortiAP. Il lit l’adresse du contrôleur dans l’option 138, l’option CAPWAP du contrôleur d’accès : « The FortiAP acquires the IP address of an AC in DHCP option 138 (the factory default) ». Fortinet précise aussi qu’un autre numéro d’option peut être utilisé si celle-ci sert déjà à autre chose sur le réseau, à condition de configurer les points d’accès en conséquence (« If Option 138 is used for some other purpose on your network, you can use a different option number if you configure the AP units to match. »).

## Utilisation

Choisissez d’abord le constructeur. Cet ordre est délibéré : une même adresse produit quatre réponses différentes, si bien qu’il n’y a aucune valeur pertinente à lire tant que le constructeur n’est pas choisi.

Saisissez l’adresse IP d’administration du contrôleur. Cisco en accepte plusieurs, séparées par des espaces ou des virgules, et les encode dans l’ordre ; les autres n’en prennent qu’une.

Le résultat affiche la valeur et, pour les constructeurs qui utilisent l’hexadécimal, le détail octet par octet de son assemblage (sous-option, longueur, puis adresse), pour que vous puissiez vérifier l’arithmétique plutôt que de lui faire confiance. En dessous figurent des lignes prêtes à coller pour ISC dhcpd, Cisco IOS, Windows Server et MikroTik.

## Ce qu’il vous apprend, contrairement à une simple zone hexadécimale

**Quand l’option 60 est aussi nécessaire.** Les points d’accès Aruba ne demandent les informations spécifiques au constructeur que si l’identifiant de classe du fournisseur (vendor class identifier) correspond : l’option 43 sans l’option 60 réglée sur `ArubaAP` ne sert donc à rien. ExtremeWireless a aussi besoin d’un VCI, qui varie selon la génération de point d’accès : les anciens modèles utilisent `HiPath` suivi du nom du modèle, les plus récents le seul nom du modèle.

**Quand la réponse n’est pas de l’hexadécimal.** Pour Aruba, l’outil renvoie une chaîne et le signale, car renvoyer une valeur hexadécimale d’apparence plausible serait pire que de ne rien renvoyer.

**Quand vous vous trompez d’option.** Pour FortiAP, il renvoie l’option 138 et explique pourquoi.

## Partage des résultats

Sous la valeur, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient la ou les adresses du contrôleur telles que saisies (`#input=192.168.1.10`). Le constructeur n’est pas transmis : le lien s’ouvre sur le premier profil, Cisco Wireless LAN Controller, et quand un autre constructeur est choisi, la fenêtre contextuelle nomme celui à sélectionner après l’ouverture. Avant que vous ne copiiez quoi que ce soit, la fenêtre contextuelle ajoute une mise en garde : l’adresse d’administration d’un contrôleur relève de la topologie interne, vérifiez-la donc avant d’envoyer le lien. Tout ce que contient le lien se place après le `#`, une partie que la [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) déclare séparée du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : un navigateur ne l’envoie pas au serveur à l’ouverture du lien, mais elle reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut la lire.

- **Longueur.** Un lien transporte au plus 16 384 caractères, la limite que le site applique à toute valeur placée après le `#` ; une liste d’adresses est bien plus courte.
- **Ouverture d’un lien.** Le lien est la même adresse que celle qu’utilisent les autres liens vers cet outil : les adresses remplissent le champ et sont encodées comme lors d’une saisie. Comme pour tout lien vers cet outil, la valeur reste après le `#` jusqu’à ce que vous modifiiez ou effaciez le champ, puis quitte l’adresse sans aucune requête.

## API

Le même moteur répond à l’opération `/api/v1/dhcp-option-43` de l’API HTTP du site, décrite champ par champ dans le contrat OpenAPI de la [page de l’API](/api), avec des exemples tirés des vecteurs de référence (golden vectors). Le contrat indique aussi si ce site expose l’API.

- **Requête.** `{"vendor": "<id>", "addresses": "<addresses>"}`. Les identifiants de constructeur sont `cisco-wlc`, `ruckus-zonedirector`, `ruckus-smartzone`, `unifi-ip`, `extreme-wireless`, `extreme-cloudiq-switch`, `aruba` et `fortiap` ; les adresses sont séparées par des espaces, des virgules ou des points-virgules.
- **Réponse.** `vendor` (le profil utilisé : `encoding`, `subOption`, `addressForm`, `multiple`, `vendorClass`, `useOption` et `source`), `addresses`, `option` (43, ou 138 pour FortiAP), `encoding`, `hex` ou `text`, `breakdown`, `serverSnippets` et `notes` (codes stables).
- **Erreurs.** HTTP 400, `invalid_input`, avec le message du moteur : aucune adresse, un constructeur inconnu, une adresse qui n’est pas strictement en notation décimale pointée, plus d’une adresse pour un constructeur qui n’en prend qu’une, ou une valeur de plus de 255 octets.

Depuis le 19 octobre 2026, `extreme-wireless` répond par une valeur hexadécimale avec `addressForm` `ascii-list` et `multiple` à true : `{"vendor": "extreme-wireless", "addresses": "10.100.2.36, 10.100.2.22"}` renvoie `011831302e3130302e322e33362c2031302e3130302e322e3232`. `source.access_date` et `source.unreachable` indiquent quand chaque page du constructeur a été lue pour la dernière fois, ou pourquoi elle n’a pas pu l’être.

## Sources

Chaque profil de constructeur est construit à partir de la documentation de ce constructeur, et chaque vecteur de référence cite un document qui imprime ses octets, repris tels qu’imprimés. Un vecteur produit par le code testé puis attribué à un constructeur ne prouverait que l’accord du code avec lui-même : aucun ne l’est. Deux valeurs viennent de sources secondaires et sont signalées comme telles : un exemple Cisco commenté tiré d’un dépôt communautaire sur Cisco Code Exchange, et un exemple RUCKUS tiré d’un message de la communauté RUCKUS. La base de connaissances de RUCKUS ne donne la sous-option que sous la forme « 03 or 06 » ; l’attribution de 3 à ZoneDirector vient d’un message de la communauté RUCKUS, si bien que le vecteur ZoneDirector ne fige que les deux octets qu’impriment les documents.

- RFC 2132, section 8.4, Vendor Specific Information (consulté le 19/10/2026)
- Document Cisco 97066, *Configure DHCP OPTION 43 for Lightweight Access Points*, mis à jour le 22 juillet 2026 (consulté le 19/10/2026)
- Cisco Code Exchange, README de cisco43calc par Brett Verney, un dépôt communautaire (source secondaire ; consulté le 19/10/2026)
- Article 000008703 de la base de connaissances RUCKUS, *Understanding DHCP Option 43 Hexadecimal code in Ruckus*, mis à jour le 6 mai 2020 (consulté le 19/10/2026)
- RUCKUS Networks Community, *How the APs discover the IP address of the controller* et *AP Discovery: How to configure DHCP option 43 to discover the controller*, messages de membres de l’équipe RUCKUS (sources secondaires ; consulté le 19/10/2026)
- Fortinet, *FortiWiFi and FortiAP Configuration Guide* : *Discovering, authorizing, and deauthorizing FortiAP units* (7.2.5) et *Advanced WiFi controller discovery* (8.0.1) (consulté le 19/10/2026)
- Article d’aide Ubiquiti 204909754, *Layer 3 Adoption for Remote UniFi Controllers* (impossible à relire le 2026-10-19 : le site a répondu par un challenge anti-bot)
- Extreme Networks, *ExtremeCloud IQ Controller Deployment Guide*, et le guide d’utilisation de Fabric Engine pour la sous-option 226 (les pages d’ExtremeCloud IQ Controller ont été lues avec un HTTP 200 le 2026-10-18 ; le 2026-10-19, le site de documentation a répondu 401 et n’a pas pu être relu)
- HPE Aruba Networking, options DHCP pour les points d’accès (impossible à relire le 2026-10-19 : accès refusé)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consulté le 27/10/2026) : section 3.5, le fragment, qui transporte les valeurs d’un lien Partager les résultats

## Une omission délibérée

Aerohive n’est pas proposé. Aerohive a été racheté par Extreme en 2019 et intégré à ExtremeCloud IQ, et aucune documentation constructeur n’a pu être trouvée pour une sous-option Aerohive autonome, seulement des affirmations de la communauté. La seule sous-option 226 documentée appartient aux commutateurs Fabric Engine qui dialoguent avec ExtremeCloud IQ, une autre catégorie d’équipements qui répond à une autre question. Une valeur collée dans un DHCP de production est le pire endroit pour avoir à peu près raison : tant qu’aucune source constructeur n’existe, Aerohive reste donc à l’écart. Si vous disposez de cette documentation, il peut être ajouté en un après-midi.
