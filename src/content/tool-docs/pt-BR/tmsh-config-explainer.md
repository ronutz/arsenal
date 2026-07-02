## O que faz

Cole um trecho de um `bigip.conf` do BIG-IP e a ferramenta o analisa e explica cada objeto em linguagem simples, junto com a estrutura que os mantém unidos. Ela lê apenas a configuração, inteiramente no seu navegador; não altera nada e não contata nenhum equipamento.

## Como a configuração de um BIG-IP é estruturada

O BIG-IP armazena sua configuração como objetos tmsh, e todos seguem um único formato:

    <módulo> <componente> [<tipo>] <nome> {
        <chave> <valor>
        <chave> { <corpo aninhado> }
        <item-de-lista-solto>
    }

As palavras iniciais posicionam o objeto na hierarquia de módulo e componente do BIG-IP (`ltm virtual`, `ltm pool`, `net vlan` e assim por diante), o nome o identifica e as chaves guardam seus campos. Dentro de um corpo, novas linhas separam entradas, blocos entre chaves podem aninhar em qualquer profundidade, strings entre aspas podem conter espaços, e um `#` inicia um comentário. A ferramenta segue exatamente essa gramática para dividir um trecho em seus objetos e cada objeto em seus campos.

## O que ela explica

Em vez de deixar você reconhecer cada campo, a ferramenta descreve o que os objetos e as configurações comuns significam: o `destination`, o `pool`, os `profiles` e o `source-address-translation` de um virtual server; os `members`, o `monitor` e o `load-balancing-mode` de um pool; e os muitos outros objetos que uma configuração interliga. O resultado é um mapa legível do que uma configuração de fato faz, o que é útil quando você herda um equipamento, revisa uma mudança ou aprende o modelo de objetos.

## A única coisa que não é tmsh

Há uma exceção deliberada. Um objeto `ltm rule` carrega uma iRule em Tcl no seu corpo, e esse corpo é um script, não configuração tmsh. O analisador reconhece isso e captura a iRule literalmente, em vez de tentar analisá-la como objetos e campos, de modo que a sua regra é preservada exatamente como foi escrita, e não corrompida.

## Como usar

Cole um trecho de `bigip.conf`, de um único objeto a um bloco grande, e leia o detalhamento estruturado e explicado. A análise é determinística e local, então também é uma forma segura de ler uma configuração exportada de um equipamento que você não pode ou não deve consultar diretamente.
