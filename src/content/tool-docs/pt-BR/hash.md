## O que faz

Digite um texto e obtenha seus resumos SHA-1, SHA-256, SHA-384 e SHA-512, cada um mostrado em hexadecimal e em Base64. O cálculo é feito pelo Web Crypto nativo do navegador (`crypto.subtle.digest`), e não por uma implementação empacotada, então os valores correspondem ao que qualquer plataforma em conformidade produz. Os quatro resumos são calculados de uma vez, então trocar qual deles você vê nunca recalcula. Tudo acontece no seu navegador.

## O que é um hash criptográfico

Um hash criptográfico mapeia uma entrada de qualquer tamanho para um resumo de tamanho fixo, com algumas propriedades que o definem: é determinístico (a mesma entrada sempre dá o mesmo resumo), unidirecional (você não consegue recuperar a entrada a partir do resumo) e resistente a colisões (é inviável encontrar duas entradas com o mesmo resumo). Mudar um único bit da entrada muda cerca de metade dos bits da saída, então um resumo não revela o quão parecidas duas entradas são. Aqui a entrada é resumida como seus bytes UTF-8.

## Os quatro algoritmos

Todos os quatro são definidos na FIPS 180-4, com código de referência e vetores de teste também na RFC 6234. Eles diferem no tamanho do resumo:

- **SHA-1** produz 160 bits (40 caracteres hex). Ainda é bastante visto, mas está quebrado quanto à resistência a colisões, então não deve ser usado onde um atacante possa forjar as entradas; continua adequado para checksums e para verificar contra sistemas legados.
- **SHA-256** produz 256 bits (64 caracteres hex) e é o padrão moderno.
- **SHA-384** produz 384 bits (96 caracteres hex).
- **SHA-512** produz 512 bits (128 caracteres hex).

## Hex e Base64

O resumo é uma sequência de bytes; hex e Base64 são apenas duas formas de escrever esses mesmos bytes. O hex usa dois caracteres por byte e é a forma comum na maioria das ferramentas; o Base64 é mais compacto e é o que aparece em lugares como atributos de Subresource Integrity.

## Exemplo

- O SHA-256 de `abc` é `ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad`, o vetor de teste padrão da especificação SHA.

## Como usar

Digite ou cole um texto e leia os quatro resumos. Como um hash é unidirecional, esta ferramenta não consegue transformar um resumo de volta na sua entrada; recuperar uma entrada só é viável quando ela tinha pouquíssima entropia, o que o Localizador de Pré-imagem de Hash demonstra.
