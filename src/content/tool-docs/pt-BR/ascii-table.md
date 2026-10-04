## O que faz

O ASCII tem 128 códigos, de 0 a 127, e quase sempre a gente precisa de um só de cada vez: o código de um caractere, o caractere por trás de um código, ou o jeito de escrevê-lo num arquivo de configuração, numa string JSON ou numa iRule. O explorador responde a essas perguntas para todos os códigos, e diz com clareza quando aquilo que você tem na mão nem é ASCII.

Ele tem quatro partes:

- **Consulta** lê um código em qualquer notação e mostra tudo sobre ele: os números, os bits, os nomes, para que o código foi definido em 1968 e o que o Linux faz com ele hoje, como escrevê-lo em sete lugares e quais linguagens o contam como espaço em branco.
- **A tabela** dispõe os 128 códigos do jeito que a RFC 20 os desenha, oito colunas por dezesseis linhas, ou como lista. Escolha qualquer código para vê-lo na consulta.
- **Texto em códigos** recebe um texto colado e mostra o código de cada caractere, listando pelo nome tudo o que está fora do ASCII, com o motivo pelo qual pode causar problema.
- **Espaço em branco, comparado** confronta os dez códigos que podem ser espaço em branco com sete definições que discordam sobre eles.

## O que a caixa de consulta lê

| Você digita | Lido como |
|---|---|
| `A` | o próprio caractere (entre aspas, `'A'`, também funciona) |
| `65` | decimal |
| `0x41`, `41h`, `x41` | hexadecimal |
| `0o101` | octal |
| `1000001`, `00100101` | sete ou oito dígitos binários, lidos como bits |
| `0b1000001` | binário com prefixo |
| `4/1` | coluna/linha da RFC 20: coluna 4, linha 1 |
| `U+0041` | notação Unicode |
| `&#65;`, `&#x41;`, `&excl;` | referências HTML numéricas e nomeadas |
| `%41` | codificação por porcentagem |
| `\x41`, `\101`, `\n`, `A`, `\u{1F600}` | escapes com barra invertida |
| `^A`, `^[`, `^?` | notação de circunflexo |
| `NUL`, `LF`, `line feed`, `Reverse Slant` | abreviações e nomes, da RFC 20, do Unicode 1.0 e do Unicode atual |
| `en dash`, `minus sign` | qualquer nome ou apelido Unicode (comparado de forma flexível: maiúsculas, espaços, sublinhados e hífens internos são ignorados, como manda a regra UAX44-LM2 da UAX #44) |

Sete ou oito dígitos binários sozinhos são lidos como bits, porque é isso que uma sequência de 0 e 1 desse tamanho quase sempre é. Um número decimal mais longo, como `1000`, é lido como decimal e cai fora do ASCII.

## Lendo um código

- **Números.** Decimal, hexadecimal, octal, sete bits e o byte completo. O bit mais alto do byte é 0: a RFC 20 colocou o ASCII de 7 bits "in an 8 bit byte whose high order bit is always 0" (num byte de 8 bits cujo bit mais alto é sempre 0).
- **Coluna/linha.** A RFC 20 dá nome a cada posição por coluna e linha: `K` é `4/11`. A coluna são os bits b7 b6 b5 e a linha são b4 b3 b2 b1, então 4/11 é 100 1011.
- **Inverta um bit.** Cada um dos sete bits é um botão que o inverte e salta para o resultado. Dois deles explicam quase toda a tabela: o b6 (32) é a única diferença entre maiúsculas e minúsculas, e o b7 (64) separa um controle do caractere com que ele forma par na notação de circunflexo (`A` e `^A`, `[` e `^[`, que é o ESC).
- **Nomes.** O nome Unicode atual, o nome do Unicode 1.0 quando é diferente (`BACKSLASH`, `SPACING UNDERSCORE`), o nome da RFC 20 (`Reverse Slant`, `Underline`, `Overline`) e as alternativas. Controles não têm nome Unicode nenhum: a propriedade Name deles é vazia, e eles são nomeados por apelidos formais tirados da ISO 6429 (`LINE FEED`, `NEW LINE`, `END OF LINE`, abreviados `LF`, `NL`, `EOL`). A tabela da RFC 20 chama o código 25 de `EM`; a primeira abreviação do Unicode para ele é `EOM`.
- **Categoria e classe.** A General_Category do Unicode Character Database e, para os controles, a classe da RFC 20: controle de comunicação (CC), efetuador de formato (FE) ou separador de informação (IS).
- **Notas.** A nota 3 da RFC 20 marca onze posições (`#` `@` `[` `\` `]` `^` `` ` `` `{` `|` `}` `~`) que não deveriam ser usadas em intercâmbio internacional sem combinar antes; a nota 4 deixa o símbolo da libra esterlina ocupar o lugar do `#`.
- **Para que servia, e o que faz hoje.** Para cada controle, um resumo da definição da RFC 20 e, quando o Linux lhe dá uma função, essa função: Ctrl-C (ETX) interrompe, Ctrl-D (EOT) encerra a entrada, Ctrl-S e Ctrl-Q (DC3, DC1) param e retomam a saída, Ctrl-Z (SUB) suspende, e o ESC inicia uma sequência de escape no console do Linux. Isso vem das páginas de manual do Linux termios(3) e console_codes(4).
- **Como escrevê-lo.** A forma num literal de string em C, JSON, JavaScript, Python e Tcl (iRules), as referências HTML e a forma em URL com a sua classe na RFC 3986. Uma nota curta aparece quando uma linguagem tem uma armadilha (abaixo).
- **Espaço em branco?** Sim ou não para cada uma das sete definições.
- **Relações.** Notação de circunflexo, a outra caixa, o valor de um dígito e os caracteres ASCII que a UTS #39 considera confundíveis com ele (`1`, `I`, `l` e `|` têm o mesmo protótipo; `0` e `O`, outro).

