## O que a ferramenta faz

Escolha um protocolo, preencha campos que se adaptam a ele e veja o comando `curl` exato se montar ao vivo. Cada flag emitida é explicada logo abaixo do comando, e tudo que tem implicação de segurança recebe um aviso: `-k`, protocolos em texto claro, senha colocada na linha de comando, ou o padrão form-encoded do `-d` do `curl` quando o corpo parece JSON. Nada é executado e nada sai do navegador.

## Todos os 27 protocolos

O construtor cobre a lista completa de protocolos da versão atual da ferramenta `curl`, conforme publicada em curl.se: DICT, FILE, FTP, FTPS, GOPHER, GOPHERS, HTTP, HTTPS, IMAP, IMAPS, LDAP, LDAPS, MQTT, MQTTS, POP3, POP3S, RTSP, SCP, SFTP, SMB, SMBS, SMTP, SMTPS, TELNET, TFTP, WS e WSS. Selecionar um protocolo abre um explicador curto: o que ele é, sua porta padrão e se roda em texto claro, dentro de TLS, ou começa em texto claro com caminho de upgrade. O formulário então mostra apenas o que aquele protocolo entende: HTTP ganha métodos, cabeçalhos, corpo e formulários; SMTP ganha envelope; MQTT ganha tópico; FTP ganha listagem e upload; `file://` ganha só um caminho.

## Uma tabela, uma verdade

Os painéis explicadores e o montador do comando leem a mesma tabela de capacidades. Isso é proposital: o texto que ensina o que um protocolo faz e o código que monta o comando não podem divergir, porque são o mesmo dado.

## Determinístico por construção

Entradas idênticas sempre produzem um comando idêntico byte a byte: as flags saem em uma única ordem canônica, e os valores recebem escape POSIX de aspas simples apenas quando necessário. Onze vetores dourados travam esse comportamento, incluindo a regra de que `-d` implica POST (então nunca sai um `-X POST` redundante) e a sequência de escape `'\''`. As aspas seguem shells POSIX; uma nota na ferramenta avisa, porque cmd.exe e PowerShell jogam com outras regras.

## O inverso do tradutor

Esta ferramenta escreve comandos `curl`; o [tradutor de requisições HTTP](/tools/http-request-translator) os lê. Monte um comando aqui, ou cole um lá para vê-lo explicado flag por flag e traduzido para fetch, HTTP cru, HTTPie e Python requests.
