# Analyseur des méthodes SSO d’APM

Après l’authentification, le travail de BIG-IP Zero Trust Access (anciennement BIG-IP APM, Access Policy Manager) consiste à continuer de s’authentifier à votre place, et le chapitre Single Sign-On Methods définit exactement huit façons de le faire : HTTP Basic, NTLMv1, NTLMv2, la délégation contrainte Kerberos (Kerberos constrained delegation), Form Based, Forms - Client Initiated, OAuth Bearer et SAML. Cet outil présente chacune sous forme de carte avec son mécanisme, la circulation de ses identifiants, ses prérequis et ses particularités, le tout résumé fidèlement à partir du chapitre et des guides propres à chaque méthode.

Le verdict de chaque carte est le paragraphe du chapitre lui-même sur le périmètre d’impact, et c’est l’information opérationnelle principale : un objet SSO mal configuré pour HTTP Basic, NTLMv1, NTLMv2, Kerberos, OAuth Bearer ou SAML peut désactiver le SSO pour toutes les méthodes d’authentification de la session de cet utilisateur. Form Based et Forms - Client Initiated sont les deux seules méthodes qui ne sont pas désactivées quand l’objet d’une autre méthode est défaillant. Une seule configuration SSO Kerberos erronée, et chaque application de la session peut perdre son SSO ; une seule configuration de formulaire erronée, et seule cette application le perd. Cette asymétrie détermine le soin que mérite chaque classe d’objets.

La carte Kerberos donne la liste complète des prérequis : un compte de délégation dans Active Directory par realm de serveur, son SPN saisi comme Account Name au format SPN, le realm en majuscules, la Resource-Based Constrained Delegation (délégation contrainte basée sur les ressources) pour les environnements à plusieurs realms, et la phrase du manuel lui-même, qui mérite d’être encadrée : le SSO Kerberos d’APM n’a pas besoin de fichier keytab et n’en utilise pas. Ses points d’entrée naturels sont les méthodes où le mot de passe ne circule jamais en clair, les certificats clients et NTLM figurant parmi les exemples du chapitre lui-même. NTLMv2 s’accompagne d’une particularité documentée : une réponse 401 comportant plus d’un en-tête WWW-Authenticate: NTLM fait échouer le SSO, comportement attendu selon le manuel. Forms - Client Initiated présente le détail le plus ingénieux de sa conception : le JavaScript qu’insère APM attribue au paramètre du mot de passe un jeton plutôt que le mot de passe réel, si bien que l’identifiant ne figure jamais dans la page.

La remarque sur la mécanique, affichée à chaque recherche, relie les méthodes à la machinerie : les agents de la politique d’accès renseignent les variables de session que consomme le SSO, le câblage classique étant une Logon Page suivie d’un SSO Credential Mapping, qui fait passer session.logon.last.* dans session.sso.token.last.*.

Saisissez le nom d’une méthode (des alias comme `ntlm`, `fbci` ou `kcd` fonctionnent aussi), ou `methods` pour les huit ; ou appuyez sur le bouton de la méthode sous la zone, qui la remplit à votre place.

Tout s’exécute localement ; rien de ce que vous saisissez ne quitte la page.

## Partage des résultats

En tête de la lecture, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, le nom de la méthode tel que saisi, et rien d’autre. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

La page n’accepte aucune configuration SSO : elle lit un nom dans sa table des huit méthodes, ou `methods`, et refuse tout le reste. Un lien n’est proposé que pour un nom qu’elle lit, et un lien entrant n’est accepté qu’à la même condition : ni un objet SSO ni des identifiants ne peuvent donc y voyager.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 27/10/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : le texte n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** Le texte remplit la zone comme le ferait un collage, et la page le lit ; rien n’est envoyé nulle part. La valeur quitte ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.
