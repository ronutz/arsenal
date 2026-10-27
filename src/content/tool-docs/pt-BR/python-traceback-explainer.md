## O que faz

Cole um traceback impresso pelo CPython e a ferramenta o desmonta: cada frame com arquivo, linha, função e linha de código, e o que os marcadores `^` e `~` embaixo dele apontam; cada exceção com a cadeia de classes da hierarquia embutida, a sugestão do próprio CPython quando houver, os detalhes de errno ou de codec, e uma dica tirada da documentação; a cadeia entre exceções ("direct cause" contra "during handling"); exception groups com seus membros e suas notas; onde olhar primeiro; para quais versões o formato aponta; e o que no texto colado pode ser sensível, com uma cópia redigida para compartilhar no lugar do original. Tudo roda no seu navegador: o texto é lido, nunca executado, e nunca enviado a lugar nenhum.

Ela lê os formatos do CPython 3.11 ao 3.15, as versões que o Python Developer's Guide lista com suporte em 27 de outubro de 2026: 3.15 e 3.14 em status bugfix, 3.13, 3.12 e 3.11 em status security, com fim de vida em outubro de 2031, 2030, 2029, 2028 e 2027. O 3.10 chegou ao fim de vida em 1º de outubro de 2026. Todo comportamento descrito aqui foi conferido com tracebacks impressos naquele dia pelo CPython 3.11.17, 3.12.3 e 3.13.16, e pelo CPython 3.14.2 do build usado no [Python playground](/tools/python-playground) do site. Não havia interpretador 3.15 disponível, então nada aqui foi testado no 3.15; onde o 3.15 aparece, a fonte é a documentação dele. O [artigo sobre erros e tracebacks em Python](/learn/python-errors-and-tracebacks) ensina o mesmo terreno com exemplos.

## O que ela lê

**O header e os frames.** Um traceback começa com `Traceback (most recent call last):` e lista os frames da chamada mais externa à mais interna: o último frame é onde a exceção foi levantada. Cada frame é uma linha `  File "<arquivo>", line <n>, in <função>`, seguida da linha de código indentada com quatro espaços quando o CPython conseguiu ler o arquivo. A função é o nome do code object, então o nível de topo de um script é `<module>`, uma lambda é `<lambda>` e uma generator expression é `<genexpr>`. O número da linha pode ser `None`.

**Os marcadores (PEP 657, 3.11 em diante).** Sob a linha de código de um frame o CPython imprime `^` sob a expressão que o frame executava. Quando a expressão tem partes, `~` marca as partes e `^` a operação: o operador de uma operação binária (`a / b` dá `~^~`), os colchetes de um acesso por índice (`cfg["hostname"]` dá `~~~^^^^^^^^^^^^`) e, a partir do 3.13, os parênteses de uma chamada (`int(port)` dá `~~~^^^^^^`). A ferramenta transforma os marcadores de volta em texto: a expressão, a parte sob `^` e as partes sob `~`. O CPython posiciona os marcadores por coluna de exibição, contando um caractere largo ou de largura total (East Asian Width W ou F) como duas colunas, e a ferramenta faz o mesmo, com a tabela de larguras do Unicode 15.1.0 que o CPython 3.13 usa. Nenhum marcador é impresso quando o CPython foi iniciado com `-X no_debug_ranges` ou `PYTHONNODEBUGRANGES`, quando a expressão é a linha inteira, e a partir do 3.13 também em `x = f(...)` e `return nome(...)` quando a chamada é o valor inteiro (o 3.12 marca `json.loads(body)` em `data = json.loads(body)`; o 3.13 não).

**Expressões em várias linhas (3.13 em diante).** Um frame pode mostrar uma expressão que ocupa várias linhas de código, com marcadores sob cada uma e `...<N lines>...` no lugar das linhas omitidas. O 3.11 e o 3.12 mostram só a primeira linha.

**Frames repetidos.** Depois de três frames idênticos (mesmo arquivo, linha e função) o CPython imprime `[Previous line repeated N more times]` no lugar dos outros. A ferramenta conta a repetição no frame de cima.

**Variáveis locais.** `unittest --locals` e `traceback.TracebackException(..., capture_locals=True)` imprimem linhas `nome = valor` sob um frame. A ferramenta as lista e avisa que os valores podem conter segredos.

