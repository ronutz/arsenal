## O que faz

Cole o nome de arquivo de um wheel (`.whl`) ou de uma distribuição de código-fonte (`.tar.gz`), ou uma URL que termine num deles, e a ferramenta o desmonta: o nome do projeto e a forma normalizada, a versão e a forma normal PEP 440, a build tag opcional e cada python tag, ABI tag e platform tag, com o que cada uma exige. Os conjuntos comprimidos de tags são expandidos, e cada combinação diz quais interpretadores e quais sistemas ela cobre. Abra **Verificar contra um interpretador**, descreva um (CPython ou PyPy, a versão do Python, build free-threaded ou não, Linux com glibc ou musl, macOS ou Windows, a versão da biblioteca C ou do macOS, a arquitetura) e a ferramenta diz se o wheel instala ali e qual das suas tags vence.

O modo **Versões** lê uma lista de versões: cada uma analisada e normalizada, com o que a normalização mudou, a lista ordenada pela PEP 440 com as versões iguais marcadas e, quando você acrescenta um especificador como `>= 1.0, != 1.3.*, < 2`, quais versões ficam dentro do intervalo e quais um instalador escolhe por padrão. Tudo roda no seu navegador; uma URL só é cortada até o último segmento, e nada é baixado. A ferramenta fica ao lado do [explicador de pyproject.toml](/tools/pyproject-toml-explainer), que lê o arquivo que produz esses nomes, e do [Python playground](/tools/python-playground).

## Como um nome de arquivo é lido

O formato de distribuição binária dá o nome de arquivo de um wheel como `{distribution}-{version}(-{build tag})?-{python tag}-{abi tag}-{platform tag}.whl`, então um nome válido tem quatro ou cinco hífens. As regras aplicadas aqui:

- **O nome** é um nome de projeto válido (letras ASCII, dígitos, `.`, `_` e `-`, começando e terminando com letra ou dígito), comparado na forma normalizada: minúsculas, com cada sequência de `-`, `_` e `.` trocada por um único `-`. Num nome de arquivo, as ferramentas o escrevem em minúsculas com cada sequência dessas como um único `_`; quem lê wheels ainda tem de aceitar `.` e maiúsculas de arquivos antigos, então eles são aceitos com aviso. Dois underscores seguidos são recusados, como o pip recusa.
- **A versão** é uma versão PEP 440. As ferramentas a escrevem normalizada; um nome que não está assim é aceito com um aviso que mostra a forma normal.
- **A build tag** tem de começar com um dígito. Ela só desempata wheels idênticos em todo o resto, ordenando primeiro pelos dígitos iniciais como número e depois pelo resto como texto. Ela não faz parte da versão, e a especificação diz que um release que precisa ser citado de fora, como uma correção de segurança, deve ganhar uma versão nova em vez de um número de build.
- **Uma distribuição de código-fonte** é `{name}-{version}.tar.gz` com exatamente um hífen. Um nome com mais hífens é lido como o pip lê (a versão vem depois do último hífen), com aviso; um `.zip` é lido como a forma antiga, também com aviso.

## As tags

- **Python tag**: um código de implementação (`py` para qualquer implementação, `cp` CPython, `pp` PyPy, `ip` IronPython, `jy` Jython) seguido da versão sem o ponto (`cp313` é o CPython 3.13). Uma tag só com a versão maior, como `py3`, não é abreviação de `py30`: quer dizer que quem empacotou publicou um wheel feito para funcionar em várias versões 3.x.
- **ABI tag**: `none` (nenhum módulo de extensão preso a uma ABI do Python), `abi3` (a ABI estável do CPython, para builds que não são free-threaded), `abi3t` (a ABI estável para builds free-threaded, PEP 803, a partir do Python 3.15), a própria `cpXY` do CPython com as suas flags (`d` debug, `t` free-threaded, e as antigas `m` e `u`), ou a `pypyXY_ppNN` do PyPy.
- **Platform tag**: `any`; `win_amd64`, `win32`, `win_arm64`; `manylinux_x_y_arch` (glibc x.y ou mais nova, PEP 600) e os nomes antigos `manylinux1` (glibc 2.5), `manylinux2010` (2.12) e `manylinux2014` (2.17); `musllinux_x_y_arch` (musl x.y ou mais nova, PEP 656; o packaging lista só a mesma versão maior da musl); `macosx_x_y_arch` (macOS x.y ou posterior; `10_y` para o macOS 10, `x_0` a partir do macOS 11, com x de 10 a 15 ou 26 em diante), inclusive os nomes de várias arquiteturas como `universal2` (arm64 e x86_64); `ios_x_y_arch_sdk`; `android_apilevel_abi`; `pyemscripten_YEAR_PATCH_wasm32` (PEP 783, aceita); e a forma simples `linux_arch`, que a especificação chama de insuficiente para distribuição pública. Qualquer outra coisa é lida como o valor de `sysconfig.get_platform()` de outro sistema.
- **Conjuntos comprimidos de tags**: cada tag pode ser uma coleção ordenada, separada por `.`, e o wheel vale para cada combinação. `py2.py3-none-any` são duas combinações; até 400 são explicadas uma a uma, e o resto é contado.

