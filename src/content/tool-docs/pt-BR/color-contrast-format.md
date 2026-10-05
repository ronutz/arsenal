## O que faz

Recebe duas cores, escritas em qualquer notação que o CSS Color Level 4 define, e responde à pergunta que uma folha de estilos levanta a cada texto e a cada controle: isto se lê sobre aquilo? Calcula a razão de contraste WCAG entre elas, testa-a contra todos os níveis dos três critérios de contraste, mostra uma prévia do par, converte cada cor a todas as notações com a sua luminância relativa e, onde um nível falha, encontra o primeiro plano mais próximo que passaria.

## O que lê

- **Cores nomeadas**: os 148 nomes do CSS Color Level 4, seção 6.1 (gray e grey, as duas grafias), e `transparent` (preto transparente).
- **Hex**: `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`; a caixa das letras não importa, e a forma curta é expandida pela repetição de cada dígito.
- **rgb() / rgba()**: números de 0 a 255 ou porcentagens, vírgulas legadas ou espaços modernos com `/ alfa`; componentes fora da faixa são limitados, como a especificação faz no momento da análise.
- **hsl() / hsla()** e **hwb()**: um matiz como número ou ângulo (deg, grad, rad, turn), depois porcentagens ou números de 0 a 100.
- **lab()**, **lch()**, **oklab()**, **oklch()**: com as faixas de referência de porcentagem da especificação (lab a e b: 100% = 125; lch C: 100% = 150; oklab a e b: 100% = 0.4; oklch C: 100% = 0.4; L: 100% = 100 em Lab, 1 em OKLab).
- **color()**: `srgb`, `srgb-linear`, `display-p3`, `display-p3-linear`, `xyz`, `xyz-d65`, `xyz-d50`.
- `none` como componente vale zero, como diz a especificação.

## O que calcula

- **Luminância relativa** (WCAG 2.2): cada canal sRGB é linearizado (c / 12.92 até 0.04045, senão ((c + 0.055) / 1.055) ^ 2.4) e ponderado, L = 0.2126 R + 0.7152 G + 0.0722 B. O WCAG 2.0 e o 2.1 escreviam o limiar como 0.03928; para valores de canal de 8 bits, os dois limiares classificam todos os valores do mesmo jeito.
- **Razão de contraste**: (L1 + 0.05) / (L2 + 0.05), a mais clara sobre a mais escura, de 1:1 a 21:1.
- **Níveis**: critério de sucesso 1.4.3 Contraste (mínimo), nível AA, 4.5:1 para texto e 3:1 para texto em escala grande; 1.4.6 Contraste (aprimorado), nível AAA, 7:1 e 4.5:1; 1.4.11 Contraste não textual, nível AA, 3:1 para componentes de interface e objetos gráficos. Texto em escala grande tem ao menos 18 pontos, ou 14 pontos em negrito.
- **Alfa**: um primeiro plano translúcido é composto sobre o fundo antes da medida (mistura alfa simples em sRGB, como uma tela pinta), porque o WCAG define contraste entre as cores como mostradas. O alfa do fundo é ignorado.
- **Gamut**: uma cor fora do sRGB (um amarelo display-p3, um oklch() saturado) é recortada ao gamut para as notações sRGB e para a luminância, e marcada; as formas Lab, LCH, OKLab, OKLCH e XYZ mantêm o valor sem recorte.
- **Correções**: para cada nível que o par não alcança, a luminosidade do primeiro plano é movida em OKLCH, para mais claro e para mais escuro, com matiz e croma mantidos (o croma só é reduzido quando o resultado sairia do gamut), até alcançar o alvo; o resultado vem como hex e oklch() com a razão alcançada.

## Conversões

As conversões são o código de exemplo da própria especificação, transcrito: a função de transferência sRGB, as matrizes racionais sRGB para XYZ e display-p3 para XYZ, a adaptação de Bradford entre D65 e D50, o CIE Lab com as suas constantes racionais, as duas matrizes do OKLab, as formas polares com os seus limiares de matiz sem efeito, e os algoritmos HSL e HWB. O motor reproduz os exemplos resolvidos da especificação: `#7654CD` é `lab(44.36% 36.05 -58.99)` e `color(xyz-d65 0.21661 0.14602 0.59452)`; as cores dos exemplos lab() e oklch() concordam entre si; `color(display-p3 1 1 0)` cai em `oklch(0.9648 0.245 110.23)`.

## Limites

- A razão é a fórmula do WCAG, que os critérios exigem; não é um modelo de percepção, e um par que passa ainda pode ser difícil para alguns leitores (tipos finos, tamanhos pequenos, diferenças de visão de cor). A prévia existe para que os olhos também votem.
- Gerenciamento de cor não é modelado: o perfil da própria tela não é consultado, e cores de gamut amplo são julgadas pelo seu recorte sRGB.
- As correções mudam só a luminosidade. Um designer pode preferir mudar matiz ou croma; a ferramenta mostra o que o movimento de luminosidade sozinho alcança.
- Cores de sistema nomeadas (`Canvas`, `LinkText`) e `currentcolor` dependem da página e não são lidas.

## Fontes

- [WCAG 2.2, W3C Recommendation 12 December 2024](https://www.w3.org/TR/WCAG22/) (lida em 2026-10-05): luminância relativa, razão de contraste, SC 1.4.3, 1.4.6, 1.4.11, texto em escala grande
- [CSS Color Module Level 4, W3C Candidate Recommendation Draft 30 September 2026](https://www.w3.org/TR/css-color-4/) (lida em 2026-10-05): notações, faixas de referência de porcentagem, cores nomeadas
- [Código de exemplo do CSS Color Level 4 no repositório csswg-drafts](https://github.com/w3c/csswg-drafts/tree/main/css-color-4) (lido em 2026-10-05): conversions.js, utilities.js, rgbToHsl.js, hslToRgb.js, hwbToRgb.js, rgbToHwb.js
