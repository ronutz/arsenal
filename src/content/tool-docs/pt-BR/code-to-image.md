## O que faz

Cole código, configuração ou saída de terminal e receba uma imagem para um slide, um chamado ou um documento: um SVG que mantém o código como texto de verdade, selecionável, e um PNG em 1x ou 2x, com um texto alternativo pronto para colar ao lado. Você escolhe a linguagem do realce, uma paleta escura ou clara, o tamanho da fonte, as paradas de tabulação, os números de linha, uma moldura de janela com título opcional, a margem e as linhas a destacar.

Antes de qualquer imagem ser feita, uma verificação de segredos procura valores que você talvez não queira publicar, como chaves privadas, headers Authorization, IDs de chave de acesso da AWS, JWTs, senhas em URLs, valores `ENC` do FortiOS e atributos de senha ou segredo. Cada achado é listado e mascarado na imagem, a não ser que você o desmarque. Tudo roda no seu navegador.

Onde o lugar em que você está escrevendo consegue mostrar texto, prefira texto. O Critério de Sucesso 1.4.5 da [WCAG 2.2](https://www.w3.org/TR/WCAG22/), Imagens de Texto, pede texto em vez de imagens de texto sempre que a tecnologia consegue apresentá-lo; um bloco de código numa wiki, numa base de conhecimento ou num sistema de chamados que o renderiza é texto, e quem lê consegue copiá-lo. Esta ferramenta é para os lugares que não conseguem mostrá-lo, e o texto alternativo que ela escreve é o próprio código. [Código em slides e em chamados](/learn/code-on-slides-and-in-tickets) percorre essa escolha, o texto alternativo, o contraste e os segredos que um print guarda.

## Linguagens

Só realce: nada é interpretado, validado ou executado, e um código que não é válido na linguagem escolhida é desenhado mesmo assim, colorido até onde as regras abaixo alcançam. As regras de cada linguagem vêm da referência dela, lida em 27/10/2026.

| Linguagem | O que é colorido | Referência |
|---|---|---|
| Texto simples | Nada | |
| Shell (POSIX sh) | comentários `#` só onde uma palavra pode começar (então `a#b` não é comentário); aspas simples, duplas e dollar-single; `$nome`, `${...}`, `$1`, `$@` e os outros parâmetros especiais, ativos dentro de aspas duplas; as palavras reservadas `if then else elif fi do done case esac while until for in` onde são reservadas; o nome de uma atribuição como `LOG=...`; palavras que são só números | [POSIX.1-2024 Shell Command Language](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/V3_chap02.html), seções 2.2 a 2.6 |
| Python | comentários `#`; strings com todos os prefixos (`b`, `r`, `u`, `f`, `t` e as combinações com `r`, em qualquer caixa), strings com aspas triplas entre linhas; as 35 palavras-chave; as soft keywords `match`, `case`, `type` e `lazy` quando abrem um comando; literais inteiros, de ponto flutuante e imaginários com underscores e `0x`, `0o`, `0b` | [Python 3.15 Lexical analysis](https://docs.python.org/3/reference/lexical_analysis.html), a versão atual de correções (fim de vida em 2031-10, [Status of Python versions](https://devguide.python.org/versions/)) |
| JSON | nomes de membro (uma string seguida de `:`) como chaves; strings; números; `true`, `false`, `null`. JSON não tem comentários, então `//` não é colorido | [RFC 8259](https://www.rfc-editor.org/rfc/rfc8259) |
| YAML | comentários `#` depois de espaço; diretivas `%`; `---` e `...`; chaves de mapeamento; escalares entre aspas duplas e simples, também entre linhas; anchors, aliases e tags; null, booleanos, inteiros e floats do core schema; o conteúdo de block scalars `\|` e `>` | [YAML 1.2.2](https://yaml.org/spec/1.2.2/), seções 5.3, 6.6, 6.8, 6.9, 7.3, 8.1, 9.1.2 e 10.3.2 |
| Tcl, iRules, Expect | comentários `#` só onde um comando começa (então `;#` depois de um comando é comentário); palavras entre aspas duplas com `$` e `[...]` ativos; `$nome`, `${nome}`, `$nome(índice)`; a primeira palavra de um comando quando é um comando nativo do Tcl, `when` ou um comando do Expect; `then`, `elseif`, `else`; números como o `expr` os lê; o nome do evento depois de `when`. Palavras entre chaves são coloridas como scripts, porque os corpos de `proc`, `if`, `when` e `expect` são scripts | [Tcl 9.0 Tcl(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/Tcl.html), [expr(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/expr.html), [if(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/if.html); iRules são [baseadas em Tcl](https://clouddocs.f5.com/api/irules/WhatIsAnIRule.html) e começam com [`when`](https://clouddocs.f5.com/api/irules/when.html); os comandos do Expect vêm do [expect(1)](https://www.tcl-lang.org/man/expect5.31/expect.1.html) |
| F5 tmsh | prompts; comentários `#` no começo de uma palavra; strings entre aspas; os comandos e os módulos raiz (`auth cli gtm ltm net sys wom`) fora de chaves; nomes de atributo no começo de uma linha dentro de um objeto; endereços e números | [TMSH Reference v17](https://clouddocs.f5.com/cli/tmsh-reference/latest/general/tmsh.html) e os [comandos](https://clouddocs.f5.com/cli/tmsh-reference/latest/commands/index.html) |
| CLI do FortiOS | prompts; uma linha que começa com `#` e não é prompt (como a primeira linha de um backup); strings entre aspas simples e duplas com `\'`, `\"` e `\\`; `config`, `edit`, `set`, `unset`, `next`, `end` e os outros comandos; o nome do campo depois de `set`; `ENC`; `$USERFROM`, `$USERNAME`, `$SerialNum`; endereços e números | [FortiOS 7.6.8 CLI basics](https://docs.fortinet.com/document/fortigate/7.6.8/administration-guide/896276/cli-basics), [Command syntax](https://docs.fortinet.com/document/fortigate/7.6.8/administration-guide/508024/command-syntax), [Subcommands](https://docs.fortinet.com/document/fortigate/7.6.8/administration-guide/627485/subcommands) |
| CLI estilo Cisco | prompts (`Router>`, `Router#`, `Router(config)#`, `Router(config-if)#`, com ou sem espaço depois); comentários `!`; `no`, `default` e alguns comandos documentados no começo da linha; endereços, máscaras e números. A CLI da Cisco não tem regra geral de aspas, então nada é colorido como string | [IOS XE 17.x Managing Configuration Files](https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/syst-mgmt/b-system-management/m_cm-config-files-0.html) ("Precede a comment with an exclamation point"), [Using the Cisco IOS Command-Line Interface](https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/syst-mgmt/b-system-management/m_cf-cli-basics.html), [Catalyst 8400: Using Cisco IOS XE Software](https://www.cisco.com/c/en/us/td/docs/routers/c8400/c8400-software-config-guide/Using-Cisco-IOS-XE-software.html) |

O que o realce não faz: here-documents do shell, substituições de comando aninhadas dentro de aspas duplas, campos de substituição de f-strings do Python (a f-string inteira é colorida como string), escalares de fluxo do YAML entre linhas, e tudo o que precisa de um parser em vez de um scanner.

### Sessões de terminal

No shell, no Python e no Tcl, um texto em que alguma linha começa com o prompt da linguagem é lido como sessão. Os prompts são `$ ` (o padrão do `PS1` do POSIX) e o prompt bash do BIG-IP `[root@bigip-1:Active:Standalone] config # ` no shell, `>>> ` e `... ` (o `sys.ps1` e o `sys.ps2` do Python) no Python, e `% ` (tclsh) no Tcl. As linhas com prompt são destacadas como comandos, ligadas à próxima linha com prompt para que uma string possa continuar, e as linhas sem prompt são saída de comando, sem cor, então um apóstrofo na saída não abre string nenhuma. A página avisa quando leu o texto assim.

No tmsh, no FortiOS e na CLI estilo Cisco, os prompts são coloridos e todas as linhas são destacadas, porque a saída deles costuma ser configuração.

## A verificação de segredos

Ela roda sobre o texto, qualquer que seja a linguagem escolhida, antes de qualquer desenho. Cada regra vem da documentação do formato que ela procura:

| Regra | O que procura | O que é mascarado | Fonte |
|---|---|---|---|
| Chave privada PEM | um bloco `-----BEGIN ... PRIVATE KEY-----`: `PRIVATE KEY`, `ENCRYPTED PRIVATE KEY`, a forma tradicional do OpenSSL `RSA PRIVATE KEY` (com os headers `Proc-Type` e `DEK-Info`) e `OPENSSH PRIVATE KEY`; também um bloco escrito numa linha só com escapes `\n` | todas as linhas entre os limites (as linhas de limite ficam); sem linha END, as linhas que parecem base64 | [RFC 7468](https://www.rfc-editor.org/rfc/rfc7468) seções 2, 3, 10, 11; [OpenSSL 3.5 PEM_read_bio_PrivateKey](https://docs.openssl.org/3.5/man3/PEM_read_bio_PrivateKey/); [OpenSSH sshkey.c](https://github.com/openssh/openssh-portable/blob/master/sshkey.c) |
| Header Authorization | `Authorization:` ou `Proxy-Authorization:` com `Bearer` ou `Basic`, em qualquer caixa | as credenciais | [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) 5.1, 11.1, 11.4, 11.6.2; [RFC 6750](https://www.rfc-editor.org/rfc/rfc6750) 2.1; [RFC 7617](https://www.rfc-editor.org/rfc/rfc7617) 2 |
| ID de chave de acesso da AWS | `AKIA` (chave de acesso) ou `ASIA` (chave temporária do STS) e 16 letras maiúsculas ou dígitos, fora de uma palavra maior | o ID | [IAM identifiers](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_identifiers.html); [access keys](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html) |
| JWT | três (JWS) ou cinco (JWE) segmentos base64url unidos por pontos, cujo primeiro segmento decodifica para um objeto JSON com `alg` | o token | [RFC 7515](https://www.rfc-editor.org/rfc/rfc7515) 2, 4.1.1, 7.1; [RFC 7516](https://www.rfc-editor.org/rfc/rfc7516) 4.1.1, 7.1; [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519) 1 |
| Senha em URL | `esquema://usuário:senha@` | a senha | [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) 3.2.1 |
| Valor criptografado do FortiOS | `set <campo> ENC <valor>` | o valor | [dica técnica da Fortinet](https://community.fortinet.com/fortigate-3/technical-tip-command-fail-while-copying-the-preshare-key-from-another-configuration-214348) (`set psksecret ENC ...`) |
| Comando set | `set <nome> <valor>` com um nome de segredo: campos do FortiOS e variáveis do Tcl (scripts Expect, iRules) | o valor, dentro das aspas ou chaves | [FortiOS Subcommands](https://docs.fortinet.com/document/fortigate/7.6.8/administration-guide/627485/subcommands); [Tcl set(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/set.html) |
| Atributo password, passphrase ou secret | `password`, `passphrase`, `encrypted-password`, `proxy-ca-passphrase` do tmsh; `password` e `secret` da Cisco com dígito de tipo opcional | o valor | tmsh [auth user](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/auth/auth_user.html), [sys file ssl-key](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/sys/sys_file_ssl-key.html), [ltm profile client-ssl](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_profile_client-ssl.html), [ltm monitor http](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_monitor_http.html); [senhas no Cisco IOS XE 17.18](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-18/configuration_guide/sec/b_1718_sec_9300_cg/controlling_switch_access_with_passwords_and_privilege_levels.html) |
| Membro JSON | `"nome": "valor"` com um nome de segredo | o valor | [RFC 8259](https://www.rfc-editor.org/rfc/rfc8259) 4, 7; [RFC 6749](https://www.rfc-editor.org/rfc/rfc6749) 5.1 (`access_token`, `refresh_token`) |
| Chave YAML | `nome: valor`, em bloco ou em fluxo, com um nome de segredo | o valor | [YAML 1.2.2](https://yaml.org/spec/1.2.2/) 7.3, 7.4, 8.2.2 |
| Atribuição de shell | `NOME=valor` com um nome de segredo, também na query string de uma URL | o valor | [POSIX](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/V3_chap02.html) 2.10.2; o [arquivo de credenciais da AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html) usa a mesma forma |
| Atribuição | `nome = "string"` (Python, e arquivos no estilo TOML ou INI) com um nome de segredo | o conteúdo da string | [Python 3.15 assignment statements](https://docs.python.org/3/reference/simple_stmts.html) |

**Nome de segredo** é uma regra desta ferramenta, não um padrão: a última palavra do nome (separada em underscores, hífens, pontos e camelCase) é password, passwd, pass, passphrase, secret, token, psk, psksecret, apikey, accesskey, secretkey, privatekey, credential ou credentials, ou o nome termina em key depois de api, access, private, secret, signing, client, auth, encryption, master ou session. Então `DB_PASSWORD`, `client_secret`, `refresh_token`, `apiKey` e `aws_secret_access_key` são nomes de segredo, e `password_file`, `token_type`, `sort_key` e `PWD` (o diretório de trabalho do shell) não são.

**O que não é reportado:** um valor vazio; um placeholder ou uma configuração (`none`, `null`, `true`, `false`, `enable`, `disable` e afins); uma referência que está no lugar do valor, como `$VAR`, `${VAR}`, `$(cmd)`, `$env(PW)`, um `[comando]` do Tcl, `{{ template }}` ou `<placeholder>`; um valor já mascarado com `*`, `x` ou pontos; um valor sem nenhuma letra ou dígito. Um hash no estilo crypt como `$6$salt$hash` ou o `$9$...` da Cisco não é referência e é reportado. Um atributo password, passphrase ou secret dentro de um comentário não é reportado, porque comentários usam essas palavras em prosa; todas as outras regras procuram também dentro de comentários. Quando duas regras acham os mesmos caracteres, fica a mais específica (um JWT num header Bearer é um achado só).

**Mascaramento.** Um valor mascarado é trocado por oito pontos, qualquer que seja o tamanho dele, então a imagem não mostra quão longo ele era. Os próprios caracteres são trocados, não cobertos: não estão no texto do SVG, nem no PNG, nem no texto alternativo, onde o valor aparece como "[mascarado]". Desmarque um achado para mostrá-lo como está escrito; a escolha é lembrada por regra, linha e coluna enquanto você edita em outro lugar.

**Não é um scanner completo.** Ela conhece os formatos acima e nada além, não distingue um segredo real de um exemplo, e um segredo que ela não procura continua na imagem. Leia a imagem antes de publicar.

Os segredos de sessão na saída do `openssl s_client` são um exemplo: nenhuma regra os procura, então uma linha `Resumption PSK:` do TLS 1.3 é desenhada como foi impressa, e uma linha `Master-Key:` do TLS 1.2 só é mascarada porque tem a forma de uma chave YAML com um nome de segredo. O [explicador do openssl s_client](/tools/openssl-s-client-explainer) aponta os dois entre os achados.

## Como a imagem é feita

O motor monta o layout da imagem uma vez (cada retângulo, ponto e trecho de texto, com posição e cor) e os dois arquivos saem desse layout, então não podem divergir.

- **Fonte e grade.** JetBrains Mono, a fonte monoespaçada do site, sob a [SIL Open Font License 1.1](https://openfontlicense.org/open-font-license-official-text/). As métricas dela, lidas do arquivo da fonte: 1000 unidades por em, todo caractere com 600 unidades de largura, ascendente 1020, descendente 300. Uma coluna tem 0,6 vez o tamanho da fonte, uma linha tem 1,5 vez o tamanho da fonte arredondado para um pixel inteiro, e o texto fica no meio da linha. Uma coluna por code point: as tabulações se expandem para as paradas escolhidas, e caracteres mais largos em algumas fontes (muitos caracteres do leste asiático e emojis) ainda ocupam uma coluna, então podem invadir o vizinho.
- **O SVG** guarda cada linha como um elemento `<text>` de texto de verdade, colorido com elementos `<tspan>`, e dá a cada caractere a sua própria posição x: o [SVG 2](https://www.w3.org/TR/SVG2/text.html) aplica o enésimo valor de x ao enésimo caractere, contado em code points, então as colunas se mantêm mesmo numa fonte alternativa. Ele indica a fonte (`'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, 'DejaVu Sans Mono', 'Liberation Mono', monospace`) e não a embute; onde a JetBrains Mono não está instalada, a fonte monoespaçada de quem vê desenha as mesmas colunas. O espaço em branco é preservado (`xml:space="preserve"` e `white-space: pre`), as ligaduras de programação ficam desligadas, o documento tem um `<title>` com a descrição e `role="img"`, e os números de linha são elementos separados, para que uma seleção do código não os pegue. Caracteres que um documento XML não aceita (produção [2] do [XML 1.0](https://www.w3.org/TR/xml/): caracteres de controle além de tabulação e quebra de linha, surrogates soltos, U+FFFE e U+FFFF) são trocados por U+FFFD antes.
- **O PNG** é desenhado num canvas no seu navegador em 1x ou 2x os pixels CSS, caractere por caractere na mesma grade, com a cópia da JetBrains Mono da própria página. Imagens muito grandes podem passar do que um navegador permite para um canvas; a página avisa, e o SVG continua funcionando.
- **Copiar o PNG** usa `ClipboardItem`, onde o navegador tem; `image/png` é um dos tipos de dado que a [Clipboard API](https://www.w3.org/TR/clipboard-apis/) exige para escrita.

Nada é carregado de lugar nenhum nem enviado para lugar nenhum. A prévia é SVG inline montado a partir do layout, e os downloads são arquivos gerados na página.

## Paletas e contraste

As duas paletas são medidas com as fórmulas da própria WCAG 2.2 (luminância relativa com o limiar 0,04045, razão de contraste (L1 + 0,05) / (L2 + 0,05)). Toda cor de texto, os números de linha e o título da janela atingem os 4,5:1 do Critério de Sucesso 1.4.3 contra todo fundo em que podem ficar: o fundo do código e a faixa da linha destacada (o título contra a barra de título). O marcador à esquerda de uma linha destacada é um objeto gráfico e atinge os 3:1 do 1.4.11. Os três pontos da janela são decoração. As razões são arredondadas para baixo, então uma aprovação nunca é arredondada para cima.

| Texto | Clara: no fundo `#ffffff` | Clara: no destaque `#fff3c4` | Escura: no fundo `#11151c` | Escura: no destaque `#26303d` |
|---|---|---|---|---|
| Simples | `#1f2328` 15,79 | 14,19 | `#e6e9ef` 15,04 | 10,97 |
| Comentário | `#57606a` 6,38 | 5,74 | `#9ba6b2` 7,39 | 5,39 |
| String | `#0a6629` 7,12 | 6,40 | `#9ddba0` 11,38 | 8,31 |
| Número | `#0550ae` 7,59 | 6,82 | `#8fc6ff` 10,18 | 7,43 |
| Palavra-chave | `#a40e26` 7,86 | 7,06 | `#ff9c94` 9,09 | 6,63 |
| Variável | `#8a4600` 7,10 | 6,38 | `#f6bd84` 10,91 | 7,96 |
| Prompt | `#0b6874` 6,46 | 5,81 | `#7fd8d0` 11,00 | 8,03 |
| Chave | `#6639ba` 7,34 | 6,59 | `#c9b0ff` 9,70 | 7,08 |
| Valor mascarado | `#9c1c6f` 7,47 | 6,71 | `#ff8fd0` 8,79 | 6,41 |
| Número de linha | `#5f6872` 5,66 | 5,08 | `#97a1ad` 6,98 | 5,09 |

Título da janela na barra de título: clara `#3a424a` sobre `#eceff3`, 8,84; escura `#c3cbd4` sobre `#1d232c`, 9,64. Marcador do destaque (3:1 exigido): clara `#9a6700`, 4,86 no fundo e 4,37 no destaque; escura `#e3b341`, 9,40 e 6,86.

## Texto alternativo

O texto alternativo é uma linha de descrição (quantas linhas, qual linguagem, quantos valores mascarados), uma linha em branco e depois o código como texto simples, com cada valor mascarado escrito como "[mascarado]". Isso segue o Critério de Sucesso 1.1.1, Conteúdo Não Textual: a alternativa em texto de uma imagem de código serve ao mesmo propósito quando é o próprio código. Onde o texto alternativo ficaria longo, coloque o código como texto ao lado da imagem (num slide, nas anotações do apresentador) e deixe só a descrição como texto alternativo.

## Opções

- **Linguagem**: o realce (veja a tabela acima).
- **Paleta**: escura (o padrão) ou clara.
- **Tamanho da fonte**: 12, 14, 16 (o padrão), 18, 20, 24 ou 28 pixels CSS.
- **Paradas de tabulação**: a cada 2, 4 (o padrão) ou 8 colunas.
- **Margem**: 16, 32 (o padrão), 48 ou 64 pixels CSS em volta da janela, ou em volta do código sem moldura.
- **Números de linha**: ligados por padrão.
- **Moldura de janela**: ligada por padrão, com três pontos decorativos e um título opcional de até 80 caracteres.
- **Destacar linhas**: números e intervalos separados por vírgulas ou espaços, como `3, 5-7`. Um item que não é número nem intervalo, um zero ou um intervalo invertido é ignorado, e um intervalo que passa da última linha vale até a última linha; a página lista o que ignorou.

## Limites e o que muda

A ferramenta recusa, com o motivo, textos com mais de 50.000 caracteres, mais de 400 linhas, uma linha com mais de 400 colunas depois de expandir as tabulações, um título com mais de 80 caracteres e uma lista de destaque com mais de 200 caracteres. Isso mantém a imagem dentro do que um slide ou um chamado consegue usar e do que os navegadores conseguem desenhar.

Ela avisa quando removeu uma marca de ordem de bytes, leu retornos de carro como quebras de linha, trocou caracteres que o XML não aceita, expandiu tabulações, removeu espaços no fim das linhas (eles só alargariam a imagem) ou leu o texto como sessão de terminal. Uma quebra de linha final não cria linha a mais.

## Exemplo comentado

O botão Exemplo carrega uma fase 1 de IPsec do FortiOS cuja chave pré-compartilhada está na forma criptografada `ENC`, escrita para este exemplo (base64 de "for-demo-only-not-a-real-key"), com o endereço de documentação 203.0.113.10 da [RFC 5737](https://www.rfc-editor.org/rfc/rfc5737):

```
config vpn ipsec phase1-interface
    edit "to-branch-01"
        set interface "port1"
        set peertype any
        set proposal aes256-sha256
        set remote-gw 203.0.113.10
        set psksecret ENC Zm9yLWRlbW8tb25seS1ub3QtYS1yZWFsLWtleQ==
    next
end
```

A verificação de segredos reporta um achado, "Valor criptografado do FortiOS (ENC), linha 7, coluna 27", e a imagem mostra `set psksecret ENC ••••••••` na linha 7, que o Exemplo também destaca, sob o título "VPN to branch 01". O SVG tem 451,2 por 348 pixels CSS na paleta escura, e o texto alternativo começa com "Imagem de código: 9 linhas de CLI do FortiOS, 1 valor mascarado".

## Compartilhar resultado

Abaixo dos botões de exportação, **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva três coisas depois do `#`: o texto como a imagem o mostra, com cada valor mascarado pela verificação de segredos trocado pelos mesmos oito pontos, a linguagem do realce e a paleta. O título da janela (texto livre que a verificação de segredos não lê), as linhas destacadas, o tamanho da fonte, o espaçamento, as paradas de tabulação e as duas opções de liga e desliga não vão no link. Um valor que você desmarcou vai no link como foi digitado, e o popover nomeia cada valor assim pela linha e pelo rótulo antes de você copiar qualquer coisa; quando nada está desmarcado, ele diz que todo valor encontrado vai mascarado. A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o texto não é enviado ao servidor quando o link é aberto; ele fica na barra de endereço e no histórico de quem abre.

- **Tamanho.** No máximo 16.384 caracteres de texto, o limite que o site usa para todo valor depois do `#`; um texto maior não ganha link, e o popover avisa.
- **Ao abrir um link.** O texto preenche a caixa como se tivesse sido colado, a linguagem e a paleta são aplicadas e a imagem é desenhada; as outras escolhas da página que recebe ficam como estão. Um valor mascarado chega como oito pontos: em algumas linhas a verificação de segredos os encontra de novo e os mascara de novo, em outras os desenha como caracteres comuns, então a descrição pode contar menos valores mascarados, mas não há valor nenhum para revelar. Uma linguagem ou uma paleta que a ferramenta não oferece faz o link inteiro ser ignorado. Nos dois casos, os valores saem do endereço da página na hora, sem nenhuma requisição.

## Procedência

O comportamento é fixado pelo conjunto de golden vectors `code-to-image-golden-2026-10-27b`: o realce de todas as linguagens (texto simples, script e sessão de shell, script e sessão de Python, JSON, YAML, uma iRule, um script Expect, uma sessão tclsh, tmsh, FortiOS, estilo Cisco), três documentos SVG byte a byte com o texto alternativo (cada um conferido como XML bem formado e com uma posição x por caractere), cada regra de segredo positiva e negativa com os caracteres exatos mascarados (e conferidos como ausentes do SVG e do texto alternativo quando mascarados), cada limite no valor e além dele, a normalização, as observações, o parser de destaque e cada razão de contraste acima, cuja luminância também é comparada com a da [ferramenta de contraste de cores](/tools/color-contrast-format) do site, e o texto que um link de Compartilhar resultado leva para sete entradas, byte a byte, com a verificação de que a página que recebe desenha os mesmos caracteres e de que nenhum valor mascarado vai no link.

## API

Não é exposta pela API, de propósito. O PNG é desenhado pelo navegador de quem usa, e a entrada é o tipo de texto que guarda segredos: configurações, capturas e scripts são justamente o motivo de existir a verificação de segredos, e o lugar seguro para verificá-los é a máquina onde eles já estão. Enviá-los a um servidor para verificação anularia a verificação.

## Fontes

Todas lidas em 27/10/2026.

- [The Open Group Base Specifications Issue 8 (POSIX.1-2024), Shell Command Language](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/V3_chap02.html)
- [Python 3.15: Lexical analysis](https://docs.python.org/3/reference/lexical_analysis.html), [sys.ps1 e sys.ps2](https://docs.python.org/3/library/sys.html), [assignment statements](https://docs.python.org/3/reference/simple_stmts.html), [Status of Python versions](https://devguide.python.org/versions/)
- [RFC 8259, JSON](https://www.rfc-editor.org/rfc/rfc8259)
- [YAML 1.2.2](https://yaml.org/spec/1.2.2/)
- [Tcl 9.0: Tcl(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/Tcl.html), [expr(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/expr.html), [if(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/if.html), [set(n)](https://www.tcl-lang.org/man/tcl9.0/TclCmd/set.html), [tclsh(1)](https://www.tcl-lang.org/man/tcl9.0/UserCmd/tclsh.html), [o índice de comandos](https://www.tcl-lang.org/man/tcl9.0/TclCmd/index.html), [as versões](https://www.tcl-lang.org/software/tcltk/)
- [F5 iRules: What Is An iRule](https://clouddocs.f5.com/api/irules/WhatIsAnIRule.html) e [when](https://clouddocs.f5.com/api/irules/when.html); [expect(1)](https://www.tcl-lang.org/man/expect5.31/expect.1.html)
- [F5 TMSH Reference v17](https://clouddocs.f5.com/cli/tmsh-reference/latest/) (tmsh, o índice de comandos, o PDF 17.0.0, auth user, sys file ssl-key, ltm profile client-ssl, ltm monitor http). A política de suporte de software da F5, o [K5903](https://my.f5.com/manage/s/article/K5903) (lida em 2026-10-27), dá às Long-Term Stability Releases 17.x Standard Support até 31 de março de 2027 (17.1.x) e 1º de janeiro de 2029 (17.5.x).
- [FortiOS 7.6.8 Administration Guide](https://docs.fortinet.com/document/fortigate/7.6.8/administration-guide/896276/cli-basics) (CLI basics, Command syntax, Subcommands, Trusted platform module support), [CLI Reference: config system admin](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/390485493/config-system-admin), as dicas técnicas da Fortinet sobre [copiar uma chave pré-compartilhada](https://community.fortinet.com/fortigate-3/technical-tip-command-fail-while-copying-the-preshare-key-from-another-configuration-214348) e sobre [o fim do suporte do FortiOS 7.4 e 7.6](https://community.fortinet.com/fortigate-3/technical-tip-fortios-end-of-support-change-for-fortios-v7-4-and-v7-6-224876) (7.6: fim do suporte de engenharia em 25 de julho de 2028, fim do suporte em 25 de janeiro de 2030)
- Cisco IOS XE 17.x System Management Configuration Guide: [Managing Configuration Files](https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/syst-mgmt/b-system-management/m_cm-config-files-0.html) e [Using the Cisco IOS Command-Line Interface](https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/syst-mgmt/b-system-management/m_cf-cli-basics.html); [Catalyst 8400: Using Cisco IOS XE Software](https://www.cisco.com/c/en/us/td/docs/routers/c8400/c8400-software-config-guide/Using-Cisco-IOS-XE-software.html); [senhas no IOS XE 17.18](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-18/configuration_guide/sec/b_1718_sec_9300_cg/controlling_switch_access_with_passwords_and_privilege_levels.html); [a declaração de ciclo de vida do software IOS XE](https://www.cisco.com/c/en/us/products/collateral/ios-nx-os-software/ios-xe-26/bulletin-c25-2378701.html)
- [RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), [OpenSSL 3.5 PEM_read_bio_PrivateKey](https://docs.openssl.org/3.5/man3/PEM_read_bio_PrivateKey/) (a 3.5 é a versão de suporte de longo prazo do OpenSSL, com suporte até 2030-04-08 segundo a [estratégia de versões](https://openssl-library.org/policies/releasestrat/)), [OpenSSH sshkey.c](https://github.com/openssh/openssh-portable/blob/master/sshkey.c)
- [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), [RFC 6750](https://www.rfc-editor.org/rfc/rfc6750), [RFC 7617](https://www.rfc-editor.org/rfc/rfc7617), [RFC 6749](https://www.rfc-editor.org/rfc/rfc6749)
- AWS: [IAM identifiers](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_identifiers.html), [access keys](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html), [arquivos de configuração e de credenciais da CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html)
- [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), [RFC 7515](https://www.rfc-editor.org/rfc/rfc7515), [RFC 7516](https://www.rfc-editor.org/rfc/rfc7516), [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), [RFC 5737](https://www.rfc-editor.org/rfc/rfc5737)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [Understanding 1.4.5 Images of Text](https://www.w3.org/WAI/WCAG22/Understanding/images-of-text.html), [Understanding 1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- [SVG 2, Text](https://www.w3.org/TR/SVG2/text.html), [XML 1.0 (Fifth Edition)](https://www.w3.org/TR/xml/), [Clipboard API and events](https://www.w3.org/TR/clipboard-apis/), [Content Security Policy Level 3](https://www.w3.org/TR/CSP3/)
- [SIL Open Font License 1.1](https://openfontlicense.org/open-font-license-official-text/), e o arquivo LICENSE do pacote @fontsource/jetbrains-mono 5.2.8 (Copyright 2020 The JetBrains Mono Project Authors)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (lida em 2026-10-27): seção 3.5, o fragmento, que leva os valores de um link de Compartilhar resultado
