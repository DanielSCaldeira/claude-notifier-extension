const PIX_CONFIG = globalThis.__claudeNotifierPixConfig || {};

globalThis.__claudeNotifierDonationsConfig = Object.freeze({
  enabled: true,
  title: {
    default: "Apoie a extensao",
    en: "Support the extension",
    es: "Apoya la extension",
    "pt-BR": "Apoie a extensao"
  },
  description: {
    default: "Se a extensao te ajuda no dia a dia, voce pode apoiar a manutencao com uma doacao.",
    en: "If the extension helps you every day, you can support maintenance with a donation.",
    es: "Si la extension te ayuda cada dia, puedes apoyar su mantenimiento con una donacion.",
    "pt-BR": "Se a extensao te ajuda no dia a dia, voce pode apoiar a manutencao com uma doacao."
  },
  methods: [
    {
      id: "buy-me-a-coffee",
      label: {
        default: "Buy Me a Coffee",
        en: "Buy Me a Coffee",
        es: "Buy Me a Coffee",
        "pt-BR": "Buy Me a Coffee"
      },
      hint: {
        default: "Rapido para ativar e simples para quem quer doar uma vez.",
        en: "Quick to activate and simple for one-time donations.",
        es: "Rapido de activar y simple para donaciones puntuales.",
        "pt-BR": "Rapido para ativar e simples para quem quer doar uma vez."
      },
      url: "https://buymeacoffee.com/soarescaldi",
      prominent: true
    },
    {
      id: "pix",
      label: {
        default: "Pix",
        en: "Pix",
        es: "Pix",
        "pt-BR": "Pix"
      },
      hint: {
        default: "Melhor para publico brasileiro. Exiba um QR Code Pix e mantenha a chave disponivel para copia.",
        en: "Best for Brazilian users. Show a Pix QR code and keep the key available for copy.",
        es: "Ideal para usuarios de Brasil. Muestra un codigo QR Pix y deja la clave disponible para copiar.",
        "pt-BR": "Melhor para publico brasileiro. Exiba um QR Code Pix e mantenha a chave disponivel para copia."
      },
      pixKey: PIX_CONFIG.pixKey || "",
      merchantName: PIX_CONFIG.merchantName || "Daniel Soares",
      merchantCity: PIX_CONFIG.merchantCity || "Sao Paulo",
      transactionId: PIX_CONFIG.transactionId || "CLAUDENOTIFIER"
    }
  ]
});