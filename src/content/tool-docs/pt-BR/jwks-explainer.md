## O que faz

Cole um JSON Web Key Set e a ferramenta o detalha chave por chave: para cada chave, ela lê o tipo, o id da chave, o uso e o algoritmo pretendidos e os parâmetros específicos daquele tipo, e sinaliza qualquer chave que contenha material privado. Se você também colar um JWT, ela corresponde o token à chave que deveria verificá-lo comparando os ids de chave. Nada sai do seu navegador.

## O que é um JWKS

Um JSON Web Key Set (JWKS) é o documento JSON que um provedor de identidade publica, geralmente em `/.well-known/jwks.json`, para que qualquer um possa verificar os tokens que ele assina sem um segredo compartilhado. É simplesmente uma lista de chaves:

    { "keys": [ {JWK}, {JWK}, ... ] }

Cada entrada é um JSON Web Key (JWK) que descreve uma chave: seu tipo (`kty`, como RSA, EC ou OKP), um id de chave opcional (`kid`), para que ela serve (`use`, tipicamente `sig` para assinatura ou `enc` para criptografia), o algoritmo ao qual ela se associa (`alg`) e os parâmetros específicos daquele tipo de chave.

## Material público e privado

Essa distinção é o ponto de segurança da ferramenta. Um JWKS publicado para verificação deve conter apenas chaves públicas. Cada tipo de chave tem parâmetros públicos e privados: uma chave RSA publica seu módulo e expoente (`n`, `e`) e mantém em segredo seu expoente privado (`d`); uma chave de curva elíptica publica suas coordenadas (`x`, `y`) e mantém em segredo seu escalar privado (`d`); uma chave simétrica (`oct`) nada mais é que o segredo (`k`). Se uma chave no conjunto carregar qualquer um dos campos privados, significa que material de chave privada foi exposto, o que é um erro sério, então a ferramenta o sinaliza explicitamente.

## Correspondência de um token à sua chave

Um JWT assinado normalmente indica, em seu header, o id de chave (`kid`) da chave que o assinou. Um verificador procura no JWKS a chave com aquele `kid` e a utiliza. A ferramenta faz o mesmo: dados um JWT e um conjunto, ela encontra a chave cujo `kid` corresponde ao do token, que é exatamente a busca que um verificador real realiza antes de checar a assinatura. Os parâmetros de chave seguem a RFC 7517 e a RFC 7518, com o tipo de chave OKP para chaves de curva de Edwards (como Ed25519) definido na RFC 8037.

## Como usar

Cole um JWKS para inspecionar cada chave e detectar qualquer material privado exposto, e opcionalmente cole um JWT para ver qual chave do conjunto é a destinada a verificá-lo.

## Compartilhar resultado

Abaixo do resumo das chaves (no modo de correspondência, abaixo da correspondência), o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva uma cópia do JWKS depois do `#`: cada valor privado trocado por `[redacted]`, todo o resto como você colou. O popover dele diz primeiro o que o link leva e quantos valores foram trocados e depois oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

Um JWKS colado pode trazer material de chave privada, que um link nunca pode levar. A [RFC 7518](https://www.rfc-editor.org/rfc/rfc7518) (lida em 2026-11-01) define os membros `d`, `p`, `q`, `dp`, `dq`, `qi` e `oth` de uma chave privada RSA (seção 6.3.2, com o `r`, o `d` e o `t` de cada item de `oth`), o `d` de uma chave privada de curva elíptica (seção 6.2.2) e o `k` de uma chave simétrica (seção 6.4.1); a [RFC 8037](https://www.rfc-editor.org/rfc/rfc8037) (seção 2, lida em 2026-11-01) dá a uma chave OKP um `d` privado. A cópia mantém os nomes dos membros e troca só os valores, então a página que a abre aponta o mesmo material privado e explica cada chave exatamente como a sua explicou: esta página nunca mostra esses valores. As verificações do site garantem isso com as chaves privadas dos Apêndices A.2 e A.3 da RFC 7517 e do Apêndice A.1 da RFC 8037, entre outras.

No modo de correspondência o link também leva o header do JWT, e nada mais do token: a página só lê o header, e um JWT é uma credencial bearer enquanto vale ([RFC 6750](https://www.rfc-editor.org/rfc/rfc6750), seção 1.2, lida em 2026-11-01). Uma caixa de JWT cujo primeiro segmento não seja um header JSON não leva nada, então um access token opaco nunca vai no lugar dele; um header cujo membro `jwk` traz material de chave privada não ganha link.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então os valores não são enviados ao servidor quando o link é aberto; eles ficam na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-los.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho dele.
- **Ao abrir um link.** A cópia preenche a caixa do JWKS, o modo de correspondência abre quando o link pede e o header preenche a caixa do JWT; a página explica e faz a correspondência como numa colagem, e nunca busca um `jwks_uri`. Um JWKS que não passa na análise ou ainda traz um valor privado, um modo que a página não oferece, ou um header que seja mais que um header, faz o link inteiro ser ignorado. Nos dois casos os valores saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
