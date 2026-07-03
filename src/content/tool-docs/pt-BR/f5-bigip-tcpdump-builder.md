## O que faz

Monte um comando `tcpdump` correto para um F5 BIG-IP a partir de opções estruturadas: a interface (na sintaxe própria do BIG-IP), quanto detalhe de fluxo da TMM incluir, o comprimento de captura (snaplen), se deve gravar um arquivo de captura e um filtro BPF. A ferramenta formata o comando para você copiar e executar no equipamento; ela mesma não captura nada e não contata nenhum equipamento.

## Por que o tcpdump do BIG-IP é diferente

Em um BIG-IP, o `tcpdump` roda contra o Traffic Management Microkernel (TMM), e o argumento de interface é onde ele se afasta do tcpdump comum. Duas particularidades do BIG-IP importam mais:

- **A interface `0.0`** significa todas as interfaces de dados da TMM de uma vez. É poderosa para descobrir por onde o tráfego está (ou não está) fluindo, mas não é limitada em taxa, então um filtro é essencial para não sobrecarregar a captura.
- **O sufixo de detalhe `:n`** controla quanta informação interna da TMM cada linha de pacote carrega, e essa é a parte que as pessoas mais erram.

## O sufixo de detalhe e o erro a evitar

Acrescentar um sufixo à interface aumenta o nível de "ruído":

- **`:n`** (baixo) adiciona o nome do virtual server, a interface e a direção.
- **`:nn`** (médio) adiciona detalhes de fluxo.
- **`:nnn`** (alto) adiciona o IP e a porta dos dois lados do BIG-IP, para você acompanhar uma única conexão através do proxy.

Um **`p`** ao final (como em `:nnnp`, ou apenas `:p`) captura os dois lados do proxy de uma vez: o fluxo cliente-para-BIG-IP e o fluxo BIG-IP-para-membro-do-pool. O erro clássico é confundir esse sufixo de interface `:n` com a flag de linha de comando `-n`, que faz algo totalmente diferente (desativa a resolução de nomes). São coisas separadas, e a ferramenta as modela separadamente para que você não as confunda.

## Como usar

Escolha a interface e o nível de detalhe, defina um snaplen e um arquivo de saída se quiser, adicione um filtro BPF e copie o comando montado. Ele é construído a partir das opções da própria orientação de rastreamento de pacotes da F5 (K411 e K13637), então é o comando que um BIG-IP de fato aceitará.
