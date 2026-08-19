import React, { useEffect, useState } from "react";
import CONFIG from "../../lib/adminConfig";
import { supabase } from "../../lib/supabaseClient";
import { getSession } from "../../lib/adminAuth";

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

  const gsOk = isConfigured(gs.sheetId) && isConfigured(gs.apiKey);
  const evOk = isConfigured(ev.baseUrl) && isConfigured(ev.apiKey);

  const done  = [gsOk, evOk].filter(Boolean).length;
  const total = 2;
  const pct   = Math.round((done / total) * 100);

  const [loja, setLoja] = useState(null);
  const [lojaId, setLojaId] = useState(null);
  const [salvandoLoja, setSalvandoLoja] = useState(false);
  const [erroLoja, setErroLoja] = useState("");
  const [sucessoLoja, setSucessoLoja] = useState(false);

  useEffect(() => {
    supabase.from("store_settings").select("*").limit(1).single().then(({ data }) => {
      if (data) {
        setLojaId(data.id);
        setLoja({
          name: data.name || "",
          agent_name: data.agent_name || "",
          whatsapp: data.whatsapp || "",
          instagram: data.instagram || "",
          min_order: data.min_order,
        });
      }
    });
  }, []);

  async function salvarLoja() {
    setSalvandoLoja(true);
    setErroLoja("");
    setSucessoLoja(false);
    try {
      const session = await getSession();
      const res = await fetch("/api/admin/loja", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(loja),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message || "Falha ao salvar.");
      setSucessoLoja(true);
      setTimeout(() => setSucessoLoja(false), 3000);
    } catch (err) {
      setErroLoja(err.message);
    } finally {
      setSalvandoLoja(false);
    }
  }

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
      </Section>

      <Section title="Dados da Loja" icon="🏪" status="ok">
        {!loja ? (
          <div style={{ fontSize: 12, color: "var(--text-4)" }}>Carregando...</div>
        ) : (
          <>
            <div className="admin-chart-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize:11, fontWeight:600, color:"var(--text-3)", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.05em" }}>Nome da loja</div>
                <input value={loja.name} onChange={(e) => setLoja((p) => ({ ...p, name: e.target.value }))}
                  style={{ width:"100%", padding:"11px 14px", borderRadius:10, background:"var(--surface-3)", border:"1.5px solid var(--surface-7)", color:"var(--text-2)", fontSize:12, boxSizing:"border-box" }} />
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:600, color:"var(--text-3)", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.05em" }}>Nome do agente</div>
                <input value={loja.agent_name} onChange={(e) => setLoja((p) => ({ ...p, agent_name: e.target.value }))}
                  style={{ width:"100%", padding:"11px 14px", borderRadius:10, background:"var(--surface-3)", border:"1.5px solid var(--surface-7)", color:"var(--text-2)", fontSize:12, boxSizing:"border-box" }} />
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:600, color:"var(--text-3)", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.05em" }}>WhatsApp</div>
                <input value={loja.whatsapp} onChange={(e) => setLoja((p) => ({ ...p, whatsapp: e.target.value }))} placeholder="55XXXXXXXXXXX"
                  style={{ width:"100%", padding:"11px 14px", borderRadius:10, background:"var(--surface-3)", border:"1.5px solid var(--surface-7)", color:"var(--text-2)", fontSize:12, fontFamily:"'DM Mono',monospace", boxSizing:"border-box" }} />
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:600, color:"var(--text-3)", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.05em" }}>Instagram</div>
                <input value={loja.instagram} onChange={(e) => setLoja((p) => ({ ...p, instagram: e.target.value }))} placeholder="@galene"
                  style={{ width:"100%", padding:"11px 14px", borderRadius:10, background:"var(--surface-3)", border:"1.5px solid var(--surface-7)", color:"var(--text-2)", fontSize:12, boxSizing:"border-box" }} />
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:600, color:"var(--text-3)", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.05em" }}>Pedido mínimo</div>
                <input type="number" min="1" step="1" value={loja.min_order} onChange={(e) => setLoja((p) => ({ ...p, min_order: e.target.value }))}
                  style={{ width:"100%", padding:"11px 14px", borderRadius:10, background:"var(--surface-3)", border:"1.5px solid var(--surface-7)", color:"var(--text-2)", fontSize:12, boxSizing:"border-box" }} />
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:600, color:"var(--text-3)", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.05em" }}>Pagamento</div>
                <div style={{ padding:"11px 14px", borderRadius:10, background:"var(--surface-3)", border:"1.5px solid var(--surface-7)", color:"var(--text-4)", fontSize:12 }}>
                  Pix (automático) · Cartão (pendente de aprovação)
                </div>
              </div>
            </div>

            {erroLoja && (
              <div style={{ marginBottom:12, padding:"10px 14px", borderRadius:10, background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)", color:"#fca5a5", fontSize:12 }}>
                ⚠️ {erroLoja}
              </div>
            )}
            {sucessoLoja && (
              <div style={{ marginBottom:12, padding:"10px 14px", borderRadius:10, background:"rgba(52,211,153,0.1)", border:"1px solid rgba(52,211,153,0.3)", color:"#34d399", fontSize:12 }}>
                ✅ Salvo — já reflete no site.
              </div>
            )}

            <button
              onClick={salvarLoja}
              disabled={salvandoLoja}
              style={{
                padding:"10px 20px", borderRadius:10, border:"none",
                background:"linear-gradient(135deg,#c084fc,#818cf8)", color:"white",
                fontSize:12, fontWeight:700, cursor: salvandoLoja ? "wait" : "pointer",
              }}>
              {salvandoLoja ? "Salvando..." : "Salvar"}
            </button>
          </>
        )}
      </Section>
    </div>
  );
}
