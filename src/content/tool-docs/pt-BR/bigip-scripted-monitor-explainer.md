## O que faz

Lê o arquivo que um monitor Scripted do BIG-IP LTM executa (as linhas send e expect guardadas em `/config/eav/`) e o explica do jeito que a documentação da F5 diz que o monitor o lê. Cada linha aparece como foi escrita e como é lida: a palavra-chave, o texto sem as aspas e com as sequências de escape da F5 resolvidas, como um send termina (CR LF, só LF, só CR ou nada), e o que uma resposta ou um comando conhecido significa em SMTP, POP3, IMAP ou FTP, com a seção da RFC. Os achados verificam o arquivo contra cada regra que a F5 declara e apontam tudo o que a F5 deixa em aberto, regras S1 a S16, cada uma ligada a uma linha.

Dê a ele também uma transcrição do servidor e ele simula a verificação: cada send sai, cada expect é comparado com a próxima resposta do servidor, e o resultado é **passa**, **falha na linha N** com o motivo da F5, ou **indeterminado na linha N** onde o texto da F5 não diz o que o monitor faz. Nada se conecta a lugar nenhum: a transcrição é um texto que você cola, e o script é lido, nunca executado. O [lab de monitor Scripted](/learn/bigip-ltm-scripted-monitors#lab-scripted-monitor-dialogue) do artigo do Learn roda um script contra um servidor que segue as RFCs, linha a linha, e mostra qual regra da F5 o para.

Os fatos são da F5: a BIG-IP 21.1.0 LTM Monitors Reference, "Scripted monitor settings", e a TMSH Reference de `ltm monitor scripted`. Os fatos de protocolo vêm da RFC 5321 (SMTP), da RFC 1939 (POP3), da RFC 9051 (IMAP4rev2) e da RFC 959 (FTP). Tudo foi lido em 2026-10-27.

## As regras que a F5 declara

- **S1, um CR na linha (erro).** F5: os scripts "must use hard-return line endings (LF), not soft-return line endings (CR-LF)". Um arquivo salvo no Windows tem um CR antes de cada LF. O achado diz se o CR termina a linha ou está no meio dela.
- **S2, não exatamente um espaço depois da palavra-chave (erro).** F5: "Exactly one character space must be used to separate the send or expect instruction keywords from the text". Dois ou mais espaços, ou um tab, são apontados.
- **S3, caracteres depois das aspas de fechamento (erro).** F5: "The text to send or match extends to the end of the line, even when using quotation marks. Any characters that follow a closing quotation mark will break the match." Numa linha expect, o simulador então reprova a verificação ali; numa linha send, a F5 não diz o que é enviado, então o simulador para como indeterminado.
- **S4, uma primeira palavra que não é send nem expect (erro).** A F5 documenta só essas duas palavras-chave. O achado diz quando a palavra é uma palavra-chave com maiúscula (`Expect`), um comentário (`#`) ou sinal de que um script Expect (Tcl) foi colado (`spawn`, `set`, `#!/usr/bin/expect` e afins).
- **S5, uma sequência de escape que a F5 não lista (alerta).** A tabela da F5: `\a` bell, `\b` backspace, `\f` form feed, `\n` nova linha, `\r` return, `\t` tab, `\v` tab vertical, `\\` barra invertida, `\'` aspa simples. Qualquer outra coisa depois de uma barra invertida, como `\x0d` ou `\"`, não está documentada.
- **A regra do prefixo (o match do simulador).** F5: "Matching text can match the prefix of a response, but cannot match a substring that is not a prefix, that is, a substring that starts other than at the beginning of the response." Quando o texto aparece mais adiante na resposta, o passo diz em que caractere.
- **A ordem.** F5: "the lines of the file are always read in the sequence specified". O simulador percorre o arquivo de cima para baixo e para na primeira linha que falha ou que não pode ser decidida.

## O que a F5 deixa em aberto

O texto da F5 não define estes pontos, então o explicador os aponta como alertas e o simulador para ali com **indeterminado** e o motivo, em vez de adivinhar:

- **S9, uma linha em branco.** Linhas em branco depois da última instrução são registradas, mas não mudam nenhum match.
- **S10, espaço em branco antes da palavra-chave.**
- **S11, uma forma de aspas que a F5 não descreve:** aspas simples (a F5 lista um escape para a aspa simples, mas não diz se aspas simples delimitam um texto), aspas de abertura sem fechamento, ou aspas dentro de um texto sem aspas.
- **S12, um texto vazio** (`expect` sozinho, ou `expect ""`).
- **S13, uma última linha sem LF.** Um expect numa linha assim para a simulação; um send ali só é registrado.
- **S14, nenhuma linha expect:** nada do que o servidor diz é verificado.
- **Maiúsculas e minúsculas.** Quando a resposta começa com o texto em outra caixa (`+ok` contra `+OK`), o simulador diz indeterminado: a F5 não diz se a comparação diferencia maiúsculas de minúsculas.
- **O que é uma resposta.** A F5 não diz quanto de uma resposta de várias linhas o monitor lê antes de comparar. Quando um match exigiria que o monitor tivesse lido além do fim da primeira linha da resposta, o simulador diz indeterminado.
- **Uma linha sem aspas que termina em CR** (um arquivo CR-LF sem aspas): a F5 diz só LF, mas não diz como uma linha assim é lida.

## Conselhos das RFCs

- **S6, um send sem fim de linha (alerta).** SMTP, POP3, IMAP e FTP terminam cada comando com CR LF (RFC 5321 2.3.8, RFC 1939 seção 3, RFC 9051 2.2, RFC 959 seção 4), então um servidor desses protocolos espera por ele. O próprio exemplo da F5 escreve `\r\n` no fim de cada send; nada no texto da F5 diz que o monitor acrescenta um fim de linha.
- **S7, um send que termina só com LF ou só com CR (observação).** RFC 5321 2.3.8: uma implementação conforme não deve reconhecer nenhum terminador de linha além de CR LF.
- **S8, um expect escrito como padrão (observação):** um `^` no início, um `$` no fim, `.*` ou `.+`, ou os `-re`, `-gl`, `-ex` ou `-nocase` do Expect. O texto é comparado literalmente; a F5 diz que os únicos monitores que suportam match por expressão regular são HTTP, HTTPS, HTTP/2, TCP e UDP.
- **S15, uma credencial num send (alerta):** `PASS` (POP3, FTP) ou `LOGIN` (IMAP). A senha aparece mascarada em toda a saída, inclusive na comparação com a transcrição. O arquivo a guarda em texto puro, a referência do tmsh não lista opção de TLS para o tipo de monitor, e a RFC 9051 6.2.3 diz que o LOGIN não deve ser usado em redes inseguras. O POP3 permite QUIT e o IMAP permite LOGOUT antes da autenticação, então normalmente dá para verificar sem fazer login.
- **S16, um expect com código de resposta e espaço (observação),** como `"250 "`. Nas respostas de várias linhas do SMTP e do FTP, toda linha menos a última começa com o código e um hífen (RFC 5321 4.2.1, RFC 959 4.2), então `"250 "` nunca é o começo de uma resposta ao EHLO; use no expect só o código.

## A transcrição, e como a simulação a lê

Escreva a sessão como as RFCs fazem: `S:` antes de cada linha que o servidor envia, `C:` antes de cada linha que o cliente envia.

```
S: 220 foo.com Simple Mail Transfer Service Ready
C: HELO bigip1.somecompany.net
S: 250 foo.com
C: quit
S: 221 foo.com Service closing transmission channel
```

- Uma **resposta** é uma sequência de linhas `S:`; uma linha `C:` ou uma linha em branco a encerra. Ponha uma linha em branco entre duas sequências `S:` quando o servidor as envia como respostas separadas.
- Cada linha `S:` é lida como terminada em **CR LF**, como os quatro protocolos exigem. Os espaços depois de `S:` e `C:` são notação, não dados (a RFC 1939 escreve `S:  +OK` com dois).
- Cada **expect** é comparado com a **próxima resposta**, a partir do primeiro caractere. Esta é a única suposição do simulador: a F5 não diz o que conta como "a resposta" quando ela tem várias linhas. Sempre que isso puder mudar o veredito, o simulador diz indeterminado.
- Cada **send** é comparado com a próxima linha `C:`, se houver; uma diferença é registrada (a transcrição pode ser de outro cliente), nunca é uma falha.
- Quando a transcrição **não tem mais resposta** para um expect, a verificação falha ali: a linha de Timeout da F5 diz que um alvo que não responde dentro do Timeout é considerado down.
- Linhas que não começam com `S:` nem com `C:` são ignoradas e listadas.

Os motivos de uma falha: o texto aparece na resposta, mas não no início (com a posição); a resposta não começa com o texto e nem o contém; a resposta termina antes do texto; há caracteres depois de aspas de fechamento, ou o CR de um fim de linha CR-LF está ali; nenhuma resposta chega.

## Como ler a saída

O resumo conta linhas, sends, expects e achados, e avisa quando o arquivo não termina com LF. A simulação mostra o veredito e depois uma linha da tabela para cada linha alcançada: o número da linha, o que ela envia ou espera como o monitor a lê, a resposta com que foi comparada (numerada como na transcrição) ou, num send, se a transcrição mostra a mesma linha de cliente, e o resultado. A tabela de linhas mostra cada linha como foi escrita, em que um caractere de controle que o arquivo realmente contém (o CR de um fim de linha CR-LF, um tab) aparece como o seu símbolo Unicode, como ␍ ou ␉, e um escape digitado como barra invertida e letra fica como foi digitado; nas outras colunas o texto aparece com as sequências de escape da F5, e uma barra invertida como duas.

O botão **Exemplo** carrega o próprio script de SMTP da F5 da Monitors Settings Reference, sem mudar nada, com uma sessão no formato da RFC 5321: ele passa.

## Tempo

Na documentação da F5, o script não tem timer próprio. O Interval do monitor (10 segundos por padrão no Scripted, segundo a referência do tmsh) e o Timeout (31 segundos, três vezes o Interval mais um) decidem quando um membro é marcado como down, como em qualquer monitor; [o artigo sobre monitores de saúde do LTM](/learn/ltm-health-monitors) e o [lab de tempo do monitor](/learn/ltm-health-monitors#lab-f5-monitor-timing) mostram como eles se combinam.

## Compartilhar resultado

No fim do resumo, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva as duas caixas depois do `#` (`input` para o script, `transcript` para a transcrição quando houver) com toda senha de PASS e LOGIN trocada pelos pontos que esta página mostra, no script como foi escrito e nas linhas `C:` da transcrição, então nenhuma senha vai como foi digitada. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

São as senhas que a regra S15 mascara: `PASS` ([RFC 1939](https://www.rfc-editor.org/rfc/rfc1939), seção 7) e o último argumento de `LOGIN` ([RFC 9051](https://www.rfc-editor.org/rfc/rfc9051), seção 6.2.3), lidas em 2026-10-27. Um ponto por caractere, como nesta página, então a página que recebe lê exatamente as mesmas linhas, achados e simulação: os vetores de compartilhamento da ferramenta comparam os dois resultados inteiros. Uma senha escrita com sequências de escape não pode ser encontrada como foi escrita (a página mascara o texto inteiro), então ela não ganha link nenhum, e o popover diz a linha. Outras credenciais vão como foram digitadas, como uma troca SMTP AUTH ([RFC 4954](https://www.rfc-editor.org/rfc/rfc4954), Base64 que decodifica para a senha); o popover avisa antes de você copiar. A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-10-27) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então a cópia não é enviada ao servidor quando o link é aberto; ela fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-la.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** As duas caixas são preenchidas como se tivessem sido coladas (uma transcrição que o link não leva fica vazia) e a página as lê. Nada se conecta a nada e nada roda. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.

## Limites

- O explicador aplica as regras que a F5 publica. O que uma build específica do BIG-IP faz além delas, ele não tem como saber; onde a documentação se cala, ele diz indeterminado.
- A transcrição é sua: o simulador não sabe como o seu servidor responde de fato, com que rapidez, nem se ele responde só parte de uma resposta.
- A detecção de credencial é um padrão: `PASS x` e `tag LOGIN usuário senha`. Uma senha enviada de outro jeito (AUTH, por exemplo) não é reconhecida.
- Teste o monitor de verdade no sistema: `tmsh run ltm monitor scripted NOME destination ENDEREÇO:PORTA`, depois `tmsh show ltm monitor scripted NOME test-result`, ou o botão Test do Configuration utility.

## API

O mesmo engine responde à operação `/api/v1/bigip-scripted-monitor-explainer` da API HTTP do site, descrita no contrato OpenAPI na [página da API](/api); o contrato também diz se este site serve a API.

- **Requisição.** Um objeto JSON, `{"script": "...", "transcript": "..."}`, no corpo de um POST ou no parâmetro de query `input` de um GET; a transcrição pode ficar vazia ou ser omitida. O script tem limite de 32.768 caracteres e a transcrição de 65.536.
- **Resposta.** `lines` (cada uma com `line`, `raw`, `kind`, `keyword`, `written`, `quoted`, `decoded`, `length`, `ending`, `hint`, `secret`, `breaks` e `open`), `findings` (`rule`, `severity`, `line`, `params`), `counts`, `sends`, `expects`, `endsWithLf`, `transcript` (`replies`, `clientLines`, `ignoredLines`) e `simulation` (`verdict`, `stopLine`, `reason`, `steps`, `unreadReplies`, `unusedClientLines`, `notes`), os dois últimos nulos quando não há transcrição. Uma senha aparece mascarada em todos os campos.

## Fontes

- [F5, BIG-IP 21.1.0 LTM Monitors Reference, Monitors Settings Reference: configurações do monitor Scripted, as sequências de escape e o exemplo de SMTP da F5; a Receive String do TCP e quais monitores suportam expressões regulares](https://techdocs.f5.com/en-us/bigip-21-1-0/big-ip-local-traffic-manager-monitors-reference/monitors-settings-reference.html#scripted-monitor-settings) (lida em 2026-10-27)
- [F5 TMSH Reference v17, ltm monitor scripted: opções e padrões, run e show test-result](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_monitor_scripted.html) (lida em 2026-10-27)
- [RFC 5321, Simple Mail Transfer Protocol](https://www.rfc-editor.org/rfc/rfc5321) (lida em 2026-10-27)
- [RFC 1939, Post Office Protocol, Version 3](https://www.rfc-editor.org/rfc/rfc1939) (lida em 2026-10-27)
- [RFC 9051, Internet Message Access Protocol (IMAP), Version 4rev2](https://www.rfc-editor.org/rfc/rfc9051) (lida em 2026-10-27)
- [RFC 959, File Transfer Protocol](https://www.rfc-editor.org/rfc/rfc959) (lida em 2026-10-27)
- Learn: [Monitores Scripted do BIG-IP LTM](/learn/bigip-ltm-scripted-monitors), [Como os monitores de saúde do LTM decidem ativo ou inativo](/learn/ltm-health-monitors). Relacionado: o [explicador de scripts Expect](/tools/expect-script-explainer), para o próprio Expect, e o [explicador de configuração tmsh](/tools/f5-tmsh-config-explainer), para o objeto `ltm monitor scripted` que aponta o arquivo.
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (lida em 2026-10-27): seção 3.5, o fragmento, que leva os valores de um link de Compartilhar resultado
