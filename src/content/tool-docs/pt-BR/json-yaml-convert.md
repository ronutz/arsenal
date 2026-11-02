## O que faz

Converta um documento entre JSON e YAML em qualquer direção, no seu navegador. Partindo do JSON, ela produz YAML em estilo de bloco; partindo do YAML, produz JSON. Quando uma análise falha, o erro indica a linha e a coluna exatas, e quando uma conversão perde algo pelo caminho, uma nota explica o quê e por quê.

## As duas direções

- **JSON para YAML.** O JSON é primeiro validado pelo mesmo analisador preciso, que rastreia a posição, usado pelo formatador JSON, de modo que um documento inválido é rejeitado com linha, coluna e caminho JSON Pointer, em vez de uma falha vaga. Os dados válidos são então escritos como YAML em estilo de bloco.
- **YAML para JSON.** O YAML é analisado sob um esquema compatível com JSON e serializado para JSON. Âncoras e aliases (o mecanismo de reúso `&nome` e `*nome` do YAML) são expandidos inline, e escalares de bloco (os estilos de string de múltiplas linhas do YAML) viram strings JSON comuns.

## As armadilhas de aspas que ela trata

O YAML é famoso por ler uma palavra solta como algo diferente de uma string, e é aí que as idas e voltas dão errado. O caso mais conhecido é o "problema da Noruega": a palavra solta `NO` é lida como o booleano falso, e o mesmo acontece com `yes`, `on` e `off`, e com valores como `1.0` (um número, não a string "1.0") e `08` (que não é um octal válido). Ao emitir YAML, o conversor coloca esses valores entre aspas para que aquilo que você quis dizer como string sobreviva como string.

## O que a conversão pode perder

Algumas coisas existem em um formato mas não no outro, então as notas as sinalizam:

- **Comentários.** O YAML tem comentários e o JSON não, então os comentários são descartados ao converter de YAML para JSON.
- **Âncoras e aliases.** São expandidos para o seu valor completo, então uma referência compartilhada e compacta no YAML de origem vira dado repetido na saída.

## Exemplos

- O JSON `{"port":8080,"tls":true}` vira as linhas YAML `port: 8080` e `tls: true`.
- O YAML `country: NO` vira o JSON `{"country":"NO"}` na entrada, e quando isso é emitido de volta para YAML o valor é colocado entre aspas como `country: "NO"` para que não seja confundido com falso.

## Como usar

Cole JSON para obter YAML, ou YAML para obter JSON. Leia as notas de conversão quando aparecerem: elas dizem se algo, como um comentário ou uma âncora, mudou de um jeito que você deva saber. A conversão é determinística para uma dada entrada.

## Compartilhar resultado

Primeiro na leitura (ou abaixo de um erro de análise, que também é uma resposta), o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva depois do `#` o texto de origem como foi colado, a direção e a indentação. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda. Configurações muitas vezes trazem senhas, chaves e nomes internos, então o popover pede que você as leia antes de mandar o link. O texto vai como foi colado: a saída convertida mostra todos os valores. Antes de oferecer um link, o texto é verificado em busca de uma credencial que um padrão define: uma chave privada PEM, uma linha `Authorization` ou `Proxy-Authorization` com qualquer esquema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), seções 11.6.2 e 11.7.2: o valor "consists of credentials"), uma linha `Cookie` ou `Set-Cookie` com valor ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), seções 4.1.1 e 4.2.1), um JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), seção 1), uma senha numa URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), seção 3.2.1: a forma "user:password" "is deprecated"), um access key ID da AWS ou um valor `ENC` do FortiOS; todos lidos em 2026-11-01. Qualquer um deles significa sem link: o popover diz a linha, e você troca o valor por um placeholder e clica de novo. Um valor cujo nome só parece de segredo (uma chave `password:` ou `apiKey`) não impede o link; o popover cita o primeiro para você conferir. Aqui cinco nomes de membro e de chave contam como credencial, porque um padrão define o que eles guardam: `access_token` e `refresh_token` ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), seções 1.4, 1.5 e 5.1: "Access tokens are credentials used to access protected resources"), `id_token` ([OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html), seção 3.1.3.3), `client_secret` ([RFC 7591](https://www.rfc-editor.org/rfc/rfc7591), seção 3.2.1) e `registration_access_token` ([RFC 7592](https://www.rfc-editor.org/rfc/rfc7592), seção 3); todos lidos em 2026-11-01. Com valor, qualquer um deles significa sem link, como no decodificador de OIDC.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** O texto preenche a caixa e as opções são marcadas como você faria, e a página o converte. Uma opção desconhecida faz o link ser ignorado. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
