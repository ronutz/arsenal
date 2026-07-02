## O que faz

Analise um endereço ou prefixo IPv6 e o veja de todos os ângulos: sua forma canônica curta e sua forma totalmente expandida, que tipo de endereço ele é, a aritmética de prefixo de um bloco, um endereço MAC de hardware se houver um embutido no identificador de interface, e o nome de DNS reverso que aponta de volta para ele. Tudo é calculado no seu navegador.

## Formas canônica e expandida

Um endereço IPv6 tem 128 bits, escrito como oito grupos de quatro dígitos hexadecimais separados por dois-pontos. O mesmo endereço pode ser escrito de muitas formas, então a RFC 5952 define uma forma canônica: em minúsculas, com os zeros à esquerda de cada grupo removidos e a única maior sequência de grupos todos zero reduzida a `::`. A ferramenta mostra essa forma canônica e, ao lado dela, a forma totalmente expandida com cada grupo escrito por completo, que é a versão que você quer quando precisa ver todos os 128 bits ou alinhar endereços por coluna. Por exemplo, `2001:0db8:0000:0000:0000:0000:0000:0001` expande de, e se canoniza para, `2001:db8::1`.

## Classificação e aritmética de prefixo

Nem todo endereço é um endereço público comum. A ferramenta classifica faixas de uso especial: o loopback `::1`, o endereço não especificado `::`, endereços link-local em `fe80::/10`, endereços unique-local em `fc00::/7` (RFC 4193), a faixa de documentação `2001:db8::/32` reservada pela RFC 3849 e endereços IPv4-mapeados. Quando você fornece um prefixo, ela calcula o endereço de rede do bloco, seu primeiro e último endereço e quantos endereços ele abrange, a mesma aritmética que a ferramenta de CIDR faz para IPv4, mas em um campo de 128 bits.

## EUI-64 e DNS reverso

Dois extras surgem do endereço. Se o identificador de interface foi construído a partir do MAC de 48 bits de uma placa de rede usando o método EUI-64 modificado (RFC 4291, Apêndice A), a ferramenta recupera esse MAC, o que é justamente o motivo pelo qual existem extensões de privacidade para evitar vazá-lo. E ela monta o nome de DNS reverso `ip6.arpa`: os nibbles do endereço em ordem inversa, separados por pontos, terminando em `.ip6.arpa`, que é o que uma consulta PTR do endereço usa.

## Como usar

Cole um endereço IPv6 para ver suas formas canônica e expandida, sua classificação, qualquer MAC embutido e seu nome de DNS reverso, ou cole um prefixo para acrescentar a aritmética do bloco. A análise é determinística e lê apenas o endereço que você fornece.
