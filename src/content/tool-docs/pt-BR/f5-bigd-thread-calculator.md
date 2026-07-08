## O que a ferramenta faz

O BIG-IP 21.1 reconstruiu o bigd, o daemon de health monitors, como instância única multi-thread capaz de atender até 15.000 monitores no plano de controle, e documentou exatamente como a contagem automática de threads é derivada da contagem de vCPUs. Esta ferramenta codifica essas duas fórmulas literalmente: informe a contagem de vCPUs mais o tipo de sistema e ela devolve a contagem de threads que o sistema derivaria, o teto do ajuste manual bigd.numprocs e o limite de monitores. Um número sozinho calcula as duas fórmulas lado a lado.

## As duas fórmulas

Para sistemas hyperthreaded, as release notes da F5 declaram `Número de threads do BigD = (Número de vCPUs × 6) ÷ 10`, com a justificativa de que núcleos HT rendem cerca de 60% de um núcleo real. Para sistemas normais (sem HT), a fórmula é `Número de threads do BigD = (Número de vCPUs ÷ 2) − 1`. Quando uma fórmula resulta em fração (8 vCPUs hyperthreaded dá 4,8), as release notes não declaram regra de arredondamento, então a ferramenta mostra o valor exato e o piso em threads inteiras, dizendo isso com clareza. Com 2 vCPUs, o resultado honesto da fórmula normal é 0; o bigd continua rodando, então leia esse caso como threading mínimo, não como ausência.

## O ajuste manual e o teto

A variável de banco `bigd.numprocs` define a contagem de threads manualmente, mas é limitada ao número de vCPUs disponíveis; seu padrão 0 significa cálculo automático com as fórmulas acima. O daemon multi-thread suporta até 15.000 monitores no plano de controle. Para contexto de dimensionamento, as notas do 21.0 recomendam manter o bigd em até 5.000 instâncias de monitor e, acima disso, migrar para monitores In-TMM, que escalam até 25.000 com alocação de extramb de 8 GB.

## Quais plataformas são hyperthreaded

A escolha da fórmula é um fato de plataforma, e a documentação de plataforma da própria F5 resolve a questão. No rSeries, a família se divide ao meio: os appliances intermediários e de topo (r5000, r10000 e a família r12000 nas tabelas de dimensionamento da F5) rodam hyperthreading, com cada núcleo Intel aparecendo como duas vCPUs, enquanto os r2000 e r4000 usam uma classe de CPU sem hyperthreading e são contados apenas em núcleos físicos. O VELOS é hyperthreaded nos dois tipos de lâmina: as vCPUs de um tenant são hyperthreads, duas por núcleo físico, com tenants BIG-IP usando o arranjo HT-Split (K15003) em que o TMM ocupa um hyperthread de cada núcleo. iSeries e VIPRION também contam vCPUs como hyperthreads na linguagem de dimensionamento da F5, mas nenhum dos dois roda BIG-IP 21.x, então para eles a ferramenta mostra o mapeamento apenas como contexto. O Virtual Edition herda o que o hypervisor expõe: verifique dentro do guest (`lscpu`, Thread(s) per core) e escolha a fórmula correspondente.

Digite a plataforma direto na entrada: `8 r10900` seleciona a fórmula hyperthreaded, `16 r4800` a normal, `22 velos` hyperthreaded, `8 ve` mostra as duas com a nota de verificar o host. Uma palavra explícita `ht` ou `normal` sempre sobrepõe o padrão da plataforma, para o caso de o hyperthreading estar desabilitado no firmware.

## Exemplos práticos

`8 ht` resulta em 4,8 exato, 4 threads inteiras. `10 ht` cai em número inteiro: 6. `16 normal` dá 7. `40 ht` dá 24. `6` sozinho mostra os dois: 3,6 (piso 3) hyperthreaded, 2 normal.

## Procedência

Fórmulas, comportamento do teto e o limite de 15.000 são literais das release notes "New Features in BIG-IP Version 21.1.0" da F5 (BigD enhancements for large-scale configurations), obtidas em 2026-07-08; a orientação de 5.000 instâncias e os números de In-TMM vêm da contraparte do 21.0.0. A contagem real de threads do sistema em execução é sempre a autoridade final.
