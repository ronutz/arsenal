## O que faz

Leia as duas propriedades que o F5 publica para toda attack signature no F5 AWAF - Advanced WAF (antigo BIG-IP ASM - Application Security Manager): sua Accuracy e seu Risk. Adicione se a signature sequer se aplica aos seus sistemas e se está enforced, e a ferramenta diz o quão propensa a falso positivo a signature é, o quanto de dano um match real causaria, e a jogada de ajuste que decorre. É determinística e roda inteiramente no seu navegador.

## Por que propriedades, e não uma busca por ID de signature

O signature set do F5 é proprietário e enorme, então uma base de dados por ID não seria viável nem honesta. Mas o F5 documenta o que Accuracy e Risk significam para toda signature, e essas duas propriedades são o que de fato dirige o ajuste de falso positivo, então a ferramenta trabalha a partir delas. Você lê Accuracy, Risk e Systems direto da própria entrada da signature na política.

## Accuracy é suscetibilidade a falso positivo

O F5 define accuracy como a capacidade de uma signature de identificar o ataque, incluindo sua suscetibilidade a alarmes de falso positivo, e afirma claramente que accuracy maior resulta em menos falsos positivos. Então uma signature de accuracy Baixa tem alta probabilidade de falsos positivos, Média tem alguma, e Alta tem baixa probabilidade. Risk é um eixo separado: o dano potencial se o ataque for bem-sucedido, de reconhecimento (Baixo) a exposição de dados sensíveis ou dano moderado (Médio) a comprometimento total do sistema ou negação de serviço (Alto).

## O quadrante accuracy por risk

A ferramenta coloca a signature em um 2x2. Accuracy baixa mais risk baixo é o principal candidato a relaxar: falsos positivos frequentes, pouco perdido ao relaxar. Accuracy baixa mais risk alto é propensa a falso positivo mas perigosa, então você investiga a requisição real antes de desabilitar em vez de deixar passar um possível ataque real. Accuracy alta mais risk alto é um bloqueio confiável e de alto risco que você não relaxa. Accuracy alta mais risk baixo é confiável mas de baixo risco. Ela também sinaliza uma signature que mira um sistema que seu app não usa como puro ruído, e expõe a accuracy como alavanca: como accuracy é um critério de filtro de signature set, um set voltado para signatures de accuracy mais alta produz menos falsos positivos.

## Grounding

As definições de accuracy e risk vêm da documentação Working with Attack Signatures do F5 e da referência de attack signatures do BIG-IP ASM clássico (que detalha a probabilidade de falso positivo baixa, média e alta e o escopo de signature set por sistema e accuracy), além do K70544352 sobre reduzir falsos positivos. Nada que você seleciona é enviado ou sai da página.
