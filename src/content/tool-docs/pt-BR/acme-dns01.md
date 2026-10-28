## O que faz

Calcula o registro TXT exato que você publica para passar em um desafio dns-01 do ACME. Cole o token do desafio e a chave da sua conta ACME, como um JWK ou como seu thumbprint, e a ferramenta retorna o nome do registro `_acme-challenge`, o valor a colocar no registro TXT e os valores intermediários (a autorização de chave e o thumbprint) dos quais ele foi derivado. Tudo roda no seu navegador usando o SHA-256 nativo do Web Crypto; sua chave nunca sai da página, e apenas seus membros públicos são usados.

## Por que o dns-01 existe

O ACME (RFC 8555) automatiza a emissão de certificados desafiando você a provar o controle de um domínio. O desafio dns-01 faz isso por meio do DNS: você publica um registro TXT específico sob o domínio, e a CA o consulta. Ao contrário do http-01, o dns-01 não precisa de nenhuma conexão de entrada até o seu servidor, então funciona atrás de um firewall ou load balancer, e é o único tipo de desafio que pode validar um nome curinga (wildcard).

## O cálculo

O valor do registro não é arbitrário; a CA o recalcula a partir da chave da sua conta, o que é justamente o que amarra o desafio a você. A cadeia tem três passos. Primeiro, calcula-se o thumbprint SHA-256 da chave pública da sua conta na forma canônica definida pela RFC 7638, codificado em base64url. Segundo, a autorização de chave é formada juntando o token e esse thumbprint com um ponto: `token.thumbprint`. Terceiro, o valor do registro TXT é o base64url do digest SHA-256 da autorização de chave. O registro é publicado em `_acme-challenge.<domínio>`; um curinga como `*.example.com` é validado sob `_acme-challenge.example.com`.

## Apenas sua chave pública é usada

O thumbprint da RFC 7638 é calculado somente sobre os membros públicos obrigatórios da chave: para uma chave EC, a curva e as coordenadas x e y; para uma chave RSA, o módulo e o expoente. Sua chave privada nunca é necessária para calcular o registro, então você deve colar apenas o JWK público. Se uma chave completa for colada, seus campos privados são ignorados e nunca exibidos.

## Como usar

Informe o token do desafio e a chave da sua conta e, opcionalmente, o domínio para ver o nome completo do registro. Publique o valor retornado como um registro TXT em `_acme-challenge.<domínio>`, aguarde a propagação e deixe seu cliente ACME continuar. O mesmo token e a mesma chave sempre produzem o mesmo valor, então você pode conferir o que seu cliente está publicando contra o que esta ferramenta calcula.

## Compartilhar resultado

Abaixo do registro, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva três valores depois do `#`: o token do desafio, o thumbprint da chave da conta (o que a página calculou, ou o que você digitou) e o domínio. Ele nunca leva a caixa da chave: um arquivo de chave de conta traz o membro privado `d` junto dos públicos, e o link não leva nenhum deles. O popover dele diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

Nada do que ele leva é segredo. A [RFC 8555](https://www.rfc-editor.org/rfc/rfc8555) (lida em 2026-10-27) diz que a key authorization (o token e o thumbprint unidos por um ponto) é servida em claro em `/.well-known/acme-challenge/<token>` no desafio http-01 (seção 8.3), e o registro do dns-01 prova controle do DNS do domínio, que o link não dá (seção 8.4). A [RFC 7638](https://www.rfc-editor.org/rfc/rfc7638) (seção 3.2.1, lida em 2026-10-27) dá a uma chave privada o thumbprint da chave pública dela, então o link identifica a chave sem carregá-la. A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-10-27) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então os valores não são enviados ao servidor quando o link é aberto; eles ficam na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-los.

- **Ao abrir um link.** O token e o domínio preenchem as caixas deles e o thumbprint vai para a caixa da chave, que aceita um; a página calcula o registro como numa colagem, com Web Crypto no navegador. Um token ou um thumbprint fora do alfabeto base64url que a página exige faz o link inteiro ser ignorado. Nos dois casos os valores saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
- **Prova.** As verificações de compartilhamento do site montam o link a partir de uma chave de conta privada (o exemplo P-256 da RFC 7515, com `d`) e confirmam que nem `d`, nem um membro público, nem o próprio JWK aparecem nele, nem como foram digitados, nem codificados com porcentagem, nem codificados como formulário, nem decodificados.
