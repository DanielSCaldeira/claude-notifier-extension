# Como gerar os assets visuais da Chrome Web Store

## Ferramentas necessárias

Apenas o Chrome. Nenhum software extra necessário.

---

## Método mais fácil: DevTools → Device Toolbar

1. Abra o arquivo HTML no Chrome (File → Open File ou arraste para o Chrome)
2. Pressione **F12** para abrir o DevTools
3. Clique no ícone **Toggle device toolbar** (Ctrl+Shift+M)
4. Configure as dimensões exatas no topo (ex: 1280 × 800)
5. Clique nos **três pontos ⋮** do DevTools → **Run command** → digite `screenshot` → selecione **Capture screenshot**
6. O PNG será baixado automaticamente com as dimensões corretas

---

## Dimensões de cada arquivo

| Arquivo HTML | Dimensão alvo | Salvar como |
|---|---|---|
| `promo-small-440x280.html` | **440 × 280** | `promo-small-440x280.png` |
| `promo-marquee-1400x560.html` | **1400 × 560** | `promo-marquee-1400x560.png` |
| `screenshot-01-popup.html` | **1280 × 800** | `screenshot-01-popup.png` |
| `screenshot-02-notification.html` | **1280 × 800** | `screenshot-02-notification.png` |
| `screenshot-03-features.html` | **1280 × 800** | `screenshot-03-features.png` |

---

## Método alternativo: Captura por linha de comando (Chrome headless)

Se tiver Chrome instalado, execute no terminal (substituindo o caminho do Chrome):

```powershell
# Windows — ajuste o caminho se necessário
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$store  = "d:\git\claude-notifier-extension\assets\store"

& $chrome --headless --disable-gpu --screenshot="$store\promo-small-440x280.png"    --window-size=440,280    "$store\promo-small-440x280.html"
& $chrome --headless --disable-gpu --screenshot="$store\promo-marquee-1400x560.png" --window-size=1400,560   "$store\promo-marquee-1400x560.html"
& $chrome --headless --disable-gpu --screenshot="$store\screenshot-01-popup.png"    --window-size=1280,800   "$store\screenshot-01-popup.html"
& $chrome --headless --disable-gpu --screenshot="$store\screenshot-02-notification.png" --window-size=1280,800 "$store\screenshot-02-notification.html"
& $chrome --headless --disable-gpu --screenshot="$store\screenshot-03-features.png" --window-size=1280,800   "$store\screenshot-03-features.html"
```

---

## Verificação antes de fazer upload

- [ ] PNG 24-bit, **sem canal alfa** (transparência) — use Paint ou Photoshop para converter se necessário
- [ ] Ícone `icon-128.png`: 128×128, pode ter alfa (PNG normal)
- [ ] Screenshots: exatamente 1280×800 ou 640×400
- [ ] Promos: exatamente 440×280 e 1400×560
- [ ] Nenhuma imagem tem texto sobreposto de ferramenta de screenshot
- [ ] Imagens não contém marcas registradas de terceiros de forma inadequada

---

## Converter para PNG sem alfa (se necessário)

No PowerShell com ImageMagick instalado:
```powershell
magick input.png -background white -alpha remove -alpha off output.png
```

Ou abra no Paint (Windows) e salve como PNG — o Paint não preserva canal alfa.
