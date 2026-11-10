## Ce que fait l’outil

L’outil explique pourquoi une règle DLP (prévention des pertes de données, data loss prevention) s’est déclenchée, ou non, en séparant trois éléments que l’on confond généralement en un seul, et qui échouent séparément :

1. **Candidats** : combien de chaînes ont la bonne forme
2. **Correspondances** : combien d’entre elles passent la somme de contrôle
3. **Seuil** : si ce nombre atteint ce qu’exige la règle

Une règle qui ne s’est pas déclenchée a échoué à exactement l’une de ces étapes, et savoir laquelle vous indique quoi changer.

## Pourquoi la somme de contrôle compte plus que le motif

Un identifiant de données prédéfini n’est pas une expression régulière. Une chaîne de seize chiffres est un *candidat* ; qu’elle compte comme une correspondance dépend d’un calcul.

Ce seul fait explique la plupart des débats sur le réglage de la DLP. **« La DLP a signalé un numéro de bon de commande »** : c’est généralement un numéro qui passe Luhn par hasard. **« La DLP a raté une vraie carte »** : c’est généralement une carte avec deux chiffres intervertis, qui échoue à Luhn et qui, pour le moteur, n’est donc pas une carte. Aucune de ces deux plaintes ne se règle en discutant du motif.

## Les identifiants

**Carte de paiement** : l’algorithme de Luhn, tel que spécifié pour les numéros de carte. Notez que les cartes valides comptent de treize à dix-neuf chiffres : les règles écrites autour de seize chiffres ratent les autres.

**CPF et CNPJ** : les identifiants brésiliens, chacun avec deux chiffres de contrôle modulo 11. Les suites de chiffres répétés comme `111.111.111-11` satisfont le calcul mais ne sont jamais attribuées : elles sont donc rejetées.

Ces trois identifiants figurent ici parce que leur validation repose sur un algorithme publié et sans ambiguïté. Un identifiant dont les règles ne sont pas publiques ne peut pas être modélisé honnêtement.

## Confidentialité

Tout reste dans votre navigateur. Rien de ce que vous collez n’est transmis, stocké ni journalisé, ce qui compte encore plus ici que pour la plupart des outils, puisque le principe même est de coller un contenu que vous soupçonnez d’être sensible.

## Limites, en toute franchise

**Ce n’est pas le moteur de Netskope.** L’outil modélise l’étape de la somme de contrôle, celle qui surprend. Les mots-clés de proximité, les dictionnaires, l’empreinte de documents (document fingerprinting), l’exact data match, l’OCR et la détection du type de fichier sont tous hors du périmètre, et aucun n’est approché.

La détection de forme est ici délibérément simple : un résultat de zéro candidat signifie que *l’outil n’en a trouvé aucun*, et non que *la plateforme n’en trouverait aucun*. Par ailleurs, un numéro répété n’est compté qu’une fois ; qu’une plateforme compte les occurrences ou les valeurs distinctes change le comportement du seuil, et c’est une question de configuration que l’outil ne modélise pas.

## Partage des résultats

Sous le verdict, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui ne contient jamais votre texte. La zone contient ce que vous soupçonnez d’être sensible : des numéros de carte de paiement (un PAN, « primary account number », est le numéro unique de carte de paiement qui identifie l’émetteur et le compte du titulaire, « unique payment card number ... that identifies the issuer and the cardholder account », [glossaire du PCI SSC](https://www.pcisecuritystandards.org/glossary/), consulté le 01/11/2026), des numéros CPF et CNPJ, et les mots qui les entourent. Ce que la page diagnostique est structurel : le lien contient donc, après le `#`, des substituts. Une ligne par candidat, dans l’ordre de la page, chacune avec les séparateurs et la longueur du candidat, et des chiffres que la page fabrique (des zéros, la place du candidat dans la liste, et des chiffres de contrôle choisis pour que la somme de contrôle réussisse ou échoue exactement comme pour le candidat, ce que confirment les mêmes contrôles Luhn et modulo 11 que ceux de la page) ; une suite de chiffres répétés, qui n’est le numéro de personne, est transmise telle quelle. L’identifiant et le seuil font aussi partie du lien. Avant de proposer le lien, la page relit les substituts et doit aboutir au même diagnostic (les mêmes candidats par forme, résultat et raison, le même décompte, le même verdict et les mêmes constats) ; sinon, aucun lien n’est créé. Un texte sans candidat n’obtient pas de lien, car son diagnostic porte sur le texte lui-même. La fenêtre contextuelle du bouton indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** Les substituts remplissent la zone, l’identifiant et le seuil sont renseignés, et la page évalue ; une remarque sous le verdict précise que les numéros sont des substituts. Un lien dont les lignes ne sont pas des substituts correspondant à leur place est ignoré. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
