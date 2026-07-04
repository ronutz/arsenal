## O que faz

Esta calculadora responde a uma pergunta que todo instrutor de WAF ouve: quantas requisições um atacante precisa para abrir um buraco na sua política do BIG-IP Advanced WAF quando o Policy Builder fica em modo de aprendizado Automatic sobre tráfego não confiável? Você descreve a configuração de Loosen da sua política (learning mode, se ela afrouxa a partir de tráfego não confiável, os limites de fontes distintas e sessões distintas, o período, e o violation rating da manipulação que um atacante quer ver aceita) e os recursos do atacante (quantos IPs de origem distintos ele controla e quão rápido cada um envia), e ela calcula o mínimo de fontes, requisições e tempo decorrido para forçar um afrouxamento automático da política. É um modelo determinístico do comportamento documentado do Policy Builder do F5, e roda inteiramente no seu navegador.

## Por que isso importa

No modo de aprendizado Automatic, uma sugestão que chega a um learning score de 100% é aceita e aplicada sem administrador no processo, e a etapa Loosen do Policy Builder pode adicionar entidades, ampliar atributos e desabilitar violações. Um atacante que inunda tráfego de aparência legítima (violation rating baixo, repetido, de muitas fontes) consegue levar um afrouxamento a 100% e ter um controle desabilitado automaticamente, fabricando falsos negativos para ataques futuros. Esta ferramenta coloca números nesse risco para que a decisão de deixar o aprendizado em Automatic em produção deixe de ser abstrata.

## Os gates rígidos que ela verifica primeiro

Antes de calcular qualquer esforço, a ferramenta aplica as regras documentadas que tornam a perfuração automática impossível. Aprendizado Manual ou Disabled significa que um humano precisa aceitar cada sugestão, então não há buraco automático. Uma violação de rating 5 é não aprendível: o Policy Builder nunca a afrouxa automaticamente, então nenhuma quantidade de tráfego ajuda. E se o afrouxamento está restrito a tráfego confiável, um atacante não confiável não alcança o caminho de Loosen. Somente quando nenhum desses gates se aplica é que a ferramenta calcula o esforço do atacante.

## Como calcula o esforço

A restrição decisiva são as fontes distintas. A ferramenta pega seu limite de Loosen para fontes diferentes (padrão F5 de 10 para não confiável, 1 para confiável), multiplica por um fator explícito de desaceleração por rating que você define (o F5 exige mais para ratings maiores mas não publica a curva exata), e reporta o mínimo de IPs de origem distintos, uma contagem de requisições como limite inferior de pelo menos um acerto distinto por fonte ou sessão exigida, e o tempo mínimo decorrido, que é o maior entre o período configurado e o tempo para entregar esse volume na taxa do atacante. Se o atacante não controla fontes distintas suficientes, o resultado fica fora de alcance.

## Grounding e os padrões honestos

Os limites usam por padrão os valores documentados do F5, e a calculadora nunca inventa a matemática interna de pontuação do F5: os gates rígidos e a aritmética dos limites são calculados, enquanto o custo de rating mais alto é exposto como um fator que você controla em vez de um número fabricado. Leia os limites reais de Loosen da sua política em Security, Application Security, Policy Building, Learning and Blocking Settings, e ajuste as entradas para corresponder. Nada que você digita é enviado ou sai da página. Baseado no F5 K000134503 e na documentação de aprendizado do BIG-IP ASM; para uma decisão de produção, confirme as configurações na documentação do Policy Builder da sua versão do BIG-IP.
