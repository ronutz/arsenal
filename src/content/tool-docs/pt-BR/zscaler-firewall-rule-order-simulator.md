## O que esta ferramenta faz

Cole uma lista de regras de Firewall Filtering do Zscaler Internet Access (ZIA) numa pequena gramática didática - uma regra por linha como `ordem | nome | ação | critérios` - mais uma linha `flow:` opcional, e o simulador executa na sua frente a semântica documentada da política: regras ordenadas em ordem numérica crescente, o fluxo rastreado regra a regra com a avaliação parando na primeira correspondência, o veredito nomeado (uma regra, ou a Default Firewall Filtering Rule para o que caiu através), e uma análise de sombreamento em pares listando regras que nunca podem disparar porque uma regra anterior já cobre tudo o que elas poderiam corresponder.

## A gramática

Regras: `10 | allow-web | allow | proto=tcp port=443 dest=203.0.113.0/24 src=any`, com ações `allow`, `block` (drop silencioso) ou `block-icmp` (bloqueio informando o cliente), e um token opcional `disabled`. Critérios omitidos significam Any - e Any é ignorado durante a avaliação, exatamente como o fabricante documenta. Linhas opcionais: `flow: proto=tcp port=8443 dest=203.0.113.7 src=10.0.0.5` para rastrear, e `default: allow|block` para modelar uma edição de super admin na ação da regra padrão. Linhas começando com `#` são comentários.

## O que a semântica codifica

Tudo o que é simulado é comportamento publicado da Zscaler: a avaliação sobe a Rule Order e para na primeira correspondência; uma regra desabilitada não é aplicada mas mantém seu lugar (o serviço a pula e segue); a Default Firewall Filtering Rule é indeletável, sempre a menor precedência, seus critérios fixos e apenas sua ação editável - e de fábrica ela bloqueia todo o tráfego, razão pela qual o padrão do simulador, sem uma linha `default:`, é block.

## Limites honestos

O modelo de critérios aqui é um subconjunto didático deliberado - protocolo, portas, origem, destino. Regras reais de Firewall Filtering adicionam usuários, grupos, departamentos, localidades, network services e applications, países de destino, níveis de confiança do dispositivo e janelas de tempo; a semântica de ordenação que esta ferramenta ensina aplica-se identicamente a todos. A análise de sombreamento é apenas em pares: uma regra coberta por várias regras anteriores em conjunto, mas por nenhuma sozinha, não é sinalizada. Regras predefinidas do sistema (Office 365, tráfego de serviço da Zscaler) e os limites de ordem do Admin Rank são descritos no artigo pareado, mas não simulados.

## Fontes

Fundamentado em três páginas do Zscaler Help, cada uma fixada com sua data de acesso no manifesto da ferramenta: About Firewall Filtering (ordem de avaliação, a regra padrão negar-por-padrão, o conjunto de verbos de ação), Configuring the Firewall Filtering Policy (Rule Order, a convenção Any-significa-ignorado, Admin Rank) e Editing the Default Firewall Filtering Rule (menor precedência, indeletável, critérios fixos, edição de ação por super admin).
