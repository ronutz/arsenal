## O que faz

Lê um script [Expect](/glossary/expect) e o explica apenas a partir do texto: o que inicia (spawn), o que espera e como, o que digita e se um retorno encerra a linha, quando entrega o teclado ao usuário. Os comandos aparecem na ordem do fonte com o seu aninhamento, de modo que os corpos de `expect`, `if`, `foreach`, `while`, `for`, `switch`, `catch` e `proc` também são lidos. Dos pares `expect` e `send` ele reconstrói o diálogo que o script conduz, e relata achados contra vinte regras, cada uma ligada a uma linha e cada uma citando o manual `expect(1)` ou o código-fonte do Expect 5.45.4. O script é analisado com o analisador [Tcl](/glossary/tcl) do site (a sintaxe do Expect é a do Tcl): as regras do Tcl 8.4 mais a expansão de argumentos `{*}` do Tcl 8.5 em diante. Ele nunca é executado: nada é iniciado, nada é enviado.

Para o caminho inverso, de um host, um método de login, um equipamento e uma lista de comandos até um script que passa em todas as verificações abaixo, use o [gerador de scripts Expect](/tools/expect-script-builder). Um arquivo de monitor Scripted do BIG-IP LTM, cujas linhas são só `send` e `expect` e não são Tcl, é lido pelo [explicador de monitor Scripted do BIG-IP](/tools/bigip-scripted-monitor-explainer).

## Como ele lê os argumentos do expect

Os argumentos de `expect`, `expect_user`, `expect_before` e `expect_after` são lidos como o Expect 5.45.4 os lê (`expect.c`), e não como parecem:

- Um único argumento entre chaves só é uma lista de padrões e corpos quando uma quebra de linha vem antes do primeiro caractere que não é espaço. Caso contrário, o bloco inteiro é um argumento só: um único padrão glob. As CAVEATS do manual chamam isso de heurística e oferecem `-brace` para forçar a lista e `-nobrace` para forçar um argumento só; os dois são lidos como tal.
- Uma palavra que começa com `-` é uma opção (flag), pelo nome completo ou por uma abreviação única (`-re` para `-regexp`, `-exa` para `-exact`). `-gl`, `-re`, `-ex` e `--` fazem da palavra seguinte um padrão, seja qual for a sua aparência.
- `eof`, `timeout`, `full_buffer`, `null` e `default` são palavras-chave quando escritas exatamente assim, entre aspas ou não.
- A palavra depois de um padrão é sempre o seu corpo.

## O que verifica

