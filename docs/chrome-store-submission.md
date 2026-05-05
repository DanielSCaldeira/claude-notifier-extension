# Chrome Web Store — Submission Checklist

## Ícone da Store

**Arquivo:** `assets/icons/icon-128.png`
**Dimensão:** 128×128 px
**Formato:** PNG

> Já existe no projeto. Verificar se tem fundo sólido (sem transparência alfa) e se o ícone ocupa bem a área, sem muito espaço em branco ao redor.

---

## Descrição curta (até 132 caracteres)

### Português (pt-BR) — idioma padrão
```
Monitora o uso do Claude e envia notificação no celular assim que o acesso for liberado.
```
*(88 caracteres)*

### English (en)
```
Monitors Claude usage and sends a push notification the moment your access is restored.
```
*(88 caracteres)*

### Español (es)
```
Monitoriza el uso de Claude y envía una notificación al móvil cuando el acceso se restablece.
```
*(93 caracteres)*

---

## Descrição detalhada

### Português (pt-BR)

```
Claude Notifier Pro monitora automaticamente a disponibilidade do Claude em segundo plano e envia um alerta pelo ntfy assim que a janela de uso for liberada — sem que você precise ficar verificando manualmente.

COMO FUNCIONA

1. Configure seu Org ID do Claude e um tópico exclusivo no ntfy pelo popup da extensão.
2. A extensão consulta a API de uso do Claude periodicamente usando a sessão autenticada do seu navegador.
3. Quando o limite for atingido, a extensão agenda uma verificação pontual para o horário estimado de liberação.
4. Assim que a liberação for confirmada, você recebe um alerta no seu celular, tablet ou qualquer dispositivo com o ntfy instalado.

RECURSOS

• Monitoramento automático em segundo plano — nenhuma aba extra necessária.
• Notificação remota via ntfy: receba o alerta em qualquer dispositivo.
• Verificação manual de status diretamente no popup.
• Suporte a múltiplos idiomas: Português (BR), English e Español.
• Segue as melhores práticas de acessibilidade: navegação por teclado, suporte a leitores de tela e respeito à preferência de animações reduzidas.
• Sem rastreamento, sem analytics, sem anúncios.

PRIVACIDADE

A extensão utiliza apenas os dados necessários para sua funcionalidade:
• Org ID e tópico ntfy: salvos localmente no seu navegador.
• Nenhum dado é enviado para servidores de terceiros além dos dois serviços declarados (claude.ai e ntfy.sh).
• A extensão não vende dados, não usa rastreadores de publicidade e não compartilha informações com terceiros.

PERMISSÕES

• alarms: agenda as verificações periódicas e pontuais.
• tabs: reabre claude.ai quando a sessão precisa ser revalidada.
• storage: salva as configurações e o estado do monitoramento localmente.
• notifications: exibe notificações locais no navegador.

REQUISITOS

• Conta no Claude com um Org ID visível na URL de uso.
• Conta gratuita no ntfy.sh (ou servidor ntfy próprio) e o app ntfy instalado no celular.
```

---

### English (en)

```
Claude Notifier Pro automatically monitors Claude availability in the background and sends an alert via ntfy the moment your usage window is restored — no more manual checking.

HOW IT WORKS

1. Enter your Claude Org ID and a unique ntfy topic in the extension popup.
2. The extension periodically checks the Claude usage API using your browser's existing authenticated session.
3. When your limit is reached, the extension schedules a precise check for the estimated reset time.
4. Once the reset is confirmed, you receive an alert on your phone, tablet, or any device with ntfy installed.

FEATURES

• Automatic background monitoring — no extra tabs needed.
• Remote alerts via ntfy: get notified on any device.
• Manual status check directly from the popup.
• Multi-language support: Português (BR), English, and Español.
• Accessibility-first: keyboard navigation, screen reader support, and reduced-motion preference respected.
• No tracking, no analytics, no ads.

PRIVACY

The extension only uses data required for its core function:
• Org ID and ntfy topic: stored locally in your browser only.
• No data is sent to third-party servers beyond the two declared services (claude.ai and ntfy.sh).
• The extension does not sell data, does not use advertising trackers, and does not share information with third parties.

PERMISSIONS

• alarms: schedules periodic and one-time checks.
• tabs: reopens claude.ai when the session needs to be revalidated.
• storage: saves settings and monitoring state locally.
• notifications: displays local browser notifications.

REQUIREMENTS

• A Claude account with an Org ID visible in the usage URL.
• A free ntfy.sh account (or self-hosted ntfy server) and the ntfy app installed on your phone.
```

---

### Español (es)

