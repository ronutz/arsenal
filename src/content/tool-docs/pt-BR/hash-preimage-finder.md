## O que faz

Esta é uma ferramenta didática. Ela executa uma busca por força bruta, limitada, no seu navegador, tentando encontrar uma entrada cujo hash corresponda a um resumo alvo. Contra uma entrada fraca, um PIN curto ou algumas letras minúsculas, ela consegue em segundos; contra qualquer coisa com entropia real, esgota seu espaço de chaves limitado e para sem resposta. Esse contraste é justamente o ponto: mostra, na prática, por que um hash rápido e sem sal é uma forma ruim de proteger uma senha, e por que um segredo de alta entropia é seguro mesmo diante de uma busca direta.

## O que é uma pré-imagem e como a busca funciona

Um hash é unidirecional, então não há fórmula que transforme um resumo de volta na sua entrada. A única forma genérica de revertê-lo é adivinhar: escolher um candidato, calcular seu hash e ver se o resumo bate. Este localizador faz exatamente isso. Ele enumera candidatos sobre um alfabeto e um comprimento que você escolhe (dígitos, letras minúsculas e assim por diante) e calcula o hash de cada um localmente até encontrar uma correspondência ou esgotar os candidatos. Não usa dicionário, nem wordlist, nem tabela pré-calculada, então é puramente uma demonstração de busca exaustiva, e não um kit de quebra de senhas.

## Por que entradas fracas caem e as fortes não

O número de candidatos é o tamanho do alfabeto elevado ao comprimento. Um PIN de 4 dígitos são apenas 10^4, ou seja, 10.000 possibilidades, trivialmente pesquisáveis; seis letras minúsculas são 26^6, cerca de 300 milhões, ainda pouco para um computador; mas cada caractere a mais multiplica o espaço, então um segredo realmente aleatório empurra a contagem muito além do que qualquer busca local limitada consegue cobrir. É exatamente por isso que hashes rápidos como MD5 ou SHA-256, que podem ser calculados bilhões de vezes por segundo, são inadequados para senhas, e por que sistemas reais adicionam um sal e usam uma função de derivação de chave deliberadamente lenta, como recomendam o guia de armazenamento de senhas da OWASP e o NIST SP 800-63B.

## O que ela não consegue fazer

Como o espaço de chaves é limitado e não há wordlist, a ferramenta só recupera entradas que já eram sabidamente fracas. Ela não consegue atacar um hash com sal, nem um hash produzido por uma função de derivação de chave lenta como bcrypt, scrypt, Argon2 ou PBKDF2, que são projetadas para tornar cada tentativa cara.

## Como usar

Informe um resumo alvo, ou calcule o hash de uma entrada de exemplo para produzir um, escolha o alfabeto e o comprimento máximo a pesquisar, e observe a busca rodar. Experimente uma entrada numérica curta para vê-la ter sucesso rapidamente, depois aumente o comprimento ou amplie o alfabeto para ver o espaço de chaves ultrapassar a busca.
