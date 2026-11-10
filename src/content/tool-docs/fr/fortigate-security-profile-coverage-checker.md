## Ce que fait l’outil

Décrivez une politique (le trafic, le paramètre d’inspection SSL, le mode d’inspection et les profils de sécurité rattachés) : l’outil vous indique quels profils peuvent réellement **voir** ce trafic. Tout s’exécute dans votre navigateur.

## La chaîne de dépendances

Un profil de sécurité n’agit que si toutes les conditions préalables qui le précèdent sont remplies :

1. Une politique de pare-feu **autorise** le trafic. Rien n’inspecte ce qui a été refusé.
2. L’inspection SSL le **déchiffre**, s’il est chiffré.
3. Le **mode** d’inspection prend en charge la fonctionnalité.
4. Alors seulement, le profil agit.

L’outil parcourt cette chaîne pour chaque profil et nomme le maillon défaillant. La plupart des signalements de profil qui ne fonctionne pas se résolvent à **l’étape 2** : le trafic est en HTTPS, la politique applique l’inspection des certificats plutôt que l’inspection approfondie, et il n’y a tout simplement rien à lire. Le profil semble rattaché, la configuration semble correcte, et il est aveugle.

## Aveugle n’est pas dégradé

Cette distinction est le jugement que l’outil existe pour porter, et se tromper dans un sens comme dans l’autre serait pire que de ne rien dire.

**Aveugle** signifie rattaché, configuré, et sans aucun effet. AntiVirus, l’IPS (intrusion prevention system, système de prévention d’intrusion), la DLP (data loss prevention, prévention des fuites de données) et le filtrage de fichiers ont tous besoin du corps du message. Derrière une inspection des certificats, il n’y a pas de corps : ils ne sont pas partiellement efficaces, ils sont inertes.

**Dégradé** signifie fonctionner avec une vision incomplète. Le contrôle applicatif et le filtrage web peuvent encore identifier une partie du trafic à partir des métadonnées du handshake, comme le SNI : une règle sur le nom d’hôte s’applique donc toujours, mais pas une règle sur le chemin de l’URL.

Dire à quelqu’un qu’un profil fonctionne en partie alors qu’il ne voit rien du tout est l’erreur la plus dangereuse : les deux cas sont donc signalés séparément et présentés différemment.

## L’inspection des certificats est autre chose, pas une version allégée

Elle valide le certificat et lit le handshake. Elle ne déchiffre jamais la charge utile. La présenter comme une « inspection approfondie allégée » mène tout droit à la situation du profil aveugle ; c’est pourquoi l’outil la décrit comme un mécanisme différent et non comme un réglage inférieur.

Passer une politique en inspection approfondie est l’unique changement qui corrige d’un coup tous les profils aveugles, et c’est une vraie décision, pas une case à cocher. L’inspection approfondie signifie terminer le TLS sur le FortiGate, ce qui a des conséquences en matière de confiance dans les certificats, de vie privée et de performances, qui doivent peser dans la décision.

## Les réserves liées au mode

Même là où la couverture existe, le mode flux restreint certains comportements, et l’outil indique lesquels. En mode flux, AntiVirus analyse le fichier au fil du flux au lieu de le mettre entièrement en mémoire tampon : c’est donc sur les très gros fichiers et les archives profondément imbriquées que la couverture s’amenuise. Il signale aussi l’action appliquée aux fichiers trop volumineux, qui par défaut **laisse passer** les fichiers au-delà du seuil : les plus gros téléchargements restent ainsi non inspectés, sauf changement délibéré.

## Ce que l’outil ne modélise pas

**La couverture, pas la détection.** L’outil répond à la question de savoir si un profil peut voir le trafic. Il n’affirme jamais qu’un profil intercepterait une menace particulière, car cela dépend des signatures, des bases de données et de la menace elle-même, rien de cela ne pouvant se calculer à partir de la description d’une politique.

Il n’évalue pas non plus la qualité de la configuration des profils : un profil AntiVirus dont toutes les analyses sont désactivées apparaît ici comme efficace, car la question posée porte sur la visibilité.

## Partage des résultats

Sous le tableau de couverture, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, la zone telle que collée. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

Les lignes de directive nomment des types de profils et des modes d’inspection, pas votre réseau : la fenêtre contextuelle n’ajoute donc pas de mise en garde qui lui soit propre. Avant qu’un lien soit proposé, la zone est examinée à la recherche d’identifiants définis par FortiOS ou par une norme : une ligne `set` d’un paramètre dont la [référence CLI de FortiOS 7.6.8](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) fait un mot de passe (`psksecret`, `password`, `passwd`, `secret`, `key`, `auth-pwd`, etc. ; consultée le 01/11/2026) ou le `name` d’une communauté SNMP ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), section 3.2.5), toute valeur `ENC` (l’avis [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007) de Fortinet, consulté le 01/11/2026 : publiées là où d’autres peuvent les lire, ces données doivent être considérées comme faciles à déchiffrer, « should currently be considered “easy to decrypt” »), une paire `psksecret=` ou `password=` de mêmes noms sur une ligne de directive, une clé privée PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468)), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)), une ligne `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), section 11.6.2), un mot de passe dans une URL ou un ID de clé d’accès AWS. Si l’un d’eux est présent, pas de lien : la fenêtre contextuelle nomme sa ligne, vous le remplacez par une valeur fictive et vous appuyez de nouveau ; ce que vous partagez est ainsi exactement ce que vous avez choisi (une valeur n’est jamais remplacée à l’intérieur d’une zone collée, ce qui changerait ce qui a été envoyé). Une valeur dont seul le nom évoque un secret n’empêche pas le lien ; la fenêtre contextuelle nomme la première.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** La zone se remplit comme lors d’un collage, et la page vérifie la couverture. Rien n’est contacté. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.

## Contexte d’utilisation

Il se combine avec l’article sur les profils de sécurité FortiGate, qui explique en détail le mode flux et le mode proxy, et avec l’article sur les modes d’inspection SSL. Pour la préparation à l’examen NSE 4, il couvre les objectifs 3.02 à 3.05.
