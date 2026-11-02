# Explicador de decisão de encaminhamento do ZCC

Cole uma postura do Zscaler Client Connector - o estado de rede detectado, a ação de encaminhamento de ZIA, a versão de Z-Tunnel, opcionalmente a ação de ZPA - e leia de volta a espinha de decisão documentada, camada por camada, exatamente como a arquitetura de referência e o portal de ajuda do fornecedor a descrevem.

## Por que um explicador, e não um simulador

Esta ferramenta existe na forma que sua cláusula de ratificação especificou, e a razão vem declarada aqui antes de qualquer outra coisa. O passe de verificação (2026-07-21, contra a arquitetura de referência Secure Mobile Access with Zscaler Client Connector e o help.zscaler.com) encontrou a **espinha** de decisão publicamente documentada de ponta a ponta: como o estado de rede confiável é determinado, o que cada uma das quatro ações por estado do ZIA faz, o que cada versão de Z-Tunnel captura, o failover automático de Z-Tunnel 2.0 para 1.0, o web-split híbrido, e as duas ações do ZPA. Essa espinha é determinística, e esta ferramenta a computa.

O que **não** é publicado é uma ordem única de precedência para a camada de bypass. Os mecanismos são documentados um a um - Application Bypass, Destination e Domain Exclusions e Inclusions, VPN Gateway Bypass, o PAC do app profile, o PAC do forwarding profile com sua macro de bypass do Z-Tunnel 2.0 - mas quando vários deles tratam do mesmo fluxo, a Zscaler publica receitas, não uma matriz de resolução de conflitos. Um simulador teria que inventar essa matriz. Esta ferramenta se recusa: ela apresenta cada mecanismo documentado como um livro-razão explicado e não adjudica nada. A mesma regra de não-invenção das demais ferramentas deste site.

## Gramática de entrada

Uma configuração por linha, `chave = valor`. Linhas começando com `#` são comentários.

- `network` - trusted | vpn | off-trusted (obrigatória)
- `zia-action` - tunnel | twlp | enforce-proxy | none (obrigatória)
- `tunnel` - zt2 | zt1 (apenas com as ações de tunelamento)
- `web-split` - on | off (o modo híbrido documentado do Z-Tunnel 2.0)
- `zpa-action` - tunnel | none (opcional)

## O que você recebe de volta

A espinha aparece como cartões em camadas: o estado de rede com os critérios de detecção documentados (DNS Server e Search Domains recomendados como os mais estáticos, correspondência ANY/ALL, a exclusividade das Pre-Defined Trusted Networks, e o modo de falha documentado da resolução dinâmica); o significado documentado da ação de ZIA; a semântica de Z-Tunnel para a sua escolha - o túnel proxy web-apenas 80/443 do Z-Tunnel 1.0 versus a captura de todas as portas em DTLS/TLS do Z-Tunnel 2.0, com o failover automático e, quando habilitado, o web-split híbrido; e a camada de ZPA, com sua decisão deliberadamente menor de duas ações. Abaixo da espinha ficam o livro-razão de bypass e as notas permanentes, incluindo a própria tabela de recomendações da arquitetura de referência (Trusted = None, VPN = Tunnel with Local Proxy, Off-Trusted = Tunnel, Z-Tunnel 2.0) e as camadas de fail-open/fail-close.

Tudo roda localmente no seu navegador; nada do que você cola sai da página.

## Compartilhar resultado

Logo no começo da leitura, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva as configurações como foram coladas depois do `#`. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

Cada configuração é uma de poucas escolhas documentadas, sem endereço, host, usuário ou chave, então o popover não traz uma linha de cuidado própria. Antes de oferecer um link, a caixa é verificada em busca de uma credencial que um padrão define: uma chave privada PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), seção 10), uma linha `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), seção 11.6.2), uma linha `Cookie` com valor ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), seção 4.2.1), um JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), seção 1), uma senha numa URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), seção 3.2.1), um access key ID da AWS ou um valor `ENC` do FortiOS; todos lidos em 2026-11-01. A gramática não tem lugar para nenhum deles, mas uma linha de comentário é texto livre. Qualquer um deles significa sem link: o popover diz a linha, e você troca o valor por um placeholder e clica de novo. Um valor cujo nome só parece de segredo não impede o link; o popover cita o primeiro.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** A caixa é preenchida como se tivesse sido colada e a página percorre a espinha. Nada é contatado. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.

## Fontes

- Zscaler Reference Architecture: Secure Mobile Access with Zscaler Client Connector - os estados, ações, critérios, semântica de túnel, failover e tabela de recomendações
- Zscaler Help: About Z-Tunnel 1.0 & Z-Tunnel 2.0
- Zscaler Help: Best Practices for Adding Bypasses for Z-Tunnel 2.0 - a divisão de trabalho entre os dois PACs
- Zscaler Help: Configuring Forwarding Profiles for Zscaler Client Connector

A regra do fragmento por trás do Compartilhar resultado é a [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), seção 3.5 (lida em 2026-11-01), e as credenciais que a verificação procura são definidas na RFC 7468, na RFC 9110, na RFC 6265 e na RFC 7519 (lidas no mesmo dia).
