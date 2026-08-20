import { useState } from "react";
import { T } from "../../lib/galeneTheme";

// Mesmo tamanho da foto nos cards de produto (components/store/Cards.jsx,
// componente Card: height 190, grid minmax(200px,1fr)) — fixo, não escala
// com a largura do modal, senão fica desproporcional no desktop.
export default function MediaCarousel({ items, width = 200, height = 190 }) {
  const [i, setI] = useState(0);
  if (!items.length) return null;
  const atual = items[i];
  const arrowSize = 26;

  const prev = () => setI((p) => (p === 0 ? items.length - 1 : p - 1));
  const next = () => setI((p) => (p === items.length - 1 ? 0 : p + 1));

  return (
    <div style={{ width, height, position: "relative", borderRadius: 12, overflow: "hidden", flexShrink: 0, background: "#000" }}>
      {atual.type === "video" ? (
        <video key={atual.url} src={atual.url} controls style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      ) : (
        <img key={atual.url} src={atual.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      )}

      {items.length > 1 && (
        <>
          <button onClick={prev} aria-label="Anterior" style={{
            position: "absolute", left: 2, top: "50%", transform: "translateY(-50%)",
            width: arrowSize, height: arrowSize, borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.45)",
            color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, padding: 0,
          }}>‹</button>
          <button onClick={next} aria-label="Próxima" style={{
            position: "absolute", right: 2, top: "50%", transform: "translateY(-50%)",
            width: arrowSize, height: arrowSize, borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.45)",
            color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, padding: 0,
          }}>›</button>

          <div style={{ position: "absolute", bottom: 4, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 4 }}>
            {items.map((_, idx) => (
              <button key={idx} onClick={() => setI(idx)} aria-label={`Item ${idx + 1}`} style={{
                width: 5, height: 5, borderRadius: "50%", border: "none", padding: 0, cursor: "pointer",
                background: idx === i ? T.gold : "rgba(255,255,255,0.6)",
              }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
