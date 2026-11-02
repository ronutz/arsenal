## O que a ferramenta faz

Descreva uma falha em seis campos estruturados - sintoma, escopo, mudança recente, padrão temporal, pistas de camada observadas e um preset de domínio - e um registro fixo de 25 regras originais dispara deterministicamente sobre essa descrição. O resultado são HIPÓTESES A TESTAR, classificadas, em 13 domínios de falha (regressão por mudança, resolução de nomes, TLS/PKI, capacidade, MTU do caminho, ambiente do cliente, dependência compartilhada, caminho assimétrico, cadeia de identidade, backend parcial, aplicação/backend, lacuna de provisionamento, provedor externo). Cada hipótese carrega três partes honestas: as evidências que valem a coleta, as observações que a SUSTENTARIAM e as observações que a ENFRAQUECERIAM. Avisos de qualidade verificam a própria entrada - "nada mudou" é sinalizado como uma hipótese a confirmar no registro de mudanças, não como um fato. Um clique exporta uma planilha em Markdown pronta para o chamado, o chat da ponte de crise ou um caso de TAC, com as evidências que você marcou assinaladas.

## O que ela deliberadamente não é

Esta ferramenta estrutura; nunca diagnostica. Não faz afirmações de causa raiz, não executa remediação, não abre conexões de rede e não pede credenciais nem segredos. Não substitui o TAC do fornecedor, a aprovação de mudanças nem a revisão de produção - ela organiza melhor a sua primeira hora com eles. As notas de texto livre (resumo, impacto, já tentado) entram apenas na planilha exportada; nunca influenciam a classificação, então o comportamento do motor permanece totalmente determinístico.

## Como a classificação funciona - e como é verificada

Cada regra é um predicado puro sobre a entrada estruturada, com uma contribuição fixa de pontos para uma hipótese; as pontuações se acumulam, e o desempate determinístico é a ordem do registro. O selo de sinal é uma faixa de pontuação (forte ≥ 60, moderado ≥ 30, fraco abaixo), chamado deliberadamente de "sinal" e não de confiança: descreve quais regras dispararam, não uma probabilidade sobre o mundo. O painel "Por que esta classificação?" expõe cada regra disparada com seus pontos, tornando o conselho auditável.

Como não existe um conjunto "correto" de hipóteses para uma ferramenta consultiva, os vetores dourados clássicos não se aplicam. O modelo de verificação - definido por este piloto para toda a família Operações e fieldcraft - são VETORES DE INSTANTÂNEO DE DISPARO DE REGRAS: para cada entrada de teste, o build assevera exatamente quais regras disparam, em que ordem, a lista exata de hipóteses classificadas com pontuações e faixas de sinal, e o conjunto exato de avisos. Treze vetores (oito cenários, cinco rejeições) fixam o registro atual; qualquer deriva em regras, pesos ou classificação quebra o build.

## Compartilhar resultado

Abaixo do título da planilha, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva todos os campos do formulário depois do `#`: as quatro escolhas pelos seus ids (`symptom`, `scope`, `timing`, `preset`, sempre), as mudanças e pistas marcadas (`changed`, `clues`, na ordem do formulário) e as três notas como foram digitadas (`summary`, `impact`, `alreadytried`). O popover diz primeiro o que o link leva, depois uma cautela própria (notas podem citar o serviço afetado, os usuários e hosts), e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

As suas marcações não vão junto: são o seu progresso nesta página (a exportação em Markdown as leva), e pertencem ao resultado, não ao que você digitou.

As notas são onde entram nomes de hosts, clientes, pessoas e números de ticket, então antes de oferecer um link elas passam pela verificação de segredos do site. Um valor que é credencial pelo próprio formato impede o link, e o popover diz qual nota: uma chave privada PEM ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), seções 10 e 11), credenciais de Authorization ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), seção 11.6.2), uma linha de Cookie ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), seção 4.2.1), um JWS ou JWE (a serialização que os JWTs usam, [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), seção 1), uma senha numa URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), seção 3.2.1), um access key ID da AWS ou um valor `ENC` do FortiOS. Coloque um placeholder no lugar e clique de novo. Um valor cujo nome só parece de segredo (`db_password=...`) continua ganhando link, e a linha de cautela diz em que nota ele está para você conferir antes.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o formulário não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue ler.

- **Tamanho.** No máximo 16.384 caracteres no total, o limite que o site usa para todo valor depois do `#`; um compartilhamento maior não ganha link, e o popover diz o tamanho.
- **Ao abrir um link.** O formulário e as notas são preenchidos, as marcações de evidência começam vazias e as hipóteses são classificadas como numa mudança; nada é buscado. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.

## Entrada da API

A entrada de paridade da API recebe um objeto JSON: `{"symptom", "scope", "changed": [], "timing", "clues": [], "preset", "notes": {"summary", "impact", "alreadyTried"}}`. Todos os campos, exceto `notes`, usam os vocabulários fechados mostrados no formulário; um valor fora do vocabulário é um erro de formato, nunca um palpite. `changed` deve conter ao menos `nothing-known`.
