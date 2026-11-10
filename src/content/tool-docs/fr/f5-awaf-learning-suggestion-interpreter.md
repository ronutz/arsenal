## Ce que fait l’outil

Décrivez une suggestion Traffic Learning de F5 AWAF (Advanced WAF, anciennement BIG-IP ASM, Application Security Manager) : son action, son score d’apprentissage, la note de violation moyenne, le mode d’apprentissage, et si le trafic qui la sous-tend est de confiance. L’outil vous dit si accepter la suggestion assouplit ou durcit la politique, si un assouplissement corrige réellement un faux positif ou relâche la sécurité, et si l’apprentissage Automatic s’apprête à l’appliquer à votre place. Il fait le lien entre l’estimateur d’empoisonnement et le tri des faux positifs, et il s’exécute entièrement dans votre navigateur.

## Assouplissement ou durcissement

F5 classe les suggestions selon deux sens. Les suggestions de durcissement rendent la politique plus précise : supprimer un caractère générique (wildcard) et ajouter des entités explicites, appliquer une entité en staging, rendre un attribut plus précis. Les accepter améliore généralement la sécurité. Les suggestions d’assouplissement relâchent la politique : ajouter une entité autorisée, autoriser un métacaractère, assouplir un attribut, désactiver une violation ou une signature. Ajouter une entité légitime que la politique n’avait simplement pas apprise présente peu de risque, mais un assouplissement qui réduit l’application demande du discernement, et l’outil en juge d’après la note de violation : 1 ou 2 correspond probablement à la correction d’un faux positif, 3 demande un examen, 4 ou 5 signifie que vous assoupliriez face à une vraie attaque.

## Le score d’apprentissage et le vecteur d’empoisonnement

Chaque suggestion porte un score d’apprentissage qui montre à quel point le système est près de l’accepter, et ce score augmente à mesure que la note de violation baisse. Les suggestions les moins bien notées, celles qui ont le plus de chances d’être des faux positifs, atteignent donc le plus vite l’acceptation automatique. C’est voulu, mais c’est aussi exactement ce que fait monter un attaquant qui alimente la politique avec de nombreuses violations faiblement notées. Quand le mode est Automatic, que l’assouplissement réduit l’application, que le trafic est non fiable et que le score grimpe, l’outil signale le vecteur d’empoisonnement et vous renvoie à l’estimateur d’empoisonnement pour voir à quelle distance se trouve le seuil d’acceptation automatique. En apprentissage Manual, une personne doit accepter chaque suggestion : rien n’est appliqué sans examen.

## La discipline

Pour tout assouplissement qui réduit l’application, l’outil rappelle la règle de F5 : n’assouplissez la politique que là où un faux positif s’est produit, jamais là où une vraie attaque a causé la violation. La note de violation est ce qui permet de distinguer les deux, et c’est pourquoi elle pilote l’évaluation.

## Fondements

Les catégories d’assouplissement et de durcissement proviennent de l’article F5 K03513854 ; le comportement du score d’apprentissage, l’application automatique à 100 % en mode Automatic et la discipline face aux faux positifs proviennent de la documentation de l’apprentissage d’ASM et de l’article K70544352. L’outil modélise un comportement documenté et ne dépend pas du JSON exact des suggestions de l’API REST (qui varie selon les versions) ; vous décrivez la suggestion à partir de l’écran Traffic Learning. Rien de ce que vous sélectionnez ne quitte la page.

## Partage des résultats

Sous l’évaluation, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, les cinq choix par leurs identifiants : `action`, `score` (de 0 à 100), `rating` (de 1 à 5, ou `na`), `mode` et `trust`. Les cinq partent toujours, si bien que le lien continue d’ouvrir la même lecture. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Ouverture d’un lien.** Les cinq choix sont réglés et la page calcule comme lors d’une modification. Un choix que la page ne propose pas fait ignorer le lien dans son ensemble. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
