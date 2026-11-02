## O que a ferramenta faz

Escolha um protocolo, preencha campos que se adaptam a ele e veja o comando `curl` exato se montar ao vivo. Cada flag emitida é explicada logo abaixo do comando, e tudo que tem implicação de segurança recebe um aviso: `-k`, protocolos em texto claro, senha colocada na linha de comando, ou o padrão form-encoded do `-d` do `curl` quando o corpo parece JSON. Nada é executado e nada sai do navegador.

## Todos os 27 protocolos

O construtor cobre a lista completa de protocolos da versão atual da ferramenta `curl`, conforme publicada em curl.se: DICT, FILE, FTP, FTPS, GOPHER, GOPHERS, HTTP, HTTPS, IMAP, IMAPS, LDAP, LDAPS, MQTT, MQTTS, POP3, POP3S, RTSP, SCP, SFTP, SMB, SMBS, SMTP, SMTPS, TELNET, TFTP, WS e WSS. Selecionar um protocolo abre um explicador curto: o que ele é, sua porta padrão e se roda em texto claro, dentro de TLS, ou começa em texto claro com caminho de upgrade. O formulário então mostra apenas o que aquele protocolo entende: HTTP ganha métodos, headers, corpo e formulários; SMTP ganha envelope; MQTT ganha tópico; FTP ganha listagem e upload; `file://` ganha só um caminho.

## Uma tabela, uma verdade

Os painéis explicadores e o montador do comando leem a mesma tabela de capacidades. Isso é proposital: o texto que ensina o que um protocolo faz e o código que monta o comando não podem divergir, porque são o mesmo dado.

## Determinístico por construção

Entradas idênticas sempre produzem um comando idêntico byte a byte: as flags saem em uma única ordem canônica, e os valores recebem escape POSIX de aspas simples apenas quando necessário. Onze vetores dourados travam esse comportamento, incluindo a regra de que `-d` implica POST (então nunca sai um `-X POST` redundante) e a sequência de escape `'\''`. As aspas seguem shells POSIX; uma nota na ferramenta avisa, porque cmd.exe e PowerShell jogam com outras regras.

## O inverso do tradutor

Esta ferramenta escreve comandos `curl`; o [tradutor de requisições HTTP](/tools/curl-command-explainer) os lê. Monte um comando aqui, ou cole um lá para vê-lo explicado flag por flag e traduzido para fetch, HTTP cru, HTTPie e Python requests.

## Compartilhar resultado

Abaixo da caixa do comando, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva o formulário depois do `#`, cada campo pelo próprio nome (um formulário não tem um texto único para colar), com a senha e toda credencial trocadas por `REDACTED`, nunca como foram digitadas. O botão fica visível, desativado, até o formulário montar um comando. O popover diz primeiro o que o link leva e quantos valores foram trocados, e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

O que é trocado:

- **O campo de senha**: o comando continua lendo `-u usuário:REDACTED`, e o aviso sobre senha na linha de comando fica.
- **Headers**, pelo nome: `Authorization` e `Proxy-Authorization` mantêm o esquema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), seções 11.6.2 e 11.7.2: o valor "consists of credentials", é feito de credenciais); o Basic mantém o user-id e perde a senha ([RFC 7617](https://www.rfc-editor.org/rfc/rfc7617), seção 2); um JWT mantém o header protegido e perde as claims e a assinatura ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), seção 1); o `Cookie` mantém os nomes; um header com nome de segredo (`X-API-Key`) vai inteiro; um token dentro de qualquer outro valor sai.
- **O campo de cookie**: cada valor ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), seção 4.2.1). **Um campo de formulário com nome de segredo** (`client_secret`): o valor; um campo de arquivo mantém o caminho. **O corpo**: membros JSON e parâmetros `nome=valor` com nome de segredo (`access_token` ([RFC 6750](https://www.rfc-editor.org/rfc/rfc6750), seções 2.2 e 2.3), `refresh_token`, `client_secret`, `password` e `code` ([RFC 6749](https://www.rfc-editor.org/rfc/rfc6749), seções 2.3.1, 4.1.2, 4.3.2 e 5.1), `code_verifier` ([RFC 7636](https://www.rfc-editor.org/rfc/rfc7636), seção 4.5), e qualquer nome terminado em token, secret, password ou api key).
- **O host, o proxy e o caminho**: a senha de um `usuário:senha@` ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), seção 3.2.1; o curl também lê um sem esquema) e qualquer parâmetro secreto da query.

Todo outro campo vai como foi digitado; os padrões (https, GET, saída padrão, chaves desligadas) ficam fora do link, e um tab digitado num campo de uma linha viaja como espaço. Os vetores de compartilhamento da ferramenta conferem que a cópia monta as mesmas flags e os mesmos avisos. Se o comando montado a partir da cópia ainda tiver uma chave ou token que nenhum nome marca (um JWT no caminho), não há link, e o popover diz isso.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o formulário não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue ler.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** O formulário inteiro é substituído (um campo que o link não leva fica vazio) e o comando é montado; nada é executado nem enviado. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
