## Ce que fait l’outil

Collez une signature SYN p0f v3 dans sa grammaire canonique (ver:ittl:olen:mss:wsize,scale:olayout:quirks:pclass) : l’outil décode les huit champs, explique le raisonnement sur le TTL initial et sur la fenêtre, nomme chaque option TCP et chaque mot-clé de particularité (quirk), et compare la forme des champs aux signatures de référence que p0f documente pour chaque OS. Il accepte une signature seule ou la forme « label = sig ».

## Une analyse passive

p0f établit une empreinte en observant des paquets qu’un hôte a déjà envoyés, le SYN d’une connexion ordinaire, et n’envoie jamais de sonde. C’est le sens de « passif » ici, et c’est pourquoi la technique est invisible pour la cible. Cet outil pousse la logique jusqu’à l’exercice pédagogique pur : vous collez une signature que vous avez déjà, et rien n’est lu sur votre machine ni envoyé nulle part.

## Ce qui trahit un proxy

L’indication la plus utile est le TTL initial. Comme chaque routeur décrémente le TTL, une valeur proche de 64 indique Linux/BSD/Darwin, proche de 128 Windows, proche de 255 un équipement réseau. Quand ce TTL de pile contredit le système d’exploitation qu’annonce un User-Agent, vous avez presque certainement affaire à un proxy ou à du NAT : le paquet porte la pile de l’intermédiaire, pas celle du client. La disposition des options et les particularités affinent l’hypothèse ; l’outil montre la contribution de chacune.

## Partage des résultats

Sous l’indice de famille d’OS, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, la signature telle que saisie (`input`), et rien d’autre. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

Une signature p0f décrit la façon dont un hôte construit un SYN TCP (TTL, options, fenêtre, particularités) ; elle ne nomme aucun hôte ni aucune personne.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : la signature n’est donc pas envoyée au serveur à l’ouverture du lien ; elle reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut la lire.

- **Ouverture d’un lien.** La signature remplit la zone comme un collage et la page la décode ; rien n’est envoyé. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
