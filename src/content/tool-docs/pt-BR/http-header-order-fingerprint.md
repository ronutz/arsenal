## O que faz

Cole um bloco bruto de cabeçalhos de requisição HTTP - uma linha de requisição e um "Nome: valor" por linha - e a ferramenta explica como a ordem e a caixa dos cabeçalhos identificam o cliente. Ela classifica o remetente como um navegador da família Chromium, Firefox ou uma biblioteca HTTP, comparando a sequência de cabeçalhos e verificando cabeçalhos exclusivos de navegador como Sec-Fetch e Sec-CH-UA, aponta o sinal de minúsculas do HTTP/2 e lista os cabeçalhos comuns de navegador que estejam ausentes.

## O análogo em HTTP passivo do JA3

O JA3 identifica um cliente TLS pela ordem das cifras e extensões no seu ClientHello. A ordem dos cabeçalhos é a mesma ideia uma camada acima: navegadores, bibliotecas e bots emitem cada um os cabeçalhos de requisição numa sequência característica, e essa sequência sobrevive mesmo quando os valores são forjados. Uma requisição cuja ordem de cabeçalhos contradiz o User-Agent que afirma - o UA do Chrome com o conjunto de cabeçalhos do curl - é um indício clássico de bot, e é por isso que sistemas de detecção de bots e WAFs se baseiam nela.

## Lendo o resultado

O hash da ordem é um id curto e estável para a sequência exata de cabeçalhos, exibido apenas para visualização. As notas por cabeçalho explicam por que cada posição importa; a nota de caixa sinaliza se o bloco parece uma captura HTTP/1.1 (Title-Case) ou HTTP/2 (minúsculas no fio). Apenas decodifica/explica; os cabeçalhos que você cola nunca saem do seu navegador.
