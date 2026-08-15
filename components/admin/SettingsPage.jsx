import React, { useState } from "react";
import CONFIG from "../../lib/adminConfig";

const Section = ({ title, icon, children, status }) => {
  const [open, setOpen] = useState(true);
  const colors = {
    ok:      { bg:"rgba(52,211,153,0.1)",  border:"rgba(52,211,153,0.3)",  dot:"#34d399", label:"Conectado"    },
    pending: { bg:"rgba(251,146,60,0.08)", border:"rgba(251,146,60,0.25)", dot:"#fb923c", label:"Configurar"   },
    error:   { bg:"rgba(239,68,68,0.08)",  border:"rgba(239,68,68,0.25)",  dot:"#ef4444", label:"Erro"         },
  };
  const c = colors[status] || colors.pending;
  return (
    <div style={{ marginBottom:16, borderRadius:16, overflow:"hidden", border:`1px solid var(--surface-6)` }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"16px 22px", cursor:"pointer",
          background:"var(--surface-2)",
          transition:"background 0.15s",
        }}
      >
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:18 }}>{icon}</span>
          <span style={{ fontSize:14, fontWeight:700, color:"var(--text-2)" }}>{title}</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{
            fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:20,
            background:c.bg, border:`1px solid ${c.border}`, color:c.dot,
          }}>{c.label}</span>
          <span style={{ color:"var(--text-5)", fontSize:12, transition:"transform 0.2s", display:"inline-block", transform:open?"rotate(90deg)":"" }}>▶</span>
        </div>
      </div>
      {open && (
        <div style={{ padding:"20px 22px 22px", background:"rgba(0,0,0,0.2)", borderTop:"1px solid var(--surface-4)" }}>
          {children}
        </div>
      )}
    </div>
  );
};

