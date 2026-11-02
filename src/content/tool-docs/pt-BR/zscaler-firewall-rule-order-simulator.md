## O que esta ferramenta faz

Cole uma lista de regras de Firewall Filtering do Zscaler Internet Access (ZIA) numa pequena gramática didática - uma regra por linha como `ordem | nome | ação | critérios` - mais uma linha `flow:` opcional, e o simulador executa na sua frente a semântica documentada da política: regras ordenadas em ordem numérica crescente, o fluxo rastreado regra a regra com a avaliação parando na primeira correspondência, o veredito nomeado (uma regra, ou a Default Firewall Filtering Rule para o que caiu através), e uma análise de sombreamento em pares listando regras que nunca podem disparar porque uma regra anterior já cobre tudo o que elas poderiam corresponder.

## A gramática

Regras: `10 | allow-web | allow | proto=tcp port=443 dest=203.0.113.0/24 src=any`, com ações `allow`, `block` (drop silencioso) ou `block-icmp` (bloqueio informando o cliente), e um token opcional `disabled`. Critérios omitidos significam Any - e Any é ignorado durante a avaliação, exatamente como o fabricante documenta. Linhas opcionais: `flow: proto=tcp port=8443 dest=203.0.113.7 src=10.0.0.5` para rastrear, e `default: allow|block` para modelar uma edição de super admin na ação da regra padrão. Linhas começando com `#` são comentários.

## O que a semântica codifica

Tudo o que é simulado é comportamento publicado da Zscaler: a avaliação sobe a Rule Order e para na primeira correspondência; uma regra desabilitada não é aplicada mas mantém seu lugar (o serviço a pula e segue); a Default Firewall Filtering Rule é indeletável, sempre a menor precedência, seus critérios fixos e apenas sua ação editável - e de fábrica ela bloqueia todo o tráfego, razão pela qual o padrão do simulador, sem uma linha `default:`, é block.

## Limites honestos

O modelo de critérios aqui é um subconjunto didático deliberado - protocolo, portas, origem, destino. Regras reais de Firewall Filtering adicionam usuários, grupos, departamentos, localidades, network services e applications, países de destino, níveis de confiança do dispositivo e janelas de tempo; a semântica de ordenação que esta ferramenta ensina aplica-se identicamente a todos. A análise de sombreamento é apenas em pares: uma regra coberta por várias regras anteriores em conjunto, mas por nenhuma sozinha, não é sinalizada. Regras predefinidas do sistema (Office 365, tráfego de serviço da Zscaler) e os limites de ordem do Admin Rank são descritos no artigo pareado, mas não simulados.

## Compartilhar resultado

Abaixo do cartão do veredito (logo no começo da leitura quando não há linha de fluxo), o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva as regras e o fluxo como foram colados depois do `#`. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

Nomes de regras e endereços podem identificar sua infraestrutura (por isso o popover traz uma linha de cuidado). Antes de oferecer um link, a caixa é verificada em busca de uma credencial que um padrão define: uma chave privada PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), seção 10), uma linha `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), seção 11.6.2), uma linha `Cookie` com valor ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), seção 4.2.1), um JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), seção 1), uma senha numa URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), seção 3.2.1), um access key ID da AWS ou um valor `ENC` do FortiOS; todos lidos em 2026-11-01. A gramática não tem lugar para nenhum deles, mas nomes de regras e linhas de comentário são texto livre. Qualquer um deles significa sem link: o popover diz a linha, e você troca o valor por um placeholder e clica de novo. Um valor cujo nome só parece de segredo não impede o link; o popover cita o primeiro.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** A caixa é preenchida como se tivesse sido colada e a página simula as regras. Nada é contatado. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.

## Fontes

Fundamentado em três páginas do Zscaler Help, cada uma fixada com sua data de acesso no manifesto da ferramenta: About Firewall Filtering (ordem de avaliação, a regra padrão negar-por-padrão, o conjunto de verbos de ação), Configuring the Firewall Filtering Policy (Rule Order, a convenção Any-significa-ignorado, Admin Rank) e Editing the Default Firewall Filtering Rule (menor precedência, indeletável, critérios fixos, edição de ação por super admin).

A regra do fragmento por trás do Compartilhar resultado é a [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), seção 3.5 (lida em 2026-11-01), e as credenciais que a verificação procura são definidas na RFC 7468, na RFC 9110, na RFC 6265 e na RFC 7519 (lidas no mesmo dia).
