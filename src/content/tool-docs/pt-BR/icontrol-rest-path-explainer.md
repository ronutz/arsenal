## O que faz

Cole uma URL do iControl REST e a ferramenta a decodifica: o módulo do TMOS, a coleção, o caminho de partição e pastas codificado com til junto do seu equivalente em `tmsh`, qualquer subcoleção como os members de um pool, e as opções de consulta. Analisa apenas o texto da URL — nada é buscado e nada sai do navegador.

## O til

`/mgmt/tm/ltm/pool/~Common~apps~web_pool` endereça `/Common/apps/web_pool`. O til é um separador de pastas, usado porque **a URL já usa a barra para a sua própria estrutura**. A ferramenta sempre mostra a forma `tmsh` ao lado das partes decodificadas, porque é a forma que a maioria dos leitores já conhece.

## O detalhe de partição que gera 404

Um nome escrito sem partição é resolvido **na partição atual de quem chamou**. A mesma requisição pode funcionar para um administrador e retornar 404 para outro, sem que nada esteja errado. A ferramenta avisa sempre que o nome do objeto vem sem qualificação.

## Opções de consulta

`$select`, `$filter`, `$top`, `$skip`, `expandSubcollections`, `options` e `ver` são explicadas individualmente. A que vale conhecer é **`expandSubcollections`**: sem ela, um pool volta sem members, que é a surpresa mais comum desta API.

## O que ela não faz

A tabela de módulos é finita. Se um caminho usar um módulo que a ferramenta não conhece, ela decodifica a estrutura e **diz que o módulo não é reconhecido, em vez de descrevê-lo por palpite**. Não valida nada contra um equipamento e não pode dizer se o objeto existe.

## A ferramenta companheira

O explicador de caminhos RESTCONF do F5OS decodifica a camada de plataforma sob um tenant, que usa RESTCONF sobre YANG em vez deste modelo de objetos. As duas APIs não se parecem porque vêm de tradições diferentes, não de versões diferentes.
