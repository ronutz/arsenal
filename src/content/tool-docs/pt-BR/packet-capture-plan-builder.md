## O que a ferramenta faz

Descreva o caminho e o sintoma em sete campos estruturados - arquétipo do caminho, sintoma, classe de tráfego, intermediários, transformação, acesso de captura e comportamento no tempo, mais um preset de família de comandos - e um registro fixo de 35 regras originais dispara deterministicamente sobre essa descrição. O resultado é um PLANO DE CAPTURA EM FASES: pontos de captura ranqueados em 13 fronteiras nomeadas (ponta, pré/pós-firewall, frente do VIP, lado dos membros, frente/trás do proxy, lado externo/interno da VPN, resolver, egresso, espelho), cada um com um modelo de filtro neutro e as observações que pode estabelecer; uma matriz de interpretação dizendo, para cada conclusão candidata, o que a SUSTENTARIA e o que a ENFRAQUECERIA - decidido ANTES de coletar um único pacote; um checklist de sincronização e autorização; e alertas de exposição mínima para classes de tráfego sensíveis. Um clique exporta o plano em Markdown para o ticket, o chat da ponte ou o pedido de captura a outro time.

## O que ela deliberadamente não é

Construtores de comandos respondem "como capturo?"; esta ferramenta responde "onde, por que e o que significaria?" - e para aí. Ela PLANEJA a coleta e nunca ingere arquivos de captura (essa fronteira de privacidade é estrutural, não política). Não fornece orientação de interceptação, evasão ou contorno de criptografia. Os filtros são modelos com `<placeholders>`, nunca declarados exatos para uma versão específica de produto; as notas de preset citam famílias de comandos apenas nominativamente. Autorização de captura, retenção e controle de acesso são nomeados como SUA responsabilidade em todo plano - a regra de autorização dispara incondicionalmente. Rótulos e notas em texto livre vão apenas para a exportação; nunca influenciam as regras.

## Como o plano é construído - e como é verificado

Cada regra é um predicado puro sobre a entrada estruturada que contribui pontos para pontos de captura do catálogo, além de expectativas, itens de checklist, alertas e candidatos da matriz de interpretação. O ranking é por pontuação decrescente com a ordem do catálogo como desempate determinístico; o selo de sinal é uma faixa de pontuação (forte ≥ 60, moderado ≥ 30, fraco abaixo) que descreve quais regras dispararam, nunca uma probabilidade. A fase 1 é o conjunto mínimo viável (pontos com ≥ 30, no máximo quatro, piso de dois); a fase 2 é a expansão. O painel "Por que esses pontos?" expõe cada regra disparada.

A verificação segue o modelo de snapshot de disparo de regras do cluster: para cada entrada de teste, o build afirma exatamente quais regras disparam, a lista exata de pontos ranqueados com pontuações e faixas de sinal, o conjunto exato de alertas e - específico desta ferramenta - o conjunto exato da fase 1. Treze vetores (nove cenários, quatro rejeições) fixam o registro atual; qualquer deriva quebra o build.

## Entrada da API

A entrada com paridade de API recebe um objeto JSON: `{"archetype", "symptom", "trafficClass", "intermediaries", "transformation", "access", "timeBehavior", "preset", "notes": {"labels", "reference", "notes"}}`. Todos os campos exceto `notes` usam os vocabulários fechados do formulário; um valor fora do vocabulário é erro de formato, nunca um palpite.
