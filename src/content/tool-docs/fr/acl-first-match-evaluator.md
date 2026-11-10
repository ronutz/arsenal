## Ce que fait l’outil

Collez une liste d’accès IPv4 Cisco IOS ou IOS XE telle que vous la copieriez depuis une configuration, décrivez un paquet, et l’outil indique l’entrée qui statue sur ce paquet. Chaque entrée testée avant celle-ci s’affiche avec le premier champ qui l’a écartée (protocole, adresse source, port source, adresse de destination, port de destination, `established` ou `fragments`) ; si aucune ne correspond, le paquet tombe sur le refus implicite. Une analyse lint lit toute la liste, avec ou sans paquet. Tout est calculé dans votre navigateur à partir du texte collé ; rien n’est appliqué à un équipement.

Ce périmètre est délibéré : **la v1 ne lit que la syntaxe IPv4 de Cisco IOS et IOS XE.** La fin d’une liste relève du comportement de chaque plateforme, pas d’une norme : chez Juniper EX, tout filtre se termine par une suppression implicite (discard), alors qu’Extreme Switch Engine et Fabric Engine autorisent ce qu’aucune règle n’a retenu. L’[article sur les ACL](/learn/access-control-lists-on-switches-and-routers) compare ces plateformes, sources à l’appui.

## Syntaxe prise en charge

- **Listes numérotées** : lignes `access-list`, standard de 1 à 99 et de 1300 à 1999, étendues de 100 à 199 et de 2000 à 2699, ainsi que leurs lignes `remark`.
- **Listes nommées** : un bloc `ip access-list standard NAME` ou `ip access-list extended NAME`, des entrées avec ou sans numéro de séquence, des lignes `remark`. Un nom commence par une lettre ; un numéro de la bonne plage désigne la même liste que les lignes `access-list` portant ce numéro. Plusieurs listes collées ensemble sont lues ; des boutons permettent de choisir celle à évaluer.
- **Adresses** : `any` (0.0.0.0 255.255.255.255), `host A` (A 0.0.0.0), une adresse et son masque générique (wildcard) et, dans une entrée standard, une adresse seule, qui prend 0.0.0.0 comme masque. Les bits à 1 du masque générique sont ignorés et n’ont pas besoin d’être contigus.
- **Protocoles** : `ip` (tous les protocoles), un nombre de 0 à 255, et les mots-clés dont une source donne le numéro : `icmp` 1, `igmp` 2, `tcp` 6, `udp` 17, `gre` 47, `esp` 50, `eigrp` 88, `pim` 103 (IANA, même mot-clé) et `ospf` 89 (RFC 2328). Cisco accepte aussi `ahp`, `ipinip`, `nos` et `pcp` ; aucune des sources consultées ne donne leur numéro, si bien qu’une ligne qui en emploie un est listée avec ce motif, et vous pouvez écrire le numéro à la place.
- **Ports**, après `tcp` ou `udp` uniquement : `eq` et `neq` avec jusqu’à 10 ports, `lt`, `gt` et `range` (bornes incluses). Un opérateur placé après la source teste le port source, placé après la destination le port de destination. Un port est un nombre de 0 à 65535 ou un nom de la liste TCP ou UDP du modèle de données IOS XE 17.18.1 de Cisco (`www` vaut TCP 80, `domain` 53 sur l’un comme sur l’autre, `snmp` UDP 161…) ; un nom TCP ne fonctionne qu’avec `tcp`, un nom UDP qu’avec `udp`.
- **Options** : `established` (TCP uniquement : une correspondance exige ACK ou RST à 1), `fragments` (l’entrée ne s’applique qu’aux fragments non initiaux), `log` et `log-input`.

Les lignes que l’outil ne lit pas sont listées sous le résultat avec leur motif, jamais écartées en silence : groupes d’objets (object groups), types de message ICMP et IGMP, `dscp`, `precedence`, `tos`, `time-range`, `option`, `ttl`, indicateurs TCP autres que `established`, entrées `dynamic` et réflexives, noms d’hôte, commandes `no`, `ip access-list resequence`, `ip access-group` (qui applique une liste) et sortie de `show access-lists`. Quand une telle ligne ressemble à une entrée, le résultat précise que le verdict ne couvre que les entrées lues.

## Parcours de la liste

