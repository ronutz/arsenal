## O que faz

Duas direções, detectadas automaticamente. Cole texto grego e a ferramenta o decompõe letra a letra - nome, transliteração, a nota do sigma final quando se aplica - e translitera o todo. Digite nomes de letras (lambda; mu omega) e a ferramenta produz os glifos com suas notas de uso. Abaixo do conversor está a tabela de referência completa das 24 letras: par de glifos, nome, romanização moderna com a forma clássica entre parênteses quando difere, e o lugar onde a engenharia provavelmente encontrou cada letra.

## A conexão com a engenharia

O alfabeto grego é o segundo alfabeto de todo campo técnico: μ é micro, Ω é ohm, λ é comprimento de onda e o cálculo lambda, Σ soma e σ desvia, Δ é a própria mudança. A tabela diz onde cada letra ganha o seu lugar.

## Transliteração, declarada

A ferramenta segue o esquema moderno amplamente ensinado (β vira v, η vira i); quando a romanização clássica difere (β vira b, η vira e), ambas são mostradas, porque uma ferramenta que escolhe em silêncio está adivinhando por você.

## Compartilhar resultado

Abaixo da leitura, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva a caixa como foi digitada depois do `#` (texto em grego, ou nomes de letras), assim que a página tem uma leitura; um texto que ela recusa não tem o que compartilhar. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Ao abrir um link.** O texto preenche a caixa como se tivesse sido colado e a página o decompõe ou monta. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
