# Como contribuir com uma tradução

O ronutz.com foi feito para que acrescentar ou melhorar um idioma dê pouco trabalho, e contribuições são bem-vindas. Um idioma é duas coisas: uma entrada no registro de locales e um pacote de mensagens em JSON. Nenhum código da aplicação precisa mudar.

## Como o sistema funciona

- **Os pacotes.** O texto de cada idioma fica num único arquivo JSON de frases rotuladas, `src/i18n/messages/<código>.json`. A página de contribuição oferece todos os pacotes ativos para download, e os downloads são copiados dos pacotes de origem a cada build, então estão sempre atualizados. O `en.json` é a referência completa; os outros pacotes só precisam das frases que traduzem.
- **Fallback para o inglês.** Toda frase que um pacote não tem aparece em inglês. Por isso uma tradução parcial já é útil: ela entra no ar, e as frases que faltam continuam legíveis em inglês até alguém completá-las.
- **O registro.** `src/i18n/locales.ts` lista cada idioma com o nome nativo, a direção do texto e o status da tradução. O seletor de idioma, os endereços e os metadados de busca seguem esse registro.

## Status da tradução

Cada idioma tem um `status`:

| Status | Significado |
|---|---|
| `reviewed` | Um falante nativo leu e aprovou o pacote. |
| `machine-draft` | Um primeiro rascunho feito com IA ou tradução automática, ainda não revisado por um falante nativo. |
| `stub` | Ainda não há pacote; o idioma aparece em inglês. |

Texto rascunhado por máquina nunca é apresentado como texto nativo pronto. Um `machine-draft` é um ponto de partida que um falante nativo promove a `reviewed`. O português do Brasil é escrito com IA e revisado aos poucos, por isso mantém o status `machine-draft` e o aviso até que uma revisão humana ateste o contrário.

## Melhore um idioma em quatro passos

1. **Baixe o pacote** que quer melhorar na página de contribuição (para um idioma novo, baixe o `en.json`, a referência).
2. **Traduza o texto depois de cada rótulo.** Mude só os valores. Nunca altere um rótulo (a chave à esquerda) e deixe tudo o que está entre chaves exatamente como está: `{count}`, `{name}` e afins são preenchidos pelo site, e uma chave alterada quebra a página. Mantenha nomes de produtos e termos técnicos como são (BIG-IP, CIDR, F5, Fortinet e assim por diante), e mantenha o jargão técnico do jeito que os profissionais do seu idioma realmente falam.
3. **Defina o status** em `_meta.status` do pacote: `machine-draft` para um rascunho de IA ou de máquina, `reviewed` se você é falante nativo e conferiu o texto.
4. **Envie de volta.** Mande o arquivo editado por e-mail pela página de contribuição, dizendo qual é o idioma, ou abra um pull request no repositório público. Toda contribuição é revisada à mão.

## Pontuação

- **O inglês** é escrito sem travessão (em dash). No lugar dele vão vírgula, dois-pontos, parênteses ou uma frase nova; a meia-risca (en dash) aparece só entre números de um intervalo (10–20).
- **Todos os outros idiomas mantêm a própria pontuação natural.** Não importe a regra do inglês: as línguas românicas e eslavas usam o travessão delas (o travessão do português, a raya do espanhol, o тире do russo) onde a própria tipografia pede; o alemão e as línguas escandinavas usam a meia-risca com espaços; o chinês usa os sinais nativos de largura total (，。：；) e o próprio travessão de largura dupla. O francês mantém o espaço antes de ; : ! e ?.

## Observações

- **Idiomas da direita para a esquerda** (árabe, por exemplo) são tratados pelo layout; a direção vem do registro, então você só traduz o texto.
- **Pacotes parciais são bem-vindos.** Traduzir só a navegação e a página inicial já é uma primeira contribuição valiosa.
- **Um idioma que ainda não está no registro?** Acrescente uma linha a `LOCALES` em `src/i18n/locales.ts` com o código, o nome nativo, o nome em inglês, a direção e `status: "stub"`, depois acrescente o seu pacote, ou peça por e-mail e ele será acrescentado para você.
