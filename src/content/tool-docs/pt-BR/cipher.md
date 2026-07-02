## O que faz

Informe uma suíte de cifra TLS, seja como seu nome IANA, um nome OpenSSL ou GnuTLS, ou um ponto de código hexadecimal, e a ferramenta a divide em suas partes, a troca de chaves, a autenticação, a cifra e o modo, e o MAC, e dá uma leitura de segurança em linguagem clara junto com o status de recomendação oficial da IANA da suíte. Ela roda no seu navegador contra uma cópia embutida do registro da IANA.

## Lendo o nome de uma suíte de cifra

Uma suíte de cifra é um pacote nomeado dos algoritmos que uma conexão TLS vai usar, e o nome é estruturado. No TLS 1.2 e anteriores, um nome como `TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256` se lê por suas partes: `ECDHE` é o método de troca de chaves, `RSA` é como o servidor é autenticado, `AES_128_GCM` é a cifra com seu tamanho de chave e modo, e `SHA256` é o MAC e o hash da PRF. O TLS 1.3 mudou isso: uma suíte 1.3 como `TLS_AES_128_GCM_SHA256` nomeia apenas a cifra simétrica e o hash, porque a troca de chaves é sempre efêmera e é negociada separadamente. A ferramenta analisa qualquer uma das duas formas em seus componentes.

## Nomes, pontos de código e o registro

A mesma suíte tem nomes diferentes em ferramentas diferentes, com um ponto de código numérico por baixo de todos eles. A fonte autoritativa é o registro IANA TLS Cipher Suites, que mapeia cada ponto de código de dois bytes para seu nome e carrega o sinalizador **Recommended** (Y, N ou D para discouraged, conforme a RFC 8447). A ferramenta resolve o que você digitar, um nome IANA, um nome OpenSSL ou GnuTLS, ou o ponto de código hexadecimal bruto, de volta para aquele registro, para que você possa transitar entre a grafia que uma ferramenta mostra e a que outra espera.

## A leitura de segurança

Conhecendo as partes, a ferramenta consegue julgar a suíte, e sinaliza as sabidamente ruins e as fracas com base em padrões, e não em opinião: suítes RC4 são inseguras (RFC 7465), suítes 3DES são fracas por causa do ataque Sweet32 (RFC 8429), e ela reflete as próprias entradas não recomendadas do registro. Ela também reconhece escolhas modernas, incluindo os modos de criptografia autenticada (GCM e ChaCha20-Poly1305) e os grupos de troca de chaves híbridos pós-quânticos construídos sobre o ML-KEM (NIST FIPS 203).

## Como usar

Informe uma suíte de cifra em qualquer forma comum e leia sua troca de chaves, autenticação, cifra, modo e MAC decodificados, seu status de recomendação da IANA e a avaliação de segurança. A decodificação é determinística e inteiramente local.
