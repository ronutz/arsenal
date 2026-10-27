## O que faz

Decodifique uma solicitação de assinatura de certificado PKCS#10 e leia o que ela contém: o nome do sujeito, a chave pública, os Subject Alternative Names e outras extensões que o solicitante está pedindo, e quaisquer atributos. Ela analisa a estrutura da solicitação inteiramente no seu navegador e nunca contata uma autoridade certificadora.

## O que é uma CSR, e o que ela não é

Uma CSR é o objeto que você entrega a uma autoridade certificadora quando pede que ela emita um certificado. O importante é que ela não é um certificado. Não tem número de série, nem emissor, nem datas de validade, porque nada disso foi decidido ainda. Ela carrega apenas o que o solicitante está pedindo: um nome de sujeito, uma chave pública e, opcionalmente, um conjunto de extensões solicitadas, como Subject Alternative Names. A solicitação inteira é assinada com a chave privada que corresponde à chave pública dentro dela, o que prova que o solicitante de fato possui essa chave privada, um passo chamado prova de posse.

## Solicitado, não concedido

Ler uma CSR diz o que foi pedido, não o que uma AC vai conceder. Uma autoridade certificadora é livre para acrescentar, alterar ou descartar o que uma CSR solicita de acordo com sua própria política e com a validação que realiza, então os SANs e as extensões que você vê aqui são um pedido, não uma garantia. Essa distinção importa quando um certificado emitido não corresponde à CSR: isso é frequentemente a AC aplicando política, e não um erro.

## O que ela decodifica

A solicitação é ASN.1 codificado em DER (a mesma codificação tag-length-value que os certificados usam), e o decodificador a percorre transformando-a em campos legíveis:

- o **nome distinto (DN) do sujeito**;
- a **chave pública** e seu algoritmo e tamanho;
- as **extensões solicitadas**, carregadas em um atributo `extensionRequest` do PKCS#9, mais importante os Subject Alternative Names; e
- outros **atributos**, como uma senha de desafio (challenge password) ou um nome não estruturado, quando presentes.

Ela decodifica apenas a estrutura. Não verifica a autoassinatura da solicitação e, como uma CSR não tem janela de validade, não há nada relativo ao tempo para checar.

## Como usar

Cole uma CSR PKCS#10 (o bloco entre os marcadores CERTIFICATE REQUEST) e leia seu sujeito, chave, SANs e extensões solicitados, e atributos. A análise é determinística e local.

## Compartilhar resultado

Abaixo da nota de abertura, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva depois do `#` a caixa como você colou: `/tools/csr-decoder#input=-----BEGIN%20CERTIFICATE%20REQUEST-----...`. Uma solicitação é o que você manda para a CA: um subject, uma chave pública e as extensões pedidas. O que mais estiver na caixa vai junto. O popover dele diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-10-27) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então a solicitação não é enviada ao servidor quando o link é aberto; ela fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-la.

- **Sem link em dois casos.** Quando a caixa também tem uma chave privada (um bloco `-----BEGIN ... PRIVATE KEY-----`, como alguns geradores imprimem a solicitação junto com a chave), e quando a solicitação traz uma senha de desafio, que esta página mostra em claro: a solicitação é assinada, então não dá para compartilhá-la sem a senha. O popover diz qual dos dois.
- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** O link tem a forma `#input=` que esta página já lê, então abri-lo funciona exatamente como esses links sempre funcionaram: o valor preenche a caixa e é decodificado, e fica no endereço até você mudar ou limpar a caixa.
