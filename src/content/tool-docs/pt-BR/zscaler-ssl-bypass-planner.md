# Planejador de Bypass SSL do ZIA

## O que ele faz

Cole uma lista de aplicações ou destinos - um por linha, numa gramática de quatro campos - e receba um plano determinístico de inspeção TLS. Cada ativo recebe um de três vereditos: **Inspecionar** (o padrão, que alimenta todos os engines de conteúdo), **Do Not Inspect via regra de política** (a isenção no Edge para categorias de governança e para aplicações com pinning em caminhos que nenhum agente controla), ou **bypass no Client Connector** (a isenção mais limpa para aplicações com pinning onde o ZCC controla o caminho - o tráfego nunca entra no túnel, pareada com uma regra de política como defesa em profundidade). Todo veredito carrega seu raciocínio referenciado; todo bypass carrega um livro-razão de pontos cegos nomeando o que deixa de ver este fluxo; e sempre que algo fica sem inspeção, o plano anexa a checklist de salvaguardas externas - a ação de Untrusted Server Certificates, OCSP via stapling, o piso de Minimum TLS Version e o Block No-SNI.

## A gramática

Um ativo por linha, quatro campos separados por barra vertical; linhas começando com `#` são comentários:

```
<nome> | pinned|clean | regulated|general | agent|no-agent
```

`pinned` marca uma aplicação com certificate pinning (ela não aceita um certificado regenerado sob a CA de inspeção e falha fechada sob interceptação). `regulated` marca uma categoria de governança que política ou lei exige manter selada. `agent` marca um caminho que o Zscaler Client Connector controla.

## Como ler o plano

O resumo conta os vereditos; os cartões percorrem o raciocínio de cada ativo; a nota de ordenação carrega a doutrina de que as exceções Do Not Inspect pertencem à ordem alta, acima do corpo de Inspect, porque as regras da política SSL avaliam em ordem crescente com primeira correspondência. Quando todos os ativos inspecionam, não há livro-razão de bypass nem dívida de salvaguardas - e o plano diz isso. Toda isenção por política que o planejador recomenda é uma regra Do Not Inspect configurada com **Evaluate Other Policies**, porque essa é a forma que mantém as salvaguardas externas e as políticas web valendo; uma nota no plano explica que **Bypass Other Policies** não oferece salvaguarda nenhuma e também pula URL Filtering e Cloud App Control, e que o tráfego que sofre bypass no Client Connector nem chega ao Edge.

## Honestidade

A gramática é um subconjunto de ensino deliberado: o planejamento real de bypass também escopa regras por usuários, grupos e localidades, e pesa especificidades de aplicação que este planejador não modela. A lógica de decisão - pinning força uma isenção, governança sela uma categoria, todo o resto inspeciona, e cada bypass é um ponto cego com preço - é a parte durável. Todo o cálculo é local; os nomes dos seus ativos nunca saem da página.

## Compartilhar resultado

Abaixo das contagens do resumo, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva os ativos como foram colados depois do `#`. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

Nomes de ativos podem identificar suas aplicações internas (por isso o popover traz uma linha de cuidado). Antes de oferecer um link, a caixa é verificada em busca de uma credencial que um padrão define: uma chave privada PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), seção 10), uma linha `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), seção 11.6.2), uma linha `Cookie` com valor ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), seção 4.2.1), um JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), seção 1), uma senha numa URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), seção 3.2.1), um access key ID da AWS ou um valor `ENC` do FortiOS; todos lidos em 2026-11-01. A gramática não tem lugar para nenhum deles, mas nomes de ativos e linhas de comentário são texto livre. Qualquer um deles significa sem link: o popover diz a linha, e você troca o valor por um placeholder e clica de novo. Um valor cujo nome só parece de segredo não impede o link; o popover cita o primeiro.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** A caixa é preenchida como se tivesse sido colada e a página planeja a inspeção. Nada é contatado. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.

## Fontes

Fundamentado na documentação de inspeção SSL da Zscaler (Configuring the SSL/TLS Inspection Policy; About SSL Inspection) e na arquitetura de referência de Data Protection, data de acesso 2026-07-21. As duas formas de Do Not Inspect, e os ajustes que cada uma oferece, foram relidas em [Configuring SSL/TLS Inspection Policy](https://help.zscaler.com/zia/configuring-ssltls-inspection-policy) (lida em 2026-10-26). O artigo Learn pareado é *Inspeção SSL no ZIA: Política e Bypasses*.

A regra do fragmento por trás do Compartilhar resultado é a [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), seção 3.5 (lida em 2026-11-01), e as credenciais que a verificação procura são definidas na RFC 7468, na RFC 9110, na RFC 6265 e na RFC 7519 (lidas no mesmo dia).
