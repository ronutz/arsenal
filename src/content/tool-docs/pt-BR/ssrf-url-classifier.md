## O que faz

Cole uma URL e a ferramenta diz para onde ela realmente aponta: loopback, uma faixa privada ou link-local, um endpoint de metadados de nuvem, o espaço compartilhado CGNAT, outro espaço reservado ou a internet pública. Ela decodifica os truques de ofuscação de IP usados para disfarçar um endereço interno, sinaliza esquemas de URL perigosos e credenciais embutidas, e mostra um nível de risco de SSRF. Ela nunca resolve DNS e nunca envia a requisição; é um classificador, não uma sonda.

## O que é SSRF, e por que a classificação importa

Server-Side Request Forgery é um ataque em que um servidor é enganado para fazer uma requisição a uma URL escolhida pelo atacante, tipicamente para alcançar algo que o atacante não consegue alcançar diretamente: um serviço em `localhost`, uma máquina em uma faixa interna, ou o endpoint de metadados de um provedor de nuvem. Defender-se disso se resume a decidir se uma URL é segura para buscar, e essa decisão é mais difícil do que parece, porque um endereço interno pode ser escrito em muitas formas disfarçadas. Esta ferramenta foi feita para essa decisão: ela existe para ajudar você a entender uma URL e projetar uma allow-list, firmemente do lado defensivo da linha.

## As ofuscações que ela decodifica

Um filtro ingênuo que bloqueia `127.0.0.1` deixa passar as muitas outras formas de escrever o mesmo endereço, e os atacantes exploram exatamente isso. A ferramenta as decodifica para que o destino real fique visível:

- a forma inteira **decimal**, em que `2130706433` é `127.0.0.1`;
- as formas de octeto **octal** e **hexadecimal**;
- o IPv4 em **forma curta**, em que `127.1` se expande para `127.0.0.1`; e
- o **IPv6 com IPv4 mapeado**, em que um endereço IPv4 se esconde dentro de um IPv6.

Ela então classifica o literal resolvido em relação às faixas reservadas (RFC 1918 privada, RFC 3927 link-local, RFC 6598 CGNAT, e as demais) e destaca o endereço de metadados de nuvem, que é um alvo primário de SSRF.

## Esquemas, credenciais e o desconhecido honesto

Além do endereço, a ferramenta sinaliza esquemas de URL perigosos (os que vão além de `http` e `https` e que payloads de SSRF costumam abusar) e credenciais embutidas na forma `usuário:senha@host`. Uma coisa sobre a qual ela tem o cuidado de ser honesta: um nome de host simples que não seja um nome especial conhecido é reportado como resolvido em tempo de execução, e não adivinhado, porque a ferramenta nunca faz resolução de DNS. Essa é a resposta verdadeira, e é também por isso que a ferramenta é segura: ela classifica o que a URL diz, em vez de sair buscando.

## Como usar

Cole uma URL e leia sua classificação, o destino decodificado, quaisquer esquemas ou credenciais sinalizados, e o nível de risco de SSRF. Tudo é calculado localmente; nenhuma requisição é feita.
