## O que faz

Gere e verifique os códigos de uso único usados para autenticação de dois fatores: senhas baseadas em tempo (TOTP, RFC 6238), os códigos de seis dígitos que um aplicativo autenticador mostra, e senhas baseadas em contador (HOTP, RFC 4226), os códigos que um token físico produz. Você pode escolher o hash (SHA-1, SHA-256 ou SHA-512), o número de dígitos e o intervalo de tempo. O cálculo usa o Web Crypto nativo do navegador, e seu segredo compartilhado nunca sai do seu navegador.

## Uma construção, dois fatores móveis

HOTP e TOTP são o mesmo algoritmo por baixo. Ambos tomam um segredo compartilhado e um fator móvel, calculam um HMAC do fator móvel sob o segredo e então aplicam a "truncagem dinâmica" definida na RFC 4226 para reduzir esse MAC a um código decimal curto. A única diferença é de onde vem o fator móvel:

- **HOTP** usa um contador de eventos explícito que incrementa em um a cada vez que um código é usado. O token e o servidor precisam se manter sincronizados nesse contador.
- **TOTP** usa o relógio: o fator móvel é o número de intervalos de tempo desde uma época, `floor((tempo atual - T0) / intervalo)`, com `T0` em 0 e o intervalo de 30 segundos por padrão. Em outras palavras, o TOTP é simplesmente o HOTP cujo contador é a fatia de tempo atual, e é por isso que um código TOTP muda a cada 30 segundos.

## O segredo compartilhado

O segredo é a semente que os dois lados possuem. Ele costuma ser trocado como uma string Base32, que é o que uma URI `otpauth://` ou um QR code de configuração codifica, então a ferramenta decodifica o Base32 para recuperar os bytes da chave. O hash padrão é SHA-1, que é o que a maioria dos aplicativos autenticadores e tokens ainda usa para senhas de uso único; SHA-256 e SHA-512 estão disponíveis onde ambos os lados oferecem suporte.

## Verificação e desvio de relógio

Como o relógio de um dispositivo e o de um servidor nunca estão perfeitamente alinhados, uma verificação TOTP normalmente aceita códigos de uma pequena janela de intervalos de tempo adjacentes, e não apenas do atual, trocando um pouco de rigor por confiabilidade. O HOTP tem o problema análogo no contador, em que um token pode avançar se um código gerado não for usado, então servidores aceitam uma janela de antecipação e ressincronizam.

## Como usar

Informe o segredo compartilhado e gere o código TOTP atual, ou defina um contador para gerar um código HOTP, e ajuste o hash, a quantidade de dígitos e o intervalo para corresponder ao seu sistema. Você também pode validar um código que recebeu. O algoritmo é determinístico dados o segredo e o fator móvel, então as mesmas entradas sempre produzem o mesmo código.
