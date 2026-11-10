## Ce que fait l’outil

Collez une liste ordonnée de politiques FortiGate et, si vous le souhaitez, un paquet. L’outil parcourt la liste de haut en bas en montrant quel champ a écarté chaque politique, nomme la gagnante et signale quand le paquet tombe sur le refus implicite. Local et hors ligne : il raisonne sur la liste que vous lui donnez et ne touche jamais un équipement.

## Une analyse utile à elle seule

Même sans paquet, l’outil signale les **politiques qui ne peuvent jamais être atteintes**, quand une politique antérieure couvre tous les champs que couvre une politique ultérieure. C’est la forme la plus courante du « ma règle ne fonctionne pas » : la règle est correcte, elle n’est simplement jamais atteinte. Une analyse à lancer régulièrement, et pas seulement quand quelque chose casse.

## Ce que l’outil corrige

**L’ID de politique est un identifiant, pas une position.** La politique 3 peut se trouver sous la politique 47, et renuméroter ne change rien à l’ordre d’évaluation. Bien des contenus en ligne se lisent comme si l’ID était l’ordre ; l’outil rappelle la correction à chaque exécution, et l’un de ses vecteurs de référence (golden vectors) est une liste où la politique 47 se trouve au-dessus de la politique 3 et l’emporte.

Il rappelle aussi toujours que **chaque sens a besoin de sa propre politique** : un trafic autorisé de A vers B ne dit rien de B vers A.

## Les règles des IP virtuelles

Une politique à laquelle **une VIP est appliquée est évaluée différemment et a la priorité** sur une politique ordinaire : l’ordre seul ne suffit donc pas à empêcher une source de l’atteindre. La politique de refus a besoin de **`match-vip`** et doit se trouver au-dessus. Les nouvelles politiques de refus l’ont activé par défaut ; une politique **accept** ne peut pas l’avoir du tout, et l’outil signale cette combinaison comme impossible.

## Ce que l’outil ne fait pas

Il ne résout ni les objets d’adresse ni les groupes de services : un objet nommé reste donc une chaîne opaque, sauf s’il s’agit de `all` ou de `any`. Il peut ainsi vous dire que `web-servers` et `all` diffèrent, mais pas si l’un contient l’autre. Pour cela, c’est l’équipement qui fait foi.

## Partage des résultats

En tête de la lecture, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, les politiques et la ligne de paquet telles que saisies (une ligne de paquet vide est omise). Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

Les politiques nomment vos interfaces, vos objets adresse et vos services (d’où la ligne de mise en garde qu’ajoute la fenêtre contextuelle). Les deux champs sont lus, et un message relatif à des identifiants indique lequel les contient. Avant qu’un lien soit proposé, la zone est examinée à la recherche d’identifiants définis par FortiOS ou par une norme : une ligne `set` d’un paramètre dont la [référence CLI de FortiOS 7.6.8](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) fait un mot de passe (`psksecret`, `password`, `passwd`, `secret`, `key`, `auth-pwd`, etc. ; consultée le 01/11/2026) ou le `name` d’une communauté SNMP ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), section 3.2.5), toute valeur `ENC` (l’avis [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007) de Fortinet, consulté le 01/11/2026 : publiées là où d’autres peuvent les lire, ces données doivent être considérées comme faciles à déchiffrer, « should currently be considered “easy to decrypt” »), une paire `psksecret=` ou `password=` de mêmes noms sur une ligne de directive, une clé privée PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468)), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)), une ligne `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), section 11.6.2), un mot de passe dans une URL ou un ID de clé d’accès AWS. Si l’un d’eux est présent, pas de lien : la fenêtre contextuelle nomme sa ligne, vous le remplacez par une valeur fictive et vous appuyez de nouveau ; ce que vous partagez est ainsi exactement ce que vous avez choisi (une valeur n’est jamais remplacée à l’intérieur d’une zone collée, ce qui changerait ce qui a été envoyé). Une valeur dont seul le nom évoque un secret n’empêche pas le lien ; la fenêtre contextuelle nomme la première.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** Les deux champs se remplissent tels que saisis (une ligne de paquet que le lien ne contient pas laisse ce champ vide), et la page les lit. Rien n’est contacté. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
