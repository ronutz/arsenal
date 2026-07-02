## O que faz

Trabalhe com os dois valores no centro da extensão PKCE do OAuth 2.0. A ferramenta gera um `code_verifier` aleatório e deriva seu `code_challenge` usando o método S256, ou recebe um `code_verifier` que você cola e o confere com as regras de comprimento e de caracteres da RFC 7636, derivando o mesmo challenge que o seu servidor de autorização vai esperar. A derivação é exatamente o passo de SHA-256 e Base64url definido pelo padrão, e tudo roda no seu navegador.

## Contra o que o PKCE protege

O fluxo de código de autorização do OAuth 2.0 envia um código de curta duração de volta pelo navegador do usuário, e em um aplicativo móvel ou de página única esse redirecionamento pode ser interceptado por outro aplicativo. O PKCE, "Proof Key for Code Exchange", fecha essa brecha. No início do fluxo, o cliente inventa um segredo, o `code_verifier`, e envia apenas uma versão transformada dele, o `code_challenge`, com a requisição inicial. Quando mais tarde troca o código por tokens, ele apresenta o `code_verifier` original, e o servidor re-deriva o challenge e confere se corresponde. Um atacante que roube o código não consegue usá-lo, porque nunca viu o verifier.

## O verifier e o challenge

- O **code_verifier** é uma string aleatória de alta entropia, de 43 a 128 caracteres, extraída do conjunto não reservado `A-Z a-z 0-9 - . _ ~`.
- O **code_challenge** é derivado dele. O método recomendado, `S256`, é `BASE64URL(SHA256(ASCII(verifier)))`, a codificação Base64url do resumo SHA-256 do verifier, sem preenchimento. O método `plain`, em que o challenge simplesmente é igual ao verifier, existe para clientes limitados, mas é desencorajado, porque não oferece proteção se o challenge for observado.

## Por que importa agora

O PKCE começou como uma correção para aplicativos móveis, mas agora é o padrão de base. A prática recomendada de segurança atual do OAuth, a RFC 9700, exige PKCE para todo cliente que usa o fluxo de código de autorização, não apenas os públicos. Se você está construindo ou depurando um cliente OAuth, gerar um verifier e confirmar seu challenge S256 aqui permite conferir sua implementação diretamente contra a especificação.

## Como usar

Gere um `code_verifier` novo e leia seu `code_challenge` `S256`, ou cole um verifier existente para validar seu comprimento e seus caracteres e derivar o challenge correspondente. Como o S256 é um hash unidirecional, o challenge não revela nada sobre o verifier.
