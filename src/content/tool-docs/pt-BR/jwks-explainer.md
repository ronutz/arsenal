## O que faz

Cole um JSON Web Key Set e a ferramenta o detalha chave por chave: para cada chave, ela lê o tipo, o id da chave, o uso e o algoritmo pretendidos e os parâmetros específicos daquele tipo, e sinaliza qualquer chave que contenha material privado. Se você também colar um JWT, ela corresponde o token à chave que deveria verificá-lo comparando os ids de chave. Nada sai do seu navegador.

## O que é um JWKS

Um JSON Web Key Set (JWKS) é o documento JSON que um provedor de identidade publica, geralmente em `/.well-known/jwks.json`, para que qualquer um possa verificar os tokens que ele assina sem um segredo compartilhado. É simplesmente uma lista de chaves:

    { "keys": [ {JWK}, {JWK}, ... ] }

Cada entrada é um JSON Web Key (JWK) que descreve uma chave: seu tipo (`kty`, como RSA, EC ou OKP), um id de chave opcional (`kid`), para que ela serve (`use`, tipicamente `sig` para assinatura ou `enc` para criptografia), o algoritmo ao qual ela se associa (`alg`) e os parâmetros específicos daquele tipo de chave.

## Material público e privado

Essa distinção é o ponto de segurança da ferramenta. Um JWKS publicado para verificação deve conter apenas chaves públicas. Cada tipo de chave tem parâmetros públicos e privados: uma chave RSA publica seu módulo e expoente (`n`, `e`) e mantém em segredo seu expoente privado (`d`); uma chave de curva elíptica publica suas coordenadas (`x`, `y`) e mantém em segredo seu escalar privado (`d`); uma chave simétrica (`oct`) nada mais é que o segredo (`k`). Se uma chave no conjunto carregar qualquer um dos campos privados, significa que material de chave privada foi exposto, o que é um erro sério, então a ferramenta o sinaliza explicitamente.

## Correspondência de um token à sua chave

Um JWT assinado normalmente indica, em seu cabeçalho, o id de chave (`kid`) da chave que o assinou. Um verificador procura no JWKS a chave com aquele `kid` e a utiliza. A ferramenta faz o mesmo: dados um JWT e um conjunto, ela encontra a chave cujo `kid` corresponde ao do token, que é exatamente a busca que um verificador real realiza antes de checar a assinatura. Os parâmetros de chave seguem a RFC 7517 e a RFC 7518, com o tipo de chave OKP para chaves de curva de Edwards (como Ed25519) definido na RFC 8037.

## Como usar

Cole um JWKS para inspecionar cada chave e detectar qualquer material privado exposto, e opcionalmente cole um JWT para ver qual chave do conjunto é a destinada a verificá-lo.
