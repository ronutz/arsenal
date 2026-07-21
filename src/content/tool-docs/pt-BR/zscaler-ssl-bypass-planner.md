# Planejador de Bypass SSL do ZIA

## O que ele faz

Cole uma lista de aplicações ou destinos - um por linha, numa gramática de quatro campos - e receba um plano determinístico de inspeção TLS. Cada ativo recebe um de três vereditos: **Inspecionar** (o padrão, que alimenta todos os engines de conteúdo), **Do Not Inspect via regra de política** (a isenção no Edge para categorias de governança e para aplicações com pinning em caminhos que nenhum agente controla), ou **bypass no Client Connector** (a isenção mais limpa para aplicações com pinning onde o ZCC controla o caminho - o tráfego nunca entra no túnel, pareada com uma regra de política como defesa em profundidade). Todo veredito carrega seu raciocínio referenciado; todo bypass carrega um livro-razão de pontos cegos nomeando o que deixa de ver este fluxo; e sempre que algo fica sem inspeção, o plano anexa a checklist de salvaguardas externas - a ação de Untrusted Server Certificates, OCSP via stapling, o piso de Minimum TLS Version e o Block No-SNI.

## A gramática

Um ativo por linha, quatro campos separados por barra vertical; linhas começando com `#` são comentários:

```
<nome> | pinned|clean | regulated|general | agent|no-agent
```

`pinned` marca uma aplicação com certificate pinning (ela não aceita um certificado regenerado sob a CA de inspeção e falha fechada sob interceptação). `regulated` marca uma categoria de governança que política ou lei exige manter selada. `agent` marca um caminho que o Zscaler Client Connector controla.

## Lendo o plano

O resumo conta os vereditos; os cartões percorrem o raciocínio de cada ativo; a nota de ordenação carrega a doutrina de que as exceções Do Not Inspect pertencem à ordem alta, acima do corpo de Inspect, porque as regras da política SSL avaliam em ordem crescente com primeira correspondência. Quando todos os ativos inspecionam, não há livro-razão de bypass nem dívida de salvaguardas - e o plano diz isso.

## Honestidade

A gramática é um subconjunto de ensino deliberado: o planejamento real de bypass também escopa regras por usuários, grupos e localidades, e pesa especificidades de aplicação que este planejador não modela. A lógica de decisão - pinning força uma isenção, governança sela uma categoria, todo o resto inspeciona, e cada bypass é um ponto cego com preço - é a parte durável. Todo o cálculo é local; os nomes dos seus ativos nunca saem da página.

## Fontes

Fundamentado na documentação de inspeção SSL da Zscaler (Configuring the SSL/TLS Inspection Policy; About SSL Inspection) e na arquitetura de referência de Data Protection, data de acesso 2026-07-21. O artigo Learn pareado é *Inspeção SSL no ZIA: Política e Bypasses*.
