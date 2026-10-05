## O que faz

Recebe um nível de log de um sistema, pelo nome ou pelo número que esse sistema usa, e o lê contra outros nove sistemas por uma escala comum, o SeverityNumber do OpenTelemetry. A resposta nomeia o degrau escolhido, onde ele fica na escala (1 a 24, em seis faixas de quatro), o degrau mais próximo em cada uma das outras escadas, se esse vizinho é exato ou está a uma distância declarada, e os empates em que o mapeamento não é um para um. Abaixo da resposta a tabela inteira é desenhada: cada escada com seus próprios números, suas próprias palavras e sua própria ressalva, com o degrau escolhido aceso. Nada é enviado a lugar nenhum.

## As escadas e onde cada uma fica

A escala é a do OpenTelemetry. O Logs Data Model define o SeverityNumber como 24 valores em seis faixas, TRACE 1 a 4, DEBUG 5 a 8, INFO 9 a 12, WARN 13 a 16, ERROR 17 a 20 e FATAL 21 a 24, com 0 significando não especificado; "valores numéricos menores correspondem a eventos menos severos" (lido em 05/10/2026). O Apêndice B do mesmo documento traz o mapeamento de exemplo que esta ferramenta segue para os sistemas que ele lista:

| Sistema | Direção dos números | Onde seus degraus caem (Apêndice B) |
| --- | --- | --- |
| syslog, RFC 5424 §6.2.1 Tabela 2 | 0 é o mais severo | Debug 7 em 5, Informational 6 em 9, Notice 5 em 10, Warning 4 em 13, Error 3 em 17, Critical 2 em 18, Alert 1 em 19, Emergency 0 em 21 |
| Windows Event Log (níveis do winmeta) | 1 é o mais severo | Verbose 5 em 5, Informational 4 em 9, Warning 3 em 13, Error 2 em 17, Critical 1 em 18; LogAlways 0 não é uma severidade |
| Log4j 2 | número de prioridade menor é mais severo | TRACE 600 em 1, DEBUG 500 em 5, INFO 400 em 9, WARN 300 em 13, ERROR 200 em 17, FATAL 100 em 21; OFF 0 e ALL são filtros |
| java.util.logging | os números crescem com a severidade | FINEST 300 em 1, FINER 400 em 5, FINE 500 em 6, CONFIG 700 em 7, INFO 800 em 9, WARNING 900 em 13, SEVERE 1000 em 17; OFF e ALL são os extremos do inteiro |
| .NET Microsoft.Extensions.Logging | 0 é o menos severo | Trace 0 em 1, Debug 1 em 5, Information 2 em 9, Warning 3 em 13, Error 4 em 17, Critical 5 em 21; None 6 é um valor de filtro |

Três escadas são posicionadas pela correspondência com as severidades do syslog, que elas reutilizam por número e por nome:

- printk do kernel Linux: KERN_EMERG "0" a KERN_DEBUG "7", escritos como strings no prefixo da mensagem; KERN_DEFAULT e KERN_CONT não são níveis (documentação do kernel, lida em 05/10/2026).
- logging do Cisco IOS: emergencies 0 a debugging 7, cada um pareado com sua constante LOG_* na referência de comandos, cuja tabela também diz que o nível padrão do buffer "varia por plataforma, mas geralmente é 7" (lida em 05/10/2026).
- syslog de sistema do Junos: emergency, alert, critical, error, warning, notice e info, nessa ordem, com "any" selecionando todos os níveis e "none" desativando o log; a página da Juniper dá os nomes, não números, e não tem degrau de debug (lida em 05/10/2026).

O módulo logging do Python é posicionado pelo próprio SDK OpenTelemetry para Python, cuja tabela `_STD_TO_OTEL` mapeia 10 DEBUG em 5, 20 INFO em 9, 30 WARNING em 13, 40 ERROR em 17 e 50 CRITICAL em 21, e os inteiros intermediários nos passos seguintes da faixa (lido em 05/10/2026). NOTSET (0) significa "consulte os ancestrais" e não é um nível de mensagem.

A tabela de equivalentes nomeia uma correspondência exata quando outra escada tem um degrau no mesmo SeverityNumber e, caso contrário, o degrau mais próximo com sua distância na escala. Quando dois degraus estão igualmente próximos, ambos são mostrados e a linha é marcada como empate. Sentinelas (OFF, ALL, NOTSET, None, LogAlways, any, none) aparecem na sua escada, mas nunca são oferecidas como equivalentes: são valores de filtro, não a severidade de mensagem alguma.

## Limites

- Os posicionamentos são os exemplos das fontes, não um padrão: o Apêndice B se intitula "example mappings", e um coletor ou um agente pode escolher de outro modo. A ferramenta mostra a tabela que usou para que o leitor possa discordar de uma linha específica.
- As palavras de cada sistema continuam importando. "Critical" do Windows cai em 18 (ERROR2) enquanto "Critical" do .NET cai em 21 (FATAL): os nomes coincidem, os lugares não, e a tabela diz isso em vez de alisar a diferença.
- Escadas não listadas (Zap, Ruby, slog do Go, Serilog e as demais) ficam fora do escopo até que uma fonte para o seu posicionamento seja lida.
- Níveis personalizados (inteiros arbitrários do Python, 16 a 255 do Windows, níveis personalizados do Log4j) não são mapeados; não carregam severidade padronizada.

## Fontes

- [Especificação OpenTelemetry, Logs Data Model: campo SeverityNumber, e Apêndice B, SeverityNumber example mappings](https://opentelemetry.io/docs/specs/otel/logs/data-model/) (lido em 05/10/2026)
- [RFC 5424, The Syslog Protocol, seção 6.2.1 Tabela 2, as severidades](https://www.rfc-editor.org/rfc/rfc5424#section-6.2.1) (lido em 05/10/2026)
- [Documentação do kernel Linux, Message logging with printk](https://www.kernel.org/doc/html/latest/core-api/printk-basics.html) (lido em 05/10/2026)
- [Cisco IOS Configuration Fundamentals Command Reference, logging buffered, a tabela de níveis de severidade](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/fundamentals/command/cf_command_ref/L_through_mode.html) (lido em 05/10/2026)
- [Juniper Networks, Junos OS, syslog facilities and severity levels](https://juniper.net/documentation/en_US/junos13.1/topics/reference/general/syslog-facilities-severity-levels.html) (publicado em 08/07/2013, lido em 05/10/2026)
- [Microsoft Learn, Windows Event Log, LevelType complex type, os níveis predefinidos](https://learn.microsoft.com/en-us/windows/win32/wes/eventmanifestschema-leveltype-complextype) (lido em 05/10/2026)
- [Microsoft Learn, enum Microsoft.Extensions.Logging.LogLevel](https://learn.microsoft.com/en-us/dotnet/api/microsoft.extensions.logging.loglevel) (lido em 05/10/2026)
- [Documentação do Python, logging, Logging Levels](https://docs.python.org/3/library/logging.html#logging-levels) (lido em 05/10/2026)
- [SDK OpenTelemetry para Python, a tabela _STD_TO_OTEL no SDK de logs](https://github.com/open-telemetry/opentelemetry-python/blob/main/opentelemetry-sdk/src/opentelemetry/sdk/_logs/_internal/__init__.py) (lido em 05/10/2026)
- [API Java SE 21, java.util.logging.Level](https://docs.oracle.com/en/java/javase/21/docs/api/java.logging/java/util/logging/Level.html) (lido em 05/10/2026)
- [Manual do Apache Log4j 2.x, Levels](https://logging.apache.org/log4j/2.x/manual/customloglevels.html) (lido em 05/10/2026)
