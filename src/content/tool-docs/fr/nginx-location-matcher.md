## Ce que fait l’outil

Collez les lignes `location` d’un bloc server et une ligne `request <uri>` : l’outil exécute sous vos yeux l’algorithme de sélection documenté de NGINX. Il nomme le bloc retenu et montre tout le cheminement : ce qui s’est passé à chaque étape et pourquoi, y compris les étapes qui n’ont rien décidé. Une chaîne de requête est acceptée sur la ligne request ; elle reste en dehors de la correspondance et ne sert qu’à alimenter les variables `$arg_<name>`.

## La règle que l’outil enseigne

**NGINX ne choisit pas la première location qui correspond, ni la dernière.** Il essaie d’abord une correspondance exacte et s’arrête s’il en trouve une. Il examine ensuite chaque location par préfixe et retient la correspondance la **plus longue**, pas la première. Si ce préfixe porte `^~`, il l’emporte immédiatement. Sinon, les expressions régulières sont essayées **dans l’ordre du fichier**, et la première qui correspond l’emporte sur le préfixe retenu. Depuis nginx 1.31.5, si aucune expression régulière ne correspond, les locations à prédicat (`location $variable`) sont essayées dans l’ordre du fichier, et la première dont la variable n’est ni vide ni `0` l’emporte. Ce n’est que si rien ne correspond lors de ces deux tours que le préfixe l’emporte finalement.

L’ordre du fichier ne décide que des tours des expressions régulières et des prédicats : c’est pourquoi lire une configuration de haut en bas vous induit activement en erreur sur le résultat.

## Les deux résultats que l’on découvre à ses dépens

Un bloc préfixe `/images/` perd face à un bloc `~ \.(gif|jpg|png)$` écrit en dessous, car les expressions régulières sont essayées après le tour des préfixes et l’emportent sur lui. Le bloc qui paraît le plus spécifique, écrit en premier, est battu par conception.

Et `^~` ne signifie pas « priorité plus haute » : il signifie **s’arrêter avant les expressions régulières** (et, depuis la 1.31.5, avant les locations à prédicat aussi). C’est précisément pour cela qu’il corrige le cas ci-dessus.

Le même ordre décide quel bloc confie une URL `.php` à PHP-FPM ; [PHP-FPM and FastCGI](/learn/php-fpm-and-fastcgi) explique ce qui transite ensuite entre NGINX et PHP.

## Ce que l’outil signale d’autre

En plus du cheminement, l’outil inspecte la configuration elle-même : les blocs préfixes qu’une expression régulière pourrait supplanter (avec la correction `^~` indiquée), les locations en double, l’absence d’un `location /` fourre-tout, la version de nginx qu’exige une location à prédicat, et tout prédicat dont la variable n’a pas de valeur.

## Limites, en toute franchise

Un seul bloc server : pas de sélection par `server_name` ni de correspondance sur le port d’écoute. Les motifs `~` et `~*` sont compilés en expressions régulières JavaScript ; PCRE et JS s’accordent sur la syntaxe utilisée dans les blocs location ordinaires, mais ce sont des moteurs différents : pour tout ce qui sort de l’ordinaire, fiez-vous à NGINX lui-même. La vue de portabilité de la [boîte à outils regex](/tools/regex) liste, construction par construction, les cas où PCRE2 et JavaScript lisent un motif différemment. Pas de `rewrite`, de `try_files` ni de redirection interne : l’outil indique quel bloc est sélectionné, pas ce que fait la requête dans son ensemble. L’URI est mise en correspondance telle qu’écrite, car NGINX décode avant la mise en correspondance, et en faire la moitié ici serait pire que ne rien faire. Les variables ne sont pas évaluées : un prédicat `$arg_<name>` lit la chaîne de requête, toute autre variable prend la valeur que vous lui donnez sur une ligne `variable $name value`, et une variable non déclarée compte comme vide, si bien que son prédicat ne correspond pas.

## Partage des résultats

Sous le bloc retenu, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, la zone telle que saisie, dès que la page a un cheminement. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas. La grammaire n’accepte que des lignes location, des lignes `variable` et la ligne `request`, rien d’autre : aucune autre directive ne peut donc se glisser dans le lien ; mais une ligne request peut contenir une chaîne de requête, et une ligne `variable` une valeur. Avant qu’un lien soit proposé, la zone est examinée à la recherche d’identifiants définis par une norme : une clé privée PEM, une ligne `Authorization` ou `Proxy-Authorization` avec n’importe quel schéma ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sections 11.6.2 et 11.7.2 : la valeur se compose d’identifiants, « consists of credentials »), une ligne `Cookie` ou `Set-Cookie` avec une valeur ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), section 8.4 : les serveurs stockent couramment un nonce, ou identifiant de session, dans un cookie, « commonly store a nonce (or “session identifier”) in a cookie »), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1), un mot de passe dans une URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1), un identifiant de clé d’accès AWS ou une valeur `ENC` de FortiOS ; toutes consultées le 01/11/2026. Un seul d’entre eux empêche la création du lien : la fenêtre contextuelle nomme sa ligne, et vous le remplacez par une valeur fictive avant d’appuyer de nouveau sur le bouton. Une valeur dont seul le nom ressemble à un secret (un membre JSON `token`, un `token=` dans une chaîne de requête) ne bloque pas le lien ; la fenêtre contextuelle nomme la première pour que vous puissiez la vérifier.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** La zone se remplit comme le ferait un collage, et la page en déroule le cheminement. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.

## Sources

- [NGINX documentation, ngx_http_core_module, location](https://nginx.org/en/docs/http/ngx_http_core_module.html#location) (consultée le 26/10/2026) : l’ordre de sélection, `^~` qui saute les expressions régulières et les locations à prédicat, la règle des prédicats, et l’exemple commenté (configurations A à F) que reproduisent les tests de l’outil
- [NGINX documentation, How nginx processes a request](https://nginx.org/en/docs/http/request_processing.html) (consultée le 26/10/2026) : les locations ne testent que la partie URI de la ligne de requête, sans les arguments
- [NGINX changes log, nginx 1.31.5, 2 septembre 2026](https://nginx.org/en/CHANGES) (consulté le 26/10/2026) : « Feature: predicate locations »