## Em quais interpretadores e sistemas

A especificação de compatibility tags diz que um instalador mantém uma lista das tags (python, ABI, plataforma) que aceita, ordenada por preferência, e instala um wheel quando uma das tags do wheel está na lista. Esta ferramenta monta essa lista como o packaging 26.3 a monta para o interpretador e o sistema que você descreve, compara as tags expandidas do wheel com ela e mostra a melhor tag e a sua posição. Para o CPython 3.13 com glibc 2.39 em x86-64, a lista tem 1.147 tags, a mesma contagem que `python -m pip debug --verbose` imprimiu no contêiner em que esta ferramenta foi feita. O pip 26.2 ainda embute o packaging 26.2, e o packaging 26.3 mudou uma coisa na ordem: ele prefere a platform tag `linux_*` simples às manylinux e musllinux, então em cada grupo a tag `linux_x86_64` agora vem primeiro em vez de por último. A lista do próprio pip tem portanto as mesmas tags quase na mesma ordem: só a tag `linux_*` simples de cada grupo muda de lugar, e se um wheel instala ou não nunca muda.

Cada combinação também ganha uma leitura simples da regra de interpretador: `py3-none` é qualquer Python 3; `cp311-abi3` é CPython 3.11 ou posterior, em builds que não são free-threaded; `cp313-cp313t` é só o build free-threaded do CPython 3.13. Algumas combinações são nomes válidos que nenhum instalador lista, e a ferramenta diz isso com o motivo: `abi3` com uma python tag que não é `cp`, uma ABI compilada com a plataforma `any`, uma ABI que cita uma versão diferente da python tag, ou uma tag `cp3` com ABI.

O que a verificação de interpretador não modela: alvos iOS, Android e Emscripten, implementações além de CPython e PyPy (o PyPy é considerado 7.3, ABI `pp73`) e as regras por distribuição que um instalador pode somar, como um `Requires-Python` que não serve ou um índice que esconde um arquivo. As versões de Python oferecidas são os branches com suporte no guia de desenvolvimento do Python: 3.11 a 3.15.

## Achados

| Código | Gravidade | Significado |
|---|---|---|
| `not-a-distribution` | erro | O nome não termina em `.whl`, `.tar.gz` nem `.zip` |
| `suffix-case` | erro | A extensão não está em minúsculas |
| `wrong-part-count` | erro | Um nome de wheel sem quatro ou cinco hífens |
| `sdist-no-hyphen` | erro | Um nome de distribuição de código-fonte sem hífen |
| `empty-name`, `bad-name` | erro | Sem nome, ou um nome de projeto inválido |
| `double-underscore` | erro | `__` na parte do nome |
| `bad-version` | erro | Não é uma versão PEP 440 |
| `bad-build-tag` | erro | Uma build tag que não começa com dígito |
| `empty-tag` | erro | Uma tag vazia ou um membro vazio de um conjunto comprimido |
| `python-tag-not-identifier` | erro | Uma python tag que começa com dígito (o pip recusa o nome) |
| `name-not-escaped` | aviso | Aceito, mas não é a forma que as ferramentas escrevem hoje |
| `version-not-normalized` | aviso | A versão não está na forma normal |
| `build-tag-used` | aviso | Há uma build tag |
| `tags-not-sorted`, `tags-uppercase` | aviso | Um conjunto comprimido fora de ordem, ou maiúsculas numa tag |
| `impossible-combination` | aviso | Uma combinação que nenhum instalador lista |
| `unknown-python-tag` | aviso | Uma python tag que não é letras seguidas de versão |
| `linux-simple-tag` | aviso | `linux_arch` em vez de manylinux ou musllinux |
| `legacy-arch-mismatch` | aviso | Um nome antigo de manylinux numa arquitetura para a qual ele nunca foi definido |
| `macos-version-shape`, `android-abi`, `ios-multiarch` | aviso | Uma platform tag fora das formas que a sua família define |
| `sdist-zip`, `sdist-hyphens` | aviso | Um nome de distribuição de código-fonte antigo ou fora do padrão |
| `local-version` | nota | Um rótulo de versão local (o PyPI não aceita versões locais) |
| `legacy-manylinux` | nota | Um nome antigo de manylinux e a tag que ele quer dizer |
| `unknown-platform` | nota | Uma plataforma fora das famílias descritas |
| `too-many-tags` | nota | Mais de 400 combinações; o resto é contado |

