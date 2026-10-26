// ============================================================================
// src/content/certifications/overlays/pt-BR/f5.ts
// ----------------------------------------------------------------------------
// pt-BR PROSE OF THE F5 STUDY GUIDES (PRIME 26/10/2026). Each entry, keyed
// by guide slug, holds ONLY translated prose (GuideOverlay); facts, codes, names
// and objective text stay in study-guides.ts. Rules: src/content/certifications/
// localized.ts. Generated from the translation sources by the cert-pt batch and
// checked by scripts/check-cert-translation.mts (alignment) and
// scripts/check-ptbr-register.mjs (register). Edit here and rerun both.
// ============================================================================

// The overlay's shape.
import type { GuideOverlay } from "@/content/certifications/localized";

/** Translated prose of the F5 guides, keyed by guide slug. */
export const PT_BR_F5: Record<string, GuideOverlay> = {
  // F5CAB4: BIG-IP Administration Control Plane Administration.
  "f5-ca-control-plane-administration": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "25-30 itens",
      passMark: "245 (pontuação em escala)",
      cost: "Informado na página da prova da F5",
      note: "Online, com supervisão remota pela Certiverse (exige acesso à câmera), ou em centro de testes Pearson VUE, com supervisão presencial; em inglês. Uma das cinco provas, feitas em qualquer ordem, que dão a F5 Certified Administrator, BIG-IP (F5-CA, BIG-IP); juntas, elas substituem as provas 101 e 201.",
    },
    // Key points: the vendor's own blueprint sub-points, quoted, so they stay English (lang="en").
    keyPoints: { rule: "vendor-verbatim" },
  },
  // F5CAB2: BIG-IP Administration Data Plane Concepts.
  "f5-ca-data-plane-concepts": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "25-30 itens",
      passMark: "245 (pontuação em escala)",
      cost: "Informado na página da prova da F5",
      note: "Online, com supervisão remota pela Certiverse (exige acesso à câmera), ou em centro de testes Pearson VUE, com supervisão presencial; em inglês. Uma das cinco provas, feitas em qualquer ordem, que dão a F5 Certified Administrator, BIG-IP (F5-CA, BIG-IP); juntas, elas substituem as provas 101 e 201.",
    },
    // Key points: the vendor's own blueprint sub-points, quoted, so they stay English (lang="en").
    keyPoints: { rule: "vendor-verbatim" },
  },
  // F5CAB3: BIG-IP Administration Data Plane Configuration.
  "f5-ca-data-plane-configuration": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "25-30 itens",
      passMark: "245 (pontuação em escala)",
      cost: "Informado na página da prova da F5",
      note: "Online, com supervisão remota pela Certiverse (exige acesso à câmera), ou em centro de testes Pearson VUE, com supervisão presencial; em inglês. Uma das cinco provas, feitas em qualquer ordem, que dão a F5 Certified Administrator, BIG-IP (F5-CA, BIG-IP); juntas, elas substituem as provas 101 e 201.",
    },
    // Key points: the vendor's own blueprint sub-points, quoted, so they stay English (lang="en").
    keyPoints: { rule: "vendor-verbatim" },
  },
  // F5CAB1: BIG-IP Administration Install, Initial Configuration, and Upgrade.
  "f5-ca-install-config-upgrade": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "25-30 itens",
      passMark: "245 (pontuação em escala)",
      cost: "Informado na página da prova da F5",
      note: "Online, com supervisão remota pela Certiverse (exige acesso à câmera), ou em centro de testes Pearson VUE, com supervisão presencial; em inglês. Uma das cinco provas, feitas em qualquer ordem, que dão a F5 Certified Administrator, BIG-IP (F5-CA, BIG-IP); juntas, elas substituem as provas 101 e 201.",
    },
    // Key points: the vendor's own blueprint sub-points, quoted, so they stay English (lang="en").
    keyPoints: { rule: "vendor-verbatim" },
  },
  // F5CAB5: BIG-IP Administration Support and Troubleshooting.
  "f5-ca-support-and-troubleshoot": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "25-30 itens",
      passMark: "245 (pontuação em escala)",
      cost: "Informado na página da prova da F5",
      note: "Online, com supervisão remota pela Certiverse (exige acesso à câmera), ou em centro de testes Pearson VUE, com supervisão presencial; em inglês. Uma das cinco provas, feitas em qualquer ordem, que dão a F5 Certified Administrator, BIG-IP (F5-CA, BIG-IP); juntas, elas substituem as provas 101 e 201.",
    },
    // Key points: the vendor's own blueprint sub-points, quoted, so they stay English (lang="en").
    keyPoints: { rule: "vendor-verbatim" },
  },
  // 402: Cloud Solutions (402).
  "f5-cse-cloud-402": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "70 questões (65 itens pontuados, 5 itens piloto/beta)",
      passMark: "245 (escala de 100 a 350)",
      cost: "US$180 por tentativa (sem impostos e taxas locais)",
      note: "Prova em computador, de múltipla escolha, aplicada nos centros de testes Pearson VUE (em inglês). Credencial concedida: F5 Certified Solution Expert, Cloud (F5-CSE, Cloud). Pré-requisitos: F5-CA, mais F5-CTS LTM e F5-CTS DNS. O tempo de prova não inclui adaptações para quem não tem o inglês como língua nativa nem outras adaptações, e algumas questões trazem exhibits ou cenários. Depois de uma reprovação, a prova fica bloqueada por 15 dias (primeira reprovação), 30 dias (segunda), 45 dias (terceira), 365 dias (quarta) e 90 dias (quinta em diante).",
    },
    // Key points: this site's study notes, translated objective by objective in the English order.
    keyPoints: {
      // Site-authored notes, so translated.
      rule: "site-notes",
      // Objective id -> translated points.
      byObjective: {
        // 1.01 Compare and contrast the various cloud business models and technologies
        "1.01": [
          "Modelos de serviço: o IaaS entrega a máquina virtual, o PaaS o runtime, o SaaS a aplicação pronta; a responsabilidade muda de lado conforme se sobe na pilha.",
          "Modelos de implantação: pública, privada, híbrida e multi-cloud, cada uma com características diferentes de controle e de custo de egress.",
          "O modelo de responsabilidade compartilhada é o tema recorrente da prova: o provedor protege a cloud, e o tenant protege o que roda nela.",
          "A cobrança por consumo muda os incentivos do desenho: capacidade ociosa custa dinheiro, e é isso que torna o autoscaling um requisito de arquitetura, e não um luxo.",
          "Saiba onde o BIG-IP Virtual Edition se encaixa em cada modelo e onde se usaria um load balancer nativo da cloud no lugar dele.",
        ],
        // 1.02 Apply concepts related to cloud Identity Access Management technologies
        "1.02": [
          "O IAM de cloud é policy associada a identidades e a recursos; menor privilégio e assunção de papéis são os padrões centrais.",
          "A federação permite que um diretório corporativo se autentique em um provedor de cloud, normalmente via SAML ou OIDC.",
          "Instance roles e managed identities permitem que um BIG-IP VE chame as APIs do provedor sem credenciais estáticas embutidas, que é o padrão preferido.",
          "O APM se integra ao IAM da cloud para dar acesso às aplicações, o que é diferente do IAM que controla a própria infraestrutura.",
          "Distinga a identidade do control plane (quem pode mudar a implantação) da identidade do data plane (quem pode usar a aplicação).",
        ],
        // 1.03 Describe the terminology, modules, and technical requirements related to application bursting and mo...
        "1.03": [
          "Application bursting significa transbordar capacidade de um ambiente para outro quando a demanda passa dos recursos locais.",
          "Mobilidade significa mover uma aplicação entre ambientes sem reescrevê-la, o que exige serviços consistentes nos dois.",
          "Pré-requisitos: endereçamento consistente ou overlay, direcionamento por DNS, estado replicado ou compartilhado e policy idêntica nos dois locais.",
          "O F5 DNS (GTM) oferece a camada de direcionamento global; o LTM de cada site faz a entrega local.",
          "As restrições duras são a gravidade dos dados e a latência, e não o load balancing.",
        ],
        // 1.04 Apply concepts related to application bursting and mobility
        "1.04": [
          "O bursting é disparado por limites mensuráveis; defina-os sobre a métrica que de fato degrada a experiência do usuário.",
          "O monitoramento de saúde precisa abranger os dois ambientes, para que a camada de direcionamento saiba que o destino do burst está realmente pronto.",
          "A persistência de sessão entre ambientes é o ponto clássico de falha; resolva com um desenho stateless ou com armazenamento de sessão compartilhado.",
          "O tráfego de retorno e o roteamento assimétrico precisam ser planejados, sobretudo com SNAT e com as restrições de roteamento da cloud.",
          "O controle de custos faz parte do desenho: defina a condição de redução com o mesmo cuidado da condição de expansão.",
        ],
        // 2.01 Describe the F5 licensing and support characteristics for cloud deployments
        "2.01": [
          "Modelos de licenciamento do BIG-IP VE: BYOL (bring your own licence), cobrança por hora ou por uso pelo marketplace da cloud e assinatura.",
          "O licenciamento por faixa de throughput limita o desempenho qualquer que seja o tamanho da instância, então licença e instância precisam combinar.",
          "O direito a suporte segue o tipo de licença; as instâncias do marketplace têm condições de suporte cobradas pelo provedor.",
          "Saiba quando uma licença precisa ser reativada depois de uma mudança de instância e como isso afeta a reimplantação automatizada.",
          "A portabilidade da licença é uma restrição de desenho real em autoscaling groups, onde as instâncias são efêmeras.",
        ],
        // 2.02 Evaluate variables relevant to the design of a cloud solution that meets business requirement
        "2.02": [
          "Dados de entrada do desenho: throughput, conexões por segundo, SSL TPS, módulos exigidos, meta de disponibilidade e fronteiras de compliance.",
          "Os requisitos de negócio viram números concretos antes de escolher uma plataforma; essa tradução é o objetivo.",
          "As metas de disponibilidade definem o modelo de HA: active-standby, active-active ou distribuição multizona nativa do provedor.",
          "A folga para crescimento e o comportamento de burst determinam se o desenho adequado é escalar verticalmente ou horizontalmente.",
          "Documente as premissas; os cenários da prova muitas vezes dependem de uma restrição dita uma única vez.",
        ],
        // 2.03 Enumerate the available permutations and combinations of F5 virtualization technologies
        "2.03": [
          "Formas de virtualização da F5: appliance de hardware, guests vCMP no hardware que o suporta, BIG-IP VE em um hypervisor e instâncias em cloud.",
          "O vCMP oferece isolamento de guests no nível do hardware, com recursos dedicados; route domains e partitions oferecem separação lógica em uma única instância.",
          "A escolha de multi-tenancy é uma troca entre a força do isolamento e a eficiência no uso de recursos.",
          "O licenciamento por guest e a alocação de recursos limitam quantos tenants uma plataforma comporta.",
          "Saiba quais recursos não existem ou se comportam de outra forma no VE em comparação com o hardware, em especial o offload em hardware.",
        ],
        // 2.04 Recognize the constraints imposed by various SDN technologies on F5 components
        "2.04": [
          "Ambientes SDN impõem encapsulamento de overlay (VXLAN, NVGRE) que o BIG-IP precisa terminar ou atravessar.",
          "Pontos de integração: VMware NSX, Cisco ACI e OpenStack Neutron expõem, cada um, modelos diferentes de service insertion.",
          "O endereçamento de underlay e de overlay determina onde ficam os self IPs do BIG-IP e como o tráfego de retorno os encontra.",
          "Algumas fabrics SDN restringem o modo promíscuo ou o MAC masquerade, o que limita a mecânica de HA e de failover.",
          "A restrição costuma estar na semântica de rede, e não no throughput.",
        ],
        // 2.05 Relate technical requirements to F5 platforms and virtualization technologies
        "2.05": [
          "Associe primeiro os recursos exigidos à capacidade da plataforma e depois dimensione o throughput; uma lacuna de recurso não se resolve com uma instância maior.",
          "O offload em hardware (SSL, compressão, DoS em FPGA) existe nos appliances e não no VE, o que muda bastante a conta do dimensionamento.",
          "O dimensionamento de guests vCMP aloca cores e memória explicitamente; não há o overcommit disponível nos hypervisors genéricos.",
          "As famílias de instâncias em cloud diferem no desempenho de rede; o limite de rede da instância pode pesar antes do limite da licença.",
          "Declare no desenho a restrição que limita, para que o revisor veja o que precisaria mudar para escalar mais.",
        ],
        // 2.06 Evaluate variables relevant to architeching solutions using single and multi-tier F5 products in var...
        "2.06": [
          "O single-tier coloca todos os serviços em um BIG-IP; o multi-tier separa as funções de camada de rede e de camada de aplicação em dispositivos distintos.",
          "O multi-tier melhora o isolamento do raio de impacto e permite que cada camada escale de forma independente, ao custo de mais dispositivos e mais hops.",
          "Divisão comum: AFM e DoS na camada externa, LTM e AWAF na camada interna.",
          "O orçamento de latência e a complexidade de gerenciamento são os argumentos contra o multi-tier; declare-os com honestidade.",
          "A resposta certa depende tanto da escala e das fronteiras organizacionais quanto da tecnologia.",
        ],
        // 2.07 Evaluate the variables relevant to the design of green-field data centers and application delivery a...
        "2.07": [
          "Um desenho green-field permite escolher desde o início o endereçamento, a segmentação e o modelo de automação; aproveite isso.",
          "Padronize em configuração declarativa (AS3, Declarative Onboarding), para que o ambiente seja reproduzível desde o primeiro dia.",
          "Desenhe o caminho de gerenciamento e de acesso out-of-band antes do caminho de dados.",
          "Planeje os limites de crescimento: route domains, partitions e convenções de nomes são baratos agora e caros para adaptar depois.",
          "Documente a arquitetura de referência, para que as aplicações seguintes caiam em um padrão conhecido, e não em um feito sob medida.",
        ],
        // 2.08 Apply key concepts related to the design on-demand provisioning of application services
        "2.08": [
          "Provisionamento sob demanda significa que o serviço de aplicação é criado por uma chamada de API, e não por um chamado de mudança.",
          "Os blocos básicos são templates declarativos mais um orquestrador que fornece os parâmetros de cada ambiente.",
          "A idempotência é o requisito que torna isso seguro: aplicar a mesma declaração duas vezes não pode mudar o resultado.",
          "Os catálogos de serviços permitem que as equipes de aplicação peçam um padrão comprovado sem mexer na configuração dos dispositivos.",
          "Desenhe o caminho de desprovisionamento com o mesmo rigor, ou o ambiente se enche de objetos órfãos.",
        ],
        // 2.09 Evaluate variables relevant to the design of on-demand provisioning of application services
        "2.09": [
          "Variáveis a avaliar: com que rapidez o provisionamento precisa terminar, com que frequência acontece e quem está autorizado a dispará-lo.",
          "A parametrização dos templates decide quanta variação o catálogo absorve antes de precisar de um novo template.",
          "A disponibilidade de licenças e a alocação de endereços IP são os limites práticos da velocidade real de provisionamento.",
          "O comportamento de rollback em caso de falha parcial precisa ser definido explicitamente.",
          "A integração com auditoria e com o registro de mudanças costuma ser um requisito, e não uma opção.",
        ],
        // 3.01 Evaluate variables relevant to the creation and validation of a Cloud migration plan for application...
        "3.01": [
          "Um plano de migração começa por um inventário de aplicações e um mapa de dependências, e não pela plataforma de destino.",
          "Classifique as cargas: rehost, replatform, refactor ou retire; cada uma tem uma implicação diferente para a F5.",
          "Os critérios de validação precisam ser definidos antes da migração, para que o sucesso seja medido, e não discutido.",
          "Identifique cedo os componentes com estado e as integrações externas; são eles que quebram as migrações.",
          "Planeje o rollback e a janela de cutover com o mesmo cuidado.",
        ],
        // 3.02 Apply key concepts required for the implementation of a Cloud migration plan for applications
        "3.02": [
          "Sequência de implementação: montar o destino, replicar a configuração de forma declarativa, validar, deslocar o tráfego aos poucos e então desativar o antigo.",
          "O deslocamento de tráfego por DNS com o F5 DNS permite um cutover controlado e reversível, por peso ou por geografia.",
          "A paridade de configuração é verificada comparando as declarações, e não olhando duas GUIs.",
          "A migração de certificados e chaves é uma frente de trabalho à parte, com seu próprio tratamento de segurança.",
          "Monitore os dois ambientes durante o deslocamento, para que uma regressão seja atribuída ao lugar certo.",
        ],
        // 3.03 Evaluate variables relevant to the implementation of a cloud migration plan for applications
        "3.03": [
          "A largura de banda e o custo de transferência de dados moldam o cronograma da migração; grandes volumes de dados podem exigir uma carga inicial offline.",
          "A latência entre camadas depois de uma migração parcial é a surpresa de desempenho mais comum.",
          "A cobertura de licenciamento e de suporte precisa existir no destino antes que o tráfego chegue.",
          "As fronteiras de compliance podem proibir que certos dados saiam de uma jurisdição; confirme antes de desenhar.",
          "Defina explicitamente o ponto sem volta e qual evidência justifica passar por ele.",
        ],
        // 3.04 Apply key concepts required to leverage technologies to integrate with various SDN environments
        "3.04": [
          "Integrar significa que a F5 vira um serviço que o controlador SDN consegue inserir, e não um dispositivo configurado ao lado dele.",
          "Conheça os mecanismos: policies de service insertion, participação dinâmica em pools a partir da fabric e configuração por API.",
          "A terminação de overlay (VXLAN ou NVGRE) no BIG-IP permite que ele participe do endereçamento da fabric.",
          "A consistência de policy entre os controles da fabric e os do BIG-IP evita uma aplicação contraditória.",
          "A compatibilidade de versões entre a fabric e o pacote de integração da F5 é uma restrição operacional real.",
        ],
        // 3.05 Evaluate variables rlevant to the leveraging of technologies to integrate with various SDN environme...
        "3.05": [
          "Avalie se a fabric ou o BIG-IP é dono de cada função, e garanta que exatamente um deles seja.",
          "A independência de falhas importa: se o controlador cair, decida se o tráfego continua fluindo.",
          "A responsabilidade operacional é uma variável organizacional que o desenho precisa refletir, porque duas equipes dividindo a mesma superfície de policy causam indisponibilidades.",
          "As credenciais de automação e o escopo delas são uma questão de segurança na integração.",
          "Teste os caminhos de failover no modelo integrado, e não só no isolado.",
        ],
        // 4.01 Analyze cloud service provider instance sizing and location as it relates to BIG-IP requirements
        "4.01": [
          "O dimensionamento da instância precisa atender à faixa da licença, ao limite de throughput de rede e à exigência de memória dos módulos provisionados.",
          "O desempenho de rede do provedor varia por família de instância; confira o teto de rede publicado, e não só o número de vCPUs.",
          "O posicionamento importa: a região pela latência e pelo compliance, a availability zone pelo isolamento de falhas.",
          "Várias NICs costumam ser necessárias para a separação convencional entre data plane e gerenciamento.",
          "Confirme que o tipo de instância exigido está disponível na região escolhida antes de fechar o desenho.",
        ],
        // 4.02 Apply the key concepts required to deploy F5 instances on a cloud infrastructure
        "4.02": [
          "Métodos de implantação: imagem do marketplace, templates nativos do provedor, Declarative Onboarding para a configuração inicial e AS3 para os serviços.",
          "O HA em cloud usa mecanismos do provedor (reatribuição de endereços por API, atualização de tabelas de rotas), e não gratuitous ARP.",
          "O tempo de failover em cloud é limitado pela latência das APIs do provedor, mais lenta que o failover em hardware; desenhe o orçamento dos health checks de acordo.",
          "Os serviços de metadados da instância fornecem a identidade e o bootstrap da configuração sem secrets estáticos.",
          "Os security groups e as network ACLs precisam permitir tanto o tráfego de dados quanto o de controle do HA, uma causa frequente de failover que falha em silêncio.",
        ],
        // 5.01 Apply the N/E/S/W-bound API model in order to orchestrate service creation
        "5.01": [
          "O modelo da bússola: as APIs northbound ficam voltadas a orquestradores e consumidores, as southbound aos dispositivos, as east-west aos sistemas pares.",
          "O BIG-IQ e os frameworks de automação consomem as APIs northbound do BIG-IP para orquestrar a criação de serviços.",
          "Entender a direção esclarece qual sistema é dono do estado e qual apenas dá instruções.",
          "A criação de um serviço flui de uma requisição no norte, passa por uma tradução e chega à configuração do dispositivo no sul.",
          "O modelo é um vocabulário que a prova usa; saiba posicionar nele um determinado componente.",
        ],
        // 5.02 Apply the key concepts required to automate and orchestrate using F5 RESTful APIs
        "5.02": [
          "O iControl REST é a API imperativa; o AS3 é a camada declarativa de serviços; o Declarative Onboarding cuida do bootstrap no nível do dispositivo.",
          "A autenticação usa sessões baseadas em token; os tokens expiram, e a automação precisa tratar isso em vez de ignorar.",
          "Prefira o declarativo para os serviços, porque é idempotente e comparável; use o imperativo para as operações que as declarações não cobrem.",
          "As transactions permitem aplicar várias mudanças imperativas de forma atômica.",
          "Tratamento de erros e nova tentativa com backoff fazem parte de uma implementação correta, e não são um extra.",
        ],
        // 5.03 Evaluate the variables relevant to automation and orchestration using F5 RESTful APIs
        "5.03": [
          "Avalie os limites de taxa da API, a concorrência e o efeito de declarações grandes sobre a CPU do dispositivo.",
          "A compatibilidade de versões entre o ferramental de automação e o TMOS é uma restrição operacional recorrente.",
          "O tratamento de secrets das credenciais de API precisa ser definido; credenciais embutidas em playbooks são um achado de auditoria.",
          "Decida a fonte da verdade: se a declaração é a referência, mudanças feitas por fora, na GUI, precisam ser tratadas como desvio.",
          "Teste as declarações em um dispositivo fora de produção antes da promoção.",
        ],
        // 5.04 Apply the key concepts required to design a cloud bursting solution
        "5.04": [
          "Um desenho de bursting precisa de uma métrica de disparo, de um ambiente de destino mantido aquecido o bastante para aceitar tráfego e de um mecanismo de direcionamento.",
          "O F5 DNS, ciente da saúde e da capacidade, é a camada de direcionamento habitual para o bursting entre ambientes.",
          "Provisionar o destino do burst com antecedência ou sob demanda é uma troca entre custo e latência.",
          "O acesso aos dados a partir do local do burst determina se o bursting é viável.",
          "Defina os critérios de redução e o procedimento de drenagem do estado junto com o caminho de expansão.",
        ],
        // 5.05 Evaluate the variables relevant to design a cloud bursting solution
        "5.05": [
          "Variáveis: com que rapidez a capacidade precisa aparecer, por quanto tempo será necessária e quanto custa por unidade de tempo.",
          "A disponibilidade de licenças no ambiente de burst pode ser a restrição que limita, e não o processamento.",
          "A persistência de sessão e o cache aquecido afetam a experiência do usuário durante o deslocamento.",
          "O monitoramento precisa distinguir o tráfego de burst da linha de base, para que o disparo possa ser ajustado.",
          "Verifique o ciclo completo em um teste: expandir, atender, reduzir e confirmar que não sobraram recursos órfãos.",
        ],
        // 5.06 Determine how to utilize cloud deployment templates to create on demand provisioning of application ...
        "5.06": [
          "Os cloud deployment templates codificam juntas a infraestrutura e a configuração da F5, para que um serviço seja reproduzível.",
          "A F5 publica templates por provedor de cloud; normalmente eles combinam definições de infraestrutura nativas do provedor com Declarative Onboarding e AS3.",
          "Os templates parametrizam o que varia (dimensionamento, endereçamento, licença) e fixam o que não deve variar.",
          "Versione os templates; o template é o artefato sob gestão de mudanças, e não o dispositivo em execução.",
          "Os templates suportam padrões de instância única e em cluster; escolha o que corresponde ao requisito de disponibilidade.",
        ],
        // 5.07 Evaluate cloud deployment templates for the creation of on-demand provisioning of application servic...
        "5.07": [
          "Avalie um template pela completude, pela idempotência, pela superfície de parâmetros e por produzir ou não uma configuração com suporte.",
          "Verifique o que o template faz na atualização, além da criação; alguns substituem em vez de modificar.",
          "Confirme que as premissas de rede do template correspondem ao ambiente de destino.",
          "Revise a postura de segurança com que o template vem, em especial a exposição do acesso de gerenciamento.",
          "Prefira templates que separam a infraestrutura da configuração de serviços, para que cada uma evolua de forma independente.",
        ],
        // 5.08 Apply the key concepts required to create a workflow for dynamic provisioning of an F5 instance
        "5.08": [
          "Um workflow de provisionamento dinâmico: disparo, lançamento da instância, declaração de onboarding, declaração de serviços, verificação de saúde e registro na camada de direcionamento.",
          "Cada etapa precisa ser idempotente e verificável de forma independente, para que uma falha parcial seja recuperável.",
          "O licenciamento é a etapa com mais chance de falhar de forma intermitente; desenhe um tratamento explícito para ela.",
          "O registro e o cancelamento do registro no DNS ou na camada de load balancing delimitam a vida da instância.",
          "Emita logs e eventos em cada etapa, para que o workflow possa ser depurado depois.",
        ],
        // 5.09 Apply the key concepts required to create a workflow for dynamic provisioning of an F5 instance
        "5.09": [
          "A desativação é metade do workflow: drenar as conexões, cancelar o registro, revogar a licença quando aplicável e então encerrar.",
          "Proteja-se contra recursos órfãos: endereços, licenças, entradas de DNS e registros de monitoramento vazam se não forem tratados.",
          "O controle de concorrência impede que duas execuções de provisionamento colidam nos mesmos endereços ou nomes.",
          "Convenções de nomes e de tags tornam possível a limpeza automatizada; adote-as já no desenho.",
          "Teste de propósito os caminhos de falha do workflow, porque não é o caminho feliz que quebra em produção.",
        ],
      },
    },
  },
  // 401: Security Solutions (401).
  "f5-cse-security-401": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "70 questões (65 itens pontuados, 5 itens piloto/beta)",
      passMark: "245 (escala de 100 a 350)",
      cost: "US$180 por tentativa (sem impostos e taxas locais)",
      note: "Prova em computador, de múltipla escolha, aplicada nos centros de testes Pearson VUE (em inglês). Credencial concedida: F5 Certified Solution Expert, Security (F5-CSE, Security). Pré-requisitos: F5-CA, mais F5-CTS LTM, F5-CTS ASM e F5-CTS APM. O tempo de prova não inclui adaptações para quem não tem o inglês como língua nativa nem outras adaptações, e algumas questões trazem exhibits ou cenários. Depois de uma reprovação, a prova fica bloqueada por 15 dias (primeira reprovação), 30 dias (segunda), 45 dias (terceira), 365 dias (quarta) e 90 dias (quinta em diante).",
    },
    // Key points: this site's study notes, translated objective by objective in the English order.
    keyPoints: {
      // Site-authored notes, so translated.
      rule: "site-notes",
      // Objective id -> translated points.
      byObjective: {
        // 1.01 Analyze external threat research to determine the potential impact to an organization
        "1.01": [
          "Fontes de pesquisa de ameaças: F5 Labs, feeds de CVE/NVD, avisos dos fabricantes, boletins de ISACs e o OWASP Top 10 como referência recorrente.",
          "Traduza uma ameaça publicada em exposição: quais aplicações usam o componente afetado, quais estão expostas à internet e qual é o raio de impacto.",
          "O CVSS mede a gravidade em abstrato; o EPSS estima a probabilidade de exploração. Nenhum dos dois substitui a pergunta: a SUA instalação está alcançável e sem patch?",
          "O virtual patching com o AWAF é a resposta padrão quando a própria aplicação não pode ser corrigida rapidamente.",
          "O resultado deste objetivo é uma declaração de impacto priorizada, e não uma lista de vulnerabilidades.",
        ],
        // 1.02 Analyze threat modeling data to determine risk profiles of the infrastructure and applications
        "1.02": [
          "A modelagem de ameaças faz quatro perguntas: o que estamos construindo, o que pode dar errado, o que vamos fazer a respeito e se fizemos um bom trabalho.",
          "O STRIDE é a taxonomia comum: spoofing, tampering, repudiation, information disclosure, denial of service, elevation of privilege.",
          "O perfil de risco combina valor do ativo, exposição e probabilidade; uma falha de baixa gravidade em uma aplicação crítica pode pesar mais que uma de alta gravidade em um sistema isolado.",
          "A classificação dos dados orienta a escolha dos controles: dados de titulares de cartão do PCI DSS, dados pessoais sob a lei de privacidade e dados de saúde têm obrigações diferentes.",
          "Associe cada risco identificado ao controle F5 que o trata, para que o desenho se justifique objetivo por objetivo.",
        ],
        // 2.01 Determine the correct solution to mitigate a given threat
        "2.01": [
          "Associe a classe da ameaça ao módulo: AWAF para ataques na camada de aplicação, AFM para firewall e DoS na camada de rede, APM para acesso e identidade, DNS para proteção na camada de DNS.",
          "DoS de camada 7 e DoS de camadas 3/4 são problemas diferentes, com mitigações diferentes; não responda um com a mitigação do outro.",
          "As proteções Bot Defense e Web Scraping tratam da automação, que é uma classe separada de injeção ou de exploração.",
          "O SSL Orchestrator resolve o problema da visibilidade, e não um ataque diretamente: ele permite que outras ferramentas vejam o tráfego decifrado.",
          "A resposta correta costuma ser o controle de menor privilégio que trata a ameaça por completo, e não o mais poderoso.",
        ],
        // 2.02 Determine the correct control to address a compliance or business requirement
        "2.02": [
          "Os regimes de compliance indicam os controles exigidos: o requisito 6.6 do PCI DSS aceita explicitamente um web application firewall como alternativa à revisão de código.",
          "Os requisitos de negócio muitas vezes se traduzem em orçamentos de disponibilidade e de latência, que limitam o quanto um controle pode ser agressivo.",
          "Modo de bloqueio ou modo transparente é uma decisão de negócio antes de ser técnica; colocar a policy primeiro em staging no modo transparente é a prática padrão.",
          "Os requisitos de logging e de relatórios também são controles: a evidência de auditoria muitas vezes é o verdadeiro entregável.",
          "Documente qual requisito cada controle atende, porque os auditores de compliance pedem o mapeamento, e não a configuração.",
        ],
        // 2.03 Determine the appropriate security framework for an application
        "2.03": [
          "Frameworks comuns: OWASP Top 10 para o risco das aplicações, NIST Cybersecurity Framework para a estrutura do programa, CIS Controls para o hardening priorizado, ISO 27001 para sistemas de gestão.",
          "A escolha do framework segue as obrigações e a maturidade da organização, e não a tecnologia que está na sua frente.",
          "O MITRE ATT&CK é comportamental e voltado ao pós-comprometimento; ele complementa os frameworks de desenho, em vez de substituí-los.",
          "Os templates de policy da F5 correspondem às expectativas dos frameworks, e é isso que os torna defensáveis em uma auditoria.",
          "Espere ter de justificar a escolha de um framework em termos de cobertura e de relatórios, e não de preferência.",
        ],
        // 2.04 Explain the justification for a proposed solution
        "2.04": [
          "Uma justificativa liga a ameaça, o controle, o risco residual e o custo, nessa ordem.",
          "Diga o que a solução NÃO cobre: um risco residual não tratado e declarado abertamente é sinal de um desenho sólido.",
          "Quantifique quando possível (requisições bloqueadas, latência acrescentada, incidentes evitados) e seja explícito quando a quantificação não for possível.",
          "O custo operacional importa: o esforço de ajuste das policies, o tratamento de falsos positivos e a equipe fazem parte da proposta.",
          "Antecipe as alternativas e explique por que não foram escolhidas.",
        ],
        // 2.05 Determine when BIG-IQ is required for centralized management and visibility
        "2.05": [
          "O BIG-IQ centraliza gerenciamento, licenciamento e visibilidade de vários dispositivos BIG-IP; um único dispositivo não precisa dele.",
          "Gatilhos para o BIG-IQ: consistência de policy em escala de frota, gerenciamento centralizado de policies do AWAF, relatórios agregados e gestão de licenças de virtual editions.",
          "O BIG-IQ também oferece acesso baseado em papéis e staging de mudanças para equipes que precisam separar funções.",
          "Ele é um management plane, e não um data plane: nunca fica no caminho do tráfego.",
          "A pergunta da prova normalmente é escala mais governança, então procure o tamanho da frota e os requisitos de auditoria.",
        ],
        // 3.01 Apply procedural concepts required to configure F5 technology to provide network layer DOS protectio...
        "3.01": [
          "O AFM oferece proteção contra DoS na camada de rede por meio de DoS profiles no nível do dispositivo e no nível do virtual server.",
          "Conheça as famílias de vetores: floods (SYN, UDP, ICMP), pacotes malformados e abuso de protocolo, cada uma com seus próprios limites de detecção e de taxa.",
          "Detection threshold, mitigation threshold e o comportamento de auto-threshold são as três configurações que a prova espera que você saiba distinguir.",
          "Os SYN cookies protegem a tabela de conexões sem guardar estado para clients não verificados.",
          "O comportamento de whitelist e blacklist, mais o escalonamento para o offload em hardware nas plataformas que o suportam, completam o conjunto.",
        ],
        // 3.02 Determine the appropriate protection against known bad actors
        "3.02": [
          "O IP Intelligence classifica fontes sabidamente maliciosas (botnets, scanners, proxies, nós de saída do Tor) por meio de um feed por assinatura.",
          "A policy de IPI decide a ação por categoria; a atualidade do feed é o que o torna útil, então o estado da assinatura importa na operação.",
          "As shun lists e o bloqueio manual tratam dos atores que o feed ainda não conhece.",
          "A restrição por geolocalização é um controle de negócio grosseiro, mas comum; conheça suas limitações diante de proxies e VPNs.",
          "Os controles de reputação reduzem o ruído, para que as camadas de inspeção mais profundas trabalhem sobre uma população menor e mais suspeita.",
        ],
        // 3.03 Determine the appropriate settings to mitigate web fraud
        "3.03": [
          "A proteção contra fraude web trata de ameaças do lado do cliente que um WAF do lado do servidor não enxerga: credential stuffing, malware no navegador e abuso automatizado.",
          "O DataSafe cifra os campos de formulário na camada de aplicação, para que um keylogger ou um man-in-the-browser veja apenas texto cifrado.",
          "O Bot Defense distingue pessoas de automação; a proteção Credential Stuffing verifica se as credenciais estão entre as sabidamente comprometidas.",
          "O antifraude é comportamental: o sinal é como o client se comporta, e não só o que ele envia.",
          "Esses controles tratam o dispositivo do usuário como o elemento comprometido, e é essa a distinção que a prova faz.",
        ],
        // 3.04 Articulate architectural requirements for outbound SSL visibility
        "3.04": [
          "A visibilidade de SSL de saída existe porque as ferramentas de inspeção não conseguem examinar o que não conseguem decifrar.",
          "O SSL Orchestrator decifra uma vez e inspeciona várias vezes por meio de service chains, evitando o custo de decifrar em cascata.",
          "Topologias a conhecer: forward proxy transparente, forward proxy explícito e reverse proxy de entrada, cada uma com requisitos diferentes de posicionamento e de roteamento.",
          "O tratamento dos certificados é o ponto crucial da arquitetura: a inspeção de saída exige uma CA interna em que os clients confiem.",
          "A policy de bypass importa do ponto de vista legal e operacional: as categorias financeiras e de saúde costumam ficar fora da decifração.",
        ],
        // 3.05 Apply procedural concepts to configure network firewall protection
        "3.05": [
          "O AFM é um firewall de rede completo no BIG-IP, com regras organizadas em uma hierarquia de contextos: global, route domain, virtual server e self IP.",
          "A avaliação das regras segue a ordem dos contextos, e dentro de um contexto vence a primeira correspondência; entenda qual contexto um pacote alcança primeiro.",
          "A postura de default-deny ou de default-accept é uma decisão de desenho que o conjunto de regras precisa declarar explicitamente.",
          "As regras de firewall podem ficar em staging, sendo avaliadas antes de serem aplicadas, o que é o caminho seguro até a produção.",
          "Packet filters, regras do AFM e port lockdown nos self IPs são mecanismos distintos e fáceis de confundir.",
        ],
        // 3.06 Troubleshoot F5 technology to address functionality or performance issues
        "3.06": [
          "Comece pelo caminho do tráfego: o problema está no estabelecimento da conexão, na negociação TLS, na aplicação da policy ou no pool member?",
          "O tcpdump com o modificador p acompanha um fluxo pelos dois lados do proxy; é a técnica de captura mais útil no BIG-IP.",
          "O request logging e o log de eventos do AWAF dizem se uma requisição foi vista, se correspondeu a uma assinatura e se foi bloqueada ou permitida.",
          "Problemas de desempenho: verifique a CPU por TMM, a pressão sobre a tabela de conexões e se uma policy está inspecionando o corpo inteiro de payloads grandes.",
          "Mude uma variável por vez e confirme contra uma baseline que sabidamente funciona; é essa disciplina que o objetivo testa.",
        ],
        // 3.07 Verify a configuration is functioning as intended to mitigate a vulnerability
        "3.07": [
          "Verificar significa reproduzir o ataque com segurança e observar o bloqueio, e não reler a configuração.",
          "Use o próprio logging da policy para confirmar que a assinatura ou a violação foi acionada, com o request ID como âncora.",
          "Confirme também o caso negativo: o tráfego legítimo ainda precisa passar, e por isso uma verificação de falsos positivos faz parte do plano de verificação.",
          "Os períodos de staging e de enforcement readiness existem para que as novas assinaturas possam ser observadas antes de bloquear.",
          "Documente o teste, a evidência e a data; esse registro é o que satisfaz um auditor depois.",
        ],
        // 4.01 Analyze logs or other data sources for security incidents
        "4.01": [
          "Fontes: logs de eventos do AWAF, logs do AFM, request logging do LTM e logs do sistema, de preferência agregados em um SIEM.",
          "Correlacione pelo request ID, pelo IP de origem e pela janela de tempo; um único evento raramente conta a história.",
          "Procure padrões, e não ocorrências isoladas: a distribuição entre origens, a regularidade dos horários e a uniformidade do user-agent indicam automação.",
          "O high-speed logging tira o tráfego de logs do control plane, o que importa nos volumes de um incidente.",
          "O resultado da análise é uma avaliação do que aconteceu e se deu certo, e não só uma lista de requisições bloqueadas.",
        ],
        // 4.02 Determine the appropriate proactive security response plan
        "4.02": [
          "Um plano proativo faz o hardening antes do incidente: atualização de assinaturas, ritmo de staging das policies, assinatura do IP Intelligence em dia e backups testados.",
          "Defina antecipadamente o caminho de escalonamento e os limites, para que a decisão de bloquear de forma agressiva já esteja autorizada.",
          "A revisão regular do tráfego bloqueado e permitido mantém as policies ajustadas conforme a aplicação muda.",
          "Exercícios de mesa validam que o plano funciona com as pessoas que vão executá-lo.",
          "O trabalho proativo se mede pela redução do tempo de detecção e do tempo de mitigação, que é o que o objetivo pede.",
        ],
        // 4.03 Determine the appropriate incident response plan given specific attack details
        "4.03": [
          "Fases da resposta a incidentes: preparação, detecção e análise, contenção, erradicação, recuperação e lições aprendidas.",
          "No BIG-IP, a contenção pode ser imediata: uma iRule, uma mudança na policy de bloqueio ou uma shun list de IPs aplicada na borda.",
          "Adeque a resposta ao ataque: um flood volumétrico pede rate limiting e talvez scrubbing upstream, enquanto um exploit de aplicação pede um virtual patch.",
          "Preserve as evidências antes de mudar a configuração, porque a captura e os logs não podem ser recuperados depois.",
          "Depois do incidente, transforme a correção em um controle permanente e em uma regra de detecção, para que o mesmo ataque seja pego mais cedo na próxima vez.",
        ],
      },
    },
  },
  // 304: BIG-IP APM Specialist (304).
  "f5-cts-apm-304": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "80 questões (70 itens pontuados, 10 itens piloto/beta)",
      passMark: "245 (escala de 100 a 350)",
      cost: "US$180 por tentativa (sem impostos e taxas locais)",
      note: "Prova em computador, de múltipla escolha, aplicada nos centros de testes Pearson VUE (em inglês). Credencial concedida: F5 Certified Technology Specialist, APM. Pré-requisito: F5 Certified BIG-IP Administrator (F5-CA); o catálogo lista a certificação BIG-IP APM Specialist como pré-requisito da trilha Security Solutions Expert. O tempo de prova não inclui adaptações para quem não tem o inglês como língua nativa nem outras adaptações, e algumas questões trazem exhibits ou cenários. Depois de uma reprovação, a prova fica bloqueada por 15 dias (primeira reprovação), 30 dias (segunda), 45 dias (terceira), 365 dias (quarta) e 90 dias (quinta em diante).",
    },
    // Key points: the vendor's own blueprint sub-points, quoted, so they stay English (lang="en").
    keyPoints: { rule: "vendor-verbatim" },
  },
  // 303: BIG-IP ASM Specialist (303).
  "f5-cts-asm-303": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "80 questões (70 itens pontuados, 10 itens piloto/beta)",
      passMark: "245 (escala de 100 a 350)",
      cost: "US$180 por tentativa (sem impostos e taxas locais)",
      note: "Prova em computador, de múltipla escolha, aplicada nos centros de testes Pearson VUE (em inglês). Credencial concedida: F5 Certified Technology Specialist, BIG-IP ASM. Pré-requisito: F5 Certified BIG-IP Administrator (F5-CA); o catálogo lista a F5-CTS, BIG-IP ASM como pré-requisito da trilha Security Solutions Expert. O tempo de prova não inclui adaptações para quem não tem o inglês como língua nativa nem outras adaptações, e algumas questões trazem exhibits ou cenários. Depois de uma reprovação, a prova fica bloqueada por 15 dias (primeira reprovação), 30 dias (segunda), 45 dias (terceira), 365 dias (quarta) e 90 dias (quinta em diante).",
    },
    // Key points: the vendor's own blueprint sub-points, quoted, so they stay English (lang="en").
    keyPoints: { rule: "vendor-verbatim" },
  },
  // 302: BIG-IP DNS Specialist (302).
  "f5-cts-dns-302": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "80 questões (70 itens pontuados, 10 itens piloto/beta)",
      passMark: "245 (escala de 100 a 350)",
      cost: "US$180 por tentativa (sem impostos e taxas locais)",
      note: "Prova em computador, de múltipla escolha, aplicada nos centros de testes Pearson VUE (em inglês). Credencial concedida: F5 Certified Technology Specialist, BIG-IP DNS. Pré-requisito: F5 Certified BIG-IP Administrator (F5-CA). O tempo de prova não inclui adaptações para quem não tem o inglês como língua nativa nem outras adaptações, e algumas questões trazem exhibits ou cenários. Depois de uma reprovação, a prova fica bloqueada por 15 dias (primeira reprovação), 30 dias (segunda), 45 dias (terceira), 365 dias (quarta) e 90 dias (quinta em diante).",
    },
    // Key points: the vendor's own blueprint sub-points, quoted, so they stay English (lang="en").
    keyPoints: { rule: "vendor-verbatim" },
  },
  // F5CTSLTM1-B: BIG-IP LTM Specialist Base Configuration and Networking Setup.
  "f5-cts-ltm-base-config-networking": {
    // Key points: the vendor's own blueprint sub-points, quoted, so they stay English (lang="en").
    keyPoints: { rule: "vendor-verbatim" },
  },
  // F5CTSLTM3-B: BIG-IP LTM Specialist iRules, Analytics and Templates.
  "f5-cts-ltm-irules-analytics-templates": {
    // Key points: the vendor's own blueprint sub-points, quoted, so they stay English (lang="en").
    keyPoints: { rule: "vendor-verbatim" },
  },
  // F5CTSLTM5-B: BIG-IP LTM Specialist Packet Capture/Troubleshooting - TCP/UDP/Application Layer.
  "f5-cts-ltm-pcap-tcp-udp-app": {
    // Key points: the vendor's own blueprint sub-points, quoted, so they stay English (lang="en").
    keyPoints: { rule: "vendor-verbatim" },
  },
  // F5CTSLTM6-B: BIG-IP LTM Specialist Packet Capture/Troubleshooting - TLS/SSL.
  "f5-cts-ltm-pcap-tls-ssl": {
    // Key points: the vendor's own blueprint sub-points, quoted, so they stay English (lang="en").
    keyPoints: { rule: "vendor-verbatim" },
  },
  // F5CTSLTM4-B: BIG-IP LTM Specialist Software Upgrades, HA Configuration, and Device Monitoring.
  "f5-cts-ltm-upgrades-ha-monitoring": {
    // Key points: the vendor's own blueprint sub-points, quoted, so they stay English (lang="en").
    keyPoints: { rule: "vendor-verbatim" },
  },
  // F5CTSLTM2-B: BIG-IP LTM Specialist Virtual Server and Local Traffic Configuration Objects.
  "f5-cts-ltm-virtual-servers-config-objects": {
    // Key points: the vendor's own blueprint sub-points, quoted, so they stay English (lang="en").
    keyPoints: { rule: "vendor-verbatim" },
  },
  // F5CAN1: NGINX Management (F5CAN1).
  "f5-nginx-f5n1": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "Número de questões não publicado no catálogo nem no blueprint da certificação",
      passMark: "245",
      cost: "US$50 online, com supervisão remota / US$65 em centro de testes (sem impostos e taxas locais)",
      note: "Exam ID F5N1 na página da prova da F5. Online, com supervisão remota pela Certiverse (exige acesso à câmera), ou em centro de testes Pearson VUE, com supervisão presencial; em inglês; nível Administrator NGINX. Uma das quatro provas (feitas em qualquer ordem) que dão a F5 Certified Administrator, NGINX (F5-CA, NGINX); a certificação é baseada no NGINX Open Source Software (OSS).",
    },
    // Key points: the vendor's own blueprint sub-points, quoted, so they stay English (lang="en").
    keyPoints: { rule: "vendor-verbatim" },
  },
  // F5CAN2: NGINX Configuration: Knowledge (F5CAN2).
  "f5-nginx-f5n2": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "Número de questões não publicado no catálogo nem no blueprint da certificação",
      passMark: "245",
      cost: "US$50 online, com supervisão remota / US$65 em centro de testes (sem impostos e taxas locais)",
      note: "Exam ID F5N2 na página da prova da F5. Online, com supervisão remota pela Certiverse (exige acesso à câmera), ou em centro de testes Pearson VUE, com supervisão presencial; em inglês; nível Administrator NGINX. Uma das quatro provas (feitas em qualquer ordem) que dão a F5 Certified Administrator, NGINX (F5-CA, NGINX); a certificação é baseada no NGINX Open Source Software (OSS).",
    },
    // Key points: the vendor's own blueprint sub-points, quoted, so they stay English (lang="en").
    keyPoints: { rule: "vendor-verbatim" },
  },
  // F5CAN3: NGINX Configuration: Demonstrate (F5CAN3).
  "f5-nginx-f5n3": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "Número de questões não publicado no catálogo nem no blueprint da certificação",
      passMark: "245",
      cost: "US$50 online, com supervisão remota / US$65 em centro de testes (sem impostos e taxas locais)",
      note: "Exam ID F5N3 na página da prova da F5. Online, com supervisão remota pela Certiverse (exige acesso à câmera), ou em centro de testes Pearson VUE, com supervisão presencial; em inglês; nível Administrator NGINX. Uma das quatro provas (feitas em qualquer ordem) que dão a F5 Certified Administrator, NGINX (F5-CA, NGINX); a certificação é baseada no NGINX Open Source Software (OSS).",
    },
    // Key points: the vendor's own blueprint sub-points, quoted, so they stay English (lang="en").
    keyPoints: { rule: "vendor-verbatim" },
  },
  // F5CAN4: NGINX Troubleshoot (F5CAN4).
  "f5-nginx-f5n4": {
    // The exam-facts strings; the time limit and every number stay the English record's.
    examFacts: {
      questions: "Número de questões não publicado no catálogo nem no blueprint da certificação",
      passMark: "245",
      cost: "US$50 online, com supervisão remota / US$65 em centro de testes (sem impostos e taxas locais)",
      note: "Exam ID F5N4 na página da prova da F5. Online, com supervisão remota pela Certiverse (exige acesso à câmera), ou em centro de testes Pearson VUE, com supervisão presencial; em inglês; nível Administrator NGINX. Uma das quatro provas (feitas em qualquer ordem) que dão a F5 Certified Administrator, NGINX (F5-CA, NGINX); a certificação é baseada no NGINX Open Source Software (OSS).",
    },
    // Key points: the vendor's own blueprint sub-points, quoted, so they stay English (lang="en").
    keyPoints: { rule: "vendor-verbatim" },
  },
};
