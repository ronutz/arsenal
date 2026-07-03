## O que faz

Decodifique o valor de um cookie de persistência `BIGipServer` do F5 BIG-IP no endereço IP e na porta do membro do pool de destino, ou faça o caminho inverso e gere um valor de cookie a partir de um endereço e uma porta. Ela trata as quatro codificações não criptografadas que o BIG-IP usa, e roda inteiramente no seu navegador.

## O que é o cookie, e por que decodificá-lo importa

Quando a persistência por cookie do BIG-IP roda em seu modo de inserção padrão, ela adiciona um cookie chamado `BIGipServer<pool>` cujo valor codifica para qual membro do pool um cliente foi enviado, para que o cliente retorne ao mesmo membro. O problema é que a codificação não é criptografia: em sua forma padrão, o cookie codifica de forma clara o endereço IP interno e a porta do membro do pool. Qualquer um que consiga ver o cookie, o que inclui o cliente e qualquer coisa no caminho, pode decodificá-lo e aprender um pedaço da sua topologia interna. Demonstrar isso é o objetivo desta ferramenta, e ela sinaliza quando um endereço decodificado cai em uma faixa privada RFC 1918, porque é exatamente esse o detalhe interno que você não pretendia publicar.

## As codificações e sua ordem de bytes

A sutileza, e a razão pela qual um decodificador dedicado ajuda, é a ordem dos bytes. Na codificação IPv4 padrão, o endereço é um único número decimal cujos bytes são tomados em little-endian, isto é, invertidos, e a porta é um campo decimal com seus dois bytes trocados. Por exemplo, o endereço `10.1.1.100` codifica para o decimal `1677787402`, e a porta `80` codifica para o valor com bytes trocados `20480`. O BIG-IP define quatro dessas codificações no total, cobrindo IPv4, IPv6 e variantes com route domain, cada uma com sua própria regra, que a ferramenta implementa a partir da própria documentação da F5 (K6917), verificada contra um decodificador de referência conhecido.

## A correção, que esta ferramenta não consegue desfazer

A mitigação é simples e vale dizer: configure a criptografia de cookie no perfil de persistência (F5 K7784). Um cookie de persistência criptografado não carrega nenhum endereço legível, e esta ferramenta não consegue decodificá-lo, por design. Se você consegue decodificar aqui o seu cookie de produção, qualquer outra pessoa também consegue, o que é o sinal para ligar a criptografia.

## Como usar

Cole um valor de cookie `BIGipServer` para decodificar o endereço e a porta do membro, ou informe um endereço e uma porta para produzir um valor de cookie. O cálculo é determinístico e local; nada é enviado a lugar algum.
