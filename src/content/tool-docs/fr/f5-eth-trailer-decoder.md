## Ce que fait l’outil

Collez la section F5 Ethernet Trailer telle que Wireshark l’affiche, ou les octets bruts du trailer en hexadécimal : l’outil explique chaque champ, à savoir le sens, le slot et le TMM, le serveur virtuel, les identifiants de flux et de flux homologue (peer), et la cause de RST donnée par l’équipement lui-même. Local et hors ligne : il analyse le texte que vous collez et ne contacte rien.

## L’intérêt de lire le trailer

Exécutez tcpdump **sur** un BIG-IP avec les options de bruit (noise) (`:n` faible, `:nn` moyen, `:nnn` élevé, avec `-s0`), et chaque trame contient le compte rendu que fait l’équipement de ce paquet. C’est la **cause de RST** qui justifie l’exercice : une capture sans elle montre qu’une connexion est morte ; avec elle, l’équipement vous dit qu’il a lui-même coupé la connexion, et pourquoi.

## Ce sur quoi l’outil vous met en garde

**Les identifiants de flux (flow ID) ne sont uniques qu’au sein d’une combinaison slot et TMM, et ils sont réutilisés.** Le même identifiant peut apparaître sur des paquets sans rapport entre eux, plus tôt ou plus tard dans une même capture. L’outil le rappelle à chaque décodage, car un identifiant de flux tenu pour unique globalement conduit à une conclusion fausse, tirée avec assurance.

Il indique aussi `f5ethtrailer.anyflowid`, qui correspond à l’identifiant qu’il soit celui du flux ou du flux homologue, et renvoie donc **les deux côtés** de la connexion ; filtrer sur `flowid` seul ne renvoie que la moitié de ce que vous cherchiez.

## *** La section que l’outil refuse de décoder ***

À partir de **BIG-IP v15**, le trailer peut contenir une **section TLS provider qui renferme des secrets de session**. Wireshark les transforme en entrées keylog et déchiffre la capture.

**Cet outil détecte cette section, vous signale sa présence et n’en décode rien.** Un vecteur de référence (golden vector) garantit qu’aucun secret n’apparaît jamais, nulle part, dans la sortie.

La raison est ce qu’il faut retenir : **une capture prise à un niveau de bruit élevé sur un équipement en v15 ou ultérieure peut contenir les clés de ses propres sessions TLS.** F5 indique que le trailer ne quitte jamais l’équipement sur le fil, ce qui est vrai, et concerne le fil. Le fichier est une autre affaire : l’envoyer dans un ticket ou à un collègue revient à envoyer les clés avec lui.

## Ce que l’outil ne fait pas

Il ne lit pas les fichiers pcap et ne peut pas voir votre capture. Quand une cause de RST ne figure pas dans sa table, il le dit plutôt que de lui inventer une explication.

## Partage des résultats

Sous la vue d’ensemble, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, le texte du trailer tel que collé, mais jamais ce que cette page refuse de décoder. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

- **Secrets TLS : pas de lien.** Quand la page trouve une section TLS provider, ou que le texte nomme un secret ou une ligne keylog, aucun lien n’est créé, et la fenêtre contextuelle en donne la raison. La liste des champs du trailer que donne Wireshark lui-même ([référence des filtres d’affichage f5ethtrailer](https://www.wireshark.org/docs/dfref/f/f5ethtrailer.html), consultée le 27/10/2026) comprend `f5ethtrailer.tls.master_secret`, les secrets de trafic client et serveur et `f5ethtrailer.tls.keylog` : les clés des propres sessions TLS de la capture. Les retirer changerait ce que cette page dit du trailer : rien n’est donc envoyé.
- **Octets : l’en-tête seulement.** Les octets collés ne partent que s’ils se limitent à l’en-tête du trailer (le nombre magique, la longueur et la version, soit 8 octets d’après la liste des champs de Wireshark). Tout le reste, avant ou après, peut être les données du paquet lui-même ou les sections provider du trailer, secrets TLS compris, que cette page ne lit jamais : aucun lien n’est créé, et la fenêtre contextuelle suggère de partager plutôt la vue texte de Wireshark.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : le texte n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** Le texte remplit la zone comme le ferait un collage, et la page le décode. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
