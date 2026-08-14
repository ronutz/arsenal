## O que faz

Cole um bloco `f5-tenants:tenants` — a forma da CLI ou o JSON do RESTCONF — e a ferramenta o lê de volta: o estado do ciclo de vida e o que significa, a imagem e a qual plataforma ela pertence, as blades e VLANs, e cada campo explicado. Local e offline; analisa o texto e não contata plataforma alguma.

## A verificação que a torna mais que um glossário

A F5 publica a memória mínima como **(3,5 × 1024 × vCPU) + 512**, então dois vCPUs precisam de 7680 MB e quatro precisam de 14848 MB. A ferramenta calcula esse mínimo e **o mostra ao lado do valor configurado**, avisando quando a alocação está abaixo dele.

Ela também avisa quando aparece uma contagem de vCPU sem valor de memória, porque **os dois andam juntos**: aumentar cores sozinho deixa o tenant abaixo do novo mínimo.

## A regra de ciclo de vida que ela declara

**Para mudar vCPU ou memória num tenant deployed é preciso voltá-lo para `provisioned` primeiro**, fazer a mudança e devolvê-lo a `deployed`. Não é operação em produção, e a ferramenta diz isso em todo tenant deployed em vez de esperar ser perguntada.

## Formato de plataforma

Ela sinaliza o que pertence a qual máquina. **VELOS** é um chassi — `nodes` nomeia blades dentro de uma chassis partition e um tenant pode se estender por elas. **rSeries** é um appliance sem partitions nem blades, e o `vcpu-cores-per-node` precisa ser múltiplo de quatro. Um tenant VELOS válido de dois vCPUs **não vai commitar num rSeries**, e um bundle de imagem chamado `ALL-VELOS` também não vai fazer deploy nele — o que a ferramenta aponta só pelo nome do arquivo.

## O que ela não faz

Não tem como saber quanto da sua plataforma já está alocado, então valida um tenant contra a fórmula publicada e não contra a capacidade restante. Se a blade tem a memória livre é pergunta para a plataforma.
