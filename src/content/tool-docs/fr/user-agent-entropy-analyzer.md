## Ce que fait l’outil

Collez une chaîne User-Agent : l’outil en extrait les éléments d’identification qu’elle contient (navigateur et version, moteur de rendu, système d’exploitation et version, type d’appareil, architecture du processeur), estime les bits discriminants qu’apporte chacun, et indique si la chaîne est sous la forme réduite et gelée qu’envoient désormais les navigateurs récents.

## Le propos de l’outil

Un User-Agent est un petit tas d’entropie. Aucun élément ne vous identifie à lui seul, mais ensemble ils restreignent le champ des possibles, et plus la chaîne est détaillée, plus elle est discriminante. L’outil montre cette surface honnêtement. Les chiffres en bits sont indicatifs, tirés de travaux publiés sur le fingerprinting, et non une mesure en temps réel d’une population : le but est de rendre visible la forme de la surface, pas de vous attribuer un score.

## Où est passé le détail

Les navigateurs récents gèlent le User-Agent : Chromium fige la version mineure à 0.0.0 et plafonne le détail de la plateforme, et Safari a depuis longtemps figé une grande partie de sa chaîne. Le détail n’a pas disparu : il est passé dans les User-Agent Client Hints (Sec-CH-UA et consorts), qu’un site doit demander explicitement par l’en-tête Accept-CH. Conséquence : la collecte à forte entropie est désormais visible dans les en-têtes, au lieu d’être implicite dans une seule chaîne. Décodage et explication seulement : l’entrée est une chaîne que vous collez, rien n’est lu dans votre propre navigateur et rien n’est envoyé.

## Partage des résultats

Sous le résumé, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, le User-Agent tel que saisi (`input`). Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

Une chaîne User-Agent nomme un navigateur, un moteur et un système d’exploitation, et chaque serveur avec lequel un navigateur communique la reçoit déjà. Mais la zone accepte plusieurs lignes, et une requête entière copiée depuis les outils de développement se lit aussi comme un User-Agent : avant qu’un lien soit proposé, le texte passe donc par le contrôle des secrets du site. Une valeur que son format désigne comme des identifiants (une ligne `Cookie`, [RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), section 4.2.1 ; des identifiants Authorization, [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), section 11.6.2 ; un JWS ou un JWE ; un mot de passe dans une URL ; une clé privée PEM ; un identifiant de clé d’accès AWS) empêche la création du lien, et la fenêtre contextuelle indique sa ligne. Collez le User-Agent seul, puis appuyez de nouveau sur le bouton. Une valeur dont seul le nom ressemble à un secret obtient quand même un lien, avec une ligne qui la signale.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : le texte n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** Le texte remplit la zone comme le ferait un collage, et la page l’analyse ; rien n’est envoyé. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
