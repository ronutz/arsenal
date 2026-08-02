## O que faz

Você está olhando um evento do WAF, ou uma linha de log da aplicação, e nela aparece algo como `%{(#_memberAccess["allowStaticMethodAccess"]=true)...}`. Esta ferramenta lê essa string e diz o que ela pretendia fazer: quais construções estão presentes, se elas equivalem a desligar o sandbox de expressões, executar um comando, ambos ou nenhum, e com qual família de boletim publicado o formato é compatível. Roda inteiramente no seu navegador e nunca avalia qualquer parte do que você cola.

## O que não é

É um decodificador. Lê cargas que já chegaram a algum lugar e as explica. Não constrói cargas, não sugere variações da que você colou e não guarda biblioteca de modelos - tudo que reconhece é sintaxe pública, documentada nos próprios boletins de segurança da Apache e visível nos logs de qualquer um que mantenha um servidor web na internet. Explicar um artefato capturado é a metade defensiva do trabalho. Produzir novos não é o propósito deste site, e a ferramenta foi construída de modo que ler seu código-fonte não dê nada que o boletim já não dê.

## OGNL, em um parágrafo

Object-Graph Navigation Language é uma linguagem de expressão para ler e escrever propriedades de objetos Java. Existe para que um framework permita que a configuração alcance uma aplicação em execução: buscar esta propriedade, chamar aquele método, formatar o resultado. Isso é genuinamente útil, e é também o problema inteiro: uma expressão capaz de chamar métodos em objetos vivos só é segura enquanto as expressões avaliadas tiverem sido escritas por alguém de confiança. O Apache Struts passou vários anos corrigindo uma família de falhas que compartilhavam um mesmo formato, em que entrada fornecida pelo atacante chegava a um avaliador que a tratava como configuração.

## As duas metades que a ferramenta procura

Uma tentativa funcional contra a família Struts precisava de duas coisas, e a ferramenta as reporta separadamente porque a diferença diz com o que você está lidando. A primeira é a fuga do sandbox: a OGNL restringe o que uma expressão pode tocar, por meio de um objeto chamado `_memberAccess`, e a fuga consiste em alcançar esse objeto e desligar suas restrições. A segunda é a primitiva de execução, normalmente uma chamada ao objeto `Runtime` da JVM seguida de `exec`, que inicia um processo do sistema operacional.

Uma carga com as duas é tentativa real de exploração e merece tratamento completo: apurar se a requisição foi bloqueada, o que a aplicação fez com ela e se o runtime estava corrigido. Uma carga só com a chamada de execução é bem mais comum e bem menos alarmante, porque num runtime corrigido essa chamada é simplesmente recusada - em geral significa que um scanner está percorrendo uma lista, não que alguém olhou para a sua aplicação. Uma carga com sintaxe de expressão e nada mais costuma ser sondagem, verificando se a entrada é avaliada antes de enviar algo caro. Essa resposta importa mais do que parece: se for não, nada do resto da lista vai funcionar também.

## Famílias de boletim

Onde o formato é característico, a ferramenta nomeia a família: a falha de 2017 no parser multipart, em que o próprio cabeçalho `Content-Type` era avaliado quando a análise falhava; a família mais ampla de acesso a membros, cujas correções apertaram repetidamente o que uma expressão podia alcançar; e a questão de 2018 em que valores de namespace e de resultado eram avaliados, tornando um caminho de URL um vetor de execução. São reportadas como compatíveis com a carga, não como identificação, porque várias compartilham formato e uma carga prova o que foi tentado, não o que estava presente.

## O que deliberadamente não diz

Três coisas, exibidas sempre em vez de escondidas atrás de um botão, porque a leitura mais perigosa desta página é ver nenhum achado e concluir que está tudo bem.

Não diz se a requisição foi bloqueada - isso está no evento do WAF, não na carga. Não diz se a aplicação avaliou a expressão, o que depende da versão e da configuração do framework, não da string. E ausência de construção reconhecida não é ausência de risco: cargas são rotineiramente codificadas em URL, duplamente codificadas ou divididas entre parâmetros, então decodifique primeiro e leia depois. Um resultado limpo numa carga codificada significa que a ferramenta leu a codificação, não o ataque.
