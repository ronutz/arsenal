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

## Compartilhar resultado

Abaixo do veredito, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que nunca leva o seu texto. A caixa guarda o que você suspeita ser sensível: números de cartão de pagamento (um PAN, "primary account number", é o "unique payment card number ... that identifies the issuer and the cardholder account", o número do cartão que identifica o emissor e a conta do titular; [glossário do PCI SSC](https://www.pcisecuritystandards.org/glossary/), lido em 2026-11-01), números de CPF e de CNPJ, e as palavras em volta. O que esta página diagnostica é estrutural, então o link leva números substitutos depois do `#`: uma linha por candidato, na ordem da página, cada uma com os separadores e o tamanho do candidato, e dígitos que a página cria (zeros, a posição do candidato na lista, e dígitos verificadores escolhidos para o checksum passar ou falhar exatamente como o do candidato, confirmados pelas mesmas verificações de Luhn e de módulo 11 que a página roda); uma sequência de dígitos repetidos, que não é o número de ninguém, vai como está. O identificador e o limite também vão. Antes de oferecer o link, a página lê os substitutos de novo e precisa chegar ao mesmo diagnóstico (os mesmos candidatos por formato, resultado e motivo, a mesma contagem, o mesmo veredito e os mesmos achados), senão não há link. Um texto sem candidato não ganha link, porque o diagnóstico dele é sobre o próprio texto. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** Os substitutos preenchem a caixa, o identificador e o limite são definidos, e a página avalia; uma nota abaixo do veredito diz que os números são substitutos. Um link cujas linhas não sejam substitutos da própria posição é ignorado. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
