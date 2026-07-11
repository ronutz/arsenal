## O que faz

Esta ferramenta responde a uma pergunta precisa do F5 Distributed Cloud (XC): dados vários HTTP load balancers e suas listas de domínio, qual deles serve um hostname específico? Cole os load balancers como um array JSON e um hostname de teste, e o resolvedor nomeia o load balancer e a entrada de domínio vencedores, mostra o porquê, e sinaliza os perigos de configuração que fazem o match de domínio dar errado. Roda inteiramente no seu navegador.

## Como o XC escolhe um load balancer

Quando uma requisição chega, o XC já estreitou as coisas para os load balancers que compartilham o IP e porta de destino (a advertise policy). Entre esses, ele escolhe o match de domínio mais específico. Um FQDN exato - app.example.com listado literalmente - vence um wildcard como *.example.com. O hostname no qual ele casa vem do valor SNI quando o cliente usa HTTPS, ou do header Host quando o cliente usa HTTP puro. Se nada dá match e um load balancer está marcado como o Default para aquela advertise policy, o Default pega a requisição; se não há Default, o hostname não é capturado de forma alguma.

## Wildcards e o apex

Um domínio wildcard é um match de sufixo: *.example.com cobre foo.example.com, mas não cobre o apex example.com, e um certificado TLS wildcard só cobre um único label. É por isso que servir tanto www.example.com (ou qualquer subdomínio) quanto o example.com puro precisa que o apex seja adicionado como seu próprio domínio. A ferramenta torna a distinção wildcard-versus-apex explícita em cada resultado.

## Os perigos que ela sinaliza

O match de domínio quebra de algumas formas reconhecíveis, e a ferramenta avisa sobre cada uma. Configurar tanto um wildcard (*.example.com) quanto seu apex (example.com) em load balancers diferentes que usam certificados automáticos é algo que a F5 especificamente desaconselha. Dois load balancers reivindicando o mesmo domínio exato, ou dois marcados como Default na mesma advertise policy (só um é permitido), são conflitos. Um hostname que dá match em duas entradas com especificidade igual é ambíguo. E um hostname multi-label que dá match em um wildcard vai rotear mas pode falhar a validação do certificado, já que o certificado wildcard cobre apenas um label.