**A linha da exceção.** `<tipo>: <mensagem>`, ou só `<tipo>` quando a mensagem é vazia. O CPython escreve o tipo como `module.qualname`, exceto para classes embutidas e para classes do script que foi executado (`__main__`), que ele escreve sem módulo. Então `ValueError` é embutida, `json.decoder.JSONDecodeError` vem da biblioteca padrão, e `PollError` muito provavelmente foi definida no script.

**Notas e mensagens de várias linhas.** Notas acrescentadas com `add_note()` (PEP 678, 3.11 em diante) são impressas "immediately after the exception message, in the order in which they were added, with each note starting on a new line". Uma mensagem que contém quebras de linha é impressa do mesmo jeito, então só pelo texto não dá para separar o resto de uma mensagem de uma nota; a ferramenta mostra essas linhas juntas e avisa.

**A localização de um SyntaxError.** Quando o código não compila, o CPython imprime `  File "<arquivo>", line <n>` sem função, a linha com problema e marcadores `^`, depois `SyntaxError: <mensagem>`. Se foi o próprio script que não compilou, nada rodou e não há header `Traceback`; se foi um módulo importado, a localização vem depois dos frames do código que o importou. Esses marcadores contam caracteres, não colunas de exibição.

**Cadeias (PEP 3134).** Quando uma exceção é levantada enquanto outra é tratada, o CPython imprime as duas, a mais antiga primeiro, ligadas por um aviso:

- `The above exception was the direct cause of the following exception:` quer dizer `raise nova from original`: uma tradução de propósito, e a exceção de cima é a `__cause__` da nova.
- `During handling of the above exception, another exception occurred:` quer dizer que o handler da exceção de cima levantou outra: o próprio handler falhou, e a exceção de cima virou o `__context__` da nova.
- `raise nova from None` imprime só a nova exceção (PEP 409, PEP 415).

Uma exceção criada mas nunca levantada, como a causa em `raise ValueError(...) from KeyError(...)`, é impressa sem header e sem frames.

**Exception groups (PEP 654, 3.11 em diante).** Um group é impresso como uma caixa: `+ Exception Group Traceback (most recent call last):`, uma margem `|` em cada linha do group, e cada membro sob um título `+-+---------------- 1 ----------------`, `+---------------- 2 ----------------` e assim por diante, cada um com o próprio traceback, cadeia e notas, aninhado uma margem mais para dentro a cada nível. A mensagem do group termina com `(N sub-exceptions)`. Por padrão o CPython imprime 15 membros e depois `and N more exceptions` (`max_group_width`), e dez níveis de aninhamento e depois `... (max_group_depth is 10)`. A ferramenta lê groups até 40 níveis, então um traceback impresso com limites maiores também é lido.

**O que vem antes do traceback.** `Exception in thread <nome>:` quer dizer que `threading.excepthook` imprimiu uma exceção levantada numa thread, e o programa pode ter seguido em frente. `Exception ignored in: ...` quer dizer que `sys.unraisablehook` imprimiu uma exceção que não tinha como se propagar, de um destrutor por exemplo. Uma linha de log como `ERROR:netops.poller:...`, um prompt do shell ou `>>> ` antes do header ficam sem leitura, com uma nota.

**O que ela não lê.** Os relatórios do IPython e do pytest são formatos próprios, não o do CPython; a ferramenta avisa e lê só o que está no formato do CPython (do IPython, a linha da exceção). Um log em que toda linha tem um prefixo (data e hora, nível) não é lido. Quando o texto colado tem dois tracebacks, o primeiro é lido e uma nota dá a linha onde começa o segundo. As linhas logo depois de uma linha de exceção são tratadas como mensagem ou notas até uma linha em branco, um aviso de cadeia, um novo header ou um prompt `>>> `.

## Onde as versões diferem

Visto nos tracebacks que os vetores fixam (3.11.17, 3.12.3, 3.13.16 e 3.14.2) e na documentação de cada versão.

