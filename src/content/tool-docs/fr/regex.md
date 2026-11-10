## Ce que fait l’outil

Testez, expliquez et déboguez une expression régulière. Saisissez un motif et un texte : l’outil affiche chaque correspondance avec ses groupes de capture, en direct, pendant la saisie ; saisissez un motif seul : il le décompose en éléments annotés pour que vous puissiez lire le rôle de chaque partie ; et, dans tous les cas, il avertit quand un motif présente un risque de backtracking catastrophique. Il utilise le moteur regex de JavaScript (ECMAScript) et s’exécute entièrement dans votre navigateur.

## Quatre fonctions en une

L’outil fait les quatre choses que l’on attend réellement d’un atelier regex :

- **Tester.** Il compile votre motif et vos indicateurs, signale toute erreur de syntaxe en termes clairs, et exécute le motif sur votre texte, en renvoyant chaque correspondance avec ses groupes de capture numérotés et nommés. Le nombre de correspondances collectées est plafonné : un motif qui correspond à un texte énorme ne peut donc pas bloquer la page.
- **Expliquer.** Il analyse le motif en éléments annotés, en étiquetant chaque quantificateur, classe de caractères, groupe et assertion, pour que vous compreniez une regex sans avoir à l’exécuter de tête.
- **Détecter le ReDoS.** Il recherche les structures qui provoquent un backtracking catastrophique et vous en avertit.
- **Comparer les variantes.** Il liste chaque construction du motif dont la prise en charge ou le sens diffère entre ECMAScript, PCRE2 (NGINX) et les Advanced Regular Expressions de Tcl (iRules BIG-IP), de façon statique, sans exécuter le motif ailleurs qu’ici. La section Variantes ci-dessous l’explique.

## Le ReDoS, et pourquoi il compte ici