```
Claude Notifier Pro monitoriza automáticamente la disponibilidad de Claude en segundo plano y envía una alerta por ntfy en cuanto se restablezca tu ventana de uso — sin necesidad de comprobaciones manuales.

CÓMO FUNCIONA

1. Introduce tu Org ID de Claude y un tema exclusivo de ntfy en el popup de la extensión.
2. La extensión consulta periódicamente la API de uso de Claude usando la sesión autenticada de tu navegador.
3. Cuando se alcanza el límite, la extensión programa una comprobación puntual para el horario estimado de restablecimiento.
4. Una vez confirmado el restablecimiento, recibes una alerta en tu móvil, tablet o cualquier dispositivo con ntfy instalado.

CARACTERÍSTICAS

• Monitoreo automático en segundo plano — sin pestañas adicionales.
• Alertas remotas vía ntfy: recibe notificaciones en cualquier dispositivo.
• Comprobación manual del estado directamente desde el popup.
• Soporte multiidioma: Português (BR), English y Español.
• Accesibilidad: navegación por teclado, compatibilidad con lectores de pantalla y respeto a la preferencia de movimiento reducido.
• Sin rastreo, sin analíticas, sin anuncios.

PRIVACIDAD

La extensión solo utiliza los datos necesarios para su función principal:
• Org ID y tema ntfy: almacenados localmente en tu navegador.
• No se envían datos a servidores de terceros más allá de los dos servicios declarados (claude.ai y ntfy.sh).
• La extensión no vende datos, no usa rastreadores publicitarios y no comparte información con terceros.

PERMISOS

• alarms: programa las comprobaciones periódicas y puntuales.
• tabs: reabre claude.ai cuando la sesión necesita ser revalidada.
• storage: guarda la configuración y el estado del monitoreo localmente.
• notifications: muestra notificaciones locales en el navegador.

REQUISITOS

• Una cuenta de Claude con un Org ID visible en la URL de uso.
• Una cuenta gratuita en ntfy.sh (o servidor ntfy propio) y la app ntfy instalada en el móvil.
```

---

## URLs necessárias

### URL da página inicial
```
https://github.com/SEU_USUARIO/claude-notifier-extension
```
*(substituir SEU_USUARIO pelo usuário GitHub real)*

### URL de suporte
```
https://github.com/SEU_USUARIO/claude-notifier-extension/issues
```
*(substituir SEU_USUARIO pelo usuário GitHub real)*

### URL de privacidade (obrigatório para extensões com storage/cookies)
```
https://SEU_USUARIO.github.io/extension-policies/claude-notifier-pro/
```
*(publicar o repositório de políticas via GitHub Pages)*

---

## Categoria

**Productivity**

---

## Conteúdo adulto

**Não** — a extensão não contém conteúdo adulto de nenhum tipo.

---

## Assets visuais necessários

| Asset | Dimensão | Formato | Arquivo a criar |
|-------|----------|---------|----------------|
| Ícone da Store | 128×128 | PNG | já existe: `assets/icons/icon-128.png` |
| Screenshot 1 (popup principal) | 1280×800 | PNG 24-bit sem alfa | `assets/store/screenshot-01-popup.png` |
| Screenshot 2 (notificação recebida) | 1280×800 | PNG 24-bit sem alfa | `assets/store/screenshot-02-notification.png` |
| Screenshot 3 (popup status ativo) | 1280×800 | PNG 24-bit sem alfa | `assets/store/screenshot-03-monitoring.png` |
| Bloco pequeno | 440×280 | PNG 24-bit sem alfa | `assets/store/promo-small-440x280.png` |
| Bloco letreiro | 1400×560 | PNG 24-bit sem alfa | `assets/store/promo-marquee-1400x560.png` |

> Os arquivos HTML para gerar esses assets estão em `assets/store/`.
> Abra cada arquivo no Chrome, use DevTools → Capture screenshot para salvar no tamanho exato.
> Ou use: Menu do Chrome → Mais ferramentas → Capturar screenshot de tela inteira.

---

## Notas de revisão (justificativa de permissões)

Preencher no campo "Notas para o avaliador" na submissão:

```
This extension monitors Claude AI usage limits and sends a remote push notification 
via ntfy.sh when the usage window resets.

Permissions justification:
- alarms: schedules periodic polling (every 5 minutes) and a one-time alarm at the 
  estimated reset time to avoid unnecessary polling.
- tabs: reopens claude.ai in the background when the authenticated session expires, 
  so the usage check can succeed without user intervention.
- storage: persists the user-configured Org ID, ntfy topic, language preference, 
  and the estimated reset timestamp locally.
- notifications: displays a local browser notification as a secondary alert channel 
  alongside the ntfy remote notification.
- host_permissions (claude.ai): reads the usage API endpoint using the user's 
  existing authenticated browser session. No credentials are captured or stored.
- host_permissions (ntfy.sh): publishes the user-configured alert message to the 
  user's own ntfy topic.

To test: configure a valid Claude Org ID and any ntfy topic (e.g. "test-topic"), 
then click "Check now" in the popup to trigger an immediate status check.
```
