## Ce que fait l’outil

Collez une réponse HTTP brute et l’outil note sa posture de sécurité : les en-têtes de sécurité qu’elle définit (et ceux qui manquent), les attributs de ses cookies et sa politique cross-origin. Chaque constat est vérifié par rapport à la norme concernée et aux recommandations OWASP Secure Headers, et le résultat est une analyse notée sur laquelle vous pouvez agir. Tout s’exécute dans votre navigateur.

## Les en-têtes vérifiés

La sécurité des navigateurs modernes repose en grande partie sur des en-têtes de réponse à activer explicitement, et l’outil examine ceux qui comptent :

- **Strict-Transport-Security** (HSTS, RFC 6797) indique au navigateur de n’utiliser que HTTPS ; l’outil lit ses directives `max-age` et `includeSubDomains`.
- **Content-Security-Policy** (CSP Level 3) restreint les origines possibles des scripts, des styles et des cadres, et constitue la meilleure défense contre le cross-site scripting ; l’outil relève les mots-clés qui l’affaiblissent, comme `unsafe-inline`.
- **X-Content-Type-Options: nosniff** empêche le navigateur de deviner les types de contenu, et **X-Frame-Options** (ou la directive CSP `frame-ancestors`) protège contre le clickjacking.
- **Referrer-Policy** et **Permissions-Policy** contrôlent ce que la page laisse fuiter dans l’en-tête Referer et les fonctionnalités du navigateur qu’elle peut utiliser.
- Les **politiques cross-origin** (COOP, COEP, CORP), qui régissent l’isolation entre origines.

## Les cookies et leurs attributs

La sécurité d’un cookie tient à ses attributs, et l’outil les vérifie par rapport à la spécification actuelle des cookies (RFC 6265bis) : **Secure** (envoi uniquement sur HTTPS), **HttpOnly** (invisible pour JavaScript, ce qui limite le vol par cross-site scripting) et **SameSite** (qui restreint l’envoi intersite et atténue le CSRF). Il reconnaît aussi les préfixes de nom `__Host-` et `__Secure-`, qui imposent certaines de ces propriétés par le nom même du cookie.

## Lecture de la note

La note sert à établir des priorités : elle indique non seulement ce qui est présent, mais aussi ce qui manque ou reste faible, et pourquoi chaque en-tête compte, pour que vous corrigiez d’abord les lacunes qui ont le plus d’impact. Les vérifications suivent l’ensemble recommandé par l’OWASP et les spécifications sous-jacentes, et non l’opinion d’un outil.

## Utilisation

Collez une réponse HTTP, en-têtes compris, et lisez l’analyse notée des en-têtes, des cookies et de la politique cross-origin. L’analyse est déterministe et locale : vous pouvez donc l’exécuter sans risque sur une réponse capturée sur n’importe quel site.

## Partage des résultats

Sous la note, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, une copie de la réponse ; il ne contient la réponse telle que collée que si vous cochez l’option décrite plus bas. Une réponse collée contient des cookies, dont les valeurs sont couramment des identifiants de session ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), section 8.4, consultée le 01/11/2026), et des en-têtes que cette page ne lit jamais, comme un `Location` dont la chaîne de requête contient un code d’autorisation ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), section 4.1.2, consultée le 01/11/2026). La page note les en-têtes de sécurité qu’elle connaît, ainsi que le nom et les attributs de chaque cookie, jamais la valeur d’un cookie. La copie conserve donc la ligne de statut et chaque ligne d’en-tête par son nom, les valeurs des en-têtes que la page note, telles qu’analysées, et chaque `Set-Cookie` avec son nom et ses attributs ; la valeur de chaque cookie, et celle de tout autre en-tête, devient `[redacted]`. Avant que le lien soit proposé, la copie est notée de nouveau et doit donner le même rapport, puis elle passe par le contrôle des secrets du site, qui recherche des identifiants restés dans une valeur notée. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas. La fenêtre contextuelle indique aussi combien de valeurs ont été remplacées. S’il y en a, une option à cocher sous sa première ligne, **Inclure les valeurs masquées dans le lien**, vous permet de les envoyer malgré tout : elle est décochée à chaque ouverture de la fenêtre contextuelle ; cochée, le lien contient la réponse telle que collée, toutes les valeurs comprises, et la fenêtre contextuelle le signale et avertit que les valeurs de cookies sont souvent des sessions actives et que d’autres en-têtes peuvent contenir des jetons : le lien est donc réservé à une personne à qui vous montreriez la réponse. L’option n’est pas proposée quand des identifiants dans une valeur notée ont déjà bloqué le lien.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** La copie remplit la zone comme un collage et la page la note. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
