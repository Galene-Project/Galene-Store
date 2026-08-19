import React, { useEffect, useMemo, useState } from "react";
import JsBarcode from "jsbarcode";
import { SectionTitle, Card } from "../shared";
import { supabase } from "../../../lib/supabaseClient";
import { getSession } from "../../../lib/adminAuth";

// Etiqueta genérica 60x40mm — ajustar quando a impressora/rolo real for confirmado.
function svgStringFor(code) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  JsBarcode(svg, code, { format: "CODE128", displayValue: true, fontSize: 12, height: 36, margin: 4 });
  return svg.outerHTML;
}

function imprimirEtiquetas(etiquetas) {
  const win = window.open("", "_blank", "width=420,height=600");
  if (!win) return;
  const corpo = etiquetas.map((e) => `
    <div class="etiqueta">
      <div class="nome">${e.produto}</div>
      <div class="variante">${e.corNome} / ${e.tamanhoNome}</div>
      ${svgStringFor(e.code)}
    </div>
  `).join("");
  win.document.write(`
    <html>
      <head>
        <title>Etiquetas</title>
        <style>
          @page { size: 60mm 40mm; margin: 0; }
          body { margin: 0; font-family: sans-serif; }
          .etiqueta { width: 60mm; height: 40mm; box-sizing: border-box; padding: 3mm; text-align: center; page-break-after: always; }
          .nome { font-size: 10px; font-weight: 700; }
          .variante { font-size: 9px; color: #444; margin-bottom: 2px; }
          svg { max-width: 100%; }
        </style>
      </head>
      <body>${corpo}</body>
    </html>
  `);
  win.document.close();
  win.focus();
  win.print();
}

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

const emptyNovoProduto = { name: "", category: "", material: "", sku: "", price: "", description: "", photo_url: "" };

