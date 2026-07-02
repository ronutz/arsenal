## O que faz

Cole um perfil `client-ssl` ou `server-ssl` do tmsh e a ferramenta o explica: o papel do perfil, a matriz de versões de protocolo TLS que ele habilita e desabilita, e uma análise de segurança cobrindo a cadeia de certificados, a renegociação, o SNI, o OCSP stapling e o TLS mútuo. Ela analisa o perfil inteiramente no seu navegador e nunca contata um equipamento.

## Perfis do lado do cliente e do lado do servidor

Em um BIG-IP, o SSL é tratado por dois tipos de perfil, e a primeira coisa que a ferramenta diz é qual deles é este. Um perfil **client-ssl** termina o TLS vindo do cliente: o BIG-IP apresenta um certificado e descriptografa o tráfego. Um perfil **server-ssl** faz o oposto: ele inicia o TLS em direção ao membro do pool, recriptografando na saída. Uma implantação TLS full-proxy usa os dois, descriptografando do cliente para poder inspecionar ou direcionar o tráfego, e então recriptografando para o servidor. Saber o papel enquadra todo o resto do perfil.

## A matriz de protocolos

Quais versões de TLS um perfil permite é definido por seu campo `options`, que habilita ou desabilita versões específicas. A ferramenta apresenta isso como uma matriz clara para você ver num relance se, por exemplo, o TLS 1.0 e o 1.1, obsoletos pela RFC 8996, ainda estão habilitados, ou se o TLS 1.3 está ligado. Essa é frequentemente a coisa mais importante de verificar em um perfil SSL, e é fácil de ler errado na bitmask bruta de `options`.

## A análise de segurança

Além dos protocolos, a ferramenta avalia as partes do perfil que decidem quão seguro o TLS de fato é:

- o **certificado, a chave e a cadeia**, incluindo se a cadeia está completa;
- a **renegociação**, e se a renegociação segura (RFC 5746) é exigida;
- o **SNI** (RFC 6066), para servir o certificado certo quando vários nomes compartilham o perfil;
- o **OCSP stapling** (a extensão `status_request`, RFC 6066), que permite ao servidor fornecer sua própria prova de revogação; e
- a **validação de certificado de par**, que é como o TLS mútuo é configurado, em que o BIG-IP exige e verifica um certificado do cliente.

Cada um é classificado para que as configurações arriscadas se destaquem das sólidas.

## Como usar

Cole um bloco de perfil `client-ssl` ou `server-ssl` e leia seu papel, sua matriz de protocolos e a avaliação de segurança da cadeia, renegociação, SNI, OCSP e configurações de TLS mútuo. A análise é determinística e local.
