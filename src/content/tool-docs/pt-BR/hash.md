## O que faz

Digite um texto e obtenha seus resumos SHA-1, SHA-256, SHA-384 e SHA-512, cada um mostrado em hexadecimal e em Base64. O cálculo é feito pelo Web Crypto nativo do navegador (`crypto.subtle.digest`), e não por uma implementação empacotada, então os valores correspondem ao que qualquer plataforma em conformidade produz. Os quatro resumos são calculados de uma vez, então trocar qual deles você vê nunca recalcula. Tudo acontece no seu navegador. Você também pode calcular o hash de um arquivo em vez de um texto digitado: veja Arquivos, mais abaixo.

## O que é um hash criptográfico

Um hash criptográfico mapeia uma entrada de qualquer tamanho para um resumo de tamanho fixo, com algumas propriedades que o definem: é determinístico (a mesma entrada sempre dá o mesmo resumo), unidirecional (você não consegue recuperar a entrada a partir do resumo) e resistente a colisões (é inviável encontrar duas entradas com o mesmo resumo). Mudar um único bit da entrada muda cerca de metade dos bits da saída, então um resumo não revela o quão parecidas duas entradas são. Aqui a entrada é resumida como seus bytes UTF-8.

## Os quatro algoritmos

Todos os quatro são definidos na FIPS 180-4, com código de referência e vetores de teste também na RFC 6234. Eles diferem no tamanho do resumo:

- **SHA-1** produz 160 bits (40 caracteres hex). Ainda é bastante visto, mas está quebrado quanto à resistência a colisões, então não deve ser usado onde um atacante possa forjar as entradas; continua adequado para checksums e para verificar contra sistemas legados.
- **SHA-256** produz 256 bits (64 caracteres hex) e é o padrão moderno.
- **SHA-384** produz 384 bits (96 caracteres hex).
- **SHA-512** produz 512 bits (128 caracteres hex).

## Hex e Base64

O resumo é uma sequência de bytes; hex e Base64 são apenas duas formas de escrever esses mesmos bytes. O hex usa dois caracteres por byte e é a forma comum na maioria das ferramentas; o Base64 é mais compacto e é o que aparece em lugares como atributos de Subresource Integrity.

## Arquivos

Escolha um arquivo pelo seletor de arquivos, ou solte-o em qualquer ponto da ferramenta, e os quatro resumos são calculados sobre os bytes do arquivo exatamente como estão no disco. O seu navegador lê o arquivo no seu dispositivo pela File API (`Blob.arrayBuffer()`) e entrega os bytes ao Web Crypto. Nada é enviado: a visão de arquivos não faz nenhuma requisição de rede. A área de soltar também é um botão, então o teclado chega a ela com Tab e abre o seletor de arquivos com Enter ou Espaço.

