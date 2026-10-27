## O que faz

Escreve um script [Expect](/glossary/expect) completo a partir de poucas escolhas: como conectar (ssh, telnet ou outro programa, como um cliente de console serial), o host e o usuário, como o login é autenticado, um perfil de equipamento, os comandos, os timeouts e para onde vai a saída. O script faz login, eleva o privilégio quando você pede, cuida da paginação, roda os comandos um de cada vez e sai. Por padrão ele não muda nada no equipamento: onde desligar a paginação seria uma mudança de configuração global, ele responde ao pager, e mudar a configuração é uma escolha explícita que vem com a sua restauração. Nada é executado e nada sai do navegador: você copia ou baixa o script e o roda por conta própria.

Todo script que ele pode escrever passa pelo [explicador de scripts Expect](/tools/expect-script-explainer) sem nenhum erro e sem nenhum aviso, e a página roda o explicador sobre o script enquanto você o monta. Os golden vectors da ferramenta conferem essa promessa para toda classe de combinação de escolhas, mais de duas mil. As notas que o explicador ainda pode mostrar são de propósito: E5 no único Espaço que responde a um prompt `--More--`, e E12 num script que escreve só num arquivo de log.

## Segredos: nunca no script

- **Uma chave ssh.** O ssh roda com `BatchMode=yes`, que, nas palavras do ssh_config(5), desliga "user interaction such as password prompts and host key confirmation requests", para scripts e outros trabalhos em lote. A chave precisa funcionar sozinha: carregue-a no `ssh-agent` ou informe um arquivo de chave (`-i`, com `IdentitiesOnly=yes` para que só essa chave seja oferecida).
- **Uma senha numa variável de ambiente.** O script confere que a variável existe e não está vazia (status 2 se não), copia o valor e o remove do ambiente com `unset env(NOME)` antes de iniciar a conexão, para que o programa que ele inicia não o herde.
- **Uma senha pedida quando o script roda.** O idioma do expect(1): `stty -echo`, `send_user`, `expect_user -re "(.*)\n"`, `stty echo`, com dois minutos próprios para digitar (`-timeout 120` dentro do bloco) e o eco religado em qualquer desfecho. O script passa a precisar de um terminal.

Nada secreto chega a um log também. O login roda com `log_user 0`, então um equipamento que ecoa a senha não consegue pô-la na tela, e o arquivo de transcrição, quando você pede um, só é aberto depois do login e do passo de enable. O log do Expect registra o que o `expect_user` lê mesmo com o eco desligado, e o `exp_internal` imprime cada `send` por inteiro, por isso o gerador nunca abre um log antes de os segredos serem usados e nunca liga o `exp_internal`. Os dois fatos foram conferidos com o `expect` 5.45.4 real e são explicados em [Segredos em scripts Expect](/learn/expect-secrets-and-safe-scripts).

O ssh sempre recebe `-o StrictHostKeyChecking=accept-new`: o ssh_config(5) diz que com ele "ssh will automatically add new host keys to the user's known_hosts file, but will not permit connections to hosts with changed host keys". O gerador nunca escreve `no`, que aceita uma chave mudada.

## Perfis de equipamento

Os perfis vêm do módulo de dados da série, cada valor lido nos documentos do próprio fabricante em 2026-10-27 e explicado em [Expect contra equipamentos de rede](/learn/expect-against-network-devices):

- **Cisco IOS XE:** `terminal length 0` para a sessão, `--More--` respondido com Espaço, `enable` com a sua pergunta `Password:`.
- **F5 BIG-IP (tmsh):** `modify /cli preference pager disabled display-threshold 0`, uma preferência do usuário cuja duração a referência não diz, sem valor documentado para restaurar.
- **Fortinet FortiOS:** por padrão o script responde a cada `--More--` com um Espaço e `exp_continue`, e a configuração do equipamento fica como estava. Desligar a paginação é uma escolha explícita: `config system console`, `set output standard`, `end`, uma mudança de configuração global que a sessão de todo administrador vê, então o gerador avisa e acrescenta a restauração documentada (`set output more`), que você pode recusar.
- **Extreme Switch Engine:** `disable cli paging session`, para a sessão.
- **Extreme Fabric Engine:** `terminal more disable`, cujo alcance a referência não diz, com `terminal more enable` para restaurar; o `enable` pode fazer perguntas que os documentos não imprimem, então o gerador só o oferece sem senha.
- **Genérico:** a sua própria regexp de prompt, e um comando de paginação se você tiver um.

Cada regexp de prompt é escrita literalmente entre chaves, `-re {...}`, para que o Tcl não substitua nada nela.

## Como o script é montado