## As armadilhas que os escapes evitam

- **Escapes hexadecimais em C não param depois de dois dígitos.** `"\x1Bfoo"` continua lendo dígitos hexadecimais, então a ferramenta escreve os controles em C em octal (`\033`), que para em três dígitos.
- **O Tcl 8.4, e portanto as iRules, guarda só os dois últimos dígitos hexadecimais de `\x`.** `"\x1Bfoo"` lê `\x1Bf` e guarda `Bf`: o resultado é o byte 0xBF seguido de `oo`, não ESC e `foo`. A ferramenta também escreve os controles em Tcl em octal. Isso foi executado no Tcl 8.4.6.
- **O JSON exige escape para aspas, barra invertida e os controles de 0 a 31**, e pode deixar o DEL como está (RFC 8259, seção 7).
- **O `\0` do JavaScript só significa NUL quando nenhum dígito vem depois.**
- **O HTML transforma `&#0;` em U+FFFD**, o caractere de substituição, e trata referências à maioria dos controles como erros de análise (o analisador do WHATWG).

## Quando não é ASCII

Um valor acima de 127 é nomeado, com o número de bytes que precisa em UTF-8 e o tipo de problema que pode causar: invisível, um espaço que não é o espaço ASCII, uma aspa tipográfica, um traço que não é o hífen-menos, ou um caractere cuja forma de compatibilidade é ASCII. Quando a UTS #39 o lista como confundível com um texto ASCII, a ferramenta diz com qual, e oferece o caractere ASCII que você provavelmente queria.

Dois casos são comuns o bastante para virar atalhos. `&minus;` é U+2212 MINUS SIGN e `&tilde;` é U+02DC SMALL TILDE: nenhum dos dois é ASCII, e o hífen-menos (45) e o til (126) do ASCII não têm referência nomeada nenhuma. Escreva `&#45;` e `&#126;`, ou os próprios caracteres. Algumas tabelas ASCII publicadas põem `&minus;` e `&tilde;` ao lado de 45 e 126; a lista de referências nomeadas do WHATWG não.

Para todas as propriedades de um ponto de código fora do ASCII, o resultado leva ao [inspetor Unicode](/tools/unicode-inspector).

## A caixa de texto

Cole uma linha de configuração, de uma iRule ou de um e-mail. Cada caractere aparece numa célula com o seu código (hexadecimal para ASCII, o ponto de código para o resto), e tudo o que está fora do ASCII é listado com a posição, os bytes UTF-8, o nome e o motivo pelo qual pode causar problema. São lidos até 2.000 caracteres.

## Como foi verificado

Todos os escapes, referências e respostas de espaço em branco dos 128 códigos foram executados nas implementações reais em 2026-10-03, e todos batem com a ferramenta: literais de string em CPython 3.11, Node 22, GCC (C11) e Tcl 8.4.6; referências HTML (decimais, hexadecimais e nomeadas) no Chromium; espaço em branco com o `isspace()` do C, o `str.isspace()` do Python, o `\s` e o `trim()` do JavaScript, um analisador JSON estrito, o analisador de comandos do Tcl 8.4.6 e a divisão do próprio DOM em espaço em branco ASCII. Cada célula da tabela de códigos da RFC 20 foi comparada com os dados da ferramenta. Os nomes Unicode foram conferidos com o arquivo de dados do Unicode 18.0.0 para cada um dos 1.114.112 pontos de código.