Cisco évalue une liste **par numéro de séquence**, et la première entrée qui correspond décide ; rien n’est lu après elle. L’outil teste les entrées dans cet ordre :

- Une entrée saisie sans numéro reçoit le numéro le plus élevé de sa liste plus 10 (10 pour la première) et se place à la fin. Un numéro déjà présent dans la liste est refusé (Cisco répond `Duplicate sequence number`), et une entrée identique à une entrée existante, numéro mis à part, ne change rien ; ces deux cas sont listés comme lignes non lues.
- Dans une liste **standard**, Cisco range dans une table de hachage les entrées qui désignent un seul hôte et y cherche la source avant de parcourir les autres entrées. Le parcours suit cet ordre et le signale quand une entrée d’hôte est testée avant un numéro de séquence inférieur.
- Une entrée **standard** ne teste que l’adresse source : le protocole, la destination et les ports du paquet n’interviennent pas.
- Si rien ne correspond, le paquet est refusé par le refus implicite, que Cisco documente comme l’instruction deny non écrite qui termine toute liste d’accès.
- Une liste sans entrée ne reçoit pas de verdict de refus implicite : Cisco documente qu’une interface à laquelle est appliquée une liste d’accès vide autorise tout le trafic.

Le paquet de test est un paquet non fragmenté : une entrée avec `fragments` ne lui correspond jamais.

## Analyse lint

- **Masquée (shadowed)** : une entrée antérieure correspond à tous les paquets que celle-ci retiendrait, avec l’action inverse ; celle-ci ne décide donc jamais rien.
- **Redondante** : une entrée antérieure correspond à tous les paquets que celle-ci retiendrait, avec la même action ; ou bien une entrée postérieure le fait, et aucune entrée intermédiaire ne décide autrement pour l’un de ces paquets. La supprimer ne change rien.
- **Ne fait que répéter le refus implicite** : une entrée deny qu’aucune entrée permit postérieure ne recouvre. Elle ne change aucun verdict, mais son compteur (ou son `log`) rend le trafic visible.
- **Ne correspond jamais** : un test de port qu’aucun port ne satisfait, comme `lt 0`.
- **Masque générique non contigu** : légal chez Cisco, mais signalé, car aucune longueur de préfixe ne peut l’exprimer et ses adresses ne forment pas un bloc.
- **Bits ignorés** : une adresse dont des bits sont à 1 là où son masque générique les ignore (`10.1.1.5 0.0.0.255` correspond à 10.1.1.0/24).
- **Portée d’une liste standard** : ses entrées ne testent que la source, si bien que chacune décide pour tout ce qu’envoient ces sources.

L’analyse lint raisonne sur les fragments non initiaux autant que sur les paquets entiers, car Cisco ne les teste pas de la même façon : une entrée deny avec des ports ou `established` ne s’applique pas à un fragment non initial, et l’entrée suivante est traitée. Une entrée placée sous un tel deny est donc dite masquée « pour tout paquet non fragmenté », avec le motif, plutôt que masquée tout court.

Chaque adresse de chaque entrée s’affiche telle qu’écrite, sous forme d’adresse et de masque générique avec les bits ignorés remis à zéro, sous forme de préfixe en notation RFC 4632 quand le masque est contigu, et avec le nombre d’adresses auxquelles elle correspond.

## Ce que l’outil ne peut pas savoir

- Ce que contient l’équipement. L’outil lit le texte collé ; une ligne qu’il ne lit pas peut tout de même être une entrée sur l’équipement.
- Où la liste est appliquée, et dans quel sens. Port, VLAN ou interface routée, en entrée ou en sortie : cela décide des paquets qui rencontrent la liste ; l’article explique les points d’application.
- Les limites matérielles. Une liste correcte à la lecture peut malgré tout ne pas tenir dans la TCAM du commutateur.
- Les autres plateformes. Leur syntaxe et leur fin de liste diffèrent ; la v1 ne les lit pas.

## Exemples

