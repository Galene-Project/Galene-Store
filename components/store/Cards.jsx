import { useState } from "react";
import Sil from "./Sil";
import { T, COR_HEX, fmt } from "../../lib/galeneTheme";
import { useWindowWidth } from "../../hooks/useWindowWidth";

export function CardDest({ prod, onClick }) {
  const [hov, setHov] = useState(false);
  const [ci, setCi] = useState(0);
  const w = useWindowWidth();
  const mob = w < 640;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: T.panel,
        border: `1.5px solid ${hov ? T.gold : T.border}`,
        borderRadius: 16, overflow: "hidden", cursor: "pointer",
        position: "relative", display: "flex", flexDirection: "column",
        transition: "border-color .2s, box-shadow .2s",
        boxShadow: hov ? `0 8px 32px rgba(184,147,90,0.18)` : `0 2px 12px rgba(26,23,20,0.06)`,
      }}
    >
      {prod.tag && (
        <div style={{
          position: "absolute", top: 14, left: 14, zIndex: 10,
          background: prod.tag === "Mais Vendido" ? T.gold : prod.tag === "Premium" ? T.ruby : T.jade,
          color: "white", fontFamily: "'Lato',sans-serif", fontSize: 9, fontWeight: 700,
          letterSpacing: 1.5, padding: "4px 10px", borderRadius: 20, textTransform: "uppercase",
        }}>
          {prod.tag}
        </div>
      )}
      <div style={{ height: mob ? 240 : 300, background: `linear-gradient(160deg,${T.bg2},${T.bg3})`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(circle at 70% 30%, ${T.goldXlt}40 0%, transparent 60%)` }} />
        <Sil cat={prod.cat} cor={COR_HEX[prod.cores[ci]] || T.gold} sz={mob ? 190 : 240} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: `linear-gradient(to top, ${T.panel}CC, transparent)` }} />
        <div style={{ position: "absolute", bottom: 16, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6 }}>
          {prod.cores.map((c, i) => (
            <button
              key={c}
              type="button"
              onClick={(e) => { e.stopPropagation(); setCi(i); }}
              title={prod.corEsgotadaMap?.[c] ? `${c} (esgotado)` : c}
              aria-label={`Ver cor ${c}`}
              style={{ width: 18, height: 18, padding: 0, borderRadius: "50%", background: COR_HEX[c] || T.gold, border: `2px solid ${i === ci ? T.gold : "transparent"}`, cursor: "pointer", opacity: prod.corEsgotadaMap?.[c] ? 0.35 : 1, transition: "border-color .15s, opacity .15s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}
            />
          ))}
        </div>
      </div>
      <div style={{ padding: "18px 20px 22px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ fontFamily: "'Lato',sans-serif", fontSize: 9.5, letterSpacing: 2.5, color: T.ink4, textTransform: "uppercase", marginBottom: 6 }}>
          {prod.cat} — {prod.sub}
        </div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: mob ? 20 : 24, color: T.ink, marginBottom: 8, fontWeight: 600 }}>
          {prod.nome}
        </div>
        <p style={{ margin: "0 0 16px", fontFamily: "'Lato',sans-serif", fontSize: 11.5, color: T.ink3, lineHeight: 1.6, flex: 1 }}>
          {prod.desc}
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            {prod.precoOriginal && (
              <div style={{ fontFamily: "'Lato',sans-serif", fontSize: 11, color: T.ink4, textDecoration: "line-through" }}>
                {fmt(prod.precoOriginal)}
              </div>
            )}
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: mob ? 24 : 28, color: T.goldDk, fontWeight: 600 }}>
              {fmt(prod.preco)}
            </div>
            <div style={{ fontFamily: "'Lato',sans-serif", fontSize: 9.5, color: T.ink4 }}>por peça</div>
          </div>
          <button type="button" onClick={(e) => { e.stopPropagation(); onClick(); }} aria-label={`Selecionar ${prod.nome}`} style={{ background: T.goldDk, border: "none", borderRadius: 10, padding: "10px 18px", color: "white", fontFamily: "'Lato',sans-serif", fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: 1 }}>
            Selecionar
          </button>
        </div>
      </div>
    </div>
  );
}

export function Card({ prod, onClick }) {
  const [hov, setHov] = useState(false);
  const [ci, setCi] = useState(0);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: T.panel,
        border: `1px solid ${hov ? T.gold : T.border}`,
        borderRadius: 12, overflow: "hidden", cursor: "pointer",
        position: "relative", transition: "all .2s",
        boxShadow: hov ? `0 6px 24px rgba(184,147,90,0.15)` : `0 1px 8px rgba(26,23,20,0.05)`,
      }}
    >
      {prod.tag && (
        <div style={{
          position: "absolute", top: 10, left: 10, zIndex: 10,
          background: prod.tag === "Mais Vendido" ? T.gold : prod.tag === "Premium" ? T.ruby : T.jade,
          color: "white", fontFamily: "'Lato',sans-serif", fontSize: 8, fontWeight: 700,
          letterSpacing: 1, padding: "3px 8px", borderRadius: 20, textTransform: "uppercase",
        }}>
          {prod.tag}
        </div>
      )}
      <div style={{ height: 190, background: `linear-gradient(160deg,${T.bg2},${T.bg3})`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
        <Sil cat={prod.cat} cor={COR_HEX[prod.cores[ci]] || T.gold} sz={155} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 50, background: `linear-gradient(to top, ${T.panel}CC, transparent)` }} />
        <div style={{ position: "absolute", bottom: 12, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 5 }}>
          {prod.cores.slice(0, 5).map((c, i) => (
            <button
              key={c}
              type="button"
              onClick={(e) => { e.stopPropagation(); setCi(i); }}
              title={prod.corEsgotadaMap?.[c] ? `${c} (esgotado)` : c}
              aria-label={`Ver cor ${c}`}
              style={{ width: 14, height: 14, padding: 0, borderRadius: "50%", background: COR_HEX[c] || T.gold, border: `1.5px solid ${i === ci ? T.gold : "transparent"}`, cursor: "pointer", opacity: prod.corEsgotadaMap?.[c] ? 0.35 : 1, boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}
            />
          ))}
        </div>
      </div>
      <div style={{ padding: "13px 15px 17px" }}>
        <div style={{ fontFamily: "'Lato',sans-serif", fontSize: 9, letterSpacing: 2, color: T.ink4, textTransform: "uppercase", marginBottom: 4 }}>
          {prod.sub}
        </div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, color: T.ink, marginBottom: 10, fontWeight: 600 }}>
          {prod.nome}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            {prod.precoOriginal && (
              <div style={{ fontFamily: "'Lato',sans-serif", fontSize: 9.5, color: T.ink4, textDecoration: "line-through" }}>
                {fmt(prod.precoOriginal)}
              </div>
            )}
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 19, color: T.goldDk, fontWeight: 600 }}>
              {fmt(prod.preco)}
            </div>
          </div>
          <button type="button" onClick={(e) => { e.stopPropagation(); onClick(); }} aria-label={`Ver ${prod.nome}`} style={{
            background: hov ? T.goldDk : "transparent",
            border: `1.5px solid ${hov ? T.gold : T.border}`,
            borderRadius: 8, padding: "6px 12px", cursor: "pointer",
            fontFamily: "'Lato',sans-serif", fontSize: 10, fontWeight: 700,
            color: hov ? "white" : T.ink4, transition: "all .2s", letterSpacing: 0.5,
          }}>
            Ver
          </button>
        </div>
      </div>
    </div>
  );
}
