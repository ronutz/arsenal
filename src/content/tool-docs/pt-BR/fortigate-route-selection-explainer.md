## O que faz

Informe um destino e um conjunto de rotas, e esta ferramenta roda a seleção que o FortiOS faria: quais rotas instalam, qual delas o tráfego de fato toma, e quais são rotas flutuantes de reserva. Roda inteiramente no seu navegador.

## A distinção pela qual a ferramenta inteira existe

Distância administrativa e prioridade são rotineiramente tratadas como a mesma ideia. Não são, e agem em momentos diferentes.

**A distância decide qual rota é INSTALADA.** Rotas para o mesmo destino competem, a menor distância vence, e a perdedora fica **ausente** da tabela de encaminhamento: não classificada abaixo, não uma alternativa usada sob carga, simplesmente não está lá. É por isso que "minha rota não funciona" tantas vezes acaba sendo "minha rota nunca instalou", e por que uma rota configurada não aparece em `get router info routing-table all`.

**A prioridade decide qual entre várias rotas JÁ INSTALADAS é preferida.** Ela só se aplica a rotas que sobreviveram à comparação de distância. Uma prioridade 0 não resgata uma rota que perdeu na distância, e um vetor de ouro fixa exatamente esse caso.

## O que decorre disso

| Configuração | Resultado |
|---|---|
| Mesmo prefixo, mesma distância | As duas instalam; a prioridade escolhe |
| Mesmo prefixo, distâncias diferentes | Uma instala; a outra é reserva flutuante |
| Mesmo prefixo, mesma distância, mesma prioridade | ECMP balanceia entre as duas |

A reserva flutuante é como se constrói uma rota padrão de espera: mesmo prefixo, distância maior. Ela aparece na tabela apenas quando a primária é retirada, que é o que o **monitoramento de saúde do enlace** faz, e por que uma rota estática sem ele permanece na tabela enquanto o caminho além da interface está quebrado.

A ferramenta modela uma rota fora do ar para que você veja a reserva assumir.

## O encaminhamento toma a correspondência mais longa

Entre as rotas **instaladas**, o prefixo mais específico vence, independentemente de distância ou prioridade. Um /16 vence uma rota padrão para um endereço dentro dele mesmo que a padrão tenha valores melhores, porque a especificidade é comparada primeiro no momento do encaminhamento.

É também por isso que o sequestro de prefixos funciona, e por que essa ordenação vale ter em mente além de um único equipamento.

## O que ela não modela

Apenas a tabela de roteamento. Duas coisas são consultadas **antes** dela e a sobrepõem:

- Uma **rota por política**, que casa por origem, protocolo e porta além do destino. Uma rota por política esquecida é a causa clássica de tráfego que ignora uma rota estática obviamente correta, então, se a tabela diz uma coisa e o tráfego faz outra, procure ali primeiro.
- Uma **regra de SD-WAN**, que seleciona um membro por desempenho medido antes de a tabela ser alcançada.

É somente IPv4, e não avalia se um gateway é de fato alcançável: toma o conjunto de rotas como dado.

## Compartilhar resultado

Abaixo da rota escolhida, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva o destino e as rotas como foram colados depois do `#`. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

As rotas citam seus prefixos internos, próximos hops e interfaces, como uma tabela de roteamento (por isso o popover traz uma linha de cuidado). Antes de oferecer um link, a caixa é verificada em busca de uma credencial que o FortiOS ou um padrão define: uma linha `set` de um setting que a [referência de CLI do FortiOS 7.6.8](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) tipa como senha (`psksecret`, `password`, `passwd`, `secret`, `key`, `auth-pwd` e os demais; lida em 2026-11-01) ou o `name` de uma community SNMP ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), seção 3.2.5), qualquer valor `ENC` (aviso da Fortinet [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007), lido em 2026-11-01: esses dados postados onde outros leem "should currently be considered "easy to decrypt""), um par `psksecret=` ou `password=` com os mesmos nomes numa linha de diretiva, uma chave privada PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468)), um JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)), uma linha `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), seção 11.6.2), uma senha numa URL ou um access key ID da AWS. Qualquer um deles significa sem link: o popover diz a linha, e você troca o valor por um placeholder e clica de novo, então o que você compartilha é exatamente o que escolheu (um valor nunca é trocado dentro de uma caixa colada, o que mudaria o que foi enviado). Um valor cujo nome só parece de segredo não impede o link; o popover cita o primeiro.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** A caixa é preenchida como se tivesse sido colada e a página escolhe a rota. Nada é contatado. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.

## Onde ela se encaixa

Forma par com o artigo de roteamento e SD-WAN do FortiGate, que cobre a ordem completa de consulta e a camada de SD-WAN que esta ferramenta deixa de fora. Para candidatos ao NSE 4, apoia o objetivo 4.01.
