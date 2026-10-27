## O que faz

O Fabric Connect (SPBM) da Extreme nomeia as coisas com três números, e esta ferramenta decodifica aquele que você colar, detectando-o automaticamente pela forma:

- um **I-SID**, um identificador de serviço de 24 bits (1 a 16.777.215) que nomeia uma instância de serviço na fabric;
- um **nickname**, um identificador de nó de 20 bits escrito como `X.XX.XX` em hexadecimal; e
- um **system-id / B-MAC**, um endereço no formato MAC de 48 bits escrito como trio pontilhado, como `00bb.0021.0001`.

Tudo roda inteiramente no seu navegador.

## O I-SID

O I-SID é o coração de um serviço de fabric. Uma VLAN de cliente mapeada para um I-SID é um Layer 2 VSN; uma VRF mapeada para um I-SID é um Layer 3 VSN; a tabela de roteamento global transportada por IS-IS sem I-SID é o IP Shortcuts. O número em si não codifica qual desses é - isso é definido por como você o provisiona - então a ferramenta valida a faixa de 24 bits e explica o uso, em vez de adivinhar um tipo. O I-SID de rede padrão do Fabric Attach (FAN) é 16777001, que a ferramenta destaca.

## O nickname

Todo nó SPBM carrega um nickname de 20 bits, escrito como um dígito hexadecimal, um ponto, dois dígitos hexadecimais, um ponto, dois dígitos hexadecimais (por exemplo `C.30.00`). Ele deve ser único em toda a fabric, inclusive entre áreas IS-IS adjacentes. A ferramenta converte a forma `X.XX.XX` de e para o seu valor inteiro e verifica a faixa. A atribuição dinâmica de nicknames distribui nicknames a partir de uma faixa de prefixo de servidor, como `C.30.00-C.3F.FF`.

## O system-id / B-MAC

O B-MAC do nó, configurado como o system-id do IS-IS, é um endereço de 48 bits. A ferramenta lê os dois bits significativos do seu primeiro octeto: o bit U/L (a orientação da Extreme é usar um endereço administrado localmente, primeiro octeto `02`) e o bit I/G (um endereço de nó deve ser individual, não de grupo).

## Como usar

Cole um I-SID decimal, um nickname `X.XX.XX` ou um B-MAC em trio pontilhado. A detecção é pela forma, então não há nada a selecionar.

## Compartilhar resultado

Abaixo da leitura, **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva o identificador como foi digitado (`#input=C.30.00`), e mais nada. Tudo o que o link leva vai depois do `#`, e a [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-10-27) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado): o navegador não o envia ao servidor quando o link é aberto, mas ele fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** Um link leva no máximo 16.384 caracteres, o limite que o site usa para todo valor depois do `#`; um identificador é bem mais curto.
- **Ao abrir um link.** O link é o mesmo endereço que outros links para esta ferramenta usam: o identificador preenche o campo e é decodificado como se tivesse sido digitado. Como em todo link para esta ferramenta, o valor fica depois do `#` até você mudar ou limpar o campo, e então sai do endereço sem nenhuma requisição.
