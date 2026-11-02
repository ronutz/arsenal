## O que faz

Cole uma lista ordenada de policies do FortiGate e, opcionalmente, um pacote. A ferramenta percorre a lista de cima para baixo mostrando qual campo descartou cada policy, aponta a vencedora e informa quando o pacote cai no implicit deny. Local e offline; raciocina sobre a lista fornecida e nunca toca num equipamento.

## A análise que vale rodar sozinha

Mesmo sem pacote, a ferramenta aponta as **policies que nunca podem ser alcançadas** — onde uma policy anterior cobre todos os campos que uma posterior cobre. Essa é a forma mais comum de "minha regra não funciona": a regra está correta e simplesmente nunca é alcançada. Vale rodar periodicamente, e não só quando algo quebra.

## O que ela corrige

**O ID da policy é um identificador, não uma posição.** A policy 3 pode estar abaixo da policy 47, e renumerar não muda a ordem de avaliação. Muito material online dá a entender que o ID é a ordem; a ferramenta apresenta a correção em toda execução, e um dos seus golden vectors é uma lista em que a policy 47 está acima da policy 3 e vence.

Ela também sempre diz que **cada direção precisa da sua própria policy** — tráfego permitido de A para B não diz nada sobre B para A.

## As regras de virtual IP

Uma policy com **VIP aplicado é casada de forma diferente e tem prioridade** sobre uma policy comum, então a ordenação sozinha não bloqueia uma origem. A policy de deny precisa de **`match-vip`** e precisa estar acima. Policies de deny novas já vêm com ele ligado; uma policy de **accept** não pode tê-lo, e a ferramenta sinaliza essa combinação como impossível.

## O que ela não faz

Não resolve objetos de endereço nem grupos de serviço — um objeto nomeado é um token opaco, a menos que seja `all` ou `any`. Ela sabe dizer que `web-servers` e `all` são diferentes, e não sabe dizer se um contém o outro. Para isso, a autoridade é o equipamento.

## Compartilhar resultado

Logo no começo da leitura, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva as policies e a linha do pacote como foram digitadas (uma linha de pacote vazia fica de fora) depois do `#`. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

As policies citam suas interfaces, objetos de endereço e serviços (por isso o popover traz uma linha de cuidado). Os dois campos são verificados, e a mensagem sobre uma credencial diz em qual deles ela está. Antes de oferecer um link, a caixa é verificada em busca de uma credencial que o FortiOS ou um padrão define: uma linha `set` de um setting que a [referência de CLI do FortiOS 7.6.8](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) tipa como senha (`psksecret`, `password`, `passwd`, `secret`, `key`, `auth-pwd` e os demais; lida em 2026-11-01) ou o `name` de uma community SNMP ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), seção 3.2.5), qualquer valor `ENC` (aviso da Fortinet [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007), lido em 2026-11-01: esses dados postados onde outros leem "should currently be considered "easy to decrypt""), um par `psksecret=` ou `password=` com os mesmos nomes numa linha de diretiva, uma chave privada PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468)), um JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)), uma linha `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), seção 11.6.2), uma senha numa URL ou um access key ID da AWS. Qualquer um deles significa sem link: o popover diz a linha, e você troca o valor por um placeholder e clica de novo, então o que você compartilha é exatamente o que escolheu (um valor nunca é trocado dentro de uma caixa colada, o que mudaria o que foi enviado). Um valor cujo nome só parece de segredo não impede o link; o popover cita o primeiro.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** Os dois campos são preenchidos como foram digitados (uma linha de pacote que o link não leva deixa o campo vazio) e a página os lê. Nada é contatado. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
