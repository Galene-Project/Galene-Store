import { useState, useEffect, useCallback } from "react";
import Sil from "./Sil";
import InstagramEmbed from "./InstagramEmbed";
import { sortVideoFirst } from "../../lib/instagramUrl";
import { T, COR_HEX, fmt, sortSizes } from "../../lib/galeneTheme";
import { useWindowWidth } from "../../hooks/useWindowWidth";

export default function ModalProd({ prod, onClose, onAdd }) {
  const [sel, setSel] = useState([]);
  const [cor, setCor] = useState(prod.cores[0]);
  const [tam, setTam] = useState(null);
  const w = useWindowWidth();
  const mob = w < 640;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    function onKeyDown(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const addSel = useCallback(() => {
    if (!tam) return;
    if (prod.corTam?.[cor]?.[tam] === "esgotado") return;
    const key = `${cor}__${tam}`;
    setSel((prev) => {
      const ex = prev.find((s) => s.key === key);
      if (ex) return prev.map((s) => s.key === key ? { ...s, qtd: s.qtd + 1 } : s);
      return [...prev, { key, cor, tam, qtd: 1 }];
    });
  }, [cor, tam, prod.corTam]);

  const updQ = (key, d) =>
    setSel((p) => p.map((s) => s.key === key ? { ...s, qtd: Math.max(1, s.qtd + d) } : s));

  const remS = (key) => setSel((p) => p.filter((s) => s.key !== key));

  const totPcs = sel.reduce((a, s) => a + s.qtd, 0);
  const totVal = sel.reduce((a, s) => a + s.qtd * prod.preco, 0);

  const handleAdd = () => {
    if (!sel.length) return;
    onAdd(prod, sel);
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 900, display: "flex", alignItems: mob ? "flex-end" : "center", justifyContent: "center", padding: mob ? 0 : 20 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(26,23,20,0.55)", backdropFilter: "blur(3px)" }} />
      <div style={{ position: "relative", background: T.panel, width: "100%", maxWidth: 540, maxHeight: mob ? "92dvh" : "90vh", overflowY: "auto", borderRadius: mob ? "18px 18px 0 0" : 18, boxShadow: "0 24px 80px rgba(26,23,20,0.22)" }}>
        <div style={{ height: 3, background: `linear-gradient(90deg,${T.goldDk},${T.gold},${T.goldLt},${T.gold},${T.goldDk})` }} />
        <div style={{ padding: mob ? "20px 18px 32px" : "28px 30px 36px" }}>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <div style={{ fontFamily: "'Lato',sans-serif", fontSize: 10, letterSpacing: 2.5, color: T.ink4, textTransform: "uppercase", marginBottom: 4 }}>
                {prod.cat} — {prod.sub}
              </div>
              <h2 style={{ margin: 0, fontFamily: "'Cormorant Garamond',serif", fontSize: mob ? 22 : 28, color: T.ink, fontWeight: 600 }}>
                {prod.nome}
              </h2>
            </div>
            <button onClick={onClose} aria-label="Fechar" style={{ background: "none", border: `1.5px solid ${T.border}`, borderRadius: 8, width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.ink3, fontSize: 18, flexShrink: 0 }}>✕</button>
          </div>

          {prod.instagramUrls?.length > 0 && (
            <div style={{ marginBottom: 24, display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
              {sortVideoFirst(prod.instagramUrls).map((url) => <InstagramEmbed key={url} url={url} />)}
            </div>
          )}

          <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
            <div style={{ width: 110, height: 120, background: `linear-gradient(135deg,${T.bg2},${T.bg3})`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Sil cat={prod.cat} cor={COR_HEX[cor] || T.gold} sz={92} />
            </div>
            <div style={{ flex: 1 }}>
              {prod.precoOriginal && (
                <div style={{ fontFamily: "'Lato',sans-serif", fontSize: 13, color: T.ink4, textDecoration: "line-through" }}>
                  {fmt(prod.precoOriginal)}
                </div>
              )}
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 34, color: T.goldDk, fontWeight: 600, lineHeight: 1 }}>
                {fmt(prod.preco)}
              </div>
              <div style={{ fontFamily: "'Lato',sans-serif", fontSize: 10, color: T.ink4, margin: "4px 0 10px", letterSpacing: 1 }}>
                por peça · atacado
              </div>
              <p style={{ margin: 0, fontFamily: "'Lato',sans-serif", fontSize: 11.5, color: T.ink3, lineHeight: 1.6 }}>
                {prod.desc}
              </p>
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <div style={{ fontFamily: "'Lato',sans-serif", fontSize: 10, letterSpacing: 2, color: T.ink4, textTransform: "uppercase", marginBottom: 10 }}>
              Cor: <span style={{ color: T.goldDk }}>{cor}</span>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {prod.cores.map((c) => {
                const esgotada = prod.corEsgotadaMap?.[c];
                const baixa = prod.corBaixaMap?.[c];
                return (
                  <button
                    key={c}
                    disabled={esgotada}
                    onClick={() => { setCor(c); setTam(null); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 6, padding: "5px 10px 5px 7px",
                      border: `1.5px solid ${cor === c ? T.gold : T.border}`, borderRadius: 20,
                      background: cor === c ? T.goldXlt : T.panel,
                      cursor: esgotada ? "not-allowed" : "pointer",
                      opacity: esgotada ? 0.4 : 1,
                      transition: "all .15s",
                    }}
                  >
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: COR_HEX[c] || T.gold, border: "1px solid rgba(0,0,0,0.1)" }} />
                    <span style={{ fontFamily: "'Lato',sans-serif", fontSize: 11, color: cor === c ? T.goldDk : T.ink3 }}>{c}</span>
                    {baixa && !esgotada && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b" }} />}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <div style={{ fontFamily: "'Lato',sans-serif", fontSize: 10, letterSpacing: 2, color: T.ink4, textTransform: "uppercase", marginBottom: 10 }}>
              Tamanho {tam && <span style={{ color: T.jade }}>{tam}</span>}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(sortSizes(Object.keys(prod.corTam?.[cor] || {}))).map((t) => {
                const status = prod.corTam?.[cor]?.[t];
                const esgotado = status === "esgotado";
                const baixo = status === "baixo";
                return (
                  <button
                    key={t}
                    disabled={esgotado}
                    onClick={() => setTam(t)}
                    style={{
                      width: 54, height: baixo ? 58 : 48,
                      background: tam === t ? T.goldDk : T.panel,
                      border: `1.5px solid ${tam === t ? T.gold : T.border}`,
                      borderRadius: 10,
                      cursor: esgotado ? "not-allowed" : "pointer",
                      opacity: esgotado ? 0.4 : 1,
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                      fontFamily: "'Lato',sans-serif",
                      transition: "all .15s",
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 700, color: tam === t ? "white" : T.ink2 }}>{t}</span>
                    {baixo && (
                      <span style={{ fontSize: 8, fontWeight: 600, color: tam === t ? "white" : "#f59e0b", lineHeight: 1 }}>
                        últimas peças
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <button onClick={addSel} disabled={!tam} style={{ width: "100%", height: 44, background: !tam ? T.bg2 : `linear-gradient(135deg,${T.ink2},${T.ink})`, border: "none", borderRadius: 10, cursor: !tam ? "not-allowed" : "pointer", fontFamily: "'Lato',sans-serif", fontSize: 12, fontWeight: 700, color: !tam ? T.ink4 : "white", letterSpacing: 1, transition: "all .15s", marginBottom: 14 }}>
            {tam ? `+ Adicionar ${cor} / ${tam}` : "Selecione um tamanho"}
          </button>

          {sel.length > 0 && (
            <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, marginBottom: 14, overflow: "hidden" }}>
              <div style={{ padding: "10px 14px", borderBottom: `1px solid ${T.border}`, fontFamily: "'Lato',sans-serif", fontSize: 10, letterSpacing: 2, color: T.ink4, textTransform: "uppercase" }}>
                Selecionados
              </div>
              {sel.map((s) => (
                <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: COR_HEX[s.cor] || T.gold, border: "1px solid rgba(0,0,0,0.1)", flexShrink: 0 }} />
                  <span style={{ fontFamily: "'Lato',sans-serif", fontSize: 11.5, color: T.ink2, flex: 1 }}>{s.cor} / {s.tam}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button onClick={() => updQ(s.key, -1)} style={{ width: 26, height: 26, background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 6, cursor: "pointer", fontSize: 14, color: T.ink2, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                    <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, color: T.ink, fontWeight: 600, minWidth: 20, textAlign: "center" }}>{s.qtd}</span>
                    <button onClick={() => updQ(s.key, 1)} style={{ width: 26, height: 26, background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 6, cursor: "pointer", fontSize: 14, color: T.ink2, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                  </div>
                  <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 13, color: T.goldDk, minWidth: 60, textAlign: "right" }}>{fmt(s.qtd * prod.preco)}</span>
                  <button onClick={() => remS(s.key)} aria-label="Remover" style={{ background: "none", border: "none", cursor: "pointer", color: T.ink4, fontSize: 16, padding: 2 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                  </button>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px" }}>
                <span style={{ fontFamily: "'Lato',sans-serif", fontSize: 11, color: T.ink3 }}>{totPcs} peça{totPcs !== 1 ? "s" : ""}</span>
                <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, color: T.goldDk, fontWeight: 600 }}>{fmt(totVal)}</span>
              </div>
            </div>
          )}

          <button onClick={handleAdd} disabled={!sel.length} style={{ width: "100%", height: 52, background: sel.length ? T.goldDk : T.bg2, border: "none", borderRadius: 12, cursor: sel.length ? "pointer" : "not-allowed", fontFamily: "'Lato',sans-serif", fontSize: 13, fontWeight: 700, color: sel.length ? "white" : T.ink4, letterSpacing: 1, transition: "all .2s" }}>
            {sel.length ? `Adicionar ao Pedido — ${fmt(totVal)}` : "Selecione cor e tamanho"}
          </button>
        </div>
      </div>
    </div>
  );
}
