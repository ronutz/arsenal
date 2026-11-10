## Ce que fait l’outil

Vous examinez un évènement de WAF (pare-feu applicatif web) ou une ligne de journal d’application qui contient quelque chose comme `%{(#_memberAccess["allowStaticMethodAccess"]=true)...}`. L’outil lit cette chaîne et vous dit ce qu’elle cherchait à faire : quelles constructions elle contient, si elles reviennent à désactiver le bac à sable des expressions, à exécuter une commande, les deux ou ni l’un ni l’autre, et à quelle famille d’avis de sécurité publiés sa forme correspond. Il s’exécute entièrement dans votre navigateur et n’évalue jamais aucune partie de ce que vous collez.

## Ce que l’outil n’est pas

C’est un décodeur. Il lit des charges utiles déjà arrivées quelque part et les explique. Il ne construit pas de charges utiles, ne suggère pas de variantes de celle que vous avez collée et ne contient aucune bibliothèque de modèles où puiser : tout ce qu’il reconnaît est une syntaxe publique, documentée dans les bulletins de sécurité d’Apache eux-mêmes et visible dans les journaux de quiconque exploite un serveur web sur l’Internet public. Expliquer un artefact capturé est la moitié défensive du travail. Produire de nouveaux artefacts n’est pas la vocation de ce site, et l’outil est construit de sorte que la lecture de son code source ne vous apprenne rien que l’avis ne donne déjà.

## OGNL en un paragraphe

Object-Graph Navigation Language est un langage d’expressions qui sert à lire et à écrire les propriétés d’objets Java. Il existe pour qu’un framework puisse laisser la configuration atteindre une application en cours d’exécution : lire telle propriété, appeler telle méthode, formater le résultat. C’est réellement utile, et c’est aussi tout le problème : une expression capable d’appeler des méthodes sur des objets vivants n’est sûre que tant que les expressions évaluées ont été écrites par quelqu’un de confiance. Apache Struts a passé plusieurs années à corriger une famille de failles qui partageaient toutes une même forme : une entrée fournie par l’attaquant atteignait un évaluateur qui la traitait comme de la configuration.

## Les deux moitiés que cherche l’outil

Une tentative efficace contre la famille Struts exigeait deux choses, et l’outil les signale séparément, car la différence vous indique à quoi vous avez affaire. La première est une évasion du bac à sable : OGNL restreint ce qu’une expression peut toucher au moyen d’un objet appelé `_memberAccess`, et l’évasion consiste à atteindre cet objet et à désactiver ses restrictions. La seconde est une primitive d’exécution, généralement un appel à l’objet `Runtime` de la JVM suivi de `exec`, qui lance un processus du système d’exploitation.

Une charge utile qui contient les deux est une véritable tentative d’exploitation et mérite un traitement complet : établir si la requête a été bloquée, ce que l’application en a fait, et si l’environnement d’exécution était corrigé. Une charge utile qui ne contient que l’appel d’exécution est bien plus courante et bien moins alarmante, car sur un environnement corrigé cet appel est tout simplement refusé : elle signifie généralement qu’un scanner parcourt une liste, pas que quelqu’un s’est penché sur votre application. Une charge utile qui ne contient que la syntaxe d’expression est le plus souvent une sonde, qui vérifie si l’entrée est évaluée avant d’envoyer quoi que ce soit de coûteux. Cette réponse compte plus qu’il n’y paraît : si elle est négative, rien d’autre dans la liste ne fonctionnera non plus.

## Familles d’avis de sécurité

Quand la forme est caractéristique, l’outil nomme la famille d’avis : la faille de 2017 dans l’analyseur multipart, où l’en-tête `Content-Type` lui-même était évalué en cas d’échec de l’analyse ; la famille plus large de l’accès aux membres (member-access), dont les correctifs ont restreint à plusieurs reprises ce qu’une expression pouvait atteindre ; et le problème de 2018 où les valeurs namespace et result étaient évaluées, ce qui faisait d’un chemin d’URL un vecteur d’exécution. Ces familles sont présentées comme compatibles avec la charge utile, et non comme une identification, car plusieurs familles partagent une même forme, et une charge utile prouve ce qui a été tenté plutôt que ce qui était présent.

## Ce que l’outil ne vous dit pas, délibérément

Trois choses, affichées à chaque fois plutôt que cachées derrière une option, car la façon la plus dangereuse de lire cette page est de n’y voir aucun constat et d’en conclure que tout va bien.

L’outil ne peut pas vous dire si la requête a été bloquée : cela figure dans l’évènement du WAF, pas dans la charge utile. Il ne peut pas vous dire si l’application a évalué l’expression, ce qui dépend de la version et de la configuration du framework, et non de la chaîne. Enfin, l’absence de construction reconnue n’est pas l’absence de risque : les charges utiles sont couramment encodées en URL, doublement encodées ou réparties sur plusieurs paramètres ; décodez d’abord, lisez ensuite. Un résultat vierge sur une charge utile encodée signifie que l’outil a lu l’encodage, pas l’attaque.
