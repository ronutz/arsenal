## O que faz

Cole duas configurações do FortiOS separadas por uma linha com `---` e obtenha um diff **estrutural**: o que mudou por seção, objeto e configuração. Roda inteiramente no seu navegador.

## Por que um diff por linha é a ferramenta errada aqui

Um diff textual encontra um **roteiro mínimo de edição**, que não é a mesma coisa que a mudança feita por uma pessoa. Aplicado à saída do FortiOS, isso produz três incômodos específicos:

- Um bloco que **mudou de lugar** é informado como remoção mais inserção, então revisar um objeto inalterado custa a mesma atenção que uma edição real.
- Um objeto parece alterado porque um vizinho ganhou uma linha e o alinhamento se deslocou.
- Três edições genuínas ficam enterradas em quatrocentas linhas de contexto inalterado.

Esta ferramenta analisa os dois lados em seção, objeto e configuração, e então compara as estruturas. Um bloco que mudou de lugar não é uma mudança. Uma configuração alterada é uma linha nomeando o valor antigo e o novo.

## O único lugar em que a ordem não é ruído

Na maioria das seções a ordem dos objetos é irrelevante: objetos de endereço, de serviço, interfaces. Informar um reordenamento ali seria ruído, então é ignorado.

Para **firewall policy** e suas parentes, a ordem **é** o comportamento. A primeira correspondência vence, então mover uma política acima de outra muda o que o equipamento faz sem alterar uma única configuração. Essa é a edição que um diff por linha enterra com mais eficácia, porque nada dos dois lados do movimento difere textualmente, exceto a posição.

Essas seções são tratadas como sensíveis à ordem pelo nome, e um reordenamento nelas é informado como achado real:

`firewall policy` · `firewall policy6` · `firewall proxy-policy` · `firewall local-in-policy` · `firewall shaping-policy` · `firewall security-policy` · `router policy` · `router policy6` · `system sdwan`

Tratar os dois casos do mesmo jeito, em qualquer direção, tornaria a ferramenta errada, então os dois comportamentos são fixados por vetores de ouro.

## Entrada

Duas configurações, separadas por uma linha contendo apenas `---`, ou rotuladas com `BEFORE:` e `AFTER:` em linhas próprias. Cada lado é a saída comum de `show` ou `show full-configuration`.

Blocos `config` aninhados dentro de um objeto são analisados, e suas configurações recebem prefixo com o caminho aninhado para que não colidam com uma configuração de mesmo nome no objeto pai.

## O que ela não faz

**Ela compara, não julga.** Vai dizer que uma política mudou de lugar ou que um endereço mudou; não vai dizer se isso foi uma boa ideia, porque isso depende de uma intenção que ela não enxerga.

Também não modela o peso semântico de uma configuração. Mudar um comentário e mudar uma ação aparecem ambos como uma configuração alterada, e cabe a quem lê saber qual importa.

Entrada idêntica produz silêncio, e não um aviso tranquilizador. Uma ferramenta de diff que encontra mudanças fantasma é pouco confiável nas que contam, então um vetor fixa isso também.

## Compartilhar resultado

Logo no começo da comparação, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva depois do `#` uma cópia da caixa, as duas configurações com o valor de cada setting secreto do FortiOS trocado por uma marca numerada, nunca a caixa como foi colada. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda. O popover também diz quantos valores foram trocados.

Os settings trocados são os que a [referência de CLI do FortiOS 7.6.8](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) tipa como senha (`password`, `password-2`, `password-3` ou `password_aes256`; lida em 2026-11-01): `psksecret`, `psksecret-remote` e `ppk-secret` de uma phase 1 de IPsec, o `password` de um administrador e o `passwd` de um usuário local, a `api-key` de um usuário de API, os valores `secret` do RADIUS, os valores `key` do TACACS+ e do HA, `auth-pwd` e `priv-pwd` do SNMPv3, o `password` do BGP e do LDAP, `authentication-key` e `key-string` do OSPF, a `passphrase` do Wi-Fi e as chaves secretas dos conectores de nuvem; qualquer setting cujo nome termine numa palavra como password, secret ou token; o `name` de uma community SNMP, que é a própria community string ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), seção 3.2.5; [RFC 3584](https://www.rfc-editor.org/rfc/rfc3584), seção 5.2.1); e todo valor `ENC`, seja qual for o setting. O próprio aviso da Fortinet [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007) (lido em 2026-11-01) diz que uma configuração "willingly posted on a forum for troubleshooting purpose" (postada de propósito num fórum para pedir ajuda) pode ter os dados `ENC` decifrados até o texto puro, e que esses dados "should currently be considered "easy to decrypt"" (devem ser considerados fáceis de decifrar), então um valor `ENC` é tratado como o segredo que ele guarda. Cada valor vira uma marca numerada (`[redacted-1]`, `[redacted-2]` e assim por diante), com o mesmo número para o mesmo valor; a palavra `ENC`, as aspas e todo o resto ficam. Não há opção para recolocar os valores: nenhum deles muda a leitura, e cada um é uma credencial. Como valores iguais ficam com marcas iguais e valores diferentes com marcas diferentes, um segredo que mudou entre os dois lados continua aparecendo como setting alterado (`psksecret: ENC [redacted-1] → ENC [redacted-3]`), e um que não mudou continua sem aparecer.

Um valor que passa da própria linha não pode ser trocado ali (uma chave privada PEM entre aspas em várias linhas, [RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), seção 10), e a cópia ainda pode ter uma credencial que ela não sabe nomear (um JWT, [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), seção 1; uma linha `Authorization`, [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), seção 11.6.2; uma senha numa URL, RFC 3986 seção 3.2.1; um access key ID da AWS). Qualquer um deles significa sem link: o popover diz a linha, e você coloca um placeholder no lugar e clica de novo. Um valor cujo nome só parece de segredo (uma palavra num comentário, por exemplo) não impede o link; o popover cita o primeiro. Endereços, nomes de objetos e o resto das duas configurações vão como foram colados, e o popover pede que você os leia antes.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** A cópia preenche a caixa como se tivesse sido colada e a página compara os dois lados, com as mesmas seções, objetos e settings alterados que quem mandou viu. Um link que ainda tenha um segredo é um link que o botão nunca monta, e ele é ignorado. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.

## Onde ela se encaixa

Forme par com o artigo de políticas de firewall e NAT do FortiGate, que explica por que a ordem determina comportamento nas seções que esta ferramenta trata como sensíveis à ordem.