Le déni de service par expression régulière (ReDoS, Regular expression Denial of Service) survient quand un motif peut revenir en arrière (backtracking) d’un nombre exponentiel de façons sur certaines entrées : une chaîne courte suffit alors à faire tourner le moteur pratiquement indéfiniment. La forme classique est un quantificateur appliqué à un groupe qui contient lui-même un quantificateur, comme `(a+)+`, confronté à une entrée qui finit par échouer. Cela compte directement dans le navigateur : une recherche de correspondance regex synchrone ne peut pas être interrompue, et un motif catastrophique bloquerait donc la page. C’est pourquoi l’outil plafonne son travail et signale les motifs risqués ; c’est un véritable avertissement, à prendre en compte avant de mettre en production un motif qui s’exécutera sur des entrées non fiables. Le [lab de l’article sur le backtracking](/learn/regex-catastrophic-backtracking#lab-regex-partitions) compte les façons dont `(a+)+` peut découper une suite de a.

## Le moteur et sa variante

La syntaxe des regex varie d’un langage à l’autre, et cet outil utilise la variante JavaScript définie par la spécification ECMAScript, avec ses indicateurs (global, ignore-case, multiline, dotall, unicode et sticky) et sa prise en charge des groupes nommés et des lookarounds. Si vous écrivez une regex pour JavaScript, ou pour tout ce qui partage sa sémantique, ce que vous voyez ici est ce que vous obtiendrez. Pour tout autre moteur, voir Variantes ci-dessous.

Sous le motif, un bouton par indicateur l’ajoute au champ des indicateurs ou l’en retire, chacun portant le nom de sa propriété RegExp (`g global`, `i ignoreCase`, etc.) ; le champ reste modifiable au clavier.

## Variantes

Le testeur n’exécute qu’un moteur, ECMAScript, mais les motifs qu’écrivent les ingénieurs réseau et sécurité restent rarement en JavaScript. Un bloc `location ~` NGINX, une iRule BIG-IP et une signature de pare-feu applicatif web (WAF, web application firewall) confient chacun le motif à un moteur différent, et les mêmes caractères peuvent y avoir un autre sens. La section **Portabilité** lit les éléments de votre motif et liste chaque construction dont la prise en charge ou le sens diffère entre trois variantes :

- **ECMAScript**, tel que le définit l’édition 2026 d’ECMA-262 (la 17e édition ; sa grammaire RegExp est inchangée dans le projet 2027), avec l’annexe consacrée aux navigateurs qui, par exemple, fait de `\A` la simple lettre A quand ni l’indicateur `u` ni l’indicateur `v` n’est activé.
- **PCRE2**, tel que le décrit son propre manuel. NGINX a besoin de la bibliothèque PCRE pour les expressions régulières dans `location` et dans le module rewrite, ses directives `map` et `server_name` acceptent elles aussi des expressions régulières, et, depuis la 1.21.5, il utilise PCRE2, sauf s’il est compilé avec `--without-pcre2`, qui sélectionne la bibliothèque PCRE d’origine.
- **Les Advanced Regular Expressions (ARE) de Tcl**, telles que les décrit le manuel `re_syntax` de Tcl 8.4. F5 indique que le jeu de commandes des iRules BIG-IP a été développé à partir de la version de base 8.4.6 de Tcl (K6091), et `regexp` et `regsub` ne figurent pas sur sa liste des commandes Tcl désactivées (K36322151). Les manuels de Tcl 8.6 et 9.0 n’ajoutent ni lookbehind ni groupes nommés, et leur `\w` prend aussi en compte les caractères de ponctuation de liaison.

Chaque construction reçoit une réponse par variante : **identique** (prise en charge avec le sens qu’indique le titre de la ligne), **diffère** (prise en charge avec un autre sens ou une autre syntaxe, que la ligne précise) ou **non pris en charge** (une erreur, ou une autre lecture, que la ligne précise). La section s’affiche même quand votre navigateur ne peut pas compiler le motif, car coller un motif NGINX ou iRules est tout l’intérêt.

Là où vivent ces motifs, d’autres outils les lisent : le [testeur de correspondance des blocs location NGINX](/tools/nginx-location-matcher) montre quel bloc `location` sélectionne une URI, le [linter de performance des iRules](/tools/f5-irules-performance-linter) signale `regexp` et `regsub` là où une commande de chaîne suffirait, et l’[analyseur de scripts Expect](/tools/expect-script-explainer) lit les motifs d’un script Expect, dont les motifs `-re` suivent la syntaxe de la commande regexp de Tcl (« follow the syntax defined by Tcl's regexp », expect(1), Expect 5.45.4) : la colonne Tcl s’applique donc aussi à eux.

| Construction | ECMAScript | PCRE2 | Tcl ARE |
|---|---|---|---|
| Lookbehind, longueur fixe : `(?<=ab)`, `(?<=colour\|color)` | identique | identique : chaque branche de premier niveau de longueur fixe, jusqu’à 65 535 caractères | non pris en charge : lookahead seulement |
| Lookbehind, longueur variable avec un maximum : `(?<=colou?r)` | identique | diffère : à partir de la 10.43, chaque branche jusqu’à une limite que fixe l’appelant, 255 par défaut ; non pris en charge au-delà, ou avant la 10.43 | non pris en charge |
| Lookbehind sans maximum : `(?<=\d+)` | identique | non pris en charge | non pris en charge |
| Lookahead contenant un groupe ou une référence arrière | identique | identique | diffère : les parenthèses à l’intérieur ne capturent jamais ; une référence arrière n’est pas prise en charge |
| Groupe nommé `(?<name>...)` | identique, seule écriture possible | identique ; hors mode UTF, le nom doit être en ASCII | non pris en charge |
| Groupe nommé `(?P<name>...)` ou `(?'name'...)` | non pris en charge | identique | non pris en charge |
| Référence arrière nommée `\k<name>` | identique | identique | non pris en charge |
| `\k'name'`, `\k{name}`, `\g{name}`, `\g1`, `\g{-1}`, `(?P=name)` | non pris en charge | identique | non pris en charge |
| Modificateurs limités à un groupe `(?i:...)`, `(?i-s:...)` | identique depuis ECMAScript 2025, lettres i, m et s seulement | identique | non pris en charge |
| Options seules `(?i)`, `(?im)` | non pris en charge | identique | seulement tout au début ; i et x ont le même sens, m désigne la correspondance sensible aux sauts de ligne et s le mode par défaut |
| Quantificateurs possessifs `a++`, `a*+` | non pris en charge | identique | non pris en charge |
| Groupe atomique `(?>...)` | non pris en charge | identique | non pris en charge |
| `\A` | non pris en charge | identique | identique |
| `\Z` | non pris en charge | identique : la fin, ou avant un saut de ligne final | diffère : la toute fin seulement |
| `\z` | non pris en charge | identique | non pris en charge |
| `$` | identique : la fin ; avec `m`, avant les terminateurs de ligne | diffère : aussi avant un saut de ligne final, sauf si PCRE2_DOLLAR_ENDONLY est activé | identique : la fin ; avec `-line`, avant chaque saut de ligne |
| `.` | identique : ni LF, ni CR, ni U+2028, ni U+2029, sauf avec `s` | diffère : pas les caractères de la convention de saut de ligne, LF seul par défaut | diffère : correspond au saut de ligne, sauf si la correspondance est sensible aux sauts de ligne |
| Classe POSIX `[[:alpha:]]` | non pris en charge | identique : ASCII sauf avec PCRE2_UCP ; aussi `ascii`, `word` et `[:^name:]` | diffère : locale Unicode ; douze noms, pas de négation |
| `[[:<:]]`, `[[:>:]]` | non pris en charge | identique, converti en limite de mot | identique, obsolète |
| `\Q...\E` | non pris en charge | identique | non pris en charge ; `***=` rend toute une expression littérale |
| `\p{L}`, `\P{L}` | diffère avec `u` ou `v` (noms plus stricts) ; non pris en charge sans | identique : noms souples, noms de scripts seuls | non pris en charge |
| `\pL` | non pris en charge | identique | non pris en charge |
| Quantificateurs paresseux `*?`, `+?`, `??`, `{n,m}?` | identique | identique | diffère : règles de préférence pour la correspondance la plus longue ou la plus courte |
| `\b` | identique : caractères de mot ASCII | identique : ASCII sauf avec PCRE2_UCP | diffère : retour arrière (backspace) ; la limite de mot s’écrit `\y` |
| `\B` | identique | identique | diffère : une barre oblique inverse ; l’absence de limite de mot s’écrit `\Y` |
| `\w`, `\W` | identique : ASCII | identique : ASCII sauf avec PCRE2_UCP | diffère : locale Unicode |
| `\D`, `\S` ou `\W` entre crochets | identique | identique | non pris en charge |
| `\m`, `\M`, `\y`, `\Y` | non pris en charge : simples lettres dans un navigateur sans `u` ni `v` | non pris en charge : une erreur | identique : contraintes de mot |
| `{,n}` | non pris en charge : texte littéral sans `u` ni `v` | identique depuis la 10.43 | non pris en charge : texte littéral |

### Signatures de pare-feu applicatif web

La syntaxe des signatures de F5 pour les signatures d’attaque et de bot de BIG-IP ASM (un manuel qui s’applique de BIG-IP ASM 14.1.0 à 21.0.0) nomme trois options de règle par expression régulière. L’option `pcre` repose sur la syntaxe PCRE, mais F5 ne précise ni la bibliothèque PCRE ni sa version. L’option `re2` accepte la syntaxe de RE2, projet open source, que F5 recommande pour les performances, et cette vue ne compare pas RE2. L’option `ipp`, réservée aux signatures de bot, utilise un moteur fondé sur Intel dont F5 ne précise pas la syntaxe. La colonne PCRE2 est donc le guide le plus proche pour l’option `pcre`, sans plus.

### Ce que la vue ne vérifie pas

C’est une comparaison statique de syntaxe, pas un second moteur : elle n’exécute jamais votre motif dans PCRE2 ni dans Tcl. Elle ne vérifie ni les limites des moteurs (bornes des quantificateurs, taille du motif, limite du lookbehind au-delà de sa valeur par défaut de 255), ni les performances ou le comportement de backtracking, ni les options qu’un produit fixe pour vous (le `~*` insensible à la casse de NGINX, les modificateurs d’une signature, le mode UTF ou UCP de PCRE2, l’option `-line` de Tcl), ni les constructions absentes de sa liste, comme les appels de sous-routine, les conditions, les commentaires, `\K`, `\G`, `\R`, `\X` et les échappements hexadécimaux ou octaux. Un motif sans aucune ligne n’est pas prouvé portable : il n’utilise simplement rien de la liste.

## Utilisation

Saisissez un motif et des indicateurs, et éventuellement un texte à tester, puis lisez les correspondances en direct, l’explication élément par élément, les lignes de portabilité et tout avertissement de backtracking. **Exemple de portabilité** charge un motif que chaque variante lit différemment. Tout est calculé localement.

## Partage des résultats

Sous le texte de test, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, le motif, les indicateurs et le texte de test tels que saisis, dès qu’il y a un motif. Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas. Le texte de test est souvent constitué de données réelles : la fenêtre contextuelle vous demande donc de le relire avant d’envoyer le lien. Le texte de test part tel que saisi : les correspondances sont la lecture, et une valeur remplacée correspondrait différemment. Avant qu’un lien soit proposé, le texte est examiné à la recherche d’identifiants définis par une norme : une clé privée PEM, une ligne `Authorization` ou `Proxy-Authorization` avec n’importe quel schéma ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sections 11.6.2 et 11.7.2 : la valeur se compose d’identifiants, « consists of credentials »), une ligne `Cookie` ou `Set-Cookie` avec une valeur ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sections 4.1.1 et 4.2.1), un JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1), un mot de passe dans une URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1 : la forme « user:password » est déconseillée, « is deprecated »), un ID de clé d’accès AWS ou une valeur FortiOS `ENC` ; toutes consultées le 01/11/2026. Si l’un d’eux est présent, pas de lien : la fenêtre contextuelle nomme le champ et la ligne, vous le remplacez par une valeur fictive et vous appuyez de nouveau. Une valeur dont seul le nom ressemble à un secret (un `password=` dans une chaîne de requête, `api_key = ...`) ne bloque pas le lien ; la fenêtre contextuelle nomme la première pour que vous puissiez la vérifier.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : ce qui suit le `#` n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Longueur.** Au plus 16 384 caractères au total, la limite que le site applique à toute valeur placée après le `#` ; au-delà, aucun lien n’est créé et la fenêtre contextuelle indique la longueur.
- **Ouverture d’un lien.** Les trois champs se remplissent comme si vous les saisissiez, et la page explique le motif et cherche les correspondances. Un motif que la vérification statique signale pour backtracking catastrophique attend toujours derrière **Exécuter quand même** : un lien ne donne jamais ce consentement. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.

