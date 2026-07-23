# Explicador de filtros LDAP

Cole qualquer filtro de busca LDAP e esta ferramenta o analisa exatamente como um servidor de diretório faria - conforme a RFC 4515, a representação em string na qual todo cliente LDAP, busca do PingDirectory, consulta de datastore do PingFederate e query do Active Directory se compila no fim das contas.

## O que você recebe

A árvore anotada. Cada nó AND (`&`), OR (`|`) e NOT (`!`) declara sua regra em linguagem simples; cada item folha é classificado por tipo de correspondência - igualdade, presença (`=*`), substring (curingas, com as partes inicial/contém/termina-com em ordem), `>=`, `<=`, aproximada (`~=`) ou correspondência extensível. Os escapes hexadecimais da RFC 4515 (`\2a`, `\28`, `\29`, `\5c`) são decodificados e listados. Os famosos OIDs de regras de correspondência do Active Directory são reconhecidos pelo nome: `1.2.840.113556.1.4.803` (bit-AND - o clássico teste de conta desabilitada `(userAccountControl:1.2.840.113556.1.4.803:=2)`), `804` (bit-OR) e `1941` (pertencimento transitivo a grupos).

## Erros ancorados

Um filtro malformado falha com a posição exata do caractere e um circunflexo embaixo dele - o parêntese desbalanceado, o item sem `=`, a barra invertida sem seus dois dígitos hexadecimais.

## Privacidade

Filtros frequentemente contêm nomes internos de atributos e estrutura de OUs. Tudo é analisado localmente no seu navegador; nada é transmitido.
