## O que faz

A Calculadora de CIDR / Sub-redes recebe um bloco IPv4 escrito em notação CIDR — um endereço junto com um comprimento de prefixo, como `192.168.1.0/24` — e deriva tudo o que esse prefixo implica: o endereço de rede, o endereço de broadcast, o primeiro e o último host utilizável, a quantidade de hosts utilizáveis e a máscara de sub-rede em formato decimal pontuado. Ela também classifica o bloco em relação às faixas reservadas conhecidas, de modo que um bloco privado (RFC 1918) ou outro bloco de uso especial (RFC 6890) é sinalizado como tal. Todo o cálculo roda no seu navegador; nenhuma entrada é enviada.

## Como funciona a notação CIDR

Um comprimento de prefixo `/n` fixa os `n` bits iniciais do endereço de 32 bits como a porção de rede e deixa os `32 − n` bits restantes para hosts. Esse único número define o tamanho do bloco: ele abrange `2^(32 − n)` endereços. Dentro de qualquer bloco:

- o **endereço de rede** tem todos os bits de host em 0 (o menor endereço);
- o **endereço de broadcast** tem todos os bits de host em 1 (o maior);
- a **faixa de hosts utilizáveis** é tudo o que está entre eles.

Um /24, por exemplo, abrange `2^8 = 256` endereços: um endereço de rede, um endereço de broadcast e `254` hosts utilizáveis. De modo geral, um bloco de /0 até /30 tem `2^(32 − n) − 2` hosts utilizáveis, porque os endereços de rede e de broadcast são reservados e não podem ser atribuídos a hosts.

## Os casos especiais /31 e /32

Dois prefixos quebram a regra do "menos dois":

- Um **/32** descreve um único host: um endereço, sem endereço de rede ou de broadcast separados.
- Um **/31** descreve exatamente dois endereços. Em enlaces ponto a ponto, a RFC 3021 define ambos como utilizáveis, então um /31 fornece dois hosts sem endereço de rede ou de broadcast reservado. A calculadora conta os blocos /31 da forma definida pela RFC 3021.

## Exemplos resolvidos

- `192.168.1.0/24` → rede `192.168.1.0`, broadcast `192.168.1.255`, utilizáveis `192.168.1.1`–`192.168.1.254`, `254` hosts, máscara `255.255.255.0`.
- `10.0.0.0/30` → rede `10.0.0.0`, broadcast `10.0.0.3`, utilizáveis `10.0.0.1`–`10.0.0.2`, `2` hosts, máscara `255.255.255.252`.
- `10.0.0.0/31` → dois endereços utilizáveis (`10.0.0.0` e `10.0.0.1`), um enlace ponto a ponto conforme a RFC 3021, sem endereço de rede ou de broadcast.

## Como usar

Digite um bloco CIDR IPv4 como `192.168.1.0/24` ou `10.0.0.0/8`, e a ferramenta informa os endereços de rede e de broadcast, a faixa de hosts utilizáveis, a contagem de hosts e a máscara de sub-rede. Para ver a classificação de faixa reservada, digite um bloco privado como `10.0.0.0/8` (RFC 1918) ou outro bloco de uso especial; a ferramenta sinaliza que tipo de bloco é.
