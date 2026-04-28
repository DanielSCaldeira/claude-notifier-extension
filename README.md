# Claude Notifier Pro

Extensao Chrome Manifest V3 para monitorar o limite de uso do Claude e enviar uma notificacao via ntfy assim que a janela de uso for liberada novamente.

Agora a extensao possui internacionalizacao com catalogos para `pt-BR`, `en` e `es`.

O popup permite escolher o idioma da interface e das notificacoes entre modo automatico, portugues do Brasil, ingles e espanhol.

O projeto foi construído para um fluxo simples:

1. O usuario configura um `Org ID` do Claude e um topico do `ntfy` no popup da extensao.
2. O service worker consulta periodicamente a API de uso do Claude usando a sessao autenticada do navegador.
3. Quando o limite de 5 horas estiver esgotado, a extensao para de fazer polling recorrente e agenda uma verificacao pontual para o horario estimado de liberacao.
4. Quando a liberacao for confirmada, a extensao publica uma mensagem no topico configurado do `ntfy`.

## Objetivo do projeto

Evitar que o usuario precise verificar manualmente o site do Claude para descobrir quando o uso foi liberado novamente.

O foco da extensao e:

- Monitorar disponibilidade do Claude em segundo plano.
- Reaproveitar a sessao autenticada ja existente no navegador.
- Enviar um alerta remoto para celular, desktop ou qualquer cliente inscrito no topico do `ntfy`.
- Permitir uma consulta manual de status direto no popup.

## Acessibilidade

O popup foi ajustado para seguir boas praticas basicas de acessibilidade em extensoes:

- navegacao por teclado com formulario semantico e foco visivel;
- campos associados explicitamente aos textos de ajuda com `aria-describedby`;
- estados de erro anunciados por leitor de tela com `role="alert"` e `aria-live="assertive"`;
- suporte a `prefers-reduced-motion` para reduzir animacoes e transicoes;
- textos auxiliares localizados tambem em elementos nao visuais, como descricoes de links externos e QR Code.

## Testes automatizados

O projeto agora possui testes automatizados para os dois pontos mais criticos:

- regras de negocio do service worker em `background.js`;
- fluxo de interface e integracao do popup em `popup.js`.

### Como instalar dependencias

Na raiz do projeto, execute:

```bash
npm install
```

### Como rodar os testes

Na raiz do projeto, execute:

```bash
npm test
```

## Build de producao

O projeto agora possui um pipeline simples de release para Chrome Extension:

```bash
npm run build
```

Esse comando:

- gera a pasta `dist/` pronta para carregar em `chrome://extensions`;
- gera automaticamente uma nova versao de extensao no artefato final;
- minifica `js`, `css` e `html`;
- remove comentarios legais e nao gera source maps;
- preserva `manifest.json`, `_locales/` e `assets/`.

A versao publicada passa a ser gerada automaticamente no formato `major.minor.yyDDD.build`, onde:

- `major.minor` vem de `chromeVersionBase` em `package.json`;
- `yyDDD` representa ano e dia do ano em UTC;
- `build` e um sequencial monotonicamente crescente para evitar repeticao entre builds.

Importante: o `manifest.json` da raiz continua sendo a base do projeto. A versao efetiva usada para submissao e escrita no `dist/manifest.json` durante o build.

Para gerar o pacote final de submissao na Chrome Web Store:

```bash
npm run package
```

O arquivo `.zip` sera criado em `release/` com o nome baseado no `manifest.json`.

Se quiser validar tudo antes de publicar:

```bash
npm run release
```

Esse comando roda a suite de testes e, se tudo passar, gera o `.zip` final.

## Publicacao na Chrome Web Store

Fluxo recomendado:

1. Atualize a versao em `manifest.json`.
2. Rode `npm run release`.
3. Abra `chrome://extensions`, ative `Developer mode` e use `Load unpacked` apontando para `dist/`.
4. Valide popup, service worker, alarmes, notificacoes e internacionalizacao.
5. Suba o `.zip` da pasta `release/` no painel da Chrome Web Store.
6. Revise os formulários de privacidade, justificativa de permissoes e uso de dados antes de enviar para analise.

Para iniciar uma nova linha de versao, altere `chromeVersionBase` em `package.json`. Exemplo: de `1.1` para `1.2`.

Antes de submeter, adapte e publique tambem a politica em [PRIVACY.md](PRIVACY.md). O texto serve como base para a URL de privacidade e para o questionario de uso de dados da Chrome Web Store.

Se quiser uma versao ja pronta para publicar em GitHub Pages, use [docs/claude-notifier-pro-policy-page.md](docs/claude-notifier-pro-policy-page.md) como texto-base da pagina publica.

