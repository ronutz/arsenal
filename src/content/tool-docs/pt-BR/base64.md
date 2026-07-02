## O que faz

É um códec bidirecional para cinco codificações de texto. Digite um texto e ele retorna, de uma vez, as formas Base64, Base64 seguro para URL, Base32, hexadecimal e codificação porcentual; cole uma string codificada e ele decodifica de volta para texto. A decodificação é tolerante: aceita preenchimento e espaços em branco ausentes, e quando o fluxo de bytes decodificado não é texto UTF-8 válido, o resultado é sinalizado como binário em vez de ser exibido como caracteres corrompidos. Tudo roda no seu navegador; nada é enviado.

## As cinco codificações

Todas mapeiam entre texto (como bytes) e uma representação segura em ASCII, cada uma definida por um padrão:

- **Base64** (RFC 4648, seção 4) usa o alfabeto `A-Z a-z 0-9 + /` e completa com `=`. Aumenta os dados em cerca de um terço e é a codificação por trás das credenciais HTTP Basic, `base64(usuário:senha)`, definida na RFC 7617.
- **Base64 seguro para URL** (RFC 4648, seção 5) troca `+` e `/` por `-` e `_` e geralmente descarta o preenchimento `=`, de modo que a string fica segura dentro de URLs e nomes de arquivo. É a codificação usada em cada segmento de um JWT.
- **Base32** (RFC 4648, seção 6) usa `A-Z 2-7` e completa com `=`. Não diferencia maiúsculas de minúsculas e evita caracteres facilmente confundíveis, por isso aparece em lugares como segredos TOTP.
- **Hexadecimal (Base16)** (RFC 4648, seção 8) usa `0-9 A-F`, dois caracteres por byte.
- **Codificação porcentual** (RFC 3986, seção 2) mantém o conjunto de caracteres não reservados (`A-Z a-z 0-9 - . _ ~`) como está e codifica todos os outros bytes como `%XX`. É a codificação de URL.

## Preenchimento, espaços e resultados binários

Base64 e Base32 normalmente são preenchidos com `=` até um número inteiro de blocos, mas strings do mundo real frequentemente chegam sem o preenchimento ou com quebras de linha inseridas, então o decodificador aceita ambos. Quando você decodifica um valor cujos bytes não formam texto UTF-8 válido (um blob comprimido, uma imagem, uma chave bruta), a ferramenta avisa que o resultado é binário em vez de exibi-lo como texto corrompido, para que você saiba que a decodificação funcionou mesmo que o conteúdo não seja legível.

## Exemplos

- O texto `hello` vira Base64 `aGVsbG8=`, Base64 seguro para URL `aGVsbG8`, Base32 `NBSWY3DP`, hex `68656c6c6f` e codificação porcentual `hello` (todos os seus caracteres são não reservados).
- Decodificar o valor Base64 `dXNlcjpwYXNz`, uma credencial HTTP Basic típica, retorna `user:pass`.

## Como usar

Digite um texto para ver as cinco codificações lado a lado, ou cole um valor codificado para decodificá-lo. Como o códec é uma função pura da entrada, o mesmo texto sempre produz o mesmo resultado.
