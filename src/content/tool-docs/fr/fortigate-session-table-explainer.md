## Ce que fait l’outil

Collez la sortie de `diagnose sys session list` : l’outil vous la relit, c’est-à-dire le protocole et son état, la politique qui a admis le flux, ce qui a été traduit à chaque étape, les temporisateurs, et si l’autre extrémité a répondu. Tout s’exécute dans votre navigateur, sans jamais contacter d’équipement.

## Pourquoi la table de sessions mérite d’être lue

La table de sessions est le registre qui fait foi de ce que le FortiGate a réellement fait. La liste des politiques vous dit ce qui devrait se passer ; la session vous dit ce qui s’est passé. Quand quelqu’un affirme que le pare-feu bloque son trafic, une entrée de session montrant le flux admis par la politique 7, avec des octets comptés dans les deux sens, tranche la question en une ligne.

Son problème, c’est la présentation. La sortie est dense, positionnelle et difficile à retenir : l’information est là, mais personne ne la lit.

## La lecture que l’on saute

```
statistic(bytes/packets/allow_err): org=240/4/0 reply=0/0/0
```

Des paquets sortants, zéro réponse. Le FortiGate a transmis le trafic et **rien n’est revenu**. La session existe, ce qui signifie qu’une politique l’a autorisée : ce n’est donc pas le pare-feu qui bloque quoi que ce soit. Le problème se situe au-delà de cet équipement : le routage sur le chemin retour, l’hôte de destination, ou un filtrage plus loin.

L’outil commence par cette lecture plutôt que de rapporter deux nombres, car l’erreur de diagnostic qui en fait un problème de pare-feu est la plus courante et la plus coûteuse avec cette sortie.

Pour UDP, `proto_state` dit la même chose plus directement : `00` signifie un seul sens, `01` les deux sens.

## Les hooks NAT

C’est dans les lignes `hook=` que la traduction devient visible.

```
hook=post dir=org  act=snat 192.168.1.10:52345->93.184.216.34:443(203.0.113.5:52345)
hook=pre  dir=reply act=dnat 93.184.216.34:443->203.0.113.5:52345(192.168.1.10:52345)
```

Le tuple entre parenthèses est la forme traduite. `hook=post dir=org act=snat` porte la source après NAT, celle que voit l’autre extrémité. `hook=pre dir=reply act=dnat` porte la destination avant NAT. Une session sans `snat` ni `dnat` sur aucune étape a été routée sans traduction, et l’outil le dit au lieu de le laisser sous-entendu.

## Ce que l’outil ne vous dira pas

Les champs dont les tables de valeurs complètes relèvent de la documentation du constructeur sont affichés **bruts**, leur signification n’étant indiquée que là où elle est documentée et sans ambiguïté. Le `proto_state` TCP est le cas le plus net : les deux chiffres sont l’état de la connexion dans chaque sens, `01` est la session établie que tout le monde rencontre, et c’est à Fortinet de publier le reste de la table. L’outil dit ce que signifient les chiffres et n’invente pas la correspondance.

C’est une limite délibérée. Un décodeur qui devine une table de valeurs paraît plus complet, et se trompe précisément quand la valeur est inhabituelle, c’est-à-dire précisément quand vous lisez la table de sessions.

## Partage des résultats

En tête de la lecture, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, les sessions telles que collées. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

La sortie de `diagnose sys session list` nomme les adresses, les ports, les traductions NAT et la politique de chaque flux, et peut nommer un utilisateur authentifié (d’où la ligne de mise en garde qu’ajoute la fenêtre contextuelle). Avant qu’un lien soit proposé, la zone est examinée à la recherche d’identifiants définis par FortiOS ou par une norme : une ligne `set` d’un paramètre dont la [référence CLI de FortiOS 7.6.8](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) fait un mot de passe (`psksecret`, `password`, `passwd`, `secret`, `key`, `auth-pwd`, etc. ; consultée le 01/11/2026) ou le `name` d’une communauté SNMP ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), section 3.2.5), toute valeur `ENC` (l’avis [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007) de Fortinet, consulté le 01/11/2026 : publiées là où d’autres peuvent les lire, ces données doivent être considérées comme faciles à déchiffrer, « should currently be considered “easy to decrypt” »), une paire `psksecret=` ou `password=` de mêmes noms sur une ligne de directive, une clé privée PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468)), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)), une ligne `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), section 11.6.2), un mot de passe dans une URL ou un ID de clé d’accès AWS. Si l’un d’eux est présent, pas de lien : la fenêtre contextuelle nomme sa ligne, vous le remplacez par une valeur fictive et vous appuyez de nouveau ; ce que vous partagez est ainsi exactement ce que vous avez choisi (une valeur n’est jamais remplacée à l’intérieur d’une zone collée, ce qui changerait ce qui a été envoyé). Une valeur dont seul le nom évoque un secret n’empêche pas le lien ; la fenêtre contextuelle nomme la première.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** La zone se remplit comme lors d’un collage, et la page lit chaque session. Rien n’est contacté. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.

## Contexte d’utilisation

Il se combine avec l’analyseur de recherche de politique FortiGate : cet outil-là prédit quelle politique *devrait* correspondre, celui-ci confirme quelle politique *a* correspondu. Ensemble, ils bouclent la boucle entre configuration et comportement. Pour la préparation à l’examen NSE 4, il couvre les objectifs 1.02 et 1.04.
