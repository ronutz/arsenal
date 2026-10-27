## O que faz

Esta ferramenta recebe um nome de host e descobre duas coisas sobre ele: o **sufixo público** (o domínio de topo efetivo, ou eTLD) e o **domínio registrado** (o eTLD mais um rótulo, muitas vezes chamado de eTLD+1). Para `www.blog.example.co.uk` o sufixo público é `co.uk` e o domínio registrado é `example.co.uk`. Tudo roda localmente no seu navegador, contra uma cópia embutida da Public Suffix List; nada é enviado para lugar nenhum.

## Por que importa

O domínio registrado é a unidade que muitos sistemas contabilizam. Autoridades certificadoras como a Let's Encrypt aplicam seu limite de emissão por domínio ao domínio registrado, então `api.example.com` e `www.example.com` compartilham um único orçamento sob `example.com`. Os navegadores usam a mesma fronteira para decidir o escopo de cookies e o comportamento same-site. A pegadinha é que você não descobre isso simplesmente pegando os dois últimos rótulos: `example.co.uk` precisa de três rótulos porque `.co.uk` é em si um sufixo público, e a única forma correta de saber disso é a Public Suffix List.

## Como funciona

A ferramenta implementa o algoritmo publicado da Public Suffix List. Ela encontra a regra que se aplica ao seu host, preferindo uma regra de exceção (uma regra com `!`) a qualquer regra normal, e caso contrário tomando a regra com mais rótulos. Regras curinga como `*.ck` casam com qualquer rótulo único naquela posição. Se nenhuma regra casar, o rótulo mais à direita é tratado como o sufixo. O domínio registrado é então o sufixo público mais o próximo rótulo à sua esquerda, quando esse rótulo existe.

## Seções ICANN e PRIVATE

A lista tem duas partes. A seção **ICANN** é o conjunto de sufixos operados por registros, que os navegadores aplicam. A seção **PRIVATE** cobre nomes delegados por fornecedores, como `github.io` ou `*.compute.amazonaws.com`, onde um provedor distribui subdomínios. Elas podem discordar: sob a lista completa, `user.github.io` é seu próprio domínio registrado, mas apenas sob as regras ICANN o domínio registrado é `github.io`. Quando uma regra PRIVATE decide a resposta, a ferramenta também mostra a visão apenas-ICANN, porque essa é a interpretação que os limites de emissão de certificados e as verificações same-site usam.

## Observações

Digite apenas o nome de host; um esquema, porta, caminho ou um rótulo curinga `*.` no início são removidos automaticamente, e nomes internacionalizados são convertidos para sua forma punycode antes do casamento. Endereços IP são reportados como tal, em vez de interpretados como domínios, já que não têm sufixo público. Como a Public Suffix List muda com o tempo, a cópia embutida é um instantâneo datado; trate o resultado como correto na data desse instantâneo e atualize contra publicsuffix.org se precisar das regras mais recentes.

## Compartilhar resultado

Abaixo da resposta principal, **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva o nome de host como foi digitado (`#input=www.blog.example.co.uk`), e mais nada. Tudo o que o link leva vai depois do `#`, e a [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-10-27) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado): o navegador não o envia ao servidor quando o link é aberto, mas ele fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** Um link leva no máximo 16.384 caracteres, o limite que o site usa para todo valor depois do `#`; um nome de host é bem mais curto.
- **Ao abrir um link.** O nome de host preenche o campo como se tivesse sido digitado, e a página o consulta de novo na cópia da lista que traz consigo; um endereço IP ou um nome malformado recebe o aviso da própria página. Aceitos ou não, os valores saem do endereço da própria página na hora, sem nenhuma requisição, então recarregar, salvar nos favoritos ou usar o botão Compartilhar da própria página não leva nada que você não escolheu compartilhar.