Se voce quiser estruturar um repositorio separado de politicas, os textos-base estao aqui:

- descricao generica do projeto em [docs/extension-policies-project-description.md](docs/extension-policies-project-description.md);
- README generico da raiz em [docs/extension-policies-root-readme.md](docs/extension-policies-root-readme.md);
- README da extensao em [docs/extension-policies-claude-notifier-pro-readme.md](docs/extension-policies-claude-notifier-pro-readme.md).

Checklist de publicacao:

- manter a descricao coerente com as permissoes pedidas (`alarms`, `tabs`, `storage`, `notifications`);
- explicar claramente por que a extensao acessa `claude.ai` e `ntfy.sh`;
- declarar tambem o uso de `quickchart.io` se mantiver o QR Code remoto da secao de apoio;
- informar se dados do usuario ficam apenas em `chrome.storage.local`;
- revisar screenshots, icones e texto promocional a cada versao;
- evitar permissões amplas desnecessarias, porque isso aumenta chance de rejeicao.

## Engenharia reversa e endurecimento

Em extensoes Chrome nao existe protecao total contra engenharia reversa. Tudo o que vai para o navegador pode ser inspecionado por um usuario determinado. O objetivo realista e aumentar o custo da analise e evitar expor segredos.

Boas praticas aplicadas neste projeto:

- minificacao de `js`, `css` e `html` para reduzir legibilidade imediata;
- pacote final sem source maps;
- distribuicao a partir de `dist/`, separando codigo-fonte de artefato de release.

Boas praticas que voce deve seguir:

- nunca embutir segredos, tokens privados ou credenciais no codigo da extensao;
- se houver alguma logica sensivel, mova para um backend proprio e deixe a extensao consumir uma API;
- prefira minificacao a ofuscacao agressiva, porque ofuscadores pesados podem quebrar MV3 e chamar atencao na revisao da loja;
- nao use codigo remoto, `eval` ou carregamento dinamico proibido pela politica da Chrome Web Store;
- reduza ao minimo as permissoes e `host_permissions`.

Importante: valores como topicos, identificadores e qualquer script entregue no pacote devem ser tratados como publicos do ponto de vista de engenharia reversa.

### O que a suite cobre

- bloqueio do Claude e agendamento do alarme de desbloqueio;
- retorno ao polling quando o uso e liberado;
- prevencao de abertura repetida da aba do Claude em falhas de autenticacao;
- carregamento de configuracao salva no popup;
- salvamento da configuracao;
- envio de notificacao de teste;
- consulta manual de status pelo popup.

## Escopo funcional

O projeto implementa quatro capacidades principais:

- Persistencia local da configuracao do usuario.
- Consulta do uso da organizacao do Claude.
- Agendamento automatico de verificacoes com `chrome.alarms`.
- Envio de notificacao externa via `https://ntfy.sh`.
- Exibicao complementar de notificacao local via `chrome.notifications`.

O projeto nao implementa:

- Cadastro ou descoberta automatica do `Org ID`.
- Autenticacao propria no Claude.
- Backend proprio.
- Historico de eventos ou dashboard analitico.

## Estrutura do projeto

```text
.
├── assets/
│   └── icons/
│       ├── icon-128.png
│       └── icon.svg
├── manifest.json
├── package.json
├── package-lock.json
├── README.md
├── src/
│   ├── background/
│   │   └── background.js
│   ├── popup/
│   │   ├── popup.css
│   │   ├── popup.html
│   │   └── popup.js
│   └── shared/
│       └── shared-notifications.js
└── tests/
```

### manifest.json

Define a extensao Manifest V3, registra o service worker, configura o popup e declara permissoes.

Permissoes usadas:

- `alarms`: agenda as verificacoes automaticas.
- `tabs`: abre `claude.ai` quando a extensao precisa que a sessao seja revalidada.
- `storage`: salva `topic`, `orgId` e `resetAt` localmente.

Host permissions usadas:

- `https://claude.ai/*`: consulta a API de uso da organizacao.
- `https://ntfy.sh/*`: publica mensagens no topico configurado.

### src/background/background.js

E o nucleo da regra de negocio. O arquivo:

- consulta a API `https://claude.ai/api/organizations/{orgId}/usage` com `credentials: include`;
- interpreta a janela `five_hour` retornada pela API;
- decide se Claude esta disponivel ou bloqueado;
- salva o horario de reset em `chrome.storage.local`;
- alterna entre polling recorrente e verificacao pontual;
- dispara a notificacao de liberacao via `ntfy`;
- responde mensagens do popup para consulta manual de status.

