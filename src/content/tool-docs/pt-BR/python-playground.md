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

Treze programas escritos para quem este site atende: dividir um /24 em /26, agregar prefixos, máscaras e wildcards em binário, um EUI-64 modificado a partir de um MAC, um header DNS montado com struct, HMAC-SHA256 em hex e base64url, estatísticas de latência com p95, jitter e dois desvios-padrão, tempos de transferência em três taxas de linha, uma contagem de syslog por severidade a partir de texto de log colado, linhas lidas da caixa de entrada, campos extraídos de uma resposta de API, o algoritmo de caminho mais curto de Dijkstra em seis roteadores e a última expressão sozinha. A saída exata deles é registrada como vetores de ouro e medida de novo no motor real sob Node a cada construção; uma atualização do motor que mude qualquer um deles derruba a construção e é examinada de propósito.

O exemplo de latência imprime os dois desvios-padrão, cada um com seu rótulo. `statistics.pstdev` devolve "the population standard deviation", o desvio-padrão populacional, que é o que o ping mostra como mdev: a página de manual ping(8) diz "Population standard deviation (mdev)", e o iputils o calcula dividindo a soma dos quadrados dos desvios pelo número de respostas. `statistics.stdev` devolve "the sample standard deviation", o desvio-padrão amostral, que sai maior para as mesmas amostras (8,34 contra 7,99 ms no exemplo). Compare a linha pstdev com o resumo `rtt min/avg/max/mdev` do ping, não a linha stdev.

O exemplo de SPF roda o algoritmo shortest path first (SPF) de Dijkstra a partir do roteador R1 sobre os seis roteadores e os oito enlaces do [artigo sobre Dijkstra](/learn/dijkstra-and-the-twenty-minute-algorithm), com uma lista de candidatos em `heapq`, e imprime cada passo na ordem que a RFC 2328, seção 16.1, descreve: "the paths to the candidate vertex that is closest to the root are guaranteed to be shortest" (os caminhos até o candidato mais próximo da raiz são garantidamente os mais curtos), então esse roteador entra na árvore e os enlaces dele são examinados; um caminho mais curto substitui o custo e os next hops de um candidato, um caminho de mesmo custo soma os next hops dele aos já listados, e a execução termina quando a lista de candidatos fica vazia. No fim aparecem o custo, os next hops e os pais de cada roteador, e a ordem em que os custos se tornaram definitivos (R1 R3 R2 R4 R5 R6), que é a ideia de Dijkstra em 1959 nas palavras dele: "the minimal paths from P to the other nodes are constructed in order of increasing length" (os caminhos mínimos de P até os outros nós são construídos em ordem crescente de comprimento). Candidatos de mesmo custo saem do heap em ordem de nome do roteador, regra que o programa declara em um comentário, então a saída é a mesma em toda execução. Mude um custo (o de R2 a R4, de 1 para 20, por exemplo) e rode de novo para ver os next hops mudarem; o [artigo sobre OSPF](/learn/ospf-primer) trata do protocolo que faz esse cálculo.

## O que a API não faz

Esta ferramenta não é exposta na API HTTP. Executar Python arbitrário em infraestrutura compartilhada seria execução remota de código; o motor roda só no seu navegador. A pré-verificação é um apoio didático em volta do editor, não um contrato estável.

## Compartilhar resultado

Abaixo da barra de execução, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva depois do `#` o programa e a entrada padrão como foram digitados, nunca a saída: quem abre o link executa o programa por conta própria, se quiser. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda. Um programa pode trazer chaves, tokens e nomes internos, então o popover pede que você o leia antes de mandar o link. Antes de oferecer um link, o texto é verificado em busca de uma credencial que um padrão define: uma chave privada PEM, uma linha `Authorization` ou `Proxy-Authorization` com qualquer esquema ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), seções 11.6.2 e 11.7.2: o valor "consists of credentials"), uma linha `Cookie` ou `Set-Cookie` com valor ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), seções 4.1.1 e 4.2.1), um JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), seção 1), uma senha numa URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), seção 3.2.1: a forma "user:password" "is deprecated"), um access key ID da AWS ou um valor `ENC` do FortiOS; todos lidos em 2026-11-01. Qualquer um deles significa sem link: o popover diz a caixa e a linha, e você troca o valor por um placeholder e clica de novo. Um valor cujo nome só parece de segredo (`api_key = "..."`, uma atribuição que a verificação lê na forma do próprio Python) não impede o link; o popover cita o primeiro para você conferir.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** As duas caixas são preenchidas, qualquer saída anterior é apagada e a página diz que o programa veio de um link. Nada mais acontece: o motor (cerca de 13,5 MB) não é baixado e, se já estiver carregado, o programa não roda até você clicar em **Executar**. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.

## Fontes

A documentação do Pyodide (páginas de web worker e de fluxos padrão, versão 314.0.7), o package.json, o pyodide-lock.json e as tipagens do próprio pacote no registro npm, a documentação do CPython 3.14 para os módulos que os exemplos usam, a RFC 1035 seção 4.1.1, a RFC 4291 Apêndice A e a RFC 5424 seção 6.2.1 para a aritmética dos exemplos, e a MDN para o Worker de módulo e a lista de fontes da Content Security Policy, lidos em 2026-10-04. A página statistics do Python 3.14 (pstdev e stdev), a página de manual ping(8) no man7.org e o código-fonte do iputils que imprime o resumo do ping (ping/ping_output.c) foram lidos em 2026-10-19, assim como a RFC 2328, seções 16.1 e 16.1.1 (rfc-editor.org), e a nota de Dijkstra de 1959, A Note on Two Problems in Connexion with Graphs, Numerische Mathematik 1, páginas 269 a 271 (a digitalização no repositório do CWI que o artigo sobre Dijkstra cita), para o exemplo de SPF. Tudo está listado na página da ferramenta.
