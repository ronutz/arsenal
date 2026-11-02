## O que faz

Cole um JSON e a ferramenta o valida e, em seguida, o formata, minifica ou ordena. O que a distingue de um simples `JSON.parse` é o que ela informa quando algo está errado ou incomum: um erro de análise indica a linha, a coluna e o caminho exatos do problema; chaves de objeto repetidas são sinalizadas; e números muito grandes ou muito precisos são preservados exatamente, em vez de arredondados. Tudo roda no seu navegador.

## Um analisador feito para diagnóstico

O motor é um analisador escrito à mão que rastreia a posição enquanto lê, em vez de depender da análise nativa do runtime JavaScript. Isso traz três vantagens que importam na prática:

- **Erros precisos.** Quando a análise falha, você recebe a linha, a coluna, o deslocamento em bytes, uma mensagem em linguagem clara e o caminho JSON Pointer (RFC 6901) até o local, em vez de um único `SyntaxError` dependente do motor e sem caminho.
- **Detecção de chaves duplicadas.** A gramática JSON tecnicamente permite que um objeto repita uma chave, e o `JSON.parse` mantém silenciosamente apenas a última. Esse comportamento silencioso esconde bugs reais, então este motor relata cada duplicata que encontra, por caminho.
- **Números grandes exatos.** Números JSON não têm limite de tamanho, mas um número JavaScript é um ponto flutuante de 64 bits e perde precisão acima de 2^53. O formatador preserva os dígitos que você escreveu, de modo que um id de 20 dígitos ou um decimal de alta precisão não seja arredondado silenciosamente.

## Formatar, minificar e ordenar

Uma vez que o JSON é válido, você pode formatá-lo com indentação consistente, minificá-lo para a menor forma em linha única ou ordenar as chaves dos objetos para que dois documentos que diferem apenas na ordem das chaves fiquem alinhados para comparação. A ordenação é por chave e não reordena arrays, cuja ordem é significativa em JSON.

## Exemplos

- `{"b":1,"a":2}` ordenado por chave vira `{"a":2,"b":1}`.
- `{ "a": 1 }` minificado vira `{"a":1}`, com os espaços em branco removidos.
- `{"id":10000000000000001}` mantém todos os seus dígitos, enquanto uma ida e volta por um ponto flutuante de 64 bits o transformaria em `10000000000000000`.
- `{"a":1,"a":2}` é sinalizado pela chave duplicada `a`; um analisador comum manteria silenciosamente `2`.

## Como usar

Cole um documento JSON e escolha formatá-lo, minificá-lo ou ordená-lo. Se ele não for analisável, o erro aponta o ponto exato; se for analisável mas tiver chaves duplicadas ou números grandes demais, isso é destacado. A ferramenta é uma função pura da entrada, então o mesmo documento sempre dá o mesmo resultado.

Para XML, o [formatador e validador de XML](/tools/xml-formatter) faz o mesmo trabalho: uma verificação de boa formação que aponta a linha e a coluna, e depois a formatação ou a minificação.

## Compartilhar resultado

Primeiro na leitura (ou abaixo de um erro de análise, que também é uma leitura), o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva depois do `#` o JSON como foi colado e as três opções (formatar ou minificar, a indentação, chaves ordenadas). O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda. Um JSON muitas vezes traz senhas, chaves e nomes internos, então o popover pede que você o leia antes de mandar o link. O texto vai como foi colado: a saída formatada mostra todos os valores, então nada pode ser trocado sem mudar o que o leitor vê. Antes de oferecer um link, o texto é verificado em busca de uma credencial que um padrão define: uma chave privada PEM, uma linha `Authorization` ou `Proxy-Authorization` com qualquer esquema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), seções 11.6.2 e 11.7.2: o valor "consists of credentials"), uma linha `Cookie` ou `Set-Cookie` com valor ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), seções 4.1.1 e 4.2.1), um JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), seção 1), uma senha numa URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), seção 3.2.1: a forma "user:password" "is deprecated"), um access key ID da AWS ou um valor `ENC` do FortiOS; todos lidos em 2026-11-01. Qualquer um deles significa sem link: o popover diz a linha, e você troca o valor por um placeholder e clica de novo. Um valor cujo nome só parece de segredo (um membro `password` ou `apiKey`) não impede o link; o popover cita o primeiro para você conferir. Aqui cinco nomes de membro contam como credencial, porque um padrão define o que eles guardam: `access_token` e `refresh_token` ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), seções 1.4, 1.5 e 5.1: "Access tokens are credentials used to access protected resources"), `id_token` ([OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html), seção 3.1.3.3), `client_secret` ([RFC 7591](https://www.rfc-editor.org/rfc/rfc7591), seção 3.2.1) e `registration_access_token` ([RFC 7592](https://www.rfc-editor.org/rfc/rfc7592), seção 3); todos lidos em 2026-11-01. Com valor, qualquer um deles significa sem link, como no decodificador de OIDC.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** O texto preenche a caixa e as opções são marcadas como você faria, e a página o formata. Uma opção desconhecida faz o link ser ignorado. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
