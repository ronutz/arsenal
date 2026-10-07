## O que faz

Lê um modo de arquivo escrito de qualquer uma das três formas em que as pessoas o escrevem e devolve todas as outras, com a leitura. As três formas:

- **Octal**, de um a cinco dígitos: `755`, `0644`, `4755`, `02775`, `00755`. O quarto dígito a contar da direita são os bits especiais (4 set-user-ID, 2 set-group-ID, 1 exclusão restrita ou sticky); os três à direita dele são dono, grupo e outros, cada um a soma de leitura 4, escrita 2 e execução 1.
- **Uma string do ls**, de nove caracteres ou dez com a letra de tipo: `rwxr-xr-x`, `-rwsr-xr-x`, `drwxrwxrwt`, `rwSr--r--`. Um `d` inicial define o tipo como diretório.
- **Cláusulas do chmod** aplicadas a um modo base sob um umask: `u+x,go-w`, `a=rX`, `g+s,o-rwx`, `=755`. A base é 644 para arquivo e 755 para diretório, salvo se você der uma; o umask é 022, salvo se você der um.

Para o modo lido, a página mostra os quatro dígitos octais e a string de dez caracteres do ls, os doze bits numa grade em que se clica para inverter, a leitura em palavras por classe (o que o dono, o grupo e os outros podem fazer, redigida para um arquivo ou para um diretório), os três bits especiais com o que cada um significa para esse tipo, as combinações que merecem uma segunda olhada, os comandos chmod que chegam ao modo (octal absoluto, simbólico absoluto e a mudança mínima a partir da base), o umask que criaria o modo a partir do padrão de um programa e, para cláusulas, um rastro do modo depois de cada uma.

## As regras que segue

- **A gramática simbólica é a do POSIX.** Classes `u`, `g`, `o` e `a`; operadores `+`, `-`, `=`; permissões `r`, `w`, `x`, `X`, `s`, `t`; ou uma classe de onde copiar, `u`, `g` ou `o`. Várias ações podem seguir uma lista de classes (`u+r-w`), e as cláusulas são separadas por vírgula.
- **`X`** liga a execução "se o arquivo é um diretório ou se os bits de modo atuais têm pelo menos um dos bits de execução ligado" (chmod do POSIX). Num arquivo comum sem bit de execução, `a+X` não muda nada, e o rastro diz isso.
- **`=`** primeiro limpa os bits das classes nomeadas (todos os doze quando nenhuma classe é nomeada) e depois liga as permissões dadas. `o=` sem nada depois limpa os bits dos outros.
- **Nenhuma classe nomeada** significa as três, "mas bits ligados no umask não são afetados" para `+` e `-` (chmod(1)); a calculadora aplica o umask que você der, 022 por padrão, e anota quando mascarou algo.
- **`s`** segue a classe: com `u` é set-user-ID, com `g` é set-group-ID, só com `o` não muda nada (POSIX). **`t`** é a flag de exclusão restrita, aplicada seja qual for a classe nomeada, como o chmod do GNU faz.
- **As letras do ls são as do POSIX.** `s` onde set-user-ID ou set-group-ID está ligado e a classe pode executar, `S` quando não pode; `t` onde a flag de exclusão restrita está ligada e os outros podem pesquisar, `T` quando não podem.
- **Regra do GNU para diretórios.** Quando a base é um diretório, um modo numérico de até quatro dígitos preserva os bits set-user-ID e set-group-ID da base, como o chmod(1) declara: "para diretórios o chmod preserva os bits set-user-ID e set-group-ID a menos que você especifique explicitamente o contrário". Escrever `00755`, `-6000` ou `=755` os limpa, e o rastro nomeia a regra quando ela se aplicou.
- **Modos numéricos com operador** (`=755`, `+111`, `-022`) são lidos como o GNU os lê: definir exatamente, acrescentar, remover.

## Como ler os bits especiais

| Bit | Valor | Num arquivo | Num diretório |
|---|---|---|---|
| set-user-ID | 4000 | o processo roda com o ID de usuário efetivo do dono | sem significado portável |
| set-group-ID | 2000 | o processo roda com o grupo do arquivo | as novas entradas recebem o grupo do diretório (maioria dos sistemas) |
| exclusão restrita ou sticky | 1000 | sem significado portável hoje; alguns sistemas antigos mantinham o texto do programa no swap | só o dono da entrada, o dono do diretório ou um usuário privilegiado pode removê-la ou renomeá-la |

As letras maiúsculas são as que merecem atenção: `S` significa que o bit especial está ligado mas o bit de execução correspondente não, por isso o bit não faz nada até que a execução seja concedida; `T` significa que a flag de exclusão restrita está ligada num diretório que os outros não podem pesquisar.

## A linha do umask

Um programa que cria um arquivo pede 666 e um que cria um diretório pede 777; o kernel limpa os bits ligados no umask do processo. Por isso a calculadora consegue dizer que umask cria o modo digitado, e quando nenhum consegue: um modo de arquivo com bit de execução nunca é produzido só pela criação, e os bits especiais nunca vêm de um umask.

## Limites

- A calculadora conhece os doze bits do modo, não o sistema de arquivos. Ela não vê propriedade, listas de controle de acesso, capabilities, opções de montagem, atributos de imutabilidade nem controle de acesso mandatório, qualquer um dos quais pode se sobrepor ao que os bits dizem.
- Os comportamentos específicos do GNU são modelados como o chmod(1) do coreutils 9.11 os descreve. Outras implementações podem tratar um modo numérico num diretório, ou `=755`, de forma diferente.
- Se limpar todos os bits de execução também limpa set-user-ID e set-group-ID é definido pela implementação (chmod do POSIX); a calculadora não os limpa por conta própria.
- Todo campo é cortado em 64 caracteres.

## Fontes

- [POSIX.1-2024 (IEEE Std 1003.1-2024): chmod](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/chmod.html) (lido em 2026-10-03)
- [POSIX.1-2024 (IEEE Std 1003.1-2024): ls](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/ls.html) (lido em 2026-10-03)
- [Manual do GNU coreutils: Mode Structure](https://www.gnu.org/software/coreutils/manual/html_node/Mode-Structure.html) (lido em 2026-10-03)
- [chmod(1), GNU coreutils 9.11, man7.org](https://man7.org/linux/man-pages/man1/chmod.1.html) (lido em 2026-10-03)