### src/popup/popup.html

Define a interface da extensao. O popup possui:

- campo para `Org ID do Claude`;
- campo para `Topico do ntfy`;
- botao para salvar configuracao;
- botao para enviar notificacao de teste;
- botao para verificar o status atual do Claude;
- area de feedback textual para sucesso, erro e informacao.

### src/popup/popup.js

Controla a interacao do popup. O arquivo:

- carrega dados salvos no `chrome.storage.local`;
- valida entradas do formulario;
- persiste configuracoes;
- envia notificacao de teste para o `ntfy`;
- solicita ao background uma consulta manual de status;
- atualiza o feedback visual do usuario.

### src/shared/shared-notifications.js

Centraliza a integracao com o `ntfy` para evitar duplicacao entre popup e service worker. O arquivo:

- monta a requisicao HTTP para o `ntfy`;
- padroniza headers e URL base;
- expoe a funcao compartilhada `sendNtfyNotification` em `globalThis.__claudeNotifierShared`.

### src/popup/popup.css

Responsavel apenas pela apresentacao visual do popup, com tema dark e estados visuais para informacao, sucesso e erro.

## Como a extensao funciona

### 1. Inicializacao

Quando o service worker sobe, ele executa `initializeScheduling()`.

Fluxo:

1. Le `resetAt` salvo localmente.
2. Se existir um reset futuro, agenda uma verificacao unica para o horario de desbloqueio.
3. Se nao existir reset futuro valido, limpa o estado salvo, agenda polling recorrente e faz uma consulta imediata.

### 2. Consulta da API do Claude

A consulta de uso acontece em `fetchUsage()`.

Caracteristicas relevantes:

- Usa o `orgId` informado manualmente ou o `DEFAULT_ORG_ID` hardcoded.
- Faz requisicao autenticada com cookies do navegador.
- Trata `401` e `403` como problema de autenticacao.
- Trata falhas de rede e respostas HTTP nao OK como indisponibilidade operacional.

### 3. Avaliacao do estado do Claude

A funcao `evaluateClaudeState()` concentra a decisao principal.

Ela inspeciona:

- `usage.five_hour.utilization`
- `usage.five_hour.resets_at`

Com isso, ela classifica o estado em:

- `blocked`: utilizacao maior ou igual a `100` e reset ainda no futuro.
- `available`: uso abaixo do limite ou janela ja renovada.
- `auth`: sessao inexistente ou invalida.
- `unavailable`: falha operacional, rede ou resposta inesperada.

## Regras de negocio

Esta secao descreve o comportamento efetivamente implementado no codigo.

### Regra 1: a sessao do Claude precisa existir no navegador

A extensao nao autentica o usuario. Ela depende da sessao ativa em `claude.ai` no mesmo navegador da extensao.

Consequencia:

- Sem login valido, a consulta retorna estado `auth`.
- Em verificacoes automáticas, a extensao tenta abrir uma aba do Claude uma unica vez para induzir a recuperacao da sessao.
- Na consulta manual pelo popup, a extensao nao abre aba automaticamente.

### Regra 2: o topico do ntfy e obrigatorio para alerta remoto

Sem `topic`, a extensao ainda consegue consultar o status do Claude, mas nao envia notificacoes.

Consequencia:

- O monitoramento continua funcionando.
- O aviso remoto de liberacao nao acontece.

### Regra 3: o `Org ID` pode ser configurado e tem fallback padrao

Se o usuario nao informar um `Org ID`, a extensao usa o valor fixo em `DEFAULT_ORG_ID`.

Consequencia:

- O projeto e utilizavel imediatamente em cenarios onde esse identificador padrao ja atende.
- Em organizacoes diferentes, o usuario precisa sobrescrever o valor no popup.

### Regra 4: quando Claude esta bloqueado, o polling recorrente e interrompido

Se `utilization >= 100` e ainda falta tempo para `resets_at`, a extensao:

1. salva `resets_at` em `chrome.storage.local`;
2. cancela o alarme recorrente;
3. agenda um alarme unico para o desbloqueio.

Motivacao:

- evitar consultas desnecessarias enquanto o sistema ja sabe que o uso esta bloqueado.

### Regra 5: a verificacao de desbloqueio usa margem de seguranca

O horario real agendado nao e exatamente `resets_at`. O sistema soma `UNLOCK_GRACE_MS`, atualmente `60 segundos`.

Motivacao:

- reduzir risco de consultar cedo demais antes de a API refletir o desbloqueio.

