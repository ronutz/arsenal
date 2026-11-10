## Ce que fait l’outil

Ce calculateur traduit une configuration de limiteur de débit (rate limiter) F5 Distributed Cloud (XC) en comportement exact. Vous saisissez les quatre champs que demande la console de F5, **Number**, **Per Period**, **Periods** et **Burst Multiplier**, ainsi que **Mitigation Action** (et un verrouillage, ou lockout, si vous choisissez Block) : il calcule le débit effectif, ses équivalents par seconde, par minute et par heure, le plafond de rafale, et décrit simplement la façon dont la limite est appliquée. Tout s’exécute dans votre navigateur.

## Le calcul du débit

XC exprime un débit sous la forme *Number requêtes par (Periods x Per Period)*. C’est pourquoi `[1, Seconds, 60]` et `[1, Minutes, 1]` sont la même limite, une requête par minute, ce qui surprend régulièrement. Le calculateur ramène toute configuration à une fenêtre unique exprimée en secondes et affiche les débits équivalents par seconde, par minute et par heure : deux configurations se comparent ainsi directement.

## Rafale et application de la limite

**Burst Multiplier** est la rafale maximale de requêtes autorisée, exprimée en multiple du débit (1 par défaut) ; une limite de 15 requêtes par seconde avec un multiplicateur de 3 autorise une rafale de 45 requêtes. L’application de la limite repose sur un seau percé (leaky bucket) : quand le seau déborde, l’équilibreur de charge renvoie **HTTP 429**.

## Le piège de la mitigation

Le réglage le plus souvent mal compris est **Mitigation Action**. **Disabled ne contourne pas la limitation de débit** : le seau percé renvoie toujours 429 en cas de débordement ; Disabled signifie seulement qu’aucun délai de verrouillage supplémentaire ne s’applique. **Block** ajoute un verrouillage par-dessus : dès que le seau déborde, l’utilisateur est bloqué pendant toute la durée du verrouillage, même si le seau se vide, et ne peut de nouveau envoyer des requêtes qu’à l’expiration du délai (48 heures au maximum). Le calculateur indique le comportement que produit votre configuration.

## Les mises en garde affichées

Le comptage est réparti par Regional Edge et par proxy : vous pouvez donc voir brièvement plus de requêtes que la limite avant que l’application ne converge. Et quand vous superposez des règles Server URL et API endpoint, elles sont évaluées à la première correspondance, dans l’ordre où vous les configurez.

## Partage des résultats

Sous le débit effectif, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, chaque champ : Number, Per Period, Periods, Burst Multiplier, Mitigation Action, et le verrouillage avec son unité, chacun tel que le calcul le lit (un Burst Multiplier vide valant 1). Chaque champ part même s’il correspond à la valeur par défaut : un lien garde ainsi son sens si une valeur par défaut change, et les nombres ne désignent aucun système ni aucune personne. La page affiche un résultat dès son ouverture : le bouton est donc disponible immédiatement. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** Les champs sont remplis comme si vous les aviez saisis, et le résultat suit. Un lien qui contient une valeur que la page refuserait est ignoré en entier. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