- O timeout é definido antes do primeiro `expect`, então nada espera com o padrão de 10 segundos.
- Um único `expect` cuida do login inteiro: cada pergunta (usuário, senha) é respondida uma vez, uma segunda quer dizer recusa e para o script com status 1, o prompt encerra o login, e os braços `timeout` e `eof` param o script com uma mensagem.
- Todo bloco entre chaves começa com uma quebra de linha depois da chave. O Expect 5.45.4 só lê um argumento único entre chaves como padrões e corpos nesse caso; escrito numa linha só, o bloco seria um único padrão (a regra E19 do explicador).
- O `run_command` envia uma linha terminada em `\r` e espera o prompt. Um padrão que casa com qualquer fim de linha, com `exp_continue`, reinicia o timer a cada linha, então o timeout dos comandos conta silêncio e não o comando inteiro, e uma saída longa não estoura o tempo enquanto ainda está chegando.
- Quando a paginação é respondida, o padrão é escrito `-ex "--More--"`, já que o `expect` lê toda palavra que começa com `-` como opção (a regra E20 do explicador).
- O fim é o comando de logout seguido de `expect eof`, ou um `close` quando você não dá comando de logout, e depois `wait`, para o processo ser recolhido.

Status de saída: 0 concluído; 1 o login falhou; 2 entrada faltando ou errada; 3 um comando não terminou; 4 a sessão fechou antes da hora.

## O que ele confere na sua entrada

- Só nomes de host e endereços (sem hífen no começo, então um valor nunca chega ao ssh como opção); com o host tomado da linha de comando, o script confere o argumento do mesmo jeito quando roda.
- Porta só para o ssh (`-p`); para telnet em outra porta, use Outro programa.
- Linhas de comando de programa, arquivos de chave e arquivos de log sem espaços, sem `~` e sem caracteres que o Tcl substituiria.
- Comandos como texto simples, até 40, de até 300 caracteres cada; todo `\`, `"`, `$`, `[`, `]`, `{` e `}` é protegido com uma barra invertida para que o equipamento receba o comando como digitado.
- Timeouts de 1 a 3600 segundos, nunca `-1`.
- Uma regexp de prompt genérica com as chaves fechando, e nunca uma que case na hora (`.*`, `^`, `$`).

Um comando que faz uma pergunta não é respondido: o script para com status 3 quando passa o timeout dos comandos. Quando um comando começa como uma das confirmações documentadas do perfil (`reload`, `save configuration`, `reboot`, `reset`, `execute restore`), o gerador avisa.

## Limites

- O gerador escreve o script; nunca o executa. Rode-o primeiro contra um equipamento de laboratório.
- Ele espera o padrão de prompt do perfil. Uma linha de banner ou uma linha de comando que termine ela mesma em `>` ou `#` e chegue num pedaço separado pode ser confundida com o prompt; [o artigo sobre equipamentos de rede](/learn/expect-against-network-devices) discute os padrões de prompt.
- Comentários e mensagens no script ficam em inglês, como os próprios comandos.
- Ele não responde a confirmações, não trata vários equipamentos num script nem separa a saída de cada comando; edite o script para isso e confira-o de novo com o [explicador](/tools/expect-script-explainer).

## Ferramentas e leituras relacionadas

- **O que o script coleta.** Quando é configuração, o explicador da plataforma a lê: o [explicador de configuração tmsh](/tools/f5-tmsh-config-explainer), o [explicador de configuração da CLI do FortiOS](/tools/fortios-cli-config-explainer) e o [explicador de configuração ExtremeXOS](/tools/exos-config-explainer).
- **Por que o script é escrito assim.** As aspas e chaves do Tcl, que decidem o que chega ao equipamento, estão em [Tcl para quem escreve Expect](/learn/tcl-for-expect-writers); o timer que o `exp_continue` reinicia no `run_command`, em [Timeouts, eof e loops no Expect](/learn/expect-timeouts-eof-and-loops); e o que o Expect grava num log, em [Depurar o Expect](/learn/expect-debugging-and-logging).

## Fontes

- [expect(1), código-fonte do manual do Expect 5.45.4, core.tcl-lang.org](https://core.tcl-lang.org/expect/raw?name=expect.man&ci=expect-5-45-4) (lida em 2026-10-27)
- [expect.c, Expect 5.45.4: como o expect lê os seus argumentos](https://core.tcl-lang.org/expect/raw?name=expect.c&ci=expect-5-45-4) (lida em 2026-10-27)
- [OpenSSH ssh(1)](https://man.openbsd.org/ssh.1) (lida em 2026-10-27)
- [OpenSSH ssh_config(5): StrictHostKeyChecking, BatchMode, IdentitiesOnly](https://man.openbsd.org/ssh_config.5) (lida em 2026-10-27)
- [RFC 854, Telnet Protocol Specification](https://www.rfc-editor.org/rfc/rfc854) (lida em 2026-10-27)
- Os documentos dos fabricantes por trás dos perfis, listados com as suas datas em [Expect contra equipamentos de rede](/learn/expect-against-network-devices) (lida em 2026-10-27)
