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

## Compartilhar resultado

Abaixo da saída, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva depois do `#` o texto da caixa como você digitou, com a direção, o códec e o número de camadas quando eles diferem do padrão (Codificar, Base64, uma camada): `/tools/base64#text=dXNlcjpwYXNz&direction=decode`. O popover dele diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

Texto codificado costuma esconder uma credencial: o HTTP Basic manda `usuário:senha` em Base64 ([RFC 7617](https://www.rfc-editor.org/rfc/rfc7617), seção 2, lida em 2026-10-27). Por isso o popover traz uma linha de cuidado desta ferramenta antes de você copiar qualquer coisa. A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-10-27) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o texto não é enviado ao servidor quando o link é aberto; ele fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** A direção, o códec e as camadas são escolhidos e o texto preenche a caixa como se tivesse sido colado; a página calcula todas as codificações como sempre. Uma direção ou um códec que a página não oferece, ou camadas fora de 1 a 3, fazem o link inteiro ser ignorado. Nos dois casos os valores saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
- **Links de outras páginas.** Um valor passado como `#input=` continua preenchendo a caixa exatamente como antes. Compartilhar resultado usa nomes próprios (`text`, `direction`, `codec`, `layers`), então os dois nunca se misturam.
