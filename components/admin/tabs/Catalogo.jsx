import React, { useEffect, useMemo, useState } from "react";
import { SectionTitle, Card } from "../shared";
import { supabase } from "../../../lib/supabaseClient";
import { getSession } from "../../../lib/adminAuth";

const inputStyle = {
  padding: "6px 10px", borderRadius: 8, border: "1px solid var(--surface-7)",
  background: "var(--surface-3)", color: "var(--text-2)", fontSize: 12,
};

function formatBRL(v) {
  return `R$${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

function Toggle({ checked, onChange, disabled, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--text-4)" }}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        style={{
          position: "relative", width: 34, height: 20, borderRadius: 20, border: "none", padding: 0,
          background: checked ? "linear-gradient(135deg,#c084fc,#818cf8)" : "var(--surface-5)",
          cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1,
          transition: "background 0.2s ease", flexShrink: 0,
        }}
      >
        <span style={{
          position: "absolute", top: 2, left: checked ? 16 : 2,
          width: 16, height: 16, borderRadius: "50%", background: "white",
          transition: "left 0.2s ease", boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        }} />
      </button>
      <span>{label}</span>
    </div>
  );
}

async function callApi(path, body) {
  const session = await getSession();
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message || "Falha na requisição.");
  return json;
}

export default function Catalogo() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [openCat, setOpenCat] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [formOpenIds, setFormOpenIds] = useState(new Set());
  const [precoInputs, setPrecoInputs] = useState({});

  async function loadProdutos() {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("id, name, category, price, price_original, discount_percentage, featured")
      .eq("is_active", true)
      .order("category")
      .order("name");
    if (error) { console.error("Erro ao buscar produtos:", error); setLoading(false); return; }
    setProdutos(data || []);
    setLoading(false);
  }

  useEffect(() => { loadProdutos(); }, []);

  const categorias = useMemo(() => {
    const map = new Map();
    produtos.forEach((p) => {
      const cat = p.category || "Outros";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat).push(p);
    });
    return [...map.entries()];
  }, [produtos]);

  const filtrados = useMemo(() => {
    if (!busca.trim()) return null;
    const termo = busca.trim().toLowerCase();
    return produtos.filter((p) => p.name.toLowerCase().includes(termo));
  }, [produtos, busca]);

  async function handleRemoverPromocao(productId) {
    setSavingId(productId);
    setErrorMsg("");
    try {
      await callApi("/api/admin/produtos/promocao", { productId, action: "remover" });
      await loadProdutos();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSavingId(null);
    }
  }

  async function handleSalvarPromocao(productId) {
    const novoPreco = Number(precoInputs[productId]);
    setSavingId(productId);
    setErrorMsg("");
    try {
      await callApi("/api/admin/produtos/promocao", { productId, action: "aplicar", novoPreco });
      setFormOpenIds((prev) => { const next = new Set(prev); next.delete(productId); return next; });
      await loadProdutos();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSavingId(null);
    }
  }

  async function handleToggleDestaque(productId, featured) {
    setSavingId(productId);
    setErrorMsg("");
    try {
      await callApi("/api/admin/produtos/destaque", { productId, featured });
      await loadProdutos();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSavingId(null);
    }
  }

  function togglePromocaoCheckbox(p, checked) {
    if (checked) {
      setFormOpenIds((prev) => new Set(prev).add(p.id));
      setPrecoInputs((prev) => ({ ...prev, [p.id]: "" }));
    } else if (p.price_original != null) {
      handleRemoverPromocao(p.id);
    } else {
      setFormOpenIds((prev) => { const next = new Set(prev); next.delete(p.id); return next; });
    }
  }

  function renderProduto(p) {
    const emPromocao = p.price_original != null;
    const formAberto = emPromocao || formOpenIds.has(p.id);
    return (
      <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 14px", borderBottom: "1px solid var(--surface-4)", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 160, fontSize: 13, color: "var(--text-2)", fontWeight: 600 }}>{p.name}</div>

        <div style={{ minWidth: 110, fontSize: 12, color: "var(--text-3)" }}>
          {emPromocao && (
            <span style={{ textDecoration: "line-through", color: "var(--text-5)", marginRight: 6 }}>
              {formatBRL(p.price_original)}
            </span>
          )}
          {formatBRL(p.price)}
        </div>

        <Toggle checked={formAberto} disabled={savingId === p.id} onChange={(checked) => togglePromocaoCheckbox(p, checked)} label="Promoção" />

        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          maxWidth: formAberto ? 260 : 0,
          opacity: formAberto ? 1 : 0,
          pointerEvents: formAberto ? "auto" : "none",
          overflow: "hidden",
          transition: "max-width 0.25s ease, opacity 0.2s ease",
        }}>
          <input
            type="number" step="0.01" placeholder="Preço promocional"
            value={precoInputs[p.id] ?? ""}
            onChange={(e) => setPrecoInputs((prev) => ({ ...prev, [p.id]: e.target.value }))}
            style={{ ...inputStyle, width: 130, flexShrink: 0 }}
          />
          <button
            onClick={() => handleSalvarPromocao(p.id)}
            disabled={savingId === p.id || !precoInputs[p.id]}
            style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#c084fc,#818cf8)", color: "white", fontSize: 11, fontWeight: 700, cursor: savingId === p.id ? "wait" : "pointer", flexShrink: 0 }}>
            {savingId === p.id ? "Salvando..." : "Salvar"}
          </button>
        </div>

        <Toggle checked={!!p.featured} disabled={savingId === p.id} onChange={(checked) => handleToggleDestaque(p.id, checked)} label="Destaque" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 980, margin: "0 auto" }}>
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle>Catálogo</SectionTitle>
        <input
          type="text"
          placeholder="Buscar produto por nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{ ...inputStyle, width: "100%", maxWidth: 320 }}
        />
      </Card>

      {errorMsg && (
        <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5", fontSize: 12 }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-4)", fontSize: 13 }}>Carregando catálogo...</div>
      ) : filtrados ? (
        <Card>
          {filtrados.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--text-4)", padding: "12px 0" }}>Nenhum produto encontrado.</div>
          ) : (
            filtrados.map(renderProduto)
          )}
        </Card>
      ) : (
        categorias.map(([cat, prods]) => (
          <Card key={cat} style={{ marginBottom: 12, padding: 0 }}>
            <div
              onClick={() => setOpenCat((prev) => ({ ...prev, [cat]: !prev[cat] }))}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", cursor: "pointer" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)" }}>{cat}</span>
              <span style={{ fontSize: 11, color: "var(--text-4)" }}>{prods.length} produtos {openCat[cat] ? "▲" : "▼"}</span>
            </div>
            {openCat[cat] && prods.map(renderProduto)}
          </Card>
        ))
      )}
    </div>
  );
}