- **O que aparece.** O nome, o tamanho e o tipo do arquivo aparecem como o seu navegador os informa. O navegador deixa o tipo vazio quando não consegue determiná-lo, e o tipo não entra nos resumos: só os bytes entram no hash, então renomear um arquivo não muda nenhum deles.
- **Um arquivo é os seus bytes.** Um arquivo de texto salvo com marca de ordem de bytes (BOM) ou com quebras de linha do Windows (CRLF) tem um hash diferente do das mesmas palavras digitadas na caixa de texto, porque esses bytes fazem parte do arquivo. `hi` digitado na caixa de texto e `hi` salvo com BOM UTF-8 e CRLF (os sete bytes `EF BB BF 68 69 0D 0A`) dão dois resumos SHA-256 diferentes.
- **O limite de tamanho: 256 MiB.** O `digest()` do Web Crypto recebe a mensagem inteira numa só chamada e começa copiando-a; não existe uma forma em fluxo (streaming). Calcular o hash de um arquivo com ele, portanto, exige manter todos os bytes na memória, mais uma segunda cópia enquanto cada resumo é calculado. A ferramenta calcula o hash de arquivos de até 256 MiB (268.435.456 bytes), roda os quatro algoritmos um depois do outro para que exista só uma cópia de cada vez (um pico de cerca de duas vezes o arquivo) e recusa um arquivo maior com uma mensagem, antes de ler qualquer parte dele. O limite é uma escolha conservadora, não um número definido pela plataforma. Enquanto trabalha, uma linha de status mostra o algoritmo em andamento, por exemplo "SHA-384, 2 de 4".
- **Arquivos maiores.** Use o comando do seu sistema operacional: o `sha256sum` do GNU coreutils no Linux (e também `sha1sum`, `sha384sum`, `sha512sum`), ou o `Get-FileHash` no PowerShell, cujo algoritmo padrão é o SHA-256.
- **Comparar com um checksum publicado.** Resumos em hexadecimal não dependem de maiúsculas e minúsculas: o `Get-FileHash` imprime em maiúsculas e esta ferramenta em minúsculas, então compare os caracteres sem se importar com maiúsculas e minúsculas. Com uma lista de checksums publicados, o `sha256sum --check` (`-c`) compara para você cada arquivo citado nela.
- **Um arquivo vazio.** Um arquivo de zero bytes tem os resumos conhecidos da entrada vazia (SHA-256 `e3b0c442…7852b855`), e a ferramenta avisa. A documentação do VirusTotal lembra que, se um arquivo que você sabe que não está vazio mostra esse resumo, algo impediu que ele fosse lido.
- **Quando a leitura falha.** Se o navegador não consegue ler o arquivo (ele foi movido, apagado, alterado ou bloqueado por outro programa depois que você o escolheu, os casos que a File API lista), a ferramenta mostra o nome do erro do navegador e pede que você escolha o arquivo de novo. Um arquivo cujo tamanho muda durante a leitura é informado da mesma forma. Nada para em silêncio.

## Consultar um arquivo no VirusTotal

Abaixo dos resumos de um arquivo há um link, **Consultar este SHA-256 no VirusTotal**. Ele abre, numa nova aba, o endereço que o VirusTotal documenta para o relatório mais recente de um arquivo, `https://www.virustotal.com/gui/file/<SHA-256>/detection`, com o SHA-256 do arquivo no lugar de `<SHA-256>`; os outros três resumos nunca vão para um link. Seguir o link envia ao VirusTotal o hash, não o arquivo. A ferramenta em si não envia nada; o link é um link comum, que só você pode decidir seguir, e não leva referrer (`rel="noopener noreferrer"`), então o VirusTotal não fica sabendo de que página você veio. O que o VirusTotal mostra, e o que ele faz com a consulta, segue os termos dele. O VirusTotal documenta o link como o caminho para o relatório de um arquivo que ele já analisou: se não houver relatório, o VirusTotal não viu esse arquivo, o que não diz nada sobre o arquivo ser seguro ou não.

## Comparar com um hash esperado

Abaixo das duas partes há uma caixa, **Comparar com um hash esperado**. Cole o hash que uma página de download publica e a ferramenta diz se ele é igual a um dos quatro resumos que ela calculou: os do arquivo quando há um arquivo, senão os do texto. Ela lê as formas que quem publica usa: hex puro, em maiúsculas ou minúsculas; hex escrito em pares de bytes com espaços ou dois-pontos; uma linha como o `sha256sum` imprime (o checksum, um espaço, um espaço ou um asterisco, o nome do arquivo: o que o GNU Coreutils chama de formato untagged); uma linha tagged como `SHA256 (arquivo.iso) = …`; um valor com o rótulo `sha256:` (a forma dos digests de imagens OCI: o algoritmo, dois-pontos, o valor codificado); e Base64, padrão ou URL-safe, com ou sem padding, inclusive um valor de Subresource Integrity como `sha384-…` (o algoritmo, um hífen, o valor em Base64). Quando o valor traz o rótulo de um algoritmo, só esse algoritmo é comparado, então um valor rotulado SHA-512 nunca confere com um SHA-256 por acaso. Quando confere, a ferramenta diz o algoritmo e a codificação. Quando não confere, diz se o valor pelo menos tem o tamanho de um dos quatro resumos, o que em geral quer dizer que os bytes calculados aqui não são aqueles para os quais o hash foi publicado, ou que ele foi copiado errado. Um MD5, de 32 caracteres hex, não é nenhum dos quatro e nunca confere. Nada é calculado de novo e nada é enviado: a comparação é entre textos que já estão na página.