- **E1, um segredo em texto claro (erro):** um literal enviado logo após um prompt que pede senha, ou um literal atribuído a uma variável cujo nome diga senha, segredo ou token. O valor aparece mascarado na saída. Tome segredos da linha de comando (`lindex $argv N`), do ambiente (`$env(NOME)`) ou do usuário (`stty -echo`, `expect_user`).
- **E2, o timeout (aviso ou nota):** `set timeout -1` é um timeout infinito; um `expect` executado antes de qualquer `set timeout` usou o padrão. `expect(1)`: "The default timeout period is 10 seconds but may be set, for example to 30, by the command "set timeout 30". An infinite timeout may be designated by the value -1."
- **E3, um padrão que casa cedo demais (aviso ou nota):** `"*"` e `-re ".*"`, que segundo o `expect(1)` "will flush the output buffer without reading any more output from the process"; prompts de um caractere como `">"`, que casam com o primeiro desses caracteres em qualquer ponto da saída; e `"$"` sozinho, que num padrão glob é a âncora de fim: casa na hora com um buffer vazio e nunca casa com texto já esperando (`exp_glob.c` no 5.45.4, conferido com o `expect` real), de modo que nunca espera um prompt de shell. Uma regexp que seja só `$` ou só `^` também casa na hora. Os padrões não são ancorados; o manual recomenda `$` "if you can exactly describe the characters at the end of a string", então escreva o prompt com o que vem antes dele: `-ex "$ "` ou `-re {\$ $}`.
- **E4, o script termina em um send (aviso):** nada lê a resposta do programa. "Upon exiting, all connections to spawned processes are closed."
- **E5, sem retorno (nota ou aviso):** um `send` cuja cadeia não termina em `\r` nem `\n`; e um `send {...\r}` entre chaves, onde o Tcl não substitui nada, de modo que o programa recebe uma barra invertida e um r. `expect(1)`: "Characters are sent immediately although programs with line-buffered input will not read the characters until a return character is sent. A return character is denoted "\r"."
- **E6, uma nova linha onde se queria um retorno (nota):** a cadeia termina em `\n`.
- **E7, sem tratamento de timeout (nota):** expects com padrões comuns e sem padrão `timeout` (ou `default`). "If no timeout keyword is used, an implicit null action is executed upon timeout", e o script segue como se o padrão tivesse casado.
- **E8, `exp_continue` fora do corpo de um expect (erro).**
- **E9, substituição dentro de um padrão entre aspas (aviso ou nota):** `[colchetes]` rodam como comando e `$nomes` são substituídos antes de o Expect ler o padrão, tanto na forma de uma linha quanto no bloco entre chaves: "In this one case, the usual Tcl substitutions will occur despite the braces."
- **E10, a pergunta da chave do host (nota):** `ssh` iniciado sem `StrictHostKeyChecking=no`, `off` ou `accept-new`, e nenhum padrão respondendo a uma pergunta `(yes/no)`. O padrão do OpenSSH é `ask` (ssh_config(5)).
- **E11, `sleep` (nota):** uma espera fixa onde um `expect` esperaria pelo evento.
- **E12, `log_user 0` nunca seguido de `log_user 1` (nota).**
- **E13, `set timeout` depois do primeiro expect (aviso):** aquele expect rodou com o padrão.
- **E14, nada iniciado (nota).**
- **E15, `stty -echo` nunca seguido de `stty echo` (aviso):** o próprio idioma de leitura de senha do manual restaura o eco assim que a senha foi lida.
- **E16, `close` sem `wait` (nota):** "close does not call wait since there is no guarantee that closing a process connection will cause it to exit."
- **E17, um send antes do primeiro expect (aviso):** "It is a good idea to precede the first send to a process by an expect. expect will wait for the process to start, while send cannot."
- **E18, `set timeout` dentro de um procedimento sem `global timeout` (nota):** "variables written are always in the local scope (unless a "global" command has been issued)", então o valor vale só para os expects daquele procedimento.
- **E19, um bloco entre chaves lido como um só padrão (aviso):** um `expect {...}` cujo primeiro padrão está na mesma linha da chave de abertura, seja o bloco todo numa linha, seja continuando abaixo. O Expect 5.45.4 o lê como um único padrão glob, o texto inteiro do bloco, que a saída quase nunca contém, de modo que nenhum dos braços de dentro roda, nem mesmo o braço `timeout`, e segue a ação nula implícita. Conferido com o `expect` real: um bloco de uma linha, com o texto presente na saída, voltou depois do timeout inteiro sem rodar braço nenhum. Comece o bloco com uma quebra de linha depois da chave, ou escreva `expect -brace {...}`.
- **E20, um padrão lido como opção (erro):** um padrão que começa com `-`, como `"--More--"`, entre aspas, entre chaves ou dentro de um bloco entre chaves. O `expect` lê toda palavra que começa com `-` como opção, então o comando falha com `bad flag` (ou `ambiguous flag`) e o script para. `expect(1)`: "Any pattern beginning with a "-" should be protected" com `-gl`; `-ex` e `--` também o protegem.
- **Sintaxe:** onde o analisador para (uma chave faltando, aspas não fechadas), com a mensagem do próprio Tcl; os comandos anteriores continuam explicados. A expansão de argumentos `{*}` (regra [5] do Tcl(n), Tcl 8.5 em diante) é aceita, e o resumo nomeia as linhas que a usam.

## Como ler a saída

O resumo diz se o Tcl lê o script inteiro, conta os achados, nomeia os programas iniciados, dá o timeout em vigor no primeiro `expect` (a opção `-timeout`, depois um valor definido no mesmo procedimento, depois o `set timeout` do script, senão o padrão) e diz se o script termina em `interact`, espera `eof` ou nunca espera o programa terminar. A tabela do diálogo emparelha cada `expect` sobre o processo com o `send` que o responde; um valor mascarado ali é um segredo que o script digitou em claro, e um bloco inteiro mostrado como um só padrão é a leitura do E19. Os padrões aparecem sob cada `expect` com o seu estilo de casamento (glob por padrão, `-re`, `-ex`, `-nocase`) e as palavras-chave `eof`, `timeout`, `full_buffer`, `null` e `default` com o que cada uma significa.

## Limites

