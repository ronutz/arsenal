## O que faz

Cole um comando `curl` e a ferramenta o explica sinalizador por sinalizador, depois o traduz para quatro outras formas: uma chamada `fetch` de navegador, uma requisição HTTP crua, um comando HTTPie e código Python `requests`. O comando é tokenizado e decodificado no seu navegador; nada é jamais enviado, e nenhuma requisição é executada.

## Uma análise, cinco visões

Por baixo há um único passo: a ferramenta analisa seu comando `curl` em um único modelo de requisição, capturando o método, a URL, os cabeçalhos, o corpo, a autenticação e as demais opções. Tudo o que você vê é derivado desse único modelo. Como traduzir um comando corretamente já exige entender cada sinalizador, a explicação sinalizador por sinalizador é justamente esse mesmo modelo exibido com rótulos, e é por isso que a explicação e as traduções sempre concordam.

## As formas que ela produz

- **curl explicado.** Cada opção é nomeada e descrita, para que um sinalizador desconhecido deixe de ser um mistério.
- **fetch.** A chamada da Fetch API do navegador, seguindo a semântica da MDN, pronta para colar no JavaScript.
- **HTTP cru.** A linha de requisição, os cabeçalhos e o corpo de fato, como iriam para a rede, que é a forma mais clara de ver exatamente o que uma requisição é.
- **HTTPie.** O comando `http` equivalente, para quem prefere esse cliente.
- **Python requests.** O código equivalente usando a biblioteca Requests.

## Por que traduzir em vez de executar

A ferramenta deliberadamente nunca executa a requisição. Essa é uma escolha de privacidade e segurança: você pode decodificar e converter um comando que carrega credenciais ou aponta para um host interno sem que nada disso saia do seu navegador, e sem disparar o que quer que a requisição faria. Ela é uma tradutora e uma explicadora, não um cliente.

## Como usar

Cole um comando `curl` e leia a explicação sinalizador por sinalizador e as quatro traduções. A conversão é determinística e local, então o mesmo comando sempre produz a mesma saída.
