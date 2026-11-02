## O que faz

Gere UUIDs, ou cole um existente para inspecioná-lo. A geração produz um UUID versão 4 aleatório ou um UUID versão 7 ordenado por tempo, usando a fonte aleatória segura do navegador (`crypto.getRandomValues`). A inspeção recebe qualquer UUID e informa se ele é válido, qual é a sua versão e variante e, para um valor versão 7, o horário de criação embutido nele. Tudo roda no seu navegador.

## O que é um UUID

Um UUID é um identificador de 128 bits, escrito como 32 dígitos hexadecimais no agrupamento familiar 8-4-4-4-12, por exemplo `f47ac10b-58cc-4372-a567-0e02b2c3d479`. Seu propósito é ser único sem uma autoridade central distribuindo números: qualquer parte pode criar um e confiar que ele não vai colidir com o de ninguém. Dois campos fixos codificam sua estrutura: um nibble de versão que diz como o UUID foi feito, e um campo de variante que o marca como um UUID da RFC 4122/9562.

## Versão 4 e versão 7

- **Versão 4** é quase inteiramente aleatória: 122 dos seus 128 bits vêm da fonte aleatória, e os outros 6 são os bits fixos de versão e variante. É o padrão certo quando você só precisa de um id imprevisível e resistente a colisões e não se importa com ordenação.
- **Versão 7** é ordenada por tempo. Seus 48 bits mais significativos são um timestamp em milissegundos Unix, seguidos por 74 bits aleatórios. Como o timestamp fica na frente, os UUIDs versão 7 ordenam-se por ordem de criação, o que os torna muito melhores que a versão 4 como chaves primárias de banco de dados: inserções sequenciais mantêm um índice compacto em vez de espalhar as escritas por ele.

A versão 7 é nova na RFC 9562, a especificação de 2024 que atualizou e tornou obsoleta a RFC 4122 original.

## Como inspecionar um UUID

Cole qualquer UUID e a ferramenta o analisa sem gerar nada: ela confirma o formato, lê a versão e a variante nas suas posições fixas e, para um UUID versão 7, decodifica o timestamp de 48 bits embutido de volta para uma data. Essa última parte é o truque útil: um id versão 7 carrega discretamente o momento em que foi criado, então você pode ler o horário de criação de um registro direto da sua chave.

## Como usar

Gere um UUID v4 ou v7 com um clique, ou cole um UUID existente para ler sua versão, variante e, para v7, seu timestamp. A geração usa a fonte aleatória segura, então os valores v4 são imprevisíveis; a inspeção é uma análise pura e revela apenas o que o próprio UUID codifica.

## Compartilhar resultado

Abaixo da leitura de Inspecionar, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva o valor da caixa Inspecionar depois do `#`. Os UUIDs que você gerou não vão: cada um sai da fonte aleatória do seu navegador, e quem abre o link clica em Gerar para ter os próprios. Um UUID não identifica nada seu. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Ao abrir um link.** O valor preenche a caixa Inspecionar como se tivesse sido colado e a página o lê (um valor que não é UUID aparece como Inválido, como quando digitado). Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