Le bouton Exemple charge la liste du lab du chapitre 4.3 de la formation LAN Switch Operations and Maintenance : autoriser SSH depuis 10.1.10.0/24 vers le réseau d’administration 10.1.99.0/24, refuser tout le reste vers 10.1.99.0/24, autoriser le reste, sous la forme `ip access-list extended MGMT-PROTECT` avec les numéros de séquence 10, 20 et 30. Son paquet est un flux SSH venant du VLAN 20 (TCP 10.1.20.25 port 51514 vers 10.1.99.10 port 22) : l’entrée 10 échoue sur l’adresse source et l’entrée 20 le refuse. Remplacez la source par 10.1.10.25 et l’entrée 10 l’autorise ; inversez les deux premières entrées et SSH depuis le VLAN 10 est refusé, l’entrée permit étant signalée comme masquée. Les vecteurs de référence (golden vectors) couvrent la première correspondance sur chaque champ, chaque opérateur de port à ses bornes, les listes standard et étendues, l’ordre de hachage, les numéros de séquence dans le désordre, les deux sortes de redondance et les lignes non lues ; l’un d’eux reprend l’exemple de masque non contigu de la documentation d’Extreme Fabric Engine (3.4.5.6 avec 255.255.255.0 correspond à 192.168.1.6 et pas à 3.4.5.7), écrit à la manière de Cisco.

## API

Le même moteur répond à l’opération `/api/v1/acl-first-match-evaluator` de l’API HTTP du site, décrite dans le contrat OpenAPI de la [page API](/api), qui indique aussi si ce site sert l’API.

- **Requête.** La liste d’accès en texte (lue et soumise à l’analyse lint), ou un objet JSON `{"acl": "...", "packet": {"protocol": "tcp", "source": "10.1.20.25", "destination": "10.1.99.10", "sourcePort": 51514, "destinationPort": 22, "ackOrRst": false}, "list": "MGMT-PROTECT"}` (et parcourue pour ce paquet). `packet` et `list` sont facultatifs ; les ports peuvent être des nombres ou des chaînes.
- **Réponse.** `lists` (chacune avec `name`, `kind`, `line`, `entries`, `evaluationOrder` et `remarks` ; chaque entrée avec `seq`, `seqGiven`, `line`, `text`, `action`, `protocol`, `source`, `sourcePort`, `destination`, `destinationPort`, `established`, `fragments`, `log` et `hashed` ; chaque adresse avec `written`, `form`, `address`, `wildcard`, `base`, `contiguous`, `prefix`, `addresses` et `ignoredBitsSet`), `selected`, `issues` (`line`, `text`, `entryLike`, `reason`), `packet`, `packetErrors`, `steps` (`seq`, `line`, `text`, `action`, `matched`, `field`, `reason`), `verdict` (`action`, `by` : `entry`, `implicit-deny` ou `empty-list`, `seq`, `line`, `text`, `sentence`), `lint` (`kind`, `seq`, `line`, `other`, `sentence`), `notes` et `counts`.
- **Erreurs.** HTTP 400 pour une requête qui commence par `{` sans être du JSON valide ou sans chaîne `acl`, et pour un texte de plus de 65 536 caractères ou de 4000 lignes. Une ligne illisible, ou un paquet illisible, n’est pas une erreur HTTP : `issues` et `packetErrors` en donnent la raison.

## Partage des résultats

Sous le verdict, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, la liste d’accès telle que collée (`input`) et le paquet de test tel que saisi (`protocol`, `source`, `srcport`, `destination`, `dstport`, et `ackrst` quand la case est cochée), plus `list` si vous avez choisi une autre liste que la première. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis une mise en garde qui lui est propre (une liste d’accès nomme des réseaux et des hôtes internes, et ce qui peut les joindre), puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

La liste passe aussi par le contrôle des secrets du site : une valeur que son format désigne comme des identifiants (un mot de passe dans une URL, une clé privée PEM, un JWT), dans une remarque ou ailleurs, empêche la création du lien, et la fenêtre contextuelle indique sa ligne. Remplacez-la par une valeur fictive, puis appuyez de nouveau sur le bouton.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 02/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** La liste et chaque champ du paquet se remplissent tels que saisis et la page les lit ; aucun serveur n’est contacté. Une valeur de paquet que l’outil ne sait pas lire affiche le même message qu’à la saisie. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.

## Sources