function NovoProdutoForm({ cores, tamanhos, onCancel, onCreated }) {
  const [form, setForm] = useState(emptyNovoProduto);
  const [variantes, setVariantes] = useState([{ color_id: "", size_id: "", quantity: "" }]);
  const [instagramLinks, setInstagramLinks] = useState([""]);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");
  const [etiquetas, setEtiquetas] = useState(null);

  function setVariante(i, campo, valor) {
    setVariantes((prev) => prev.map((v, idx) => (idx === i ? { ...v, [campo]: valor } : v)));
  }

  async function handleCriar() {
    setSaving(true);
    setErro("");
    try {
      const validas = variantes.filter((v) => v.color_id && v.size_id);
      const fotoPorCor = {};
      validas.forEach((v) => {
        if (v.photo_url && !fotoPorCor[v.color_id]) fotoPorCor[v.color_id] = v.photo_url;
      });
      const resp = await callApi("/api/admin/produtos/criar", {
        ...form,
        variants: validas.map((v) => ({ color_id: v.color_id, size_id: v.size_id, quantity: v.quantity === "" ? 0 : Number(v.quantity) })),
        colorPhotos: fotoPorCor,
        instagramUrls: instagramLinks.filter((l) => l.trim()),
      });
      setEtiquetas(resp.variants.map((v) => ({
        code: v.code,
        produto: `${form.name} (${resp.sku})`,
        corNome: cores.find((c) => c.id === v.color_id)?.name || "-",
        tamanhoNome: tamanhos.find((s) => s.id === v.size_id)?.name || "-",
      })));
    } catch (err) {
      setErro(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (etiquetas) {
    return (
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle accent="#34d399">Produto criado — códigos de barras gerados</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
          {etiquetas.map((e) => (
            <div key={e.code} style={{ fontSize: 12, color: "var(--text-2)" }}>
              <strong>{e.code}</strong> — {e.corNome} / {e.tamanhoNome}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => imprimirEtiquetas(etiquetas)}
            style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#c084fc,#818cf8)", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            🖨️ Imprimir etiquetas
          </button>
          <button onClick={onCreated}
            style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--surface-7)", background: "transparent", color: "var(--text-3)", fontSize: 12, cursor: "pointer" }}>
            Fechar
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card style={{ marginBottom: 16 }}>
      <SectionTitle accent="#818cf8">Novo produto</SectionTitle>
      {erro && (
        <div style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5", fontSize: 12 }}>
          ⚠️ {erro}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <input placeholder="Nome" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} style={inputStyle} />
        <input placeholder="Categoria" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} style={inputStyle} />
        <input placeholder="Material" value={form.material} onChange={(e) => setForm((f) => ({ ...f, material: e.target.value }))} style={inputStyle} />
        <input placeholder="SKU (opcional)" value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} style={inputStyle} />
        <input type="number" step="0.01" placeholder="Preço" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} style={inputStyle} />
        <input placeholder="URL da foto (opcional)" value={form.photo_url} onChange={(e) => setForm((f) => ({ ...f, photo_url: e.target.value }))} style={inputStyle} />
      </div>
      <textarea placeholder="Descrição (opcional)" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, width: "100%", minHeight: 60, marginBottom: 12 }} />

      <div style={{ fontSize: 11, color: "var(--text-4)", marginBottom: 8 }}>Variantes (cor / tamanho / quantidade em estoque)</div>
      {variantes.map((v, i) => (
        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
          <select value={v.color_id} onChange={(e) => setVariante(i, "color_id", e.target.value)} style={inputStyle}>
            <option value="">Cor</option>
            {cores.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={v.size_id} onChange={(e) => setVariante(i, "size_id", e.target.value)} style={inputStyle}>
            <option value="">Tamanho</option>
            {tamanhos.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input type="number" placeholder="Qtd" value={v.quantity} onChange={(e) => setVariante(i, "quantity", e.target.value)} style={{ ...inputStyle, width: 80 }} />
          <input placeholder="URL da foto dessa cor (opcional)" value={v.photo_url || ""} onChange={(e) => setVariante(i, "photo_url", e.target.value)} style={{ ...inputStyle, width: 220 }} />
          {variantes.length > 1 && (
            <button type="button" onClick={() => setVariantes((prev) => prev.filter((_, idx) => idx !== i))} style={{ padding: "6px 10px", borderRadius: 8, border: "none", background: "var(--surface-5)", color: "var(--text-3)", fontSize: 11, cursor: "pointer" }}>Remover</button>
          )}
        </div>
      ))}
      <button type="button" onClick={() => setVariantes((prev) => [...prev, { color_id: "", size_id: "", quantity: "" }])}
        style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--surface-7)", background: "transparent", color: "var(--text-3)", fontSize: 11, cursor: "pointer", marginBottom: 14 }}>
        + Variante
      </button>

      <div style={{ fontSize: 11, color: "var(--text-4)", marginBottom: 8 }}>Fotos/vídeos (links de post ou reel do Instagram, opcional)</div>
      {instagramLinks.map((link, i) => (
        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
          <input placeholder="https://www.instagram.com/p/... ou /reel/..." value={link}
            onChange={(e) => setInstagramLinks((prev) => prev.map((l, idx) => (idx === i ? e.target.value : l)))}
            style={{ ...inputStyle, flex: 1 }} />
          {instagramLinks.length > 1 && (
            <button type="button" onClick={() => setInstagramLinks((prev) => prev.filter((_, idx) => idx !== i))} style={{ padding: "6px 10px", borderRadius: 8, border: "none", background: "var(--surface-5)", color: "var(--text-3)", fontSize: 11, cursor: "pointer" }}>Remover</button>
          )}
        </div>
      ))}
      <button type="button" onClick={() => setInstagramLinks((prev) => [...prev, ""])}
        style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--surface-7)", background: "transparent", color: "var(--text-3)", fontSize: 11, cursor: "pointer", marginBottom: 14 }}>
        + Link
      </button>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={handleCriar} disabled={saving}
          style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#c084fc,#818cf8)", color: "white", fontSize: 12, fontWeight: 700, cursor: saving ? "wait" : "pointer" }}>
          {saving ? "Criando..." : "Criar produto"}
        </button>
        <button onClick={onCancel} disabled={saving}
          style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--surface-7)", background: "transparent", color: "var(--text-3)", fontSize: 12, cursor: "pointer" }}>
          Cancelar
        </button>
      </div>
    </Card>
  );
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
  const [novoAberto, setNovoAberto] = useState(false);
  const [cores, setCores] = useState([]);
  const [tamanhos, setTamanhos] = useState([]);
  const [videoFormOpenIds, setVideoFormOpenIds] = useState(new Set());
  const [videoInputs, setVideoInputs] = useState({});

  useEffect(() => {
    supabase.from("colors").select("id, name").order("name").then(({ data }) => setCores(data || []));
    supabase.from("sizes").select("id, name").order("name").then(({ data }) => setTamanhos(data || []));
  }, []);

  async function loadProdutos() {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("id, name, category, price, price_original, discount_percentage, featured, instagram_urls, is_launch")
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
    const entries = [...map.entries()];
    const promoProdutos = produtos.filter((p) => p.price_original != null);
    const videoProdutos = produtos.filter((p) => p.is_launch);
    const extras = [];
    if (videoProdutos.length > 0) extras.push(["▶️ Lançamentos", videoProdutos]);
    if (promoProdutos.length > 0) extras.push(["🏷️ Promoções", promoProdutos]);
    return [...extras, ...entries];
  }, [produtos]);

  const filtrados = useMemo(() => {
    if (!busca.trim()) return null;
    const termo = busca.trim().toLowerCase();
    return produtos.filter((p) => p.name.toLowerCase().includes(termo));
  }, [produtos, busca]);

  function aplicarUpdateLocal(productId, campos) {
    setProdutos((prev) => prev.map((pr) => (pr.id === productId ? { ...pr, ...campos } : pr)));
  }

  function limparFormPromocao(productId) {
    setFormOpenIds((prev) => { const next = new Set(prev); next.delete(productId); return next; });
    setPrecoInputs((prev) => { const next = { ...prev }; delete next[productId]; return next; });
  }

  async function handleRemoverPromocao(productId) {
    setSavingId(productId);
    setErrorMsg("");
    try {
      const resp = await callApi("/api/admin/produtos/promocao", { productId, action: "remover" });
      if (resp.product) aplicarUpdateLocal(productId, resp.product);
      limparFormPromocao(productId);
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
      const resp = await callApi("/api/admin/produtos/promocao", { productId, action: "aplicar", novoPreco });
      if (resp.product) aplicarUpdateLocal(productId, resp.product);
      limparFormPromocao(productId);
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
      aplicarUpdateLocal(productId, { featured });
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSavingId(null);
    }
  }

  async function handleToggleLancamento(productId, isLaunch) {
    setSavingId(productId);
    setErrorMsg("");
    try {
      await callApi("/api/admin/produtos/lancamento", { productId, isLaunch });
      aplicarUpdateLocal(productId, { is_launch: isLaunch });
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
      limparFormPromocao(p.id);
    }
  }

  function limparFormVideo(productId) {
    setVideoFormOpenIds((prev) => { const next = new Set(prev); next.delete(productId); return next; });
    setVideoInputs((prev) => { const next = { ...prev }; delete next[productId]; return next; });
  }

  async function handleRemoverVideo(productId) {
    setSavingId(productId);
    setErrorMsg("");
    try {
      await callApi("/api/admin/produtos/video", { productId, instagramUrls: [] });
      aplicarUpdateLocal(productId, { instagram_urls: [] });
      limparFormVideo(productId);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSavingId(null);
    }
  }

  async function handleSalvarVideo(productId) {
    setSavingId(productId);
    setErrorMsg("");
    try {
      const links = (videoInputs[productId] || "").split("\n").map((l) => l.trim()).filter(Boolean);
      const resp = await callApi("/api/admin/produtos/video", { productId, instagramUrls: links });
      aplicarUpdateLocal(productId, { instagram_urls: resp.instagram_urls });
      limparFormVideo(productId);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSavingId(null);
    }
  }

  function toggleVideoCheckbox(p, checked) {
    if (checked) {
      setVideoFormOpenIds((prev) => new Set(prev).add(p.id));
      setVideoInputs((prev) => ({ ...prev, [p.id]: (p.instagram_urls || []).join("\n") }));
    } else if (p.instagram_urls?.length > 0) {
      handleRemoverVideo(p.id);
    } else {
      limparFormVideo(p.id);
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
          display: "grid",
          gridTemplateColumns: formAberto ? "1fr" : "0fr",
          transition: "grid-template-columns 0.25s ease",
          overflow: "hidden",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6, minWidth: 0,
            opacity: formAberto ? 1 : 0,
            pointerEvents: formAberto ? "auto" : "none",
            transition: "opacity 0.2s ease",
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
        </div>

        <Toggle checked={!!p.featured} disabled={savingId === p.id} onChange={(checked) => handleToggleDestaque(p.id, checked)} label="Destaque" />

        <Toggle checked={!!p.is_launch} disabled={savingId === p.id} onChange={(checked) => handleToggleLancamento(p.id, checked)} label="Lançamento" />

        <Toggle
          checked={p.instagram_urls?.length > 0 || videoFormOpenIds.has(p.id)}
          disabled={savingId === p.id}
          onChange={(checked) => toggleVideoCheckbox(p, checked)}
          label="Fotos/vídeos"
        />

        <div style={{
          display: "grid",
          gridTemplateColumns: (p.instagram_urls?.length > 0 || videoFormOpenIds.has(p.id)) ? "1fr" : "0fr",
          transition: "grid-template-columns 0.25s ease",
          overflow: "hidden",
        }}>
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 6, minWidth: 0,
            opacity: (p.instagram_urls?.length > 0 || videoFormOpenIds.has(p.id)) ? 1 : 0,
            pointerEvents: (p.instagram_urls?.length > 0 || videoFormOpenIds.has(p.id)) ? "auto" : "none",
            transition: "opacity 0.2s ease",
          }}>
            <textarea
              placeholder={"1 link por linha\nhttps://www.instagram.com/p/... ou /reel/..."}
              value={videoInputs[p.id] ?? (p.instagram_urls || []).join("\n")}
              onChange={(e) => setVideoInputs((prev) => ({ ...prev, [p.id]: e.target.value }))}
              style={{ ...inputStyle, width: 260, minHeight: 50, flexShrink: 0, resize: "vertical" }}
            />
            <button
              onClick={() => handleSalvarVideo(p.id)}
              disabled={savingId === p.id}
              style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#c084fc,#818cf8)", color: "white", fontSize: 11, fontWeight: 700, cursor: savingId === p.id ? "wait" : "pointer", flexShrink: 0 }}>
              {savingId === p.id ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 980, margin: "0 auto" }}>
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle>Catálogo</SectionTitle>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Buscar produto por nome..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={{ ...inputStyle, flex: 1, minWidth: 200, maxWidth: 320 }}
          />
          <button onClick={() => setNovoAberto((v) => !v)}
            style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#c084fc,#818cf8)", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            {novoAberto ? "Fechar" : "+ Novo produto"}
          </button>
        </div>
      </Card>

      {novoAberto && (
        <NovoProdutoForm
          cores={cores}
          tamanhos={tamanhos}
          onCancel={() => setNovoAberto(false)}
          onCreated={() => { setNovoAberto(false); loadProdutos(); }}
        />
      )}

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
