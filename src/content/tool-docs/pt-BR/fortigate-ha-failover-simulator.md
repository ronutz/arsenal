## O que faz

Descreva um cluster FGCP — as falhas de interface monitorada, a idade, a prioridade e o número de série de cada unidade, mais a configuração de override — e esta ferramenta roda a eleição da primária, nomeia o critério que decidiu, e informa quem seria primária se o override fosse alternado. Roda inteiramente no seu navegador.

## A pergunta que ela responde

"Por que a unidade com prioridade maior não é a primária?"

Essa pergunta é feita o tempo todo, e a resposta é quase sempre a mesma. Com o override **desabilitado**, que é o padrão, o FGCP compara **idade antes de prioridade**. Uma unidade que reiniciou tem idade baixa, então permanece secundária por mais alta que seja sua prioridade.

Isso não é defeito nem erro de configuração. O padrão existe para que uma unidade instável não tome e perca o papel de primária repetidamente, porque cada tomada é uma interrupção de tráfego. A Fortinet escolheu estabilidade em vez de preferência, e a configuração para mudar isso está ali.

## A ordem de comparação

| Ordem | Critério | Vence |
|---|---|---|
| 1 | Interfaces monitoradas com falha | Menos |
| 2 | Idade (override desabilitado) | Maior |
| 3 | Prioridade | Maior |
| 4 | Número de série | Desempate determinístico |

Habilitar o override move a **prioridade acima da idade**, então as posições 2 e 3 trocam. As interfaces monitoradas seguem em primeiro nos dois modos, e o número de série segue em último.

A ferramenta mostra a ordem de fato em vigor para a sua entrada, e não a genérica, porque é essa a parte que as pessoas lembram errado.

## O contrafactual é a saída útil

Ao lado da vencedora, a ferramenta calcula quem seria primária com o override alternado. Quando isso difere, ela diz explicitamente.

Isso importa porque "FGT-B é a primária" é um fato, e "com o override habilitado a FGT-A seria a primária, e essa única configuração é o que decide este cluster" é uma decisão. A segunda é o que alguém de fato precisa quando olha para um cluster se comportando de forma inesperada.

Quando alternar o override não mudaria nada, ela também diz — o que elimina uma linha inteira de investigação numa frase.

## Lendo os outros desfechos

**Decidido por interfaces monitoradas** significa que a saúde das interfaces resolveu antes de qualquer outra coisa ser consultada. Corrija a interface caída e a comparação segue adiante.

**Decidido por número de série** significa que todo o resto empatou. Isso é determinístico porém arbitrário: se você quer uma unidade específica preferida, defina uma prioridade em vez de contar com qual número de série ordena mais alto.

## O que ela não modela

Apenas a eleição. Não modela a sobrevivência de sessões ao failover, que depende do session pickup e de a inspeção ter sido em modo proxy, e não modela split brain, que é falha do caminho de heartbeat, e não desfecho de eleição. Esses assuntos estão no artigo de alta disponibilidade FGCP.

## Onde ela se encaixa

Forma par com o artigo de alta disponibilidade FGCP do FortiGate, que explica por que a ordenação padrão existe e o que mais muda num failover. Para candidatos ao NSE 4, apoia o objetivo 1.03.