- Os corpos são lidos na ordem do fonte. O explicador não sabe qual ramo uma execução toma, quantas vezes um loop roda ou se um procedimento chega a ser chamado; um `set timeout` dentro de um procedimento que declara `global timeout` é lido onde o procedimento é definido.
- Cadeias e padrões que dependem de uma variável aparecem como escritos (`$env(PW)\r`), não como o seu valor. Uma palavra expandida com `{*}` é lida como uma palavra só, já que quantas palavras ela vira depende do seu valor.
- A detecção de segredos é uma heurística: um literal de uma palavra enviado logo após um prompt de senha, ou guardado em uma variável com nome de senha. Uma senha enviada após um prompt que o script não nomeia como tal não é apanhada.
- `expect_before`, `expect_after` e `expect_user` são explicados, mas não entram no diálogo, pois sozinhos não esperam pelo processo. `interact`, `expect_tty` e `expect_background` leem um argumento único entre chaves com o mesmo teste do `expect`, mas o explicador não lê os seus braços.
- Depois de um E20, o explicador lê a palavra como o padrão que o autor quis escrever; o `expect` real para ali.
- As sequências de barra invertida seguem a leitura do Tcl 8.4: `\x` toma todos os dígitos hexadecimais que vêm depois e `\U` não é uma sequência. No Tcl 8.6 e no 9.0, `\x` toma um ou dois dígitos e `\U` até oito.
- Referências a arrays como `$env(HOME)` são aceitas; o índice é mantido como texto.

## Ferramentas e leituras relacionadas

- **Padrões `-re`.** O expect(1): "Regexp-style patterns follow the syntax defined by Tcl's regexp" (os padrões no estilo regexp seguem a sintaxe definida pelo comando regexp do Tcl). A visão de portabilidade do [Kit de Regex](/tools/regex) lista as construções que se leem de outro jeito nas Advanced Regular Expressions do Tcl do que em JavaScript ou PCRE2.
- **Labs.** Três das regras podem ser testadas nos labs dos artigos do Learn: a substituição dentro de um padrão entre aspas (E9) no [lab de substituição do Tcl](/learn/tcl-for-expect-writers#lab-tcl-substitution), qual padrão vence e quando (E3) no [lab de padrões contra o buffer](/learn/expect-patterns-and-the-buffer#lab-expect-buffer-matching), e o timeout e o braço que roda quando ele vence (E2, E7) no [lab do timeout](/learn/expect-timeouts-eof-and-loops#lab-expect-timeout-timeline).
- **A série.** [Expect contra equipamentos de rede](/learn/expect-against-network-devices) trata de prompts, pagers e privilégio em cinco plataformas, e [Depurar o Expect](/learn/expect-debugging-and-logging), do que o `exp_internal` e um arquivo de log mostram quando um script se comporta mal.

## Fontes

- [expect(1), a página de manual do Expect (Don Libes, NIST; Expect versão 5)](https://www.tcl-lang.org/man/expect5.31/expect.1.html) (lida em 2026-10-05)
- [expect(1), código-fonte do manual do Expect 5.45.4, core.tcl-lang.org](https://core.tcl-lang.org/expect/raw?name=expect.man&ci=expect-5-45-4) (lida em 2026-10-27)
- [expect.c, Expect 5.45.4: exp_one_arg_braced e parse_expect_args](https://core.tcl-lang.org/expect/raw?name=expect.c&ci=expect-5-45-4) (lida em 2026-10-27)
- [exp_glob.c, Expect 5.45.4: o comparador de padrões glob](https://core.tcl-lang.org/expect/raw?name=exp_glob.c&ci=expect-5-45-4) (lida em 2026-10-27)
- [Expect em core.tcl-lang.org: descrição, versão 5.45.4, aviso de manutenção](https://core.tcl-lang.org/expect/index) (lida em 2026-10-27)
- [Manual do Tcl 8.4: Tcl, as regras da linguagem](https://www.tcl-lang.org/man/tcl8.4/TclCmd/Tcl.htm) (lida em 2026-10-27)
- [Manual do Tcl 9.0: Tcl, regra [5], expansão de argumentos](https://www.tcl-lang.org/man/tcl9.0/TclCmd/Tcl.html) (lida em 2026-10-27)
- [Manual do Tcl 8.4: string match, as regras dos padrões glob](https://www.tcl-lang.org/man/tcl8.4/TclCmd/string.htm) (lida em 2026-10-05)
- [OpenSSH ssh_config(5): StrictHostKeyChecking](https://man.openbsd.org/ssh_config.5) (lida em 2026-10-27)
