## O que faz

CPython 3.14 de verdade roda no seu navegador. O motor é o Pyodide 314.0.7, a compilação do CPython para WebAssembly feita pelo projeto Pyodide, servida desta mesma origem e fixada por versão e por resumo SHA-256. Você escreve um programa, opcionalmente dá a ele alguma entrada padrão, aperta Executar e lê stdout, stderr e o valor da última expressão, do jeito que um REPL mostraria. Nada do que você digita sai da página: o interpretador vive em um Web Worker no seu dispositivo, não tem rede nem processos, e a política da própria página os recusaria de qualquer forma.

É a primeira ferramenta deste site que executa código que não é do próprio site. Três coisas decorrem disso, e a página diz cada uma em voz alta em vez de escondê-las:

- **Um download acontece, uma vez, quando você autorizar.** O motor tem cerca de 13,5 MB em cinco arquivos. A página abre com o editor e um exemplo, mas sem o motor; um botão, que diz o tamanho, inicia o download com uma barra de progresso. O navegador guarda os arquivos em cache (eles são versionados e marcados como imutáveis), então uma segunda visita não custa nada.
- **Um motor de terceiros roda.** As verificações do próprio site cobrem o arcabouço em volta dele: a pré-verificação, os limites, os exemplos (executados de novo no motor real a cada construção) e os resumos dos arquivos fixados. O comportamento do interpretador é do projeto Pyodide.
- **A biblioteca padrão é o que está disponível.** A distribuição do Pyodide oferece 357 pacotes (numpy, pandas, requests e os demais); nenhum deles é carregado nesta versão. Quarenta módulos da biblioteca padrão estão ausentes da compilação WebAssembly (tkinter, curses, pwd, grp, readline, entre outros) e a pré-verificação os nomeia se você importar algum.

## A pré-verificação

Antes de qualquer coisa ser enviada ao motor, o texto do programa é lido (nunca executado) e você fica sabendo o que não vai funcionar aqui e por quê, nos termos do próprio motor:

- um import de módulo da biblioteca padrão que falta nesta compilação, com o erro que o motor lança;
- um import de pacote que a distribuição do Pyodide oferece, mas que esta versão não carrega, nomeado pelo nome do pacote (PIL é Pillow, yaml é pyyaml);
- um import de algo que ninguém consegue instalar aqui, ou um import relativo, que não tem pacote ao qual ser relativo;
- módulos de rede (socket, urllib, http, requests...) e de processos (subprocess, multiprocessing, os.system), que o Emscripten recusa;
- zoneinfo, que não encontra banco de fusos horários aqui e lança ZoneInfoNotFoundError;
- input() com a caixa de entrada vazia, que lança EOFError na primeira leitura;
- um time.sleep maior que o limite de relógio, um while True sem fim, módulos cuja saída muda entre execuções (random, time, uuid, datetime.now);
- arquivos, que vivem na memória do motor e somem com a execução; um programa que não imprime nada (o valor da última expressão aparece no lugar); tabulações e espaços misturados na indentação.

Os itens marcados como erro bloqueiam a execução; o resto são notas.

## Limites

- Programa: 20.000 caracteres. Entrada padrão: 20.000 caracteres.
- Relógio: 30 segundos por execução. No limite, o Worker é encerrado e um novo é iniciado a partir dos arquivos em cache.
- Saída: 200.000 caracteres por fluxo, depois cortada e marcada.
- Parar encerra o Worker de imediato (a única forma de interromper Python síncrono sem um buffer de interrupção com isolamento de origem cruzada, que este site estático não carrega) e inicia um novo.
- Cada execução começa em um namespace global novo com `__name__` igual a `"__main__"`, então execuções não vazam variáveis umas para as outras e o idioma do main-guard funciona.

## Entrada padrão

A caixa de entrada alimenta `input()` e `sys.stdin`, uma linha por leitura, depois fim de arquivo. Uma quebra de linha final não acrescenta linha vazia. `for line in sys.stdin:` lê tudo.

## Os exemplos

Doze programas escritos para quem este site atende: dividir um /24 em /26, agregar prefixos, máscaras e wildcards em binário, um EUI-64 modificado a partir de um MAC, um cabeçalho DNS montado com struct, HMAC-SHA256 em hex e base64url, estatísticas de latência com p95 e jitter, tempos de transferência em três taxas de linha, uma contagem de syslog por severidade a partir de texto de log colado, linhas lidas da caixa de entrada, campos extraídos de uma resposta de API e a última expressão sozinha. A saída exata deles é registrada como vetores de ouro e medida de novo no motor real sob Node a cada construção; uma atualização do motor que mude qualquer um deles derruba a construção e é examinada de propósito.

## O que a API não faz

Esta ferramenta não é exposta na API HTTP. Executar Python arbitrário em infraestrutura compartilhada seria execução remota de código; o motor roda só no seu navegador. A pré-verificação é um apoio didático em volta do editor, não um contrato estável.

## Fontes

A documentação do Pyodide (páginas de web worker e de fluxos padrão, versão 314.0.7), o package.json, o pyodide-lock.json e as tipagens do próprio pacote no registro npm, a documentação do CPython 3.14 para os módulos que os exemplos usam, a RFC 1035 seção 4.1.1, a RFC 4291 Apêndice A e a RFC 5424 seção 6.2.1 para a aritmética dos exemplos, e a MDN para o Worker de módulo e a lista de fontes da Content Security Policy. Tudo lido em 2026-10-04 e listado na página da ferramenta.
