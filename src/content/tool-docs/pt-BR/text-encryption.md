## O que faz

Digite um texto e uma senha, clique em Criptografar e você recebe uma única string que começa com `aesgcm1.`. Cole essa string de volta no modo Descriptografar, digite a mesma senha e o texto volta exatamente como era. Tudo acontece no seu navegador, pela Web Cryptography API dele: o texto e a senha nunca são enviados, nunca são armazenados e nunca vão para o endereço da página.

A ferramenta é para o seu próprio texto e a sua própria senha: uma anotação que você quer guardar em um arquivo ou em uma conversa sem deixá-la legível, ou um segredo que você quer entregar em duas partes (a string por um caminho, a senha por outro). Ela só abre o que foi selado com uma senha que você tem. Não adivinha, não quebra e não recupera mais nada, e uma senha errada não devolve nada.

## Como funciona

Cada passo é uma primitiva da [Web Cryptography API](https://www.w3.org/TR/WebCryptoAPI/), a implementação do próprio navegador; nenhum código criptográfico é escrito na página.

1. **A senha é preparada.** Todo espaço não ASCII (categoria Unicode Zs, como o espaço sem quebra) vira um espaço comum, e depois se aplica a Forma de Normalização C do Unicode (NFC): são as duas regras de mapeamento do perfil OpaqueString da [RFC 8265](https://www.rfc-editor.org/rfc/rfc8265) (seção 4.2.2, regras 2 e 4). Um "ç" digitado como um único caractere e um "ç" colado como "c" mais uma cedilha combinante passam a gerar a mesma chave. Nada mais muda: maiúsculas e minúsculas são mantidas, e nenhum caractere é recusado, a não ser um surrogate sem par, que o UTF-8 não consegue representar. O resultado é codificado em UTF-8 ([RFC 3629](https://www.rfc-editor.org/rfc/rfc3629)).
2. **Uma chave é derivada.** O PBKDF2 (Password-Based Key Derivation Function 2, [RFC 8018](https://www.rfc-editor.org/rfc/rfc8018), seção 5.2), com o HMAC-SHA-256 como função pseudoaleatória, transforma a senha, um salt aleatório de 16 bytes e 600.000 iterações em uma chave de 256 bits para o AES (Advanced Encryption Standard).
3. **O texto é selado.** O AES no modo Galois/Counter (GCM, [NIST SP 800-38D](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf)) criptografa o texto, em UTF-8, com essa chave e um vetor de inicialização (IV) aleatório de 12 bytes, e produz uma tag de autenticação de 128 bits. Os quatro primeiros campos da string entram no GCM como dados autenticados adicionais, então a tag também cobre esses campos.
4. **Uma string é escrita.** A marca de versão, a contagem de iterações, o salt, o IV e o texto cifrado com a sua tag, unidos por pontos.

Descriptografar faz o caminho inverso: lê os campos, prepara a senha do mesmo jeito, deriva a mesma chave a partir do salt e da contagem que estão na string e deixa o AES-GCM conferir a tag antes de devolver qualquer coisa. É o formato que a RFC 8018 chama de PBES2 (seção 6.2): uma chave do PBKDF2 e, depois, um esquema de criptografia. O formato da string em volta disso é desta ferramenta, e está descrito abaixo para que qualquer pessoa possa reimplementá-lo.

O salt e o IV são sorteados pela página com `crypto.getRandomValues`, que a Web Cryptography API define como o preenchimento de um array com "cryptographically secure random bytes" (bytes aleatórios criptograficamente seguros, seção 10.1.1). O engine em si recebe os dois como entradas e não sorteia nada, e é por isso que ele pode ser testado byte por byte com um salt e um IV fixos. É também por isso que criptografar duas vezes o mesmo texto com a mesma senha gera duas strings diferentes, e as duas descriptografam.

## A string

```
aesgcm1.600000.AAECAwQFBgcICQoLDA0ODw.EBESExQVFhcYGRob.3lWZqiea5CBm...
```

| Campo | Conteúdo | Codificação |
|---|---|---|
| 1 | `aesgcm1`: esta construção, versão 1 do formato | ASCII |
| 2 | A contagem de iterações do PBKDF2 | Decimal, sem sinal, sem zero à esquerda, de 1.000 a 10.000.000 |
| 3 | O salt, 16 bytes | base64url sem padding, 22 caracteres |
| 4 | O IV, 12 bytes | base64url sem padding, 16 caracteres |
| 5 | O texto cifrado seguido da tag de 16 bytes | base64url sem padding |

- **base64url** é o alfabeto seguro para URLs e nomes de arquivo da [RFC 4648](https://www.rfc-editor.org/rfc/rfc4648) (seção 5): A a Z, a a z, 0 a 9, `-` e `_`. O padding `=` fica de fora, o que a seção 3.2 permite quando a especificação diz isso: aqui o campo termina no próximo ponto. A decodificação é estrita: qualquer outro caractere, um comprimento que não codifica bytes inteiros ou um último caractere cujos bits não usados não sejam zero é recusado (a seção 3.5 permite que um decodificador rejeite uma codificação não canônica). O ponto não faz parte desse alfabeto, então um campo nunca contém um ponto.
- **Os dados autenticados adicionais** são o texto dos campos 1 a 4 com os seus três pontos, exatamente como foi escrito. Mude a versão, a contagem, o salt ou o IV e a tag deixa de ser verificada, mesmo que o resto da string esteja intacto.
- **Espaço em branco** (espaços, tabulações, quebras de linha) em qualquer ponto de uma string colada é removido antes da leitura, porque clientes de e-mail quebram linhas longas; o resultado avisa quando isso aconteceu.
- **Tamanho.** O texto cifrado tem o tamanho do texto em UTF-8, mais a tag de 16 bytes. Por isso o comprimento da string mostra mais ou menos o tamanho do texto.

## Por que estes números

- **600.000 iterações.** O [Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) da OWASP traz "PBKDF2-HMAC-SHA256: 600,000 iterations (recommended)" (lido em 2026-10-27). Cada iteração é mais um cálculo de HMAC para quem tenta senhas contra a sua string, e para você uma vez a cada criptografia ou descriptografia: espere o botão levar um momento.
- **De 1.000 a 10.000.000 ao descriptografar.** A contagem está na string, então a descriptografia a segue, dentro do intervalo que a [NIST SP 800-132](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-132.pdf) estabelece (seção 5.2): "A minimum iteration count of 1,000 is recommended" (recomenda-se uma contagem mínima de 1.000 iterações), e "an iteration count of 10,000,000 may be appropriate" (10.000.000 pode ser adequado) para chaves especialmente críticas. A RFC 8018 cita o mesmo texto (seção 4.2). O teto também impede que uma string montada de propósito faça a página derivar uma chave durante minutos.
- **Um salt de 16 bytes.** SP 800-132, seção 5.1: "The length of the randomly-generated portion of the salt shall be at least 128 bits" (a parte gerada aleatoriamente do salt deve ter pelo menos 128 bits). A RFC 8018 (seção 3) lembra que o salt e a contagem de iterações "need not be kept secret" (não precisam ser mantidos em segredo); eles viajam na string.
- **Um IV de 12 bytes, sorteado.** A SP 800-38D recomenda restringir os IVs a 96 bits "to promote interoperability, efficiency, and simplicity of design" (para favorecer a interoperabilidade, a eficiência e a simplicidade do projeto, seção 5.2.1.1). A regra central dela é que o mesmo IV não pode ser usado duas vezes com a mesma chave (seção 8, com probabilidade "no greater than 2^-32"), e, quando os IVs são aleatórios, ela limita a 2^32 o número de criptografias com uma mesma chave (seção 8.3). Aqui, cada criptografia tem um salt aleatório novo, portanto uma chave nova, além de um IV aleatório novo.
- **Uma tag de 128 bits**, a mais longa que o GCM permite (seção 5.2.1.2) e o padrão da Web Cryptography API.
- **AES-256.** O PBKDF2 deriva 32 bytes, importados como uma chave AES-GCM que não pode ser exportada do objeto de chave do navegador.

## O que protege, e o que não protege

**Protege** o conteúdo do texto enquanto ele está na string, contra quem tem a string mas não tem a senha, e detecta qualquer alteração na string: o AES-GCM devolve o texto inteiro ou a resposta única FAIL (SP 800-38D, seção 7.2), e a página mostra FAIL como "Senha errada ou texto alterado", sem mais nada. Não existe resultado parcial para ler.

**Não protege:**

- **Uma senha fraca.** Quem tem a string pode testar senhas no próprio hardware, quantas vezes e na velocidade que quiser; a página não participa disso e não tem como desacelerar ninguém. A RFC 8018 diz isso com todas as letras: a criptografia baseada em senha "is generally limited in the security that it can provide" (costuma ser limitada na segurança que pode oferecer), em especial "where offline password search is possible" (quando é possível procurar a senha offline, seção 8). A contagem de iterações multiplica o custo de cada tentativa; ela não impede que quem tenta chegue a uma senha que está no começo da lista. A SP 800-132 (apêndice A.1) acrescenta que essa busca pode ser paralelizada e rodar em um sistema "much more powerful" (muito mais potente) do que o seu.
- **Contra quem sabe a senha.** Quem tem a string e a senha lê o texto. Envie as duas separadamente, e nunca na mesma mensagem.
- **Um dispositivo em que você não pode confiar.** Um malware ou um keylogger vê o que você digita antes que qualquer coisa seja criptografada; o NIST observa que capturar o que é digitado é "equally effective on lengthy and complex passwords as they are on simple ones" (tão eficaz contra senhas longas e complexas quanto contra senhas simples, [SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html), apêndice A). As próprias considerações de segurança da Web Cryptography API dizem que um script injetado em uma página "may allow for the exfiltration of keys or data" (pode permitir a exfiltração de chaves ou dados), e que os navegadores não são obrigados a apagar o material de chave da memória ou do armazenamento (seção 6.2).
- **O tamanho.** A string mostra mais ou menos o tamanho do texto.
- **O que acontece depois de descriptografar.** O texto aparece na página. Copiá-lo o coloca na área de transferência do sistema, onde outros programas podem lê-lo.

## A nota sobre a senha

Enquanto você digita uma senha no modo Criptografar, a página mostra o comprimento dela em caracteres e em bytes UTF-8 e quais tipos de caractere ela contém (letras minúsculas e maiúsculas, letras sem maiúscula e minúscula, dígitos, espaços, pontuação ou símbolos). Ela também avisa quando a senha começa ou termina com espaço em branco e quando a preparação a modifica. Ela **não calcula nenhuma nota de força**, de propósito:

- Quem tenta adivinhar não testa senhas ao acaso; testa primeiro as prováveis (palavras, nomes, datas, citações, senhas de vazamentos anteriores). A página não tem como saber em que lugar dessa lista está a sua, então um número seria inventado.
- O NIST trata o comprimento como "a primary factor in characterizing password strength" (um fator principal para caracterizar a força de uma senha) e conclui que regras de composição (exigir dígitos, maiúsculas e símbolos) acrescentam menos do que se espera, porque as pessoas as cumprem de forma previsível: "password" vira "Password1!" (SP 800-63B-4, apêndice A). Ele também diz que resistir a ataques offline exige senhas "orders of magnitude more complex" (ordens de grandeza mais complexas) do que resistir a tentativas online.
- A SP 800-132 (apêndice A.1) diz que senhas com menos de 10 caracteres costumam ser consideradas fracas, e frases-senha com menos de 20 caracteres também. O mesmo apêndice desaconselha sequências de números ou de letras e informações pessoais, como nome, telefone ou data de nascimento.

O modo Criptografar pede a senha duas vezes e fica desabilitado até as duas coincidirem: um texto criptografado com uma senha digitada errado não pode ser recuperado por ninguém.

## Nada sai da página

- **Nenhuma requisição.** Criptografar e descriptografar são chamadas à Web Cryptography API do navegador. Nada é enviado para este site nem para nenhum outro lugar.
- **Nenhum armazenamento.** O texto, a senha e os resultados existem só na memória da página enquanto ela está aberta; Limpar esvazia todos os campos. Nada é gravado no armazenamento local, em cookies ou em qualquer outro lugar.
- **Nada no endereço.** A página não escreve nada no próprio endereço. Um link só é criado quando você clica em Compartilhar resultado, e ele leva apenas a string criptografada (próxima seção).
- **O corretor ortográfico fica desligado** nos campos (o atributo HTML `spellcheck="false"`). A verificação ortográfica aprimorada do Chrome ([Enhanced spell check](https://support.google.com/chrome/answer/12027911?hl=en)) "sends the text you enter in your browser to Google" (envia ao Google o texto que você digita no navegador); o [HTML Standard](https://html.spec.whatwg.org/multipage/interaction.html) (seção 6.8.5) deixa uma configuração do próprio usuário passar por cima do atributo, então, se você forçou a verificação ortográfica em todo lugar, desligue-a antes de digitar segredos. Os campos de senha são campos do tipo password, que não estão entre os campos que o Standard diz que os navegadores devem verificar (campos de texto, de busca, de URL e de e-mail e áreas de texto), até você escolher Mostrar.
- **Nenhum formulário.** Os campos não estão dentro de um formulário e não têm nome, então nada pode enviá-los.
- **A Web Cryptography API exige um contexto seguro.** A interface `subtle` dela só existe em páginas servidas de forma segura (a especificação a marca como `[SecureContext]`); sem ela, a página avisa e não faz nada.

## Compartilhar resultado

Abaixo da string criptografada (e, no modo Descriptografar, abaixo do botão Descriptografar), o botão **Compartilhar resultado** cria um link para esta página que leva a string criptografada e mais nada: nunca a senha, nunca o texto. Ele só cria o link quando você clica, diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema. O endereço da página não muda.

- **Onde a string vai.** Depois do `#`: `/tools/text-encryption#input=aesgcm1...`. A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o navegador não o envia ao servidor quando o link é aberto; ele fica na barra de endereço e no histórico de quem abre, e quem tem o link tem a string. Por isso a senha precisa ir por outro caminho.
- **Tamanho.** Um link leva no máximo 16.384 caracteres, o limite que o site usa para todo valor depois do `#`. Com 600.000 iterações, isso corresponde a um texto de até 12.230 bytes em UTF-8; uma string maior não ganha link, e o popover avisa: copie a string.
- **Ao abrir um link.** A página abre no modo Descriptografar com a string preenchida, avisa que ela veio de um link e apaga qualquer senha que você tinha digitado. Ela só descriptografa quando você digita a senha e clica em Descriptografar. Um valor que não seja uma string bem formada deste formato é ignorado. Nos dois casos, a página tira o valor do próprio endereço na hora (sem nenhuma requisição), então recarregar a página, salvá-la nos favoritos ou usar o botão Compartilhar da própria página não leva nada.
- **Prova.** Para cada golden vector de ida e volta e para o Exemplo, as verificações de compartilhamento do site montam o link e confirmam que nem a senha nem o texto aparecem nele, nem como foram digitados, nem codificados com porcentagem, nem codificados como formulário, nem decodificados.

## Códigos de erro

| Código | Significado |
|---|---|
| `empty-text` | Criptografar: não há texto |
| `text-too-large` | O texto tem mais de 1.048.576 bytes (1 MiB) em UTF-8, o limite da página (o próprio GCM permite até 2^39 - 256 bits) |
| `lone-surrogate` | O texto ou a senha contém um surrogate sem par, que o UTF-8 não consegue representar |
| `empty-passphrase` | Nenhuma senha |
| `passphrase-too-long` | Mais de 1.024 caracteres depois da preparação |
| `bad-salt-length` | Um salt que não tem 16 bytes |
| `bad-iv-length` | Um IV que não tem 12 bytes |
| `iterations-out-of-range` | Uma contagem de iterações fora do intervalo de 1.000 a 10.000.000 |
| `empty-input` | Descriptografar: nada além de espaço em branco |
| `input-too-large` | Descriptografar: mais de 2.000.000 de caracteres |
| `bad-format` | Não são cinco campos separados por pontos |
| `unknown-version` | Um primeiro campo diferente de `aesgcm1` (a marca diferencia maiúsculas de minúsculas) |
| `bad-iterations` | Um segundo campo que não é um inteiro decimal sem zero à esquerda |
| `bad-encoding` | Um campo de salt, IV ou texto cifrado que não está em base64url canônico sem padding |
| `too-short` | Um campo de texto cifrado menor do que a tag de 16 bytes |
| `auth-failed` | A tag não foi verificada: senha errada, ou uma string alterada depois de feita |
| `not-utf8` | A tag foi verificada, mas o conteúdo não é texto UTF-8 (esta ferramenta nunca escreve uma string assim) |
| `no-crypto` | A página não tem a Web Cryptography API |
| `crypto-error` | A Web Cryptography API recusou a operação por outro motivo |

A página lê uma string colada no momento em que ela é colada e mostra o formato, a contagem de iterações e os tamanhos dela, ou o motivo pelo qual ela não pode ser lida, antes de você digitar a senha.

## Exemplos

- **O botão Exemplo, no modo Criptografar**, preenche o texto "Lab notes: the core switch maintenance window moves to Saturday 02:00 (São Paulo)." e a senha `Password` nos dois campos. `Password` é a senha de teste da RFC 7914, seção 11, que qualquer pessoa pode ler; a página a identifica como a senha do Exemplo sempre que ela está no campo. Nunca a use para um texto de verdade. Clique em Criptografar e você recebe uma string de 187 caracteres (83 bytes de texto, 99 bytes depois de selado), diferente a cada vez.
- **O botão Exemplo, no modo Descriptografar**, preenche a string que o golden vector "example" fixa: `aesgcm1.600000.AAECAwQFBgcICQoLDA0ODw.EBESExQVFhcYGRob.3lWZ...` (a string completa está na página). Ela foi feita com um salt fixo (bytes 00 a 0f) e um IV fixo (bytes 10 a 1b), coisa que a própria página nunca usa. Com `Password` ela volta ao texto acima; com `password` ela dá `auth-failed`.
- **Um caractere alterado.** Mude qualquer caractere do texto cifrado, do salt, do IV ou da contagem de uma string válida e a descriptografia dá `auth-failed`, nunca um texto embaralhado.
- **A mesma senha, digitada de outro jeito.** "coração de exemplo" digitada com caracteres compostos, com caracteres decompostos ou com um espaço sem quebra entre as palavras deriva a mesma chave, então as três descriptografam a mesma string.

## Proveniência

O engine é um conjunto de funções puras em volta da Web Cryptography API: com o mesmo texto, a mesma senha, o mesmo salt, o mesmo IV e a mesma contagem, ele sempre escreve a mesma string. Ele traz golden vectors (conjunto `text-encryption-golden-2026-10-27`, 207 verificações):

- **Respostas conhecidas para as primitivas**: os dois vetores de PBKDF2-HMAC-SHA-256 da [RFC 7914](https://www.rfc-editor.org/rfc/rfc7914), seção 11; sete vetores de criptografia AES-GCM do arquivo `gcmEncryptExtIV256.rsp` do Cryptographic Algorithm Validation Program do NIST (AES-256, IV de 96 bits, tag de 128 bits; textos claros de 0 a 408 bits, dados adicionais de 0 a 720 bits), cada um também descriptografado de volta; e dois vetores de descriptografia do `gcmDecrypt256.rsp`, um dos quais o arquivo marca como FAIL e o engine recusa.
- **A codificação**: as strings da seção 10 da RFC 4648, e sete strings que o decodificador estrito precisa recusar.
- **Idas e voltas** com salts e IVs fixos (o Exemplo, com 600.000 iterações; ASCII, português com quebras de linha e uma tabulação, caracteres fora do Plano Multilíngue Básico, uma marca de ordem de bytes no início; três grafias da mesma senha), cada uma conferida nos dois sentidos. Cada string esperada foi calculada antes por um script Python separado (hashlib e o pacote cryptography) a partir do formato descrito aqui, e não pelo engine.
- **Recusas**: 35 recusas de descriptografia (todos os erros de formato, os limites de iterações, senhas erradas, um texto cifrado, uma tag, um IV, um salt e uma contagem alterados, o texto cifrado de outra string, e bytes autênticos que não são UTF-8) e 11 recusas de criptografia, cada uma com o seu código, e uma verificação de que nenhuma recusa traz texto algum.
- **Compartilhar resultado**: 5 strings que um link pode levar (compactas, sem espaço em branco) e 9 textos que ele não pode levar (um texto claro, uma senha, uma string truncada, outra versão, contagens fora do intervalo, codificações inválidas, uma senha acrescentada como sexto campo).

## API

Nenhuma, de propósito. A API HTTP do site executa ferramentas em um servidor; esta ferramenta teria de receber uma senha ou um texto claro lá, que é exatamente o que ela existe para não fazer. Ela está na lista das ferramentas excluídas da API, com esse motivo.

## Fontes

- [NIST SP 800-38D, Recommendation for Block Cipher Modes of Operation: Galois/Counter Mode (GCM) and GMAC, novembro de 2007](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf) (lida em 2026-10-27): seções 5.2.1, 7.1, 7.2, 8, 8.2.2 e 8.3. A [página dela no CSRC](https://csrc.nist.gov/pubs/sp/800/38/d/final) (lida em 2026-10-27) traz uma nota de planejamento de 6 de março de 2024: o NIST decidiu revisá-la.
- [NIST CAVP, vetores de teste do GCM (gcmtestvectors.zip)](https://csrc.nist.gov/CSRC/media/Projects/Cryptographic-Algorithm-Validation-Program/documents/mac/gcmtestvectors.zip) (lido em 2026-10-27): `gcmEncryptExtIV256.rsp` e `gcmDecrypt256.rsp`, CAVS 14.0
- [RFC 8018, PKCS #5: Password-Based Cryptography Specification Version 2.1](https://www.rfc-editor.org/rfc/rfc8018) (lida em 2026-10-27): seções 3, 4.1, 4.2, 5.2, 6.2 e 8; as quatro errata verificadas dela tratam só dos apêndices de ASN.1, e a RFC 9579 e a RFC 9879 a atualizam apenas para o PKCS #12
- [RFC 7914, The scrypt Password-Based Key Derivation Function](https://www.rfc-editor.org/rfc/rfc7914) (lida em 2026-10-27): seção 11, os vetores de teste de PBKDF2-HMAC-SHA-256
- [OWASP Cheat Sheet Series, Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) (lido em 2026-10-27): PBKDF2, 600.000 iterações para o PBKDF2-HMAC-SHA256
- [NIST SP 800-132, Recommendation for Password-Based Key Derivation, Part 1: Storage Applications, dezembro de 2010](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-132.pdf) (lida em 2026-10-27): seções 5.1 e 5.2, apêndice A. A [página dela no CSRC](https://csrc.nist.gov/pubs/sp/800/132/final) traz uma nota de planejamento de 11 de maio de 2023: o NIST está planejando revisá-la.
- [W3C, Web Cryptography API, Recommendation de 26 de janeiro de 2017](https://www.w3.org/TR/2017/REC-WebCryptoAPI-20170126/), e [Web Cryptography Level 2, First Public Working Draft de 22 de abril de 2025](https://www.w3.org/TR/WebCryptoAPI/), que hoje é servido no endereço da API (os dois lidos em 2026-10-27): getRandomValues, AES-GCM, PBKDF2, a regra do contexto seguro e as considerações de segurança
- [RFC 4648, The Base16, Base32, and Base64 Data Encodings](https://www.rfc-editor.org/rfc/rfc4648) (lida em 2026-10-27): seções 3.2, 3.5, 5 e 10
- [RFC 8265, Preparation, Enforcement, and Comparison of Internationalized Strings Representing Usernames and Passwords](https://www.rfc-editor.org/rfc/rfc8265) (lida em 2026-10-27): seção 4.2.2
- [RFC 3629, UTF-8, a transformation format of ISO 10646](https://www.rfc-editor.org/rfc/rfc3629) (lida em 2026-10-27)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (lida em 2026-10-27): seção 3.5, o fragmento
- [NIST SP 800-63B-4, Authentication and Authenticator Management](https://pages.nist.gov/800-63-4/sp800-63b.html) (lida em 2026-10-27): apêndice A, Strength of Passwords
- [Ajuda do Google Chrome, Turn Chrome spell check on and off](https://support.google.com/chrome/answer/12027911?hl=en) (lida em 2026-10-27), e o [HTML Standard, seção 6.8.5, Spelling and grammar checking](https://html.spec.whatwg.org/multipage/interaction.html) (lido em 2026-10-27)
