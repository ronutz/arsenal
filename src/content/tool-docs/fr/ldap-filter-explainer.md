# Analyseur de filtres LDAP

Collez n’importe quel filtre de recherche LDAP (Lightweight Directory Access Protocol) : l’outil l’analyse exactement comme le fait un serveur d’annuaire, selon la RFC 4515, la représentation textuelle vers laquelle se compile au bout du compte chaque client LDAP, chaque recherche PingDirectory, chaque consultation de magasin de données (datastore) PingFederate et chaque requête Active Directory.

## Ce que vous obtenez

L’arbre annoté. Chaque nœud AND (`&`), OR (`|`) et NOT (`!`) énonce sa règle en langage clair ; chaque élément terminal est classé selon son type de correspondance : égalité, présence (`=*`), sous-chaîne (caractères génériques, avec les parties initiale, contenue et finale dans l’ordre), `>=`, `<=`, correspondance approximative (`~=`) ou correspondance extensible. Les échappements hexadécimaux de la RFC 4515 (`\2a`, `\28`, `\29`, `\5c`) sont décodés et listés. Les célèbres OID de règles de correspondance d’Active Directory sont reconnus par leur nom : `1.2.840.113556.1.4.803` (ET bit à bit, le test classique de compte désactivé `(userAccountControl:1.2.840.113556.1.4.803:=2)`), `804` (OU bit à bit) et `1941` (appartenance transitive aux groupes).

## Erreurs pointées au caractère près

Un filtre mal formé échoue avec la position exacte du caractère fautif et un signe ^ placé en dessous : la parenthèse non équilibrée, l’élément sans `=`, la barre oblique inverse privée de ses deux chiffres hexadécimaux.

## Confidentialité

Les filtres contiennent souvent des noms d’attributs internes et l’arborescence des OU. Tout est analysé localement dans votre navigateur ; rien n’est transmis.

## Partage des résultats

Sous les décomptes du filtre, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, le filtre tel que saisi, y compris un filtre qui ne s’analyse pas : son erreur pointée est peut-être justement ce que vous voulez montrer. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis une mise en garde qui lui est propre : un filtre peut nommer des utilisateurs, des groupes et la structure de votre annuaire, relisez-le donc avant d’envoyer le lien. Elle propose ensuite le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

Un filtre qui affirme une valeur pour un attribut de mot de passe n’obtient pas de lien, et la fenêtre contextuelle nomme l’attribut : `userPassword` ([RFC 4519](https://www.rfc-editor.org/rfc/rfc4519), section 2.41, OID 2.5.4.35, des chaînes d’octets connues du seul utilisateur et du système, « octet strings that are known only to the user and the system »), `authPassword` ([RFC 3112](https://www.rfc-editor.org/rfc/rfc3112), OID 1.3.6.1.4.1.4203.1.3.4) et l’attribut `unicodePwd` d’Active Directory ([schéma AD de Microsoft](https://learn.microsoft.com/en-us/windows/win32/adschema/a-unicodepwd), ID d’attribut 1.2.840.113556.1.4.90), tous consultés le 01/11/2026. Ils sont reconnus par leur nom ou par leur OID, quelle que soit la casse et avec n’importe quelles options, car la [RFC 4512](https://www.rfc-editor.org/rfc/rfc4512) (section 2.5, consultée le 01/11/2026) rend les descriptions d’attribut insensibles à la casse, les options venant après un `;`. Un test de présence comme `(userPassword=*)` ne contient aucune valeur et passe.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : le filtre n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** Le filtre remplit la zone et la page l’explique comme pour un collage ; rien n’est envoyé à un annuaire. Un filtre qui affirme un mot de passe est ignoré. Dans tous les cas, la valeur quitte aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