### Regra 6: quando Claude esta disponivel, o polling recorrente volta a operar

Se o Claude estiver liberado, a extensao:

1. limpa `resetAt` salvo;
2. recria o alarme recorrente de polling;
3. retorna mensagem de disponibilidade com percentual atual arredondado.

### Regra 7: a notificacao de liberacao so dispara em contexto de desbloqueio monitorado

A mensagem `Claude liberado!` so e enviada quando duas condicoes sao verdadeiras:

- a verificacao esta rodando com `notifyOnUnlock: true`;
- existia um `resetAt` previamente salvo.

Consequencia:

- a extensao evita disparar notificacao em consultas comuns ou em inicializacoes onde Claude ja estava livre.

### Regra 8: a consulta manual no popup tambem atualiza o agendamento interno

Ao clicar em `Verificar status do Claude`, o popup chama `GET_CLAUDE_STATUS` e o background executa `evaluateClaudeState()` com `updateSchedule: true`.

Consequencia:

- a consulta manual nao e apenas informativa;
- ela tambem recalcula e corrige o cronograma de alarmes.

### Regra 9: falha de autenticacao e falha operacional sao tratadas separadamente

O codigo distingue:

- `auth`: quando a sessao do Claude nao esta valida.
- `unavailable`: quando houve falha de rede, resposta inesperada ou erro operacional.

Motivacao:

- orientar melhor a acao do usuario;
- evitar misturar problema de login com indisponibilidade temporaria.

### Regra 10: a extensao abre o Claude no maximo uma vez por ciclo de vida do worker

A flag `opened` impede multiplas aberturas repetidas da aba `https://claude.ai` no mesmo ciclo do service worker.

Consequencia:

- evita spam de abas quando houver falhas repetidas.

## Fluxos principais

### Fluxo A: configuracao inicial

1. Usuario abre o popup.
2. Informa `Org ID` e `Topico do ntfy`.
3. Clica em `Salvar configuracao`.
4. A extensao grava os dados em `chrome.storage.local`.
5. O monitoramento em background passa a usar os valores salvos.

### Fluxo B: envio de teste

1. Usuario informa um topico.
2. Clica em `Enviar teste`.
3. O popup faz `POST` para `https://ntfy.sh/{topic}`.
4. O usuario valida se o dispositivo inscrito recebeu a mensagem.

### Fluxo C: Claude disponivel

1. A extensao consulta a API.
2. Identifica que o limite nao esta bloqueando uso.
3. Limpa `resetAt` salvo, se existir.
4. Agenda polling recorrente a cada `15 minutos`.
5. Exibe ou retorna mensagem de disponibilidade.

### Fluxo D: Claude bloqueado

1. A extensao consulta a API.
2. Identifica `utilization >= 100` com `resets_at` futuro.
3. Salva `resetAt`.
4. Cancela polling recorrente.
5. Agenda verificacao unica para `resets_at + 60s`.

### Fluxo E: liberacao apos bloqueio

1. O alarme de desbloqueio dispara.
2. A extensao consulta novamente a API.
3. Se o Claude estiver disponivel, limpa `resetAt`.
4. Reativa polling recorrente.
5. Publica notificacao `Claude liberado!` no `ntfy`.

## Dados persistidos

Os seguintes valores sao armazenados em `chrome.storage.local`:

- `topic`: topico do ntfy usado para notificacoes.
- `orgId`: identificador da organizacao do Claude.
- `resetAt`: timestamp ISO do proximo reset conhecido.

### Papel de cada dado

- `topic`: define o destino das notificacoes remotas.
- `orgId`: define qual organizacao sera consultada na API do Claude.
- `resetAt`: permite retomar o agendamento mesmo apos reinicializacao do service worker.

## Integracoes externas

### Claude

Endpoint usado:

```text
https://claude.ai/api/organizations/{orgId}/usage
```

Premissas da integracao:

- o navegador precisa ter sessao valida em `claude.ai`;
- a resposta precisa conter o bloco `five_hour`;
- a regra de negocio depende de `utilization` e `resets_at`.

### ntfy

Endpoint usado:

```text
https://ntfy.sh/{topic}
```

Formato usado no `POST`:

- corpo em texto puro;
- header `Title`;
- header `Priority: urgent`;
- header `Content-Type: text/plain; charset=UTF-8`.

Mensagens enviadas atualmente:

- teste manual: `Teste de notificacao do Claude!`
- liberacao automatica: `🚀 Claude liberado!`

## Interface do popup

O popup foi desenhado para um uso rapido e operacional.

Elementos de interface:

