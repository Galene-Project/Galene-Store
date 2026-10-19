import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { getSession } from "../../lib/adminAuth";
import { inputStyle, labelStyle } from "./shared";

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

export default function SettingsPage() {
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
          facebook: data.facebook || "",
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
      <Section title="Dados da Loja" icon="🏪" status="ok">
        {!loja ? (
          <div style={{ fontSize: 12, color: "var(--text-4)" }}>Carregando...</div>
        ) : (
          <>
            <div className="admin-chart-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom: 16 }}>
              <div>
                <div style={labelStyle}>Nome da loja</div>
                <input value={loja.name} onChange={(e) => setLoja((p) => ({ ...p, name: e.target.value }))}
                  style={{ ...inputStyle, width:"100%" }} />
              </div>
              <div>
                <div style={labelStyle}>Nome do agente</div>
                <input value={loja.agent_name} onChange={(e) => setLoja((p) => ({ ...p, agent_name: e.target.value }))}
                  style={{ ...inputStyle, width:"100%" }} />
              </div>
              <div>
                <div style={labelStyle}>WhatsApp</div>
                <input value={loja.whatsapp} onChange={(e) => setLoja((p) => ({ ...p, whatsapp: e.target.value }))} placeholder="55XXXXXXXXXXX"
                  style={{ ...inputStyle, width:"100%", fontFamily:"'DM Mono',monospace" }} />
              </div>
              <div>
                <div style={labelStyle}>Instagram</div>
                <input value={loja.instagram} onChange={(e) => setLoja((p) => ({ ...p, instagram: e.target.value }))} placeholder="@galene ou link completo"
                  style={{ ...inputStyle, width:"100%" }} />
              </div>
              <div>
                <div style={labelStyle}>Facebook</div>
                <input value={loja.facebook} onChange={(e) => setLoja((p) => ({ ...p, facebook: e.target.value }))} placeholder="galene ou link completo"
                  style={{ ...inputStyle, width:"100%" }} />
              </div>
              <div>
                <div style={labelStyle}>Pedido mínimo</div>
                <input type="number" min="1" step="1" value={loja.min_order} onChange={(e) => setLoja((p) => ({ ...p, min_order: e.target.value }))}
                  style={{ ...inputStyle, width:"100%" }} />
              </div>
              <div>
                <div style={labelStyle}>Pagamento</div>
                <div style={{ ...inputStyle, color:"var(--text-4)" }}>
                  Pix (automático) — site público só oferece Pix. Cartão fica fora do site, só pra cliente selecionado ou compra na loja física.
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
