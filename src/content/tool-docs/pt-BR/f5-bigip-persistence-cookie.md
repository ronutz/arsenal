## O que faz

Decodifique o valor de um cookie de persistência `BIGipServer` do F5 BIG-IP no endereço IP e na porta do membro do pool de destino, ou faça o caminho inverso e gere um valor de cookie a partir de um endereço e uma porta. Ela trata as quatro codificações não criptografadas que o BIG-IP usa, e roda inteiramente no seu navegador.

## O que é o cookie, e por que decodificá-lo importa

Quando a persistência por cookie do BIG-IP roda em seu modo de inserção padrão, ela adiciona um cookie chamado `BIGipServer<pool>` cujo valor codifica para qual membro do pool um cliente foi enviado, para que o cliente retorne ao mesmo membro. O problema é que a codificação não é criptografia: em sua forma padrão, o cookie codifica de forma clara o endereço IP interno e a porta do membro do pool. Qualquer um que consiga ver o cookie, o que inclui o cliente e qualquer coisa no caminho, pode decodificá-lo e aprender um pedaço da sua topologia interna. Demonstrar isso é o objetivo desta ferramenta, e ela sinaliza quando um endereço decodificado cai em uma faixa privada RFC 1918, porque é exatamente esse o detalhe interno que você não pretendia publicar.

## As codificações e sua ordem de bytes

A sutileza, e a razão pela qual um decodificador dedicado ajuda, é a ordem dos bytes. Na codificação IPv4 padrão, o endereço é um único número decimal cujos bytes são tomados em little-endian, isto é, invertidos, e a porta é um campo decimal com seus dois bytes trocados. Por exemplo, o endereço `10.1.1.100` codifica para o decimal `1677787402`, e a porta `80` codifica para o valor com bytes trocados `20480`. O BIG-IP define quatro dessas codificações no total, cobrindo IPv4, IPv6 e variantes com route domain, cada uma com sua própria regra, que a ferramenta implementa a partir da própria documentação da F5 (K6917), verificada contra um decodificador de referência conhecido.

## A correção, que esta ferramenta não consegue desfazer

A mitigação é simples e vale dizer: configure a criptografia de cookie no perfil de persistência (F5 K7784). Um cookie de persistência criptografado não carrega nenhum endereço legível, e esta ferramenta não consegue decodificá-lo, o que é intencional. Se você consegue decodificar aqui o seu cookie de produção, qualquer outra pessoa também consegue, o que é o sinal para ligar a criptografia.

## Como usar

Cole um valor de cookie `BIGipServer` para decodificar o endereço e a porta do membro, ou informe um endereço e uma porta para produzir um valor de cookie. O cálculo é determinístico e local; nada é enviado a lugar algum.

## Compartilhar resultado

Cada modo tem o seu botão **Compartilhar resultado**, abaixo da resposta dele. Ele cria um link para esta página, só quando você clica, que leva os valores depois do `#`. Em Decodificar, o link leva uma cópia do cookie que a página decodificou, nome e valor, nunca a linha como foi colada: a página lê só o que vem antes do primeiro `;`, e uma linha colada pode trazer mais, os atributos de uma linha `Set-Cookie`, ou o valor `Cookie` de um navegador em que um cookie de sessão vem depois do cookie de persistência ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), o exemplo da seção 4.2.1, `Cookie: SID=31d4d96e407aad42; lang=en-US`; seção 8.4: um cookie costuma guardar um identificador de sessão; lida em 2026-11-01). Assim a página que recebe decodifica o mesmo membro do pool, e o resto fica com você. Em Codificar, o link leva o endereço, a porta e o route domain como a página os leu. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda. Como o endereço decodificado ou digitado costuma ser de um membro interno do pool, o popover acrescenta uma linha pedindo que você o confira antes de mandar o link.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Ao abrir um link.** O modo abre e os campos são preenchidos como se tivessem sido digitados, e a página decodifica ou codifica como sempre. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
