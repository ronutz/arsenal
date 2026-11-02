# Explicador de fatores do score ZDX

Cole as métricas que o Zscaler Digital Experience expõe - o score composto, as métricas de Web Probe, as métricas de CloudPath - e leia de volta o que cada uma é, segundo a documentação do próprio fornecedor: qual família de probe a mede, o que significa, e como a semântica documentada do score se aplica.

## Escopo de honestidade, declarado de saída

A Zscaler documenta os fatores do score ZDX, sua cadência de probes, sua regra do menor-da-hora, sua escala de 0 a 100 e as três faixas (Good 66-100, Okay 34-65, Poor 0-33) - e **não** publica a fórmula composta exata. Esta ferramenta, portanto, **não computa score algum a partir de métricas**. Ela classifica um score dado contra as três faixas documentadas, explica o significado documentado e a atribuição de família de cada métrica, e diz com clareza onde a documentação para. Para métricas brutas, nenhum limiar publicado torna um valor bom ou ruim por si só - os critérios de alerta do ZDX são definidos pelo administrador, regra a regra - então a ferramenta explica a métrica e se recusa a graduá-la. A mesma regra de não-invenção das demais ferramentas deste site.

## Gramática de entrada

Uma métrica por linha, `métrica = valor`. Linhas começando com `#` são comentários.

- `score` - o score ZDX composto, um número inteiro de 0 a 100 (a Zscaler arredonda todo score para o número inteiro mais próximo)
- `pft`, `dns`, `srt` - tempos de Web Probe em milissegundos (Page Fetch Time, DNS Time, Server Response Time)
- `availability` - disponibilidade do Web Probe, percentual 0-100
- `path-latency`, `path-loss` - métricas de CloudPath (milissegundos, percentual)

## O que você recebe de volta

Cada métrica vira um cartão de leitura: seu selo de família de probe (Web Probe / CloudPath / composto), seu significado documentado - o Page Fetch Time requisitando apenas o documento de topo da página, o Server Response Time como o tempo até o primeiro byte - e, para o score, a classificação na faixa documentada Good, Okay ou Poor, com a nota da análise automática de causa raiz na Poor. Quando as duas famílias de probe estão presentes, a separação diagnóstica aparece: métricas web ruins sobre um caminho limpo apontam para a aplicação; um caminho ruim acusa a rede. As notas permanentes carregam a semântica documentada sobre a qual toda leitura viaja: probes de cinco minutos, o menor valor da hora como o valor horário, scores de aplicação fazendo a média do menor valor de cada usuário enquanto departamento, localidade, cidade e organização fazem a média do menor valor de cada intervalo de tempo, os três tipos de score (Synthetic Probe, RUM e Combined) que podem discordar para a mesma aplicação, o atraso de telemetria de cerca de vinte minutos, e a pequena variação de agregação aproximada entre API e dashboard.

Tudo roda localmente no seu navegador; nada do que você cola sai da página.

## Compartilhar resultado

Logo no começo da leitura, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva as métricas como foram coladas depois do `#`. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

Métricas podem descrever o desempenho de uma aplicação interna (por isso o popover traz uma linha de cuidado). Antes de oferecer um link, a caixa é verificada em busca de uma credencial que um padrão define: uma chave privada PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), seção 10), uma linha `Authorization` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), seção 11.6.2), uma linha `Cookie` com valor ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), seção 4.2.1), um JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), seção 1), uma senha numa URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), seção 3.2.1), um access key ID da AWS ou um valor `ENC` do FortiOS; todos lidos em 2026-11-01. A gramática não tem lugar para nenhum deles, mas uma linha de comentário é texto livre. Qualquer um deles significa sem link: o popover diz a linha, e você troca o valor por um placeholder e clica de novo. Um valor cujo nome só parece de segredo não impede o link; o popover cita o primeiro.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** A caixa é preenchida como se tivesse sido colada e a página lê cada métrica. Nada é contatado. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.

## Fontes

- Zscaler Reference Architecture: Zscaler Digital Experience (ZDX) - métricas de probe, cadência, semântica de menor-da-hora e média de grupo
- Zscaler Help: Evaluating User Details - a faixa Poor documentada (0-33) e sua análise automática de causa raiz
- Zscaler Help: Understanding the ZDX API - as calibragens de atraso de telemetria e variação de agregados
- [Zscaler Help: Understanding the ZDX Score](https://help.zscaler.com/zdx/understanding-zdx-score) - a escala de 0 a 100, as três faixas, as regras de consolidação, o arredondamento para inteiros e os tipos de score (lida em 2026-10-26)

A regra do fragmento por trás do Compartilhar resultado é a [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), seção 3.5 (lida em 2026-11-01), e as credenciais que a verificação procura são definidas na RFC 7468, na RFC 9110, na RFC 6265 e na RFC 7519 (lidas no mesmo dia).
