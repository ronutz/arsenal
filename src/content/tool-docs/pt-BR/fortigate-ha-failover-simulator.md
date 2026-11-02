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

## O que os outros desfechos significam

**Decidido por interfaces monitoradas** significa que a saúde das interfaces resolveu antes de qualquer outra coisa ser consultada. Corrija a interface caída e a comparação segue adiante.

**Decidido por número de série** significa que todo o resto empatou. Isso é determinístico porém arbitrário: se você quer uma unidade específica preferida, defina uma prioridade em vez de contar com qual número de série ordena mais alto.

## O que ela não modela

Apenas a eleição. Não modela a sobrevivência de sessões ao failover, que depende do session pickup e de a inspeção ter sido em modo proxy, e não modela split brain, que é falha do caminho de heartbeat, e não desfecho de eleição. Esses assuntos estão no artigo de alta disponibilidade FGCP.

## Compartilhar resultado

Abaixo da unidade primária e das conclusões, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva a caixa como foi colada depois do `#`. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

As linhas de diretiva citam suas unidades e os números de série delas (por isso o popover traz uma linha de cuidado), e a página só lê as linhas `member:` e `override:`, então um bloco `config system ha` colado junto viajaria também, com a senha do cluster. Antes de oferecer um link, a caixa é verificada em busca de uma credencial que o FortiOS ou um padrão define: uma linha `set` de um setting que a [referência de CLI do FortiOS 7.6.8](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) tipa como senha (`psksecret`, `password`, `passwd`, `secret`, `key`, `auth-pwd` e os demais; lida em 2026-11-01) ou o `name` de uma community SNMP ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), seção 3.2.5), qualquer valor `ENC` (aviso da Fortinet [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007), lido em 2026-11-01: esses dados postados onde outros leem "should currently be considered "easy to decrypt""), um par `psksecret=` ou `password=` com os mesmos nomes numa linha de diretiva, uma chave privada PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468)), um JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)), uma linha `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), seção 11.6.2), uma senha numa URL ou um access key ID da AWS. Qualquer um deles significa sem link: o popover diz a linha, e você troca o valor por um placeholder e clica de novo, então o que você compartilha é exatamente o que escolheu (um valor nunca é trocado dentro de uma caixa colada, o que mudaria o que foi enviado). Um valor cujo nome só parece de segredo não impede o link; o popover cita o primeiro.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** A caixa é preenchida como se tivesse sido colada e a página roda a eleição, com o contrafactual. Nada é contatado. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.

## Onde ela se encaixa

Forma par com o artigo de alta disponibilidade FGCP do FortiGate, que explica por que a ordenação padrão existe e o que mais muda num failover. Para candidatos ao NSE 4, apoia o objetivo 1.03.
