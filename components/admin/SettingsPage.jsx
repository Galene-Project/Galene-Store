import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { getSession } from "../../lib/adminAuth";
import { inputStyle, labelStyle } from "./shared";

const Section = ({ title, icon, children, status }) => {
  const [open, setOpen] = useState(true);
  const colors = {
    ok:      { bg:"var(--pill-positive-bg)",  border:"var(--pill-positive-bg)",  dot:"var(--positive)", label:"Conectado"    },
    pending: { bg:"var(--pill-warning-bg)", border:"var(--pill-warning-bg)", dot:"var(--warning)", label:"Configurar"   },
    error:   { bg:"var(--pill-negative-bg)",  border:"var(--pill-negative-bg)",  dot:"var(--negative)", label:"Erro"         },
  };
  const c = colors[status] || colors.pending;
  return (
    <div style={{ marginBottom:16, borderRadius:8, overflow:"hidden", border:"1px solid var(--border)", background:"var(--surface)" }}>
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
          <span style={{ fontSize:14, fontWeight: 600, color:"var(--text-2)" }}>{title}</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{
            fontSize: 12, fontWeight: 600, padding:"3px 10px", borderRadius:20,
            background:c.bg, border:`1px solid ${c.border}`, color:c.dot,
          }}>{c.label}</span>
          <span style={{ color:"var(--text-5)", fontSize:12, transition:"transform 0.2s", display:"inline-block", transform:open?"rotate(90deg)":"" }}>▶</span>
        </div>
      </div>
      {open && (
        <div style={{ padding:"20px 22px 22px", background:"var(--surface)", borderTop:"1px solid var(--border)" }}>
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
          pix_key: data.pix_key || "",
          pix_name: data.pix_name || "",
          pix_city: data.pix_city || "",
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
      <Section title="Dados da Loja" icon="" status="ok">
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
                  style={{ ...inputStyle, width:"100%", fontFamily:"var(--font)" }} />
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
                <div style={labelStyle}>Chave Pix</div>
                <input value={loja.pix_key} onChange={(e) => setLoja((p) => ({ ...p, pix_key: e.target.value }))} placeholder="CNPJ, e-mail, +5511999999999 ou chave aleatória"
                  style={{ ...inputStyle, width:"100%" }} />
              </div>
              <div>
                <div style={labelStyle}>Nome do recebedor (Pix)</div>
                <input value={loja.pix_name} onChange={(e) => setLoja((p) => ({ ...p, pix_name: e.target.value }))} placeholder="Como aparece no banco"
                  style={{ ...inputStyle, width:"100%" }} />
              </div>
              <div>
                <div style={labelStyle}>Cidade (Pix)</div>
                <input value={loja.pix_city} onChange={(e) => setLoja((p) => ({ ...p, pix_city: e.target.value }))} placeholder="São Paulo"
                  style={{ ...inputStyle, width:"100%" }} />
              </div>
              <div>
                <div style={labelStyle}>Pagamento</div>
                <div style={{ ...inputStyle, color:"var(--text-4)" }}>
                  Pix gerado automático com o valor do pedido (se a chave estiver preenchida). Você confirma o pagamento no painel; o estoque só baixa depois da confirmação.
                </div>
              </div>
            </div>

            {erroLoja && (
              <div style={{ marginBottom:12, padding:"10px 14px", borderRadius:10, background:"var(--pill-negative-bg)", border:"1px solid var(--pill-negative-bg)", color:"var(--negative)", fontSize:12 }}>
                {erroLoja}
              </div>
            )}
            {sucessoLoja && (
              <div style={{ marginBottom:12, padding:"10px 14px", borderRadius:10, background:"var(--pill-positive-bg)", border:"1px solid var(--pill-positive-bg)", color:"var(--positive)", fontSize:12 }}>
                Salvo — já reflete no site.
              </div>
            )}

            <button
              onClick={salvarLoja}
              disabled={salvandoLoja}
              style={{
                padding:"10px 20px", borderRadius:10, border:"none",
                background:"var(--primary)", color: "var(--primary-ink)",
                fontSize:12, fontWeight: 600, cursor: salvandoLoja ? "wait" : "pointer",
              }}>
              {salvandoLoja ? "Salvando..." : "Salvar"}
            </button>
          </>
        )}
      </Section>
    </div>
  );
}
