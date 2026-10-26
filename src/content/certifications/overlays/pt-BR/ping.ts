// ============================================================================
// src/content/certifications/overlays/pt-BR/ping.ts
// ----------------------------------------------------------------------------
// pt-BR PROSE OF THE PING IDENTITY STUDY GUIDES (PRIME 26/10/2026). Each entry, keyed
// by guide slug, holds ONLY translated prose (GuideOverlay); facts, codes, names
// and objective text stay in study-guides.ts. Rules: src/content/certifications/
// localized.ts. Generated from the translation sources by the cert-pt batch and
// checked by scripts/check-cert-translation.mts (alignment) and
// scripts/check-ptbr-register.mjs (register). Edit here and rerun both.
// ============================================================================

// The overlay's shape.
import type { GuideOverlay } from "@/content/certifications/localized";

/** Translated prose of the Ping Identity guides, keyed by guide slug. */
export const PT_BR_PING: Record<string, GuideOverlay> = {
  // PAAA-001: Certified Expert - PingAccess.
  "ping-ce-pingaccess": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "Não informado na página oficial da prova (segundo o Certification Guide, as provas Certified Expert são de múltipla escolha ou práticas em laboratório)",
      passMark: "Não informada na página oficial da prova",
      cost: "EUR 460 / GBP 390 / USD 495 (pode haver imposto regional); cada voucher vale para uma única tentativa",
      note: "Cada código de voucher vale para uma única tentativa de prova; depois de resgatado, não pode ser reutilizado. A prova cobre o PingAccess versão 7 ou posterior.",
    },
    // Key points: this site's study notes, translated objective by objective in the English order.
    keyPoints: {
      // Site-authored notes, so translated.
      rule: "site-notes",
      // Objective id -> translated points.
      byObjective: {
        // PAAA-001.1.01 Create a Web+API application object in the admin console
        "PAAA-001.1.01": [
          "Uma aplicação Web+API atende tanto o tráfego de navegadores quanto as chamadas programáticas de API sob um único objeto de aplicação.",
          "O tráfego web usa uma web session (baseada em cookie); o tráfego de API usa bearer tokens OAuth; a aplicação carrega as duas configurações.",
          "As configurações no nível do resource decidem quais padrões de caminho são tratados como web e quais como API.",
          "É o padrão para uma single-page application que chama a sua própria API de backend no mesmo host.",
          "Acerte primeiro o destino e o virtual host; uma configuração de autenticação sobre uma rota quebrada não pode ser verificada.",
        ],
        // PAAA-001.1.02 Create an application
        "PAAA-001.1.02": [
          "Uma aplicação liga um virtual host e um context root a um site ou agent, além de uma web session e de um identity mapping.",
          "O tipo da aplicação (Web, API ou Web+API) determina quais mecanismos de autenticação ficam disponíveis.",
          "O context root determina o prefixo de caminho que pertence ao PingAccess; roots sobrepostos no mesmo virtual host são um erro de configuração.",
          "Os resources dentro da aplicação refinam a policy por caminho.",
          "A aplicação é a unidade de policy de nível mais alto; quase todos os outros objetos são referenciados a partir dela.",
        ],
        // PAAA-001.1.03 Create a virtual host
        "PAAA-001.1.03": [
          "Um virtual host é host mais porta, comparado com o header Host da requisição.",
          "Curingas são suportados na parte do host; vence a correspondência mais específica.",
          "Agents e gateways despacham pelo virtual host, então ele precisa corresponder ao nome que o client de fato usa.",
          "A escolha do key pair para o TLS fica associada ao listener, e o certificado precisa cobrir o nome do virtual host.",
          "Uma divergência entre o header Host do navegador e o virtual host configurado é a causa mais comum de 404s inesperados.",
        ],
        // PAAA-001.1.04 Create a web session
        "PAAA-001.1.04": [
          "Uma web session define o cookie que representa uma sessão autenticada de navegador no PingAccess.",
          "A configuração cobre audience, tipo de cookie (JWT cifrado), timeouts de inatividade e máximo, e o client OIDC usado junto ao token provider.",
          "A audience delimita o cookie, para que ele não possa ser reaproveitado contra outra aplicação.",
          "O estado da sessão pode ficar no cookie ou no servidor, o que afeta o cluster e a revogação.",
          "Os valores de timeout são uma troca entre segurança e usabilidade; documente por que os valores escolhidos foram adotados.",
        ],
        // PAAA-001.1.05 Create a web identity mapping
        "PAAA-001.1.05": [
          "Um web identity mapping decide como a identidade autenticada é passada ao site de backend.",
          "O header identity mapping injeta atributos como headers HTTP; o JWT identity mapping passa um token assinado.",
          "O backend precisa confiar no PingAccess e recusar os mesmos headers vindos de qualquer outra origem, ou o mapping vira um vetor de falsificação.",
          "Os nomes dos atributos no mapping precisam corresponder exatamente ao que a aplicação espera.",
          "O identity mapping é a ponte entre a identidade federada e uma aplicação legada que só entende headers.",
        ],
        // PAAA-001.1.06 Create a site
        "PAAA-001.1.06": [
          "Um site é o destino de backend: um ou mais alvos host:porta, mais as configurações de TLS e de conexão.",
          "Os availability profiles decidem como as falhas são tratadas entre os alvos; as estratégias de load balancing decidem a distribuição.",
          "A confiança no certificado do backend vem de um trusted certificate group quando o site usa TLS.",
          "O hostname esperado precisa corresponder ao certificado do backend, ou a verificação falha.",
          "Os sites são referenciados pelas aplicações, então um site pode atender a várias aplicações.",
        ],
        // PAAA-001.1.07 Create a site authenticator
        "PAAA-001.1.07": [
          "Um site authenticator permite que o PingAccess se autentique no site de backend.",
          "Os tipos incluem autenticação básica, TLS mútuo e o token mediator.",
          "Isso é separado da autenticação do usuário final; protege o hop entre o PingAccess e a aplicação.",
          "Sem ele, um backend que exige credenciais vai rejeitar as requisições encaminhadas pelo PingAccess.",
          "As credenciais ficam guardadas na configuração e devem passar por rotação como qualquer secret.",
        ],
        // PAAA-001.1.08 Configure POST preservation
        "PAAA-001.1.08": [
          "A POST preservation guarda o envio de um formulário que chega a uma sessão não autenticada, para que ele sobreviva ao redirect para o token provider.",
          "Sem ela, o usuário se autentica e depois perde os dados que tinha digitado.",
          "Configure o tamanho máximo do corpo preservado; envios grandes demais são descartados em vez de guardados.",
          "Ela vale para aplicações web, e não para APIs.",
          "Teste com um formulário real, porque o modo de falha fica invisível até um usuário reclamar da perda do que digitou.",
        ],
        // PAAA-001.1.09 Configure redirects, for example, from port 80 to port 443
        "PAAA-001.1.09": [
          "Os redirects de HTTP para HTTPS são configurados com um listener na porta sem criptografia e um destino de redirect.",
          "O redirect deve preservar o caminho e a query string, para que o usuário chegue aonde pretendia.",
          "Os headers de resposta HSTS complementam o redirect, evitando a requisição em texto claro na próxima vez.",
          "Confirme que o destino do redirect usa o hostname visível externamente, e não um interno.",
          "É higiene de infraestrutura, e não policy de acesso, mas é uma configuração que cai na prova.",
        ],
        // PAAA-001.1.10 Create an authentication requirements rule
        "PAAA-001.1.10": [
          "Uma authentication requirements rule exige que o usuário tenha se autenticado com um método ou contexto suficiente.",
          "Ela compara os valores de authentication context reference devolvidos pelo token provider com uma lista exigida.",
          "É assim que a autenticação step-up é aplicada: um resource sensível exige um ACR mais forte do que a sessão tem no momento.",
          "Se o requisito não for atendido, o PingAccess dispara uma nova autenticação em vez de simplesmente negar.",
          "Os valores precisam corresponder ao que o token provider de fato emite, o que é um ponto de coordenação entre os dois sistemas.",
        ],
        // PAAA-001.1.11 Create a Groovy script rule
        "PAAA-001.1.11": [
          "Uma Groovy script rule avalia lógica personalizada sobre a requisição, a identidade e a sessão.",
          "É a saída para policies que as regras embutidas não conseguem expressar.",
          "Os scripts precisam devolver uma decisão de policy; os objetos e métodos disponíveis são definidos pela API de scripting do PingAccess.",
          "Os scripts rodam em cada requisição correspondente, então são um risco de desempenho e de confiabilidade se escritos sem cuidado.",
          "Trate scripts como código: revise, versione e teste antes de implantar.",
        ],
        // PAAA-001.1.12 Create an HTTP request header rule
        "PAAA-001.1.12": [
          "Uma HTTP request header rule verifica a presença ou o valor de um header de requisição específico.",
          "A comparação pode ser exata ou por padrão, e pode ser negada.",
          "Os headers são controlados pelo client, então uma regra de header é um controle de roteamento ou de conveniência, e não uma fronteira de segurança por si só.",
          "Usos comuns: diferenciar clients, exigir um header obrigatório no tráfego de API.",
          "Combine com uma verificação de identidade autenticada quando a decisão tiver consequências de segurança.",
        ],
        // PAAA-001.1.13 Create an HTTP request parameter rule
        "PAAA-001.1.13": [
          "Uma HTTP request parameter rule verifica parâmetros de query string ou de formulário.",
          "Como nas regras de header, o valor é fornecido pelo client e não pode ser a única base de uma decisão de acesso.",
          "Útil para roteamento e para exigir que parâmetros obrigatórios estejam presentes.",
          "Deixe explícito se a regra inspeciona a query string, o corpo ou os dois.",
          "A inspeção do corpo tem impacto de desempenho em requisições grandes.",
        ],
        // PAAA-001.1.14 Create a network range rule
        "PAAA-001.1.14": [
          "Uma network range rule permite ou nega com base no endereço IP do client em notação CIDR.",
          "O endereço de origem vem da conexão ou de um header de encaminhamento, conforme a configuração; essa distinção importa atrás de um load balancer.",
          "Se os headers de encaminhamento forem confiáveis, eles precisam ser removidos e redefinidos por um componente upstream confiável, ou o controle pode ser falsificado.",
          "Usos típicos: restringir caminhos administrativos às faixas corporativas.",
          "As faixas IPv6 precisam ser tratadas explicitamente, e não presumidas.",
        ],
        // PAAA-001.1.15 Create an OAuth attribute rule
        "PAAA-001.1.15": [
          "Uma OAuth attribute rule compara um claim do access token com um valor esperado.",
          "Ela vale para aplicações de API em que o bearer token carrega o contexto de autorização.",
          "O claim precisa estar presente no token que o provedor emite; combine o contrato do token com o PingFederate.",
          "É mais fina que a verificação de scope, porque pode testar valores arbitrários de claims.",
          "Claims ausentes devem falhar fechado; verifique o comportamento em vez de presumi-lo.",
        ],
        // PAAA-001.1.16 Create an OAuth Groovy script (for API) rule
        "PAAA-001.1.16": [
          "Uma OAuth Groovy script rule aplica lógica personalizada às requisições de API, com o contexto do access token disponível.",
          "Use quando as regras de scope e de atributo não conseguem expressar a condição exigida, como verificações relacionais entre claims e o caminho da requisição.",
          "Valem os mesmos cuidados de desempenho e de revisão de código da regra Groovy para web.",
          "Os valores de retorno precisam seguir o contrato de decisão de policy.",
          "Registre em log o bastante a partir do script para que as negações possam ser explicadas em produção.",
        ],
        // PAAA-001.1.17 Create an OAuth scope rule
        "PAAA-001.1.17": [
          "Uma OAuth scope rule exige que o access token carregue um ou mais scopes nomeados.",
          "O scope é o mecanismo de autorização de API de granularidade grossa e deve refletir a operação protegida.",
          "Exigir vários scopes significa que todos precisam estar presentes, a menos que configurado de outra forma.",
          "Os scopes são definidos no token provider; o PingAccess só os verifica.",
          "É a primeira regra a usar em um resource de API, antes das regras de atributo mais específicas.",
        ],
        // PAAA-001.1.18 Create a one-time authorization rule
        "PAAA-001.1.18": [
          "Uma one-time authorization rule permite um único uso de um resource, depois do qual a autorização é consumida.",
          "Usos típicos: links de download, endpoints de confirmação e outras ações que não podem ser repetidas.",
          "O estado precisa ser compartilhado no cluster para que a regra funcione corretamente atrás de um load balancer.",
          "Entenda o comportamento de expiração, além do comportamento de uso único.",
          "Teste a repetição explicitamente, já que uma regra que falha aberta aqui anula o seu próprio propósito.",
        ],
        // PAAA-001.1.19 Create a rate limiting rule
        "PAAA-001.1.19": [
          "Uma rate limiting rule limita o volume de requisições por client em uma janela de tempo.",
          "Identifique o client pelo IP, pelo client OAuth ou pela identidade autenticada, conforme o que o limite deve proteger.",
          "O contador precisa conhecer o cluster, ou cada nó aplica o seu próprio limite e o teto efetivo se multiplica.",
          "A limitação de taxa protege contra abuso e sobrecarga acidental; não substitui a autenticação.",
          "Escolha o código de resposta e a mensagem de propósito; um 429 com indicação de nova tentativa é a resposta bem-comportada.",
        ],
        // PAAA-001.1.20 Create a redirect rule
        "PAAA-001.1.20": [
          "Uma redirect rule envia as requisições correspondentes para outro endereço, em vez de fazer proxy delas.",
          "Útil para aposentar caminhos, mover aplicações e impor URLs canônicas.",
          "Indique se o redirect é permanente ou temporário, porque caches e navegadores agem conforme essa diferença.",
          "Preserve as query strings quando o destino as espera.",
          "Os redirect loops são o erro comum; verifique se o destino não corresponde à mesma regra.",
        ],
        // PAAA-001.1.21 Create a rejection rule
        "PAAA-001.1.21": [
          "Uma rejection rule nega de imediato as requisições correspondentes.",
          "Combine-a com um rejection handler para controlar o que o usuário de fato vê.",
          "As rejeições devem ser registradas em log com contexto suficiente para distinguir tráfego de ataque de um erro de configuração.",
          "Colocar uma rejection rule no início de um rule set evita avaliação desperdiçada.",
          "Negar por padrão e permitir explicitamente é a construção mais segura quando o resource é sensível.",
        ],
        // PAAA-001.1.22 Create a time range rule
        "PAAA-001.1.22": [
          "Uma time range rule permite o acesso só em horários definidos.",
          "O fuso horário do servidor governa a avaliação, o que importa em instalações distribuídas.",
          "Usos típicos: restringir funções administrativas ao horário comercial, ou janelas de manutenção.",
          "Combine com um rejection handler que explique a restrição, ou virão chamados de suporte.",
          "Regras baseadas em horário são frágeis nas mudanças de horário de verão; confirme o comportamento pretendido.",
        ],
        // PAAA-001.1.23 Create a web session attribute rule
        "PAAA-001.1.23": [
          "Uma web session attribute rule avalia um atributo guardado na web session do usuário.",
          "Os atributos chegam do token provider durante a autenticação e ficam na sessão.",
          "É o equivalente web da OAuth attribute rule usada no tráfego de API.",
          "O atributo precisa estar incluído na configuração da web session para ficar disponível na avaliação.",
          "Use-a para verificações de participação em grupos e de entitlements vindos do identity provider.",
        ],
        // PAAA-001.1.24 Create a web session scope rule
        "PAAA-001.1.24": [
          "Uma web session scope rule verifica se a sessão carrega um scope exigido, concedido na autenticação.",
          "Os scopes chegam à web session pelo fluxo OIDC que o PingAccess executou junto ao token provider.",
          "Os scopes pedidos precisam estar configurados na web session, ou nunca estarão presentes para verificação.",
          "É um entitlement de granularidade grossa para o tráfego de navegador, que complementa a regra de atributo, mais fina.",
          "Uma negação aqui normalmente significa que o token provider não concedeu o scope, então depure no provedor.",
        ],
        // PAAA-001.1.25 Create a WebSocket handshake rule
        "PAAA-001.1.25": [
          "Uma WebSocket handshake rule governa a requisição HTTP de upgrade que inicia uma conexão WebSocket.",
          "A policy é aplicada no momento do handshake; os frames depois do upgrade não são avaliados um a um.",
          "Verifique a origem e a autenticação no handshake, porque é a única oportunidade.",
          "Os sites de backend precisam permitir o upgrade para que a conexão dê certo de ponta a ponta.",
          "Conexões de vida longa interagem com os timeouts de sessão; entenda o que acontece quando a sessão expira no meio da conexão.",
        ],
        // PAAA-001.1.26 Create a CORS rule
        "PAAA-001.1.26": [
          "Uma CORS rule controla o acesso cross-origin dos navegadores, gerenciando a resposta ao preflight.",
          "Configure as origens, os métodos e os headers permitidos, e se credenciais são aceitas.",
          "Permitir todas as origens junto com credenciais é um erro de configuração conhecido; o navegador o bloqueia, e ele denuncia uma policy descuidada.",
          "O preflight é uma requisição OPTIONS e precisa ter permissão para chegar à regra.",
          "O CORS é um controle aplicado pelo navegador; ele protege os usuários, e não o servidor.",
        ],
        // PAAA-001.1.27 Create an OAuth token cache time to live rule
        "PAAA-001.1.27": [
          "A OAuth token cache time-to-live rule controla por quanto tempo o PingAccess guarda em cache os resultados da introspection de tokens.",
          "O cache reduz a carga sobre o token provider, ao custo de perceber a revogação com atraso.",
          "Um TTL curto significa propagação mais rápida da revogação; um TTL longo significa melhor desempenho.",
          "O valor correto é uma troca entre segurança e capacidade, que deve ser declarada explicitamente no desenho.",
          "Vale para reference tokens que exigem introspection; JWTs autocontidos são validados localmente.",
        ],
        // PAAA-001.1.28 Create a rewrite content rule
        "PAAA-001.1.28": [
          "Uma rewrite content rule modifica o corpo da resposta, normalmente para corrigir URLs absolutas que apontam para hostnames internos.",
          "Ela vale para content types de texto; respostas binárias não são reescritas.",
          "Reescrever o corpo exige buffering, o que custa memória e latência em respostas grandes.",
          "Prefira corrigir a aplicação para emitir URLs relativas; a reescrita é o controle compensatório.",
          "Restrinja a regra por content type e por caminho para limitar o custo de desempenho.",
        ],
        // PAAA-001.1.29 Create a rewrite cookie domain rule
        "PAAA-001.1.29": [
          "Uma rewrite cookie domain rule muda o atributo Domain nos headers Set-Cookie vindos do backend.",
          "Necessária quando o backend define cookies para um domínio interno que o navegador vai rejeitar no hostname externo.",
          "Errar aqui causa perda silenciosa de sessão, já que o navegador simplesmente descarta o cookie.",
          "Verifique com o inspetor de cookies do navegador, e não só lendo o header da resposta.",
          "Avalie se o cookie deveria ser restringido em vez de ampliado, por segurança.",
        ],
        // PAAA-001.1.30 Create a rewrite cookie path rule
        "PAAA-001.1.30": [
          "Uma rewrite cookie path rule ajusta o atributo Path dos cookies devolvidos pelo backend.",
          "Necessária quando o PingAccess apresenta a aplicação em um context root diferente do que o backend usa.",
          "Um path divergente faz o navegador não enviar o cookie de volta nas requisições seguintes.",
          "Combine com a reescrita de URLs, para que o tratamento de caminhos seja consistente nos dois sentidos.",
          "Teste o ciclo completo de login e navegação, já que o sintoma só aparece depois de um redirect.",
        ],
        // PAAA-001.1.31 Create a rewrite response header rule
        "PAAA-001.1.31": [
          "Uma rewrite response header rule modifica ou remove headers da resposta.",
          "Usos comuns: corrigir headers Location que expõem hostnames internos e remover headers que revelam as versões do software de backend.",
          "Headers de segurança também podem ser acrescentados aqui quando o backend não os define.",
          "Reescrever o Location é essencial para que os redirects funcionem através do proxy.",
          "Remover headers é tão importante quanto acrescentá-los; headers verbosos do backend são um achado de exposição de informações.",
        ],
        // PAAA-001.1.32 Create a rewrite URL rule
        "PAAA-001.1.32": [
          "Uma rewrite URL rule traduz entre o caminho visível externamente e o caminho que o backend espera.",
          "É o que permite ao PingAccess publicar uma aplicação em um context root diferente daquele em que ela está implantada.",
          "As reescritas valem para o caminho da requisição; o conteúdo e os headers da resposta precisam de regras próprias para continuar consistentes.",
          "Reescritas com expressões regulares precisam de âncoras cuidadosas para evitar correspondências indesejadas.",
          "Documente o mapeamento, porque fazer troubleshooting de um caminho reescrito sem ele é adivinhação.",
        ],
        // PAAA-001.1.33 Create rule sets and rule set groups
        "PAAA-001.1.33": [
          "Um rule set agrupa regras; um rule set group compõe rule sets, para que a policy seja reusada entre aplicações.",
          "Os critérios de sucesso decidem se todas as regras precisam passar ou se basta uma.",
          "A ordem de avaliação dentro de um set é relevante quando as regras têm efeitos colaterais, como reescritas.",
          "O reuso é o objetivo: defina uma vez e associe a muitas aplicações e resources.",
          "Grupos muito aninhados ficam difíceis de entender; mantenha a hierarquia rasa o bastante para ser explicada.",
        ],
        // PAAA-001.1.34 Configure a header identity mapping
        "PAAA-001.1.34": [
          "Um header identity mapping injeta atributos de identidade nos headers da requisição enviada ao backend.",
          "Mapeie cada atributo explicitamente para um nome de header que a aplicação já espera.",
          "O backend precisa rejeitar esses headers vindos de qualquer origem que não seja o PingAccess, ou um atacante pode se passar por um usuário definindo-os diretamente.",
          "Avalie se os valores precisam de codificação para conteúdo não ASCII.",
          "É o mecanismo clássico para colocar uma camada moderna de identidade na frente de uma aplicação legada.",
        ],
        // PAAA-001.1.35 Configure a JWT identity mapping
        "PAAA-001.1.35": [
          "Um JWT identity mapping passa a identidade ao backend como um JSON Web Token assinado, em vez de headers simples.",
          "A assinatura permite ao backend verificar que foi o PingAccess quem produziu o token, o que os headers não oferecem.",
          "Configure a chave de assinatura, o algoritmo, a audience e o tempo de vida; o backend valida todos eles.",
          "O backend precisa da chave pública correspondente, normalmente via um endpoint JWKS.",
          "Prefira o JWT ao header mapping quando o backend conseguir validá-lo, porque ele elimina a exposição à falsificação.",
        ],
        // PAAA-001.1.36 Configure a basic authentication site authenticator
        "PAAA-001.1.36": [
          "Um basic authentication site authenticator envia um usuário e uma senha fixos ao backend em cada requisição.",
          "Ele autentica o PingAccess como serviço, e não o usuário final.",
          "As credenciais são secrets da configuração e devem passar por rotação em um calendário.",
          "O backend vê uma única identidade para todo o tráfego, então a atribuição por usuário precisa vir de um identity mapping.",
          "Use TLS até o backend; autenticação básica em texto claro expõe a credencial em cada requisição.",
        ],
        // PAAA-001.1.37 Configure token mediator site authenticator
        "PAAA-001.1.37": [
          "O token mediator site authenticator troca a sessão do usuário por um token que o backend aceita.",
          "Ele faz a ponte entre uma web session do PingAccess e um backend que espera um token OAuth ou um token emitido pelo PingFederate.",
          "Isso preserva a identidade do usuário final até o backend, em vez de reduzir todos a uma única conta de serviço.",
          "A configuração é coordenada com o token provider quanto às client credentials e ao tipo de token esperado.",
          "É preciso entender o tempo de vida do token e o comportamento do refresh, para que sessões longas não falhem no meio do uso.",
        ],
        // PAAA-001.1.38 Configure redirects
        "PAAA-001.1.38": [
          "A configuração de redirects cobre tanto os redirects no listener (HTTP para HTTPS) quanto os redirects por regra para caminhos específicos.",
          "Saiba qual mecanismo é o adequado: redirects de infraestrutura pertencem ao listener; redirects de policy pertencem às regras.",
          "Preserve o caminho e a query originais, a menos que a intenção seja descartá-los.",
          "Use redirects permanentes só quando a mudança for de fato permanente, porque clients e caches os memorizam.",
          "Verifique se a URL resultante pode ser resolvida externamente, e não é um hostname interno.",
        ],
        // PAAA-001.1.39 Configure rejection handlers & rules
        "PAAA-001.1.39": [
          "Os rejection handlers controlam a resposta que o usuário vê quando uma regra nega o acesso.",
          "As opções incluem uma página de erro com template e um redirect para um local amigável.",
          "O handler não deve revelar por que o acesso foi negado, já que isso informa um atacante.",
          "Associe os handlers de propósito: uma página de erro técnica padrão é uma experiência ruim e um pequeno vazamento de informação.",
          "Registre o motivo detalhado no log do servidor, mesmo quando a mensagem para o usuário for genérica.",
        ],
        // PAAA-001.1.40 Configure server-side cipher ordering
        "PAAA-001.1.40": [
          "A server-side cipher ordering faz o PingAccess escolher a cipher suite pela sua própria preferência, e não pela do client.",
          "Isso permite preferir suites mais fortes e forward secrecy, qualquer que seja a ordem do client.",
          "Ela é configurada nos listeners do engine, junto com as versões de protocolo ativadas.",
          "Combine-a com uma lista de cifras curada; a ordem sozinha não remove as suites fracas.",
          "Verifique com um scanner externo depois da mudança, em vez de confiar na tela de configuração.",
        ],
        // PAAA-001.1.41 Configure global unprotected resources
        "PAAA-001.1.41": [
          "Os global unprotected resources são caminhos que o PingAccess deixa passar sem aplicar policy, em todas as aplicações.",
          "Usos típicos: health checks e endpoints well-known que precisam ser alcançáveis sem autenticação.",
          "Cada caminho desprotegido é um buraco permanente, então a lista deve ser curta e revisada.",
          "Defina os padrões com precisão; um padrão amplo pode desproteger mais do que o pretendido.",
          "Diferencie dos anonymous resources, que continuam sendo processados pelo PingAccess.",
        ],
        // PAAA-001.1.42 Configure anonymous resources
        "PAAA-001.1.42": [
          "Um anonymous resource é processado pelo PingAccess, mas não exige uma identidade autenticada.",
          "As regras continuam valendo, então uma faixa de rede ou a limitação de taxa podem protegê-lo.",
          "Os identity mappings não têm o que injetar, e o backend precisa tolerar isso.",
          "Use para páginas públicas dentro de uma aplicação protegida no restante.",
          "É o meio-termo entre totalmente protegido e totalmente desprotegido.",
        ],
        // PAAA-001.1.43 Configure application unprotected resources
        "PAAA-001.1.43": [
          "Os application unprotected resources ignoram a policy para caminhos específicos dentro de uma única aplicação.",
          "Mais estreitos e mais seguros que a lista global, já que a exceção fica restrita a onde é necessária.",
          "Usos comuns: assets estáticos, callbacks de login e endpoints de saúde próprios da aplicação.",
          "Confirme que o padrão de caminho não pode ser manipulado para chegar a conteúdo protegido abaixo dele.",
          "Revise-os quando a aplicação mudar, porque exceções desatualizadas se acumulam.",
        ],
        // PAAA-001.1.44 Configure manual resource ordering
        "PAAA-001.1.44": [
          "A ordem dos resources determina qual definição de resource corresponde a uma requisição quando os padrões se sobrepõem.",
          "Por padrão, a correspondência é pela especificidade; a ordem manual se sobrepõe a isso quando o padrão está errado.",
          "Só o primeiro resource correspondente vale, então a ordem determina diretamente a policy efetiva.",
          "A ordem manual deve ser documentada, porque fica invisível para quem lê só os resources.",
          "Teste explicitamente os caminhos sobrepostos depois de qualquer mudança de ordem.",
        ],
        // PAAA-001.1.45 Configure token validation
        "PAAA-001.1.45": [
          "A validação de tokens decide como o PingAccess verifica um access token recebido.",
          "Reference tokens exigem introspection no token provider; JWTs podem ser validados localmente contra uma chave de assinatura.",
          "A validação local precisa verificar assinatura, issuer, audience e expiração, e não apenas se o token pode ser interpretado.",
          "A introspection dá percepção imediata da revogação; a validação local dá velocidade. O cache fica entre as duas.",
          "Uma verificação de audience mal configurada é um achado comum, porque permite aceitar um token emitido para outro serviço.",
        ],
        // PAAA-001.2.01 Create an agent in the admin console
        "PAAA-001.2.01": [
          "Um agent é um plugin no próprio servidor web, e não um hop de proxy; o console administrativo o define e emite as credenciais dele.",
          "As instalações com agent mantêm o tráfego no servidor web existente, enquanto as decisões de policy vêm do PingAccess.",
          "O nome do agent e o shared secret vindos do console são o que o arquivo agent.properties carrega.",
          "Escolha entre agent e gateway com base na topologia de rede e na possibilidade de instalar no servidor web.",
          "Os agents não conseguem reescrever respostas como um gateway consegue, o que é uma diferença funcional real.",
        ],
        // PAAA-001.2.02 Configure an agent using an agent.properties configuration file for Apache
        "PAAA-001.2.02": [
          "O agent.properties contém o host e a porta do PingAccess, o shared secret e a identidade do agent.",
          "No Apache, o módulo é carregado na configuração do servidor e apontado para o arquivo de propriedades.",
          "O arquivo contém um secret e precisa ser protegido por permissões do sistema de arquivos.",
          "Gerar o agent de novo no console invalida o arquivo de propriedades antigo; a implantação precisa ser coordenada.",
          "Verifique com uma requisição através do servidor web e depois confira se o agent aparece conectado no console.",
        ],
        // PAAA-001.3.01 Add a replica administrative node to an existing cluster
        "PAAA-001.3.01": [
          "Um nó administrativo réplica oferece um standby para o console administrativo, que de outra forma é um ponto único de falha para mudanças de configuração.",
          "A réplica recebe a configuração, mas não aceita mudanças até ser promovida.",
          "A promoção é uma operação deliberada, e não um failover automático.",
          "Os engines continuam atendendo o tráfego enquanto o nó administrativo está indisponível, então isso protege a capacidade de gerenciar, e não a disponibilidade.",
          "Configure e teste a promoção antes de precisar dela, porque é sob pressão que os erros acontecem.",
        ],
        // PAAA-001.3.02 Configure runtime state clustering
        "PAAA-001.3.02": [
          "O runtime state clustering compartilha o estado de sessões e de regras entre os nós de engine.",
          "Sem ele, recursos que dependem de estado, como a one-time authorization e a limitação de taxa precisa, funcionam por nó.",
          "A configuração designa os state servers e os engines que os usam.",
          "O alcance de rede e a latência entre os engines e os state servers afetam diretamente a latência das requisições.",
          "Entenda o comportamento de falha quando um state server não pode ser alcançado.",
        ],
        // PAAA-001.3.03 Configure sticky sessions
        "PAAA-001.3.03": [
          "As sticky sessions prendem um client ao mesmo nó de engine no load balancer upstream.",
          "Elas compensam o estado que não é compartilhado e reduzem as consultas entre nós quando ele é.",
          "O load balancer implementa a afinidade; o PingAccess depende dela.",
          "A afinidade complica a retirada de um nó para manutenção, então planeje o procedimento de drenagem.",
          "Prefira o estado compartilhado à afinidade quando as duas forem opções, porque a afinidade se degrada muito com a perda de um nó.",
        ],
        // PAAA-001.3.04 Configure admin console single sign-on (SSO)
        "PAAA-001.3.04": [
          "O SSO do console administrativo delega a autenticação dos administradores ao token provider, em vez de contas locais.",
          "Configure o client OIDC e mapeie os claims para os papéis administrativos do PingAccess.",
          "Isso coloca o acesso administrativo sob os mesmos controles de MFA e de ciclo de vida do resto da organização.",
          "Mantenha uma conta local de emergência documentada e protegida, ou uma indisponibilidade de identidade deixa você fora do console.",
          "Teste o mapeamento de papéis com uma conta sem privilégios antes de aplicá-lo.",
        ],
        // PAAA-001.3.05 Configure an on-prem cluster
        "PAAA-001.3.05": [
          "Um cluster on-premises é formado por um nó administrativo, uma réplica opcional e os nós de engine.",
          "Os engines recebem a configuração do nó administrativo e atendem o tráfego de forma independente.",
          "A configuração do cluster inclui chaves compartilhadas e as definições dos listeners dos engines.",
          "A sincronização de horário entre os nós importa para a validação de tokens e para a correlação de logs.",
          "Verifique cada engine de forma independente depois de uma mudança de configuração, já que um nó pode falhar em silêncio ao buscar a configuração.",
        ],
        // PAAA-001.4.01 Configure logging
        "PAAA-001.4.01": [
          "A configuração de logging usa o log4j2; níveis e appenders são definidos no arquivo de configuração.",
          "Logs principais: os audit logs para as decisões de policy e o log do engine para o comportamento em runtime.",
          "Aumentar o nível de log em produção é um ato deliberado e temporário, com um plano para voltar atrás.",
          "A rotação e a retenção dos logs precisam estar configuradas, ou os discos enchem durante um incidente.",
          "Uma saída estruturada torna prática a agregação posterior; decida o formato antes de enviar os logs para outro lugar.",
        ],
        // PAAA-001.4.02 Configure resource auditing
        "PAAA-001.4.02": [
          "A auditoria de resources registra o acesso a resources protegidos, produzindo a trilha de evidências para compliance.",
          "Os audit logs capturam identidade, resource, decisão e horário.",
          "A auditoria pode ser ativada por aplicação ou por resource, então pode ser direcionada às áreas sensíveis.",
          "O volume de auditoria afeta desempenho e armazenamento; defina o escopo de propósito.",
          "Envie os audit logs para fora do host, já que os logs locais se perdem com o host.",
        ],
        // PAAA-001.4.03 Troubleshoot common issues
        "PAAA-001.4.03": [
          "Percorra o caminho da requisição na ordem: correspondência do virtual host, correspondência da aplicação e do resource, regras, identity mapping e, por fim, o site de backend.",
          "Um 404 através do PingAccess normalmente significa que o virtual host ou o context root não correspondeu ao que você esperava.",
          "Loops de autenticação normalmente indicam problemas de domínio ou de path do cookie, ou uma audience divergente na web session.",
          "Um 401 ou 403 do backend com uma decisão de policy bem-sucedida no PingAccess aponta para o site authenticator ou para o identity mapping.",
          "Correlacione a entrada do audit log com o log do engine, usando o mesmo timestamp e os mesmos identificadores de transação, antes de mudar qualquer coisa.",
        ],
      },
    },
  },
  // PAME-101: Certified Expert - PingAM.
  "ping-ce-pingam": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "Quatro cenários práticos (cada um, um conjunto de tarefas), aplicados em uma VM Ubuntu com todas as ferramentas necessárias",
      passMark: "Não informada na página oficial da prova",
      cost: "EUR 460 / GBP 390 / USD 495 (pode haver imposto regional); cada voucher vale para uma única tentativa",
      note: "Prova prática supervisionada (3,5 horas). Cada código de voucher vale para uma única tentativa de prova; depois de resgatado, não pode ser reutilizado. A prova cobre o PingAM versão 8 ou posterior.",
    },
    // Key points: this site's study notes, translated objective by objective in the English order.
    keyPoints: {
      // Site-authored notes, so translated.
      rule: "site-notes",
      // Objective id -> translated points.
      byObjective: {
        // PAME-101.1.01 Delegate authentication using SAML v2.0 (SAML2)
        "PAME-101.1.01": [
          "O PingAM como IdP ou SP hospedado: circle of trust, entity providers e a troca de metadados que prepara os dois lados.",
          "Autenticação delegada significa que o PingAM envia o usuário a um IdP remoto e consome a assertion; saiba qual lado é dono da sessão.",
          "As chaves de assinatura e de criptografia das assertions vêm dos secret stores configurados na Section 4: uma falha de federação muitas vezes é uma falha de secret store.",
          "O mapeamento de atributos decide o que o SP de fato recebe; a escolha do formato de NameID (persistent, transient, email) orienta a vinculação de contas.",
          "A auto-federation e a criação dinâmica de perfil são as duas respostas para \"o usuário ainda não existe localmente\".",
        ],
        // PAME-101.1.02 Configure OAuth 2.0 (OAuth2)/OpenID Connect (OIDC) integration
        "PAME-101.1.02": [
          "O PingAM como authorization server: clients (confidenciais ou públicos), grant types permitidos por client e mapeamento de scope para claim.",
          "O OIDC acrescenta o ID token; conheça o hook do claims script para personalizar claims além dos padrões.",
          "Authorization code com PKCE é a resposta esperada para clients de navegador e nativos; implicit e ROPC estão aposentados.",
          "Tempo de vida dos tokens, rotação de refresh tokens e onde fica o token store (CTS) são ajustes operacionais que caem na prova.",
          "O tratamento do consentimento e as configurações do OAuth2 provider service são feitos no nível do realm.",
        ],
        // PAME-101.1.03 Configure Secret Token Service integration
        "PAME-101.1.03": [
          "O Security Token Service (STS) faz a ponte entre formatos de token: entra uma assertion SAML e sai um OIDC/JWT, e o inverso; há instâncias REST STS e SOAP STS.",
          "A transformação de tokens é o caso de uso central: uma aplicação legada que fala SAML na frente de uma API OAuth moderna, ou o contrário.",
          "Cada instância de STS declara seu emissor, os tipos de token suportados e a credencial usada para assinar os tokens emitidos.",
          "Valide a cadeia de confiança tanto no token de entrada quanto no de saída; uma transformação só é tão confiável quanto a sua etapa de validação mais fraca.",
        ],
        // PAME-101.2.01 Integrate with a preconfigured PingGateway instance
        "PAME-101.2.01": [
          "O PingGateway (antes IG) aplica na borda; o PingAM decide. Conheça a divisão de responsabilidades entre agent/gateway e AM.",
          "A configuração da route determina quais requisições são protegidas, e o policy set do PingAM determina a decisão.",
          "O single sign-on entre o gateway e o PingAM depende do domínio do cookie de sessão e da URL do AM configurada.",
          "Falha comum: o gateway não alcança o policy endpoint do AM, ou as credenciais do agent profile estão erradas; verifique as duas coisas antes de mexer na lógica da policy.",
        ],
        // PAME-101.2.02 Configure policies
        "PAME-101.2.02": [
          "Os policy sets contêm policies; cada policy indica resources, actions, subjects e condições de ambiente.",
          "Os resource types definem as actions disponíveis (GET/POST para URLs); a avaliação da policy devolve as actions permitidas, além de advice e response attributes.",
          "As condições de subject (usuários autenticados, grupos, scope OAuth2) e as de ambiente (IP, horário, nível de autenticação) compõem a decisão.",
          "O advice é a forma de um deny virar um pedido de step-up: o mecanismo que liga a autorização de volta a uma authentication journey.",
          "Teste com o endpoint REST de avaliação de policies antes de culpar o ponto de aplicação.",
        ],
        // PAME-101.2.03 Demonstrate how to check for risk continuously
        "PAME-101.2.03": [
          "Risco contínuo significa reavaliar a sessão depois do login, e não só na entrada: autorização transacional e mudanças nas propriedades da sessão.",
          "O policy advice pode forçar um step-up no meio da sessão; combine com o nível de autenticação para proteger ações sensíveis.",
          "Os sinais podem vir do PingOne Protect ou de fontes de risco equivalentes que alimentam um decision node na tree.",
          "A prova trabalha com cenários: dado um sinal de risco, produza a configuração que pede uma nova verificação sem encerrar a sessão.",
        ],
        // PAME-101.3.01 Demonstrate how to modify a user's authentication experience based on context
        "PAME-101.3.01": [
          "As trees são grafos de nós com resultados; o contexto vem de nós que inspecionam dispositivo, IP, risco ou atributos do usuário.",
          "Os scripted decision nodes são a saída de uso geral quando nenhum nó pronto serve.",
          "As inner trees permitem reusar um subfluxo em várias journeys: o princípio DRY aplicado à autenticação.",
          "O shared state carrega valores entre os nós; saiba qual estado (shared, secure ou transient) é adequado para secrets.",
        ],
        // PAME-101.3.02 Configure social authentication
        "PAME-101.3.02": [
          "Os nós de social identity provider (Google, Facebook, Apple, OIDC genérico) federam o login e devolvem um perfil.",
          "Provisionar a conta local é uma decisão separada: criar, vincular a uma existente pelo e-mail ou rejeitar.",
          "O client ID e o secret de cada provedor ficam na configuração do serviço de social IdP; os secrets pertencem a um secret store.",
          "Atenção ao registro da redirect URI do lado do provedor: é a causa mais comum de um fluxo social quebrado.",
        ],
        // PAME-101.3.03 Implement single sign-on (SSO)
        "PAME-101.3.03": [
          "O SSO dentro de um realm se apoia no cookie de sessão do AM; o SSO entre domínios (CDSSO) trata o caso de domínios diferentes.",
          "O session upgrade preserva a sessão e eleva o nível de autenticação depois de um step-up.",
          "Saiba a diferença entre a sessão do AM, a sessão OIDC e a sessão da aplicação: três tempos de vida que precisam ser analisados separadamente.",
          "O logout precisa ser pensado de ponta a ponta: local, federado e por back-channel onde houver suporte.",
        ],
        // PAME-101.3.04 Given a scenario, configure mutli-factor authentication (MFA
        "PAME-101.3.04": [
          "Os nós prontos cobrem OATH (TOTP/HOTP), notificação push, WebAuthn/FIDO2 e códigos de recuperação.",
          "Cadastro e autenticação são caminhos de nós distintos; uma tree completa trata o usuário ainda não cadastrado.",
          "Os nós device profile e device match permitem pular o MFA em um dispositivo conhecido: o requisito habitual de \"lembrar este dispositivo\".",
          "Códigos de recuperação e um caminho de reset administrativo fazem parte de um desenho correto, e não são um detalhe para depois.",
        ],
        // PAME-101.4.01 Configure secret stores
        "PAME-101.4.01": [
          "Os secret stores abstraem onde o material de chaves fica: arquivo de keystore, sistema de arquivos, HSM/KMS ou variáveis de ambiente.",
          "Os secret IDs são mapeados para finalidades (assinar tokens OIDC, assertions SAML, TLS): o mapeamento é a configuração.",
          "A rotação é suportada listando vários secrets para um mesmo ID, com datas de início de validade diferentes.",
          "Um secret store mal configurado aparece como falha de federação ou de assinatura de tokens, então verifique-o cedo no troubleshooting.",
        ],
        // PAME-101.4.02 Demonstrate proper system tuning
        "PAME-101.4.02": [
          "Tamanho do heap da JVM, escolha do garbage collector e pools de threads são os ajustes de primeira ordem.",
          "O dimensionamento do CTS (Core Token Service) define o throughput de sessões e tokens; monitore o backend LDAP dele.",
          "Os pools de conexão para o identity store e para o CTS são gargalos comuns sob carga.",
          "As configurações de cache (sessão, policy, configuração) trocam memória por latência; meça antes e depois.",
        ],
        // PAME-101.4.03 Troubleshoot common issues
        "PAME-101.4.03": [
          "Leia os logs na ordem: audit logs para o que aconteceu, debug logs para o porquê e o log do container para falhas de inicialização.",
          "Aumente o nível de debug por componente, e não globalmente, para não se afogar na saída.",
          "Isole a camada: navegador (cookies, redirects), gateway/agent, AM e, por fim, o identity store.",
          "Reproduza com uma chamada REST sempre que possível: isso tira o navegador da equação.",
        ],
        // PAME-101.4.04 Demonstrate proper security hardening
        "PAME-101.4.04": [
          "Troque todas as credenciais administrativas padrão e restrinja o console administrativo a redes confiáveis.",
          "Desative módulos de autenticação, serviços e endpoints que não são usados: reduza a superfície alcançável.",
          "Exija TLS em tudo, marque os cookies como secure e httpOnly e configure o domínio do cookie sem ser mais amplo que o necessário.",
          "Siga o guia de hardening do fabricante para a versão implantada; o hardening depende da versão e muda de uma release para outra.",
        ],
      },
    },
  },
  // PDAA-001: Certified Expert - PingDirectory.
  "ping-ce-pingdirectory": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "70 questões de múltipla escolha",
      passMark: "71,67%",
      cost: "EUR 460 / GBP 390 / USD 495 (pode haver imposto regional); cada voucher vale para uma única tentativa",
      note: "Cada código de voucher vale para uma única tentativa de prova; depois de resgatado, não pode ser reutilizado. A prova cobre o PingDirectory versão 9 ou posterior.",
    },
    // Key points: this site's study notes, translated objective by objective in the English order.
    keyPoints: {
      // Site-authored notes, so translated.
      rule: "site-notes",
      // Objective id -> translated points.
      byObjective: {
        // PDAA-001.1.01 Create and/or manage an ACI.
        "PDAA-001.1.01": [
          "Uma ACI (access control instruction) fica guardada na entrada que ela protege, no atributo operacional aci.",
          "A sintaxe tem três partes: target (o quê), permissão e direitos (allow ou deny, quais operações) e bind rule (quem, em quais condições).",
          "O deny sempre vence o allow quando os dois correspondem; então construa com allows e use denies com parcimônia.",
          "Teste com uma busca autenticada como o usuário afetado, em vez de raciocinar sobre a regra em abstrato.",
          "O dsconfig gerencia a configuração do servidor; as ACIs ficam nos dados e são gerenciadas com modificações LDAP.",
        ],
        // PDAA-001.1.02 Configure PingDirectoryProxy to balance entries between two instances of PingDirectory.
        "PDAA-001.1.02": [
          "O PingDirectoryProxy fica na frente das instâncias PingDirectory de backend e distribui as operações entre elas.",
          "O entry balancing particiona a DIT entre backend sets, para que nenhum set sozinho guarde todas as entradas.",
          "Um índice global é o que permite ao proxy saber qual balancing point guarda uma determinada entrada.",
          "O entry balancing serve para escalar além da capacidade de um único servidor; o load balancing simples serve para disponibilidade e throughput.",
          "Planeje o balancing point com cuidado, porque mudá-lo depois exige mover dados.",
        ],
        // PDAA-001.1.03 Configure PingDataSync to migrate data from another directory.
        "PDAA-001.1.03": [
          "O PingDataSync sincroniza entradas entre uma origem e um destino, incluindo diretórios de outros fabricantes.",
          "Os sync pipes definem a origem, o destino e o mapeamento de atributos entre os schemas dos dois.",
          "O resync faz uma passada em massa; a sincronização contínua acompanha o change log.",
          "Os mapeamentos de atributos tratam as diferenças de schema; a transformação é onde fica a maior parte do esforço de migração.",
          "Rode primeiro em modo dry-run e confira o que mudaria antes de ativar o pipe.",
        ],
        // PDAA-001.1.04 Update and manage certificates.
        "PDAA-001.1.04": [
          "Os certificados ficam no keystore e no trust store configurados nos connection handlers.",
          "O manage-certificates é a ferramenta para inspecionar, gerar, importar e exportar material de chaves.",
          "Substitua os certificados antes do vencimento e confirme que a cadeia completa está presente, e não só o certificado final.",
          "A replicação e as conexões entre servidores também usam certificados; uma renovação que as esquece quebra a topologia em silêncio.",
          "Acompanhe as datas de vencimento como tarefa operacional; certificados vencidos são a indisponibilidade autoinfligida mais comum.",
        ],
        // PDAA-001.1.05 Manage setting up, purging, and restoring soft deletes.
        "PDAA-001.1.05": [
          "O soft delete marca uma entrada como excluída mas a mantém, para que possa ser restaurada.",
          "A entrada com soft delete recebe um novo RDN e fica oculta nas buscas comuns, a menos que seja pedida explicitamente.",
          "O purge é baseado em tempo e configurável; a janela de retenção é uma decisão de policy com consequências de armazenamento.",
          "Restaurar uma entrada a devolve ao local original; entenda o que acontece se aquele DN já estiver ocupado.",
          "As aplicações precisam conhecer os soft deletes, porque uma entrada excluída continua ocupando seus identificadores únicos.",
        ],
        // PDAA-001.1.06 Backup and restore data.
        "PDAA-001.1.06": [
          "backup e restore são as ferramentas suportadas; cópias em nível de arquivo de um banco de dados aberto não são seguras.",
          "Os backups podem ser completos ou incrementais, e podem ser cifrados e assinados.",
          "Restaurar em uma topologia replicada exige cuidado: um servidor restaurado precisa ser reinicializado, ou vai reaplicar mudanças desatualizadas.",
          "Verifique os backups restaurando-os em algum lugar, e não confirmando que o job terminou com código zero.",
          "Retenção e armazenamento dos backups fora do host fazem parte do desenho, e não são um detalhe para depois.",
        ],
        // PDAA-001.1.07 Configure and manage replication.
        "PDAA-001.1.07": [
          "A replicação é multi-master: qualquer servidor aceita gravações e as propaga para os outros.",
          "dsreplication enable, initialize e status são os comandos centrais.",
          "Os conflitos são resolvidos automaticamente por timestamp e server ID; entenda qual entrada vence e por quê.",
          "A replicação usa porta e credenciais próprias; o firewall precisa liberá-la, ou a topologia diverge em silêncio.",
          "Monitore o backlog de replicação como métrica de saúde de primeira linha.",
        ],
        // PDAA-001.1.08 Configure a global index.
        "PDAA-001.1.08": [
          "Um índice global permite ao PingDirectoryProxy descobrir qual backend set com entry balancing guarda uma determinada entrada.",
          "Ele é preenchido a partir dos dados do backend e precisa ser mantido atualizado conforme as entradas se movem.",
          "O dimensionamento de memória do índice é um dado de planejamento de capacidade do proxy.",
          "Sem ele, o proxy precisa enviar as buscas para todos os sets, o que anula o sentido do balanceamento.",
          "Pré-carregue o índice na inicialização, para que as primeiras requisições não sejam lentas.",
        ],
        // PDAA-001.1.09 Use the makeldif command to generate an LDIF file based on a template.
        "PDAA-001.1.09": [
          "O makeldif gera LDIF sintético a partir de um template, para testes e geração de carga.",
          "Os templates definem entradas de ramo, templates subordinados e geradores de valor por atributo.",
          "Os dados gerados permitem testar o comportamento dos índices e o dimensionamento sem dados de produção.",
          "Use-o para reproduzir problemas de escala com segurança, que é o seu principal valor operacional.",
          "Guarde o template junto com o plano de testes, para que os resultados sejam reproduzíveis.",
        ],
        // PDAA-001.1.10 Configure a mirrored subtree.
        "PDAA-001.1.10": [
          "Uma mirrored subtree é replicada por inteiro para todos os servidores da topologia, normalmente para dados de configuração ou de topologia.",
          "Ela usa a eleição de um master, e não a resolução de conflitos multi-master.",
          "cn=topology guarda os dados do registro de servidores como uma mirrored subtree.",
          "Entenda quais dados cabem aqui: pequenos, que mudam pouco e de que todos os servidores precisam de forma consistente.",
          "Colocar dados de usuário de alto volume em uma mirrored subtree é um erro de desenho.",
        ],
        // PDAA-001.1.11 Add, initialize, and remove a server in a replication topology.
        "PDAA-001.1.11": [
          "Para acrescentar um servidor: instale, rode dsreplication enable contra um servidor existente e depois inicialize-o a partir de um par.",
          "A inicialização copia os dados; o enable só estabelece o acordo de replicação.",
          "Remover um servidor exige desativar a replicação para que a topologia o esqueça, e não apenas parar o processo.",
          "Um servidor removido sem ser desativado deixa entradas desatualizadas no topology registry.",
          "Verifique com dsreplication status antes e depois, e confirme a mudança em todos os servidores.",
        ],
        // PDAA-001.2.01 Create, edit, and delete a schema definition.
        "PDAA-001.2.01": [
          "O schema é guardado como entradas em cn=schema e modificado com operações LDAP ou com ferramentas próximas do dsconfig.",
          "Os attribute types definem sintaxe, matching rules e comportamento de valor único ou múltiplo; as object classes definem os atributos obrigatórios e permitidos.",
          "Definições personalizadas precisam de um arco de OID privado e de nomes únicos, para não colidir com o schema padrão.",
          "Excluir uma definição ainda em uso vai falhar ou deixar dados órfãos; verifique o uso antes.",
          "As mudanças de schema são replicadas, então valide em uma topologia de teste antes de aplicar em produção.",
        ],
        // PDAA-001.2.02 Create and use a sensitive attribute.
        "PDAA-001.2.02": [
          "Os sensitive attributes restringem como um atributo pode ser acessado, atualizado ou devolvido, além do que as ACIs expressam.",
          "As opções incluem proibir o retorno nos resultados de busca, exigir comunicação segura e proibir a modificação.",
          "É um controle aplicado pelo servidor, que vale independentemente das permissões de ACI de quem faz a requisição.",
          "Usos típicos: identificadores nacionais, dados de pagamento e tudo o que tem exposição regulatória.",
          "Configure por client connection policy quando aplicações diferentes precisarem de tratamentos diferentes.",
        ],
        // PDAA-001.2.03 Create and use a virtual attribute.
        "PDAA-001.2.03": [
          "Um virtual attribute é calculado no momento da requisição, em vez de ficar guardado na entrada.",
          "Os providers embutidos cobrem os casos comuns (entryDN, isMemberOf, estado da password policy); os personalizados cuidam do resto.",
          "O isMemberOf é o exemplo clássico: a participação em grupos apresentada do ponto de vista do membro, sem duplicar dados.",
          "Os virtual attributes custam CPU a cada requisição; não são uma conveniência gratuita.",
          "Em alguns casos podem ser indexados, mas verifique antes de confiar em um filtro de busca que mira um deles.",
        ],
        // PDAA-001.2.04 Create and use a JSON attribute.
        "PDAA-001.2.04": [
          "Um atributo JSON guarda JSON estruturado em um único valor de atributo, e o servidor conhece essa estrutura.",
          "O servidor pode indexar e filtrar campos dentro do objeto JSON usando extensible matching.",
          "Isso evita inventar dezenas de atributos planos para dados estruturados de aplicação.",
          "Entenda como as atualizações funcionam: a modificação parcial de um valor JSON tem uma semântica específica.",
          "O schema continua governando quais entradas podem ter o atributo.",
        ],
        // PDAA-001.2.05 Apply constraints to a JSON attribute.
        "PDAA-001.2.05": [
          "As constraints validam o conteúdo de um atributo JSON, para que dados malformados ou inesperados sejam rejeitados na gravação.",
          "É possível exigir campos, restringir tipos e proibir campos não reconhecidos.",
          "Rejeitar dados ruins no diretório sai mais barato do que descobri-los em cada aplicação que os consome.",
          "Endurecer as constraints sobre dados existentes pode falhar; faça uma auditoria antes de aplicar.",
          "As violações de constraint aparecem como erros LDAP, então as aplicações precisam tratá-las.",
        ],
        // PDAA-001.2.06 Create, export, and import encryption settings definitions.
        "PDAA-001.2.06": [
          "As encryption settings definitions guardam as chaves usadas na criptografia dos dados em repouso.",
          "O encryption-settings é a ferramenta para criar, listar, exportar e importar definitions.",
          "Todos os servidores de uma topologia que precisam ler os mesmos dados cifrados precisam da mesma definition importada.",
          "Exporte a definition e guarde-a com segurança e em separado; perdê-la significa perder os dados.",
          "Trocar para uma nova definition preferida cifra as novas gravações com ela; os dados existentes são tratados conforme o procedimento documentado.",
        ],
        // PDAA-001.2.07 Use an encrypted LDIF file.
        "PDAA-001.2.07": [
          "Um arquivo LDIF cifrado protege os dados exportados em repouso, o que importa porque as exportações contêm tudo.",
          "Exporte com a criptografia ativada e a encryption settings definition adequada.",
          "A importação exige que a mesma definition esteja disponível no servidor de destino.",
          "É a forma correta de mover dados entre ambientes sem expô-los em trânsito ou em disco.",
          "Confirme que consegue decifrar uma exportação de teste antes de confiar no processo para uma migração real.",
        ],
        // PDAA-001.2.08 Create a password validator.
        "PDAA-001.2.08": [
          "Os password validators rejeitam senhas fracas no momento em que são definidas.",
          "Os tipos incluem tamanho, conjunto de caracteres, dicionário, valor de atributo (nenhuma senha contendo o nome de usuário), caracteres repetidos e semelhança com a senha anterior.",
          "Os validators se ligam a uma password policy; vários podem valer ao mesmo tempo.",
          "A validação roda sobre a senha em texto claro durante a modificação, e por isso precisa acontecer no servidor.",
          "Teste a combinação, porque validators empilhados e rígidos demais geram chamados de suporte, e não segurança.",
        ],
        // PDAA-001.2.09 Create a password policy.
        "PDAA-001.2.09": [
          "Uma password policy governa expiração, bloqueio, histórico, storage scheme e quais validators se aplicam.",
          "As policies podem ser atribuídas como padrão, por subárvore ou por entrada, pelo atributo de password policy.",
          "A escolha do storage scheme importa: use um esquema moderno, com salt e computacionalmente caro.",
          "As configurações de bloqueio pesam a segurança da conta contra a negação de serviço por bloqueio proposital.",
          "O estado da password policy pode ser consultado por usuário, e é o ponto de partida da maior parte do troubleshooting de autenticação.",
        ],
        // PDAA-001.2.10 Create a log retention policy.
        "PDAA-001.2.10": [
          "Uma log retention policy decide quando os arquivos de log antigos são apagados: por quantidade, tamanho ou espaço livre em disco.",
          "A retenção anda junto com a rotação: a rotação cria novos arquivos, a retenção remove os antigos.",
          "O disco cheio por causa de logs é uma indisponibilidade clássica; a retenção é o controle que a evita.",
          "Requisitos de compliance podem fixar uma retenção mínima que conflita com a capacidade do disco; resolva isso explicitamente.",
          "Publishers diferentes podem ter retention policies diferentes.",
        ],
        // PDAA-001.2.11 Create a log rotation policy.
        "PDAA-001.2.11": [
          "Uma log rotation policy decide quando começar um novo arquivo de log: por tempo, por tamanho ou em um calendário fixo.",
          "A rotação torna os logs administráveis e permite que a retenção atue sobre arquivos inteiros.",
          "A rotação por tempo alinha os logs com as janelas operacionais, o que ajuda a investigação.",
          "A rotação por tamanho protege contra um único arquivo enorme durante um incidente.",
          "As policies se ligam a cada log publisher, então um access log e um error log podem rotacionar de formas diferentes.",
        ],
        // PDAA-001.2.12 Create a basic access log publisher.
        "PDAA-001.2.12": [
          "O access log registra cada operação dos clients, com result codes e tempos.",
          "Crie um publisher com o dsconfig, escolhendo o arquivo de log e as policies de rotação e de retenção.",
          "Os access logs são a principal evidência tanto para análise de desempenho quanto para investigação de segurança.",
          "Considere o custo de gravação com taxas altas de operações; o logging assíncrono existe por esse motivo.",
          "O summarize-access-log transforma os logs brutos em um retrato operacional, e é por isso que o formato importa.",
        ],
        // PDAA-001.2.13 Create a filtered log publisher.
        "PDAA-001.2.13": [
          "Um filtered log publisher registra só as operações que atendem aos critérios definidos.",
          "Filtrar por result criteria ou request criteria mantém um log direcionado, sem o volume de um access log completo.",
          "Usos típicos: registrar só as falhas, só as operações sobre uma subárvore sensível ou só as conexões de uma aplicação específica.",
          "É assim que se obtém evidência duradoura sobre uma preocupação sem pagar o custo do logging completo.",
          "Confirme que os critérios correspondem ao que você pretende testando-os com operações conhecidas.",
        ],
        // PDAA-001.2.14 Create result criteria.
        "PDAA-001.2.14": [
          "Os result criteria selecionam operações pelo resultado: result code, se entradas foram devolvidas, tempo de processamento.",
          "Eles são referenciados pelos filtered log publishers e por outros componentes do servidor que agem sobre as operações.",
          "Critérios de operação lenta (tempo de processamento acima de um limite) são a forma padrão de caçar problemas de desempenho.",
          "Combine-os com request criteria para ganhar precisão.",
          "Os objetos de critérios são reutilizáveis; defina uma vez e referencie em vários publishers.",
        ],
        // PDAA-001.2.15 Create request criteria.
        "PDAA-001.2.15": [
          "Os request criteria selecionam operações pelas características de entrada: tipo de operação, DN de destino, estado de autenticação, endereço do client, controls usados.",
          "Eles orientam o logging filtrado, as restrições de client connection policy e outros comportamentos condicionais.",
          "Selecionar operações não autenticadas é um uso comum de segurança.",
          "Os critérios são avaliados a cada operação, então mantenha-os baratos.",
          "Dê nomes descritivos, porque eles são referenciados em vários lugares e sobrevivem a quem os escreveu.",
        ],
        // PDAA-001.2.16 Create a client connection policy.
        "PDAA-001.2.16": [
          "Uma client connection policy governa o que uma conexão pode fazer, com base em como ela se conectou e com qual identidade fez bind.",
          "As policies podem restringir tipos de operação, tamanho do conjunto de resultados e quais subárvores ficam visíveis.",
          "A seleção é feita por connection criteria avaliados no momento do bind.",
          "É o mecanismo para dar a uma aplicação uma visão restrita sem depender só das ACIs.",
          "A ordem das policies importa; vale a primeira policy correspondente.",
        ],
        // PDAA-001.2.17 Configure uncached entries and/or attributes.
        "PDAA-001.2.17": [
          "Atributos e entradas fora do cache mantêm dados fora do cache do banco de dados, para poupar memória para o conjunto de trabalho.",
          "Atributos grandes e pouco lidos (fotos, certificados, blobs) são os candidatos habituais.",
          "A troca é memória poupada contra leituras extras em disco quando esses dados são pedidos.",
          "Configure no nível do backend, com os critérios adequados.",
          "Meça a taxa de acerto do cache antes e depois; é uma decisão de tuning que deve se basear em evidências.",
        ],
        // PDAA-001.2.18 Configure PingDirectoryProxy as a load balancer.
        "PDAA-001.2.18": [
          "Como load balancer, o PingDirectoryProxy distribui as operações entre servidores de backend sem particionar os dados.",
          "Os algoritmos incluem failover, round-robin, fewest-operations e variantes ponderadas pela saúde.",
          "Os health checks determinam a disponibilidade dos backends e orientam as escolhas do algoritmo.",
          "As operações de leitura podem ser espalhadas enquanto as gravações vão para um servidor preferido, o que importa em uma topologia replicada.",
          "É a resposta de disponibilidade e throughput; o entry balancing é a resposta de capacidade.",
        ],
        // PDAA-001.2.19 Configure PingDirectoryProxy to transform requested data.
        "PDAA-001.2.19": [
          "As proxy transformations reescrevem requisições e respostas entre o client e o backend.",
          "O mapeamento de atributos e o de DNs permitem que um client veja um namespace diferente do que o backend de fato guarda.",
          "As suppression transformations removem atributos das respostas.",
          "As transformações são a forma de um proxy apresentar uma visão compatível com o legado sobre um diretório modernizado.",
          "Cada transformação custa processamento a cada operação, então aplique-as de forma restrita.",
        ],
        // PDAA-001.3.01 Troubleshoot common issues.
        "PDAA-001.3.01": [
          "Comece pelo status do servidor e pelo error log, e depois vá ao access log da operação específica.",
          "Reproduza com ldapsearch ou ldapmodify, usando as mesmas credenciais e controls do client que falha.",
          "Isole camada por camada: alcance de rede, handshake TLS, bind e, por fim, a própria operação.",
          "Verifique cedo o status da replicação quando o comportamento difere entre servidores.",
          "Colete um arquivo de support data antes de reiniciar qualquer coisa, porque os reinícios destroem a evidência.",
        ],
        // PDAA-001.3.02 Interpret log entries to resolve a problem.
        "PDAA-001.3.02": [
          "As entradas do access log trazem o result code, a mensagem, o tempo de processamento e as entradas devolvidas.",
          "Os result codes LDAP são o vocabulário: 32 no such object, 49 invalid credentials, 50 insufficient access rights, 53 unwilling to perform.",
          "Correlacione requisição e resposta pela conexão e pelo operation ID.",
          "Os avisos de busca não indexada no log identificam as consultas que não vão escalar.",
          "O summarize-access-log agrega isso em contagens e nas operações mais lentas, que é o caminho mais rápido até o problema.",
        ],
        // PDAA-001.3.03 Use cn=monitor analysis to troubleshoot a problem.
        "PDAA-001.3.03": [
          "O cn=monitor expõe o estado do servidor como entradas: contagem de conexões, taxa de operações, estatísticas de cache, status da replicação e uso de disco.",
          "Consulte-o com uma busca LDAP comum; isso significa que os sistemas de monitoramento podem consumi-lo diretamente.",
          "Os monitores de backend mostram as taxas de acerto do cache; uma taxa em queda explica a latência em alta.",
          "Os monitores de replicação mostram o backlog e o horário da última mudança por servidor.",
          "Estabeleça uma baseline com o ambiente saudável, porque esses números só significam algo por comparação.",
        ],
        // PDAA-001.3.04 Diagnose and resolve a configuration issue.
        "PDAA-001.3.04": [
          "Problemas de configuração normalmente aparecem como uma operação que se comporta de forma diferente do padrão documentado.",
          "O dsconfig pode mostrar a configuração efetiva; compare com um servidor que sabidamente funciona.",
          "O log de mudanças de configuração registra o que mudou, quem mudou e quando, o que normalmente responde a pergunta na hora.",
          "Para alguns componentes, a configuração é replicada em uma mirrored subtree; saiba quais partes são locais e quais valem para toda a topologia.",
          "Reverta usando a mudança registrada, em vez de adivinhar o valor anterior.",
        ],
        // PDAA-001.3.05 Diagnose and resolve a search issue.
        "PDAA-001.3.05": [
          "Um problema de busca é quase sempre um problema de índice: procure o aviso de busca não indexada no log.",
          "Os tipos de índice importam: equality, presence, substring, ordering e approximate atendem filtros diferentes.",
          "Filtros de substring com curinga no início não conseguem usar um índice comum: é um problema de desenho, e não de tuning.",
          "O rebuild-index repara ou cria índices; é uma operação offline ou com desempenho degradado, então planeje-a.",
          "O index entry limit determina quando o servidor deixa de manter um índice para um valor muito comum.",
        ],
        // PDAA-001.3.06 Diagnose and resolve a schema issue.
        "PDAA-001.3.06": [
          "Um problema de schema aparece como erros de object class violation ou de attribute type indefinido na gravação.",
          "Confirme que a definição existe e está escrita exatamente como é usada: o nome não diferencia maiúsculas de minúsculas, mas precisa ser exato.",
          "Verifique se os atributos obrigatórios de cada object class da entrada estão presentes.",
          "O schema é replicado; uma divergência entre servidores produz falhas que acompanham o client, e não os dados.",
          "Valide o LDIF contra o schema antes de uma importação em massa, em vez de descobrir as violações no meio da carga.",
        ],
        // PDAA-001.3.07 Diagnose and resolve an ACI issue.
        "PDAA-001.3.07": [
          "Um problema de ACI aparece como result code 50, insufficient access rights, ou como dados que ficam inesperadamente invisíveis.",
          "Lembre que, sem um allow explícito, o acesso é negado; e qualquer deny correspondente se sobrepõe a todos os allows.",
          "Verifique quais ACIs se aplicam à entrada de destino, incluindo as herdadas dos ancestrais.",
          "As bind rules que referenciam grupos exigem que a participação possa ser resolvida no momento da avaliação.",
          "Teste como a identidade afetada; testar como administrador não prova nada sobre o acesso do usuário.",
        ],
        // PDAA-001.3.08 Diagnose and resolve a replication issue.
        "PDAA-001.3.08": [
          "Os problemas de replicação aparecem como divergência entre servidores ou como um backlog crescente.",
          "O dsreplication status é o primeiro comando; ele informa as mudanças que faltam em cada servidor.",
          "Causas comuns: partição de rede, certificado vencido nas conexões de replicação e um servidor restaurado de backup sem reinicialização.",
          "Reinicializar a partir de um par saudável é o reparo padrão para um servidor que divergiu.",
          "Confirme que o topology registry reflete a realidade, porque uma entrada desatualizada de um servidor desativado produz erros persistentes.",
        ],
      },
    },
  },
  // PFAA-001: Certified Expert - PingFederate.
  "ping-ce-pingfederate": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "70 questões de múltipla escolha",
      passMark: "73,33%",
      cost: "EUR 460 / GBP 390 / USD 495 (pode haver imposto regional); cada voucher vale para uma única tentativa",
      note: "Cada código de voucher vale para uma única tentativa de prova; depois de resgatado, não pode ser reutilizado. A prova cobre o PingFederate versão 11 ou posterior.",
    },
    // Key points: this site's study notes, translated objective by objective in the English order.
    keyPoints: {
      // Site-authored notes, so translated.
      rule: "site-notes",
      // Objective id -> translated points.
      byObjective: {
        // PFAA-001.1.01 Configure attribute mappings from an external data store with failover.
        "PFAA-001.1.01": [
          "Failover em um data store significa consultar uma segunda fonte quando a primeira não pode ser alcançada.",
          "Configure vários hostnames LDAP no data store, para que a própria conexão faça failover.",
          "O failover trata da disponibilidade da fonte, e não de dados ausentes em uma fonte que responde.",
          "Teste derrubando o primário, e não raciocinando sobre a configuração.",
          "Os timeouts de conexão precisam ser curtos o bastante para que o failover aconteça antes de o usuário desistir.",
        ],
        // PFAA-001.1.02 Configure attribute mappings from an external data store with failsafe mappings.
        "PFAA-001.1.02": [
          "O failsafe mapping fornece um valor padrão quando a busca dá certo mas não devolve nada.",
          "Essa é a distinção que a prova faz: failover é sobre a fonte estar fora do ar; failsafe é sobre o atributo estar ausente.",
          "Sem um failsafe, um atributo ausente pode derrubar a transação de SSO inteira.",
          "Escolha padrões que sejam seguros se chegarem ao service provider, porque vão chegar.",
          "Registre em log quando o failsafe é acionado, ou padrões silenciosos escondem um problema de qualidade de dados.",
        ],
        // PFAA-001.1.03 Configure attribute mappings from an external data store using OGNL.
        "PFAA-001.1.03": [
          "As expressões OGNL calculam valores de atributos a partir dos resultados do data store e de outros dados de contexto.",
          "As expressões podem concatenar, escolher condicionalmente e transformar valores durante o mapeamento.",
          "Ative as expressões explicitamente; elas vêm desativadas por padrão porque são poderosas.",
          "Mantenha as expressões curtas e testáveis; lógica complexa pertence à fonte de dados ou a um adapter.",
          "Uma expressão que lança exceção derruba a transação, então trate os casos nulos de propósito.",
        ],
        // PFAA-001.1.04 Create custom attributes using OGNL.
        "PFAA-001.1.04": [
          "Atributos personalizados são entradas do contrato preenchidas por uma expressão, e não por uma busca direta.",
          "Estenda primeiro o attribute contract e depois preencha o novo atributo com uma expressão OGNL.",
          "Usos típicos: derivar uma string de papel, normalizar maiúsculas e minúsculas ou combinar nome e sobrenome.",
          "O service provider só recebe o que o contrato carrega, então contrato e expressão precisam concordar.",
          "Teste com dados representativos, incluindo os casos incômodos, e não só com um usuário de exemplo limpo.",
        ],
        // PFAA-001.1.05 Customize the HTML Form Adapter.
        "PFAA-001.1.05": [
          "O HTML Form Adapter exibe a página de login com usuário e senha.",
          "A personalização usa os arquivos de template no diretório de templates do servidor, com arquivos de localização para os textos.",
          "Mudanças de branding pertencem aos templates e ao CSS; mudanças de comportamento pertencem à configuração do adapter.",
          "As mudanças de template precisam ser replicadas em todos os nós de um cluster.",
          "Mantenha as personalizações mínimas e documentadas, porque elas precisam ser reaplicadas no upgrade.",
        ],
        // PFAA-001.1.06 Self-service password reset.
        "PFAA-001.1.06": [
          "A redefinição de senha por autoatendimento permite ao usuário definir uma nova senha sem um administrador.",
          "A configuração fica no HTML Form Adapter e exige um password credential validator que aceite gravações.",
          "O método de verificação importa: link de uso único por e-mail, senha de uso único ou perguntas de segurança têm propriedades de segurança diferentes.",
          "Limitação de taxa e proteção contra enumeração de contas fazem parte do desenho; um fluxo de redefinição que revela se uma conta existe é um achado de auditoria.",
          "A conta de diretório usada pelo PingFederate precisa de direitos para trocar senhas.",
        ],
        // PFAA-001.1.07 Self-service account recovery.
        "PFAA-001.1.07": [
          "A recuperação de conta desbloqueia ou restaura o acesso depois de um bloqueio, o que é diferente de redefinir uma senha sabidamente comprometida.",
          "Ela usa os mesmos mecanismos de verificação da redefinição de senha e tem as mesmas preocupações com enumeração.",
          "Coordene com a política de bloqueio do diretório, para que a recuperação de fato remova o bloqueio.",
          "Audite especificamente os eventos de recuperação; eles são um alvo comum de engenharia social.",
          "Decida se a recuperação exige verificação mais forte que a redefinição e justifique a escolha.",
        ],
        // PFAA-001.1.08 Self-service username recovery.
        "PFAA-001.1.08": [
          "A recuperação de nome de usuário informa qual nome de usuário está associado a um identificador verificado, como um endereço de e-mail.",
          "É o fluxo de autoatendimento com o maior risco de enumeração dos três, então as respostas devem ser iguais, exista ou não a conta.",
          "O envio deve ir para o canal cadastrado, nunca ser exibido na tela.",
          "Algumas organizações desativam esse fluxo por completo; é uma decisão de desenho legítima.",
          "Limite a taxa de forma agressiva e registre em log cada tentativa.",
        ],
        // PFAA-001.1.09 Advanced use of authentication policies.
        "PFAA-001.1.09": [
          "As authentication policies são uma árvore de decisão sobre adapters e selectors, avaliada a cada requisição.",
          "Os selectors ramificam pelo contexto: faixa de rede, contexto de autenticação solicitado, client ou valores de atributos.",
          "Os policy contracts levam os atributos da árvore até a conexão, desacoplando a árvore do destino.",
          "O uso avançado inclui a autenticação step-up, em que um ramo exige um segundo fator antes de chegar ao sucesso.",
          "Desenhe a árvore antes de construí-la; as policies ficam difíceis de ler no console quando crescem.",
        ],
        // PFAA-001.1.10 Local identity profiles.
        "PFAA-001.1.10": [
          "Os local identity profiles dão suporte ao cadastro e à gestão de perfil de usuários que o próprio PingFederate gerencia.",
          "Eles definem os campos coletados, o data store onde são gravados e os templates associados.",
          "Cadastro, atualização de perfil e verificação de e-mail são os fluxos comuns.",
          "Servem para casos de uso sem um diretório corporativo prévio desses usuários, normalmente identidade de clientes.",
          "A validação de campos e o tratamento de atributos obrigatórios pertencem à definição do profile.",
        ],
        // PFAA-001.1.11 SP Target URL Mapping.
        "PFAA-001.1.11": [
          "O SP target URL mapping decide onde o usuário chega no service provider depois do SSO.",
          "Ele associa um destino solicitado a um destino permitido, em vez de confiar em uma URL arbitrária recebida.",
          "É tanto um controle contra open redirect quanto um recurso de usabilidade.",
          "Os curingas precisam ter escopo cuidadoso, para não corresponderem a um host controlado por um atacante.",
          "Combine com o service provider as URLs exatas que a aplicação dele usa.",
        ],
        // PFAA-001.1.12 Configure Redirect Validation.
        "PFAA-001.1.12": [
          "A redirect validation restringe as URLs para as quais o PingFederate redireciona um navegador depois da autenticação ou do logout.",
          "Configure os target resources permitidos para SSO e para SLO separadamente.",
          "Sem ela, um parâmetro de destino forjado transforma o identity provider em um open redirector, o que amplifica phishing.",
          "A validação deve comparar esquema e host, e não apenas uma substring.",
          "Teste com um valor deliberadamente hostil para confirmar que o caminho de rejeição funciona.",
        ],
        // PFAA-001.1.13 Using RelayState to request a specific resource.
        "PFAA-001.1.13": [
          "O RelayState carrega o estado da aplicação pela troca SAML, para que o usuário volte ao recurso que pediu.",
          "O identity provider o devolve como recebeu; ele é opaco para o protocolo.",
          "Como um atacante pode influenciá-lo, ele precisa ser validado pelas regras de redirect validation antes do uso.",
          "Há limites de tamanho; um estado grande deve ficar guardado no servidor, com uma referência no RelayState.",
          "Entenda a diferença entre o RelayState e o parâmetro de destino de uma URL iniciada pelo IdP.",
        ],
        // PFAA-001.1.14 Configure certificate revocation checking.
        "PFAA-001.1.14": [
          "A verificação de revogação confirma que um certificado apresentado não foi revogado, via CRL ou OCSP.",
          "O OCSP dá respostas mais recentes; as CRLs são mais simples, mas podem ser grandes e desatualizadas.",
          "Decida o comportamento quando a fonte de revogação não responde: fail open ou fail closed, cada um com suas consequências.",
          "O host do PingFederate precisa ter acesso de rede ao CRL distribution point ou ao OCSP responder.",
          "As configurações de cache trocam atualidade por latência e por carga no responder.",
        ],
        // PFAA-001.1.15 Configure certificate rotation for self-signed certificates.
        "PFAA-001.1.15": [
          "Os certificados autoassinados do PingFederate podem passar por rotação, de modo que um novo certificado seja publicado antes de o antigo deixar de ser usado.",
          "A rotação cria um certificado sucessor que aparece nos metadados, permitindo que os parceiros o adotem com antecedência.",
          "Os parceiros que consomem metadados automaticamente vão acompanhar; os que fixaram o certificado precisam de coordenação manual.",
          "Planeje a rotação antes do vencimento, e não no dia; um certificado de assinatura vencido quebra todas as federações de uma vez.",
          "Verifique se cada parceiro aceitou a nova chave antes de ativá-la.",
        ],
        // PFAA-001.2.01 Create custom URLs using single sign-on (SSO) endpoint variables
        "PFAA-001.2.01": [
          "As variáveis dos endpoints de SSO permitem que uma única URL startSSO atenda a vários destinos por parâmetro.",
          "Parâmetros comuns: PartnerSpId, TargetResource e a seleção do IdP adapter.",
          "URLs personalizadas simplificam favoritos e a integração de aplicações sem uma conexão por destino.",
          "Todo parâmetro que influencia o redirecionamento precisa estar coberto pela redirect validation.",
          "Documente o formato da URL para as equipes de aplicação, já que URLs malformadas são um chamado de suporte frequente.",
        ],
        // PFAA-001.2.02 Configure identity provider to service provider (IdP-to-SP) bridging
        "PFAA-001.2.02": [
          "O IdP-to-SP bridging faz o PingFederate atuar como service provider diante de um identity provider upstream e como identity provider diante de um service provider downstream.",
          "É o padrão de hub de federação: muitas fontes de identidade upstream, muitas aplicações downstream, um único ponto de tradução.",
          "O mapeamento de atributos acontece duas vezes, e o contrato precisa levar os atributos pelos dois hops.",
          "As authentication policies decidem qual identity provider upstream atende uma determinada requisição.",
          "O bridging concentra a confiança, então a segurança e a disponibilidade do próprio hub se tornam críticas.",
        ],
        // PFAA-001.2.03 Configure session cookies
        "PFAA-001.2.03": [
          "Os cookies de sessão representam a sessão autenticada no próprio PingFederate.",
          "Configure os timeouts, se a sessão é rastreada e o escopo do cookie.",
          "As sessões de autenticação podem ser guardadas, para que não seja preciso autenticar de novo entre aplicações.",
          "Os atributos do cookie (Secure, HttpOnly, SameSite) precisam estar adequados à instalação.",
          "O comportamento da sessão interage com o single logout; entenda o que um logout de fato encerra.",
        ],
        // PFAA-001.3.01 Configure dynamic client registration
        "PFAA-001.3.01": [
          "O dynamic client registration permite que clients OAuth se registrem sozinhos em runtime, em vez de serem criados por um administrador.",
          "O acesso ao endpoint de registro precisa ser controlado, normalmente por um initial access token, ou qualquer um poderá criar clients.",
          "As client registration policies restringem o que um client que se registra sozinho pode pedir.",
          "Os clients registrados recebem credenciais e um registration access token para a gestão posterior.",
          "É essencial em escala e perigoso sem restrições; a configuração da policy é o controle.",
        ],
        // PFAA-001.3.02 Configure an external DB for persistent grants
        "PFAA-001.3.02": [
          "Os persistent grants registram o consentimento do usuário e o estado dos refresh tokens, e precisam sobreviver a reinícios.",
          "Um banco de dados externo dá durabilidade e visibilidade compartilhada em um cluster.",
          "O schema é fornecido pelo PingFederate; a conta do banco de dados precisa dos direitos documentados.",
          "O tempo de vida dos grants e a limpeza dos grants vencidos são configurações operacionais com consequências de armazenamento.",
          "Sem armazenamento externo, os grants ficam limitados de formas que quebram o comportamento dos refresh tokens em escala.",
        ],
        // PFAA-001.4.01 Configure an adaptive cluster
        "PFAA-001.4.01": [
          "Um adaptive cluster distribui o estado de runtime de forma dinâmica entre os nós de engine, sem state servers dedicados.",
          "Os nós se descobrem e compartilham o estado, o que simplifica a implantação.",
          "Ele serve para instalações em que todos os engines são equivalentes e as condições de rede entre eles são boas.",
          "Entenda o comportamento de rebalanceamento quando um nó entra ou sai.",
          "Compare com o modelo directed antes de escolher; a troca é simplicidade contra controle explícito.",
        ],
        // PFAA-001.4.02 Configure dedicated state servers in a directed cluster
        "PFAA-001.4.02": [
          "Em um directed cluster, nós específicos são designados como state servers que guardam o estado de runtime dos outros.",
          "Os engines são configurados com os state servers que usam, o que torna a topologia explícita.",
          "Isso dá uma distribuição previsível, o que importa quando há fronteiras de latência.",
          "A falha de um state server tem um impacto definido, que precisa ser entendido e testado.",
          "Dimensionar os state servers é um exercício de capacidade separado do dimensionamento dos engines.",
        ],
        // PFAA-001.4.03 Configure sub-clusters in a directed cluster
        "PFAA-001.4.03": [
          "Os sub-clusters agrupam nós, normalmente por data center ou região, para que o estado seja compartilhado dentro de um grupo e não globalmente.",
          "Isso limita a conversa entre sites e mantém local o estado sensível à latência.",
          "As requisições precisam ser direcionadas para que a sessão de um usuário fique no sub-cluster que guarda o estado dela.",
          "O comportamento de failover entre sub-clusters é uma decisão de desenho com uma consequência visível para o usuário: autenticar de novo.",
          "A configuração precisa ser consistente em todos os nós, ou o agrupamento se comporta mal em silêncio.",
        ],
        // PFAA-001.4.04 Configure cluster runtime state-management services
        "PFAA-001.4.04": [
          "A gestão do estado de runtime cobre sessões, grants e outros dados que precisam ser consistentes entre os nós.",
          "Os serviços são configurados por tipo de estado, então dados diferentes podem usar estratégias diferentes.",
          "Parte do estado pode ser regenerada (autenticar de novo) e parte não (consentimento); trate-as de forma diferente.",
          "Monitore a replicação do estado, e não só se os nós estão vivos.",
          "Teste a perda de um nó de propósito e observe o que os usuários vivenciam.",
        ],
        // PFAA-001.5.01 Interpret the contents of individual log files
        "PFAA-001.5.01": [
          "Logs principais: server.log para o runtime e os erros, logs de transaction e de audit para o detalhe de cada requisição, logs de admin para as mudanças de configuração.",
          "O audit log registra a transação de SSO com identidade, conexão e resultado, e é o primeiro lugar a olhar em um login que falhou.",
          "Correlacione entre os logs usando o identificador de tracking ou de transação.",
          "Os timestamps precisam estar sincronizados entre os nós do cluster, ou a correlação fica impossível.",
          "Saiba qual log responde qual pergunta antes de um incidente, e não durante.",
        ],
        // PFAA-001.5.02 Change logging levels
        "PFAA-001.5.02": [
          "Os níveis de logging são definidos no log4j2.xml, por logger, e podem ser mudados para um componente específico, e não globalmente.",
          "DEBUG no pacote certo é muito mais útil que DEBUG em tudo, que enterra o sinal e prejudica o desempenho.",
          "Algumas mudanças exigem reinício; outras são lidas no intervalo de monitoramento configurado.",
          "Aumente o nível, reproduza, capture e baixe de novo, como um ciclo disciplinado.",
          "Nunca deixe logging detalhado ligado em produção; ele pode registrar dados sensíveis.",
        ],
        // PFAA-001.5.03 Configure log file rotation using log4j2.xml
        "PFAA-001.5.03": [
          "A rotação é configurada com appenders do log4j2, usando triggering policies por tempo ou por tamanho.",
          "Uma rollover strategy define quantos arquivos arquivados são mantidos.",
          "A rotação evita um único arquivo sem limite e torna o arquivamento viável.",
          "Alinhe a rotação com o ritmo de envio dos logs, para que os arquivos estejam completos quando forem coletados.",
          "Confirme que a capacidade do disco comporta o conjunto retido, e não só o arquivo ativo.",
        ],
        // PFAA-001.5.04 Configure custom log listeners using log4j2.xml
        "PFAA-001.5.04": [
          "Appenders personalizados no log4j2.xml podem direcionar loggers específicos para arquivos próprios ou para destinos remotos.",
          "Os appenders de syslog e de socket enviam os logs para a coleta central sem um agente separado.",
          "Os filtros permitem que um appender receba só os eventos que importam, mantendo pequenos os logs direcionados.",
          "Os pattern layouts controlam o formato, do qual os parsers seguintes dependem; mudá-lo os quebra.",
          "Valide a configuração em um nó antes de espalhá-la pelo cluster.",
        ],
        // PFAA-001.5.05 Configure database logging
        "PFAA-001.5.05": [
          "O database logging grava os registros de auditoria em um banco de dados relacional, em vez dos arquivos ou junto com eles.",
          "Ele exige um data store JDBC e o schema que o PingFederate fornece.",
          "Consultar os dados de auditoria passa a ser prático, e é por isso que as equipes de compliance pedem esse recurso.",
          "A disponibilidade do banco de dados passa a afetar o logging; entenda o comportamento quando o banco não responde.",
          "A retenção e o arquivamento da tabela de auditoria são uma responsabilidade operacional que os arquivos tratavam implicitamente.",
        ],
        // PFAA-001.6.01 Configure an HTML Form Adapter
        "PFAA-001.6.01": [
          "O HTML Form Adapter autentica usuários com nome de usuário e senha contra um password credential validator.",
          "A configuração cobre o validator, o comportamento da sessão e quais recursos de autoatendimento ficam expostos.",
          "O contrato do adapter define quais atributos ele disponibiliza para as policies e as conexões.",
          "O comportamento de desafio e de bloqueio vem do validator e do diretório por trás dele, e não só do adapter.",
          "É o adapter interativo padrão e a base da maioria das authentication policies.",
        ],
        // PFAA-001.6.02 Customize the HTML Form Adapter
        "PFAA-001.6.02": [
          "Personalizar significa editar os templates velocity e os arquivos de propriedades de localização.",
          "Os arquivos ficam no diretório de templates do servidor e precisam ser idênticos em todos os nós do cluster.",
          "Separe o branding (CSS, imagens) da lógica; lógica nos templates é difícil de manter entre upgrades.",
          "Mantenha um registro de cada arquivo personalizado, porque os upgrades trazem novos padrões que precisam ser mesclados.",
          "Teste a página personalizada quanto à acessibilidade e ao comportamento correto em caso de erro, e não só no caminho feliz.",
        ],
        // PFAA-001.6.03 Configure an HTTP Basic Adapter
        "PFAA-001.6.03": [
          "O HTTP Basic Adapter autentica usando o pedido de autenticação básica do navegador.",
          "Ele é simples e sem branding, o que o torna adequado para cenários de serviço ou de teste, e não para o login de usuários.",
          "As credenciais são enviadas em cada requisição, então o TLS é obrigatório.",
          "Não existe mecanismo de logout na autenticação básica, o que é uma limitação real.",
          "Ele também usa um password credential validator, então a configuração do diretório por trás é a mesma.",
        ],
        // PFAA-001.6.04 Configure a Kerberos Adapter
        "PFAA-001.6.04": [
          "O Kerberos Adapter oferece single sign-on no desktop para máquinas ingressadas no domínio.",
          "Ele exige uma conta de serviço e um keytab no Active Directory, além de um service principal name correto.",
          "Os navegadores precisam ser configurados para confiar no hostname do PingFederate para a autenticação integrada.",
          "A diferença de relógio entre o domain controller e o PingFederate quebra o Kerberos; a sincronização de horário é obrigatória.",
          "Ofereça um adapter alternativo para máquinas que não podem usar Kerberos, ou os usuários remotos ficam sem acesso.",
        ],
        // PFAA-001.6.05 Configure an OpenToken Adapter
        "PFAA-001.6.05": [
          "O OpenToken Adapter troca a identidade com uma aplicação usando um token cifrado com shared secret.",
          "É uma integração sem agente, em que a aplicação usa uma biblioteca de agent OpenToken.",
          "Shared secret, transporte (cookie ou query parameter) e tempo de vida do token são as configurações principais.",
          "Os dois lados precisam concordar sobre a cipher suite e os nomes dos atributos carregados no token.",
          "É um padrão de integração legado; prefira opções baseadas em padrões quando a aplicação tiver suporte a elas.",
        ],
        // PFAA-001.6.06 Configure a One-Time Passcode Adapter
        "PFAA-001.6.06": [
          "O One-Time Passcode Adapter envia um código por outro canal, normalmente e-mail ou SMS.",
          "Ele é usado como segundo fator em uma authentication policy, depois de um adapter primário.",
          "Configure o canal de envio, o tamanho do código, a validade e os limites de novas tentativas.",
          "O atributo de contato do usuário precisa poder ser recuperado, então o mapeamento do data store faz parte da configuração.",
          "As falhas de envio são o risco operacional; monitore-as e ofereça um fator alternativo.",
        ],
        // PFAA-001.6.07 Configure a RefID Adapter
        "PFAA-001.6.07": [
          "O RefID Adapter passa um identificador de referência, e não a própria identidade, que o parceiro resolve separadamente.",
          "Ele serve para integrações em que os atributos não podem trafegar no token.",
          "A referência precisa poder ser resolvida pelo lado que a recebe dentro da sua janela de validade.",
          "Entenda o tempo de vida e as características de uso único da referência.",
          "É um padrão que preserva a privacidade: o token carrega um ponteiro, e não os dados.",
        ],
        // PFAA-001.6.08 Configure an X509 Adapter
        "PFAA-001.6.08": [
          "O X509 Adapter autentica usando um certificado de cliente apresentado durante o handshake TLS.",
          "O connector precisa pedir ou exigir certificados de cliente, e a CA emissora precisa ser confiável.",
          "Os atributos são extraídos do subject ou do SAN do certificado e mapeados para o contrato.",
          "A verificação de revogação deve estar ativa, ou um certificado revogado continua autenticando.",
          "É uma autenticação forte, ligada a um dispositivo ou a um smartcard, e não ao conhecimento.",
        ],
        // PFAA-001.6.09 Configure a Composite Adapter
        "PFAA-001.6.09": [
          "O Composite Adapter encadeia vários adapters, para que vários fatores sejam coletados em uma única instância de adapter.",
          "Cada adapter encadeado contribui com atributos; o contrato do composite expõe a combinação.",
          "A ordem importa, e a regra de quais adapters são obrigatórios ou opcionais faz parte da configuração.",
          "As authentication policies podem expressar uma lógica parecida; o composite é mais simples para uma cadeia fixa.",
          "Teste a falha de cada adapter membro para confirmar que o comportamento geral é o que você pretendia.",
        ],
        // PFAA-001.6.10 Configure attribute mappings from an external data store
        "PFAA-001.6.10": [
          "O mapeamento a partir do data store enriquece a identidade com atributos buscados no momento da autenticação.",
          "Configure o data store, o filtro de busca ou a consulta, e o mapeamento para os atributos do contrato.",
          "O filtro de busca é a peça crítica: ele precisa identificar o usuário de forma única e precisa estar indexado no diretório.",
          "Buscas que falham e resultados vazios são modos de falha diferentes; trate os dois.",
          "Cada atributo mapeado custa uma busca, então traga o necessário e nada mais.",
        ],
        // PFAA-001.6.11 Create custom attributes using OGNL
        "PFAA-001.6.11": [
          "As expressões OGNL no preenchimento produzem valores que não estão diretamente na fonte.",
          "Elas precisam ser ativadas explicitamente na configuração antes de serem usadas.",
          "Padrões comuns: valores padrão condicionais, manipulação de strings e junção de valores de várias fontes.",
          "As expressões rodam a cada transação, então mantenha-as baratas e seguras contra nulos.",
          "Valide com dados reais, porque um nulo em produção vai lançar exceção onde os dados de teste não lançaram.",
        ],
        // PFAA-001.6.12 Configure an SP/IdP SAML connection using the POST binding
        "PFAA-001.6.12": [
          "Uma conexão SAML com POST binding envia a assertion em um formulário que o navegador envia automaticamente.",
          "A configuração exige o entity ID do parceiro, a ACS URL, o certificado de assinatura e o attribute contract.",
          "O POST binding serve para assertions grandes; o redirect binding tem o tamanho limitado pelo comprimento da URL.",
          "A assinatura da assertion e a criptografia opcional são configuradas por conexão e precisam corresponder ao que o parceiro espera.",
          "A troca de metadados é a forma confiável de acertar esses valores, em vez de transcrevê-los.",
        ],
        // PFAA-001.6.13 Configure an SP/IdP connection using OpenID Connect (OIDC)
        "PFAA-001.6.13": [
          "Uma conexão OIDC usa fluxos OAuth com um ID token no lugar de uma assertion SAML.",
          "O relying party é registrado como client OAuth, com redirect URIs e grant types permitidos.",
          "As OIDC policies determinam quais claims vão para o ID token.",
          "Os scopes controlam quais claims o client pode pedir, e a policy os preenche.",
          "Os metadados de discovery permitem que os clients se configurem sozinhos a partir do endpoint well-known.",
        ],
        // PFAA-001.6.14 Configure an SP/IdP connection utilizing multiple ACS endpoints
        "PFAA-001.6.14": [
          "Vários ACS endpoints permitem que uma conexão atenda a vários ambientes ou índices do service provider.",
          "O índice do assertion consumer service ou a URL explícita na requisição seleciona o endpoint.",
          "Um endpoint padrão vale quando nenhum é indicado.",
          "Cada endpoint precisa ser validado, para evitar que assertions sejam enviadas a um local indevido.",
          "É assim que uma única conexão atende às URLs de desenvolvimento, teste e produção quando o parceiro exige.",
        ],
        // PFAA-001.6.15 Create custom URLs using SSO endpoint variables
        "PFAA-001.6.15": [
          "As variáveis de endpoint em uma URL startSSO selecionam o parceiro, o target resource e o adapter a usar.",
          "Isso permite deep links de um portal para uma aplicação específica, passando pelo identity provider.",
          "Todos os valores de destino precisam passar pela redirect validation.",
          "Codifique corretamente os valores dos parâmetros, já que caracteres sem codificação são uma causa comum de falhas.",
          "Publique o formato canônico da URL para os responsáveis pelas aplicações, em vez de deixar cada equipe inventar o seu.",
        ],
        // PFAA-001.6.16 Create OAuth clients
        "PFAA-001.6.16": [
          "Um client OAuth é definido por client ID, método de autenticação, grant types permitidos, redirect URIs e scopes.",
          "As opções de autenticação do client incluem shared secret, TLS mútuo e JWT com chave privada; prefira as opções mais fortes para clients confidenciais.",
          "Clients públicos (SPAs, apps nativas) precisam usar authorization code com PKCE e não conseguem guardar um secret.",
          "As redirect URIs precisam de correspondência exata; curingas aqui são um risco de open redirect e de roubo de tokens.",
          "As restrições de scope no client limitam o que ele pode pedir em qualquer situação, independentemente do consentimento do usuário.",
        ],
        // PFAA-001.6.17 Configure persistent grant settings
        "PFAA-001.6.17": [
          "Os persistent grants guardam a autorização do usuário, para que ela não precise ser consentida de novo a cada requisição.",
          "As configurações cobrem o tempo de vida do grant, o idle timeout e se os grants podem ser reusados entre clients.",
          "Os persistent grants sustentam os refresh tokens; sem eles, o refresh não sobrevive a um reinício.",
          "O armazenamento dos grants pode ser local ou em um banco de dados externo, para durabilidade no cluster.",
          "Ofereça um caminho de revogação, porque um persistent grant é uma autorização em vigor até ser removido.",
        ],
        // PFAA-001.6.18 Configure common scopes
        "PFAA-001.6.18": [
          "Os common scopes ficam disponíveis para qualquer client que os peça, respeitadas as restrições do próprio client.",
          "Eles formam o vocabulário compartilhado do authorization server.",
          "Cada scope deve corresponder a uma capacidade com significado, e não a um detalhe de implementação.",
          "As descrições importam porque aparecem na tela de consentimento que o usuário lê.",
          "Mantenha pequeno o conjunto comum; a proliferação torna o consentimento sem sentido.",
        ],
        // PFAA-001.6.19 Configure exclusive scopes
        "PFAA-001.6.19": [
          "Os exclusive scopes são restritos, para que só os clients explicitamente autorizados possam pedi-los.",
          "Use-os para capacidades privilegiadas que nunca podem ser concedidas a um client genérico.",
          "A configuração do client precisa listar o exclusive scope para que a requisição dê certo.",
          "É o mecanismo para separar, no authorization server, as APIs administrativas das comuns.",
          "Audite periodicamente quais clients têm exclusive scopes.",
        ],
        // PFAA-001.6.20 Configure internally referenced access tokens
        "PFAA-001.6.20": [
          "Os access tokens com referência interna são strings opacas; o resource server chama a introspection para saber o que significam.",
          "A revogação é imediata, porque toda validação consulta o authorization server.",
          "O custo é uma ida e volta pela rede a cada validação, atenuado pelo cache no resource server.",
          "O conteúdo do token nunca sai do authorization server, o que é uma vantagem de privacidade.",
          "Escolha esta opção quando a revogação imediata pesar mais que a latência.",
        ],
        // PFAA-001.6.21 Configure JWT access tokens
        "PFAA-001.6.21": [
          "Os access tokens JWT são autocontidos e validados localmente contra a chave de assinatura.",
          "O resource server precisa verificar assinatura, issuer, audience e expiração, e rejeitar o que falhar.",
          "A revogação é o ponto fraco: um JWT válido continua válido até expirar, então os tempos de vida devem ser curtos.",
          "As instâncias de access token management definem os claims, o algoritmo de assinatura e o tempo de vida.",
          "Publique as chaves via JWKS, para que os resource servers acompanhem a rotação sem coordenação manual.",
        ],
        // PFAA-001.6.22 Configure attribute mapping for ROPC grant type
        "PFAA-001.6.22": [
          "O grant resource owner password credentials envia a senha do usuário ao client, e é por isso que está descontinuado.",
          "O mapeamento de atributos do ROPC não tem interação com o navegador, então os atributos vêm diretamente do validator e dos data stores.",
          "Onde sistemas legados ainda o exigem, restrinja-o a clients confiáveis específicos.",
          "A boa prática de segurança do RFC 9700 diz explicitamente que o ROPC não deve ser usado; documente o plano de migração.",
          "Trate qualquer client ROPC como um componente de alto valor que manipula credenciais.",
        ],
        // PFAA-001.6.23 Configure attribute mapping for all other grant types
        "PFAA-001.6.23": [
          "Os outros grant types (authorization code, client credentials, device, token exchange) têm cada um sua própria configuração de mapeamento de atributos.",
          "O client credentials não tem usuário, então o mapeamento vem do client, e não de uma pessoa autenticada.",
          "O authorization code mapeia a partir da sessão de autenticação e dos data stores.",
          "O mapeamento determina o que o access token carrega, e é sobre isso que o resource server vai autorizar.",
          "Mapeie só o que o resource server precisa; claims extras são exposição desnecessária e token inchado.",
        ],
        // PFAA-001.6.24 Configure refresh tokens
        "PFAA-001.6.24": [
          "Os refresh tokens permitem que um client obtenha um novo access token sem interação do usuário.",
          "A configuração cobre se os refresh tokens são emitidos, o tempo de vida deles e se mudam a cada uso.",
          "Rotação com detecção de reuso é a postura recomendada para clients públicos: um token reaproveitado invalida a cadeia.",
          "Os refresh tokens dependem dos persistent grants, então o armazenamento e o tempo de vida dos grants os governam.",
          "Um refresh token de vida longa é uma credencial de vida longa e deve ser protegido como tal.",
        ],
        // PFAA-001.6.25 Configure OIDC policies
        "PFAA-001.6.25": [
          "As OIDC policies definem quais atributos viram claims no ID token e no endpoint userinfo.",
          "Uma policy é associada aos clients e pode variar por client, então aplicações diferentes recebem claims diferentes.",
          "As fontes de atributos e o preenchimento por OGNL funcionam do mesmo jeito que nas conexões SAML.",
          "Inclua só os claims necessários; o ID token é visível para o client e muitas vezes registrado em log por ele.",
          "A policy é onde o contrato de identidade com a aplicação é de fato definido.",
        ],
        // PFAA-001.6.26 Configure OIDC attribute scopes
        "PFAA-001.6.26": [
          "Os attribute scopes associam claims aos scopes pedidos, para que um client receba claims extras só quando pedir e tiver permissão.",
          "Isso implementa a minimização de dados: o scope profile traz os claims de perfil e, por padrão, nada mais.",
          "O mapeamento entre o scope e o conjunto de claims é configurado na OIDC policy.",
          "As telas de consentimento devem refletir o que cada scope de fato revela.",
          "Revise o mapeamento de scope para claim ao acrescentar claims, ou haverá vazamento de dados por um scope existente.",
        ],
        // PFAA-001.6.27 Configure an external LDAP database
        "PFAA-001.6.27": [
          "Um data store LDAP externo é configurado com URLs de conexão, credenciais de bind e configurações do pool de conexões.",
          "Use LDAPS ou StartTLS; a credencial de bind trafega em toda conexão.",
          "A conta de serviço deve ter só os direitos de leitura de que precisa, mais direitos de gravação apenas se o autoatendimento os exigir.",
          "O dimensionamento do pool de conexões e os timeouts afetam de forma concreta a latência da autenticação sob carga.",
          "Vários hostnames dão failover; teste-o em vez de presumir.",
        ],
        // PFAA-001.6.28 Manage certificates
        "PFAA-001.6.28": [
          "A gestão de certificados cobre os certificados de assinatura, os certificados SSL de servidor e os certificados confiáveis dos parceiros.",
          "Os certificados de assinatura aparecem nos metadados e precisam de rotação coordenada com os parceiros.",
          "Os certificados SSL de servidor protegem as portas de runtime e de admin e são separados das chaves de assinatura.",
          "Importe os certificados dos parceiros no contexto de confiança correto; um certificado no store errado não faz nada.",
          "Acompanhe o vencimento de cada certificado da instalação; o vencimento é a indisponibilidade de federação mais comum.",
        ],
        // PFAA-001.6.29 Manage certificate authorities (CAs)
        "PFAA-001.6.29": [
          "As certificate authorities no trust store determinam quais certificados de parceiros e de backends são aceitos.",
          "Importar uma CA confia em tudo o que ela emite, então o trust store deve ser curado, e não preenchido com padrões.",
          "Separe as âncoras de confiança por finalidade onde o produto permitir.",
          "Os certificados intermediários precisam estar presentes para que a validação da cadeia dê certo.",
          "Revise o trust store periodicamente; uma CA desnecessária é um risco desnecessário.",
        ],
      },
    },
  },
  // POE-001: Certified Expert - PingOne.
  "ping-ce-pingone": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "Não informado na página oficial da prova",
      passMark: "Não informada na página oficial da prova",
      cost: "EUR 460 / GBP 390 / USD 495 (pode haver imposto regional); cada voucher vale para uma única tentativa",
      note: "Valida conhecimento avançado da plataforma PingOne e a capacidade de gerenciar soluções e implementar casos de uso. Cada código de voucher vale para uma única tentativa de prova.",
    },
    // Key points: this site's study notes, translated objective by objective in the English order.
    keyPoints: {
      // Site-authored notes, so translated.
      rule: "site-notes",
      // Objective id -> translated points.
      byObjective: {
        // POE-001.1.01 Determine services required for specific use cases.
        "POE-001.1.01": [
          "A plataforma PingOne é um cardápio de serviços: SSO, MFA, DaVinci, Authorize, Verify, Credentials, Protect e, por baixo, o Directory.",
          "A prova trabalha com o mapeamento de cenário para serviço: identity proofing significa Verify, credenciais verificáveis significam Credentials, sinais de risco significam Protect, orquestração significa DaVinci.",
          "Os serviços são ativados por ambiente, então \"qual serviço\" e \"em qual ambiente\" são, na prática, uma única pergunta.",
          "Licenciamento e entitlement controlam o que aparece no console: um serviço ausente muitas vezes é questão de entitlement, e não um bug.",
        ],
        // POE-001.1.02 Determine the correct method to incorporate identity verification into a use case.
        "POE-001.1.02": [
          "O PingOne Verify faz a captura do documento e a comparação de liveness/selfie para provar que uma pessoa real corresponde a um documento real.",
          "A verificação é chamada a partir de um flow do DaVinci ou via API e devolve um status de verificação pelo qual o flow ramifica.",
          "Pontos de uso comuns: onboarding/cadastro, recuperação de alto risco e step-up antes de uma transação sensível.",
          "Decida o que acontece na falha e na revisão manual antes de desenhar o caminho feliz.",
        ],
        // POE-001.1.03 Determine the correct method to manage PingOne Credentials.
        "POE-001.1.03": [
          "O Credentials emite e gerencia credenciais digitais verificáveis em uma wallet; o ciclo de vida é emitir, apresentar, verificar, revogar.",
          "Os tipos de credencial definem o schema dos claims carregados; a emissão normalmente parte de um flow depois do identity proofing.",
          "Revogação e vencimento são cidadãos de primeira classe: um desenho de credencial sem uma história de revogação está incompleto.",
          "Combinar com o Verify é o padrão canônico: prove a identidade uma vez e depois emita uma credencial reutilizável.",
        ],
        // POE-001.1.04 Identify standards used by PingOne Credentials.
        "POE-001.1.04": [
          "As famílias relevantes são as W3C Verifiable Credentials e os Decentralized Identifiers (DIDs), além dos protocolos de apresentação pela wallet.",
          "Conheça os papéis do modelo (issuer, holder e verifier) e qual peça do PingOne faz cada um.",
          "A assinatura criptográfica do issuer é o que torna uma credencial verificável sem consultar o issuer de novo.",
          "A divulgação seletiva é o argumento de privacidade de todo o modelo: apresente o claim, não o documento.",
        ],
        // POE-001.1.05 Identify verification types and methods used by PingOne Verify.
        "POE-001.1.05": [
          "Captura de documento oficial de identidade, comparação facial com liveness e verificações de apoio, como a posse de um e-mail ou telefone.",
          "A detecção de liveness protege contra a foto de uma foto; é a diferença entre comparar uma selfie e fazer um proofing de verdade.",
          "Cada método tem uma policy de configuração que controla o rigor e as novas tentativas.",
          "Escolha o método conforme o risco: nem toda journey precisa de proofing por documento.",
        ],
        // POE-001.1.06 Determine the correct method to manage the Directory attributes in PingOne.
        "POE-001.1.06": [
          "O PingOne Directory tem atributos padrão e atributos personalizados que você define por ambiente.",
          "Tipos de atributo, tratamento de múltiplos valores e restrições de unicidade são as decisões de configuração.",
          "A participação em populations e o filtro por atributos definem quem vê o quê.",
          "Mudanças no schema se propagam para flows, policies e provisionamento: planeje o raio de impacto antes de editar.",
        ],
        // POE-001.2.01 Explain how to manage sessions in PingOne.
        "POE-001.2.01": [
          "Tempo de vida da sessão, idle timeout e se a sessão é lembrada entre aplicações são configurações de policy.",
          "Sair de uma aplicação não é necessariamente sair do PingOne: saiba a diferença e como forçar as duas coisas.",
          "Os dados de sessão são a base do SSO; uma experiência de SSO quebrada normalmente é um problema de cookie ou de domínio.",
        ],
        // POE-001.2.02 Determine the correct method to configure policies in PingOne.
        "POE-001.2.02": [
          "As authentication policies são etapas ordenadas: login, MFA, agreements, progressive profiling e flows do DaVinci podem ser etapas.",
          "As policies se ligam às aplicações, então o mesmo tenant pode apresentar journeys diferentes para cada app.",
          "A ordem importa: a primeira etapa correspondente que atende ao requisito encerra a avaliação.",
        ],
        // POE-001.2.03 Determine the correct method to configure applications.
        "POE-001.2.03": [
          "O tipo de aplicação define o protocolo e o grant: web app, single-page app, nativa, serviço e worker.",
          "Redirect URIs, grant types e configurações de token são os campos que quebram integrações quando estão errados.",
          "Atribua uma authentication policy e os resource scopes que a aplicação pode solicitar.",
        ],
        // POE-001.2.04 Determine the correct method to configure integrations.
        "POE-001.2.04": [
          "O Application Catalog oferece integrações SAML/OIDC prontas para os destinos SaaS mais comuns.",
          "As integrações de provisionamento enviam usuários para fora; as integrações de SSO apenas autenticam.",
          "Quando não há entrada no catálogo, monte manualmente uma aplicação SAML ou OIDC genérica.",
        ],
        // POE-001.2.05 Determine the correct method to manage PingID in PingOne.
        "POE-001.2.05": [
          "O PingID é o serviço de MFA com seu próprio cadastro de dispositivos, policies e métodos de pareamento.",
          "Conheça a história de migração e coexistência entre o PingID e o PingOne MFA em um ambiente híbrido.",
          "A gestão de dispositivos e o despareamento administrativo são operações de suporte de rotina.",
        ],
        // POE-001.2.06 Explain how to manage PingOne multi-factor authentication (MFA).
        "POE-001.2.06": [
          "Os métodos incluem apps autenticadores TOTP, push, SMS/voz, e-mail, chaves de segurança FIDO2/WebAuthn e biometria.",
          "As MFA policies decidem quais métodos são permitidos e em que ordem são oferecidos.",
          "Cadastro de dispositivos, limites de dispositivos e caminhos de recuperação fazem parte de um desenho completo.",
          "Combinar o MFA com o risco (Protect) é o que torna o step-up condicional, e não constante.",
        ],
        // POE-001.3.01 Determine the correct method to configure and write PingOne Authorize policies.
        "POE-001.3.01": [
          "O Authorize é autorização externalizada e baseada em atributos: policies, rules e decision endpoints.",
          "As policies se compõem de condições sobre atributos tirados da requisição, da identidade e de dados externos.",
          "Os combining algorithms decidem o resultado quando várias regras se aplicam: permit-overrides ou deny-overrides.",
          "Teste com o decision endpoint e leia o decision trace; o trace explica o porquê, e não só o quê.",
        ],
        // POE-001.3.02 Determine enforcement decisions for API gateways using PingOne Authorize.
        "POE-001.3.02": [
          "O gateway pergunta; o Authorize decide. O gateway aplica o permit/deny devolvido e as eventuais obligations.",
          "A autorização fina de APIs vai além dos scopes, chegando a decisões por resource e por atributo.",
          "O orçamento de latência importa: faça cache do que pode ser guardado com segurança e mantenha curto o caminho da decisão.",
        ],
        // POE-001.3.03 Determine the correct application of PingOne roles.
        "POE-001.3.03": [
          "Os papéis administrativos (Environment Admin, Identity Data Admin, Client Application Developer, Organization Admin) delimitam o que um administrador pode fazer.",
          "Os papéis são concedidos no escopo da organização ou do ambiente: o escopo é tão importante quanto o papel.",
          "O menor privilégio também vale para administradores; a prova espera o papel mais restrito que resolve a tarefa.",
        ],
        // POE-001.4.01 Determine the proper utilization of PingOne DaVinci flows.
        "POE-001.4.01": [
          "O DaVinci é a camada de orquestração: cadastro, recuperação, progressive profiling e qualquer journey que a policy padrão não consegue expressar.",
          "Os flows são compostos de connectors e são versionados; uma flow policy expõe uma versão específica a uma aplicação.",
          "Os subflows mantêm journeys grandes administráveis e reutilizáveis.",
        ],
        // POE-001.4.02 Determine the correct method to integrate DaVinci flows into PingOne policy.
        "POE-001.4.02": [
          "Um flow do DaVinci vira uma etapa dentro de uma authentication policy do PingOne, e assim o flow roda como parte do login.",
          "A flow policy é o contrato entre o PingOne e o DaVinci: aponte a etapa da policy para a flow policy certa.",
          "Devolver o status de conclusão esperado é o que permite ao PingOne continuar a cadeia da policy.",
        ],
        // POE-001.5.01 Identify use cases for PingOne Protect.
        "POE-001.5.01": [
          "O Protect calcula o risco em tempo real para que a autenticação seja adaptativa, e não uniformemente rígida.",
          "Usos típicos: dispensar o MFA em logins de baixo risco, exigir step-up diante de anomalias e bloquear credential stuffing ou tráfego de bots.",
          "O risco é um sinal para a decisão de uma policy ou de um flow, nunca uma decisão por si só.",
        ],
        // POE-001.5.02 Identify the capabilities of predictors.
        "POE-001.5.02": [
          "Os predictors são os sinais de risco individuais: reputação de IP, viagem impossível, velocidade anômala, detecção de bots, dispositivo novo e modelos baseados no usuário.",
          "Cada predictor emite uma pontuação ou um nível; a risk policy os combina em um resultado geral.",
          "Predictors personalizados permitem alimentar o mesmo modelo com sinais específicos da organização.",
        ],
        // POE-001.5.03 Determine the correct method to configure risk policies.
        "POE-001.5.03": [
          "Uma risk policy pondera os predictors e associa o resultado combinado aos níveis de risco baixo, médio ou alto.",
          "Os limites são onde se faz o ajuste: mova-os com base nas distribuições observadas, e não na intuição.",
          "As policies se ligam a aplicações e flows, então apps diferentes podem tolerar riscos diferentes.",
        ],
        // POE-001.5.04 Analyze and evaluate dashboard results to tune risk policies.
        "POE-001.5.04": [
          "O dashboard mostra as distribuições de pontuação e a contribuição de cada predictor sobre o tráfego real.",
          "O ajuste é um ciclo: observe falsos positivos e negativos, ajuste pesos ou limites e observe de novo.",
          "Cuidado ao ajustar com uma janela curta demais: a sazonalidade semanal é real no tráfego de login.",
        ],
        // POE-001.6.01 Given a scenario, determine the correct method to troubleshoot using audit logs and dashboards.
        "POE-001.6.01": [
          "Os audit logs registram eventos de autenticação, administrativos e de API por ambiente.",
          "Filtre pelo correlation ID para acompanhar a journey de um usuário de ponta a ponta, em vez de ler ruído.",
          "Os dashboards resumem; os audit logs explicam. Comece amplo e depois afunile até o evento que falha.",
          "Exporte ou envie os logs a um SIEM externo quando a janela de retenção não for suficiente.",
        ],
        // POE-001.6.02 Given a scenario, determine what to look for in analytics to troubleshoot DaVinci.
        "POE-001.6.02": [
          "O analytics do DaVinci mostra as execuções dos flows, os resultados por nó e onde as execuções terminam.",
          "Um flow que falha em um nó específico aponta para a configuração daquele connector ou para a dependência externa dele.",
          "Compare uma execução bem-sucedida com uma que falha: o ponto de divergência é o bug.",
          "Confira a versão do flow e qual versão a flow policy de fato publica; o desvio de versão é um falso alarme clássico.",
        ],
      },
    },
  },
  // PAICE-001: Certified Expert - PingOne Advanced Identity Cloud Exam.
  "ping-ce-pingone-aic": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "70",
      passMark: "61,66%",
      cost: "EUR 460 / GBP 390 / USD 495 (pode haver imposto regional); cada voucher vale para uma única tentativa",
      note: "Supervisionada remotamente (segundo o guia oficial de aplicação de provas). Cada código de voucher vale para uma única tentativa de prova; depois de resgatado, não pode ser reutilizado.",
    },
    // Key points: this site's study notes, translated objective by objective in the English order.
    keyPoints: {
      // Site-authored notes, so translated.
      rule: "site-notes",
      // Objective id -> translated points.
      byObjective: {
        // PAICE-001.1.01 Configure promotions and rollback.
        "PAICE-001.1.01": [
          "Os tenants do Advanced Identity Cloud vêm em conjunto (desenvolvimento, staging, produção), e a configuração passa de um para outro por promoção.",
          "A promoção leva só configuração: journeys, scripts, ESVs e configurações de serviço passam; dados de identidade não.",
          "Rode primeiro o promotion report: é o ensaio que mostra o que mudaria.",
          "O rollback restaura o estado promovido anterior; conheça os limites dele e por que um ambiente inferior testado importa mais que o botão de rollback.",
        ],
        // PAICE-001.1.02 Create and integrate environment secrets and variables (ESVs).
        "PAICE-001.1.02": [
          "As ESVs externalizam os valores de cada tenant, para que a mesma configuração promovida funcione em cada ambiente.",
          "As variables carregam valores não secretos; os secrets carregam credenciais e, depois de definidos, só podem ser gravados, nunca lidos.",
          "As ESVs exigem um ciclo de restart/aplicação para valer: um valor alterado não entra em uso até ser aplicado.",
          "Referencie as ESVs nos scripts e na configuração dos serviços pela sintaxe de placeholder, em vez de fixar os valores no código.",
        ],
        // PAICE-001.1.03 Configure and troubleshoot custom domains and certificates.
        "PAICE-001.1.03": [
          "Um domínio personalizado substitui o hostname do fabricante na experiência de login; ele exige registros DNS e um certificado.",
          "Cadeia de certificados completa e vencimento são os dois modos de falha a verificar primeiro.",
          "Mudar o domínio muda o escopo dos cookies e todas as redirect URIs registradas: atualize também as aplicações.",
          "Valide com uma verificação TLS externa, e não só pelo navegador, para pegar intermediários ausentes.",
        ],
        // PAICE-001.1.04 Demonstrate proper security hardening.
        "PAICE-001.1.04": [
          "Restrinja o acesso administrativo, exija MFA dos administradores e elimine API keys e contas de serviço que não são usadas.",
          "Revise CORS, CSP e as configurações de cookie nas páginas hospedadas como parte do hardening, e não como tarefa à parte.",
          "Dê aos clients OAuth um escopo estreito e faça a rotação dos secrets em um calendário.",
          "Siga o checklist de hardening de tenant do fabricante para a release atual: as orientações de hardening em cloud mudam com mais frequência que as on-premises.",
        ],
        // PAICE-001.1.05 Configure and troubleshoot federated access for tenant administration.
        "PAICE-001.1.05": [
          "Os próprios administradores podem entrar por federação a partir de um IdP corporativo, em vez de usar contas locais.",
          "Mapeie grupos ou claims do IdP para os papéis administrativos do tenant.",
          "Mantenha documentado um caminho de administrador local de emergência para quando a própria federação quebrar.",
        ],
        // PAICE-001.2.01 Set up delegated administration for identity management.
        "PAICE-001.2.01": [
          "A administração delegada concede direitos administrativos com escopo sobre um subconjunto de identidades, normalmente por organização.",
          "A atribuição de privilégios define quais objetos e quais operações um administrador delegado pode tratar.",
          "Teste como o administrador delegado: o console esconde o que o papel não pode fazer, e é justamente essa a ideia.",
        ],
        // PAICE-001.2.02 Extend IDM functionality through customization.
        "PAICE-001.2.02": [
          "Scripts (JavaScript ou Groovy no servidor) se ligam a eventos como onCreate, onUpdate e onSync.",
          "Endpoints personalizados expõem lógica sob medida via REST quando nenhum endpoint pronto serve.",
          "Mantenha a customização mínima e promovível; customização pesada é o que torna os upgrades dolorosos.",
        ],
        // PAICE-001.2.03 Configure data synchronization through connectors and mappings.
        "PAICE-001.2.03": [
          "Os connectors conversam com sistemas externos; os mapeamentos definem a tradução de atributos e o sentido da sincronização.",
          "A reconciliação compara conjuntos de dados completos; o LiveSync consome change logs incrementais.",
          "Situations e actions (ABSENT, FOUND, MISSING, UNQUALIFIED) são a tabela de decisão de qualquer mapeamento.",
          "As correlation queries decidem o que conta como \"a mesma pessoa\" entre sistemas: é a escolha de design de maior valor.",
        ],
        // PAICE-001.2.04 Determine appropriate organizational-based configurations.
        "PAICE-001.2.04": [
          "As organizations modelam tenants dentro de um tenant: agrupamentos hierárquicos de identidades com seus próprios administradores.",
          "A participação define o escopo da administração delegada e pode orientar o comportamento das journeys.",
          "Modele a árvore de organizações conforme a fronteira administrativa real, e não o organograma do marketing.",
        ],
        // PAICE-001.2.05 Apply best practices for remote connector server (RCS) deployment.
        "PAICE-001.2.05": [
          "O RCS roda dentro da rede do cliente, para que o tenant em cloud alcance sistemas on-premises sem abrir brechas de entrada no firewall.",
          "O RCS inicia a conexão de saída; dimensionamento e alta disponibilidade significam rodar mais de um.",
          "As bibliotecas de connector são instaladas no RCS, e a compatibilidade de versão com o tenant importa.",
          "Monitore se o RCS está vivo: um RCS silencioso parece exatamente um sistema de origem vazio.",
        ],
        // PAICE-001.3.01 Design and build journeys using out-of-the-box (OOTB) capabilities.
        "PAICE-001.3.01": [
          "Journeys são o nome, na cloud, das authentication trees: nós, resultados e shared state.",
          "Os nós prontos cobrem login, MFA, federação com identity providers, progressive profiling e consentimento.",
          "Comece de uma journey padrão e modifique-a, em vez de construir a partir de uma tela vazia.",
        ],
        // PAICE-001.3.02 Manage, maintain, and troubleshoot journeys.
        "PAICE-001.3.02": [
          "As journeys são artefatos versionados, promovidos entre ambientes como qualquer outra configuração.",
          "Depure com a visão de execução da própria journey e com os logs do tenant filtrados pelo transaction ID.",
          "Uma journey que funciona em desenvolvimento e falha em produção normalmente depende de uma ESV ou de um connector que difere.",
        ],
        // PAICE-001.3.03 Extend journey functionality through customization.
        "PAICE-001.3.03": [
          "Os scripted decision nodes carregam a lógica personalizada; mantenha-os pequenos e testáveis isoladamente.",
          "Nós personalizados e páginas com tema estendem a aparência e o comportamento além do padrão.",
          "Tudo o que um script alcança (API externa, secret) precisa existir em cada ambiente para onde a journey é promovida.",
        ],
        // PAICE-001.4.01 Configure federation and single sign-on (SSO).
        "PAICE-001.4.01": [
          "O tenant pode atuar como IdP ou SP via SAML2 e OIDC; a configuração de provedores hospedados e remotos espelha a do PingAM on-premises.",
          "Circle of trust, metadados e mapeamento de atributos são as mesmas três preocupações, com roupa de cloud.",
          "A sessão e o domínio do cookie determinam se o SSO de fato parece transparente para o usuário.",
        ],
        // PAICE-001.4.02 Secure hosted pages with Content Security Policy.
        "PAICE-001.4.02": [
          "A CSP restringe de quais fontes de script, de estilo e de frame as páginas de login hospedadas podem carregar conteúdo.",
          "Temas personalizados que puxam fontes tipográficas externas ou analytics precisam dessas origens liberadas explicitamente.",
          "Comece em modo report-only, leia as violações e depois aplique.",
        ],
        // PAICE-001.4.03 Configure CORS for integration with custom applications.
        "PAICE-001.4.03": [
          "A configuração de CORS lista as origens autorizadas a chamar os endpoints do tenant a partir de um navegador.",
          "Inclua os métodos e headers que a aplicação de fato envia, e permita credenciais só quando necessário.",
          "Uma integração de single-page application que falha é um problema de CORS muito mais vezes do que um problema de autenticação.",
        ],
        // PAICE-001.4.04 Configure OAuth2 and OpenID Connect (OIDC) integration with applications.
        "PAICE-001.4.04": [
          "Registre a aplicação como client OAuth2 com o tipo, os grants, as redirect URIs e os scopes certos.",
          "Authorization code com PKCE é o padrão esperado para clients de navegador e nativos.",
          "O mapeamento de scope para claim e o tempo de vida dos tokens são configurados no OAuth2 provider service.",
        ],
        // PAICE-001.5.01 Configure, manage, and monitor tenant configuration.
        "PAICE-001.5.01": [
          "A configuração do tenant é consultada e alterada pelo console administrativo e pela API REST.",
          "Acompanhe o desvio de configuração entre ambientes: os promotion reports são a trilha de auditoria.",
          "Monitore o status do tenant e as janelas de manutenção anunciadas como parte da operação de rotina.",
        ],
        // PAICE-001.5.02 Configure log streaming from Advanced Identity Cloud to external monitoring tools.
        "PAICE-001.5.02": [
          "O log streaming envia continuamente os logs do tenant para um SIEM externo ou uma plataforma de observabilidade.",
          "Escolha as fontes de log de propósito: autenticação, atividade do IDM e access logs têm volumes muito diferentes.",
          "O streaming evita o limite de retenção dos logs dentro do tenant, que é o motivo habitual para configurá-lo.",
        ],
        // PAICE-001.5.03 Configure log extraction.
        "PAICE-001.5.03": [
          "A API de logs extrai logs sob demanda, por fonte e janela de tempo, usando um par de API keys.",
          "A extração é paginada e tem limite de taxa; coletas por script precisam tratar as duas coisas.",
          "Use a extração para a análise forense de incidentes e o streaming para o monitoramento contínuo.",
        ],
        // PAICE-001.5.04 Interpret and troubleshoot issues using logs.
        "PAICE-001.5.04": [
          "Correlacione pelo transaction ID entre as fontes de log de autenticação, do IDM e de acesso para reconstruir uma requisição.",
          "Distinga falhas causadas pelo usuário (credenciais erradas) de falhas da plataforma (timeouts de connector) antes de escalar.",
          "A primeira linha de log que difere de uma execução que funciona é a que importa.",
        ],
        // PAICE-001.5.05 Configure and troubleshoot the platform using REST.
        "PAICE-001.5.05": [
          "Quase toda ação do console tem um equivalente REST: a API é a superfície de automação e de depuração.",
          "Autentique as chamadas de API com um token de administrador ou um par de API keys, com o escopo mais estreito que a tarefa permitir.",
          "Reproduzir uma falha com uma chamada REST direta tira o console e o navegador da equação.",
        ],
      },
    },
  },
  // PAP-001: Certified Professional - PingAccess.
  "ping-cp-pingaccess": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "70 questões de múltipla escolha",
      passMark: "64%",
      cost: "USD 395, comprado pelo Ping Identity Certification Center (pode haver imposto regional); cada voucher vale para uma única tentativa",
      note: "Supervisionada pela Kryterion (remotamente ou em um centro de testes). Credencial válida por 3 anos. Valida a instalação e a configuração básicas do PingAccess. Treinamento oficial recomendado: Introduction to PingAccess; Getting Started With PingAccess; PingAccess Administration Training.",
    },
    // Key points: this site's study notes, translated objective by objective in the English order.
    keyPoints: {
      // Site-authored notes, so translated.
      rule: "site-notes",
      // Objectives whose key points are the vendor's verbatim sub-items: kept English.
      keepEnglish: ["6.01"],
      // Objective id -> translated points.
      byObjective: {
        // 1.01 Describe the product’s features, functionality, and basic use cases.
        "1.01": [
          "Modelo de gateway e de agent, ciente da identidade, para aplicações web e APIs",
          "Policy centralizada: controle de acesso no nível da URL depois da autenticação",
          "Trabalha com o PingFederate ou o PingOne como provedor de tokens e de identidade",
          "Formatos de implantação: gateway (reverse proxy) ou agent (dentro do servidor web)",
        ],
        // 1.02 Describe the use cases for integration with other Ping products.
        "1.02": [
          "PingFederate como provedor OIDC e emissor de tokens",
          "PingOne como provedor de tokens em cloud",
          "Modo sideband/API ao lado do web access management",
          "Onde o PingAccess termina e o provedor começa: a autenticação acontece upstream",
        ],
        // 2.01 Outline the installation requirements.
        "2.01": [
          "Matriz de suporte de runtime Java e de sistema operacional",
          "Portas: 3000 admin, 3030 engine (padrões), listeners configuráveis",
          "Dimensionamento: os engines escalam horizontalmente, o console continua único",
        ],
        // 2.02 Explain how to install and remove the product using command-line and graphical installation tools.
        "2.02": [
          "Instalador por linha de comando e registro como serviço",
          "Instalador gráfico para instalações interativas",
          "Remoção limpa: serviços, arquivos e artefatos de licença",
        ],
        // 2.03 Demonstrate an understanding of how to set and obfuscate configuration database passwords.
        "2.03": [
          "O utilitário obfuscate protege os valores sensíveis do run.properties",
          "O prefixo OBF: marca valores ofuscados (NÃO cifrados)",
          "Gere a ofuscação de novo depois de trocar de host: ela é atrelada ao host",
        ],
        // 2.04 Define the purpose of specified run.properties configuration entries.
        "2.04": [
          "Entradas admin.port / clusterconfig.* / de listener do engine",
          "pa.operational.mode: STANDALONE, CLUSTERED_CONSOLE, CLUSTERED_CONSOLE_REPLICA, CLUSTERED_ENGINE",
          "As mudanças valem ao reiniciar apenas aquele nó",
        ],
        // 2.05 Explain the elements and basic configuration of an on-premise PingAccess cluster.
        "2.05": [
          "Um console administrativo, uma réplica opcional do console, N engines",
          "Os engines buscam a configuração no console pelo canal administrativo",
          "Pares de chaves dos engines e o estado de configuração compartilhado do cluster",
          "Um load balancer fica na frente dos engines; o console serve só para gerenciamento",
        ],
        // 3.01 Explain how to import and manage certificates and certificate groups.
        "3.01": [
          "Key pairs, certificados e certificate groups: a diferença entre eles",
          "Trusted certificate groups: o trust store do Java ou grupos personalizados",
          "Importação de PEM/PKCS#12; rotação sem reiniciar os engines",
        ],
        // 3.02 Explain the ways a certificate can be associated with a virtual host or a listener.
        "3.02": [
          "O vínculo com o virtual host seleciona o certificado apresentado",
          "Os listeners do engine têm seus próprios pares de chaves",
          "Seleção por SNI entre vários virtual hosts",
        ],
        // 3.03 Describe how to use roles in the context of administrator authentication.
        "3.03": [
          "Os papéis Administrator e Auditor no console administrativo",
          "O Auditor é somente leitura por definição",
          "Autenticação de administradores: local, LDAP ou SSO via OIDC no console",
        ],
        // 4.01 Explain the different configuration options used to configure PingAccess to use a token provider.
        "4.01": [
          "Tipos de token provider: runtime do PingFederate, PingOne, OIDC genérico",
          "Introspection ou validação de JWT para os access tokens",
          "Shared secret / client credentials entre o PingAccess e o provedor",
        ],
        // 4.02 Define the OAuth authorization pre-requisites and settings for protecting APIs.
        "4.02": [
          "As aplicações de API validam o access token OAuth a cada requisição",
          "Verificação dos scopes exigidos e da audience no recurso",
          "Semântica de 401 e 403: token ausente ou scope insuficiente",
        ],
        // 4.03 Define the OpenID Connect pre-requisites and settings for protecting web applications.
        "4.03": [
          "As aplicações web passam por um fluxo de login OIDC no provedor",
          "A web session é criada depois da troca do code",
          "Endpoints de redirect/callback reservados pelo PingAccess",
        ],
        // 4.04 Describe the purpose of site authenticators.
        "4.04": [
          "Os site authenticators provam a identidade do PingAccess para o site protegido",
          "Opções: Basic, TLS mútuo e mediação de tokens",
          "Para quando o backend não pode ser alcançado a não ser pelo gateway",
        ],
        // 4.05 Explain how to configure PingAccess to use an agent.
        "4.05": [
          "Modelo de agent: a aplicação da policy acontece dentro do servidor web",
          "O arquivo de propriedades do agent inicializa a conexão com o console",
          "Gateway ou agent, os trade-offs: latência, topologia, terminação TLS",
        ],
        // 4.06 Define the OpenID Connect/OAuth pre-requisites and settings for protecting Web+API applications.
        "4.06": [
          "As aplicações Web+API atendem navegadores E clients com bearer token no mesmo base path",
          "A negociação de conteúdo decide entre o redirect interativo e o desafio 401",
          "Uma aplicação, dois estilos de credencial, um único conjunto de policies",
        ],
        // 5.01 Explain how PingAccess evaluates paths to apply policy and select the appropriate application or res...
        "5.01": [
          "O longest-path match seleciona a aplicação e, depois, o resource",
          "Regras de context root e de diferenciação entre maiúsculas e minúsculas",
          "A ordem dos resources dentro de uma aplicação",
        ],
        // 5.02 Define the purpose of the different types of rules.
        "5.02": [
          "Regras de controle de acesso: exigências de autenticação, faixa de rede, horário, scope/atributo OAuth",
          "Regras de processamento: rewrites, headers, redirects",
          "Critério e ação: o que uma regra testa e o que ela faz",
        ],
        // 5.03 Explain how to configure different rules.
        "5.03": [
          "A configuração fica em cada tipo de regra, com campos tipados",
          "As regras de atributo leem atributos de identidade da sessão ou do token",
          "Tratamento da rejeição: redirect ou template de erro",
        ],
        // 5.04 Explain the usage of rule sets and rule set groups.
        "5.04": [
          "Rule sets: ALL (todas as regras precisam passar) ou ANY (basta uma)",
          "Os rule set groups combinam sets para reuso",
          "Ordem de avaliação e comportamento na primeira falha",
        ],
        // 6.02 Explain the purpose of various PingAccess log files.
        "6.02": [
          "pingaccess.log para o runtime, logs de admin para as ações no console",
          "Audit logs: trilhas do engine e da API administrativa",
          "Configuração do log4j2 e níveis por categoria",
        ],
        // 6.03 Describe the product’s file system structure and important configuration files.
        "6.03": [
          "conf/ guarda o run.properties e os arquivos de bootstrap",
          "data/ contém o banco de dados de configuração e os archives",
          "A organização de upgrade/ e log/ para a operação",
        ],
        // 7.01 Explain the different object types (such as application, virtual host, web session) and how they rel...
        "7.01": [
          "As applications ligam virtual hosts, contextos, sites/agents e web sessions",
          "Os sites descrevem os backends protegidos; os virtual hosts descrevem a porta de entrada",
          "As web sessions definem o cookie voltado ao navegador e a criptografia dele",
        ],
        // 7.02 Explain how to create and manage application resource properties.
        "7.02": [
          "Padrões de caminho dos resources, métodos e policy por resource",
          "Resources anônimos e protegidos dentro da mesma aplicação",
          "Substituições, no nível do resource, dos padrões da aplicação",
        ],
        // 7.03 Explain how to create or manage a web session.
        "7.03": [
          "Tipo de cookie (assinado/cifrado), timeouts de inatividade e máximo",
          "Comportamento de renovação junto ao token provider",
          "Atributos same-site e secure do cookie de sessão",
        ],
        // 7.04 Explain how to configure header-based and JWT identity mappings.
        "7.04": [
          "Os header identity mappings injetam atributos do usuário no backend",
          "Os JWT identity mappings emitem um token assinado para o site",
          "Audience, key pair de assinatura e seleção de atributos",
        ],
        // 7.05 Describe the functionality and how to navigate the administrative console
        "7.05": [
          "Mapa de navegação: Applications, Sites, Rules, Security, Settings",
          "Onde aparecem o status do cluster e a saúde dos engines",
          "Importação e exportação da configuração pelo console",
        ],
      },
    },
  },
  // PT-AM-CPE: Certified Professional - PingAM.
  "ping-cp-pingam": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "100 questões de múltipla escolha",
      passMark: "66%",
      cost: "USD 395, comprado pelo Ping Identity Certification Center (pode haver imposto regional); cada voucher vale para uma única tentativa",
      note: "Supervisionada pela Kryterion. Credencial válida por 3 anos. Valida instalação, configuração, administração, troubleshooting e manutenção do PingAM (antes ForgeRock Access Management). Treinamento oficial recomendado: PingAM Deep Dive; PingAM: Customization and APIs.",
    },
    // Key points: this site's study notes, translated objective by objective in the English order.
    keyPoints: {
      // Site-authored notes, so translated.
      rule: "site-notes",
      // Objective id -> translated points.
      byObjective: {
        // 1.01 Exploring authentication mechanisms
        "1.01": [
          "Authentication journeys (trees) compostas de nós",
          "Os realms dividem a configuração e as identidades",
          "Tipos de nó: collectors, deciders, verifiers",
          "Caminhos de sucesso e de falha, e o aninhamento de inner trees",
        ],
        // 1.02 Protecting a website with PingGateway
        "1.02": [
          "O PingGateway como ponto de aplicação de policy, no papel de reverse proxy",
          "As routes protegem aplicações legadas sem mudar o código",
          "O gateway consome sessões e tokens do AM para liberar o acesso",
        ],
        // 1.03 Controlling access
        "1.03": [
          "Autorização: policy sets, resource types, policies",
          "Subjects, condições de ambiente e response attributes",
          "Decisão de policy pelo endpoint de policies ou pelos agents",
        ],
        // 2.01 Increasing authentication security
        "2.01": [
          "Nós de MFA nas journeys: OATH, push, WebAuthn",
          "Bloqueio de conta e throttling inteligente",
          "Device profiling e marcação de dispositivos confiáveis",
        ],
        // 2.02 Modifying a user’s authentication experience based on context
        "2.02": [
          "Ramificação por contexto: faixa de IP, dispositivo, horário, atributos do usuário",
          "Scripted decision nodes para contextos personalizados",
          "Journeys diferentes por persona ou canal",
        ],
        // 2.03 Checking risk continuously
        "2.03": [
          "Risco contínuo: avaliar no meio da sessão, e não só no login",
          "Autorização transacional para ações sensíveis",
          "Step-up quando o sinal de risco muda",
        ],
        // 3.01 Integrating applications with OAuth 2.0 (OAuth2)
        "3.01": [
          "O AM como authorization server OAuth2 por realm",
          "Registro de clients: confidencial ou público, grants, scopes",
          "Métodos de autenticação no token endpoint; tempo de vida dos tokens",
        ],
        // 3.02 Integrating applications with OpenID Connect (OIDC)
        "3.02": [
          "Provedor OIDC sobre o OAuth2: emissão do id_token",
          "Mapeamento de claims a partir dos atributos de identidade",
          "Endpoints de discovery e JWKS por realm",
        ],
        // 3.03 Authenticating OAuth2 clients and using mutual TLS (mTLS) in OAuth2 for proof-of-possession (PoP)
        "3.03": [
          "Autenticação do client: secret, private_key_jwt, TLS mútuo",
          "Access tokens vinculados a certificado via mTLS (proof-of-possession)",
          "Tokens restritos ao remetente impedem o replay de tokens",
        ],
        // 3.04 Transforming OAuth2 tokens
        "3.04": [
          "Token exchange/transformação entre formatos e audiences",
          "Modificação de tokens por script para ajustar os claims",
          "Quando um sistema seguinte precisa de um token diferente do que o client tem",
        ],
        // 3.05 Implementing social authentication
        "3.05": [
          "Nós de social identity provider nas journeys",
          "Client credentials do provedor e ligação dos redirects",
          "Vinculação de contas a identidades existentes",
        ],
        // 4.01 Implementing single sign-on (SSO) using SAML v2.0 (SAML2)
        "4.01": [
          "O AM como IdP ou SP SAML2; entities e troca de metadados",
          "Chaves de assinatura e de criptografia das assertions",
          "Mapeamento de atributos nas assertions; formatos de NameID",
        ],
        // 4.02 Delegating authentication using SAML2
        "4.02": [
          "Autenticação delegada: o SP repassa a um IdP remoto",
          "Fluxos iniciados pelo SP ou pelo IdP",
          "O circle of trust agrupa os parceiros da federação",
        ],
        // 5.01 Installing and upgrading AM
        "5.01": [
          "Implante o WAR do AM em um servlet container",
          "Configuration stores e identity stores no PingDS",
          "Caminho de upgrade: exportação da configuração, ferramenta amupgrade, ordem das versões",
        ],
        // 5.02 Hardening AM security
        "5.02": [
          "Troque as credenciais padrão do administrador e os nomes de cookies",
          "Restrinja endpoints; cookies seguros; proteções contra CSRF",
          "Secret stores para as chaves, em vez de configuração inline",
        ],
        // 5.03 Clustering AM
        "5.03": [
          "Vários servidores AM atrás de um load balancer por site",
          "Sessões baseadas no CTS tornam as instâncias stateless",
          "Considerações sobre roteamento com afinidade (sticky) ou stateless",
        ],
        // 5.04 Deploying PingOne Advanced Identity Platform to the Cloud
        "5.04": [
          "PingOne Advanced Identity Platform: AM/IDM/DS como cloud gerenciada",
          "Os ambientes de tenant substituem a infraestrutura gerenciada por conta própria",
          "Promoção de configuração como código entre os ambientes do tenant",
        ],
      },
    },
  },
  // PDP-001: Certified Professional - PingDirectory.
  "ping-cp-pingdirectory": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "70 questões de múltipla escolha",
      passMark: "67%",
      cost: "USD 395, comprado pelo Ping Identity Certification Center; cada voucher vale para uma única tentativa",
      note: "Prova supervisionada; sem pré-requisitos. Treinamento oficial recomendado: Introduction to PingDirectory; Getting Started With PingDirectory; PingDirectory Administration Training.",
    },
    // Key points: this site's study notes, translated objective by objective in the English order.
    keyPoints: {
      // Site-authored notes, so translated.
      rule: "site-notes",
      // Objective id -> translated points.
      byObjective: {
        // 1.01 Identify the system requirements.
        "1.01": [
          "Runtime Java 17+ e as bases de sistema operacional suportadas",
          "Ajuste de file descriptors e de vm.max_map_count",
          "Dimensionamento de memória: DB cache ou heap da JVM",
          "Organização de disco para db, logs e changelog",
        ],
        // 1.02 Describe how to install PingDirectory.
        "1.02": [
          "Ferramenta setup: interativa ou não interativa (--cli --no-prompt)",
          "Criação do root DN inicial e da entrada base",
          "Portas dos listeners: LDAP 389/636, HTTPS, JMX",
          "Verificação com dsstatus / status do servidor depois da instalação",
        ],
        // 1.03 Describe the product’s file system structure.
        "1.03": [
          "Organização de bin/ e lib/, config/ e db/",
          "config/config.ldif é gerado: nunca edite à mão",
          "A família logs/: access, errors, config-audit",
          "Os diretórios de trabalho bak/, ldif/ e locks/",
        ],
        // 1.04 Demonstrate how to perform an upgrade of the product.
        "1.04": [
          "Ferramenta update com o novo pacote já no lugar",
          "--serverRoot apontando para a instalação em uso",
          "Suporte a reversão via revert-update",
          "Ordem de upgrade que respeita a replicação (um servidor por vez)",
        ],
        // 1.05 Describe the product’s data storage engine.
        "1.05": [
          "Berkeley DB JE: armazenamento log-structured, só de acréscimo (append-only)",
          "Os backends mapeiam sufixos para bancos de dados (userRoot)",
          "Percentual de DB cache e comportamento do checkpointing",
          "Por que a compactação e a limpeza rodam em threads de segundo plano",
        ],
        // 2.01 Describe the functionality of the administrative console.
        "2.01": [
          "Console administrativo HTTPS servido pelo próprio servidor",
          "O console se autentica como um usuário do diretório com privilégios",
          "Escopos de status, monitoramento e edição da configuração",
          "Quando o console grava, o config-audit.log registra",
        ],
        // 2.02 Describe the use purpose of various command-line utilities included with the product.
        "2.02": [
          "ldapsearch / ldapmodify / ldapdelete para os dados",
          "dsconfig para a configuração, dsreplication para a topologia",
          "import-ldif / export-ldif, backup / restore",
          "collect-support-data, summarize-access-log, status",
        ],
        // 2.03 Describe how to use the dsconfig command and its options to configure the PingDirectory server.
        "2.03": [
          "Modo de menu interativo ou modo batch de comando único",
          "--batch-file para mudanças repetíveis e revisáveis",
          "Por baixo, toda mudança do dsconfig é uma modificação LDAP",
          "Considerações sobre configuração offline e online",
        ],
        // 2.04 Describe how to review configuration changes.
        "2.04": [
          "config-audit.log: cada mudança, com timestamp e o comando que a reverte",
          "Comparação de snapshots do config.ldif ao longo do tempo",
          "Quem mudou o quê: a identidade autenticada fica registrada",
        ],
        // 2.05 Demonstrate how to update server profiles.
        "2.05": [
          "Server profile = diretório versionável de configuração, batches do dsconfig e argumentos de setup",
          "manage-profile generate-profile / replace-profile",
          "O padrão GitOps: profiles no controle de versão",
          "Arquivos de variáveis para as diferenças entre ambientes",
        ],
        // 3.01 Explain how to perform management tasks for entries.
        "3.01": [
          "ldapmodify com change records LDIF (add/modify/delete/modrdn)",
          "Validação do schema em cada gravação",
          "Atributos operacionais: createTimestamp, modifiersName",
          "Recursos de soft-delete e de undelete",
        ],
        // 3.02 Describe different data types and their uses.
        "3.02": [
          "Sintaxes de atributo: DirectoryString, Integer, GeneralizedTime, Boolean, DN",
          "As matching rules orientam a comparação e a indexação",
          "Storage schemes do userPassword e atributos comuns",
          "Atributos binários e transferência ;binary",
        ],
        // 3.03 Describe how to import and export data.
        "3.03": [
          "import-ldif reconstrói o backend (offline, rápido, destrutivo)",
          "export-ldif para exportações completas ou filtradas",
          "Ajuste com --includeBranch / --excludeAttribute",
          "Tratamento de LDIF compactado e cifrado",
        ],
        // 3.04 Describe the use of the make-ldif template.
        "3.04": [
          "Os templates do make-ldif geram dados de exemplo realistas",
          "Variáveis de template, ramos e aleatoriedade por entrada",
          "O example.template incluído como ponto de partida",
          "Massas para teste de carga sem dados de produção",
        ],
        // 3.05 Explain how to create and manage indexes.
        "3.05": [
          "Tipos de índice: equality, presence, substring, ordering, approximate",
          "Buscas não indexadas: quem pode rodá-las e por que elas pesam",
          "rebuild-index depois de criar ou alterar um índice",
          "O index entry limit e o custo quando ele é excedido",
        ],
        // 3.06 Describe the different group types and their uses.
        "3.06": [
          "Grupos estáticos (groupOfNames/member) ou dinâmicos (memberURL)",
          "Os virtual static groups fazem a ponte entre os dois modelos",
          "Participação aninhada e o atributo virtual isMemberOf",
          "Desempenho de grupos em escala: prefira os dinâmicos quando possível",
        ],
        // 4.01 Explain how to enable logging and create retention/rotation policies for logs.
        "4.01": [
          "Log publishers: access, error, audit, configurados de forma independente",
          "Políticas de rotação (tamanho/tempo) e de retenção (quantidade/disco/idade)",
          "Access log filtrado e em formato JSON",
          "Ocultação de atributos sensíveis nos logs",
        ],
        // 4.02 Identify how to install an updated PingDirectory license.
        "4.02": [
          "Licenças instaladas no setup ou por atualização via dsconfig",
          "Os avisos de vencimento aparecem no status e nos logs de erro",
          "O novo arquivo de licença substitui o antigo no mesmo lugar",
        ],
        // 4.03 Define the purpose and use of the collect-support-data and summarize-access-log commands to generate...
        "4.03": [
          "collect-support-data reúne configuração, logs e métricas para o suporte",
          "summarize-access-log transforma o access log bruto em um relatório de desempenho",
          "A caça a buscas não indexadas e a etimes longos começa aqui",
        ],
        // 4.04 Explain how to configure backup/restore for backends manually.
        "4.04": [
          "backup / restore por backend, também online",
          "Backups incrementais sobre uma base completa",
          "Opções de backup cifrado e compactado",
          "Restore em uma topologia replicada: reinicialize depois",
        ],
        // 4.05 Define the purpose of lockdown mode and describe how to enter/exit it.
        "4.05": [
          "Lockdown mode: só usuários root, via loopback, podem fazer bind",
          "Ferramentas enter-lockdown-mode / leave-lockdown-mode",
          "Lockdown automático em erros graves (por exemplo, problemas de schema)",
          "A sala segura para o trabalho de reparo",
        ],
        // 4.06 Describe how to configure replication and define topologies.
        "4.06": [
          "dsreplication enable / initialize entre servidores",
          "A replicação é multi-master, com resolução de conflitos por atributo",
          "O topology registry guarda as relações entre os servidores",
          "Monitoramento: backlog de replicação e generation IDs",
        ],
        // 5.01 Describe how to create, export, or import encryption settings definitions.
        "5.01": [
          "Encryption-settings definitions com uma chave preferida (ativa)",
          "export / import das definitions para compartilhá-las na topologia",
          "O que é cifrado: backends, backups, logs, LDIF",
          "Rotação de chaves: acrescente a nova preferida e mantenha a antiga para leituras",
        ],
        // 5.02 Explain how to create password validators and define policies.
        "5.02": [
          "Password validators: tamanho, conjuntos de caracteres, dicionário, histórico, semelhança",
          "As password policies juntam validators, bloqueio e expiração",
          "Atribuição de policy por usuário via ds-pwp-password-policy-dn",
          "Storage schemes descontinuados e permitidos na migração",
        ],
        // 5.03 Explain how to use the different features to manage accounts and view password and account policy pr...
        "5.03": [
          "manage-account: consulta e operações sobre o estado de uma única conta",
          "Propriedades de estado de senha e de conta: bloqueada, expirada, desativada",
          "Semântica do reset administrativo e da troca pelo próprio usuário",
          "Notificações de status de conta para os sistemas seguintes",
        ],
        // 5.04 Demonstrate knowledge of how root and topology users and privileges are managed.
        "5.04": [
          "Os usuários root ficam em cn=Root DNs,cn=config, e não no userRoot",
          "Os privilégios (bypass-acl, config-write, unindexed-search) são concedidos explicitamente",
          "Os administradores de topologia abrangem toda a topologia replicada",
          "Menor privilégio: contas administrativas por tarefa em vez de um super-root",
        ],
        // 5.05 Describe the usage of certificate stores.
        "5.05": [
          "Key stores e trust stores JKS e PKCS#12 ligados via dsconfig",
          "Key manager providers e trust manager providers",
          "Rotação do certificado do servidor sem indisponibilidade",
          "Configuração de confiança para certificado de cliente (TLS mútuo)",
        ],
        // 6.01 Describe how to configure additional attributes for SCIM.
        "6.01": [
          "O endpoint SCIM 2.0 mapeia atributos do diretório para schemas SCIM",
          "Mapeamentos de atributos personalizados estendem o schema principal de usuário",
          "Resource types e endpoints de schema para descoberta",
        ],
        // 6.02 Describe the purpose and use case for PingDirectoryProxy.
        "6.02": [
          "PingDirectoryProxy: entry balancing, load balancing e failover na frente dos stores",
          "Transformações de proxy e roteamento de requisições",
          "Quando usar o proxy: dados particionados ou backends heterogêneos",
        ],
        // 6.03 Describe the purpose and use case for PingDataSync.
        "6.03": [
          "PingDataSync: sync pipes entre origem e destino",
          "As sync classes mapeiam e transformam atributos em trânsito",
          "Detecção de mudanças em tempo real via changelog",
          "Padrões diretório para diretório e diretório para banco de dados",
        ],
      },
    },
  },
  // PFP-001: Certified Professional - PingFederate.
  "ping-cp-pingfederate": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "70 itens de múltipla escolha (resposta única e múltipla)",
      passMark: "64%",
      cost: "USD 395 / EUR 365 / GBP 310",
      note: "Supervisionada pela Kryterion (online ou em um centro de testes). Credencial válida por 3 anos. Experiência recomendada: 6-12 meses de prática com PingFederate, além dos fundamentos de identidade (SAML, OAuth, LDAP, SCIM, REST, JSON).",
    },
    // Key points: this site's study notes, translated objective by objective in the English order.
    keyPoints: {
      // Site-authored notes, so translated.
      rule: "site-notes",
      // Objective id -> translated points.
      byObjective: {
        // 1.01 Identify installation requirements for the product.
        "1.01": [
          "O PingFederate é uma aplicação Java: exige uma JVM de 64 bits suportada. Confirme sempre as versões exatas de Java na página de requisitos de sistema da versão do PingFederate que você vai usar.",
          "As plataformas suportadas incluem as versões atuais do Windows Server e das distribuições Linux corporativas; o console administrativo funciona nos navegadores desktop mais usados (Chrome, Firefox, Edge, Safari).",
          "Portas padrão: 9999 para o console administrativo e 9031 para o runtime engine (ambas HTTPS, ambas definidas no run.properties). Planeje as regras de firewall para o acesso administrativo, o tráfego de runtime e as chamadas de back-channel para parceiros e data stores.",
          "O dimensionamento separa os papéis: o nó do console é leve; os runtime engines são dimensionados pela carga simultânea de SSO/OAuth. Em produção, roda em cluster: um console e vários engines.",
        ],
        // 1.02 Describe how to install the product on Windows or Linux/UNIX
        "1.02": [
          "O produto é distribuído como um ZIP para todas as plataformas (além de um instalador para Windows): extraia no diretório de instalação, por convenção <pf_install>/pingfederate.",
          "Para iniciar em primeiro plano, use bin/run.sh (Linux/UNIX) ou bin\\run.bat (Windows); em produção, instale como serviço (há scripts de serviço para Windows e integração com o serviço do Linux).",
          "Rode o servidor com uma conta de serviço dedicada, sem privilégios de root, dona da árvore de instalação; nunca como root/Administrator.",
          "A instalação pelo ZIP é autocontida: o produto principal não precisa de banco de dados externo (a configuração fica no sistema de arquivos, e o cluster a replica entre os nós).",
        ],
        // 1.03 Identify tasks completed during the initial configuration wizard.
        "1.03": [
          "O primeiro acesso ao console administrativo (https://<host>:9999/pingfederate/app) abre a configuração inicial: aceitar o contrato de licença e importar o arquivo de licença.",
          "Criar a conta administrativa inicial (o primeiro usuário administrador nativo) e definir a senha dela.",
          "Confirmar a identidade do servidor, sobretudo a base URL de runtime que parceiros e clients OAuth vão usar para chegar a esta instalação.",
          "As versões recentes oferecem uma conexão opcional com o PingOne durante a configuração; uma instalação standalone pode pular essa etapa.",
        ],
        // 1.04 Determine how to upgrade the product.
        "1.04": [
          "O caminho padrão é o Upgrade Utility: instale a nova versão ao lado da antiga e rode o utilitário para copiar configuração, adapters e customizações para a nova instalação (o instalador para Windows também faz upgrade no local).",
          "Leia as release notes e as considerações de upgrade de cada versão atravessada: recursos descontinuados, propriedades renomeadas e requisitos de Java mudam de uma versão para outra.",
          "Tarefas clássicas depois do upgrade: mesclar a configuração de logging customizada (as customizações do log4j2 não são levadas automaticamente), reaplicar as customizações de UI e de templates e testar de novo as integrações.",
          "Em cluster: faça o upgrade primeiro do nó do console administrativo, depois dos engines, e então verifique a replicação.",
        ],
        // 2.01 Describe the locations and functions of different startup files.
        "2.01": [
          "<pf_install>/pingfederate/bin guarda os launchers: run.sh / run.bat iniciam o servidor em primeiro plano; os scripts de serviço os encapsulam para produção.",
          "bin/run.properties é o coração operacional: portas e hostnames administrativos e de runtime, e o modo de operação (standalone ou os papéis de console em cluster e engine em cluster).",
          "bin/jvm-memory.options define o heap do Java e as flags de memória da JVM relacionadas: é este o arquivo a editar para dimensionar memória, não os scripts de inicialização.",
          "O comportamento de logging fica em server/default/conf/log4j2.xml; templates, adapters e integration kits implantados também ficam em server/default/. Saber qual arquivo controla qual comportamento é o foco da prova.",
        ],
        // 2.02 Describe how to set up logging into the administrative console with an LDAP data source.
        "2.02": [
          "A autenticação no console é plugável: as contas nativas são o padrão, e o LDAP (entre outras opções) pode substituí-las no login dos administradores.",
          "A troca é feita no bin/run.properties (a propriedade de autenticação do console seleciona LDAP), e os detalhes do LDAP (referência ao servidor, bases de busca e o mapeamento de grupos do diretório para papéis administrativos) ficam no arquivo ldap.properties que o acompanha.",
          "O ponto central é o mapeamento de papéis: a participação em grupos do diretório define quais papéis administrativos um administrador recebe ao entrar.",
          "É preciso reiniciar o console para a mudança do modo de autenticação valer; tenha em mente um acesso de emergência ao abandonar as contas nativas.",
        ],
        // 2.03 Describe how to install or upgrade the PingFederate license.
        "2.03": [
          "A licença chega como um arquivo enviado pela Ping Identity; a configuração inicial a importa, e as substituições posteriores são importadas na página de licença do console administrativo (sem necessidade de reiniciar quando a importação é pelo console).",
          "A licença também pode ser colocada diretamente no diretório de configuração do servidor quando a instalação é feita por scripts ou automatizada.",
          "O console mostra os detalhes da licença (edição do produto, vencimento), e o servidor avisa quando o vencimento se aproxima; os limites de conexões ou de recursos dependem do tipo de licença.",
          "Upgrades de versão costumam exigir uma licença emitida para a nova versão principal: verifique a validade da licença em todo plano de upgrade.",
        ],
        // 2.04 Describe the use of native accounts in PingFederate or how Role-Based Access Controls are used to ma...
        "2.04": [
          "As contas nativas são criadas e gerenciadas no console administrativo; cada conta recebe um ou mais papéis administrativos, e não acesso irrestrito.",
          "Os papéis a conhecer: User Admin (gerencia as contas de administrador), Admin (alterações de configuração), Expression Admin (pode escrever expressões OGNL, controlado à parte porque expressões executam código), Auditor (somente leitura) e o papel criptográfico, para gestão de chaves e certificados.",
          "Os papéis se combinam: um administrador no dia a dia costuma ter Admin e o que mais a função exigir; o Auditor é exclusivo por natureza (somente leitura).",
          "O mesmo modelo de papéis vale quando a autenticação no console é externa (LDAP/RADIUS/certificado): a identidade externa é mapeada para esses papéis.",
        ],
        // 2.05 Describe how to configure runtime notifications.
        "2.05": [
          "O PingFederate pode avisar os administradores sobre eventos operacionais; vencimento de certificados e eventos de licenciamento são os exemplos clássicos.",
          "O envio passa por notification publishers (o de e-mail via SMTP é o padrão); uma instância de publisher é configurada uma vez e selecionada onde as notificações forem necessárias.",
          "Os avisos de vencimento de certificado são o cenário favorito da prova: configure o publisher e depois ative as notificações, para que certificados de runtime prestes a vencer gerem alerta antes de quebrar os parceiros.",
          "O estado de runtime também pode ser acompanhado pelo endpoint de heartbeat, por sistemas de monitoramento: as notificações cobrem eventos, e o heartbeat cobre a disponibilidade.",
        ],
        // 2.06 Describe how to manage configuration archive creation and retention.
        "2.06": [
          "O configuration archive (data.zip) é a exportação completa da configuração de um servidor: exportação e importação ficam no console administrativo, e importar um archive substitui a configuração inteira.",
          "O PingFederate também tira snapshots da configuração automaticamente quando as mudanças são aplicadas e mantém os archives recentes em disco, no diretório de dados do servidor: é o desfazer embutido.",
          "A retenção desses archives automáticos é configurável; trate os archives como material sensível (eles contêm a configuração, incluindo referências a credenciais) e faça backup deles de acordo.",
          "Os archives são o mecanismo suportado para backup de configuração, migração entre ambientes e recuperação de desastre de um nó.",
        ],
        // 2.07 Describe the server endpoints.
        "2.07": [
          "Duas famílias: endpoints administrativos na porta do console (a aplicação do console administrativo e a API administrativa em /pf-admin-api, com documentação interativa da API) e endpoints de aplicação de runtime na porta do engine.",
          "Os endpoints de aplicação de SSO de runtime ficam em /idp e /sp (startSSO, startSLO e os endpoints de protocolo); os endpoints do authorization server OAuth ficam em /as; o OIDC acrescenta os caminhos de userinfo e de discovery.",
          "O endpoint de heartbeat (/pf/heartbeat.ping) responde na porta de runtime para load balancers e monitoramento.",
          "Saber a que família de porta e caminho um endpoint pertence (administrativo ou runtime) é o foco recorrente da prova.",
        ],
        // 2.08 Describe how to manage SSL certificates, Certificate Authorities, and Certificate Signing Requests.
        "2.08": [
          "O lugar é Security > Certificate & Key Management: certificados SSL de servidor (com ativação separada para o console administrativo e para o runtime), Certificate Authorities confiáveis e as chaves de assinatura e decifração usadas em SAML e OAuth.",
          "O fluxo de CSR: gere um par de chaves no servidor, exporte o Certificate Signing Request, peça à CA que o assine e importe a resposta assinada de volta para a mesma entrada; a chave privada nunca sai do servidor.",
          "As entradas de CA confiáveis é que permitem ao PingFederate validar os certificados apresentados por parceiros e por conexões de back-channel; intermediários ausentes são uma falha de confiança clássica.",
          "Disciplina de rotação: ative os novos certificados antes do vencimento e combine este objetivo com as notificações de runtime (2.05), para que o vencimento nunca chegue sem aviso.",
        ],
        // 2.09 Describe how to configure or manage LDAP and JDBC external data stores.
        "2.09": [
          "Data stores são definições de conexão reutilizáveis, consumidas por credential validators, buscas de atributos e provisionamento: configure uma vez e referencie em todo lugar.",
          "Data stores LDAP: tipo de diretório, uma ou mais entradas de host para failover, credenciais de bind da conta de serviço e opções LDAPS/seguras; o schema do diretório orienta as buscas de atributos depois.",
          "Data stores JDBC: a URL de conexão JDBC, as credenciais e uma validation query; e o JAR do driver JDBC correspondente precisa estar no diretório de bibliotecas do servidor antes que o store consiga conectar.",
          "Failover e teste de conexão fazem parte das definições; em runtime, o comportamento se degrada de forma previsível quando um store cai, e é por isso que as validation queries e os vários hosts LDAP importam.",
        ],
        // 2.10 Determine how to configure Password Credential Validators or any of the following adapters: HTML For...
        "2.10": [
          "Os Password Credential Validators (PCVs) verificam usuário e senha contra uma fonte (o LDAP Username PCV é o mais usado) e são consumidos pelos adapters, não usados diretamente.",
          "HTML Form Adapter: a página de login interativa e personalizada; encadeia um ou mais PCVs e cuida dos recursos clássicos de conta (controle de bloqueio, fluxos de troca e redefinição de senha, lembrar o nome de usuário).",
          "HTTP Basic Adapter: o desafio 401 do navegador, apoiado em um PCV; sem página e sem os recursos de sessão; para APIs e clients legados.",
          "Kerberos Adapter: SSO silencioso no desktop via SPNEGO/IWA; exige os dados do realm e do KDC, além de uma conta de serviço/keytab do lado do PingFederate e da configuração do navegador do lado do cliente.",
          "OpenToken Adapter: o padrão de integration kit; passa a identidade autenticada para uma aplicação (ou a recebe dela) como um OpenToken cifrado, via cookie, query parameter ou POST.",
          "Reference ID Adapter: o padrão sem agente; a aplicação troca com o PingFederate uma referência de curta duração por uma API protegida de back-channel (drop-off/pick-up), em vez de interpretar tokens por conta própria.",
        ],
        // 2.11 Describe the locations, purposes, and logging levels for different PingFederate log files.
        "2.11": [
          "Todos os logs ficam em <pf_install>/pingfederate/log. O elenco: server.log (o log principal da aplicação), admin.log (ações dos administradores no console), admin-api.log (chamadas à API administrativa), transaction.log (resumos das transações de protocolo em runtime), audit.log (eventos de autenticação e de segurança em runtime), provisioner.log, init.log e o log de requisições HTTP.",
          "O acompanhamento de eventos de segurança combina o audit.log (quem se autenticou, como e com qual resultado) com o transaction.log (resumos de protocolo por transação): são os dois a citar para rastrear eventos de segurança e o histórico de transações.",
          "A verbosidade é controlada por logger em server/default/conf/log4j2.xml, com a escala padrão de níveis (TRACE, DEBUG, INFO, WARN, ERROR); o log de transações tem ainda seus próprios modos de detalhe configuráveis.",
          "O hábito operacional que a prova valoriza: ações administrativas se respondem pelo admin.log, perguntas de SSO em runtime pelos logs de audit/transaction, e a saúde do servidor pelo server.log.",
        ],
        // 2.12 Determine how to perform basic configuration of policy trees.
        "2.12": [
          "As authentication policy trees decidem COMO um usuário se autentica: os nós são fontes de autenticação (instâncias de adapter ou IdP connections) e selectors, com ramos Fail e Success fluindo de cima para baixo.",
          "Os selectors ramificam pelo contexto sem autenticar (pela aplicação solicitada, pela faixa de rede, por extended properties e sinais parecidos), de modo que uma única tree pode levar populações diferentes a fontes diferentes.",
          "Um caminho bem-sucedido termina cumprindo um Authentication Policy Contract (APC): o conjunto normalizado de atributos que os mapeamentos seguintes consomem.",
          "Fragmentos reutilizáveis mantêm as trees administráveis: monte uma sequência comum uma vez (por exemplo, login por formulário com segundo fator) e referencie-a em várias policies; a ordem de avaliação das policies e o retorno aos padrões completam o básico.",
        ],
        // 3.01 Explain the difference between mapping attributes at the connection level, the adapter level, and au...
        "3.01": [
          "Três camadas, três funções. Nível do adapter: o attribute contract do adapter declara o que a fonte de autenticação emite (e pode ser estendido com atributos adicionais que o adapter consegue fornecer).",
          "Nível do Authentication Policy Contract (APC): a camada de normalização; qualquer que seja a fonte que autenticou o usuário, a policy cumpre um contrato comum, e a configuração seguinte fica independente da fonte.",
          "Nível da conexão: o cumprimento por parceiro; o attribute contract da SP connection define o que a assertion DESTE parceiro carrega, preenchido a partir dos valores do APC/adapter, de buscas em data stores, de expressões ou de texto fixo.",
          "A consequência de design que a prova explora: faça na conexão o ajuste específico de cada parceiro, mantenha o APC genérico e deixe os adapters sem saber dos parceiros; assim, mudar um parceiro nunca afeta os outros.",
        ],
        // 3.02 Describe the SSO endpoints and variables.
        "3.02": [
          "Os application endpoints iniciam os fluxos: /idp/startSSO.ping começa uma transação de SSO iniciada pelo IdP; /sp/startSSO.ping começa uma iniciada pelo SP. Os equivalentes de SLO são /idp/startSLO.ping e /sp/startSLO.ping.",
          "As variáveis a saber de cor: PartnerSpId (qual SP connection, no início pelo IdP), PartnerIdpId (qual IdP connection, no início pelo SP) e TargetResource (aonde o usuário deve chegar depois do SSO: o deep link).",
          "Os endpoints de protocolo carregam então o próprio SAML: o serviço de SSO do IdP e o Assertion Consumer Service do SP recebem as mensagens de protocolo que os endpoints de início colocam em movimento.",
          "Ler uma URL de início e dizer qual lado inicia, a qual parceiro ela se dirige e aonde o usuário chega é exatamente o uso que a prova faz deste objetivo.",
        ],
        // 3.03 Define the difference between IdP-initiated and SP-initiated connections and when each is used.
        "3.03": [
          "Iniciado pelo IdP: o fluxo começa no identity provider (link de portal, /idp/startSSO.ping) e envia ao SP uma assertion não solicitada; não existe AuthnRequest.",
          "Iniciado pelo SP: o usuário chega primeiro ao service provider; o SP emite um AuthnRequest para o IdP, a autenticação acontece, e a assertion responde a essa requisição específica (com o RelayState preservando o destino).",
          "Quando cada um serve: o iniciado pelo IdP combina com portais de acesso; o iniciado pelo SP combina com favoritos e deep links na aplicação e é obrigatório sempre que o SP faz questão de validar que foi ele quem pediu (muitos SPs só aceitam assertions solicitadas).",
          "O TargetResource nos endpoints de início e o RelayState no protocolo carregam o deep link: o mesmo propósito, em camadas diferentes.",
        ],
        // 4.01 Describe the purpose and use of OAuth Scopes, Token Managers, Clients, and Endpoints.
        "4.01": [
          "Scopes são permissões nomeadas e descritas (mostradas no consentimento): os scopes comuns ficam disponíveis para todos os clients; os exclusivos, só para os clients que os recebem explicitamente.",
          "Os Access Token Managers (ATMs) definem o que um access token É: o Internally Managed Reference emite tokens opacos que o recurso precisa consultar por introspecção; o JSON Web Token manager emite JWTs assinados e autocontidos. O attribute contract do ATM decide o que o token carrega.",
          "Clients são as aplicações registradas: client ID, um método de autenticação para clients confidenciais (secret, JWT com chave privada, TLS mútuo), redirect URIs, os grant types que cada um pode usar e o ATM que emite seus tokens.",
          "Os endpoints do authorization server ficam em /as (authorization, token, introspection e revocation), e saber qual endpoint atende cada etapa de um fluxo é o formato recorrente das questões.",
        ],
        // 4.02 Determine the appropriate usage for different grant types.
        "4.02": [
          "Authorization Code é a resposta padrão para aplicações usadas por pessoas: redirect pelo navegador e code trocado no token endpoint; clients confidenciais autenticam a troca, e clients públicos a protegem com PKCE.",
          "Client Credentials é máquina a máquina: não há usuário, o client se autentica como ele mesmo e recebe um token que representa o client.",
          "Refresh tokens estendem sessões sem nova autenticação e têm políticas de rotação e reuso; o Device Authorization atende dispositivos com entrada limitada, por meio de um user code digitado em uma segunda tela.",
          "Implicit e Resource Owner Password Credentials são a dupla legada: reconheça-os, saiba por que as recomendações atuais os aposentam (tokens no front-channel; senhas manipuladas pelo client) e prefira code com PKCE em qualquer questão de cenário.",
        ],
        // 4.03 Describe how to configure OpenID Connect Policy Management.
        "4.03": [
          "Uma OIDC Policy define o ID token: seu attribute contract (os claims), como cada claim é preenchido a partir do resultado da autenticação e dos data stores, e a inclusão de claims ligados à sessão.",
          "As policies são selecionadas por client (com uma policy padrão para o authorization server), de modo que aplicações diferentes podem receber ID tokens com formatos diferentes do mesmo provedor.",
          "A assinatura do ID token e a identidade do emissor vêm da configuração do servidor OAuth/OIDC sobre a qual a policy funciona: a policy define o conteúdo, e as configurações do servidor definem a confiança.",
          "Os claims padrão (sub, iss, aud, exp, auth_time, nonce) vêm do protocolo; o trabalho da policy são os claims de identidade adicionais que as suas aplicações de fato consomem.",
        ],
        // 4.04 Describe the OpenID Connect endpoints and their purposes.
        "4.04": [
          "Discovery primeiro: /.well-known/openid-configuration publica os metadados do provedor (todos os outros endpoints, os scopes suportados, os response types e os algoritmos de assinatura), para que os clients se configurem sozinhos.",
          "O endpoint UserInfo devolve claims sobre o usuário autenticado a quem apresenta um access token válido; o endpoint JWKS publica as chaves públicas que verificam as assinaturas do ID token (e dos access tokens JWT).",
          "Os endpoints de authorization e de token são compartilhados com o OAuth puro, em /as: o OIDC é OAuth com uma camada de identidade, e o mapa de endpoints mostra exatamente isso.",
          "Foco da prova: associar cada endpoint a quem o consome. Navegadores chamam o authorization; clients chamam o token e o discovery; resource servers chamam o JWKS ou a introspection; e o UserInfo atende o client depois do login.",
        ],
        // 4.05 Describe how to use OpenID Connect for SSO.
        "4.05": [
          "OIDC como protocolo de SSO: a aplicação é um client OAuth (Relying Party), o PingFederate é o OpenID Provider, e o fluxo authorization code devolve um ID token que É a declaração de autenticação.",
          "A sessão no provedor é o que torna o login único: a requisição de autorização da segunda aplicação encontra uma sessão autenticada existente e termina sem novas credenciais.",
          "Disciplina de validação do lado do RP: verificar a assinatura do ID token contra o JWKS, além de issuer, audience, expiração e nonce; é o checklist que torna o ID token confiável.",
          "O PingFederate também pode ficar do outro lado, como relying party diante de um provedor OIDC upstream por meio de uma IdP connection; é assim que o OIDC faz federação do mesmo jeito que as conexões SAML.",
        ],
      },
    },
  },
  // PT-IDM-CPE: Certified Professional - PingIDM.
  "ping-cp-pingidm": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "100 questões de múltipla escolha",
      passMark: "66,00%",
      cost: "USD 395, comprado pelo Ping Identity Certification Center (pode haver imposto regional); cada voucher vale para uma única tentativa",
      note: "Credencial válida por 3 anos. Valida instalação, configuração, administração, troubleshooting e manutenção do PingIDM (antes ForgeRock Identity Management). Treinamento oficial recomendado: PingIDM Deep Dive.",
    },
    // Key points: this site's study notes, translated objective by objective in the English order.
    keyPoints: {
      // Site-authored notes, so translated.
      rule: "site-notes",
      // Objective id -> translated points.
      byObjective: {
        // 1.01 Modeling an identity profile
        "1.01": [
          "O managed.json define o schema dos objetos gerenciados",
          "Propriedades: type, required, searchable, encrypted, virtual",
          "As policies validam os valores na criação e na atualização",
          "Relacionamentos declarados como propriedades (tipos ref)",
        ],
        // 1.02 Querying IDM objects
        "1.02": [
          "Consulta por filtro (_queryFilter), por id ou por named query",
          "Operadores de filtro: eq, co, sw, gt e composição booleana",
          "Parâmetros de campos, tamanho de página e ordenação",
          "Os endpoints de consulta via REST devolvem envelopes de resultado uniformes",
        ],
        // 1.03 Managing relationships
        "1.03": [
          "Os relacionamentos ligam objetos gerenciados (user-role, user-manager)",
          "Referências bidirecionais mantidas consistentes pelo IDM",
          "As propriedades do relacionamento carregam metadados da concessão (por exemplo, temporais)",
          "Consultas reversas percorrem o grafo",
        ],
        // 1.04 Managing organizations
        "1.04": [
          "As organizations modelam unidades de negócio hierárquicas",
          "Owners, admins e members como relacionamentos",
          "O escopo delegado segue a árvore da organização",
          "A participação na organização pode orientar o provisionamento",
        ],
        // 1.05 Delegating administration
        "1.05": [
          "Administração delegada por regras de controle de acesso (access.js)",
          "Escopo por relacionamento, organização ou condição de atributo",
          "Os privilege sets limitam quais propriedades e ações são permitidas",
          "Menor privilégio para o helpdesk, em contraste com o administrador completo",
        ],
        // 2.01 Configuring connectors with the IDM admin UI
        "2.01": [
          "A admin UI configura connectors a partir dos templates de provisioner",
          "Conexão base, credenciais e mapeamentos de tipos de objeto",
          "Teste a conexão antes de ativar",
          "Os mapeamentos de sync referenciam os tipos de objeto do connector",
        ],
        // 2.02 Configuring connectors over REST
        "2.02": [
          "A configuração do connector é um JSON em conf/provisioner.openicf-*.json",
          "Criação e atualização da configuração do connector via REST",
          "Provisionamento por script para CI/CD",
          "O mesmo resultado da UI, versionável no código-fonte",
        ],
        // 3.01 Performing basic synchronization
        "3.01": [
          "A reconciliação compara origem e destino e aplica situations/actions",
          "Situations: ABSENT, MISSING, FOUND, UNQUALIFIED etc.",
          "Os mapeamentos definem o fluxo de atributos da origem para o destino",
          "Recon completa ou direcionada por id",
        ],
        // 3.02 Running selective synchronization and LiveSync
        "3.02": [
          "O LiveSync consulta periodicamente o changelog do connector em busca de deltas",
          "Sincronização seletiva por filtros de consulta no mapeamento",
          "Latência menor que a da recon completa agendada",
          "Quando preferir o LiveSync à reconciliação",
        ],
        // 3.03 Configuring role-based provisioning
        "3.03": [
          "Os roles carregam assignments que concedem entitlements",
          "Participação no role condicional (por consulta) ou manual",
          "Os atributos do assignment vão para o destino no provisionamento",
          "Desprovisionamento quando o role é removido",
        ],
        // 4.01 Deploying and starting a workflow
        "4.01": [
          "Workflows BPMN implantados no engine embutido",
          "Início via REST, pela UI ou por um evento",
          "Filas de tarefas e atribuição a candidatos",
          "As variáveis do processo carregam o contexto da requisição",
        ],
        // 4.02 Deploying and creating a workflow
        "4.02": [
          "Desenhe o BPMN com user tasks, script tasks e gateways",
          "Empacote e implante a definição do processo",
          "Formulários ligados às user tasks para a entrada de dados",
          "Versionamento das definições de processo",
        ],
        // 5.01 Installing IDM
        "5.01": [
          "Descompacte, configure o repositório (JDBC/DS) e inicie pelo script de inicialização",
          "boot.properties e a configuração do resolver",
          "Bootstrap do administrador na primeira execução",
          "Configuração de portas e do keystore TLS",
        ],
        // 5.02 Deploying IDM in a cluster
        "5.02": [
          "Um repositório compartilhado sustenta o estado do cluster",
          "Identidade do nó no cluster e configuração da instância",
          "Coordenação do scheduler para que cada job rode uma vez só",
          "Load balancer na frente dos nós",
        ],
        // 5.03 Managing IDM in a cluster
        "5.03": [
          "Monitoramento da saúde dos nós e da participação no cluster",
          "Propagação da configuração entre os nós",
          "Reinícios escalonados sem indisponibilidade",
          "Comportamento de failover do scheduler",
        ],
        // 5.04 Monitoring and troubleshooting
        "5.04": [
          "Endpoints de saúde e métricas (no estilo Prometheus)",
          "Logs de audit e de recon para troubleshooting",
          "Pontos de falha comuns: credenciais do connector, erros de mapeamento",
          "Níveis de log por logger para o diagnóstico",
        ],
        // 5.05 Implementing explicit mapping
        "5.05": [
          "Mapeamento explícito de atributos ou o padrão/implícito",
          "Scripts de transformação em atributos individuais",
          "Mapeamento condicional e valores padrão",
          "Hooks onCreate/onUpdate no mapeamento",
        ],
        // 5.06 Upgrading IDM
        "5.06": [
          "A ferramenta de upgrade migra a configuração e o schema do repositório",
          "Faça antes o backup de conf/ e do repositório",
          "Revise scripts e mapeamentos personalizados depois do upgrade",
          "Ordene as etapas por versão em um cluster",
        ],
      },
    },
  },
  // POP-001: Certified Professional - PingOne.
  "ping-cp-pingone": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "70 questões de múltipla escolha",
      passMark: "75,00%",
      cost: "USD 395, comprado pelo Ping Identity Certification Center; cada voucher vale para uma única tentativa",
      note: "Prova supervisionada; sem pré-requisitos. Treinamento oficial recomendado: Getting Started With PingOne SSO; Getting Started With PingOne MFA; PingOne Administration.",
    },
    // Key points: this site's study notes, translated objective by objective in the English order.
    keyPoints: {
      // Site-authored notes, so translated.
      rule: "site-notes",
      // Objective id -> translated points.
      byObjective: {
        // 1.01 Describe how to configure the different application types available in PingOne
        "1.01": [
          "Tipos de aplicação OIDC Web App, Native, SPA, Worker e SAML",
          "Redirect URIs, método de autenticação no token endpoint e seleção de grants por tipo",
          "Worker apps: sem contexto de usuário; são clients da API de gerenciamento",
          "Mapeamentos de atributos do diretório para tokens e assertions",
        ],
        // 1.02 Describe the Application Catalog
        "1.02": [
          "Templates prontos para as integrações SaaS mais comuns",
          "As entradas do catálogo preenchem de antemão as configurações de protocolo e os mapeamentos",
          "Aplicações personalizadas quando o catálogo não tem a integração",
        ],
        // 1.03 Describe the Application Portal
        "1.03": [
          "O dock do usuário final com as aplicações atribuídas a ele",
          "Acesso ao portal controlado pela atribuição de grupo ou de population",
          "O branding segue o tema do ambiente",
        ],
        // 1.04 Utilize certificates and keypairs
        "1.04": [
          "Keypairs de assinatura para tokens e assertions SAML",
          "Importação de certificados para verificação e criptografia",
          "Rotação: emita a nova chave e mantenha a antiga durante a janela de validação",
          "Visibilidade do vencimento e alertas para os administradores",
        ],
        // 1.05 Explain the function of resources in PingOne
        "1.05": [
          "Os resources modelam as APIs protegidas e seus scopes",
          "Scopes personalizados anexados aos access tokens",
          "Os valores de audience que o resource server valida",
          "Os embutidos openid/profile e os resources personalizados",
        ],
        // 1.06 Describe how to configure policies in PingOne
        "1.06": [
          "Authentication policies: etapas, condições e resultados",
          "Composição de fator único ou de step-up",
          "Atribuição de policy por aplicação",
          "A policy padrão do ambiente como alternativa final",
        ],
        // 2.01 Describe how to manage users in the PingOne Directory
        "2.01": [
          "Ciclo de vida do usuário: criar, atualizar, desativar, excluir",
          "Estado da senha: definir, forçar a troca, desbloquear",
          "Atributos de identidade e extensão personalizada do schema",
          "Opções de importação em massa e formatos CSV",
        ],
        // 2.02 Manage user groups
        "2.02": [
          "Participação estática gerenciada diretamente",
          "Grupos dinâmicos por expressões de filtro",
          "Os grupos definem o acesso às aplicações e a atribuição de papéis",
          "Estratégia de aninhamento: mantenha plano sempre que possível",
        ],
        // 2.03 Explain the purpose and limitations of populations
        "2.03": [
          "As populations dividem os usuários dentro de um mesmo ambiente",
          "Uma population por usuário: é uma fronteira rígida",
          "Password policies por population",
          "Populations não são grupos: não servem para atribuir aplicações",
        ],
        // 3.01 Describe how to configure MFA policies
        "3.01": [
          "As MFA policies escolhem os métodos permitidos e a ordem entre eles",
          "FIDO2, autenticador TOTP, OTP por SMS/voz/e-mail, push no celular",
          "Limites de dispositivos e regras de pareamento por policy",
        ],
        // 3.02 Describe how to integrate MFA into an authentication policy
        "3.02": [
          "O MFA aparece como uma etapa dentro de uma authentication policy",
          "Step-up condicionado (risco, grupo, aplicação)",
          "Semântica do \"lembrar este dispositivo\" e janelas de bypass",
        ],
        // 3.03 Describe how to manage a user’s MFA device
        "3.03": [
          "Visão administrativa dos dispositivos pareados de um usuário",
          "Desparear/bloquear um dispositivo perdido; o usuário pareia de novo no próximo login",
          "Apelido do dispositivo e metadados de uso",
        ],
        // 3.04 Explain PingOne MFA settings
        "3.04": [
          "Configurações de MFA do ambiente e escolhas por policy",
          "Limites de pareamento, tempo de vida dos OTPs e limites de bloqueio",
          "Templates de notificação que os métodos usam",
        ],
        // 4.01 Explain how to configure administrative roles for environments and organizations
        "4.01": [
          "Escopos de papel: organização ou ambiente",
          "Papéis embutidos: Organization Admin, Environment Admin, Identity Data Admin, Client App Developer",
          "Menor privilégio: restrinja os papéis administrativos a ambientes específicos",
          "Atribuição de papéis a usuários ou a worker applications",
        ],
        // 4.02 Describe how to manage PingOne environments
        "4.02": [
          "O ambiente como unidade de isolamento (sandbox ou produção)",
          "Composição de região, licença e serviços (SSO/MFA/DaVinci)",
          "Propriedades do ambiente, proteção contra exclusão",
        ],
        // 4.03 Describe how to access and collect environment audit logs
        "4.03": [
          "Fluxo de audit log com eventos administrativos e de runtime",
          "Consulta no console com filtros; exportação via API",
          "Padrões de encaminhamento por webhook/SIEM",
        ],
        // 4.04 Describe the different types of alerts available in PingOne
        "4.04": [
          "Alertas de vencimento de certificado, de licença e de eventos de chaves",
          "Envio para os e-mails de administradores configurados",
          "Agir antes do vencimento: combine os alertas com a rotação de keypairs",
        ],
        // 4.05 Describe how to configure custom domains and email trust
        "4.05": [
          "Domínio personalizado (CNAME) para os endpoints de autenticação",
          "Provisionamento de certificado para o domínio personalizado",
          "Confiança de e-mail: verificação do domínio de envio (alinhamento SPF/DKIM)",
        ],
        // 4.06 Describe how to configure email and SMS options
        "4.06": [
          "Configuração e templates do remetente de e-mail/SMS",
          "SMTP próprio ou envio fornecido pela Ping",
          "Variantes de template por idioma",
        ],
        // 4.07 Describe metrics on user activities
        "4.07": [
          "Dashboards: logins, uso de MFA, usuários ativos",
          "Filtro por janela de tempo e exportação em CSV",
          "Leitura de tendências: adoção e picos de falha",
        ],
        // 4.08 Utilize agreements and implement them in authentication policies
        "4.08": [
          "Os agreements guardam textos de consentimento versionados",
          "Conteúdo do agreement localizado por idioma",
          "Aplicado como etapa da authentication policy: uma barreira de consentimento antes do acesso",
        ],
        // 4.09 Describe the options available for customizing branding and themes
        "4.09": [
          "Temas: logotipo, cores e fundos das páginas hospedadas",
          "Temas padrão por ambiente",
          "Pré-visualização antes de publicar; substituição de templates para controle total",
        ],
        // 4.10 Explain how to enable and add languages
        "4.10": [
          "Ative os idiomas por ambiente",
          "Detecção do idioma e escolha pelo próprio usuário",
          "O conteúdo traduzido de notificações e agreements acompanha os temas",
        ],
      },
    },
  },
  // PAICP-001: Certified Professional - PingOne Advanced Identity Cloud.
  "ping-cp-pingone-aic": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "70 questões de múltipla escolha",
      passMark: "70,00%",
      cost: "USD 395, comprado pelo Ping Identity Certification Center (pode haver imposto regional); cada voucher vale para uma única tentativa",
      note: "Supervisionada pela Kryterion. Credencial válida por 2 anos. Valida configuração, administração, troubleshooting e manutenção de tenants do Advanced Identity Cloud (antes ForgeRock Identity Cloud). Treinamento oficial recomendado: Getting Started With PingOne Advanced Identity Cloud for Administrators; PingOne Advanced Identity Cloud Deep Dive: Access Management; PingOne Advanced Identity Cloud Deep Dive: Identity Management.",
    },
    // Key points: this site's study notes, translated objective by objective in the English order.
    keyPoints: {
      // Site-authored notes, so translated.
      rule: "site-notes",
      // Objective id -> translated points.
      byObjective: {
        // 1.01 Explain the environment and roles for managing Advanced Identity Cloud
        "1.01": [
          "Tenant de cloud gerenciado: ambientes de desenvolvimento, staging e produção",
          "AM, IDM e DS entregues como serviço: nenhuma infraestrutura para operar",
          "Papéis de administrador do tenant e papéis delegados por realm",
          "Promoção da configuração entre ambientes",
        ],
        // 1.02 Manage administrative access
        "1.02": [
          "Administrador do tenant e papéis com escopo para as equipes",
          "SSO dos administradores para o tenant",
          "Acesso de emergência e menor privilégio no acesso administrativo",
        ],
        // 1.03 Perform general administrative tasks
        "1.03": [
          "Exportações de configuração como código e pipeline de promoção",
          "Tarefas agendadas e configurações do tenant",
          "Gestão de certificados e de secrets dentro do tenant",
        ],
        // 2.01 Model identity objects
        "2.01": [
          "Objetos de realm gerenciados alpha_user / alpha_role",
          "Extensão do schema com propriedades personalizadas",
          "Flags de propriedade pesquisável e cifrada",
        ],
        // 2.02 Manage event hooks
        "2.02": [
          "Os event hooks disparam scripts nos eventos de ciclo de vida dos objetos",
          "Scripts de postCreate/postUpdate/postDelete",
          "Integrações de saída acionadas por mudanças de identidade",
        ],
        // 2.03 Import and sync identities
        "2.03": [
          "Importação em massa/CSV para as identidades gerenciadas",
          "Reconciliação com os sistemas conectados",
          "Agendamento de jobs de sincronização recorrentes",
        ],
        // 2.04 Manage provisioning roles and assignments with Advanced Identity Cloud
        "2.04": [
          "Os provisioning roles carregam assignments para as aplicações de destino",
          "Participação condicional por filtro de consulta",
          "Os atributos do assignment são aplicados na concessão e revogados na remoção",
        ],
        // 2.05 Manage custom objects and properties
        "2.05": [
          "Objetos gerenciados personalizados, além de user/role",
          "Propriedades personalizadas com policy e validação",
          "Relacionamentos com os objetos principais",
        ],
        // 3.01 Describe the purpose of the default user journeys
        "3.01": [
          "Journeys padrão: Login, Registration, Reset Password, Progressive Profile",
          "Pontos de partida para clonar e personalizar",
          "Atribuição de journeys por realm",
        ],
        // 3.02 Modify Journeys
        "3.02": [
          "Acrescentar, remover e reorganizar nós no editor de journeys",
          "Inner journeys para reuso",
          "Ligação dos resultados de sucesso e de falha",
        ],
        // 3.03 Configure self-service journeys
        "3.03": [
          "Autoatendimento: journeys de cadastro, redefinição de senha e atualização de perfil",
          "Nós de verificação por e-mail/OTP",
          "Progressive profiling para coletar dados ao longo do tempo",
        ],
        // 3.04 Configure Advanced Identity Cloud to use social registration and authentication
        "3.04": [
          "Nós de social identity provider (Google, Apple etc.)",
          "Client credentials e scopes do provedor",
          "Reivindicação e vinculação de contas a identidades existentes",
        ],
        // 4.01 Describe the role of an application in Advanced Identity Cloud
        "4.01": [
          "As applications representam integrações OAuth/OIDC/SAML",
          "Catálogo de aplicações gerenciadas e apps personalizadas",
          "Associe journeys e access policies às aplicações",
        ],
        // 4.02 Manage an application client profile
        "4.02": [
          "Client profile: redirect URIs, grants, scopes, configurações de token",
          "Configuração de client confidencial ou público",
          "Tempo de vida dos tokens e comportamento do refresh",
        ],
        // 4.03 Integrate PingGateway
        "4.03": [
          "O PingGateway fica na frente de aplicações legadas/on-premises para o tenant em cloud",
          "Proteção de routes consumindo tokens do tenant",
          "Ponte híbrida entre a identidade em cloud e os recursos on-premises",
        ],
        // 5.01 Integrate Advanced Identity Cloud with third-party services using SAML
        "5.01": [
          "O tenant como IdP ou SP SAML com terceiros",
          "Troca de metadados e chaves de assinatura",
          "Mapeamento de atributos nas assertions",
        ],
        // 5.02 Integrate Advanced Identity Cloud with third-party services using OIDC/OAuth
        "5.02": [
          "O tenant como provedor OIDC/OAuth para terceiros",
          "Registro de clients e desenho dos scopes",
          "Configuração de tokens e claims para os parceiros",
        ],
      },
    },
  },
  // PODV-001: Certified Professional - PingOne DaVinci.
  "ping-cp-pingone-davinci": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "60-70 questões de múltipla escolha",
      passMark: "73,33%",
      cost: "Informado na página Certifications da Ping Identity",
      note: "Supervisionada remotamente; um voucher vale para uma única tentativa.",
    },
    // Key points: this site's study notes, translated objective by objective in the English order.
    keyPoints: {
      // Site-authored notes, so translated.
      rule: "site-notes",
      // Objective id -> translated points.
      byObjective: {
        // 1.01 Describe how to use applications
        "1.01": [
          "As applications são os pontos de partida que expõem os flows",
          "Credenciais da app (company ID, API key) para chamar o widget ou a API",
          "Uma app, vários flows, por meio da sua flow policy",
        ],
        // 1.02 Configure the flow policy for an application
        "1.02": [
          "A flow policy liga um ou mais flows à aplicação",
          "Distribuição ponderada para rollout A/B",
          "A policy escolhe a versão do flow a servir",
        ],
        // 2.01 Create and use subflows
        "2.01": [
          "Subflows empacotam etapas reutilizáveis atrás de contratos de entrada e saída",
          "O connector Flow Conductor os chama",
          "Versione os subflows independentemente dos flows pais",
          "Passe dados pelo input schema e devolva pelos output nodes",
        ],
        // 2.02 Describe common core connector functionality (HTTP, Challenge, Flow Conductor, Function, Code Snippe...
        "2.02": [
          "Connector HTTP: chamadas de saída, headers personalizados, interpretação da resposta",
          "Connector Challenge para etapas de verificação no estilo OTP",
          "Function e Code Snippet: lógica inline em JS isolado em sandbox",
          "Flow Conductor para chamar subflows; Form/HTTP para as páginas voltadas ao usuário",
        ],
        // 2.03 Configure JSON schema
        "2.03": [
          "O input schema declara as entradas esperadas do flow e seus tipos",
          "A validação acontece no início do flow, contra o schema",
          "Os nós seguintes referenciam os campos do schema como variáveis",
        ],
        // 2.04 Manage multiple flow versions
        "2.04": [
          "Salvar cria uma nova versão do flow; o deploy a promove",
          "As aplicações fixam versões pela flow policy",
          "Para voltar atrás, aponte a policy de novo para uma versão anterior",
        ],
        // 2.05 Create and configure a connector instance
        "2.05": [
          "As instâncias de connector carregam credenciais por ambiente",
          "O mesmo connector, várias instâncias (por exemplo, dois destinos HTTP)",
          "Configurações da instância e configurações por nó",
        ],
        // 3.01 Given a scenario, identify a registration flow by its elements
        "3.01": [
          "Sinais de um flow de cadastro: formulário de coleta de atributos, verificação de unicidade, nó de criação de usuário, etapa de verificação",
          "Costuma terminar com login automático ou com um ramo de e-mail de verificação",
        ],
        // 3.02 Given a scenario, identify a password reset flow by its elements
        "3.02": [
          "Sinais de um flow de redefinição de senha: identificar o usuário, verificar por OTP/e-mail, nó de nova senha",
          "Os ramos de falha voltam para a identificação",
        ],
        // 3.03 Given a scenario, identify an authentication flow by its elements
        "3.03": [
          "Sinais de um flow de autenticação: pedido de credenciais, verificação no diretório, ramo de MFA, conclusão com token/redirect",
          "Verificações de risco ou de dispositivo aparecem antes do sucesso",
        ],
        // 4.01 Given a scenario, explain the troubleshooting process
        "4.01": [
          "Primeiro, reproduza: entradas exatas e contexto da aplicação",
          "Isole o nó que falha pela trilha do analytics",
          "Confira as credenciais da instância de connector e os endpoints externos",
          "Compare com a última versão que funcionava",
        ],
        // 4.02 Given a scenario, explain the process for debugging flows during development
        "4.02": [
          "Flow Analytics: trilha de nós por execução, com entradas e saídas",
          "Modo debug no flow studio com entradas de teste",
          "Inspeção de variáveis a cada passagem de nó",
        ],
        // 5.01 Utilize external data sources in flows
        "5.01": [
          "O connector HTTP alcança fontes REST externas",
          "O connector PingOne lê e grava no diretório",
          "Mapeie as respostas para variáveis do flow usadas pelos nós seguintes",
        ],
        // 5.02 Define and configure variables
        "5.02": [
          "Escopos: instância do flow, company, contexto do usuário",
          "Defina as variáveis com tipos e valores padrão",
          "Sintaxe de referência dentro dos campos dos nós; alteração por variable nodes",
        ],
        // 6.01 Use external HTML, CSS, and JavaScript in flows
        "6.01": [
          "HTML/CSS/JS personalizados nos nós que aceitam formulários",
          "Os assets ficam restritos à sandbox da página",
          "Mantenha a lógica nos nós e as páginas só na apresentação",
        ],
        // 6.02 Create user interface elements
        "6.02": [
          "Campos de formulário, botões e links compostos em cada nó",
          "As chaves dos campos viram dados do flow no envio",
          "Validação e exibição de erros por elemento",
        ],
        // 6.03 Integrate a flow policy into an application
        "6.03": [
          "O widget ou o redirect da aplicação inicia os flows da policy",
          "Incorpore com o snippet do widget DaVinci e as credenciais da app",
          "Ao terminar, tokens e atributos voltam para quem chamou",
        ],
        // 6.04 Build and apply DaVinci Forms
        "6.04": [
          "DaVinci Forms: formulários desenhados e reutilizáveis, fora de nós individuais",
          "Campos de arrastar e soltar, com validação por campo",
          "Anexe os formulários aos flows; os valores enviados viram dados do flow",
        ],
      },
    },
  },
  // IGAP-001: Certified Professional - PingOne Identity Governance.
  "ping-cp-pingone-idg": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "70 questões de múltipla escolha",
      passMark: "70,00%",
      cost: "Informado na página Certifications da Ping Identity",
      note: "Supervisionada remotamente; um voucher vale para uma única tentativa.",
    },
    // Key points: this site's study notes, translated objective by objective in the English order.
    keyPoints: {
      // Site-authored notes, so translated.
      rule: "site-notes",
      // Objective id -> translated points.
      byObjective: {
        // 1.01 Manage reports
        "1.01": [
          "Biblioteca de relatórios: visões de acesso, de entitlements e de atividade",
          "Relatórios parametrizados e agendados",
          "Exportação para auditores; definições de relatório salvas",
        ],
        // 1.02 Monitor reconciliations for applications
        "1.02": [
          "A reconciliação mostra as contas em relação às identidades autoritativas",
          "Detecção de contas órfãs e indevidas",
          "Dashboards de status da reconciliação por aplicação",
        ],
        // 1.03 Administer joiner, mover, and leaver workflows
        "1.03": [
          "Joiner: provisiona na contratação; Mover: ajusta na transferência; Leaver: desprovisiona na saída",
          "Os eventos de ciclo de vida definem o acesso automaticamente",
          "A rapidez do desprovisionamento na saída como foco de auditoria",
        ],
        // 2.01 Manage segregation of duties
        "2.01": [
          "Segregation of Duties: entitlements conflitantes são sinalizados",
          "As SoD policies definem as combinações tóxicas",
          "Prevenir no momento da solicitação ou detectar na certificação",
        ],
        // 2.02 Manage certification campaigns
        "2.02": [
          "Certification campaigns: atestação periódica pelos revisores",
          "Os revisores aprovam ou revogam cada item de acesso",
          "Escopo, calendário e escalonamento da campanha quando não há resposta",
        ],
        // 3.01 Manage scopes
        "3.01": [
          "Os scopes delimitam o que um role ou uma policy governa",
          "Escopo por aplicação e por entitlement",
          "O scope define quem vê o quê nas solicitações e nas revisões",
        ],
        // 3.02 Manage workflows
        "3.02": [
          "Workflows de aprovação para as solicitações de acesso",
          "Aprovadores em várias etapas e condições",
          "Ramos de policy com aprovação ou rejeição automática",
        ],
        // 3.03 Configure access requests
        "3.03": [
          "Catálogo de autoatendimento para solicitar acesso",
          "Solicitação em nome de outra pessoa; modelo de carrinho de compras",
          "Verificações de policy e de SoD no envio da solicitação",
        ],
        // 3.04 Configure glossary
        "3.04": [
          "O glossário de negócio associa entitlements técnicos a termos simples",
          "Descrições legíveis para os revisores",
          "A qualidade do glossário determina a precisão da certificação",
        ],
        // 3.05 Manage reconciliation
        "3.05": [
          "Configuração da reconciliação: fontes, calendários, regras de correlação",
          "A correlação associa contas a identidades",
          "Tratamento de contas sem correspondência e ambíguas",
        ],
        // 3.06 Configure application connectors
        "3.06": [
          "Os application connectors trazem contas e entitlements",
          "Credenciais do connector e mapeamentos de objetos",
          "Descoberta do schema a partir da aplicação conectada",
        ],
        // 3.07 Configure forms
        "3.07": [
          "Os formulários definem a captura de dados nas solicitações e revisões",
          "Validação de campos e visibilidade condicional",
          "Ligue os formulários às etapas de solicitação e de workflow",
        ],
        // 4.01 Troubleshoot and resolve governance issues
        "4.01": [
          "Troubleshooting de governança: workflows parados, provisionamento com falha",
          "Divergências de reconciliação e correções de correlação",
          "Trilha de auditoria para rastrear uma decisão de acesso",
        ],
        // 4.02 Manage entitlements
        "4.02": [
          "Entitlements são as unidades de acesso que podem ser concedidas",
          "Agrupamento de entitlements em roles/bundles",
          "Responsáveis e descrições dos entitlements para a revisão",
        ],
      },
    },
  },
};
