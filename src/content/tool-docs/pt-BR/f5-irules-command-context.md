# Explicador de comandos / contexto de iRules

Uma iRule é Tcl com um contrato: o código roda quando eventos disparam, comandos valem em alguns eventos e não em outros, e um punhado de construções silenciosamente custa todos os núcleos de CPU menos um. Esta ferramenta lê o contrato de volta.

Cole uma iRule e cada bloco `when` vira um cartão. A identidade do evento vem da Master List of iRule Events no clouddocs, condensada fielmente, com seu módulo e um link para a página de referência; eventos fora da tabela curada de escopo BIG-IP LTM - Local Traffic Manager ainda são interpretados e sinalizados, em vez de adivinhados. Os comandos do bloco são inventariados, com namespace e simples, cada um vinculado diretamente à sua página de referência.

Quando um evento aparece em mais de um bloco, a ordem de avaliação é renderizada conforme as regras documentadas do comando priority: valores de 0 a 1000, padrão 500, menor roda primeiro, mesma prioridade roda em ordem de inserção, e entre múltiplas iRules em um virtual a ordem de listagem das regras desempata o resto.

A auditoria de CMP é a parte que paga o aluguel, e cada achado tem fonte na página de CMP Compatibility. Variáveis globais não são compatíveis com CMP; o validador captura a forma global a partir da v10 e o virtual server é rebaixado, o que significa que cada conexão dele cai em um único TMM. A alternativa documentada para estáticos compartilhados é o namespace `static::`, e a ferramenta diz isso na hora. Chaves geradas em RULE_INIT ganham uma instância por TMM, então a descriptografia entre TMMs falha; perfis de estatísticas contam por instância de TMM. A auditoria nomeia cada um desses casos onde os vê.

Uma nota de honestidade, projetada de propósito: as listas de validade por comando vivem na página de referência de cada comando e variam por versão, então a ferramenta vincula a página de cada comando em vez de reproduzir tabelas de validade que não verificou. Um único nome de evento renderiza seu cartão; a palavra `events` renderiza o catálogo agrupado por módulo.

A iRule é interpretada e lida, nunca executada. Tudo roda localmente; nada do que você cola sai da página.
