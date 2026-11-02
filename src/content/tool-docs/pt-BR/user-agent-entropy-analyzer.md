## O que faz

Cole uma string de User-Agent e a ferramenta separa os tokens identificadores que ela carrega - navegador e versão, motor de renderização, sistema operacional e versão, classe de dispositivo e arquitetura de CPU - estima os bits distintivos que cada um contribui e sinaliza se a string está na forma reduzida e congelada que os navegadores modernos agora enviam.

## O ponto que ela mostra

Um User-Agent é um pequeno monte de entropia. Nenhum token isolado identifica você, mas juntos eles estreitam o campo, e quanto mais detalhada a string, mais distintiva ela é. A ferramenta mostra essa superfície com honestidade. Os valores de bits são ilustrativos, extraídos de pesquisa publicada sobre fingerprinting, não uma medição ao vivo de nenhuma população - o objetivo é tornar visível o formato da superfície, não pontuar você.

## Para onde foi o detalhe

Os navegadores modernos congelam o User-Agent: o Chromium fixa a versão menor em 0.0.0 e limita o detalhe de plataforma, e o Safari há muito fixou boa parte da sua string. O detalhe não desapareceu - migrou para os User-Agent Client Hints (Sec-CH-UA e afins), que um site precisa solicitar ativamente pelo header Accept-CH. A consequência é que a coleta de alta entropia agora é visível em headers, em vez de implícita numa string. Apenas decodifica/explica: a entrada é uma string que você cola, nada é lido do seu próprio navegador e nada é enviado.

## Compartilhar resultado

Abaixo do resumo, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva o User-Agent como foi digitado (`input`) depois do `#`. O popover diz primeiro o que o link leva, e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

Uma string de User-Agent cita um navegador, um motor e um sistema operacional, e todo servidor com que o navegador fala já a recebe. Mas a caixa aceita várias linhas, e uma requisição inteira copiada do devtools também é lida como User-Agent, então antes de oferecer um link o texto passa pela verificação de segredos do site: um valor que é credencial pelo próprio formato (uma linha `Cookie`, [RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), seção 4.2.1; credenciais de Authorization, [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), seção 11.6.2; um JWS ou JWE; uma senha numa URL; uma chave privada PEM; um access key ID da AWS) impede o link, e o popover diz a linha. Cole só o User-Agent e clique de novo. Um valor cujo nome só parece de segredo continua ganhando link, com uma linha que o aponta.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o texto não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue ler.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** O texto preenche a caixa como se tivesse sido colado e a página o analisa; nada é enviado. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
