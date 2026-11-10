## Ce que fait l’outil

Cet outil calcule une empreinte TLS passive JA3. Collez une chaîne JA3, c’est-à-dire les cinq champs du ClientHello (version TLS, suites de chiffrement, extensions, courbes elliptiques et formats de point des courbes elliptiques), avec des virgules entre les champs et des tirets entre les valeurs : l’outil recalcule le hachage MD5 JA3, calcule la variante JA3N avec les extensions triées, décode chaque champ avec son nombre de valeurs, et signale toute valeur GREASE. Il s’exécute entièrement dans votre navigateur.

## JA3, et pourquoi le hachage est ce qu’il est

JA3 a été créé par Salesforce comme identifiant compact et partageable d’un client TLS. Les cinq champs qu’il utilise sont remplis surtout par la bibliothèque TLS du client plutôt que par l’application : un même build de navigateur ou d’outil tend donc à produire le même JA3, ce qui le rend utile pour repérer des scripts, des bots et des bibliothèques inhabituelles avant qu’une application ne dispose d’un autre contexte. L’outil suit exactement la construction d’origine : il retire les valeurs GREASE (les valeurs réservées de 0x0a0a à 0xfafa que la RFC 8701 fait insérer par les navigateurs), reconstruit la chaîne canonique et en calcule le hachage MD5. Deux des exemples publiés par Salesforce elle-même sont fixés comme tests : le hachage obtenu ici est donc le JA3 qu’attend l’écosystème.

## GREASE et le problème du churn

Deux éléments rendent un JA3 brut moins stable qu’il n’y paraît, et l’outil fait ressortir les deux. Les valeurs GREASE sont des valeurs aléatoires qui changent à chaque connexion ; si elles ne sont pas retirées, le même client produit un hachage différent à chaque fois : JA3 les exclut donc, et l’outil vous indique celles qu’il a trouvées et retirées. Le problème le plus important est la permutation des extensions : depuis 2024 environ, Chrome et Firefox rendent aléatoire l’ordre des extensions TLS à chaque connexion, et comme JA3 hache les extensions dans leur ordre, un même navigateur produit désormais des milliers de hachages JA3 différents. L’outil indique si vos extensions étaient dans l’ordre et affiche la JA3N à côté du JA3.

## JA3N et JA4

La JA3N est la correction simple : trier la liste des extensions avant le hachage, et la permutation ne compte plus. L’outil la calcule pour vous : si votre entrée provient d’un navigateur qui permute les extensions, la JA3N est la valeur qui reste constante. La JA3N n’est toutefois qu’un palliatif. Le successeur moderne est JA4, qui trie nativement, utilise SHA256, ajoute un préfixe lisible et s’étend à HTTP, SSH, QUIC et TCP. Si vous choisissez aujourd’hui une empreinte sur laquelle construire une détection, JA4 est la meilleure cible ; le JA3 de cet outil sert à lire et à rapprocher les empreintes que parlent encore les outils plus anciens et le renseignement sur les menaces.

## Ce qu’est une empreinte, et ce qu’elle n’est pas

Un JA3 identifie une implémentation TLS, pas une personne ni une intention. C’est un signal fort quand il est combiné au comportement des requêtes, au renseignement sur les proxys et à l’historique du compte, et un signal faible à lui seul : les collisions MD5 sont possibles, et deux clients différents peuvent partager un hachage. Traitez-le comme une donnée parmi d’autres dans une décision, une façon de remarquer qu’une connexion ressemble à un bot connu ou à une bibliothèque inattendue, plutôt que comme la preuve de quoi que ce soit à lui seul.

## Partage des résultats

Sous les hachages, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, la chaîne JA3 telle que la page la lit, et non la zone telle que saisie. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

Une chaîne JA3 se compose de cinq champs de nombres, séparés par des virgules, tirés d’un ClientHello TLS, et la page ne lit que les nombres : dans chaque champ, elle ignore tout fragment qui n’est pas un entier. Le lien contient donc les fragments entiers de chaque champ tels qu’écrits (valeurs GREASE comprises, puisque la page les signale) et omet les blancs et tout ce que la lecture ignore, comme un texte collé avec la chaîne ; la page qui ouvre le lien calcule les mêmes hachages, les mêmes signalements et la même remarque sur la permutation. Quand la zone ne contient rien d’autre, le lien la contient telle que saisie.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : la chaîne n’est donc pas envoyée au serveur à l’ouverture du lien ; elle reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut la lire.

- **Ouverture d’un lien.** La chaîne remplit la zone comme un collage, et la page calcule les hachages ; rien n’est envoyé. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
