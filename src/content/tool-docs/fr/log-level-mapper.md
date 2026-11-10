## Ce que fait l’outil

L’outil prend un niveau de journalisation d’un système, par son nom ou par le numéro propre à ce système, et le lit dans neuf autres systèmes à travers une échelle commune, le SeverityNumber d’OpenTelemetry. La réponse nomme l’échelon choisi, sa place sur l’échelle (de 1 à 24, en six plages de quatre), l’échelon le plus proche dans chacune des autres hiérarchies de niveaux, en précisant si ce voisin correspond exactement ou à quelle distance il se trouve, et les égalités là où une correspondance n’est pas biunivoque. Sous la réponse, la table complète est dessinée : chaque hiérarchie avec ses propres numéros, ses propres mots et sa propre mise en garde, l’échelon choisi mis en évidence. Rien n’est envoyé nulle part.

## Les hiérarchies et leur place

L’échelle commune est celle d’OpenTelemetry. Le Logs Data Model définit SeverityNumber comme 24 valeurs réparties en six plages, TRACE de 1 à 4, DEBUG de 5 à 8, INFO de 9 à 12, WARN de 13 à 16, ERROR de 17 à 20 et FATAL de 21 à 24, 0 signifiant « non spécifié » ; les valeurs numériques les plus petites correspondent aux évènements les moins graves (« smaller numerical values correspond to less severe events », consulté le 05/10/2026). L’annexe B du même document donne l’exemple de correspondance que suit l’outil pour les systèmes qu’elle énumère :

| Système | Sens des numéros | Où tombent ses échelons (annexe B) |
| --- | --- | --- |
| syslog, RFC 5424 §6.2.1, tableau 2 | 0 est le plus grave | Debug 7 → 5, Informational 6 → 9, Notice 5 → 10, Warning 4 → 13, Error 3 → 17, Critical 2 → 18, Alert 1 → 19, Emergency 0 → 21 |
| Windows Event Log (niveaux winmeta) | 1 est le plus grave | Verbose 5 → 5, Informational 4 → 9, Warning 3 → 13, Error 2 → 17, Critical 1 → 18 ; LogAlways 0 n’est pas une gravité |
| Log4j 2 | plus le numéro de priorité est bas, plus le niveau est grave | TRACE 600 → 1, DEBUG 500 → 5, INFO 400 → 9, WARN 300 → 13, ERROR 200 → 17, FATAL 100 → 21 ; OFF 0 et ALL sont des filtres |
| java.util.logging | les numéros croissent avec la gravité | FINEST 300 → 1, FINER 400 → 5, FINE 500 → 6, CONFIG 700 → 7, INFO 800 → 9, WARNING 900 → 13, SEVERE 1000 → 17 ; OFF et ALL sont les extrêmes des entiers |
| .NET Microsoft.Extensions.Logging | 0 est le moins grave | Trace 0 → 1, Debug 1 → 5, Information 2 → 9, Warning 3 → 13, Error 4 → 17, Critical 5 → 21 ; None 6 est une valeur de filtre |

Trois hiérarchies sont placées d’après leur correspondance avec les niveaux de gravité de syslog, dont elles reprennent les numéros et les noms :

- printk du noyau Linux : de KERN_EMERG « 0 » à KERN_DEBUG « 7 », écrits sous forme de chaînes dans le préfixe du message ; KERN_DEFAULT et KERN_CONT ne sont pas des niveaux (documentation du noyau, consultée le 05/10/2026).
- Journalisation de Cisco IOS : de emergencies 0 à debugging 7, chacun associé à sa constante LOG_* dans la référence des commandes, dont le tableau précise aussi que le niveau par défaut de la journalisation en mémoire tampon (buffered) dépend de la plateforme (« varies by platform but is generally 7 », consultée le 05/10/2026).
- system syslog de Junos : emergency, alert, critical, error, warning, notice et info, dans cet ordre, « any » sélectionnant tous les niveaux et « none » désactivant la journalisation ; la page de Juniper donne les noms, pas de numéros, et n’a pas d’échelon debug (consultée le 05/10/2026).

Le module logging de Python est placé d’après le SDK (software development kit, kit de développement logiciel) OpenTelemetry pour Python lui-même, dont la table `_STD_TO_OTEL` fait correspondre 10 DEBUG à 5, 20 INFO à 9, 30 WARNING à 13, 40 ERROR à 17 et 50 CRITICAL à 21, et les entiers intermédiaires aux échelons suivants de la plage (consultée le 05/10/2026). NOTSET (0) signifie « consulter les loggers ancêtres » et n’est pas un niveau de message.

La table des équivalents indique une correspondance exacte quand une autre hiérarchie a un échelon sur le même SeverityNumber, et sinon l’échelon le plus proche avec sa distance sur l’échelle commune. Quand deux échelons sont aussi proches l’un que l’autre, les deux sont affichés et la ligne est marquée comme une égalité. Les valeurs sentinelles (OFF, ALL, NOTSET, None, LogAlways, any, none) figurent dans leur hiérarchie mais ne sont jamais proposées comme équivalents : ce sont des valeurs de filtre, pas la gravité d’un message.

