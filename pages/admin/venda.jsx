'use client';
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import LoginPage from "../../components/admin/LoginPage";
import Sidebar from "../../components/store/Sidebar";
import { CardDest, Card } from "../../components/store/Cards";
import ModalProd from "../../components/store/ModalProd";
import Carrinho from "../../components/store/Carrinho";
import { T, CATS, sortSizes } from "../../lib/galeneTheme";
import { mapProdutos } from "../../lib/catalogo";
import { useWindowWidth } from "../../hooks/useWindowWidth";
import { supabase } from "../../lib/supabaseClient";
import { getSession } from "../../lib/adminAuth";

const TAMANHOS_VISIVEIS = new Set(["M", "G", "Unico"]);
const REDES_VAZIAS = { whatsapp: null, instagram: null, facebook: null };

export default function VendaPresencial() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [session, setSession] = useState(null);
  const w = useWindowWidth();
  const mob = w < 900;
  const [cat, setCat] = useState("destaques");
  const [modal, setModal] = useState(null);
  const [cart, setCart] = useState([]);
  const [view, setView] = useState("loja");
  const [toast, setToast] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [minOrder, setMinOrder] = useState(6);

  useEffect(() => {
    getSession().then((s) => { setSession(s); setCheckingSession(false); });
  }, []);

  const fetchProdutos = useCallback(async () => {
    if (!session) return;
    const [{ data, error }, { data: statusRows, error: statusErr }, { data: settingsRow }] = await Promise.all([
      supabase
        .from("products")
        .select(`
          id, name, category, material, price, price_original, discount_percentage, description, featured, tag, instagram_urls, is_launch,
          product_colors ( colors ( name ), photo_url ),
          stock ( color_id, size_id, colors ( name ), sizes ( name ) ),
          product_media ( type, url )
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
      media: p.product_media || [],
      desc: p.description,
      cores: [...new Set(p.product_colors.map((pc) => pc.colors.name))],
      coresFotos: Object.fromEntries(
        p.product_colors.filter((pc) => pc.photo_url).map((pc) => [pc.colors.name, pc.photo_url])
      ),
      tamanhos: sortSizes([...new Set(
        p.stock.filter((s) => s.sizes?.name && TAMANHOS_VISIVEIS.has(s.sizes.name)).map((s) => s.sizes.name)
      )]),
      product_colors: p.product_colors,
      stock: p.stock,
    }));

    const mapped = mapProdutos(baseProdutos, statusRows || [], TAMANHOS_VISIVEIS)
      .map(({ product_colors, stock, product_media, ...p }) => p)
      .filter((p) => p.cores.length && p.tamanhos.length);
    setProdutos(mapped);
    setLoading(false);
  }, [session]);

  useEffect(() => { fetchProdutos(); }, [fetchProdutos]);

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

  const handleFinish = useCallback((resultado) => {
    setCart([]);
    setView("loja");
    setCat("destaques");
    setToast(`Venda ${resultado?.order_number || ""} registrada com sucesso!`);
    setTimeout(() => setToast(null), 4000);
    fetchProdutos();
  }, [fetchProdutos]);

  async function buscarClientePorTelefone(telefone) {
    const s = await getSession();
    const res = await fetch("/api/admin/clientes/buscar", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${s?.access_token}` },
      body: JSON.stringify({ telefone }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || "Erro ao buscar cliente.");
    return data.clientes?.[0] || null;
  }

  async function confirmarVendaPresencial({ form, cart: cartFinal, metodo, clienteId, idempotencyKey }) {
    const s = await getSession();
    const res = await fetch("/api/admin/venda-presencial", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${s?.access_token}` },
      body: JSON.stringify({ form, cart: cartFinal, metodo, clienteId, idempotencyKey }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || "Erro ao registrar venda.");
    return data;
  }

  if (checkingSession) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.bg, color: T.ink4, fontFamily: "'Lato',sans-serif", fontSize: 13 }}>
        Carregando...
      </div>
    );
  }
  if (!session) {
    return <LoginPage onLogin={() => getSession().then(setSession)} />;
  }

  return (
    <div style={{ fontFamily: "'Lato',sans-serif", background: T.bg, minHeight: "100vh", color: T.ink }}>
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 18px", fontFamily: "'Lato',sans-serif", fontSize: 12, color: T.ink2, maxWidth: 320, boxShadow: "0 4px 20px rgba(26,23,20,0.15)" }}>
          {toast}
        </div>
      )}

      <header style={{ position: "sticky", top: 0, zIndex: 400, background: T.panel, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Link href="/admin" style={{ textDecoration: "none", fontFamily: "'Lato',sans-serif", fontSize: 11, fontWeight: 700, color: T.ink3, border: `1.5px solid ${T.border}`, borderRadius: 8, padding: "6px 12px" }}>
            ← Painel
          </Link>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, color: T.ink, fontWeight: 600 }}>Venda Presencial</div>
        </div>
        <button
          onClick={() => setView(view === "carrinho" ? "loja" : "carrinho")}
          style={{ background: view === "carrinho" ? T.goldXlt : "none", border: `1.5px solid ${view === "carrinho" ? T.gold : T.border}`, borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontFamily: "'Lato',sans-serif", fontSize: 12, fontWeight: 700, color: view === "carrinho" ? T.goldDk : T.ink2 }}
        >
          Carrinho {totPcs > 0 ? `(${totPcs})` : ""}
        </button>
      </header>

      {view === "carrinho" ? (
        <Carrinho
          cart={cart}
          onRemove={(idx) => setCart((p) => p.filter((_, i) => i !== idx))}
          onFinish={handleFinish}
          onBack={() => setView("loja")}
          minOrder={minOrder}
          presencial
          onBuscarCliente={buscarClientePorTelefone}
          onConfirmarPresencial={confirmarVendaPresencial}
        />
      ) : (
        <div style={{ display: "flex", minHeight: "calc(100vh - 65px)" }}>
          {!mob && (
            <div style={{ position: "sticky", top: 65, height: "calc(100vh - 65px)", overflowY: "auto", flexShrink: 0 }}>
              <Sidebar cat={cat} setCat={setCat} mobile={false} produtos={produtos} redes={REDES_VAZIAS} />
            </div>
          )}
          {mob && (
            <div style={{ padding: "12px 14px 0", width: "100%" }}>
              <select
                value={cat}
                onChange={(e) => setCat(e.target.value)}
                style={{ width: "100%", background: T.panel, border: `1.5px solid ${T.border}`, borderRadius: 8, padding: "11px 14px", fontFamily: "'Lato',sans-serif", fontSize: 13, color: T.ink, boxSizing: "border-box" }}
              >
                {CATS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
          )}
          <main style={{ flex: 1, padding: mob ? "14px 12px 60px" : "28px 32px 60px", minWidth: 0 }}>
            {loading ? (
              <div style={{ padding: "60px 0", textAlign: "center", fontFamily: "'Lato',sans-serif", fontSize: 12, color: T.ink4 }}>
                Carregando catálogo...
              </div>
            ) : cat === "destaques" ? (
              <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(auto-fill, minmax(260px, 1fr))", gap: mob ? 16 : 24 }}>
                {prods.map((p) => <CardDest key={p.id} prod={p} onClick={() => setModal(p)} />)}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(auto-fill, minmax(200px, 1fr))", gap: mob ? 12 : 16 }}>
                {prods.map((p) => <Card key={p.id} prod={p} onClick={() => setModal(p)} />)}
              </div>
            )}
          </main>
        </div>
      )}

      {modal && <ModalProd prod={modal} onClose={() => setModal(null)} onAdd={addToCart} />}
    </div>
  );
}