## Versões PEP 440

Uma versão é `[N!]N(.N)*[{a|b|rc}N][.postN][.devN][+local]`. A ferramenta lê as formas que a especificação aceita e dá a forma normal, dizendo o que mudou: espaço em branco e um `v` inicial retirados, maiúsculas em minúsculas, zeros à esquerda retirados, `alpha`, `beta`, `c`, `pre` e `preview` escritos como `a`, `b` e `rc`, separadores retirados ou escritos como um único ponto, um número de pré-release, pós-release ou release de desenvolvimento que falta tomado como 0, `-1` depois do release lido como `.post1`, `-` e `_` num rótulo local escritos como `.`, e uma época `0!` retirada. Uma época diferente de zero é mostrada; a especificação a desaconselha.

A ordenação segue a especificação: os números de release se comparam como números, e os que faltam valem zero, então `1.0`, `1.0.0` e `1` são iguais; dentro de um release, os releases de desenvolvimento vêm primeiro, depois `a`, `b` e `rc`, depois o release final, depois os pós-releases; uma versão com rótulo local vem depois da mesma versão sem ele.

## Especificadores de versão

Cada cláusula é explicada em palavras: `~=2.2` é `>=2.2, ==2.*`; `==1.1.*` é uma comparação por prefixo; `==1.1` ignora o rótulo local da candidata e completa os números de release com zeros; `<V` deixa de fora os pré-releases de V, a não ser que V seja um; `>V` deixa de fora os pós-releases de V, a não ser que V seja um, e as versões locais de V; `===` compara o texto (letras sem diferenciar maiúsculas) e é muito desaconselhado. As cláusulas são recusadas pelos motivos que a especificação e o packaging 26.3 dão: `~=` com um número de release só, `.*` com operador que não seja `==` ou `!=` ou depois de uma parte de pré-release, pós-release ou desenvolvimento, um rótulo local com operador que não seja `==` ou `!=`, duas cláusulas sem vírgula.

O tratamento de pré-releases segue a especificação e o packaging 26.3: os pré-releases, inclusive os de desenvolvimento, ficam de fora, a não ser que uma cláusula cite um ou que toda versão dentro do intervalo seja pré-release; a tabela mostra o que está dentro do intervalo e o que é escolhido por padrão, e marca a mais nova escolhida.

## Onde segue o packaging e onde é mais estrita

Cada veredito foi comparado com o packaging 26.3 durante o desenvolvimento (veja Proveniência). A ferramenta segue as escolhas do packaging onde a especificação deixa espaço, como as regras dos `<` e `>` exclusivos e a lista de tags do instalador. Ela é mais estrita num ponto, e diz isso: um nome de arquivo cuja parte do nome não é um nome de projeto válido (`_` ou `.` no início ou no fim, uma letra fora do ASCII, um espaço num nome de sdist) é recusado aqui, enquanto os parsers de nome de arquivo do packaging o aceitam.

## Exemplos

- **O botão Exemplo**: `cryptography-50.0.2-cp311-abi3-manylinux_2_34_x86_64.whl`. CPython 3.11 ou posterior, ABI estável, builds que não são free-threaded, em Linux com glibc 2.34 ou mais nova em x86-64. Contra o CPython 3.13 com glibc 2.39 ele instala, como a tag 163 de 1.147 (o pip 26.2.2, com o packaging 26.2, a mostra na posição 162); com glibc 2.31, não; num 3.14 free-threaded, não, porque `abi3` não é listada para builds free-threaded.
- `markupsafe-3.0.4-cp313-cp313-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl` se expande em três combinações; `manylinux2014` aparece como o nome antigo de `manylinux_2_17`.
- `Foo.Bar-1.0-py2.py3-none-any.whl` é aceito com aviso: as ferramentas hoje escrevem `foo_bar`.
- **Versões**: a lista do Exemplo `2.1 2.2 2.9.1 3.0 2.10rc1` com `~=2.2` deixa `2.2`, `2.9.1` e `2.10rc1` dentro do intervalo e escolhe `2.2` e `2.9.1`, porque há um release final dentro do intervalo.

