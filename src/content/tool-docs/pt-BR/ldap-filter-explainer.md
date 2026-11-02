# Explicador de filtros LDAP

Cole qualquer filtro de busca LDAP e esta ferramenta o analisa exatamente como um servidor de diretório faria - conforme a RFC 4515, a representação em string na qual todo cliente LDAP, busca do PingDirectory, consulta de datastore do PingFederate e query do Active Directory se compila no fim das contas.

## O que você recebe

A árvore anotada. Cada nó AND (`&`), OR (`|`) e NOT (`!`) declara sua regra em linguagem simples; cada item folha é classificado por tipo de correspondência - igualdade, presença (`=*`), substring (curingas, com as partes inicial/contém/termina-com em ordem), `>=`, `<=`, aproximada (`~=`) ou correspondência extensível. Os escapes hexadecimais da RFC 4515 (`\2a`, `\28`, `\29`, `\5c`) são decodificados e listados. Os famosos OIDs de regras de correspondência do Active Directory são reconhecidos pelo nome: `1.2.840.113556.1.4.803` (bit-AND - o clássico teste de conta desabilitada `(userAccountControl:1.2.840.113556.1.4.803:=2)`), `804` (bit-OR) e `1941` (pertencimento transitivo a grupos).

## Erros ancorados

Um filtro malformado falha com a posição exata do caractere e um circunflexo embaixo dele - o parêntese desbalanceado, o item sem `=`, a barra invertida sem seus dois dígitos hexadecimais.

## Privacidade

Filtros frequentemente contêm nomes internos de atributos e estrutura de OUs. Tudo é analisado localmente no seu navegador; nada é transmitido.

## Compartilhar resultado

Abaixo das contagens do filtro, o botão **Compartilhar resultado** cria um link para esta página, só quando você clica, que leva o filtro como foi digitado depois do `#`, inclusive um que não passa na análise: o erro ancorado dele é a leitura que você talvez queira mostrar. O popover dele diz primeiro o que o link leva e depois um aviso próprio: um filtro pode trazer usuários, grupos e a estrutura do seu diretório, então leia antes de mandar o link. Em seguida oferece Copiar link e, onde o navegador tiver, a tela de compartilhamento do sistema; o endereço da página não muda.

Um filtro que compara um valor de atributo de senha não ganha link, e o popover cita o atributo: `userPassword` ([RFC 4519](https://www.rfc-editor.org/rfc/rfc4519), seção 2.41, OID 2.5.4.35, "octet strings that are known only to the user and the system", sequências de octetos que só o usuário e o sistema conhecem), `authPassword` ([RFC 3112](https://www.rfc-editor.org/rfc/rfc3112), OID 1.3.6.1.4.1.4203.1.3.4) e o `unicodePwd` do Active Directory ([esquema do AD da Microsoft](https://learn.microsoft.com/en-us/windows/win32/adschema/a-unicodepwd), attribute ID 1.2.840.113556.1.4.90), todos lidos em 2026-11-01. Eles são reconhecidos pelo nome ou pelo OID, em maiúsculas ou minúsculas e com quaisquer opções, já que a [RFC 4512](https://www.rfc-editor.org/rfc/rfc4512) (seção 2.5, lida em 2026-11-01) torna as descrições de atributo insensíveis a maiúsculas, com opções depois de um `;`. Um teste de presença como `(userPassword=*)` não leva valor nenhum e vai.

A [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (seção 3.5, lida em 2026-11-01) diz que o fragmento é "separated from the rest of the URI prior to a dereference" (separado do resto do URI antes de o recurso ser buscado), então o filtro não é enviado ao servidor quando o link é aberto; ele fica na barra de endereço e no histórico de quem abre, e qualquer pessoa com o link consegue lê-lo.

- **Tamanho.** No máximo 16.384 caracteres, o limite que o site usa para todo valor depois do `#`; um filtro maior não ganha link, e o popover diz o tamanho dele.
- **Ao abrir um link.** O filtro preenche a caixa e a página o explica como numa colagem; nada é enviado a um diretório. Um filtro que compara uma senha é ignorado. Nos dois casos o valor sai do endereço da página na hora, sem nenhuma requisição, então recarregar a página ou usar o botão Compartilhar da própria página não leva nada.