const Field = ({ label, value, placeholder, hint, mono }) => (
  <div style={{ marginBottom:16 }}>
    <div style={{ fontSize:11, fontWeight:600, color:"var(--text-3)", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.05em" }}>{label}</div>
    <div style={{
      padding:"11px 14px", borderRadius:10,
      background: value && !value.includes("AQUI") ? "rgba(52,211,153,0.06)" : "var(--surface-3)",
      border:`1.5px solid ${value && !value.includes("AQUI") ? "rgba(52,211,153,0.3)" : "var(--surface-7)"}`,
      fontSize:12, color: value && !value.includes("AQUI") ? "#34d399" : "var(--text-5)",
      fontFamily: mono ? "'DM Mono',monospace" : "inherit",
      wordBreak:"break-all",
    }}>
      {value && !value.includes("AQUI") ? value : placeholder}
      {value && !value.includes("AQUI") && <span style={{ marginLeft:8, fontSize:10 }}>✅</span>}
    </div>
    {hint && <div style={{ fontSize:11, color:"var(--text-5)", marginTop:5, lineHeight:1.5 }}>{hint}</div>}
  </div>
);

const Step = ({ n, text }) => (
  <div style={{ display:"flex", gap:12, marginBottom:10, alignItems:"flex-start" }}>
    <div style={{
      minWidth:22, height:22, borderRadius:"50%",
      background:"linear-gradient(135deg,#c084fc,#818cf8)",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:10, fontWeight:800, color:"white", marginTop:1,
    }}>{n}</div>
    <div style={{ fontSize:13, color:"var(--text-3)", lineHeight:1.6 }}>{text}</div>
  </div>
);

function isConfigured(val) { return val && !val.includes("AQUI"); }

export default function SettingsPage() {
  const gs = CONFIG.googleSheets;
  const ev = CONFIG.evolutionApi;
  const n8 = CONFIG.n8n;
  const st = CONFIG.store;

  const gsOk = isConfigured(gs.sheetId) && isConfigured(gs.apiKey);
  const evOk = isConfigured(ev.baseUrl) && isConfigured(ev.apiKey);
  const n8Ok = isConfigured(n8.baseUrl);

  const done  = [gsOk, evOk, n8Ok].filter(Boolean).length;
  const total = 3;
  const pct   = Math.round((done / total) * 100);

  return (
    <div style={{ maxWidth:860, margin:"0 auto" }}>
      <div style={{
        background:"var(--surface-2)", border:"1px solid var(--surface-6)",
        borderRadius:16, padding:"24px 28px", marginBottom:24,
      }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:"var(--text-2)" }}>Progresso da Configuração</div>
            <div style={{ fontSize:12, color:"var(--text-4)", marginTop:2 }}>{done} de {total} integrações conectadas</div>
          </div>
          <div style={{ fontSize:28, fontWeight:800, color: pct===100?"#34d399":"#c084fc", fontFamily:"'DM Mono',monospace" }}>{pct}%</div>
        </div>
        <div style={{ height:8, background:"var(--surface-5)", borderRadius:4, overflow:"hidden" }}>
          <div style={{
            height:"100%", width:"100%", transform:`scaleX(${pct/100})`, transformOrigin:"left", borderRadius:4,
            background: pct===100 ? "linear-gradient(90deg,#34d399,#059669)" : "linear-gradient(90deg,#c084fc,#818cf8)",
            transition:"transform 0.8s ease",
          }} />
        </div>
        {pct < 100 && (
          <div style={{ marginTop:12, fontSize:12, color:"var(--text-4)" }}>
            ⚠️ Essas integrações ainda não têm rota server-side pra guardar a chave com segurança — <b>não cole API key/token real em <code style={{ background:"var(--surface-6)", padding:"1px 6px", borderRadius:4, color:"#c084fc" }}>lib/adminConfig.js</code></b> (esse arquivo vai pro bundle público). Peça pra configurar isso antes de preencher de verdade.
          </div>
        )}
        {pct === 100 && (
          <div style={{ marginTop:12, fontSize:12, color:"#34d399", fontWeight:600 }}>
            🎉 Todas as integrações configuradas! Seu sistema está pronto.
          </div>
        )}
      </div>

      <Section title="Google Sheets" icon="📊" status={gsOk ? "ok" : "pending"}>
        <Field label="Sheet ID" value={gs.sheetId} placeholder="Cole o ID da planilha aqui"
          mono hint="Só relevante na Fase 5 (atualização de catálogo) — ver ROADMAP.md" />
        <Field label="API Key (leitura)" value={gs.apiKey} placeholder="Cole sua chave de API aqui" mono />
      </Section>

      <Section title="Evolution API (WhatsApp)" icon="💬" status={evOk ? "ok" : "pending"}>
        <Field label="URL da Evolution API" value={ev.baseUrl} placeholder="https://evolution-api-xxxx.up.railway.app" mono
          hint="Fase 4 do roadmap — pré-requisito: número da Gabi provisionado" />
        <Field label="API Key" value={ev.apiKey} placeholder="Cole a chave da Evolution API" mono />
        <Field label="Instance Name" value={ev.instanceName} placeholder="galene" />
        <Field label="Webhook URL (n8n)" value={ev.webhookUrl} placeholder="https://xxx.app.n8n.cloud/webhook/whatsapp" mono />
      </Section>

      <Section title="n8n (Automações)" icon="⚙️" status={n8Ok ? "ok" : "pending"}>
        <Field label="URL do n8n" value={n8.baseUrl} placeholder="https://seu-nome.app.n8n.cloud" mono />
        <Field label="Webhook Path" value={n8.webhookPath} placeholder="/webhook/whatsapp" hint="Caminho padrão — não altere" />
      </Section>

      <Section title="Dados da Loja" icon="🏪" status="ok">
        <div className="admin-chart-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <Field label="Nome da loja"      value={st.name}      placeholder="Galene" />
          <Field label="Nome do agente"    value={st.agentName} placeholder="Gabi" />
          <Field label="WhatsApp"          value={st.whatsapp}  placeholder="55XXXXXXXXXXX" mono />
          <Field label="Instagram"         value={st.instagram} placeholder="@galene" />
          <Field label="Pedido mínimo"     value={`${st.minOrder} peças`} placeholder="6 peças" />
          <Field label="Pagamento"         value={st.payment.join(", ")} placeholder="PIX, Cartão" />
        </div>
        <div style={{ marginTop:12, fontSize:12, color:"var(--text-4)" }}>
          ✏️ Para alterar, edite <code style={{ background:"var(--surface-6)", padding:"1px 6px", borderRadius:4, color:"#c084fc" }}>lib/adminConfig.js</code>
        </div>
      </Section>
    </div>
  );
}
