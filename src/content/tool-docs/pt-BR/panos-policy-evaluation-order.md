# Ordem de avaliação de políticas PAN-OS

Cole uma base de regras que atravesse camadas do Panorama e regras locais do firewall. A ferramenta coloca tudo na ordem em que o PAN-OS realmente avalia, opcionalmente traça um fluxo até a regra que decide, e aponta as regras que nunca disparam porque algo acima delas já casa. Tudo roda no navegador.

## O problema que ela endereça

Um firewall isolado avalia uma lista ordenada, e lê-la é simples. Um firewall gerenciado por Panorama ou um tenant do Prisma Access, não. Ele avalia por camada e por tipo, nesta ordem:

1. Pre-rules compartilhadas
2. Pre-rules do device group
3. **Regras locais do firewall**
4. Post-rules do device group
5. Post-rules compartilhadas
6. Regras padrão

As regras locais que um administrador vê e edita no firewall ficam no meio de um sanduíche que ele não consegue editar a partir do firewall. É a surpresa mais comum num parque com Panorama: uma regra local aparentemente correta nunca roda, porque uma pre-rule compartilhada duas camadas acima já casou e a avaliação parou ali.

## Shadowing, e por que a ferramenta do próprio fabricante não reporta

O documento de boas práticas de política de segurança da Palo Alto é explícito quanto à lacuna:

> Commit and Push doesn't provide shadowing information.

Uma regra ampla colocada acima de uma específica captura o tráfego para o qual a específica foi escrita. A específica nunca dispara. Nada no push avisa, e o sintoma aparece depois, como tráfego tratado de um jeito que ninguém pretendia.

A ferramenta reporta shadowing e destaca dois casos. **Atravessar camada** importa porque uma regra local encoberta por uma pre-rule compartilhada não pode ser vista nem corrigida a partir do firewall; a correção vive no Panorama. **Ação divergente** importa porque significa que o resultado não é apenas redundante, é o oposto do que a regra encoberta pretendia.

O teste de shadowing é deliberadamente conservador. Ele reporta uma regra como encoberta apenas quando a regra acima é um superconjunto em todos os campos, ou seja, todo pacote que a regra de baixo poderia casar já foi tomado. Sobreposições parciais não são reportadas, porque sobreposição parcial costuma ser intencional, e um relatório de shadowing que grita lobo é um relatório que ninguém lê, o que seria pior do que a posição atual do fabricante de não reportar nada.

## As regras padrão não são simétricas

No fim de toda base de regras ficam duas regras padrão, e elas fazem coisas opostas:

- **intrazone-default** permite todo tráfego dentro de uma zona
- **interzone-default** nega todo tráfego entre zonas

Um modelo que tratasse "nada casou" como um deny implícito único estaria errado para todo fluxo dentro da mesma zona. A ferramenta aplica a regra padrão que as zonas exigem e diz qual usou.

As duas podem ser alteradas para registrar log ou aplicar perfis de segurança, o que vale a pena: tráfego que chega às regras padrão é tráfego que nenhuma regra previu.

## Escrevendo uma base de regras para a ferramenta

Uma regra por linha. A camada vem primeiro, de propósito: é justamente o que esta ferramenta existe para revelar, e uma gramática que permitisse omitir deixaria você esquecer exatamente aquilo que veio conferir.

```
shared-pre | block-tor      | deny  | from=any to=any app=tor
dg-pre     | allow-dns      | allow | from=trust to=untrust app=dns svc=application-default
local      | web-out        | allow | from=trust to=untrust app=web-browsing
dg-post    | catch-all-deny | deny  | from=any to=any
```

Campos são `chave=valor`, com vírgulas dentro do valor para listas. O que for omitido vira `any`, que é o que o PAN-OS faz. Chaves aceitas: `from`, `to`, `src`, `dst`, `app`, `svc`, `user`. Ações: `allow`, `deny`, `drop`, `reset-client`, `reset-server`, `reset-both`.

## O que ela não faz

Não lê sua configuração, não conecta ao Panorama, não coleta nada. Não modela mudança de App-ID no meio da sessão, perfis de segurança, NAT nem política de decriptação. Ela raciocina sobre a **ordem** das regras que você fornece, que é a parte decidida no commit e a parte difícil de enxergar.

## Nota sobre autorização

Este site não declara nenhuma autorização ou parceria com a Palo Alto Networks. A ferramenta raciocina sobre ordem de avaliação publicada na documentação da própria Palo Alto. É análise de especificação pública, não material do fabricante, e não carrega endosso algum.

## Fontes

- Palo Alto Networks, *Device Groups*: o firewall avalia regras por camada e por tipo, de cima para baixo; regras locais aparecem entre as pre-rules e as post-rules
- Palo Alto Networks, *Security Policy Rulebase Best Practices*: o primeiro casamento vence e a comparação para; Commit and Push não fornece informação de shadowing
- Palo Alto Networks, *Security Policy Rule Best Practices*: shadowing definido; intrazone-default permite e interzone-default nega
- Palo Alto Networks, *Defining Policies on Panorama*: pre-rules são avaliadas primeiro, post-rules por último