## Partage des résultats

Sous le verdict, le bouton **Partager les résultats** crée, seulement quand vous appuyez dessus, un lien vers cette page qui contient, après le `#`, le niveau tel que saisi (`input`) et le système par sa clé (`system`). Sa fenêtre contextuelle indique d’abord ce que contient le lien, puis propose le bouton Copier le lien et, si le navigateur en dispose, sa feuille de partage ; l’adresse de la page ne change pas.

Le préréglage mis en évidence ne figure pas dans le lien : il indique seulement la pastille sur laquelle vous avez appuyé.

La [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, consultée le 01/11/2026) précise que le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference ») : le niveau n’est donc pas envoyé au serveur à l’ouverture du lien ; il reste dans la barre d’adresse et l’historique de la personne qui l’ouvre, et quiconque possède le lien peut le lire.

- **Ouverture d’un lien.** Le système et le niveau sont renseignés et la page établit leur correspondance, comme si vous les aviez choisis et saisis. Les valeurs quittent ensuite aussitôt l’adresse de la page, sans aucune requête : un rechargement, ou le bouton Partager de la page, n’emporte donc rien.

## Limites

- Les placements sont les exemples des sources, pas une norme : l’annexe B s’intitule « example mappings » (exemples de correspondances), et un collecteur ou un agent peut faire d’autres choix. L’outil affiche la table utilisée pour que vous puissiez contester une ligne précise.
- Les mots propres à chaque système comptent quand même. Le niveau « Critical » de Windows tombe à 18 (ERROR2), celui de .NET à 21 (FATAL) : les noms coïncident, pas les positions, et la table le dit au lieu de lisser l’écart.
- Les hiérarchies non listées (Zap, Ruby, Go slog, Serilog, etc.) restent hors du périmètre tant qu’aucune source sur leur placement n’a été lue.
- Les niveaux personnalisés (les entiers arbitraires de Python, les niveaux 16 à 255 de Windows, les niveaux personnalisés de Log4j) ne sont pas mis en correspondance ; ils ne portent aucune gravité normalisée.

## Sources

- [OpenTelemetry specification, Logs Data Model: field SeverityNumber, and Appendix B, SeverityNumber example mappings](https://opentelemetry.io/docs/specs/otel/logs/data-model/) (consulté le 05/10/2026)
- [RFC 5424, The Syslog Protocol, section 6.2.1 Table 2, the severities](https://www.rfc-editor.org/rfc/rfc5424.html#section-6.2.1) (consultée le 05/10/2026)
- [The Linux Kernel documentation, Message logging with printk](https://www.kernel.org/doc/html/latest/core-api/printk-basics.html) (consultée le 05/10/2026)
- [Cisco IOS Configuration Fundamentals Command Reference, logging buffered, the severity level table](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/fundamentals/command/cf_command_ref/L_through_mode.html) (consultée le 05/10/2026)
- [Juniper Networks, Junos OS, syslog facilities and severity levels](https://juniper.net/documentation/en_US/junos13.1/topics/reference/general/syslog-facilities-severity-levels.html) (publiée le 08/07/2013, consultée le 05/10/2026)
- [Microsoft Learn, Windows Event Log, LevelType complex type, the predefined levels](https://learn.microsoft.com/en-us/windows/win32/wes/eventmanifestschema-leveltype-complextype) (consulté le 05/10/2026)
- [Microsoft Learn, Microsoft.Extensions.Logging.LogLevel enum](https://learn.microsoft.com/en-us/dotnet/api/microsoft.extensions.logging.loglevel) (consulté le 05/10/2026)
- [Python documentation, logging, Logging Levels](https://docs.python.org/3/library/logging.html#logging-levels) (consultée le 05/10/2026)
- [OpenTelemetry Python SDK, the _STD_TO_OTEL table in the logs SDK](https://github.com/open-telemetry/opentelemetry-python/blob/main/opentelemetry-sdk/src/opentelemetry/sdk/_logs/_internal/__init__.py) (consultée le 05/10/2026)
- [Java SE 21 API, java.util.logging.Level](https://docs.oracle.com/en/java/javase/21/docs/api/java.logging/java/util/logging/Level.html) (consulté le 05/10/2026)
- [Apache Log4j 2.x manual, Levels](https://logging.apache.org/log4j/2.x/manual/customloglevels.html) (consulté le 05/10/2026)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax, section 3.5](https://www.rfc-editor.org/rfc/rfc3986#section-3.5) (consultée le 01/11/2026) : le fragment est séparé du reste de l’URI avant tout déréférencement (« separated from the rest of the URI prior to a dereference »), ce sur quoi repose le partage des résultats