| O quê | 3.11 | 3.12 | 3.13 | 3.14 | 3.15 |
| --- | --- | --- | --- | --- | --- |
| `^` sob a expressão que falhou, `~` em volta de um operador ou de um índice | sim | sim | sim | sim | não testado |
| `~` sob a função chamada, `^` sob os parênteses | não: só `^` | não: só `^` | sim | sim | não testado |
| Nenhum marcador para uma expressão que é a linha inteira | sim | sim | sim, e também em `x = f(...)` e `return nome(...)` | como no 3.13 | não testado |
| Uma expressão em várias linhas, com `...<N lines>...` | só a primeira linha | só a primeira linha | sim | sim | não testado |
| Um frame para list, dict ou set comprehension (`<listcomp>`) | sim | não (PEP 709) | não | não | não testado |
| Exception groups, notas | sim | sim | sim | sim | não testado |
| "Did you forget to import 'sys'?" | não | sim | sim | sim | não testado |
| Um script com o nome de um módulo da biblioteca padrão | "partially initialized module ... (most likely due to a circular import)" | o mesmo | "(consider renaming '...' since it has the same name as the standard library module ...)" | não testado | não testado |
| Um argumento nomeado com erro de digitação | "'max_split' is an invalid keyword argument for split()" | o mesmo | "got an unexpected keyword argument 'max_split'. Did you mean 'maxsplit'?" | como no 3.13 | não testado |
| O nome de arquivo do shell interativo | `<stdin>` | `<stdin>` | `<python-input-0>` | `<python-input-N>` nos exemplos da documentação | o mesmo na documentação |
| Cores no terminal | não | não | sim | sim | sim |
| Novas exceções embutidas | | | `PythonFinalizationError` | | `ImportCycleError` |

Mais duas diferenças apareceram nas execuções. No 3.11 a sugestão "Did you mean" de um `NameError` é impressa pela exibição do próprio interpretador mas não por `traceback.print_exc()`; a partir do 3.12 as duas imprimem. E o build Pyodide do 3.14.2 imprimiu as exceções de ssl como `_ssl.SSLError` (sem `ValueError` na cadeia de `SSLCertVerificationError`), onde o 3.11 ao 3.13 imprimem `ssl.SSLError`; a ferramenta conhece as duas grafias. Em 26 dos 34 cenários executados nos dois, o texto do 3.14.2 foi igual ao do 3.13.16 byte a byte; os outros oito diferem só nos caminhos, na profundidade em que a recursão parou e no que o WebAssembly não faz (sockets, threads e processos). A documentação de traceback do 3.15 é igual à do 3.14 tirando a linha da versão; as mensagens novas do 3.15 (sugestões por atributos internos, nomes Python para métodos de outras linguagens, lazy imports reportados no primeiro uso) foram lidas mas não executadas.

## A classe da exceção

A ferramenta conhece toda exceção embutida documentada e as exceções da biblioteca padrão que scripts de rede e de segurança mais encontram: `socket.gaierror` e `socket.herror`; os erros de `ssl`; `json.decoder.JSONDecodeError`; `asyncio.exceptions.CancelledError`, `InvalidStateError`, `IncompleteReadError` e `LimitOverrunError`; os erros de `subprocess`; `urllib.error.URLError`, `HTTPError` e `ContentTooShortError`; e `http.client.HTTPException`, `RemoteDisconnected`, `IncompleteRead`, `BadStatusLine`, `InvalidURL` e `LineTooLong`. Para cada uma ela mostra a cadeia de classes, da base mais próxima para fora (por exemplo `ConnectionRefusedError → ConnectionError → OSError → Exception → BaseException`), uma frase sobre o que ela significa, a versão que a acrescentou quando é mais nova que o 3.11, e um link para a entrada dela na documentação. As cadeias foram impressas pelos próprios interpretadores (o `__mro__` de cada classe no 3.11.17, 3.12.3, 3.13.16 e 3.14.2, idêntico para toda embutida) e batem com a árvore da hierarquia na página de exceções de cada versão; `ImportCycleError` vem só da documentação do 3.15. Aliases são impressos com o nome do alvo: `socket.timeout` e `asyncio.TimeoutError` como `TimeoutError`, `IOError` e `EnvironmentError` como `OSError`, `ssl.CertificateError` como `ssl.SSLCertVerificationError`.

Para uma classe desconhecida, a ferramenta diz o que o nome impresso indica: um nome sem módulo é uma classe do script que foi executado (ou uma embutida mais nova que a ferramenta), e um nome com módulo é documentado por esse módulo.

