// Configurações de integração do painel administrativo.
//
// ⚠️ Este módulo é importado por SettingsPage.jsx, um componente client
// (sem getServerSideProps) — qualquer valor colocado aqui entra no bundle
// JS público de /admin, baixado por qualquer visitante ANTES do login.
// NUNCA cole API key/token real nos campos "AQUI" abaixo (achado da
// auditoria de segurança de 2026-08-14, ver ROADMAP.md "Débito técnico").
// Quando for provisionar Fase 4 (WhatsApp)/Fase 5 (planilha) de verdade:
// mover a chave pra env var server-only e criar uma rota /api/* que
// devolve só o status booleano ("conectado"/"não conectado"), nunca a
// chave em si — mesmo padrão de lib/supabaseAdmin.js.

const CONFIG = {
  googleSheets: {
    sheetId: "AQUI",
    apiKey: "AQUI",
    ranges: {
      estoque: "Estoque!A3:P2000",
      pedidos: "Pedidos!A3:L2000",
      catalogo: "Catalogo!A3:J200",
    },
    refreshIntervalMs: 30000,
  },

  evolutionApi: {
    baseUrl: "AQUI",
    instanceName: "galene",
    apiKey: "AQUI",
    webhookUrl: "AQUI",
  },

  n8n: {
    baseUrl: "AQUI",
    webhookPath: "/webhook/whatsapp",
  },

  store: {
    name: "Galene",
    agentName: "Gabi",
    whatsapp: "AQUI",
    instagram: "@galene",
    minOrder: 6,
    payment: ["PIX", "Cartão de Crédito"],
  },
};

export default CONFIG;
