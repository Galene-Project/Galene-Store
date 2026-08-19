import React, { useEffect, useMemo, useState } from "react";
import { productReport } from "../../../lib/reportMetrics";
import { SectionTitle, Card } from "../shared";
import { supabase } from "../../../lib/supabaseClient";
import { getSession } from "../../../lib/adminAuth";

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

const selectStyle = {
  padding: "8px 12px", borderRadius: 8, border: "1px solid var(--surface-7)",
  background: "var(--surface-3)", color: "var(--text-2)", fontSize: 12,
};

// Agrupa linhas cor×tamanho por cor (bloco visual) — dentro de cada
// cor, mantém a ordenação que já veio (mais vendido/maior estoque
// primeiro), só reordena pra cores ficarem contíguas.
function agruparPorCor(rows, corDaLinha) {
  const porCor = new Map();
  rows.forEach((row) => {
    const cor = corDaLinha(row);
    if (!porCor.has(cor)) porCor.set(cor, []);
    porCor.get(cor).push(row);
  });
  const linhas = [];
  let stripe = 0;
  for (const grupo of porCor.values()) {
    grupo.forEach((row) => linhas.push({ row, stripe }));
    stripe++;
  }
  return linhas;
}

export default function Relatorios({ data }) {
  const { items = [], orders = [] } = data || {};
  const [produtos, setProdutos] = useState([]);
  const [categoria, setCategoria] = useState("");
  const [produtoId, setProdutoId] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [tipo, setTipo] = useState("vendas");
  const [estoqueRows, setEstoqueRows] = useState([]);
  const [estoqueCarregando, setEstoqueCarregando] = useState(false);
  const [defeitoRows, setDefeitoRows] = useState([]);
  const [moverAbertoId, setMoverAbertoId] = useState(null);
  const [moverForm, setMoverForm] = useState({ quantity: "", defectPrice: "", reason: "" });
  const [defeitoSaving, setDefeitoSaving] = useState(false);
  const [defeitoErro, setDefeitoErro] = useState("");

  function carregarEstoque() {
    if (tipo !== "estoque" || !produtoId) { setEstoqueRows([]); return () => {}; }
    let cancelled = false;
    setEstoqueCarregando(true);
    supabase
      .from("stock")
      .select("id, quantity, color_id, size_id, colors(name), sizes(name)")
      .eq("product_id", produtoId)
      .then(({ data: rows }) => {
        if (cancelled) return;
        setEstoqueRows([...(rows || [])].sort((a, b) => b.quantity - a.quantity));
        setEstoqueCarregando(false);
      });
    return () => { cancelled = true; };
  }

  function carregarDefeito() {
    if (tipo !== "estoque" || !produtoId) { setDefeitoRows([]); return; }
    callApi("/api/admin/estoque/defeito", { action: "listar", productId: produtoId })
      .then((json) => setDefeitoRows(json.rows || []))
      .catch(() => setDefeitoRows([]));
  }

  useEffect(() => {
    const cleanup = carregarEstoque();
    carregarDefeito();
    return cleanup;
  }, [tipo, produtoId]);

  async function handleMover(row) {
    setDefeitoSaving(true);
    setDefeitoErro("");
    try {
      await callApi("/api/admin/estoque/defeito", {
        action: "mover",
        productId: produtoId,
        colorId: row.color_id,
        sizeId: row.size_id,
        quantity: moverForm.quantity,
        defectPrice: moverForm.defectPrice,
        reason: moverForm.reason,
      });
      setMoverAbertoId(null);
      setMoverForm({ quantity: "", defectPrice: "", reason: "" });
      carregarEstoque();
      carregarDefeito();
    } catch (err) {
      setDefeitoErro(err.message);
    } finally {
      setDefeitoSaving(false);
    }
  }

  async function handleBaixar(defectRow) {
    setDefeitoSaving(true);
    setDefeitoErro("");
    try {
      await callApi("/api/admin/estoque/defeito", {
        action: "baixar",
        productId: produtoId,
        defectStockId: defectRow.id,
        quantity: defectRow.quantity,
      });
      carregarDefeito();
    } catch (err) {
      setDefeitoErro(err.message);
    } finally {
      setDefeitoSaving(false);
    }
  }

  useEffect(() => {
    supabase
      .from("products")
      .select("id, name, category, sku, material, price")
      .eq("is_active", true)
      .order("category")
      .order("name")
      .then(({ data: rows }) => setProdutos(rows || []));
  }, []);

  const categorias = useMemo(() => {
    const set = new Set(produtos.map((p) => p.category).filter(Boolean));
    return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [produtos]);

  const produtosFiltrados = useMemo(() => {
    return categoria ? produtos.filter((p) => p.category === categoria) : produtos;
  }, [produtos, categoria]);

  const produtoSelecionado = useMemo(
    () => produtos.find((p) => p.id === produtoId) || null,
    [produtos, produtoId]
  );

  const report = useMemo(
    () => productReport(items, orders, { productId: produtoId, startDate: dataInicio || null, endDate: dataFim || null }),
    [items, orders, produtoId, dataInicio, dataFim]
  );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle>Relatório por Produto</SectionTitle>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={selectStyle}>
            <option value="vendas">Vendas</option>
            <option value="estoque">Estoque</option>
          </select>

          <select value={categoria} onChange={(e) => { setCategoria(e.target.value); setProdutoId(""); }} style={selectStyle}>
            <option value="">Produto: todos</option>
            {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <select value={produtoId} onChange={(e) => setProdutoId(e.target.value)} style={{ ...selectStyle, minWidth: 220 }}>
            <option value="">Tipo de produto</option>
            {produtosFiltrados.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {tipo === "vendas" && (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} style={selectStyle} />
            <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} style={selectStyle} />
          </div>
        )}
      </Card>

      {!produtoId && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-4)", fontSize: 12 }}>
          Selecione um produto pra ver o relatório.
        </div>
      )}

      {produtoId && produtoSelecionado && (
        <>
          <Card style={{ marginBottom: 16 }}>
            <SectionTitle accent="#818cf8">Dados do produto</SectionTitle>
            <div className="admin-chart-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, fontSize: 12 }}>
              <div><span style={{ color: "var(--text-4)" }}>SKU: </span><span style={{ color: "var(--text-2)" }}>{produtoSelecionado.sku || "—"}</span></div>
              <div><span style={{ color: "var(--text-4)" }}>Material: </span><span style={{ color: "var(--text-2)" }}>{produtoSelecionado.material || "—"}</span></div>
              <div><span style={{ color: "var(--text-4)" }}>Preço atual: </span><span style={{ color: "var(--text-2)" }}>R${Number(produtoSelecionado.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
            </div>
          </Card>

          {tipo === "vendas" && (
            <>
              <div className="admin-chart-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <Card>
                  <div style={{ fontSize: 11, color: "var(--text-4)", marginBottom: 6 }}>Peças vendidas</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text-1)" }}>{report.totalPecas}</div>
                </Card>
                <Card>
                  <div style={{ fontSize: 11, color: "var(--text-4)", marginBottom: 6 }}>Receita</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text-1)" }}>
                    R${report.totalReceita.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                </Card>
              </div>

              <Card>
                <SectionTitle accent="#38bdf8">Detalhamento por cor/tamanho</SectionTitle>
                {report.breakdown.length === 0 ? (
                  <div style={{ fontSize: 12, color: "var(--text-4)", padding: "12px 0" }}>
                    Nenhuma venda desse produto no período selecionado.
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr style={{ textAlign: "left", color: "var(--text-4)" }}>
                          <th style={{ padding: "8px 10px" }}>Cor</th>
                          <th style={{ padding: "8px 10px" }}>Tamanho</th>
                          <th style={{ padding: "8px 10px" }}>Peças</th>
                          <th style={{ padding: "8px 10px" }}>Receita</th>
                        </tr>
                      </thead>
                      <tbody>
                        {agruparPorCor(report.breakdown, (row) => row.cor).map(({ row, stripe }, i) => (
                          <tr key={i} style={{ borderTop: "1px solid var(--surface-5)", background: stripe % 2 === 1 ? "var(--surface-2)" : "transparent" }}>
                            <td style={{ padding: "8px 10px", color: "var(--text-2)" }}>{row.cor}</td>
                            <td style={{ padding: "8px 10px", color: "var(--text-2)" }}>{row.tamanho}</td>
                            <td style={{ padding: "8px 10px", color: "var(--text-2)" }}>{row.pecas}</td>
                            <td style={{ padding: "8px 10px", color: "var(--text-2)" }}>
                              R${row.receita.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </>
          )}

          {tipo === "estoque" && (
            <>
              <Card style={{ marginBottom: 16 }}>
                <SectionTitle accent="#34d399">Estoque atual por cor/tamanho</SectionTitle>
                {defeitoErro && (
                  <div style={{ marginBottom: 10, padding: "8px 12px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5", fontSize: 12 }}>
                    ⚠️ {defeitoErro}
                  </div>
                )}
                {estoqueCarregando ? (
                  <div style={{ fontSize: 12, color: "var(--text-4)", padding: "12px 0" }}>Carregando...</div>
                ) : estoqueRows.length === 0 ? (
                  <div style={{ fontSize: 12, color: "var(--text-4)", padding: "12px 0" }}>
                    Nenhuma linha de estoque cadastrada pra esse produto.
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr style={{ textAlign: "left", color: "var(--text-4)" }}>
                          <th style={{ padding: "8px 10px" }}>Cor</th>
                          <th style={{ padding: "8px 10px" }}>Tamanho</th>
                          <th style={{ padding: "8px 10px" }}>Quantidade</th>
                          <th style={{ padding: "8px 10px" }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {agruparPorCor(estoqueRows, (row) => row.colors?.name || "-").map(({ row, stripe }, i) => (
                          <React.Fragment key={i}>
                            <tr style={{ borderTop: "1px solid var(--surface-5)", background: stripe % 2 === 1 ? "var(--surface-2)" : "transparent" }}>
                              <td style={{ padding: "8px 10px", color: "var(--text-2)" }}>{row.colors?.name || "-"}</td>
                              <td style={{ padding: "8px 10px", color: "var(--text-2)" }}>{row.sizes?.name || "-"}</td>
                              <td style={{ padding: "8px 10px", color: "var(--text-2)" }}>{row.quantity}</td>
                              <td style={{ padding: "8px 10px" }}>
                                <button
                                  onClick={() => { setMoverAbertoId(moverAbertoId === row.id ? null : row.id); setDefeitoErro(""); }}
                                  disabled={row.quantity === 0}
                                  style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid var(--surface-7)", background: "transparent", color: "var(--text-3)", fontSize: 11, cursor: row.quantity === 0 ? "default" : "pointer", opacity: row.quantity === 0 ? 0.4 : 1 }}>
                                  Mover p/ defeito
                                </button>
                              </td>
                            </tr>
                            {moverAbertoId === row.id && (
                              <tr style={{ background: "var(--surface-2)" }}>
                                <td colSpan={4} style={{ padding: "10px" }}>
                                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                                    <input type="number" placeholder={`Qtd (máx ${row.quantity})`} value={moverForm.quantity}
                                      onChange={(e) => setMoverForm((f) => ({ ...f, quantity: e.target.value }))}
                                      style={{ ...selectStyle, width: 130 }} />
                                    <input type="number" step="0.01" placeholder="Preço defeito" value={moverForm.defectPrice}
                                      onChange={(e) => setMoverForm((f) => ({ ...f, defectPrice: e.target.value }))}
                                      style={{ ...selectStyle, width: 130 }} />
                                    <input placeholder="Motivo (opcional)" value={moverForm.reason}
                                      onChange={(e) => setMoverForm((f) => ({ ...f, reason: e.target.value }))}
                                      style={{ ...selectStyle, flex: 1, minWidth: 140 }} />
                                    <button onClick={() => handleMover(row)} disabled={defeitoSaving}
                                      style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#c084fc,#818cf8)", color: "white", fontSize: 11, fontWeight: 700, cursor: defeitoSaving ? "wait" : "pointer" }}>
                                      {defeitoSaving ? "Movendo..." : "Confirmar"}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              <Card>
                <SectionTitle accent="#fb923c">Peças com defeito (venda separada)</SectionTitle>
                {defeitoRows.length === 0 ? (
                  <div style={{ fontSize: 12, color: "var(--text-4)", padding: "12px 0" }}>
                    Nenhuma peça com defeito registrada pra esse produto.
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr style={{ textAlign: "left", color: "var(--text-4)" }}>
                          <th style={{ padding: "8px 10px" }}>Cor</th>
                          <th style={{ padding: "8px 10px" }}>Tamanho</th>
                          <th style={{ padding: "8px 10px" }}>Quantidade</th>
                          <th style={{ padding: "8px 10px" }}>Preço</th>
                          <th style={{ padding: "8px 10px" }}>Motivo</th>
                          <th style={{ padding: "8px 10px" }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {defeitoRows.map((row) => (
                          <tr key={row.id} style={{ borderTop: "1px solid var(--surface-5)" }}>
                            <td style={{ padding: "8px 10px", color: "var(--text-2)" }}>{row.colors?.name || "-"}</td>
                            <td style={{ padding: "8px 10px", color: "var(--text-2)" }}>{row.sizes?.name || "-"}</td>
                            <td style={{ padding: "8px 10px", color: "var(--text-2)" }}>{row.quantity}</td>
                            <td style={{ padding: "8px 10px", color: "var(--text-2)" }}>
                              R${Number(row.defect_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: "8px 10px", color: "var(--text-4)" }}>{row.reason || "-"}</td>
                            <td style={{ padding: "8px 10px" }}>
                              <button onClick={() => handleBaixar(row)} disabled={defeitoSaving}
                                style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid var(--surface-7)", background: "transparent", color: "var(--text-3)", fontSize: 11, cursor: defeitoSaving ? "wait" : "pointer" }}>
                                Dar baixa (vendido)
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
