## O que faz

Cole perfis de persistência e virtual servers do BIG-IP como um trecho de tmsh e a ferramenta explica a persistência por trás de cada um: qual método é, em que ele se baseia, como se comporta, os campos que importam e as formas como ele falha na prática. Para cada virtual server, ela também apresenta a cadeia de persistência, o método primário e o fallback usado quando o primário não produz nenhum registro. Ela analisa a configuração no seu navegador e não contata nenhum equipamento.

## O que é persistência, e por que o método importa

Persistência, também chamada de afinidade de sessão, mantém um cliente fixado no mesmo membro do pool ao longo de várias conexões, o que aplicações com estado precisam para que uma sessão iniciada em um servidor continue naquele servidor. O BIG-IP oferece vários métodos, e o importante é que cada um se baseia em algo diferente, então cada um tem seu próprio modo de falha. Escolher um método é, na verdade, escolher em que se basear e aceitar como essa base pode quebrar.

## Os métodos comuns e como eles falham

- A persistência por **endereço de origem** baseia-se no endereço IP do cliente. Sua falha clássica é muitos clientes chegando por trás de um único NAT ou proxy: eles compartilham um endereço, então todos se fixam em um membro do pool e a carga fica desbalanceada. Também quebra se o endereço de um cliente muda no meio da sessão.
- A persistência por **cookie** baseia-se em um cookie HTTP que o BIG-IP gerencia, em modos que inserem, reescrevem ou leem o cookie passivamente. É precisa, mas exige HTTP e um cliente que aceite cookies, então não se aplica a tráfego não HTTP.
- A persistência por **SSL** baseia-se no ID de sessão TLS. Ela falha quando os clientes rotacionam ou renegociam os IDs de sessão, ou quando os IDs de sessão têm vida curta, e é por isso que ela é tão frequentemente combinada com um fallback.
- A persistência **universal** baseia-se em um valor que uma iRule extrai do tráfego, o que permite persistir em quase qualquer coisa (um token, um cabeçalho, um campo) ao custo de escrever a regra.

Configurações como match-across-services, match-across-virtuals e match-across-pools ampliam o escopo sobre o qual um registro de persistência se aplica, e a ferramenta as lê onde estão definidas.

## A cadeia primário e fallback

Um virtual server pode nomear um perfil de persistência primário e um de fallback. Quando o método primário não encontra um registro existente para uma conexão, o BIG-IP usa o fallback para posicioná-la. Uma combinação conhecida é a persistência por ID de sessão SSL com endereço de origem como fallback, para que um cliente cujo ID de sessão ainda não é conhecido continue fixado pelo IP. A ferramenta mostra essa cadeia por virtual server para você ver o que de fato decide um membro. Para os bytes dentro de um cookie de persistência especificamente, o decodificador de cookie de persistência do BIG-IP é a ferramenta companheira; esta aqui explica o método em torno dele.

## Como usar

Cole perfis de persistência, virtual servers ou ambos, e leia o método, a base, os campos e os modos de falha de cada um, além da cadeia de primário para fallback por virtual server. A análise é determinística e local.
