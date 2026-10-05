## O que faz

Lê um script [Expect](/glossary/expect) e o explica apenas a partir do texto: o que inicia (spawn), o que espera e como, o que digita e se um retorno encerra a linha, quando entrega o teclado ao usuário. Os comandos aparecem na ordem do fonte com o seu aninhamento, de modo que os corpos de `expect`, `if`, `foreach`, `while`, `for`, `switch`, `catch` e `proc` também são lidos. Dos pares `expect` e `send` ele reconstrói o diálogo que o script conduz, e relata achados contra dezoito regras, cada uma ligada a uma linha e cada uma citando o manual `expect(1)`. O script é analisado com o motor [Tcl](/glossary/tcl) 8.4 do site (a sintaxe do Expect é a do Tcl) e nunca executado: nada é iniciado, nada é enviado.

## O que verifica

- **E1, um segredo em texto claro (erro):** um literal enviado logo após um prompt que pede senha, ou um literal atribuído a uma variável cujo nome diga senha, segredo ou token. O valor aparece mascarado na saída. Tome segredos da linha de comando (`lindex $argv N`), do ambiente (`$env(NOME)`) ou do usuário (`stty -echo`, `expect_user`).
- **E2, o timeout (aviso ou nota):** `set timeout -1` é um timeout infinito; um `expect` executado antes de qualquer `set timeout` usou o padrão. `expect(1)`: "The default timeout period is 10 seconds but may be set, for example to 30, by the command "set timeout 30". An infinite timeout may be designated by the value -1."
- **E3, um padrão que casa cedo demais (aviso ou nota):** `"*"` e `-re ".*"`, que segundo o `expect(1)` "will flush the output buffer without reading any more output from the process", e prompts de um só caractere como `">"` ou `"$"`, que casam com o primeiro caractere desses em qualquer ponto da saída. Os padrões não são ancorados; o manual recomenda `$` "if you can exactly describe the characters at the end of a string".
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
- **Sintaxe:** onde o analisador Tcl 8.4 para (uma chave faltando, aspas não fechadas), com a mensagem do próprio Tcl; os comandos anteriores continuam explicados.

## Lendo a saída

O resumo diz se o Tcl lê o script inteiro, conta os achados, nomeia os programas iniciados, dá o timeout em vigor no primeiro `expect` (a opção `-timeout`, depois um valor definido no mesmo procedimento, depois o `set timeout` do script, senão o padrão) e diz se o script termina em `interact`, espera `eof` ou nunca espera o programa terminar. A tabela do diálogo emparelha cada `expect` sobre o processo com o `send` que o responde; um valor mascarado ali é um segredo que o script digitou em claro. Os padrões aparecem sob cada `expect` com o seu estilo de casamento (glob por padrão, `-re`, `-ex`, `-nocase`) e as palavras-chave `eof`, `timeout`, `full_buffer`, `null` e `default` com o que cada uma significa.

## Limites

- Os corpos são lidos na ordem do fonte. O explicador não sabe qual ramo uma execução toma, quantas vezes um laço roda ou se um procedimento chega a ser chamado; um `set timeout` dentro de um procedimento que declara `global timeout` é lido onde o procedimento é definido.
- Cadeias e padrões que dependem de uma variável aparecem como escritos (`$env(PW)\r`), não como o seu valor.
- A detecção de segredos é uma heurística: um literal de uma palavra enviado logo após um prompt de senha, ou guardado em uma variável com nome de senha. Uma senha enviada após um prompt que o script não nomeia como tal não é apanhada.
- `expect_before`, `expect_after` e `expect_user` são explicados, mas não entram no diálogo, pois sozinhos não esperam pelo processo.
- Referências a arrays como `$env(HOME)` são aceitas; o índice é mantido como texto.

## Fontes

- [expect(1), a página de manual do Expect (Don Libes, NIST; Expect versão 5)](https://www.tcl-lang.org/man/expect5.31/expect.1.html) (lida em 2026-10-05)
- [Expect em core.tcl-lang.org: descrição, versão 5.45.4, aviso de manutenção](https://core.tcl-lang.org/expect/index) (lida em 2026-10-05)
- [Manual do Tcl 8.4: Tcl, as regras da linguagem](https://www.tcl-lang.org/man/tcl8.4/TclCmd/Tcl.htm) (lida em 2026-10-05)
- [Manual do Tcl 8.4: string match, as regras dos padrões glob](https://www.tcl-lang.org/man/tcl8.4/TclCmd/string.htm) (lida em 2026-10-05)
- [OpenSSH ssh_config(5): StrictHostKeyChecking](https://man.openbsd.org/ssh_config.5) (lida em 2026-10-05)
