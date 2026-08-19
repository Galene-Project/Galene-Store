import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import Sidebar from "./Sidebar";
import ModalProd from "./ModalProd";
import Carrinho from "./Carrinho";
import { CardDest, Card } from "./Cards";
import { T, CATS, sortSizes } from "../../lib/galeneTheme";
import { mapProdutos } from "../../lib/catalogo";
import { useWindowWidth } from "../../hooks/useWindowWidth";
import { supabase } from "../../lib/supabaseClient";

// ponytail: só M/G/Unico aparecem na loja por decisão do negócio (2026-08-14);
// os outros tamanhos continuam no banco (stock intacto) pra reativar sem migração.
const TAMANHOS_VISIVEIS = new Set(["M", "G", "Unico"]);

export default function GaleneStore() {
  const w = useWindowWidth();
  const mob = w < 900;
  const [cat, setCat] = useState("destaques");
  const [modal, setModal] = useState(null);
  const [cart, setCart] = useState([]);
  const [currentView, setCurrentView] = useState("loja");
  const [drawer, setDrawer] = useState(false);
  const [toast, setToast] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [minOrder, setMinOrder] = useState(6);

  useEffect(() => {
    async function fetchProdutos() {
      const [{ data, error }, { data: statusRows, error: statusErr }, { data: settingsRow }] = await Promise.all([
        supabase
          .from("products")
          .select(`
            id, name, category, material, price, price_original, discount_percentage, description, featured, tag, instagram_urls, is_launch,
            product_colors ( colors ( name ) ),
            stock ( color_id, size_id, colors ( name ), sizes ( name ) )
          `)
          .eq("is_active", true),
        supabase.from("estoque_status_publico").select("product_id, color_id, size_id, status").limit(5000),
        supabase.from("store_settings").select("min_order").limit(1).single(),
      ]);
      if (error) { console.error("Erro ao buscar produtos:", error); setLoading(false); return; }
      if (statusErr) { console.error("Erro ao buscar status de estoque:", statusErr); }
      if (settingsRow?.min_order) setMinOrder(settingsRow.min_order);

      const baseProdutos = (data || []).map((p) => ({
        id: p.id,
        nome: p.name,
        cat: p.category,
        sub: p.material,
        preco: Number(p.price),
        precoOriginal: p.price_original ? Number(p.price_original) : null,
        descontoPct: p.discount_percentage ? Number(p.discount_percentage) : null,
        destaque: p.featured,
        tag: p.tag,
        instagramUrls: p.instagram_urls || [],
        isLaunch: p.is_launch,
        desc: p.description,
        cores: [...new Set(p.product_colors.map((pc) => pc.colors.name))],
        tamanhos: sortSizes([...new Set(
          p.stock.filter((s) => s.sizes?.name && TAMANHOS_VISIVEIS.has(s.sizes.name)).map((s) => s.sizes.name)
        )]),
        product_colors: p.product_colors,
        stock: p.stock,
      }));

      const mapped = mapProdutos(baseProdutos, statusRows || [], TAMANHOS_VISIVEIS)
        .map(({ product_colors, stock, ...p }) => p)
        .filter((p) => p.cores.length && p.tamanhos.length);
      setProdutos(mapped);
      setLoading(false);
    }
    fetchProdutos();
  }, []);

  const totPcs = cart.reduce((s, i) => s + i.sel.reduce((a, x) => a + x.qtd, 0), 0);
  const prods = cat === "destaques"
    ? produtos.filter((p) => p.destaque)
    : cat === "promocoes"
    ? produtos.filter((p) => p.precoOriginal != null)
    : cat === "lancamentos"
    ? produtos.filter((p) => p.isLaunch)
    : produtos.filter((p) => p.cat === cat);

  const addToCart = useCallback((prod, sel) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.id === prod.id);
      if (idx >= 0) {
        const up = [...prev];
        const mg = [...up[idx].sel];
        sel.forEach((s) => {
          const mi = mg.findIndex((m) => m.key === s.key);
          if (mi >= 0) mg[mi] = { ...mg[mi], qtd: mg[mi].qtd + s.qtd };
          else mg.push(s);
        });
        up[idx] = { ...up[idx], sel: mg };
        return up;
      }
      return [...prev, { ...prod, sel }];
    });
    const n = sel.reduce((a, s) => a + s.qtd, 0);
    setToast(`${n} peça${n > 1 ? "s" : ""} de "${prod.nome}" adicionada${n > 1 ? "s" : ""}!`);
    setTimeout(() => setToast(null), 3500);
  }, []);

  const handleFinish = useCallback(() => {
    setCart([]);
    setCurrentView("loja");
    setCat("destaques");
  }, []);

  return (
    <div style={{ fontFamily: "'Lato',sans-serif", background: T.bg, minHeight: "100vh", color: T.ink }}>
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 18px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 4px 20px rgba(26,23,20,0.15)", fontFamily: "'Lato',sans-serif", fontSize: 12, color: T.ink2, maxWidth: 320 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ color: T.jade, flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>
          {toast}
        </div>
      )}

      {mob && drawer && (
        <div style={{ position: "fixed", inset: 0, zIndex: 600 }}>
          <div onClick={() => setDrawer(false)} style={{ position: "absolute", inset: 0, background: "rgba(26,23,20,0.4)" }} />
          <div style={{ position: "absolute", top: 0, left: 0, bottom: 0 }}>
            <Sidebar cat={cat} setCat={setCat} mobile={true} onClose={() => setDrawer(false)} produtos={produtos} minOrder={minOrder} />
          </div>
        </div>
      )}

      <header style={{ position: "sticky", top: 0, zIndex: 400, background: T.panel, borderBottom: `1px solid ${T.border}`, boxShadow: "0 2px 12px rgba(26,23,20,0.06)" }}>
        <div style={{ background: T.goldDk, padding: "7px 16px", textAlign: "center", fontFamily: "'Lato',sans-serif", fontSize: 10, letterSpacing: 2.5, color: "white", fontWeight: 700 }}>
          ✦ ATACADO ✦ PIX E CARTÃO ✦ PEDIDO MÍNIMO {minOrder} PEÇAS ✦
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: mob ? "12px 14px" : "14px 24px" }}>
          {mob && (
            <button onClick={() => setDrawer(true)} aria-label="Menu" style={{ background: "none", border: `1.5px solid ${T.border}`, borderRadius: 8, padding: "8px 10px", cursor: "pointer", display: "flex", flexDirection: "column", gap: 3 }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ width: i === 1 ? 14 : 18, height: 2, background: T.gold, borderRadius: 2 }} />
              ))}
            </button>
          )}

          <div onClick={() => { setCurrentView("loja"); setCat("destaques"); }} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
            <svg width={mob ? 30 : 38} height={mob ? 30 : 38} viewBox="0 0 80 80" fill="none">
              <polygon points="40,4 74,22 74,58 40,76 6,58 6,22" stroke={T.gold} strokeWidth="2" fill="none" />
              <polygon points="40,12 66,27 66,53 40,68 14,53 14,27" stroke={T.gold} strokeWidth="1" fill={T.goldXlt} />
              <circle cx="40" cy="40" r="6" fill={T.gold} />
              {[0, 60, 120, 180, 240, 300].map((a, i) => {
                const r = 16, rad = (a * Math.PI) / 180;
                return <circle key={i} cx={40 + r * Math.cos(rad)} cy={40 + r * Math.sin(rad)} r="2" fill={T.gold} opacity="0.6" />;
              })}
            </svg>
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: mob ? 20 : 26, letterSpacing: 4, color: T.ink, fontWeight: 600, lineHeight: 1 }}>GALENE</div>
              {!mob && <div style={{ fontFamily: "'Lato',sans-serif", fontSize: 8.5, letterSpacing: 3, color: T.ink4, textTransform: "uppercase" }}>Moda Feminina Atacado</div>}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {!mob && (
              <button
                onClick={() => { setCurrentView("loja"); setCat("destaques"); }}
                style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Lato',sans-serif", fontSize: 11, fontWeight: 700, color: currentView === "loja" ? T.gold : T.ink3, letterSpacing: 1.5, padding: "8px 12px" }}
              >
                CATÁLOGO
              </button>
            )}
            <Link
              href="/admin"
              style={{ textDecoration: "none", background: "none", border: `1.5px solid ${T.border}`, borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontFamily: "'Lato',sans-serif", fontSize: 11, fontWeight: 700, color: T.ink3, letterSpacing: 0.5 }}
            >
              {mob ? "📊" : "Painel"}
            </Link>
            <button
              onClick={() => setCurrentView("carrinho")}
              style={{ background: currentView === "carrinho" ? T.goldXlt : "none", border: `1.5px solid ${currentView === "carrinho" ? T.gold : T.border}`, borderRadius: 10, padding: "8px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "'Lato',sans-serif", fontSize: 12, fontWeight: 700, color: currentView === "carrinho" ? T.goldDk : T.ink2, transition: "all .15s", position: "relative" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              {!mob && "Pedido"}
              {totPcs > 0 && (
                <span style={{ background: T.gold, color: "white", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, position: mob ? "absolute" : "static", top: mob ? -4 : "auto", right: mob ? -4 : "auto" }}>
                  {totPcs}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {currentView === "carrinho" ? (
        <Carrinho
          cart={cart}
          onRemove={(idx) => setCart((p) => p.filter((_, i) => i !== idx))}
          onFinish={handleFinish}
          onBack={() => setCurrentView("loja")}
          minOrder={minOrder}
        />
      ) : (
        <div style={{ display: "flex", minHeight: "calc(100vh - 112px)" }}>
          {!mob && (
            <div style={{ position: "sticky", top: 112, height: "calc(100vh - 112px)", overflowY: "auto", flexShrink: 0 }}>
              <Sidebar cat={cat} setCat={setCat} mobile={false} produtos={produtos} minOrder={minOrder} />
            </div>
          )}

          <main style={{ flex: 1, padding: mob ? "14px 12px 100px" : "28px 32px 60px", minWidth: 0 }}>
            {cat === "destaques" && (
              <div style={{ background: `linear-gradient(135deg,${T.bg2},${T.bg3})`, borderRadius: 16, padding: mob ? "24px 20px" : "28px 36px", marginBottom: 28, position: "relative", overflow: "hidden", borderTop: `3px solid ${T.gold}` }}>
                <div style={{ position: "absolute", right: mob ? 16 : 40, top: "50%", transform: "translateY(-50%)", opacity: 0.08, fontSize: mob ? 80 : 120, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, color: T.goldDk, userSelect: "none", lineHeight: 1 }}>G</div>
                <div style={{ position: "relative" }}>
                  <div style={{ fontFamily: "'Lato',sans-serif", fontSize: 9.5, letterSpacing: 4, color: T.goldDk, textTransform: "uppercase", marginBottom: 8 }}>Coleção Atual</div>
                  <h1 style={{ margin: "0 0 8px", fontFamily: "'Cormorant Garamond',serif", fontSize: mob ? 28 : 38, color: T.ink, fontWeight: 600 }}>
                    Destaques Galene
                  </h1>
                  <div style={{ fontFamily: "'Lato',sans-serif", fontSize: 11, color: T.ink3, letterSpacing: 0.5 }}>
                    Peças selecionadas · Atacado feminino
                  </div>
                </div>
              </div>
            )}

            {cat !== "destaques" && (
              <div style={{ marginBottom: 22, paddingBottom: 16, borderBottom: `1px solid ${T.border}` }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
                  <h2 style={{ margin: 0, fontFamily: "'Cormorant Garamond',serif", fontSize: mob ? 26 : 32, color: T.ink, fontWeight: 600 }}>
                    {CATS.find((c) => c.id === cat)?.label || cat}
                  </h2>
                  <span style={{ fontFamily: "'Lato',sans-serif", fontSize: 11, color: T.ink4 }}>
                    {prods.length} produtos
                  </span>
                </div>
              </div>
            )}

            {loading ? (
              <div style={{ padding: "60px 0", textAlign: "center", fontFamily: "'Lato',sans-serif", fontSize: 12, color: T.ink4 }}>
                Carregando catálogo...
              </div>
            ) : cat === "destaques" ? (
              <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(auto-fill, minmax(260px, 1fr))", gap: mob ? 16 : 24 }}>
                {prods.map((p) => (
                  <CardDest key={p.id} prod={p} onClick={() => setModal(p)} />
                ))}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(auto-fill, minmax(200px, 1fr))", gap: mob ? 12 : 16 }}>
                {prods.map((p) => (
                  <Card key={p.id} prod={p} onClick={() => setModal(p)} />
                ))}
              </div>
            )}
          </main>
        </div>
      )}

      {modal && <ModalProd prod={modal} onClose={() => setModal(null)} onAdd={addToCart} />}

      {mob && currentView !== "carrinho" && (
        <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: T.panel, borderTop: `1px solid ${T.border}`, display: "flex", padding: "8px 0 12px", zIndex: 300, boxShadow: "0 -4px 16px rgba(26,23,20,0.08)" }}>
          {[
            ["menu", "☰", "Menu", () => setDrawer(true)],
            ["loja", "◈", "Catálogo", () => { setCurrentView("loja"); setCat("destaques"); }],
            ["carrinho", "◻", "Pedido", () => setCurrentView("carrinho")],
          ].map(([v, icon, label, action]) => (
            <button key={v} onClick={action} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "4px 0", position: "relative" }}>
              <span style={{ fontSize: 20 }}>{icon}</span>
              <span style={{ fontFamily: "'Lato',sans-serif", fontSize: 9.5, fontWeight: currentView === v && v !== "menu" ? 700 : 400, color: currentView === v && v !== "menu" ? T.gold : T.ink3 }}>
                {label}
              </span>
              {v === "carrinho" && totPcs > 0 && (
                <span style={{ position: "absolute", top: 0, right: "22%", background: T.gold, color: "white", borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 900 }}>{totPcs}</span>
              )}
              {currentView === v && v !== "menu" && <div style={{ width: 16, height: 2, background: T.gold, borderRadius: 2 }} />}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
