## O que faz

Cole um caminho RESTCONF do F5OS e a ferramenta o decodifica segmento a segmento: a raiz da API, os prefixos de módulo YANG, a hierarquia de contêineres e quaisquer chaves de lista, como `tenant=tenant1`. Ela nomeia os módulos que reconhece e diz o que cada um governa. Analisa apenas o texto do caminho: nada é buscado, nenhum schema é consultado e nada sai do navegador.

## Por que um caminho do F5OS precisa ser decodificado

O F5OS, a camada de plataforma sob os tenants no VELOS e no rSeries, é operado por **RESTCONF** (RFC 8040) sobre dados modelados em **YANG**, e não por iControl REST sobre o modelo de objetos do TMOS. Quem tem fluência em `/mgmt/tm/ltm/virtual` esbarra em `/restconf/data/f5-tenants:tenants/tenant=tenant1/config` sem ter como distinguir o que é módulo, o que é contêiner e o que seleciona uma instância. Isso é um problema de vocabulário, não de dificuldade, e é o que esta ferramenta elimina.

## O prefixo de módulo e a convenção de prefixação

`f5-tenants:tenants` é o nó `tenants` no módulo YANG `f5-tenants`. O F5OS usa módulos **OpenConfig**, neutros em relação a fabricante — `openconfig-system`, `openconfig-interfaces`, `openconfig-vlan` — ao lado dos módulos próprios da F5, prefixados com `f5-`. **Apenas o primeiro nó de um módulo leva o prefixo**; os nós abaixo dele são escritos sem prefixo, porque o herdam. Um prefixo que reaparece no meio do caminho significa que o caminho atravessou para outro módulo, e essa é a observação mais útil ao ler um caminho desses.

## Chaves de lista e a dualidade de portas

O RESTCONF endereça uma entrada de lista colocando a chave no próprio caminho — `tenant=tenant1` seleciona um tenant da lista `tenants` — em vez de usar um parâmetro de consulta. A ferramenta marca essas entradas separadamente dos contêineres simples.

Ela também explica o arranjo de portas que confunde: o F5OS originalmente expunha o RESTCONF na **porta 8888**, sob `/restconf`, e a partir do **F5OS 1.8** a mesma API é alcançável na porta HTTPS padrão, sob `/api`. Dois caminhos de aparência diferente podem endereçar o mesmo recurso. A versão é a que consta no próprio DevCentral da F5: um codeshare de dezembro de 2022 sobre automação de backup do F5OS registra que, a partir do F5OS 1.8, a forma `:8888/restconf` pode ser substituída por `:443/api`; as notas de versão do F5OS-A 1.8.0 trazem a correção correspondente, 1572137-2, para a API de upload e download funcionar com `/api` e com `/restconf`. Os guias de automação de rSeries e VELOS da F5 documentam as duas portas de entrada sem nomear versão. A autenticação usa o header `X-Auth-Token`, e esse token é ele próprio um JWT, portanto expira.

## O que ela não faz

A tabela de módulos é finita e deliberadamente curta. Se um caminho usar um módulo que a ferramenta não conhece, ela decodifica a estrutura e **diz que o módulo não é reconhecido, em vez de descrevê-lo por palpite**. Ela também não valida nada contra um schema, porque não tem nenhum: não consegue dizer se um nó existe na sua versão do F5OS, apenas como está construído o caminho que você digitou.

## Como usar

Cole um caminho simples, uma URL completa ou um caminho com query string. Os parâmetros de consulta são separados e mencionados, porque qualificam a requisição em vez de identificar o recurso.

## Compartilhar resultado

Abaixo da visão geral, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva a caixa como foi digitada depois do `#`, e mais nada. O popover dele diz primeiro o que o link leva e depois um aviso próprio: um endereço completo traz o host e a porta de gerenciamento da sua plataforma, então leia antes de mandar o link. Então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

Um endereço também pode ter uma senha antes do `@` (`https://admin:secret@host:8888/...`). A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.2.1, lida em 2026-10-27) declara obsoleto o formato "user:password" no userinfo e diz que as aplicações "should not render as clear text any data after the first colon" (não devem mostrar em texto claro nada depois dos primeiros dois-pontos). Esta página a mostraria como parte do host, então, enquanto o que foi colado tiver uma, não há link; tire-a e clique de novo. Só o nome de usuário (`admin@host`) vai.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-10-27) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o texto não é enviado ao servidor quando o link é aberto; ele fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** O texto preenche a caixa como se tivesse sido colado e a página o lê; nada é enviado a lugar nenhum. O valor então sai do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
