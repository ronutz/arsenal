## O que a ferramenta faz

Responda seis perguntas sobre uma localidade - banda necessária, se alta disponibilidade é exigida, se o IP de saída é estático, se o trânsito precisa ser cifrado, se o dispositivo de borda suporta GRE, e se os endpoints internos do túnel passam por source NAT - e a ferramenta devolve a recomendação determinística de encaminhamento: GRE ou IPsec, o número de capacidade por túnel que se aplica e a regra documentada de onde ele vem, e a quantidade mínima de túneis primários e de backup que cobre o requisito. Cada passo de eliminação é exibido em ordem, para que a resposta ensine o raciocínio em vez de substituí-lo. Mesmas respostas, mesma recomendação, sempre; tudo roda no seu navegador e não contata nada.

## Os números publicados de onde ela calcula

Todos os números de capacidade são da própria Zscaler, verificados ao vivo em 2026-07-21 contra o portal de ajuda. Um túnel GRE carrega até 1 Gbps - a menos que os endereços internos do endpoint do túnel passem por source NAT, caso em que o número cai para 250 Mbps, porque o serviço balanceia o tráfego GRE pelos endereços internos e o NAT os colapsa num só. Um túnel IPsec carrega até 400 Mbps por endereço IP público de origem. Os formatos de expansão espelham os próprios exemplos trabalhados da documentação: 2 Gbps de GRE são dois primários mais dois backups em IPs públicos de origem distintos; 800 Mbps de IPsec são dois mais dois, alcançados por IPs públicos de origem diferentes ou por múltiplos túneis no mesmo IP usando NAT Traversal com randomização de porta de origem sob IKEv2.

## Como funciona a eliminação

O GRE é preferido quando suas três precondições valem - endereço público de saída estático, dispositivo capaz de GRE, e nenhuma exigência de criptografia - porque é o encapsulamento mais simples, encaminhado em taxa de hardware, com o teto por túnel mais alto. Qualquer precondição que falhe direciona a resposta ao IPsec, que tolera endereços dinâmicos (peers identificados por fully qualified domain name), fornece criptografia por construção, e pede apenas que IKEv2 e Dead Peer Detection estejam configurados. A contagem de túneis é então a divisão com teto da banda necessária pelo número por túnel aplicável, e a contagem de backups espelha os primários quando alta disponibilidade é exigida - cada backup apontado para um Public Service Edge num data center diferente, o formato primário/secundário documentado. Quando nenhuma HA é pedida, a ferramenta devolve o mínimo verdadeiro e diz com clareza que o fabricante ainda assim recomenda um secundário.

## O que ela não vai fingir

Os números são orientação de plano de encaminhamento para túneis de localidade, não promessas sobre um circuito específico, e a ferramenta diz qual regra documentada produziu cada número em vez de inventar precisão. Usuários em roaming ficam fora do escopo por projeto: um laptop fora da rede encaminha pelo Z-Tunnel do Zscaler Client Connector, não por um túnel de localidade - uma fronteira que esta ferramenta declara em vez de borrar.

## Compartilhar resultado

Abaixo do cartão da recomendação, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva o formulário depois do `#` como valores com nome, sempre todos os campos: `mbps` como foi digitado, e `ha`, `staticip`, `encryption`, `gre` e `nated` como 1 ou 0. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

Nada no formulário identifica uma rede (uma banda e cinco respostas de sim ou não), então o popover não acrescenta nada ao aviso padrão do site. Todos os campos vão, não só os que diferem das respostas iniciais, então um link antigo mantém o sentido se elas mudarem.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** Os valores do link substituem o formulário inteiro e a página escolhe de novo (aritmética sobre números publicados; nada é contatado). Uma banda que a página recusa, ou uma resposta diferente de 1 ou 0, fazem o link inteiro ser ignorado. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.

## Fontes

Os números de GRE, a regra de source NAT e os exemplos de expansão vêm de Understanding Generic Routing Encapsulation (GRE). O limite de IPsec por IP de origem, seus dois formatos de expansão e a recomendação primário/secundário vêm de Configuring an IPSec VPN Tunnel. As precondições do GRE, a dica de IP dinâmico rumo ao IPsec e a orientação de campo sobre MTU vêm de Choosing Traffic Forwarding Methods.

A regra do fragmento por trás do Compartilhar resultado é a [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), seção 3.5 (lida em 2026-11-01).
