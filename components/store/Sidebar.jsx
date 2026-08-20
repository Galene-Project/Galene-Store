import { T, CATS } from "../../lib/galeneTheme";
import { buildWhatsappLink, buildInstagramLink, buildFacebookLink } from "../../lib/socialLinks";

const REDE_ICONS = {
  whatsapp: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 004.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.9C21.96 6.45 17.5 2 12.04 2zm5.8 14.1c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.13.11-1.82-.11-.42-.13-.96-.31-1.65-.6-2.9-1.25-4.79-4.17-4.94-4.36-.15-.2-1.19-1.58-1.19-3.02 0-1.43.75-2.14 1.02-2.43.27-.29.58-.36.78-.36.19 0 .39 0 .56.01.18.01.42-.07.65.5.24.58.82 2.01.89 2.16.07.15.12.32.02.52-.1.2-.15.32-.29.49-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.29.76 1.25 1.63 2.03 1.12 1 2.06 1.31 2.35 1.46.29.15.46.13.63-.08.17-.2.72-.84.91-1.13.19-.29.39-.24.65-.15.27.1 1.7.8 1.99.94.29.15.48.22.55.34.07.13.07.72-.17 1.4z"/></svg>
  ),
  instagram: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg>
  ),
  facebook: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 10-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0022 12z"/></svg>
  ),
};

export default function Sidebar({ cat, setCat, mobile, onClose, produtos, redes }) {
  const counts = {
    destaques: produtos.filter((p) => p.destaque).length,
    promocoes: produtos.filter((p) => p.precoOriginal != null).length,
    lancamentos: produtos.filter((p) => p.isLaunch).length,
  };
  const especiais = new Set(["destaques", "promocoes", "lancamentos"]);
  CATS.forEach((c) => {
    if (!especiais.has(c.id)) counts[c.id] = produtos.filter((p) => p.cat === c.id).length;
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

        {(() => {
          const links = [
            ["whatsapp", buildWhatsappLink(redes?.whatsapp)],
            ["instagram", buildInstagramLink(redes?.instagram)],
            ["facebook", buildFacebookLink(redes?.facebook)],
          ].filter(([, url]) => url);
          if (!links.length) return null;
          return (
            <div style={{ margin: "20px 12px 0", display: "flex", gap: 10, padding: "0 4px" }}>
              {links.map(([rede, url]) => (
                <a key={rede} href={url} target="_blank" rel="noopener noreferrer" aria-label={rede}
                  style={{ width: 34, height: 34, borderRadius: "50%", border: `1.5px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: T.ink3, transition: "all .15s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = T.gold; e.currentTarget.style.borderColor = T.gold; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = T.ink3; e.currentTarget.style.borderColor = T.border; }}
                >
                  {REDE_ICONS[rede]}
                </a>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
