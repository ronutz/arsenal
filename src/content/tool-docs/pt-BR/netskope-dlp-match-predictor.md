## O que esta ferramenta faz

Ela responde por que uma regra de DLP disparou, ou não, separando três coisas que costumam ser reunidas numa só — e que falham separadamente:

1. **Candidatos** — quantas cadeias têm o formato certo
2. **Correspondências** — quantas delas passam no checksum
3. **Limiar** — se essa contagem atinge o que a regra exige

Uma regra que não disparou falhou em exatamente um desses pontos, e saber qual diz o que mudar.

## Por que o checksum importa mais que o padrão

Um identificador de dados predefinido não é uma expressão regular. Uma cadeia de dezesseis dígitos é um *candidato*; se ela conta como correspondência depende de aritmética.

Esse único fato explica a maioria das discussões sobre ajuste de DLP. **"Marcou um número de pedido de compra"** costuma ser um número que por acaso passa no Luhn. **"Deixou passar um cartão real"** costuma ser um com dígito trocado, que falha no Luhn e portanto não é um cartão do ponto de vista do motor. Nenhuma das queixas se resolve discutindo o padrão.

## Os identificadores

**Cartão de pagamento** — o algoritmo de Luhn, como especificado para números de cartão. Note que cartões válidos têm de treze a dezenove dígitos, então regras escritas em torno de dezesseis perdem o resto.

**CPF e CNPJ** — os identificadores brasileiros, cada um com dois dígitos verificadores mod-11. Sequências de dígitos repetidos como `111.111.111-11` satisfazem a aritmética mas nunca são emitidas, então são rejeitadas.

Esses três estão aqui porque sua validação é um algoritmo público e inequívoco. Um identificador cujas regras não são públicas não pode ser modelado com honestidade.

## Privacidade

Tudo permanece no seu navegador. Nada do que você cola é transmitido, armazenado ou registrado — o que importa mais aqui do que na maioria das ferramentas, porque a ideia é justamente colar conteúdo que você suspeita ser sensível.

## Limites honestos

**Este não é o motor da Netskope.** Ele modela o passo do checksum, que é o que surpreende as pessoas. Palavras-chave por proximidade, dicionários, impressão digital de documentos, correspondência exata de dados, OCR e detecção de tipo de arquivo estão todos fora de escopo, e nenhum deles é aproximado.

A detecção de formato aqui é deliberadamente simples, então zero candidatos significa *esta ferramenta não achou nenhum*, não *a plataforma não acharia nenhum*. E ela conta um número repetido uma vez; se determinada plataforma conta ocorrências ou valores distintos muda o comportamento do limiar, e isso é configuração que ela não modela.
