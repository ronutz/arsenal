## O que faz

Cole um trecho de um `bigip.conf` do BIG-IP e a ferramenta o analisa e explica cada objeto em linguagem simples, junto com a estrutura que os mantém unidos. Ela lê apenas a configuração, inteiramente no seu navegador; não altera nada e não contata nenhum equipamento.

## Como a configuração de um BIG-IP é estruturada

O BIG-IP armazena sua configuração como objetos tmsh, e todos seguem um único formato:

    <módulo> <componente> [<tipo>] <nome> {
        <chave> <valor>
        <chave> { <corpo aninhado> }
        <item-de-lista-solto>
    }

As palavras iniciais posicionam o objeto na hierarquia de módulo e componente do BIG-IP (`ltm virtual`, `ltm pool`, `net vlan` e assim por diante), o nome o identifica e as chaves guardam seus campos. Dentro de um corpo, novas linhas separam entradas, blocos entre chaves podem aninhar em qualquer profundidade, strings entre aspas podem conter espaços, e um `#` inicia um comentário. Uma sequência com barra invertida dentro das aspas aparece como foi escrita: a send string de um monitor traz `\r\n`, e o BIG-IP só troca cada `\r` por um carriage return e cada `\n` por um line feed quando monta a requisição ([F5 K2167](https://my.f5.com/manage/s/article/K2167), lido em 2026-10-27). A ferramenta segue exatamente essa gramática para dividir um trecho em seus objetos e cada objeto em seus campos.

## O que ela explica

Em vez de deixar você reconhecer cada campo, a ferramenta descreve o que os objetos e as configurações comuns significam: o `destination`, o `pool`, os `profiles` e o `source-address-translation` de um virtual server; os `members`, o `monitor` e o `load-balancing-mode` de um pool; e os muitos outros objetos que uma configuração interliga. O resultado é um mapa legível do que uma configuração de fato faz, o que é útil quando você herda um equipamento, revisa uma mudança ou aprende o modelo de objetos.

## A única coisa que não é tmsh

Há uma exceção deliberada. Um objeto `ltm rule` carrega uma iRule em Tcl no seu corpo, e esse corpo é um script, não configuração tmsh. O analisador reconhece isso e captura a iRule literalmente, em vez de tentar analisá-la como objetos e campos, de modo que a sua regra é preservada exatamente como foi escrita, e não corrompida.

## Como usar

Cole um trecho de `bigip.conf`, de um único objeto a um bloco grande, e leia o detalhamento estruturado e explicado. A análise é determinística e local, então também é uma forma segura de ler uma configuração exportada de um equipamento que você não pode ou não deve consultar diretamente.

## Compartilhar resultado

Abaixo do resumo do que foi encontrado, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva a configuração depois do `#` com o valor de cada configuração secreta trocado por `[redacted]`, nunca como foi colado, porque esta página mostra o valor de cada campo. O popover diz primeiro o que o link leva e quantos valores foram trocados, e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

As configurações são `password` (os monitores, [ltm monitor http](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_monitor_http.html): "the password if the monitored target requires authentication"), `passphrase` ([client-ssl](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_profile_client-ssl.html), server-ssl, sys file ssl-key), `secret` ([auth radius-server](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/auth/auth_radius-server.html), auth tacacs, ltm monitor radius), `bind-pw` ([auth ldap](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/auth/auth_ldap.html)), `preshared-key` ([net ipsec ike-peer](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/net/net_ipsec_ike-peer.html)), as communities SNMP `community-name`, `community` e `trap-community` ([sys snmp](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/sys/sys_snmp.html)), e toda configuração cujo nome termina em `-password`, `-passphrase` ou `-secret` (`encrypted-password`, `auth-password`, `privacy-password`, [`cookie-encryption-passphrase`](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_persistence_cookie.html), [`encrypt-cookie-secret`](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_profile_http.html), `proxy-ca-passphrase`); páginas da referência do tmsh da F5, lidas em 2026-10-27. A string `send` de um monitor mantém o texto, menos as credenciais de um header `Authorization` ou `Proxy-Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), seções 11.6.2 e 11.7.2, lidas em 2026-10-27), que também viram `[redacted]`. `none` fica. `[redacted]` é uma palavra só do tmsh, então a cópia é lida como os mesmos objetos, campos e aninhamento: os vetores de compartilhamento da ferramenta conferem que a página que recebe monta a mesma árvore. Nomes, endereços e partições vão como foram colados.

O corpo de uma iRule (`ltm rule`) é Tcl, mostrado aqui ao pé da letra, e vai como foi colado: quando a configuração tem uma, o popover avisa, para você conferir antes se ela tem um token ou uma senha fixos no código. A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-10-27) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então a cópia não é enviada ao servidor quando o link é aberto; ela fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-la.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** A cópia preenche a caixa como se tivesse sido colada e a página a explica. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.

## Ferramentas relacionadas

- Um monitor Scripted (`ltm monitor scripted`) executa um arquivo de linhas send e expect guardado em `/config/eav/`; o [explicador de monitor Scripted do BIG-IP](/tools/bigip-scripted-monitor-explainer) lê esse arquivo e simula a verificação contra uma transcrição do servidor.
- Para coletar a configuração de um BIG-IP por script, o [gerador de scripts Expect](/tools/expect-script-builder) escreve um script de login e execução com um perfil tmsh, que desliga o pager do tmsh com `modify /cli preference pager disabled display-threshold 0`.
