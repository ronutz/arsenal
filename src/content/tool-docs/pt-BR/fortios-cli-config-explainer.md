## O que faz

Cole um bloco de configuração do FortiOS e a ferramenta devolve a estrutura em árvore com cada verbo explicado: o que `config`, `edit`, `set`, `unset`, `append`, `next`, `end` e `abort` fazem, e em que nível o bloco está a cada linha. Local e offline; lê estrutura, não semântica.

## A armadilha que ela existe para pegar

**`set` num campo de múltiplos valores substitui a lista inteira.** `set srcaddr "internal-net"` numa policy que tinha quatro endereços de origem a deixa com um — com sucesso, em silêncio, sem que nada na saída mencione isso. O comando que acrescenta é o **`append`**.

A ferramenta avisa em todo `set` contra um campo de lista conhecido, nomeando o campo e a linha. Esse é o hábito mais caro no trabalho de CLI do FortiOS e é invisível num bloco lido casualmente — que é exatamente quando blocos são lidos.

## Mais duas coisas que ela sempre diz

- **`edit` cria o que não encontra.** Um ID de policy digitado errado não produz um erro, produz uma policy.
- **`end` é a única linha que aplica.** `next` fecha uma entrada e permanece na tabela; `abort` fecha e descarta. Um bloco usando `end` onde se queria `next` sai da tabela cedo demais e cada edit restante cai em outro lugar.

Ela também reporta **blocos não fechados**, porque um bloco não fechado não aplicou nada e colar um numa sessão ativa deixa você em algum lugar inesperado.

## O que ela não faz

Não conhece os seus objetos de endereço, as suas policies nem o seu arranjo de VDOMs, e não sabe dizer se um valor faz sentido. Ela responde se o formato do comando faz o que quem digitou provavelmente esperava — que é uma pergunta diferente e muitas vezes mais útil.

Também não tem como saber o que havia num campo antes. Quando ela avisa que um `set` substitui uma lista, **a pergunta que ela está pedindo que você responda é o que aquela lista continha.**

## Compartilhar resultado

Logo no começo da leitura, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva depois do `#` uma cópia do bloco com o valor de cada setting secreto do FortiOS trocado por uma marca numerada, nunca o bloco como foi colado, porque a árvore mostra o valor de cada linha. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda. O popover também diz quantos valores foram trocados.

Os settings trocados são os que a [referência de CLI do FortiOS 7.6.8](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) tipa como senha (`password`, `password-2`, `password-3` ou `password_aes256`; lida em 2026-11-01): `psksecret`, `psksecret-remote` e `ppk-secret` de uma phase 1 de IPsec, o `password` de um administrador e o `passwd` de um usuário local, a `api-key` de um usuário de API, os valores `secret` do RADIUS, os valores `key` do TACACS+ e do HA, `auth-pwd` e `priv-pwd` do SNMPv3, o `password` do BGP e do LDAP, `authentication-key` e `key-string` do OSPF, a `passphrase` do Wi-Fi e as chaves secretas dos conectores de nuvem; qualquer setting cujo nome termine numa palavra como password, secret ou token; o `name` de uma community SNMP, que é a própria community string ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), seção 3.2.5; [RFC 3584](https://www.rfc-editor.org/rfc/rfc3584), seção 5.2.1); e todo valor `ENC`, seja qual for o setting. O próprio aviso da Fortinet [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007) (lido em 2026-11-01) diz que uma configuração "willingly posted on a forum for troubleshooting purpose" (postada de propósito num fórum para pedir ajuda) pode ter os dados `ENC` decifrados até o texto puro, e que esses dados "should currently be considered "easy to decrypt"" (devem ser considerados fáceis de decifrar), então um valor `ENC` é tratado como o segredo que ele guarda. Cada valor vira uma marca numerada (`[redacted-1]`, `[redacted-2]` e assim por diante), com o mesmo número para o mesmo valor; a palavra `ENC`, as aspas e todo o resto ficam. Não há opção para recolocar os valores: nenhum deles muda a leitura, e cada um é uma credencial.

Um valor que passa da própria linha não pode ser trocado ali (uma chave privada PEM entre aspas em várias linhas, [RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), seção 10), e a cópia ainda pode ter uma credencial que ela não sabe nomear (um JWT, [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), seção 1; uma linha `Authorization`, [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), seção 11.6.2; uma senha numa URL, RFC 3986 seção 3.2.1; um access key ID da AWS). Qualquer um deles significa sem link: o popover diz a linha, e você coloca um placeholder no lugar e clica de novo. Um valor cujo nome só parece de segredo (uma palavra num comentário, por exemplo) não impede o link; o popover cita o primeiro. Nomes de interfaces, endereços, objetos e usuários vão como foram colados, e o popover pede que você os leia antes.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** A cópia preenche a caixa como se tivesse sido colada e a página a explica: a árvore, os avisos e as notas ficam iguais aos de quem mandou, com as marcas no lugar dos valores. Um link que ainda tenha um segredo é um link que o botão nunca monta, e ele é ignorado. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.

## Ferramentas relacionadas

Para coletar a configuração de um FortiGate por script, o [gerador de scripts Expect](/tools/expect-script-builder) escreve um script de login e execução com um perfil FortiOS. Por padrão, ele responde ao pager `--More--` com um Espaço em vez de mudar a configuração de saída do console, uma mudança global que a sessão de todo administrador veria.
