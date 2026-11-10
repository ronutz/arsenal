## Ce que fait l’outil

Il prend deux couleurs, écrites dans n’importe quelle notation définie par CSS Color Level 4, et répond à la question que pose une feuille de style pour chaque texte et chaque contrôle : ceci est-il lisible sur cela ? Il calcule le rapport de contraste WCAG entre les deux, le teste à chaque niveau des trois critères de contraste, affiche un aperçu de la paire, convertit chaque couleur dans toutes les notations avec sa luminance relative et, là où un niveau échoue, trouve la couleur de premier plan la plus proche qui le satisferait.

## Ce qu’il lit

- **Couleurs nommées** : les 148 noms de la section 6.1 de CSS Color Level 4 (gray et grey, les deux orthographes), et `transparent` (noir transparent).
- **Hexadécimal** : `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa` ; la casse des lettres n’a pas d’importance, et une forme courte est étendue en dupliquant chaque chiffre.
- **rgb() / rgba()** : des nombres de 0 à 255 ou des pourcentages, avec les virgules historiques ou les espaces modernes avec `/ alpha` ; les composantes hors plage sont ramenées dans la plage, comme le fait la spécification au moment de l’analyse de la valeur.
- **hsl() / hsla()** et **hwb()** : une teinte sous forme de nombre ou d’angle (deg, grad, rad, turn), puis des pourcentages ou des nombres de 0 à 100.
- **lab()**, **lch()**, **oklab()**, **oklch()** : avec les plages de référence des pourcentages de la spécification (a et b de lab : 100 % = 125 ; C de lch : 100 % = 150 ; a et b d’oklab : 100 % = 0,4 ; C d’oklch : 100 % = 0,4 ; L : 100 % = 100 pour Lab, 1 pour OKLab).
- **color()** : `srgb`, `srgb-linear`, `display-p3`, `display-p3-linear`, `xyz`, `xyz-d65`, `xyz-d50`.
- `none` comme composante compte pour zéro, comme l’indique la spécification.

À côté de chaque champ, le sélecteur de couleur du navigateur s’ouvre sur la couleur que contient le champ et y écrit celle que vous choisissez sous la forme `#rrggbb` : une couleur peut ainsi être choisie sans rien saisir.

## Ce qu’il calcule

- **Luminance relative** (WCAG 2.2) : chaque canal sRGB est linéarisé (c / 12,92 jusqu’à 0,04045, sinon ((c + 0,055) / 1,055) ^ 2,4) puis pondéré, L = 0,2126 R + 0,7152 G + 0,0722 B. Les WCAG 2.0 et 2.1 écrivaient le seuil 0,03928 ; pour des valeurs de canal sur 8 bits, les deux seuils classent toutes les valeurs de la même façon.
- **Rapport de contraste** : (L1 + 0,05) / (L2 + 0,05), la plus claire sur la plus sombre, de 1:1 à 21:1.
- **Niveaux** : critère de succès 1.4.3 Contrast (Minimum), niveau AA, 4,5:1 pour le texte et 3:1 pour le texte de grande taille ; 1.4.6 Contrast (Enhanced), niveau AAA, 7:1 et 4,5:1 ; 1.4.11 Non-text Contrast, niveau AA, 3:1 pour les composants d’interface utilisateur et les objets graphiques. Un texte de grande taille fait au moins 18 points, ou 14 points en gras.
- **Alpha** : une couleur de premier plan translucide est composée sur le fond avant la mesure (simple mélange alpha en sRGB, comme le peint un écran), car les WCAG définissent le contraste entre les couleurs telles qu’elles s’affichent. L’alpha du fond est ignoré.
- **Gamut** : une couleur hors de sRGB (un jaune display-p3, un oklch() saturé) est ramenée dans le gamut pour les notations sRGB et pour la luminance, et signalée ; les formes Lab, LCH, OKLab, OKLCH et XYZ conservent la valeur non écrêtée.
- **Corrections** : pour chaque niveau que la paire manque, la luminosité de la couleur de premier plan est déplacée en OKLCH, vers le plus clair et vers le plus sombre, en conservant la teinte et la chroma (la chroma n’est réduite que si le résultat sortait du gamut), jusqu’à atteindre la cible ; le résultat est donné en hexadécimal et en oklch() avec le rapport qu’il atteint.

## Conversions

Les conversions sont le code d’exemple de la spécification elle-même, transcrit : la fonction de transfert sRGB, les matrices rationnelles sRGB vers XYZ et display-p3 vers XYZ, l’adaptation de Bradford entre D65 et D50, CIE Lab avec ses constantes rationnelles, les deux matrices d’OKLab, les formes polaires avec leurs seuils de teinte sans effet (powerless hue), et les algorithmes HSL et HWB. Le moteur reproduit les exemples commentés de la spécification : `#7654CD` vaut `lab(44.36% 36.05 -58.99)` et `color(xyz-d65 0.21661 0.14602 0.59452)` ; les couleurs d’exemple de lab() et d’oklch() concordent entre elles ; `color(display-p3 1 1 0)` aboutit à `oklch(0.9648 0.245 110.23)`.

## Partage des résultats

Sous le rapport et ses niveaux, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient les deux couleurs telles que saisies après le `#`, sous les noms que la page donne aux champs (`foreground` et `background`), et rien d’autre ; le préréglage éventuellement chargé n’est pas transmis. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : la paire n’est donc pas envoyée au serveur à l’ouverture du lien ; elle reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut la lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** Les deux champs sont remplacés comme une saisie les remplirait, et la page calcule le rapport ; rien n’est envoyé nulle part. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.

## Limites

- Le rapport est la formule des WCAG, que les critères imposent ; ce n’est pas un modèle de la perception, et une paire qui réussit peut rester difficile à lire pour certaines personnes (caractères fins, petites tailles, différences de vision des couleurs). L’aperçu est là pour que les yeux aient aussi leur mot à dire.
- La gestion des couleurs n’est pas modélisée : le profil de l’écran n’est pas consulté, et les couleurs à gamut étendu sont jugées sur leur version écrêtée en sRGB.
- Les corrections ne modifient que la luminosité. Un ou une designer peut préférer changer la teinte ou la chroma ; l’outil montre ce que le seul déplacement de la luminosité permet d’obtenir.
- Les couleurs système nommées (`Canvas`, `LinkText`) et `currentcolor` dépendent de la page et ne sont pas lues.

## Sources

- [WCAG 2.2, Recommandation du W3C du 12 décembre 2024](https://www.w3.org/TR/WCAG22/) (consulté le 05/10/2026) : luminance relative, rapport de contraste, critères de succès 1.4.3, 1.4.6, 1.4.11, texte de grande taille
- [CSS Color Module Level 4, W3C Candidate Recommendation Draft du 30 septembre 2026](https://www.w3.org/TR/css-color-4/) (consulté le 05/10/2026) : notations, plages de référence des pourcentages, couleurs nommées
- [Code d’exemple de CSS Color Level 4 dans le dépôt csswg-drafts](https://github.com/w3c/csswg-drafts/tree/main/css-color-4) (consulté le 05/10/2026) : conversions.js, utilities.js, rgbToHsl.js, hslToRgb.js, hwbToRgb.js, rgbToHwb.js
- [RFC 3986 : URI Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (consulté le 01/11/2026) : section 3.5, le fragment, qu’utilise un lien Partager les résultats