**Dicas.** Para 36 classes de exceção frequentes, e para qualquer mensagem sobre `'NoneType'`, a ferramenta acrescenta o que conferir primeiro, sempre tirado da documentação da classe: `ModuleNotFoundError` (um ambiente virtual só enxerga o que foi instalado nele), `KeyError` (`dict.get(chave, padrão)` devolve um padrão em vez de levantar a exceção), `AttributeError` ou `TypeError` sobre `'NoneType'` (uma função sem `return` devolve `None`, e `re.match()` e `re.search()` devolvem `None` quando nada casa), `UnboundLocalError` (uma atribuição em qualquer ponto de uma função torna o nome local na função inteira), `ConnectionRefusedError`, `TimeoutError`, `socket.gaierror`, `ssl.SSLCertVerificationError` (verify_message diz por quê; `CERT_NONE` aceita praticamente qualquer certificado), `subprocess.CalledProcessError`, `asyncio.exceptions.CancelledError` (um `TaskGroup` cancela as outras tasks quando uma falha), `AssertionError` (`python -O` remove os comandos `assert`), `SyntaxError` (os marcadores mostram onde o parser detectou o erro, que "is not always the place that needs to be fixed"), entre outras.

**Da mensagem.** As sugestões do próprio CPython ("Did you mean", "Did you forget to import", "consider renaming"); errno e o texto dele em `[Errno N] texto` e `[WinError N] texto` (os números são do sistema operacional e mudam de um sistema para outro; um número negativo em `socket.gaierror` é um dos códigos `EAI_*` de getaddrinfo); e o codec, o byte ou caractere, a posição e o motivo de um `UnicodeDecodeError` ou `UnicodeEncodeError`.

## Onde olhar primeiro

Para a exceção com que o traceback termina (num group, para cada membro folha, até vinte):

- levantada no seu próprio código: aquele frame, e os valores que chegaram a ele;
- levantada por um comando `raise`: a mensagem diz por quê; quando um aviso de cadeia a liga a uma exceção anterior, a leitura segue a cadeia até ela também (a causa direta é a falha original; com "during handling", a primeira falha é a de cima e o handler falhou depois dela);
- levantada dentro da biblioteca padrão, de um pacote instalado ou de um módulo congelado: o último frame do seu próprio código antes dela, que passou adiante o que a biblioteca não conseguiu tratar;
- um SyntaxError: a localização, e o frame que importou o arquivo quando houver;
- um `RecursionError`: o frame que se repete; um `KeyboardInterrupt`: onde o programa esperava;
- sem frames: a exceção nunca foi levantada por si, ou só a última linha foi colada.

"Seu próprio código" é todo frame que não está na biblioteca padrão (`.../lib/python3.X/...`, `...\Lib\...`), num pacote instalado (`site-packages`, ou o `dist-packages` do Debian) nem num módulo congelado (`<frozen ...>`); `<stdin>`, `<string>` e o shell interativo contam como seus. É uma leitura, não um veredito: o frame que levanta a exceção nem sempre é onde está o erro.

## Qual versão imprimiu

