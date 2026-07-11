## O que faz

Esta ferramenta computa um fingerprint TLS passivo JA3. Cole uma string JA3 - os cinco campos do ClientHello (versão TLS, cipher suites, extensões, curvas elípticas, e point formats de curva elíptica), vírgulas entre campos e traços entre valores - e ela recomputa o hash MD5 do JA3, computa a variante JA3N com as extensões ordenadas, decodifica cada campo com uma contagem, e sinaliza quaisquer valores GREASE. Roda inteiramente no seu navegador.

## JA3, e por que o hash é o que é

O JA3 foi criado pela Salesforce como um identificador compacto e compartilhável para um cliente TLS. Os cinco campos que ele usa são preenchidos na maior parte pela biblioteca TLS do cliente e não pela aplicação, então o mesmo build de navegador ou ferramenta tende a produzir o mesmo JA3 - o que o torna útil para identificar scripts, bots, e bibliotecas incomuns antes de uma aplicação ter qualquer outro contexto. A ferramenta segue a construção original exatamente: ela remove os valores GREASE (os placeholders reservados de 0x0a0a a 0xfafa que a RFC 8701 faz os navegadores inserirem), reconstrói a string canônica, e faz o hash MD5. Dois dos próprios exemplos publicados da Salesforce estão fixados como testes, então o hash que você obtém aqui é o JA3 que o ecossistema espera.

## GREASE e o problema do churn

Duas coisas tornam um JA3 bruto menos estável do que parece, e a ferramenta expõe ambas. Valores GREASE são placeholders aleatórios que mudam a cada conexão; se não são removidos, o mesmo cliente produz um hash diferente a cada vez, então o JA3 os exclui - e a ferramenta te diz quais ela encontrou e removeu. O problema maior é a permutação de extensões: desde por volta de 2024, o Chrome e o Firefox randomizam a ordem das extensões TLS a cada conexão, e como o JA3 faz o hash das extensões em ordem, um único navegador agora produz milhares de hashes JA3 diferentes. A ferramenta marca se suas extensões estavam em ordem e mostra o JA3N ao lado do JA3.

## JA3N e JA4

O JA3N é a correção simples: ordene a lista de extensões antes do hash, e a permutação não importa mais. A ferramenta o computa para você, então se sua entrada veio de um navegador que permuta, o JA3N é o valor que permanece constante. O JA3N é um paliativo, no entanto. O sucessor moderno é o JA4, que ordena nativamente, usa SHA256, adiciona um prefixo legível por humanos, e se estende para HTTP, SSH, QUIC, e TCP. Se você está escolhendo um fingerprint para construir detecção hoje, o JA4 é o alvo melhor; o JA3 aqui é para ler e casar os fingerprints que ferramentas mais antigas e inteligência de ameaças ainda falam.

## O que um fingerprint é e não é

Um JA3 identifica uma implementação TLS, não uma pessoa e não uma intenção. É um sinal forte quando combinado com comportamento de requisição, inteligência de proxy, e histórico de conta, e um fraco por si só: colisões de MD5 são possíveis, e dois clientes diferentes podem compartilhar um hash. Trate-o como uma entrada para uma decisão - uma forma de notar que uma conexão parece um bot conhecido ou uma biblioteca inesperada - em vez de prova de qualquer coisa por si só.
