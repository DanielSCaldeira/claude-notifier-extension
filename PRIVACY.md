# Politica de Privacidade

Ultima atualizacao: 2026-04-06

## Resumo

A extensao Claude Notifier Pro monitora a disponibilidade de uso do Claude e envia um alerta para um topico configurado pelo usuario no ntfy.

Esta extensao nao vende dados, nao compartilha dados para publicidade e nao usa analytics.

## Dados tratados

A extensao pode tratar os seguintes dados estritamente para executar sua funcionalidade:

- `orgId` informado pelo usuario para consultar a API de uso do Claude;
- `topic` informado pelo usuario para enviar notificacoes ao ntfy;
- `language` e `resetAt` para configuracao local e agendamento;
- respostas da API de uso do Claude para identificar se a janela de uso foi liberada;
- cookies de sessao ja existentes no navegador ao consultar `claude.ai`, sem coletar credenciais manualmente.

## Onde os dados ficam

Os seguintes dados sao armazenados localmente em `chrome.storage.local`:

- `orgId`;
- `topic`;
- `language`;
- `resetAt`.

A extensao nao mantem banco de dados proprio nem servidor proprio para armazenar dados do usuario.

## Compartilhamento com terceiros

A extensao se comunica apenas com os servicos necessarios para a funcionalidade declarada:

- `https://claude.ai/*`: consulta do uso da organizacao do usuario autenticado;
- `https://ntfy.sh/*`: envio do alerta configurado pelo proprio usuario;
- `https://quickchart.io/*`: geracao visual do QR Code Pix exibido na area opcional de apoio do popup.

A extensao nao envia `orgId` ou `topic` para fins de marketing, perfilamento ou publicidade.

## Finalidade de cada permissao

- `alarms`: agenda verificacoes periodicas e verificacoes pontuais no horario estimado de liberacao;
- `tabs`: abre `claude.ai` quando a sessao autenticada precisa ser revalidada pelo navegador;
- `storage`: salva configuracoes e estado local do monitoramento;
- `notifications`: mostra notificacoes locais no navegador.

## Seguranca

- a extensao nao embute credenciais secretas de backend;
- o codigo distribuido pode ser inspecionado pelo navegador, como em qualquer extensao Chrome;
- por isso, dados inseridos no popup devem ser tratados como configuracoes funcionais e nao como segredo criptografado.

## Retencao e exclusao

Os dados locais permanecem no navegador do usuario ate que:

- o usuario altere a configuracao no popup;
- o usuario limpe os dados da extensao;
- a extensao seja removida do navegador.

## Contato

Se voce publicar esta extensao na Chrome Web Store, inclua aqui seu email ou pagina oficial de suporte antes da submissao.