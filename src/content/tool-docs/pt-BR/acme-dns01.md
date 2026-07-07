## O que faz

Calcula o registro TXT exato que você publica para passar em um desafio dns-01 do ACME. Cole o token do desafio e a chave da sua conta ACME, como um JWK ou como seu thumbprint, e a ferramenta retorna o nome do registro `_acme-challenge`, o valor a colocar no registro TXT e os valores intermediários (a autorização de chave e o thumbprint) dos quais ele foi derivado. Tudo roda no seu navegador usando o SHA-256 nativo do Web Crypto; sua chave nunca sai da página, e apenas seus membros públicos são usados.

## Por que o dns-01 existe

O ACME (RFC 8555) automatiza a emissão de certificados desafiando você a provar o controle de um domínio. O desafio dns-01 faz isso por meio do DNS: você publica um registro TXT específico sob o domínio, e a CA o consulta. Ao contrário do http-01, o dns-01 não precisa de nenhuma conexão de entrada até o seu servidor, então funciona atrás de um firewall ou balanceador de carga, e é o único tipo de desafio que pode validar um nome curinga (wildcard).

## O cálculo

O valor do registro não é arbitrário; a CA o recalcula a partir da chave da sua conta, o que é justamente o que amarra o desafio a você. A cadeia tem três passos. Primeiro, calcula-se o thumbprint SHA-256 da chave pública da sua conta na forma canônica definida pela RFC 7638, codificado em base64url. Segundo, a autorização de chave é formada juntando o token e esse thumbprint com um ponto: `token.thumbprint`. Terceiro, o valor do registro TXT é o base64url do digest SHA-256 da autorização de chave. O registro é publicado em `_acme-challenge.<domínio>`; um curinga como `*.example.com` é validado sob `_acme-challenge.example.com`.

## Apenas sua chave pública é usada

O thumbprint da RFC 7638 é calculado somente sobre os membros públicos obrigatórios da chave: para uma chave EC, a curva e as coordenadas x e y; para uma chave RSA, o módulo e o expoente. Sua chave privada nunca é necessária para calcular o registro, então você deve colar apenas o JWK público. Se uma chave completa for colada, seus campos privados são ignorados e nunca exibidos.

## Usando

Informe o token do desafio e a chave da sua conta e, opcionalmente, o domínio para ver o nome completo do registro. Publique o valor retornado como um registro TXT em `_acme-challenge.<domínio>`, aguarde a propagação e deixe seu cliente ACME continuar. O mesmo token e a mesma chave sempre produzem o mesmo valor, então você pode conferir o que seu cliente está publicando contra o que esta ferramenta calcula.