## Proveniência

O engine é puro: leitores de texto e comparações, sem relógio, sem rede, sem aleatoriedade, sem expressão regular com quantificadores aninhados. A entrada é limitada a 20.000 caracteres, 256 por versão, 1.024 por especificador e 500 versões. Ele traz golden vectors (conjunto `wheel-filename-explainer/2026-10-27a`): 134 linhas com 40 versões aceitas e 12 recusadas, duas listas de ordenação (uma delas a da própria especificação), 22 especificadores (muitos deles exemplos da especificação) e 13 recusados, 33 nomes de arquivo e 12 interpretadores-alvo, cada veredito tirado do packaging 26.3. Durante o desenvolvimento o engine também foi comparado com o packaging 26.3 em entradas geradas: 60.059 versões, 59.963 especificadores, 30.000 nomes de arquivo, 230 alvos e 607.200 verificações de tag contra regra, sem divergência além da regra de nome mais estrita acima.

## API

O mesmo engine responde à operação `/api/v1/wheel-filename-explainer` da API HTTP do site, descrita no contrato OpenAPI na [página da API](/api); o contrato também diz se este site serve a API.

- **Requisição.** Texto, no corpo de um POST ou no parâmetro `input` de um GET. Um token único terminado em `.whl`, `.tar.gz` ou `.zip` (ou uma URL para ele) é lido como nome de arquivo; qualquer outra coisa é lida como versões, uma por linha ou separadas por espaços ou vírgulas, e a primeira linha que começa com `~`, `=`, `!`, `<` ou `>` é o especificador.
- **Resposta.** `mode` (`filename`, `versions`, `empty` ou `too-long`). No modo de nome de arquivo, `filename` traz `kind`, `fileName`, `parts`, `name`, `expectedName`, `version` (com `normalized`, `epoch`, `release`, `pre`, `post`, `dev`, `local` e as `notes` da normalização), `build`, as `pythonTags`, `abiTags` e `platformTags` lidas, as combinações `expanded` com a regra `interpreter` de cada uma, `expandedCount`, `findings` e `valid`. No modo de versões, `versions` traz `entries`, a ordem `sorted`, `equalGroups`, o `specifier` lido e a `selection`. A verificação de interpretador existe só na página.

## Fontes

Todas lidas em 2026-10-27.

- [Python Packaging User Guide: Binary distribution format](https://packaging.python.org/en/latest/specifications/binary-distribution-format/): a convenção de nome de arquivo, o escape do nome, a build tag
- [Python Packaging User Guide: Source distribution format](https://packaging.python.org/en/latest/specifications/source-distribution-format/): o nome de arquivo do sdist
- [Python Packaging User Guide: Platform compatibility tags](https://packaging.python.org/en/latest/specifications/platform-compatibility-tags/): python tags, ABI tags e platform tags, as tags manylinux, musllinux, macOS, iOS e Android, conjuntos comprimidos, como os instaladores as usam
- [Python Packaging User Guide: Names and normalization](https://packaging.python.org/en/latest/specifications/name-normalization/)
- [Python Packaging User Guide: Version specifiers](https://packaging.python.org/en/latest/specifications/version-specifiers/) e [PEP 440](https://peps.python.org/pep-0440/)
- [PEP 427](https://peps.python.org/pep-0427/), [PEP 600](https://peps.python.org/pep-0600/), [PEP 656](https://peps.python.org/pep-0656/), [PEP 803](https://peps.python.org/pep-0803/), [PEP 3149](https://peps.python.org/pep-3149/), [PEP 703](https://peps.python.org/pep-0703/), [PEP 783](https://peps.python.org/pep-0783/)
- [Documentação do Python: C API Stability](https://docs.python.org/3/c-api/stable.html): `abi3` e `abi3t`
- [packaging 26.3: Tags](https://packaging.pypa.io/en/stable/tags.html): a ordem da lista de tags do instalador; [changelog](https://packaging.pypa.io/en/stable/changelog.html): o 26.3 prefere as platform tags `linux_*` nativas
- [Guia de desenvolvimento do Python: Status of Python versions](https://devguide.python.org/versions/): os branches com suporte oferecidos na verificação de interpretador
