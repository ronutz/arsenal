# Explicador de decisão de steering Netskope

Cole uma descrição compacta de uma configuração de steering e um fluxo, e percorra a ordem de decisão documentada até um veredito - **steered**, **bypassed**, **blocked** ou **direct** - com um livro-razão explicando cada checagem no caminho. Isto é um explicador de porquês, não um simulador: cada passo do livro-razão cita comportamento documentado, e onde a documentação pública não publica regra, o livro-razão diz isso em vez de inventar uma.

## A gramática

Linhas chave–valor, uma entrada de decisão por linha:

```
mode: web                     # cloud-apps | web | all
dynamic: on                   # opcional; então mode-on-prem / mode-off-prem (none permitido)
location: off-prem            # on-prem | off-prem
tunnel: up                    # up | down
fail-close: off               # on | off
flow: web app.example.com     # web <host> | app <nome> | non-web <proto/porta> | rfc1918 <ip> | loopback
non-standard-port: ip         # opcional; fqdn | ip - como a porta web não padrão é alcançada
exception: domain *.example.com          # 0+ linhas; tipos: cert-pinned, domain, category, dest-location, firewall-app
flow-matches: domain          # quais tipos de exceção configurados este fluxo casa (ou none)
```

A linha `flow-matches` é honestidade deliberada: se um fluxo real casa uma categoria ou um objeto de localização de destino depende de dados do tenant que esta ferramenta local não enxerga, então você declara o casamento e o motor explica a consequência documentada.

## O que o livro-razão sabe

Os três modos de tráfego e para quem cada um é (Cloud Apps Only para Cloud Inline/CASB-only, Web Traffic para a maioria das organizações, All Traffic para assinantes do Cloud Firewall). O bypass padrão sempre-ligado do espaço RFC1918. As famílias de exceção e seus comportamentos documentados - incluindo o opt-in por perfil da família certificate-pinned, **Steer and decrypt at Netskope Cloud**, o único casamento que direciona em vez de contornar. Os modos por localização do steering dinâmico, incluindo **None**: sem túnel, e exceções não processadas. A divisão documentada do **Fail Close**: exceções por domínio, por IP e cert-pinned continuam aplicadas enquanto exceções por categoria são bloqueadas. E a armadilha da porta não padrão: uma porta configurada por FQDN alcançada por endereço IP é tratada como não-web, com o remédio documentado de configurar ambos.

## Onde ele passa o bastão

Um veredito **steered** é onde a próxima decisão começa - se a sessão é descriptografada pertence à política de TLS, e [o artigo de descriptografia TLS inline](/learn/netskope-inline-tls-decryption) assume exatamente ali. A paisagem de steering em si - Client, proxy explícito e PAC, túneis, proxy reverso - é [o artigo de métodos de steering](/learn/netskope-steering-methods); a camada de PAC tem [seu próprio explicador](/tools/pac-file-explainer).

## Compartilhar resultado

Abaixo do veredito, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva a especificação como foi digitada depois do `#`, assim que a página tem uma decisão. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda. Um fluxo e as exceções dele citam hosts, apps e domínios, e a página de [steering profile](https://docs.netskope.com/en/configure-a-steering-profile) da Netskope (lida em 2026-11-01) tem exceções para tráfego com "personal or private content" (conteúdo pessoal ou privado): o popover pede para você conferir. O livro-razão lê cada linha, então nada é cortado. Antes de oferecer o link, a especificação passa por uma busca de credenciais que um padrão define: uma chave privada PEM, uma linha `Authorization` ou `Proxy-Authorization` com qualquer esquema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), seções 11.6.2 e 11.7.2: o valor "consists of credentials", consiste em credenciais), uma linha `Cookie` ou `Set-Cookie` com valor ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), seção 8.4: os servidores "commonly store a nonce (or "session identifier") in a cookie", costumam guardar num cookie um identificador de sessão), um JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), seção 1), uma senha numa URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), seção 3.2.1), um access key ID da AWS ou um valor `ENC` do FortiOS; todas lidas em 2026-11-01. Qualquer um deles impede o link: o popover diz a linha, e você troca o valor por um placeholder e clica de novo. Um valor cujo nome só parece de segredo (um membro JSON `token`, um `token=` numa query) não impede o link; o popover cita o primeiro para você conferir.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** A especificação preenche a caixa como se tivesse sido colada, e a página a explica. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.

## Fontes

- Docs Netskope: Configure a Steering Profile - modos, bypasses padrão
- Docs Netskope: Creating a Steering Configuration - Fail Close, portas não padrão
- Docs Netskope: Enabling Dynamic Steering - modos por localização, semântica do None
- Docs Netskope: Certificate Pinned Applications - steer-and-decrypt
