## O que faz

Cole duas políticas de segurança declarativas do F5 AWAF - Advanced WAF (antigo BIG-IP ASM - Application Security Manager) — uma antes e uma depois — e ela as compara e classifica cada mudança relevante para segurança como afrouxamento ou aperto. Ela existe para responder a única pergunta que importa depois de uma sessão de ajuste: isto abriu uma brecha? Roda inteiramente no seu navegador e nunca contata um BIG-IP.

## A distinção que faz

Nem todo afrouxamento é perigoso. Adicionar uma URL ou parâmetro permitido é uma ampliação delimitada de entidade única — a forma normal e correta de resolver um falso positivo. O que merece escrutínio é um afrouxamento que amplia a proteção por toda a política: mudar o enforcement para Transparent (que para toda a política de bloquear), desabilitar uma violação ou uma evasion, desligar o Data Guard, confiar em um header X-Forwarded-For fornecido pelo cliente, mover signatures para staging, ou adicionar uma entidade wildcard que casa com muitas URLs de uma vez. A ferramenta separa esses afrouxamentos para toda a política dos delimitados, para que um diff de ajuste não vire silenciosamente uma regressão de segurança.

## O veredito

Se houver qualquer afrouxamento para toda a política, o veredito é "abriu uma brecha", e essas mudanças são listadas primeiro, cada uma com um nível de preocupação. Se as ampliações permanecerem por entidade, o veredito é "apenas mudanças delimitadas" — a zona segura para ajuste de falso positivo. Se toda mudança aumentar a proteção, é "apertado". Ela também lista os apertos para você ver o quadro completo do que mudou entre as duas políticas.

## O que compara

Ela lê as seções relevantes para segurança que o schema de política declarativa do F5 define: enforcementMode, staging de signature-settings, general.trustXff, data-guard, csrf-protection, os block flags por violação sob blocking-settings, a habilitação por evasion, e as listas de entidades URL, parâmetro e tipo de arquivo (onde um nome contendo asterisco é tratado como wildcard). Esses são os mesmos caminhos de campo validados no explicador de política declarativa e no explicador de evasion.

## Grounding

A semântica de afrouxamento segue o schema de política declarativa de WAF do F5 e a documentação do ASM sobre como uma política Transparent e um block flag limpo param o enforcement, junto com a regra do K70544352 de que você relaxa apenas onde um falso positivo ocorreu e o delimita. Nenhuma das políticas que você cola é enviada ou sai da página.
