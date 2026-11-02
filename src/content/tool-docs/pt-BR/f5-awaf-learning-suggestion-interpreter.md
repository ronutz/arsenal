## O que faz

Caracterize uma sugestão do Traffic Learning do F5 AWAF - Advanced WAF (antigo BIG-IP ASM - Application Security Manager): sua ação, seu learning score, o violation rating médio, o modo de aprendizado, e se o tráfego por trás dela é confiável. A ferramenta diz se aceitar a sugestão afrouxa ou aperta a política, se um afrouxamento é uma correção de falso positivo genuína ou uma relaxação de segurança, e se o aprendizado Automático está prestes a fazer enforcement por você. É a ponte entre o estimador de envenenamento e a triagem de falso-positivo, e roda inteiramente no seu navegador.

## Afrouxamento vs aperto

O F5 separa as sugestões em duas direções. Sugestões de aperto tornam a política mais específica: remover um wildcard e adicionar entidades explícitas, fazer enforcement de uma entidade em staging, tornar um atributo mais específico. Aceitá-las geralmente melhora a segurança. Sugestões de afrouxamento relaxam a política: adicionar uma entidade permitida, permitir um meta-caractere, relaxar um atributo, desabilitar uma violação ou uma signature. Adicionar uma entidade legítima que a política simplesmente não tinha aprendido é de baixo risco, mas um afrouxamento que reduz o enforcement precisa de julgamento, e a ferramenta o julga pelo violation rating: 1 ou 2 é uma provável correção de falso positivo, 3 precisa de investigação, 4 ou 5 significa que você estaria relaxando um ataque real.

## O learning score e o vetor de envenenamento

Cada sugestão carrega um learning score que mostra o quão perto o sistema está de aceitá-la, e o score sobe conforme o violation rating cai. Então as sugestões de menor rating, as mais prováveis de serem falsos positivos, chegam ao auto-aceite mais rápido. Isso é intencional, mas também é exatamente o que um atacante alimentando muitas violações de baixo rating faz subir. Quando o modo é Automático, o afrouxamento reduz o enforcement, o tráfego é não confiável, e o score está subindo, a ferramenta sinaliza o vetor de envenenamento e aponta para o estimador de envenenamento para ver o quão longe está do limiar de auto-aceite. No aprendizado Manual um humano deve aceitar cada sugestão, então nada é enforced sem revisão.

## A disciplina

Para qualquer afrouxamento que reduz o enforcement, a ferramenta reafirma a regra do F5: relaxe a política apenas onde um falso positivo ocorreu, nunca onde um ataque real causou a violação. O violation rating é como você distingue os dois, e por isso ele dirige a avaliação.

## Grounding

As categorias de afrouxamento e aperto vêm do K03513854 do F5, e o comportamento do learning score, o auto-aplicar em 100% no modo Automático, e a disciplina de falso positivo vêm da documentação de aprendizado do ASM e do K70544352. A ferramenta modela comportamento documentado e não depende do JSON REST exato (variável por versão) da sugestão; você descreve a sugestão a partir da tela do Traffic Learning. Nada que você seleciona sai da página.

## Compartilhar resultado

Abaixo da avaliação, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva as cinco escolhas depois do `#`, pelos seus ids: `action`, `score` (0 a 100), `rating` (1 a 5, ou `na`), `mode` e `trust`. As cinco vão sempre, para que o link continue abrindo a mesma leitura. O popover diz primeiro o que o link leva e então oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o que vem depois do `#` não é enviado ao servidor quando o link é aberto; fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Ao abrir um link.** As cinco escolhas são definidas e a página calcula como faz numa mudança. Uma escolha que a página não oferece faz o link ser ignorado por inteiro. Os valores então saem do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
