## O que faz

Cole XML e a ferramenta o analisa em uma estrutura legível: a declaração XML, o DOCTYPE e quaisquer entidades que ele declare, e a árvore de elementos completa com seus namespaces e atributos, junto com CDATA, comentários e instruções de processamento. Ela verifica se o documento é bem-formado e roda uma análise de segurança da superfície de ataque do XML. Ela não busca nada e não resolve nada.

## O que ela mostra

O XML reúne vários tipos de nó em um documento, e a ferramenta os separa: a **declaração** com sua versão e codificação; o **DOCTYPE** e quaisquer **entidades** que ele define; a **árvore de elementos**, com os **namespaces** (as ligações `xmlns`) e os **atributos** mostrados por elemento; e as seções **CDATA**, os **comentários** e as **instruções de processamento**. Ela também verifica a boa formação no sentido do XML: que toda tag está fechada corretamente e que o documento tem exatamente um elemento raiz.

## A superfície de ataque do XML

O XML é poderoso de um jeito que o torna perigoso quando vem de uma fonte não confiável, e a análise de segurança da ferramenta sinaliza exatamente onde esse perigo mora:

- **Um DOCTYPE, para começar**, porque a definição de tipo de documento é o que habilita o resto;
- **Entidades externas**, que podem puxar um arquivo local ou uma URL e são o mecanismo dos ataques de XML External Entity (XXE);
- **Entidades de parâmetro**, uma forma usada para passar XXE por defesas ingênuas; e
- **Expansão de entidades**, o aninhamento por trás do ataque de negação de serviço billion laughs.

Ver essas coisas destacadas é o ponto: isso diz se um determinado documento está tentando fazer algo que um documento de dados simples nunca faria.

## Segura por construção

A ferramenta é um tokenizador de texto, não um processador de XML. Ela lê o documento como texto e descreve sua estrutura, e nunca resolve uma entidade, nunca abre uma referência externa e nunca expande nada. É isso que a permite analisar XML hostil com segurança: os próprios recursos sobre os quais ela avisa são descritos, não executados. Esta é a contraparte de propósito geral do decodificador SAML, que recusa uma DTD por completo porque uma mensagem SAML nunca legitimamente tem uma.

## Como usar

Cole um documento XML e leia sua declaração, DOCTYPE e entidades, árvore de elementos e os sinalizadores de segurança. A análise é determinística e local, então é seguro inspecionar XML de qualquer fonte.