## Limites

- ASCII aqui é o código de 7 bits. Os códigos de 128 a 255 pertencem ao conjunto de caracteres de 8 bits que cada sistema usa (Latin-1, Windows-1252, uma página de código do DOS); o explorador não adivinha qual.
- O comportamento de terminal é o do Linux, tirado das suas páginas de manual. Outros sistemas podem atribuir as teclas de controle de outro jeito.
- A caixa de consulta lê um valor de cada vez. Para texto, use a caixa de texto ou o [inspetor Unicode](/tools/unicode-inspector).

## Fontes

- [RFC 20: ASCII format for Network Interchange (1969), que reproduz a USAS X3.4-1968](https://www.rfc-editor.org/rfc/rfc20) (lido em 2026-10-03)
- [Unicode Character Database 18.0.0: UnicodeData.txt](https://www.unicode.org/Public/18.0.0/ucd/UnicodeData.txt) (lido em 2026-10-03)
- [Unicode Character Database 18.0.0: NameAliases.txt](https://www.unicode.org/Public/18.0.0/ucd/NameAliases.txt) (lido em 2026-10-03)
- [Unicode Character Database 18.0.0: DerivedName.txt](https://www.unicode.org/Public/18.0.0/ucd/extracted/DerivedName.txt) (lido em 2026-10-03)
- [The Unicode Standard 18.0.0, capítulo 4: Character Properties (a propriedade Name)](https://www.unicode.org/versions/Unicode18.0.0/core-spec/chapter-4/) (lido em 2026-10-03)
- [UAX #44: Unicode Character Database (UAX44-LM2, valores de General_Category)](https://www.unicode.org/reports/tr44/) (lido em 2026-10-03)
- [UTS #39: Unicode Security Mechanisms, confusables.txt 18.0.0](https://www.unicode.org/Public/18.0.0/security/confusables.txt) (lido em 2026-10-03)
- [WHATWG HTML: referências de caractere nomeadas (entities.json)](https://html.spec.whatwg.org/entities.json) (lido em 2026-10-03)
- [WHATWG HTML: análise (estado final da referência numérica de caractere)](https://html.spec.whatwg.org/multipage/parsing.html) (lido em 2026-10-03)
- [WHATWG Infra: espaço em branco ASCII](https://infra.spec.whatwg.org/) (lido em 2026-10-03)
- [ISO/IEC 9899:2011, rascunho do comitê N1570 (C11)](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf) (lido em 2026-10-03)
- [RFC 8259: JSON](https://www.rfc-editor.org/rfc/rfc8259) (lido em 2026-10-03)
- [ECMA-262: ECMAScript Language Specification](https://tc39.es/ecma262/) (lido em 2026-10-03)
- [The Python Language Reference: Lexical analysis](https://docs.python.org/3/reference/lexical_analysis.html) (lido em 2026-10-03)
- [Manual do Tcl 8.4: Tcl (substituição por barra invertida)](https://www.tcl-lang.org/man/tcl8.4/TclCmd/Tcl.htm) (lido em 2026-10-03)
- [RFC 3986: URI Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (lido em 2026-10-03)
- [RFC 5234: ABNF (regras básicas)](https://www.rfc-editor.org/rfc/rfc5234) (lido em 2026-10-03)
- [RFC 5321: SMTP (linhas terminam em CR LF)](https://www.rfc-editor.org/rfc/rfc5321) (lido em 2026-10-03)
- [RFC 9112: HTTP/1.1 (formato das mensagens)](https://www.rfc-editor.org/rfc/rfc9112) (lido em 2026-10-03)
- [POSIX.1-2024: Definições (linha, nova linha)](https://pubs.opengroup.org/onlinepubs/9799919799/basedefs/V1_chap03.html) (lido em 2026-10-03)
- [Página de manual do Linux termios(3)](https://man7.org/linux/man-pages/man3/termios.3.html) (lido em 2026-10-03)
- [Página de manual do Linux console_codes(4)](https://man7.org/linux/man-pages/man4/console_codes.4.html) (lido em 2026-10-03)
