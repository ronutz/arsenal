## O que faz

Lê uma mensagem syslog como recebida, ou um quadro TCP que carrega uma mensagem, e nomeia cada campo na ordem em que a RFC os nomeia. Duas gramáticas são tentadas: a mensagem da RFC 5424 (PRI, VERSION, TIMESTAMP, HOSTNAME, APP-NAME, PROCID, MSGID, STRUCTURED-DATA, MSG) e a forma BSD que a RFC 3164 descreve (PRI, TIMESTAMP, HOSTNAME, TAG, CONTENT). O PRI é aberto em facility e severidade pelas mesmas tabelas que o [decodificador de PRI syslog](/tools/syslog-pri-decoder) usa. O que não está em conformidade é marcado nas palavras da própria RFC, e os dados estruturados são abertos elemento por elemento, com os parâmetros registrados na IANA explicados. Nada é enviado a lugar algum.

## O que verifica, e de onde vem cada regra

RFC 5424 (março de 2009), lida em 05/10/2026:

- O PRI: `<` PRIVAL `>`, PRIVAL = Facility × 8 + Severidade, de três a cinco caracteres; "The only time a value of 0 follows the < is for the Priority value of 0. Otherwise, leading 0s MUST NOT be used" (§6.2.1). Acima de 191 não há facility.
- VERSION: um dígito diferente de zero seguido de até dois dígitos; "This document uses a VERSION value of 1" (§6.2.2).
- TIMESTAMP: "a formalized timestamp derived from RFC 3339"; "The T and Z characters in this syntax MUST be upper case"; "Leap seconds MUST NOT be used"; TIME-SECFRAC é um ponto e de um a seis dígitos; ou o NILVALUE (§6.2.3 e §6).
- HOSTNAME de 1 a 255, APP-NAME de 1 a 48, PROCID de 1 a 128, MSGID de 1 a 32 caracteres US-ASCII imprimíveis, ou o NILVALUE (§6).
- STRUCTURED-DATA: `[` SD-ID *(SP SD-PARAM) `]`, elementos adjacentes; um SD-ID tem no máximo 32 caracteres; "The same SD-ID MUST NOT exist more than once in a message"; nomes registrados não têm arroba, nomes privados têm uma arroba e um número de empresa; dentro de um PARAM-VALUE os caracteres `"`, `\` e `]` recebem escape com barra invertida (§6.3). Os SD-IDs da IANA do §7 são timeQuality (tzKnown, isSynced, syncAccuracy), origin (ip, enterpriseId, software, swVersion) e meta (sequenceId, sysUpTime, language); um parâmetro fora dessas listas sob um desses ids é marcado.
- MSG: "If a syslog application encodes MSG in UTF-8, the string MUST start with the Unicode byte order mask (BOM)" (§6.4); texto não ASCII sem o BOM tem codificação desconhecida e é marcado.
- Comprimento: "Any transport receiver MUST be able to accept messages of up to and including 480 octets in length. All transport receiver implementations SHOULD be able to accept messages of up to and including 2048 octets in length" (§6.1).

RFC 3164 (agosto de 2001), lida em 05/10/2026:

- O pacote "MUST be 1024 bytes or less" (§4.1).
- TIMESTAMP "Mmm dd hh:mm:ss" em hora local, o mês uma das doze abreviações em inglês, e "If the day of the month is less than 10, then it MUST be represented as a space and then the number" (§4.1.2).
- HOSTNAME "will contain the hostname, as it knows itself. If it does not have a hostname, then it will contain its own IP address" (§4.1.2).
- TAG "is a string of ABNF alphanumeric characters that MUST NOT exceed 32 characters. Any non-alphanumeric character will terminate the TAG field" (§4.1.3).
- Um pacote cujo HEADER não pode ser lido: o receptor trata tudo após o PRI como a mensagem (§4.3).

Transportes, lidos em 05/10/2026: UDP porta 514 (RFC 5426 §3.1); TCP com contagem de octetos, "SYSLOG-FRAME = MSG-LEN SP SYSLOG-MSG", em que "It can be assumed that octet-counting framing is used if a syslog frame starts with a digit", ou enquadramento não transparente com um TRAILER que "most often is ASCII LF" (RFC 6587 §3.4.1 e §3.4.2); TLS na porta TCP 6514 (RFC 5425 §4.1). Uma contagem no início ou uma quebra de linha no fim do texto colado é lida como esse enquadramento, e a contagem declarada é conferida contra os octetos reais da mensagem.

## Limites

- Uma mensagem de cada vez. Um arquivo de linhas é para o pipeline de logs do leitor; cole a linha em questão.
- O analisador lê a mensagem, não a rede: não pode saber por qual transporte a mensagem veio, só os bytes de enquadramento que ela carrega.
- A forma da RFC 3164 não tem ano nem fuso no timestamp; o analisador diz isso em vez de adivinhar.
- A entrada é cortada em 8.192 caracteres.

## Fontes

- [RFC 5424, The Syslog Protocol, seções 6 a 7](https://www.rfc-editor.org/rfc/rfc5424#section-6) (lida em 05/10/2026)
- [RFC 3164, The BSD syslog Protocol, seções 4.1 a 4.3](https://www.rfc-editor.org/rfc/rfc3164#section-4.1) (lida em 05/10/2026)
- [RFC 5426, Transmission of Syslog Messages over UDP](https://www.rfc-editor.org/rfc/rfc5426#section-3.1) (lida em 05/10/2026)
- [RFC 5425, TLS Transport Mapping for Syslog, seção 4.1](https://www.rfc-editor.org/rfc/rfc5425#section-4.1) (lida em 05/10/2026)
- [RFC 6587, Transmission of Syslog Messages over TCP, seções 3.4.1 e 3.4.2](https://www.rfc-editor.org/rfc/rfc6587#section-3.4.1) (lida em 05/10/2026)
