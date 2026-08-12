## O que faz

Cole um caminho RESTCONF do F5OS e a ferramenta o decodifica segmento a segmento: a raiz da API, os prefixos de módulo YANG, a hierarquia de contêineres e quaisquer chaves de lista, como `tenant=tenant1`. Ela nomeia os módulos que reconhece e diz o que cada um governa. Analisa apenas o texto do caminho: nada é buscado, nenhum schema é consultado e nada sai do navegador.

## Por que um caminho do F5OS precisa ser decodificado

O F5OS, a camada de plataforma sob os tenants no VELOS e no rSeries, é operado por **RESTCONF** (RFC 8040) sobre dados modelados em **YANG**, e não por iControl REST sobre o modelo de objetos do TMOS. Quem tem fluência em `/mgmt/tm/ltm/virtual` esbarra em `/restconf/data/f5-tenants:tenants/tenant=tenant1/config` sem ter como distinguir o que é módulo, o que é contêiner e o que seleciona uma instância. Isso é um problema de vocabulário, não de dificuldade, e é o que esta ferramenta elimina.

## O prefixo de módulo e a convenção de prefixação

`f5-tenants:tenants` é o nó `tenants` no módulo YANG `f5-tenants`. O F5OS usa módulos **OpenConfig**, neutros em relação a fabricante — `openconfig-system`, `openconfig-interfaces`, `openconfig-vlan` — ao lado dos módulos próprios da F5, prefixados com `f5-`. **Apenas o primeiro nó de um módulo leva o prefixo**; os nós abaixo dele são escritos sem prefixo, porque o herdam. Um prefixo que reaparece no meio do caminho significa que o caminho atravessou para outro módulo, e essa é a observação mais útil ao ler um caminho desses.

## Chaves de lista e a dualidade de portas

O RESTCONF endereça uma entrada de lista colocando a chave no próprio caminho — `tenant=tenant1` seleciona um tenant da lista `tenants` — em vez de usar um parâmetro de consulta. A ferramenta marca essas entradas separadamente dos contêineres simples.

Ela também explica o arranjo de portas que confunde: o F5OS originalmente expunha o RESTCONF na **porta 8888**, sob `/restconf`, e a partir do **F5OS 1.8** a mesma API é alcançável na porta HTTPS padrão, sob `/api`. Dois caminhos de aparência diferente podem endereçar o mesmo recurso. A autenticação usa o cabeçalho `X-Auth-Token`, e esse token é ele próprio um JWT, portanto expira.

## O que ela não faz

A tabela de módulos é finita e deliberadamente curta. Se um caminho usar um módulo que a ferramenta não conhece, ela decodifica a estrutura e **diz que o módulo não é reconhecido, em vez de descrevê-lo por palpite**. Ela também não valida nada contra um schema, porque não tem nenhum: não consegue dizer se um nó existe na sua versão do F5OS, apenas como está construído o caminho que você digitou.

## Como usar

Cole um caminho simples, uma URL completa ou um caminho com query string. Os parâmetros de consulta são separados e mencionados, porque qualificam a requisição em vez de identificar o recurso.
