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

## Fontes

- Docs Netskope: Configure a Steering Profile - modos, bypasses padrão
- Docs Netskope: Creating a Steering Configuration - Fail Close, portas não padrão
- Docs Netskope: Enabling Dynamic Steering - modos por localização, semântica do None
- Docs Netskope: Certificate Pinned Applications - steer-and-decrypt