- `Org ID do Claude`: campo de identificacao da organizacao monitorada.
- `Topico do ntfy`: campo de configuracao do canal de alerta.
- `Salvar configuracao`: persiste os dados localmente.
- `Enviar teste`: valida o topico do ntfy sem depender do estado real do Claude.
- `Verificar status do Claude`: executa uma consulta sob demanda.
- area de status: comunica sucesso, erro ou informacao.

Estados visuais tratados pelo popup:

- `info`
- `success`
- `error`

## Instalacao e uso

### 1. Carregar a extensao no Chrome

1. Abra `chrome://extensions`.
2. Ative `Modo do desenvolvedor`.
3. Clique em `Carregar sem compactacao`.
4. Selecione a pasta raiz deste projeto.
5. Sempre que alterar `background.js`, `manifest.json` ou os icones, clique em `Recarregar` na extensao para subir o novo service worker.

### 2. Preparar a sessao do Claude

1. Abra `https://claude.ai` no mesmo navegador.
2. Faça login.
3. Confirme que a sessao esta ativa.

### 3. Configurar o popup

1. Abra o popup da extensao.
2. Informe o `Org ID` correto.
3. Informe um topico exclusivo do `ntfy`.
4. Clique em `Salvar configuracao`.
5. Opcionalmente, clique em `Enviar teste`.

### 4. Receber notificacoes no celular

1. Instale um cliente do `ntfy` ou use outra forma de inscricao no topico.
2. Assine o mesmo topico configurado na extensao.
3. Aguarde a notificacao quando o Claude for liberado.

## Comportamento de agendamento

O projeto usa dois alarmes nomeados:

- `checkClaudePoll`: polling recorrente a cada `15 minutos`.
- `checkClaudeUnlock`: verificacao unica para o horario estimado de liberacao.

Constantes atuais:

- `POLL_INTERVAL_MINUTES = 15`
- `UNLOCK_GRACE_MS = 60000`

Resumo operacional:

- Livre: polling recorrente ativo.
- Bloqueado: polling recorrente desligado e unlock check agendado.
- Apos liberacao: polling recorrente reativado.

## Tratamento de erros

### Falha de autenticacao

Quando a API retorna `401` ou `403`:

- a extensao marca estado `auth`;
- em background, tenta abrir `claude.ai` uma vez;
- no popup, orienta o usuario a fazer login.

### Falha de rede ou erro inesperado

Quando ocorre excecao de rede ou resposta invalida:

- a extensao marca estado `unavailable`;
- o popup exibe mensagem de erro operacional;
- em verificacoes automaticas, a extensao tambem pode abrir `claude.ai` uma vez.

### Falha na notificacao local do Chrome

Se a notificacao local do Chrome falhar:

- o erro real e exibido no popup durante a consulta manual;
- o envio remoto ao `ntfy` continua sendo tentado normalmente;
- a extensao usa o arquivo `icon-128.png` empacotado para reduzir incompatibilidades de imagem no Windows.

### Resposta sem `five_hour`

Se a API responder sem a estrutura esperada:

- o sistema considera a resposta inesperada;
- o estado retornado e `unavailable`.

## Limitacoes conhecidas

- O `Org ID` nao e descoberto automaticamente.
- O projeto depende de uma estrutura especifica da API do Claude e pode quebrar se a API mudar.
- A notificacao local do Chrome depende do subsistema de notificacoes do sistema operacional e pode variar conforme o ambiente do usuario.
- O service worker do Manifest V3 pode ser reiniciado pelo navegador; por isso o projeto persiste `resetAt` para recompor o agendamento.
- O envio de notificacoes depende da disponibilidade do `ntfy.sh`.

## Validacao atual

- Suite automatizada com Vitest e jsdom.
- Comando validado: `npm test`.
- Cobertura atual para `background.js` e `popup.js`, incluindo falhas de notificacao local e envio remoto.

## Possiveis evolucoes

- Descoberta automatica do `Org ID` a partir da sessao.
- Historico de bloqueios e liberacoes.
- Configuracao de intervalo de polling pelo popup.
- Suporte a notificacao nativa do navegador alem do `ntfy`.
- Validacao mais detalhada da resposta da API do Claude.

## Resumo tecnico

Este projeto e uma extensao Chrome pequena, sem build step, sem dependencias externas de frontend e sem backend proprio. Toda a inteligencia de negocio esta concentrada no service worker, enquanto o popup funciona como painel de configuracao e consulta manual.

Em termos de produto, a regra central e simples: detectar quando o Claude esta bloqueado, esperar o horario estimado de renovacao com uma margem de seguranca e avisar o usuario remotamente quando o acesso voltar.