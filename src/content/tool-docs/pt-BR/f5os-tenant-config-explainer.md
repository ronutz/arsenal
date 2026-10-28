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

## Compartilhar resultado

Abaixo do resumo, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva a caixa como foi digitada depois do `#`, e mais nada. O popover dele diz primeiro o que o link leva e depois um aviso próprio: o bloco traz o endereço de gerenciamento, o gateway e as VLANs do tenant, então leia antes de mandar o link. Então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

Um bloco de tenant não tem senha nem chave: a [referência de ciclo de vida de tenant da API do VELOS](https://clouddocs.f5.com/api/velos-api/api-chassis-tenant.html) da F5 (lida em 2026-10-27) configura um tenant com nome, tipo, imagem, nodes, endereço de gerenciamento, prefix length, gateway, VLANs, cryptos, vCPUs, memória, running state e appliance mode. As credenciais que aquela página usa pertencem à requisição da API, não ao bloco.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-10-27) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o texto não é enviado ao servidor quando o link é aberto; ele fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** O texto preenche a caixa como se tivesse sido colado e a página o lê; nada é enviado a lugar nenhum. O valor então sai do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
