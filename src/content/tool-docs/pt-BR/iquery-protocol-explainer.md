## O que faz

Cole a saída do comando `iqdump` do F5, linhas do `/var/log/gtm`, ou o nome de um tópico, e a ferramenta explica o protocolo iQuery da F5 sem tocar em nenhum equipamento. O iQuery é o protocolo proprietário, baseado em XML, que o BIG-IP DNS (antigo GTM) usa para conversar com o agente `big3d` nele mesmo e em cada outro BIG-IP que conhece. A ferramenta decodifica o que você cola e explica a arquitetura por trás disso. Ela decodifica e explica inteiramente no seu navegador, fundamentada na própria documentação de BIG-IP DNS/GTM da F5.

## Decodificação da saída do iqdump

O `iqdump` transmite ao vivo os dados iQuery entre dois sistemas para você verificar o caminho e a autenticação SSL. Cole a saída e a ferramenta lê de volta as linhas de comentário do header, o hostname local de onde você o executou, o par `big3d` ao qual se conectou e a porta (4353), o grupo de sincronização assinado e o horário, e então os campos da seção `<xml_connection>` como `version`, a string de build do `big3d` e `connection_id`. Cada campo é explicado, e a presença de uma linha de par `big3d` é destacada como prova de que o caminho TCP e a confiança SSL até aquele agente estão funcionando, pois um caminho quebrado faz o `iqdump` reportar um erro.

## Decodificação de linhas do /var/log/gtm

O processo `gtmd` registra a saúde da malha iQuery no `/var/log/gtm`. Cole essas linhas e a ferramenta decodifica as mensagens de mudança de estado da caixa, por exemplo uma transição `green --> red` que significa que um BIG-IP ficou indisponível pelo iQuery, junto com as entradas `SNMP_TRAP` e as mensagens de conexão `big3d` estabelecida/perdida. Uma transição `green --> red` é sinalizada com o que verificar em seguida: o caminho iQuery (TCP 4353, confiança SSL) até aquela caixa, e se o `big3d` dela está rodando e com versão compatível.

## Explicação da arquitetura

Digite ou clique em um tópico e a ferramenta o explica nos termos da F5: a malha iQuery de conexões de longa duração, a porta TCP 4353, a confiança baseada em certificado SSL que o `bigip_add`, o `big3d_install` e o `gtm_add` estabelecem, o próprio comando `iqdump`, o que o iQuery transporta (a disponibilidade dos objetos mais as métricas de balanceamento que o GSLB dinâmico precisa), os agentes `gtmd` e `big3d`, e a regra de VLAN de que o iQuery é enviado apenas na VLAN pela qual o sistema o recebe.

## Compartilhar resultado

No topo da leitura, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva a caixa como foi digitada depois do `#`, e mais nada. O popover dele diz primeiro o que o link leva e depois um aviso próprio: a saída pode trazer os nomes dos seus BIG-IPs, self IPs e versões, então leia antes de mandar o link. Então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

O índice de tópicos não é um resultado: enquanto ele aparece (caixa vazia, `list`, ou um texto que a ferramenta não reconhece), o botão fica desativado. Nem a saída do `iqdump` nem essas linhas de log trazem credenciais: a confiança do iQuery está nos certificados que os sistemas trocam.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-10-27) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o texto não é enviado ao servidor quando o link é aberto; ele fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** O texto preenche a caixa como se tivesse sido colado e a página o lê; nada é enviado a lugar nenhum. O valor então sai do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.

## Escopo e fundamentação

Ela explica e decodifica; nunca abre um socket, executa o `iqdump` ou busca nada, e a mesma entrada sempre produz a mesma saída. Ela lê o formato do texto do `iqdump` e dos logs, em vez de validar uma troca iQuery inteira. Todo fato vem dos manuais de conceitos e implementações de BIG-IP DNS/GTM da F5, do guia de operações LTM-DNS e dos artigos K sobre confiança e troubleshooting do iQuery; o exemplo é uma amostra real de `iqdump` publicada pela F5. Note que o módulo Link Controller foi removido no BIG-IP 21.0.0. Nada do que você cola sai da página.