## Exemplo

- O SHA-256 de `abc` é `ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad`, o vetor de teste padrão da especificação SHA.
- Com `abc` digitado, colar `sha256-ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0=` na caixa de comparação mostra que confere: é o SHA-256 do texto, em Base64.

## Como usar

Digite ou cole um texto e leia os quatro resumos, ou escolha ou solte um arquivo e leia os resumos dos bytes dele. Como um hash é unidirecional, esta ferramenta não consegue transformar um resumo de volta na sua entrada; recuperar uma entrada só é viável quando ela tinha pouquíssima entropia, o que o [Localizador de Pré-imagem de Hash](/tools/hash-preimage-finder) demonstra.

## Fontes

- [W3C File API (Working Draft, 12 de setembro de 2026)](https://www.w3.org/TR/FileAPI/): [tamanho e tipo do Blob](https://www.w3.org/TR/FileAPI/#attributes-blob), [arrayBuffer()](https://www.w3.org/TR/FileAPI/#arraybuffer-method-algo), [a interface File](https://www.w3.org/TR/FileAPI/#file-section) e [Errors and Exceptions](https://www.w3.org/TR/FileAPI/#ErrorAndException) (lidos em 2026-10-27)
- [W3C Web Cryptography Level 2, 14.3.5 The digest method](https://www.w3.org/TR/webcrypto/#SubtleCrypto-method-digest) e [32 SHA](https://www.w3.org/TR/webcrypto/#sha) (o rascunho publicado; o rascunho do editor de 22 de outubro de 2026 tem os mesmos passos) (lidos em 2026-10-27)
- [WHATWG HTML: o estado File Upload (input type=file)](https://html.spec.whatwg.org/multipage/input.html#file-upload-state-(type=file)), [a interface DataTransfer](https://html.spec.whatwg.org/multipage/dnd.html#the-datatransfer-interface) e os tipos de link [noopener](https://html.spec.whatwg.org/multipage/links.html#link-type-noopener) e [noreferrer](https://html.spec.whatwg.org/multipage/links.html#link-type-noreferrer) (lidos em 2026-10-27)
- [VirusTotal: How can I link to the most recent report on a given file or URL?](https://docs.virustotal.com/docs/most-recent-report) e [Empty file and VirusTotal uploads](https://docs.virustotal.com/docs/empty-file) (lidos em 2026-10-27)
- [Manual do GNU Coreutils: sha2 utilities](https://www.gnu.org/software/coreutils/manual/html_node/sha2-utilities.html) e [cksum common options (--check)](https://www.gnu.org/software/coreutils/manual/html_node/cksum-common-options.html) (manual do Coreutils 9.12, a versão atual; lidos em 2026-10-27)
- [Microsoft Learn: Get-FileHash](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/get-filehash?view=powershell-7.6) (a referência do PowerShell 7.6, a versão atual de manutenção de longo prazo; lido em 2026-10-27)
- [W3C Subresource Integrity](https://www.w3.org/TR/sri/), 3.5 The integrity attribute (a gramática `hash-expression = hash-algorithm "-" base64-value`) (lida em 2026-10-27)
- [Manual do GNU Coreutils: cksum output modes](https://www.gnu.org/software/coreutils/manual/html_node/cksum-output-modes.html) (os formatos tagged e untagged; Coreutils 9.12; lido em 2026-10-27)
- [OCI Image Format Specification: Descriptor](https://github.com/opencontainers/image-spec/blob/main/descriptor.md), seção Digests (`digest ::= algorithm ":" encoded`) (lida em 2026-10-27)
- [RFC 6234: US Secure Hash Algorithms](https://www.rfc-editor.org/rfc/rfc6234) (as mensagens de teste dela estão entre os vetores de arquivo da ferramenta; lida em 2026-10-27)
