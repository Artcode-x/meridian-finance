// Содержимое политики конфиденциальности. Блоки: p (абзац), h (подзаголовок), ul (список), table, note, link
export const PRIVACY_UPDATED = "September 2026"
export const PRIVACY_CONTACT = "Alex-artcode@yandex.ru"

export const privacySections = [
  {
    id: "introduction",
    title: "Introduction",
    icon: "document-text-outline",
    blocks: [
      {
        type: "p",
        text: 'This Privacy Policy describes the policies of Alexander Butylev ("Developer"), the individual developer of the Crypto-Tracker mobile application ("App"). I respect your privacy and am committed to protecting your information. This policy explains what data is collected, how it is used, and your rights.'
      },
      {
        type: "note",
        text: "Core principle: your cryptocurrency portfolio amounts and values are stored only on your device. The App works entirely locally unless you explicitly opt in to background alerts."
      }
    ]
  },
  {
    id: "backgroundAlerts",
    title: "Background price alerts",
    icon: "notifications-outline",
    blocks: [
      { type: "h", text: "Two alert modes" },
      {
        type: "table",
        headers: ["", "Local (default)", "Background (opt-in)"],
        rows: [
          ["When alerts work", "Only while the app is open", "24/7, even when closed"],
          ["Data sent to server", "None", "Minimal alert config only"],
          ["Requires consent", "No", "Explicit consent"],
          ["User control", "Always available", "Enable / disable anytime"]
        ]
      },
      { type: "h", text: "Consent process" },
      {
        type: "ol",
        items: [
          "Initial disclosure: a clear in-app modal explains background alerts before any data is transmitted.",
          'Explicit action: you must tap "Enable" — no pre-checked boxes.',
          "Persistent control: a toggle on the Alerts tab lets you enable or disable at any time.",
          "Revocation: disabling removes all your data from our servers immediately."
        ]
      },
      {
        type: "p",
        text: 'This consent process complies with Google Play\'s "Prominent Disclosure" requirements.'
      },
      { type: "h", text: "What is transmitted (if enabled)" },
      {
        type: "ul",
        items: [
          'Coin identifier — a public symbol such as "bitcoin" or "ethereum"',
          "Target price — your alert threshold",
          'Condition — "above" or "below" the target',
          "Device token — an anonymous Firebase Cloud Messaging token",
          "Alert ID — a random identifier for your alert"
        ]
      },
      {
        type: "note",
        text: "Not transmitted: portfolio amounts, transaction history, personal information or wallet addresses."
      },
      {
        type: "p",
        text: "Local-only mode (default): if you decline background alerts, the app works completely offline. Alerts trigger only while the app is running and no data leaves your device."
      }
    ]
  },
  {
    id: "dataCollection",
    title: "1. Information collection",
    icon: "folder-outline",
    blocks: [
      { type: "h", text: "A. Stored locally (always)" },
      {
        type: "ul",
        items: [
          "Cryptocurrency amounts you enter",
          "Calculated portfolio value and performance",
          "Price alert configuration (local mode)",
          "App settings and preferences",
          "Favorite coins list"
        ]
      },
      {
        type: "p",
        text: "This data never leaves your device unless you explicitly enable background alerts."
      },
      { type: "h", text: "B. Processed by server (opt-in only)" },
      {
        type: "ul",
        items: [
          "Alert configuration (coin, target price, condition)",
          "Anonymous device token for notifications",
          "Alert status and timestamps"
        ]
      },
      { type: "h", text: "I do not collect" },
      {
        type: "ul",
        items: [
          "Your name, email or personal identification",
          "Exact geographic location",
          "Private keys, seed phrases or wallet addresses",
          "Banking or payment information",
          "Contacts, photos or other device data"
        ]
      }
    ]
  },
  {
    id: "dataUsage",
    title: "2. How I use your information",
    icon: "analytics-outline",
    blocks: [
      { type: "h", text: "Core app functions" },
      {
        type: "p",
        text: "To calculate and display your portfolio, show market data and manage your watchlists using data stored locally on your device."
      },
      { type: "h", text: "Local price alerts" },
      {
        type: "p",
        text: "To monitor prices and trigger alerts while the app is actively running on your device."
      },
      { type: "h", text: "Background alerts (opt-in)" },
      {
        type: "p",
        text: "Only if you enable them: to monitor cryptocurrency prices 24/7 on our server and send you push notifications when your conditions are met."
      },
      {
        type: "note",
        text: "Legal basis: local processing is necessary for app functionality. Server processing for background alerts is based solely on your explicit consent."
      }
    ]
  },
  {
    id: "thirdParties",
    title: "3. Third-party services",
    icon: "globe-outline",
    blocks: [
      { type: "h", text: "Market data APIs" },
      {
        type: "ul",
        items: [
          "CoinGecko / Binance — cryptocurrency prices",
          "Data sent: only public coin symbols",
          "No user data is ever sent"
        ]
      },
      { type: "h", text: "Infrastructure (background alerts only)" },
      {
        type: "ul",
        items: [
          "Backend server — processes background alerts, used only if you enable them; stores encrypted alert configurations",
          "Firebase Cloud Messaging — delivers push notifications; receives the device token and notification content"
        ]
      },
      { type: "link", text: "Firebase privacy policy", url: "https://firebase.google.com/support/privacy" }
    ]
  },
  {
    id: "dataRetention",
    title: "4. Data retention",
    icon: "time-outline",
    blocks: [
      { type: "h", text: "Local device data" },
      {
        type: "ul",
        items: [
          "Retention: until you delete it or uninstall the app",
          "Storage: your device's local storage",
          "Backup: not backed up by us"
        ]
      },
      { type: "h", text: "Server data (if enabled)" },
      {
        type: "ul",
        items: [
          "Active alerts: stored while enabled, deleted immediately when disabled",
          "Triggered alerts: history kept for 24 hours, then deleted",
          "Inactive devices: data removed after 30 days of inactivity",
          "When you disable: all your data is deleted immediately"
        ]
      },
      {
        type: "note",
        text: "Security: all communications use HTTPS/TLS encryption. Server data is encrypted at rest. Regular security updates are applied."
      }
    ]
  },
  {
    id: "userRights",
    title: "5. Your data rights",
    icon: "hand-left-outline",
    blocks: [
      {
        type: "ul",
        items: [
          "Access & view — all your data is visible in the app",
          "Control — enable or disable background alerts at any time",
          "Delete — remove portfolio data or alerts whenever you want"
        ]
      },
      { type: "h", text: "How to exercise your rights" },
      {
        type: "ol",
        items: [
          "Background alerts: use the cloud toggle at the top of the Alerts tab.",
          "Server data: disabling background alerts deletes it immediately."
        ]
      }
    ]
  },
  {
    id: "compliance",
    title: "6. Compliance & standards",
    icon: "ribbon-outline",
    blocks: [
      { type: "h", text: "Google Play requirements" },
      {
        type: "ul",
        items: [
          "Prominent disclosure before data collection",
          "Explicit opt-in consent for background features",
          "Clear privacy policy with developer contact",
          "User control over data sharing"
        ]
      },
      { type: "h", text: "GDPR (EEA users)" },
      {
        type: "ul",
        items: [
          "Lawful basis: explicit consent (Article 6(1)(a))",
          "Right to access, rectify, delete (Articles 15–17)",
          "Right to data portability (Article 20)",
          "Right to object to processing (Article 21)"
        ]
      },
      { type: "h", text: "Security standards" },
      {
        type: "ul",
        items: [
          "TLS 1.2+ encryption for all communications",
          "Data encryption at rest (AES-256)",
          "Regular security updates and audits",
          "Minimal data collection principle"
        ]
      }
    ]
  },
  {
    id: "children",
    title: "7. Children's privacy",
    icon: "people-outline",
    blocks: [
      {
        type: "p",
        text: "The App is not intended for children under 13. I do not knowingly collect personal information from children under 13. If you believe a child has provided information, please contact me immediately for data deletion."
      }
    ]
  }
]
