## O que faz

Um JA4 é uma impressão digital (fingerprint) de um cliente TLS, calculada a partir dos campos do seu ClientHello: a versão do TLS, as cifras que ele oferece, as extensões que envia, os algoritmos de assinatura e o ALPN. Dois clientes que montam o ClientHello da mesma forma produzem o mesmo JA4, e é assim que servidores, proxies e sensores passivos reconhecem o software cliente sem descriptografar nada. Esta ferramenta decodifica um JA4 em suas partes, ou calcula o JA4 com hash a partir dos valores brutos, sem hash. Tudo roda no seu navegador.

## Como um JA4 é formado

Um JA4 tem três seções unidas por sublinhados, `JA4_a_JA4_b_JA4_c`, por exemplo `t13d1516h2_8daaf6152771_e5627efa2ab1`.

- **JA4_a** é legível e tem dez caracteres:
  - transporte: `t` para TLS sobre TCP, `q` para QUIC, `d` para DTLS;
  - versão do TLS: `13` para TLS 1.3, `12` para 1.2, e assim por diante, lida da extensão supported_versions quando presente;
  - SNI: `d` quando o ClientHello carrega um nome de servidor (um domínio), `i` quando não carrega (um IP puro);
  - a contagem de cifras em dois dígitos;
  - a contagem de extensões em dois dígitos (essa contagem inclui SNI e ALPN);
  - o marcador ALPN: o primeiro e o último caractere do primeiro valor de ALPN, ou seja, `h2` para HTTP/2, ou `00` quando não há ALPN.
- **JA4_b** são os primeiros doze caracteres hexadecimais do SHA-256 da lista de cifras, ordenada.
- **JA4_c** são os primeiros doze caracteres hexadecimais do SHA-256 da lista de extensões (ordenada, com SNI e ALPN removidos) seguida da lista de algoritmos de assinatura em sua ordem original.

Como JA4_b e JA4_c são hashes truncados, eles são unidirecionais: a ferramenta pode exibi-los, mas não consegue recuperar as listas de cifras ou extensões a partir deles.

## GREASE

O GREASE (os valores reservados do draft-davidben-tls-grease) mantém o TLS extensível fazendo os clientes enviarem valores aleatórios não usados que os servidores devem ignorar. O JA4 também os ignora, então eles nunca afetam as contagens nem os hashes. Se você colar valores brutos que incluam GREASE, esta ferramenta os filtra antes de contar, ordenar e fazer o hash.

## A ordenação é o que torna o JA4 robusto

Fingerprints mais antigos como o JA3 faziam o hash das listas de cifras e extensões na ordem em que o cliente as enviava. Navegadores modernos hoje embaralham deliberadamente a ordem das extensões TLS a cada conexão, o que muda o JA3 toda vez e o derrota. O JA4 ordena as cifras e extensões antes de fazer o hash, então a impressão digital permanece estável mesmo quando o cliente embaralha a ordem. Esse é o principal motivo pelo qual o JA4 substituiu, em grande parte, o JA3.

## Exemplo prático

A impressão digital `t13d1516h2_8daaf6152771_e5627efa2ab1` decodifica para TLS sobre TCP, TLS 1.3, SNI presente, 15 cifras, 16 extensões e ALPN `h2` (HTTP/2). Este é o exemplo prático da especificação do JA4, e é um dos vetores de teste desta ferramenta: o SHA-256 da sua lista ordenada de cifras dá `8daaf6152771`, e as extensões ordenadas mais os algoritmos de assinatura dão `e5627efa2ab1`.

## Uma nota sobre licenciamento

O JA4 (fingerprinting de cliente TLS) é publicado pela FoxIO sob a licença permissiva BSD 3-Clause, os mesmos termos do JA3 original, então é livre para implementar, inclusive em ferramentas comerciais. Os outros membros da família JA4+, como JA4S, JA4H, JA4X e JA4T, estão sob a FoxIO License 1.1, que não permite monetização sem um acordo à parte, então esta ferramenta implementa apenas o JA4.

## O JA3, o predecessor

Esta ferramenta também trata o JA3, o fingerprint mais antigo que o JA4 substituiu. Um JA3 é o MD5 de cinco campos decimais do ClientHello na ordem em que foram enviados: `SSLVersion,Ciphers,Extensions,EllipticCurves,EllipticCurvePointFormats`, por exemplo `769,47-53-5-10-49161-49162-49171-49172-50-56-19-4,0-10-11,23-24-25,0`. Cole uma string JA3 e a ferramenta calcula o MD5 e separa os campos; cole um MD5 puro de 32 caracteres e ela o reconhece como um hash JA3 que, sendo unidirecional, não pode ser decodificado. O JA3 é BSD 3-Clause como o JA4. Ele é sensível à ordem, então um navegador que embaralha a ordem das extensões produz um JA3 diferente a cada conexão, o que é a razão de o JA4 existir.

## Como usar

A ferramenta detecta automaticamente o que você cola: um JA4 tem sublinhados, enquanto um JA3 são campos decimais separados por vírgulas, ou um MD5 puro. Cole um JA4 com hash para decodificá-lo, um JA4_r bruto (o valor `JA4_a` seguido das listas brutas de cifras, extensões e algoritmos de assinatura, separadas por sublinhados) para calcular o JA4 com hash, uma string JA3 para calcular seu MD5 e ver seus campos, ou um MD5 de JA3 para identificá-lo. O caminho do JA4 bruto ordena e filtra o GREASE das listas para você, então entradas em ordem ordenada ou original produzem o mesmo JA4 canônico.
