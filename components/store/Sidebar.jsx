import { T, CATS } from "../../lib/galeneTheme";

export default function Sidebar({ cat, setCat, mobile, onClose, produtos, minOrder }) {
  const counts = {
    destaques: produtos.filter((p) => p.destaque).length,
    promocoes: produtos.filter((p) => p.precoOriginal != null).length,
  };
  CATS.forEach((c) => {
    if (c.id !== "destaques" && c.id !== "promocoes") counts[c.id] = produtos.filter((p) => p.cat === c.id).length;
  });

  return (
    <div style={{ width: mobile ? 260 : 200, background: T.panel, borderRight: `1px solid ${T.border}`, height: "100%", overflowY: "auto" }}>
      {mobile && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 16px 12px" }}>
          <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, color: T.goldDk, fontWeight: 600 }}>Categorias</span>
          <button onClick={onClose} aria-label="Fechar menu" style={{ background: "none", border: "none", fontSize: 20, color: T.ink3, cursor: "pointer" }}>✕</button>
        </div>
      )}
      <div style={{ padding: "16px 0 28px" }}>
        <div style={{ padding: "0 16px 8px", fontFamily: "'Lato',sans-serif", fontSize: 9, letterSpacing: 2, color: T.ink4, textTransform: "uppercase" }}>
          Categorias
        </div>
        {CATS.map((c) => {
          const ativa = cat === c.id;
          return (
            <button
              key={c.id}
              onClick={() => { setCat(c.id); if (mobile && onClose) onClose(); }}
              style={{
                width: "100%", textAlign: "left",
                background: ativa ? T.goldXlt : "transparent",
                border: "none", padding: "10px 16px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 10,
                borderLeft: `3px solid ${ativa ? T.gold : "transparent"}`,
                transition: "all .15s",
              }}
              onMouseEnter={(e) => { if (!ativa) e.currentTarget.style.background = T.bg2; }}
              onMouseLeave={(e) => { if (!ativa) e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ fontSize: 14, lineHeight: 1, flexShrink: 0 }}>{c.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Lato',sans-serif", fontSize: 12, fontWeight: ativa ? 700 : 500, color: ativa ? T.goldDk : T.ink2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {c.label}
                </div>
                <div style={{ fontFamily: "'Lato',sans-serif", fontSize: 9.5, color: T.ink4, marginTop: 1 }}>
                  {counts[c.id] || 0} produtos
                </div>
              </div>
              {ativa && <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.gold, flexShrink: 0 }} />}
            </button>
          );
        })}

        <div style={{ margin: "20px 12px 0", padding: "14px", background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 10 }}>
          <div style={{ fontFamily: "'Lato',sans-serif", fontSize: 9, letterSpacing: 2, color: T.ink4, textTransform: "uppercase", marginBottom: 10 }}>
            Condições
          </div>
          {[["Pedido min.", `${minOrder} peças`], ["Pagamento", "PIX ou Cartão"]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontFamily: "'Lato',sans-serif", fontSize: 11, color: T.ink2, fontWeight: 600 }}>{k}</span>
              <span style={{ fontFamily: "'Lato',sans-serif", fontSize: 10, color: T.ink3 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
