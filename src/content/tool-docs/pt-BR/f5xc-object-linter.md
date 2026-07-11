## O que faz

Esta ferramenta é um linter para objetos de configuração do F5 Distributed Cloud (XC). Cole um objeto origin_pool, http_loadbalancer, ou app_firewall - da visão JSON do Console ou da API - e ela sinaliza configurações que são arriscadas, surpreendentes, ou prováveis erros, cada uma com uma severidade e uma explicação curta fundamentada na documentação da F5. Roda inteiramente no seu navegador, e não introduz nenhum schema novo: cada regra reusa as estruturas de objeto verificadas para as outras ferramentas desta família.

## O que ela verifica

Para um origin pool, o linter sinaliza TLS para o origin com verificação do servidor pulada (a conexão é criptografada mas o certificado do origin não é validado), SNI desabilitado, texto puro para o origin, um health check ausente, e um único origin server sem redundância. Para um HTTP load balancer, ela sinaliza nenhum WAF anexado, um listener HTTP puro sem HTTPS, HTTPS configurado sem um redirect de HTTP para HTTPS, uma rota que desabilita o WAF, uma rota catch-all colocada antes de outras rotas (que nunca conseguem dar match sob avaliação por primeiro match), e um domínio wildcard misturado com seu apex. Para um WAF, ela sinaliza modo de monitoramento (detecta mas não bloqueia) e threat campaigns desabilitados.

## Severidade e fundamentação

Cada finding carrega uma severidade - alta, aviso, ou info - e a lista é ordenada com a mais séria primeiro. Alta é reservada para uma configuração que enfraquece materialmente a segurança, como pular a verificação do origin. Aviso cobre configurações que geralmente estão erradas, como nenhum WAF ou uma rota sombreada. Info cobre coisas que vale saber mas frequentemente são intencionais, como um único origin. Cada regra cita a fonte da F5 na qual se baseia, então um flag é um ponto de partida para uma decisão em vez de um veredito - algumas dessas configurações são a escolha certa no contexto, e o linter diz por que cada uma importa para que você decida.

## O que ela não é

O linter lê um objeto por vez e raciocina apenas sobre o que está dentro dele. Ele não consegue ver se um WAF referenciado por nome está ele mesmo em modo de monitoramento, ou se um origin pool referenciado por uma rota carrega um peso - esses vivem em outros objetos. É uma primeira passada rápida sobre as próprias configurações de um único objeto, não uma auditoria completa de configuração.