A ferramenta junta evidências e cruza todas: um caminho que nomeia a biblioteca padrão (`/usr/lib/python3.13/`, `python314.zip`, `Python313\`) dá a versão exata; marcadores, qualquer um, querem dizer 3.11 ou posterior; `~` sob uma chamada ou uma expressão em várias linhas, 3.13 ou posterior; um frame de comprehension, 3.11 ou anterior; um exception group, 3.11 ou posterior; `<python-input-N>`, 3.13 ou posterior; "Did you forget to import", 3.12 ou posterior; "consider renaming" ou "Did you mean '...'?" sem dois-pontos, 3.13 ou posterior; `PythonFinalizationError`, 3.13 ou posterior; `ImportCycleError`, 3.15. Evidências que se contradizem (um texto que mistura duas versões, ou que foi editado) aparecem como tal.

## O que pode ser sensível

Um traceback é um artefato de log e com frequência traz o que não deveria ser publicado: caminhos nomeiam usuários e hosts, linhas de código e mensagens podem conter tokens, senhas e URLs com credenciais, e variáveis locais impressas trazem valores. A ferramenta procura:

- um nome de usuário num diretório home: `/home/<nome>/`, `/Users/<nome>/`, `C:\Users\<nome>\`, informado uma vez por nome, com a contagem;
- tudo o que a verificação de segredos do [code to image](/tools/code-to-image) do site encontra: blocos de chave privada, headers `Authorization`, IDs de chave de acesso AWS, JSON Web Tokens, senhas em URLs, valores cifrados do FortiOS, e atributos, membros, chaves, variáveis e atribuições com cara de segredo. Linhas com mais de 2.000 caracteres não vão para essa verificação (ela fica lenta em linhas muito longas), e uma nota avisa.

A **cópia redigida** troca cada nome de usuário por `<user>` e cada achado por `[redacted]`, e é ela que você cola numa issue ou num chamado. As verificações não são completas: leia a cópia antes de publicá-la.

Pelo mesmo motivo a página nunca coloca num link o traceback como você colou (a configuração de compartilhamento dela é "never"). O botão **Compartilhar resultado**, nesta seção, só cria um link quando você clica, e o link leva a cópia redigida acima depois do `#`, nunca o texto colado; quando alguma linha tinha mais de 2.000 caracteres e por isso não passou pela verificação, ele não oferece link e diz o motivo. A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então a cópia não é enviada ao servidor quando o link é aberto, mas qualquer pessoa com o link consegue lê-la: leia a cópia antes. Um link preenche a caixa como se a cópia tivesse sido colada, e a página a explica; o valor então sai do endereço da página, sem nenhuma requisição. A cópia tem limite de 16.384 caracteres, o limite que o site usa para todo valor depois do `#`. A ferramenta também não é oferecida pela API do site: mandar um traceback a um servidor para que ele seja explicado mandaria os segredos junto, e um programa que tem um traceback em mãos já tem o objeto da exceção, que o `traceback.TracebackException` da biblioteca padrão lê com exatidão.

## Limites

No máximo 200.000 caracteres, 5.000 linhas e 5.000 caracteres por linha; exception groups até 40 níveis de aninhamento. A entrada mais longa dos testes levou cerca de 0,4 segundo.

## Exemplo comentado

O botão Exemplo carrega o traceback que o CPython 3.13.16 imprimiu para este script, que consulta um equipamento de laboratório numa porta em que nada escuta:

```python
# poll.py: abre uma sessão SSH com cada equipamento do inventário; nada escuta na porta do laboratório aqui.
import socket  # TCP

INVENTORY = {"r1": "127.0.0.1"}  # nome do equipamento e endereço de gerência
SSH_PORT = 2222  # a porta SSH do laboratório


class PollError(Exception):
    """Um equipamento não pôde ser consultado."""


def open_session(host, port):
    # Conecta com um timeout curto.
    return socket.create_connection((host, port), timeout=2)


def poll(inventory):
    # Transforma uma recusa no erro da própria aplicação, guardando o original como causa.
    for name, host in inventory.items():
        try:
            open_session(host, SSH_PORT)
        except ConnectionRefusedError as err:
            err.add_note(f"device {name} ({host})")
            raise PollError(f"{name}: SSH port {SSH_PORT} closed") from err


poll(INVENTORY)
```

A ferramenta lê duas exceções ligadas pelo aviso de "direct cause". A primeira, `ConnectionRefusedError: [Errno 111] Connection refused`, tem quatro frames: dois em `poll.py` e dois em `/usr/lib/python3.13/socket.py`, e uma linha depois da linha da exceção, `device r1 (127.0.0.1)`, que é a nota. A segunda, `PollError: r1: SSH port 2222 closed`, é uma classe do script (sem módulo no nome) levantada por um comando `raise`. Onde olhar primeiro: `PollError` foi levantada de propósito; a causa direta é a recusa, levantada dentro da biblioteca padrão, e o último frame do script antes dela é `open_session`, linha 14. O caminho nomeia a biblioteca padrão do 3.13, e o `~` sob cada função chamada confirma 3.13 ou posterior. O nome de usuário em `/home/ana/` é informado, e a cópia redigida tem `/home/<user>/` no lugar dele.

## Procedência

O comportamento é fixado pelo conjunto de vetores de referência `python-traceback-explainer-golden-2026-10-27b`: 57 vetores de traceback (45 impressos pelo 3.13.16, incluindo uma sessão interativa, uma thread, logging, `sys.unraisablehook`, `unittest --locals`, `-X no_debug_ranges`, cores, `python -m` e um nome de arquivo no estilo do Windows passado a `compile()`; seis impressos pelas outras versões, quatro no 3.11.17, um no 3.12.3 e um no 3.14.2; o relatório do IPython 9.17.1; a última linha de um traceback do 3.13.16 sozinha; e quatro tracebacks do 3.13.16 transformados com quebras de linha CR LF, espaços sem quebra, uma indentação e um corte), oito recusas, 26 larguras de exibição e 14 cadeias de classes. A estrutura esperada de cada traceback (tipos, mensagens, notas, ligações, frames, posições, se houve marcadores e o tipo de expressão sob eles) não foi produzida pela ferramenta: um harness rodou cada script de novo e a escreveu a partir dos objetos da exceção (`traceback.TracebackException`, `FrameSummary` e o texto que o próprio CPython imprime para cada frame), e em todos os cenários e versões a leitura que a ferramenta faz do texto impresso concordou com ela nas 3.971 comparações. As leituras (onde olhar primeiro, a faixa de versões, as notas e os achados, as cópias redigidas) foram escritas à mão a partir das regras acima. Seis vetores de compartilhamento fixam o que um link de Compartilhar resultado leva: as cópias redigidas do Exemplo, do vetor de segredos e do vetor de caminho do Windows, e nenhum link para uma linha que a verificação de segredos pulou, um texto que não é traceback ou uma caixa vazia. 100.000 textos aleatórios e alterados nunca a fizeram falhar.

## API

Não exposta pela API, de propósito: veja "O que pode ser sensível" acima.

## Fontes

Todas lidas em 27/10/2026.

- Documentação do Python 3.15: [traceback](https://docs.python.org/3/library/traceback.html) (com as edições [3.11](https://docs.python.org/3.11/library/traceback.html), [3.12](https://docs.python.org/3.12/library/traceback.html), [3.13](https://docs.python.org/3.13/library/traceback.html) e [3.14](https://docs.python.org/3.14/library/traceback.html), comparadas), [Built-in Exceptions](https://docs.python.org/3/builtins/exceptions.html) (com as edições do 3.11 ao 3.14), [Command line and environment](https://docs.python.org/3/using/cmdline.html), [sys](https://docs.python.org/3/library/sys.html), [threading](https://docs.python.org/3/library/threading.html), [sysconfig](https://docs.python.org/3/library/sysconfig.html), [unittest](https://docs.python.org/3/library/unittest.html), [venv](https://docs.python.org/3/library/venv.html), [codecs](https://docs.python.org/3/library/codecs.html), [re](https://docs.python.org/3/library/re.html), [Built-in Types](https://docs.python.org/3/builtins/stdtypes.html), [socket](https://docs.python.org/3/library/socket.html), [ssl](https://docs.python.org/3/library/ssl.html), [json](https://docs.python.org/3/library/json.html), [asyncio exceptions](https://docs.python.org/3/library/asyncio-exceptions.html), [Coroutines and Tasks](https://docs.python.org/3/library/asyncio-task.html), [subprocess](https://docs.python.org/3/library/subprocess.html), [urllib.error](https://docs.python.org/3/library/urllib.error.html), [http.client](https://docs.python.org/3/library/http.client.html)
- [The Python Tutorial: Errors and Exceptions](https://docs.python.org/3/tutorial/errors.html) e [More Control Flow Tools](https://docs.python.org/3/tutorial/controlflow.html); [The Python Language Reference: Lexical analysis](https://docs.python.org/3/reference/lexical_analysis.html) e [Execution model](https://docs.python.org/3/reference/executionmodel.html); [Programming FAQ: UnboundLocalError](https://docs.python.org/3/faq/programming.html)
- What's New in Python [3.11](https://docs.python.org/3/whatsnew/3.11.html), [3.12](https://docs.python.org/3/whatsnew/3.12.html), [3.13](https://docs.python.org/3/whatsnew/3.13.html), [3.14](https://docs.python.org/3/whatsnew/3.14.html), [3.15](https://docs.python.org/3/whatsnew/3.15.html)
- [PEP 657](https://peps.python.org/pep-0657/), [PEP 654](https://peps.python.org/pep-0654/), [PEP 678](https://peps.python.org/pep-0678/), [PEP 3134](https://peps.python.org/pep-3134/), [PEP 409](https://peps.python.org/pep-0409/), [PEP 415](https://peps.python.org/pep-0415/), [PEP 709](https://peps.python.org/pep-0709/), [PEP 3151](https://peps.python.org/pep-3151/)
- [Python Developer's Guide: Status of Python versions](https://devguide.python.org/versions/)
- [Debian Python Policy](https://www.debian.org/doc/packaging-manuals/python-policy/): `dist-packages`
- Unicode Character Database [15.1.0 EastAsianWidth.txt](https://www.unicode.org/Public/15.1.0/ucd/EastAsianWidth.txt) (16.0.0 e 17.0.0 comparados) e [UAX #11, East Asian Width](https://www.unicode.org/reports/tr11/)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (lida em 2026-10-27): seção 3.5, o fragmento, que leva os valores de um link de Compartilhar resultado
