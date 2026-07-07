## O que faz

Cole um arquivo Proxy Auto-Config (PAC) e isto o lê de volta sem nunca executá-lo: as diretivas de proxy que ele pode retornar, as funções auxiliares PAC que usa, um conjunto de verificações de estrutura e correção, e se ele parece um arquivo de direcionamento do Netskope Cloud Explicit Proxy. Um arquivo PAC é a pequena função JavaScript, `FindProxyForURL(url, host)`, que um navegador ou cliente de encaminhamento chama a cada requisição para decidir se vai direto ou através de um proxy. Esta ferramenta explica essa lógica de decisão. Roda inteiramente no seu navegador e é fundamentada na referência PAC da MDN e na documentação de Explicit Proxy da Netskope.

## Nunca executa o arquivo

Esta é a propriedade de segurança importante. A ferramenta não avalia o JavaScript do PAC. Ela lê o texto lexicamente: percorre o código caractere por caractere para balancear chaves e parênteses (ignorando o que estiver dentro de strings e comentários), coleta os literais de string para encontrar as diretivas de proxy e conta os nomes das funções auxiliares chamadas. Nunca chama `eval`, nunca executa `FindProxyForURL`, nunca abre um socket e nunca busca nada.

## As diretivas de proxy

Cada string de retorno em um arquivo PAC é uma ou mais diretivas separadas por ponto e vírgula, tentadas da esquerda para a direita como failover. A ferramenta extrai cada string de retorno e explica suas partes: `DIRECT` (conectar direto ao destino, sem proxy), `PROXY host:porta` (usar aquele proxy HTTP), `SOCKS host:porta` (usar aquele servidor SOCKS) e as palavras mais novas `HTTP`, `HTTPS`, `SOCKS4` e `SOCKS5` para um tipo específico de proxy. Uma string como `PROXY p1:8080; PROXY p2:8080; DIRECT` é sinalizada como uma cadeia de failover, e uma parte que não seja uma das palavras válidas (um erro de digitação comum) é apontada.

## As funções auxiliares

Arquivos PAC decidem usando um conjunto fixo de funções auxiliares, e a ferramenta explica cada uma que encontra e, principalmente, sinaliza as três que forçam uma consulta DNS: `isInNet`, `isResolvable` e `dnsResolve`. Estas consultam o servidor DNS e podem bloquear, então a MDN recomenda colocar verificações de string mais baratas como `isPlainHostName` e `dnsDomainIs` primeiro, e só chegar às auxiliares que consultam DNS quando nada mais tiver decidido. A ferramenta também nota as arestas que a documentação aponta: `shExpMatch` usa curingas de shell-glob (`*` e `?`), não expressões regulares; `myIpAddress` pode ser não confiável em máquinas com várias interfaces e pode cair em um endereço de loopback; e navegadores modernos baseados em Chromium removem o caminho e a query de URLs `https://` antes de chamar o PAC, então casar pelo caminho de uma URL HTTPS pode não funcionar.

## Reconhecimento da Netskope

Quando o arquivo aponta o tráfego para um host de proxy explícito `goskope.com` (tipicamente `eproxy-<tenant>.goskope.com` na porta 8081), a ferramenta o reconhece como um arquivo de direcionamento do Netskope Cloud Explicit Proxy e explica o padrão: hostnames simples e hosts de provedor de identidade são retornados como `DIRECT` para contornar o proxy, a Netskope usa surrogates de cookie para a identidade do usuário, o placeholder do tenant deve ser substituído pelo seu tenant real, e a CA raiz da Netskope deve ser confiável no cliente para que a inspeção TLS funcione.

## Escopo e fundamentação

Isto analisa e explica; nunca avalia o arquivo, abre um socket ou busca nada, e a mesma entrada sempre produz a mesma saída. É um leitor estrutural e lexical, não um analisador completo de JavaScript nem um ambiente de teste de PAC: não vai lhe dizer para qual proxy uma URL específica resolve (isso exigiria executar a função). Cada fato vem da referência Proxy Auto-Configuration da MDN, do artigo de proxy auto-config da Wikipedia para as extensões auxiliares IPv6 da Microsoft, e da documentação do Cloud Explicit Proxy da Netskope. Nada do que você cola sai da página.
