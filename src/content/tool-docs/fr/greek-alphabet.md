## Ce que fait l’outil

Deux sens, détectés automatiquement. Collez du texte grec : l’outil le décompose lettre par lettre (nom, translittération, remarque sur le sigma final quand elle s’applique) et translittère l’ensemble. Saisissez des noms de lettres (lambda; mu omega) : l’outil produit les glyphes avec leurs remarques d’usage. Sous le convertisseur se trouve le tableau de référence complet des 24 lettres : paire de glyphes, nom, romanisation moderne avec la forme classique entre parenthèses quand elle diffère, et le contexte technique où chaque lettre se rencontre le plus probablement.

## Le lien avec l’ingénierie

L’alphabet grec est le second alphabet de tous les domaines techniques : mu, c’est le micro, Oméga les ohms, lambda la longueur d’onde et le lambda-calcul, Sigma additionne et sigma mesure l’écart type, Delta est la variation elle-même. Le tableau indique où chaque lettre se rend utile.

## La translittération, annoncée clairement

L’outil suit le système moderne largement enseigné (bêta donne v, êta donne i) ; là où la romanisation classique diffère (bêta donne b, êta donne e), les deux sont affichées, car un outil qui en choisit une en silence fait une supposition à votre place.

## Partage des résultats

Sous la lecture, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, la saisie telle quelle (texte grec ou noms de lettres), dès que la page en a une lecture ; un texte qu’elle refuse n’a rien à partager. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Ouverture d’un lien.** Le texte remplit la zone comme le ferait un collage, et la page le décompose ou le construit. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
