## O que faz

Gere UUIDs, ou cole um existente para inspecioná-lo. A geração produz um UUID versão 4 aleatório ou um UUID versão 7 ordenado por tempo, usando a fonte aleatória segura do navegador (`crypto.getRandomValues`). A inspeção recebe qualquer UUID e informa se ele é válido, qual é a sua versão e variante e, para um valor versão 7, o horário de criação embutido nele. Tudo roda no seu navegador.

## O que é um UUID

Um UUID é um identificador de 128 bits, escrito como 32 dígitos hexadecimais no agrupamento familiar 8-4-4-4-12, por exemplo `f47ac10b-58cc-4372-a567-0e02b2c3d479`. Seu propósito é ser único sem uma autoridade central distribuindo números: qualquer parte pode criar um e confiar que ele não vai colidir com o de ninguém. Dois campos fixos codificam sua estrutura: um nibble de versão que diz como o UUID foi feito, e um campo de variante que o marca como um UUID da RFC 4122/9562.

## Versão 4 e versão 7

- **Versão 4** é quase inteiramente aleatória: 122 dos seus 128 bits vêm da fonte aleatória, e os outros 6 são os bits fixos de versão e variante. É o padrão certo quando você só precisa de um id imprevisível e resistente a colisões e não se importa com ordenação.
- **Versão 7** é ordenada por tempo. Seus 48 bits mais significativos são um carimbo de tempo em milissegundos Unix, seguidos por 74 bits aleatórios. Como o carimbo de tempo fica na frente, os UUIDs versão 7 ordenam-se por ordem de criação, o que os torna muito melhores que a versão 4 como chaves primárias de banco de dados: inserções sequenciais mantêm um índice compacto em vez de espalhar as escritas por ele.

A versão 7 é nova na RFC 9562, a especificação de 2024 que atualizou e tornou obsoleta a RFC 4122 original.

## Inspecionando um UUID

Cole qualquer UUID e a ferramenta o analisa sem gerar nada: ela confirma o formato, lê a versão e a variante nas suas posições fixas e, para um UUID versão 7, decodifica o carimbo de tempo de 48 bits embutido de volta para uma data. Essa última parte é o truque útil: um id versão 7 carrega discretamente o momento em que foi criado, então você pode ler o horário de criação de um registro direto da sua chave.

## Como usar

Gere um UUID v4 ou v7 com um clique, ou cole um UUID existente para ler sua versão, variante e, para v7, seu carimbo de tempo. A geração usa a fonte aleatória segura, então os valores v4 são imprevisíveis; a inspeção é uma análise pura e revela apenas o que o próprio UUID codifica.
