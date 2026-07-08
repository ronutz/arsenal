## O que a ferramenta faz

Descreva uma falha em seis campos estruturados - sintoma, escopo, mudança recente, padrão temporal, pistas de camada observadas e um preset de domínio - e um registro fixo de 25 regras originais dispara deterministicamente sobre essa descrição. O resultado são HIPÓTESES A TESTAR, classificadas, em 13 domínios de falha (regressão por mudança, resolução de nomes, TLS/PKI, capacidade, MTU do caminho, ambiente do cliente, dependência compartilhada, caminho assimétrico, cadeia de identidade, backend parcial, aplicação/backend, lacuna de provisionamento, provedor externo). Cada hipótese carrega três partes honestas: as evidências que valem a coleta, as observações que a SUSTENTARIAM e as observações que a ENFRAQUECERIAM. Avisos de qualidade verificam a própria entrada - "nada mudou" é sinalizado como uma hipótese a confirmar no registro de mudanças, não como um fato. Um clique exporta uma planilha em Markdown pronta para o chamado, o chat da ponte de crise ou um caso de TAC, com as evidências que você marcou assinaladas.

## O que ela deliberadamente não é

Esta ferramenta estrutura; nunca diagnostica. Não faz afirmações de causa raiz, não executa remediação, não abre conexões de rede e não pede credenciais nem segredos. Não substitui o TAC do fornecedor, a aprovação de mudanças nem a revisão de produção - ela organiza melhor a sua primeira hora com eles. As notas de texto livre (resumo, impacto, já tentado) entram apenas na planilha exportada; nunca influenciam a classificação, então o comportamento do motor permanece totalmente determinístico.

## Como a classificação funciona - e como é verificada

Cada regra é um predicado puro sobre a entrada estruturada, com uma contribuição fixa de pontos para uma hipótese; as pontuações se acumulam, e o desempate determinístico é a ordem do registro. O selo de sinal é uma faixa de pontuação (forte ≥ 60, moderado ≥ 30, fraco abaixo), chamado deliberadamente de "sinal" e não de confiança: descreve quais regras dispararam, não uma probabilidade sobre o mundo. O painel "Por que esta classificação?" expõe cada regra disparada com seus pontos, tornando o conselho auditável.

Como não existe um conjunto "correto" de hipóteses para uma ferramenta consultiva, os vetores dourados clássicos não se aplicam. O modelo de verificação - definido por este piloto para toda a família Operações e fieldcraft - são VETORES DE INSTANTÂNEO DE DISPARO DE REGRAS: para cada entrada de teste, o build assevera exatamente quais regras disparam, em que ordem, a lista exata de hipóteses classificadas com pontuações e faixas de sinal, e o conjunto exato de avisos. Treze vetores (oito cenários, cinco rejeições) fixam o registro atual; qualquer deriva em regras, pesos ou classificação quebra o build.

## Entrada da API

A entrada de paridade da API recebe um objeto JSON: `{"symptom", "scope", "changed": [], "timing", "clues": [], "preset", "notes": {"summary", "impact", "alreadyTried"}}`. Todos os campos, exceto `notes`, usam os vocabulários fechados mostrados no formulário; um valor fora do vocabulário é um erro de formato, nunca um palpite. `changed` deve conter ao menos `nothing-known`.
