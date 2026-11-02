## O que faz

Digite um número (1 a 3999) e leia o numeral romano; digite um numeral e leia o valor. A ferramenta sempre mostra a forma subtrativa canônica e como ela se constrói casa a casa: 1994 é M + CM + XC + IV. Tudo é calculado no seu navegador.

## Validação honesta

Grafias aditivas históricas que os próprios romanos usavam - IIII nos relógios, MDCCCCX nas fachadas - são aceitas, valoradas corretamente e sinalizadas com a forma canônica ao lado. Cadeias realmente malformadas são recusadas com a regra específica que violam: IL não é um par subtrativo legal (apenas IV, IX, XL, XC, CD, CM subtraem), VV repete um símbolo que nunca se repete, IIX subtrai dois símbolos onde apenas um pode ser subtraído.

## Por que para em 3999

O sistema clássico tem sete símbolos, nenhum zero e nada acima de M (1000). Para valores maiores os romanos escreviam o vínculo - uma barra superior multiplicando por 1000 - que não tem forma em texto simples. Em vez de inventar uma convenção, a ferramenta declara o limite.

## Compartilhar resultado

Abaixo do resultado, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva o número ou o numeral como foi digitado depois do `#`, assim que a página o converte; um valor que ela recusa não tem o que compartilhar. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Ao abrir um link.** O valor preenche a caixa como se tivesse sido colado e a página o converte. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