## Sources

- [ECMA-262, ECMAScript 2026 Language Specification (17th edition), 22.2.1 Patterns](https://tc39.es/ecma262/2026/#sec-patterns), [22.2.2 Pattern Semantics](https://tc39.es/ecma262/2026/#sec-pattern-semantics), [Annex B.1.2 Regular Expressions Patterns](https://tc39.es/ecma262/2026/#sec-regular-expressions-patterns) et l’[Introduction](https://tc39.es/ecma262/2026/#sec-intro) (ECMAScript 2025 a ajouté les modificateurs en ligne) (consultés le 26/10/2026)
- [ECMA-262 draft, 22.2 RegExp Objects](https://tc39.es/ecma262/multipage/text-processing.html) : la grammaire des motifs du projet 2027 correspond à celle de l’édition 2026 (consulté le 26/10/2026)
- [PCRE2 manual: pcre2pattern](https://www.pcre2.org/doc/pcre2pattern/), [pcre2syntax](https://www.pcre2.org/doc/pcre2syntax/), [pcre2api](https://www.pcre2.org/doc/pcre2api/) et [pcre2build](https://www.pcre2.org/doc/pcre2build/) (manuel 10.50-DEV ; consultés le 26/10/2026)
- [Tcl 8.4 manual: re_syntax](https://www.tcl-lang.org/man/tcl8.4/TclCmd/re_syntax.htm) et [regexp](https://www.tcl-lang.org/man/tcl8.4/TclCmd/regexp.htm) ; [Tcl 8.6.18: re_syntax](https://www.tcl-lang.org/man/tcl8.6/TclCmd/re_syntax.htm) ; [Tcl 9.0.4: re_syntax](https://www.tcl-lang.org/man/tcl9.0/TclCmd/re_syntax.html) (consultés le 26/10/2026)
- [F5 K6091: The version of Tcl used to develop iRules](https://my.f5.com/manage/s/article/K6091) et [K36322151: List of disabled Tcl commands for iRules (12.x - 17.x)](https://my.f5.com/manage/s/article/K36322151) (consultés le 26/10/2026)
- [F5 BIG-IP ASM: Attack and Bot Signatures, Signature Syntax](https://techdocs.f5.com/en-us/bigip-14-1-0/big-ip-asm-attack-and-bot-signatures-14-1-0/signature-syntax.html) (s’applique de BIG-IP ASM 14.1.0 à 21.0.0 ; consulté le 26/10/2026)
- nginx : [location](https://nginx.org/en/docs/http/ngx_http_core_module.html#location), [map](https://nginx.org/en/docs/http/ngx_http_map_module.html#map), [Building nginx from Sources](https://nginx.org/en/docs/configure.html) et [Regular expression captures](https://nginx.org/en/docs/regex_captures.html) (consultés le 26/10/2026)
- [expect(1), Expect 5.45.4 manual source](https://core.tcl-lang.org/expect/raw?name=expect.man&ci=expect-5-45-4) (consulté le 27/10/2026) : les motifs de type regexp suivent la syntaxe définie par la commande regexp de Tcl
