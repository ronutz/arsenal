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

Para conferir o que um cliente realmente negocia com um virtual server que usa o perfil, rode `openssl s_client` contra o virtual server e cole a saída no [explicador do openssl s_client](/tools/openssl-s-client-explainer); a cipher string do perfil é lida pelo [explicador de cipher string do F5](/tools/f5-cipher-string-expander).

## Compartilhar resultado

Abaixo do tipo e do papel do perfil, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva o perfil depois do `#` com o valor de cada configuração `passphrase` e `proxy-ca-passphrase` trocado por `[redacted]`, nunca como foi colado; as referências de [client-ssl](https://clouddocs.f5.com/api/icontrol-rest/APIRef_tm_ltm_profile_client-ssl.html) e [server-ssl](https://clouddocs.f5.com/api/icontrol-rest/APIRef_tm_ltm_profile_server-ssl.html) do F5 (lidas em 2026-10-27) chamam essas configurações de passphrase da chave e passphrase da chave da CA do SSL Forward Proxy. O popover dele diz primeiro o que o link leva e quantos valores foram trocados, e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

Esta página também nunca mostra esses valores, então a página que recebe lê o mesmo perfil. `passphrase none` fica, e também ficam nomes, partições, objetos de arquivo e nomes de host. A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-10-27) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então a cópia não é enviada ao servidor quando o link é aberto; ela fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-la.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** A cópia preenche a caixa como se tivesse sido colada e a página a explica. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
