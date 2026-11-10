## Ce que fait l’outil

Comparez deux blocs de texte et voyez exactement ce qui a changé : une vue ligne par ligne des ajouts et des suppressions, avec une mise en évidence au niveau des mots dans les lignes modifiées, pour repérer précisément le changement. Vous pouvez, si vous le souhaitez, ignorer les espaces ou la casse. Tout est calculé dans votre navigateur ; votre texte n’est jamais envoyé nulle part.

## Calcul d’un diff

Un bon diff n’est pas une comparaison naïve ligne par ligne : il cherche le plus petit ensemble de modifications qui transforme le premier texte en second. L’outil y parvient en calculant la **plus longue sous-séquence commune** (LCS, longest common subsequence) des deux textes, c’est-à-dire la plus longue suite d’unités (tokens) présente, dans le même ordre, dans les deux. Tout ce qui appartient à cette sous-séquence commune est inchangé ; tout ce qui figure dans le premier texte mais pas dans la LCS est une **suppression**, et tout ce qui figure dans le second texte mais pas dans la LCS est une **insertion**. C’est l’idée au cœur de l’algorithme de diff classique de Myers, et elle produit un script d’édition minimal : le plus petit nombre d’ajouts et de suppressions qui explique la différence.

## Deux niveaux : lignes et mots

La même opération LCS s’applique à deux granularités. Pour la vue principale, les unités sont des lignes entières, ce qui donne la liste habituelle des lignes ajoutées et supprimées. Pour une ligne modifiée, plutôt qu’ajoutée ou supprimée d’un bloc, l’outil relance le diff en prenant pour unités les mots, les espaces et la ponctuation, et ne met en évidence que les parties de la ligne qui diffèrent réellement. C’est cette mise en évidence en ligne qui transforme « cette ligne a changé » en « ce mot a changé ».

## Déterminisme

Quand deux scripts d’édition différents sont aussi courts l’un que l’autre, un diff doit en choisir un, et l’outil choisit toujours de la même façon (il préfère une suppression quand les deux sens se valent). Cette règle de départage fixe rend le résultat déterministe : les deux mêmes entrées produisent toujours le même diff, sans dépendre du moment ni d’aucun élément extérieur.

## Utilisation

Collez le texte original d’un côté et le texte modifié de l’autre, puis lisez les différences ligne par ligne avec la mise en évidence des mots. Activez les options Ignorer les espaces ou Ignorer la casse quand le contenu vous importe plus que la mise en forme.

## Partage des résultats

Sous l’en-tête du résultat (ou sous « Aucune différence trouvée », qui est aussi un résultat), le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, les deux textes tels que collés (Original et Modifié) et les deux options. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas. Des textes comparés peuvent être privés : la fenêtre contextuelle vous demande donc de relire les deux avant d’envoyer le lien. Les textes partent tels que collés : une valeur remplacée dans les deux zones pourrait masquer justement la modification que vous montrez. Avant qu’un lien soit proposé, le texte est examiné à la recherche d’identifiants définis par une norme : une clé privée PEM, une ligne `Authorization` ou `Proxy-Authorization` avec n’importe quel schéma ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sections 11.6.2 et 11.7.2 : la valeur se compose d’identifiants, « consists of credentials »), une ligne `Cookie` ou `Set-Cookie` avec une valeur ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sections 4.1.1 et 4.2.1), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1), un mot de passe dans une URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1 : la forme « user:password » est déconseillée, « is deprecated »), un ID de clé d’accès AWS ou une valeur FortiOS `ENC` ; toutes consultées le 01/11/2026. Si l’un d’eux est présent, pas de lien : la fenêtre contextuelle nomme la zone et la ligne, vous le remplacez par une valeur fictive et vous appuyez de nouveau. Une valeur dont seul le nom évoque un secret (`db_password = ...`, un `token=` dans une URL) ne bloque pas le lien ; la fenêtre contextuelle nomme la première pour que vous puissiez la vérifier.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** Les deux zones et les deux options sont réglées comme vous le feriez vous-même, et la page lance la comparaison. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