- [Cisco, Security and VPN Configuration Guide, Cisco IOS XE 17.x: IP Access List Entry Sequence Numbering](https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/sec-vpn/b-security-vpn/m_sec-acl-seq-num.html) (consulté le 02/11/2026 ; VPN signifie réseau privé virtuel, virtual private network) : première correspondance, paquet supprimé quand aucune condition ne correspond (« If no conditions match, the packet is dropped »), liste vide, numéros de séquence attribués de 10 en 10, doublons refusés, entrées d’hôte standard hachées et consultées en premier
- [Cisco, ACLs Configuration Guide, Cisco IOS XE 17 (Catalyst 9000): Access Control Lists](https://www.cisco.com/c/en/us/td/docs/switches/lan/c9000/security/acls/acls-configuration-guide/access-control-lists.html) (consulté le 02/11/2026) : le numéro de séquence, qui fixe l’ordre d’évaluation des entrées (« dictates the order in which ACEs are evaluated »), remarques, syntaxe numérotée et plages, opérateurs de port, `established`
- [Cisco IOS Security Command Reference, Commands A to C](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/security/a1/sec-a1-cr-book/sec-cr-a2.html) (consulté le 02/11/2026) : `access-list (IP extended)` et `access-list (IP standard)` : protocoles, bits du masque générique, opérateurs et noms de port, `established`, `fragments`, `log`, refus implicite
- [Cisco, IOS XE 17.18.1 YANG model Cisco-IOS-XE-acl](https://raw.githubusercontent.com/YangModels/yang/main/vendor/cisco/xe/17181/Cisco-IOS-XE-acl.yang) (consulté le 02/11/2026) : `eq` et `neq` avec jusqu’à 10 ports, numéros de séquence de 1 à 2147483647, remarques de 1 à 100 caractères
- [Cisco, IOS XE 17.18.1 YANG model Cisco-IOS-XE-types](https://raw.githubusercontent.com/YangModels/yang/main/vendor/cisco/xe/17181/Cisco-IOS-XE-types.yang) (consulté le 02/11/2026) : plages de numéros de liste, noms de ports TCP et UDP avec leurs numéros
- [Cisco, End-of-Sale and End-of-Life Announcement for the Cisco IOS XE 17.18.x](https://www.cisco.com/c/en/us/products/collateral/ios-nx-os-software/ios-xe-17/ios-xe-17-18-x-eol.html) (consulté le 02/11/2026) : versions de maintenance logicielle jusqu’au 29 avril 2028, correctifs de sécurité jusqu’au 30 septembre 2029
- [RFC 4632, Classless Inter-domain Routing (CIDR)](https://www.rfc-editor.org/rfc/rfc4632.txt) (consultée le 02/11/2026) : notation des préfixes et masques contigus
- [IANA, Assigned Internet Protocol Numbers](https://www.iana.org/assignments/protocol-numbers/protocol-numbers-1.csv) (consulté le 02/11/2026) : les numéros de protocole derrière les mots-clés
- [RFC 2328, OSPF Version 2](https://www.rfc-editor.org/rfc/rfc2328.txt) (consultée le 02/11/2026) : « OSPF is IP protocol number 89 »
- [Juniper Networks, Understanding how firewall filters are evaluated (EX Series)](https://www.juniper.net/documentation/us/en/software/junos/routing-policy/topics/concept/firewall-filter-ex-series-evaluation-understanding.html) (consulté le 02/11/2026) : la suppression implicite (discard) à la fin de chaque filtre
- [Extreme Networks, Switch Engine v33.7.1 User Guide (PDF)](https://documentation.extremenetworks.com/Switch%20Engine%20v33.7.1%20User%20Guide/downloads/Switch_Engine_33_7_1_User_Guide.pdf) (consulté le 02/11/2026) : un paquet qu’aucune entrée ne retient est autorisé (« If a packet matches no rule entries in the ACL, it is permitted »)
- [Extreme Networks, Fabric Engine v9.4 User Guide, access control lists](https://documentation.extremenetworks.com/Fabric%20Engine%20v9.4%20User%20Guide/fe_9.4_ug_revacdev/content/documents/Switch_Operating_Systems/VOSS_and_Fabric_Engine/fabric_engine_user_guide/access_control_lists.shtml) (consulté le 02/11/2026) : l’action par défaut est l’autorisation (« The default action mode for ACLs is permit »)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax, section 3.5](https://www.rfc-editor.org/rfc/rfc3986#section-3.5) (consultée le 02/11/2026) : le fragment, sur lequel repose le partage des résultats
