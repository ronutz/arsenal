## O que faz

Cole uma lista de políticas de firewall do FortiGate e um pacote, e esta ferramenta executa a avaliação que o FortiOS faria: de cima para baixo, todos os critérios precisam corresponder, a primeira correspondência vence. Ela informa a política que corresponde, um rastreamento nomeando o **primeiro critério que eliminou** cada política anterior, e as políticas abaixo da correspondência que também teriam correspondido. Roda inteiramente no seu navegador e nunca contata um equipamento.

## Por que o rastreamento importa mais que o veredito

Saber que a política 7 correspondeu é uma parte pequena da resposta. A parte útil é por que as políticas 1 a 6 não corresponderam, porque é isso que diz se a lista está escrita como pretendido. Uma política com os endereços certos e a interface de saída errada silenciosamente deixa de corresponder, e nada na interface avisa: o contador de acertos simplesmente nunca incrementa.

O rastreamento nomeia um critério por política: o primeiro que falhou. O FortiOS exige todos, então uma única falha basta para eliminar uma política, e informar a primeira é o que mantém a saída legível numa lista longa.

## Encoberta contra regra abrangente, e por que a distinção é o ponto

Depois que uma política corresponde, as políticas posteriores que também teriam correspondido caem em duas categorias bem diferentes, e esta ferramenta as mantém separadas.

**Encoberta** significa que a política posterior é ao menos tão específica quanto a que venceu. Isso é falha genuína: está viva na configuração, parece correta na tela, e nunca pode ter efeito para aquele tráfego na ordem em que está. É o problema de política mais comum no FortiGate, e a correção é movê-la para cima da vencedora.

**Regra abrangente** significa que a política posterior é mais ampla que a vencedora. Uma permissão geral abaixo de um conjunto de regras específicas é projeto correto, e não erro, então a ferramenta a informa sem sinalizá-la. Confundir as duas é o que faz esse tipo de ferramenta gritar lobo em toda lista bem ordenada, e é por isso que a especificidade é calculada, e não presumida.

## Formatos de entrada

Dois formatos são aceitos, porque você pode ter um ou outro.

**CLI do FortiOS** — a saída de `show firewall policy` ou um bloco `config firewall policy`. Os membros são lidos das listas entre aspas, e uma política com `set status disable` é informada como ignorada, e não silenciosamente descartada.

**Uma tabela com barras verticais ou tabulações** — `id | srcintf | dstintf | srcaddr | dstaddr | service | action`, que é a aparência de uma cópia da interface gráfica ou de uma lista escrita à mão. Vários membros numa célula são separados por vírgula.

O pacote vai numa linha própria em qualquer formato:

```
packet: srcintf=port1, dstintf=port2, srcaddr=LAN, dstaddr=WebSrv, service=HTTPS
```

## A limitação, dita com clareza

A correspondência compara **nomes de objeto**, e não endereços resolvidos. Uma lista de políticas colada não carrega as definições dos objetos de endereço, então a pergunta "10.1.1.5 está dentro do objeto chamado LAN_Subnet" não pode ser respondida a partir desta entrada. Forneça o nome do objeto, ou `all`.

Essa é uma escolha deliberada. A ferramenta poderia adivinhar extraindo endereços dos nomes de objeto, e estaria confiantemente errada sempre que um nome não descrevesse seu conteúdo. Um limite declarado é mais útil que uma resposta plausível e errada, e é a razão de esta ferramenta poder ser confiável nas partes que de fato responde.

Ela também modela **apenas a decisão de correspondência**. Resultados de NAT, desfechos de perfis de segurança, roteamento e estado de sessão dependem de configuração que esta entrada não carrega, e não são inferidos.

## Compartilhar resultado

Abaixo da resposta principal (logo no começo da leitura quando não há pacote), o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva depois do `#` uma cópia da caixa. A página lê as políticas e a linha `packet:` e pula todo o resto, então uma configuração inteira colada aqui também ganha leitura; a cópia troca o valor de cada setting secreto do FortiOS por uma marca numerada, nunca a caixa como foi colada. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda. O popover também diz quantos valores foram trocados.

Os settings trocados são os que a [referência de CLI do FortiOS 7.6.8](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) tipa como senha (`password`, `password-2`, `password-3` ou `password_aes256`; lida em 2026-11-01): `psksecret`, `psksecret-remote` e `ppk-secret` de uma phase 1 de IPsec, o `password` de um administrador e o `passwd` de um usuário local, a `api-key` de um usuário de API, os valores `secret` do RADIUS, os valores `key` do TACACS+ e do HA, `auth-pwd` e `priv-pwd` do SNMPv3, o `password` do BGP e do LDAP, `authentication-key` e `key-string` do OSPF, a `passphrase` do Wi-Fi e as chaves secretas dos conectores de nuvem; qualquer setting cujo nome termine numa palavra como password, secret ou token; o `name` de uma community SNMP, que é a própria community string ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), seção 3.2.5; [RFC 3584](https://www.rfc-editor.org/rfc/rfc3584), seção 5.2.1); e todo valor `ENC`, seja qual for o setting. O próprio aviso da Fortinet [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007) (lido em 2026-11-01) diz que uma configuração "willingly posted on a forum for troubleshooting purpose" (postada de propósito num fórum para pedir ajuda) pode ter os dados `ENC` decifrados até o texto puro, e que esses dados "should currently be considered "easy to decrypt"" (devem ser considerados fáceis de decifrar), então um valor `ENC` é tratado como o segredo que ele guarda. Cada valor vira uma marca numerada (`[redacted-1]`, `[redacted-2]` e assim por diante), com o mesmo número para o mesmo valor; a palavra `ENC`, as aspas e todo o resto ficam. Não há opção para recolocar os valores: nenhum deles muda a leitura, e cada um é uma credencial.

Um valor que passa da própria linha não pode ser trocado ali (uma chave privada PEM entre aspas em várias linhas, [RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), seção 10), e a cópia ainda pode ter uma credencial que ela não sabe nomear (um JWT, [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), seção 1; uma linha `Authorization`, [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), seção 11.6.2; uma senha numa URL, RFC 3986 seção 3.2.1; um access key ID da AWS). Qualquer um deles significa sem link: o popover diz a linha, e você coloca um placeholder no lugar e clica de novo. Um valor cujo nome só parece de segredo (uma palavra num comentário, por exemplo) não impede o link; o popover cita o primeiro. A busca nunca lê esses settings, então lê exatamente igual na cópia; os nomes de interfaces, endereços e políticas vão como foram colados, e o popover pede que você os leia antes.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** A cópia preenche a caixa como se tivesse sido colada e a página faz a busca. Um link que ainda tenha um segredo é um link que o botão nunca monta, e ele é ignorado. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.

## Onde ela se encaixa

Forma par com o artigo de políticas de firewall e NAT do FortiGate, que explica o pipeline de avaliação que esta ferramenta percorre, inclusive por que o NAT de destino via VIP acontece antes da avaliação de política e o NAT de origem depois. Para candidatos ao NSE 4, cobre os objetivos 2.01 e 2.02.
