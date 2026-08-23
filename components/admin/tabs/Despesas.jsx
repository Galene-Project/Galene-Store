import React, { useEffect, useState } from "react";
import { Card, SectionTitle } from "../shared";
import { supabase } from "../../../lib/supabaseClient";
import { getSession } from "../../../lib/adminAuth";
import { CATEGORIAS, CATEGORIA_LABEL, SUBCATEGORIA_SUGESTOES } from "../../../lib/expenses";

const inputStyle = {
  padding: "6px 10px", borderRadius: 8, border: "1px solid var(--surface-7)",
  background: "var(--surface-3)", color: "var(--text-2)", fontSize: 12,
};

function formatBRL(v) {
  return `R$${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
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

function NovaDespesaForm({ onSaved }) {
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [subcategoria, setSubcategoria] = useState("");
  const [valor, setValor] = useState("");
  const [dataCompetencia, setDataCompetencia] = useState(new Date().toISOString().slice(0, 10));
  const [dataPagamento, setDataPagamento] = useState("");
  const [observacao, setObservacao] = useState("");
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");

  async function salvar() {
    setSaving(true);
    setErro("");
    try {
      await callApi("/api/admin/despesas", {
        action: "criar",
        categoria, subcategoria, valor,
        data_competencia: dataCompetencia,
        data_pagamento: dataPagamento || null,
        observacao,
      });
      setSubcategoria(""); setValor(""); setDataPagamento(""); setObservacao("");
      await onSaved();
    } catch (e) {
      setErro(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card delay={0}>
      <SectionTitle>Nova despesa variável</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 10, alignItems: "end" }}>
        <div>
          <div style={{ fontSize: 10, color: "var(--text-4)", marginBottom: 4 }}>Categoria</div>
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)} style={{ ...inputStyle, width: "100%" }}>
            {CATEGORIAS.map((c) => <option key={c} value={c}>{CATEGORIA_LABEL[c]}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 10, color: "var(--text-4)", marginBottom: 4 }}>Subcategoria</div>
          <input list="subcategoria-sugestoes" value={subcategoria} onChange={(e) => setSubcategoria(e.target.value)} style={{ ...inputStyle, width: "100%" }} placeholder="ex: Aluguel" />
          <datalist id="subcategoria-sugestoes">
            {(SUBCATEGORIA_SUGESTOES[categoria] || []).map((s) => <option key={s} value={s} />)}
          </datalist>
        </div>
        <div>
          <div style={{ fontSize: 10, color: "var(--text-4)", marginBottom: 4 }}>Valor (R$)</div>
          <input type="number" min="0.01" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
        </div>
        <div>
          <div style={{ fontSize: 10, color: "var(--text-4)", marginBottom: 4 }}>Competência</div>
          <input type="date" value={dataCompetencia} onChange={(e) => setDataCompetencia(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
        </div>
        <div>
          <div style={{ fontSize: 10, color: "var(--text-4)", marginBottom: 4 }}>Pagamento (opcional)</div>
          <input type="date" value={dataPagamento} onChange={(e) => setDataPagamento(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
        </div>
        <button onClick={salvar} disabled={saving || !valor} style={{
          padding: "8px 16px", borderRadius: 8, border: "none", cursor: saving ? "default" : "pointer",
          background: "linear-gradient(135deg,#c084fc,#818cf8)", color: "white", fontSize: 12, fontWeight: 700,
          opacity: saving || !valor ? 0.6 : 1,
        }}>{saving ? "Salvando..." : "Adicionar"}</button>
      </div>
      <input value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Observação (opcional)" style={{ ...inputStyle, width: "100%", marginTop: 10 }} />
      {erro && <div style={{ color: "#f87171", fontSize: 11, marginTop: 8 }}>{erro}</div>}
    </Card>
  );
}

function TabelaDespesas({ expenses, onApagar }) {
  return (
    <Card delay={0.05}>
      <SectionTitle accent="#818cf8">Despesas lançadas</SectionTitle>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr>
              {["Categoria", "Subcategoria", "Valor", "Competência", "Status", "Origem", ""].map((h) => (
                <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: "var(--text-4)", fontWeight: 600, borderBottom: "1px solid var(--surface-6)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id} style={{ borderBottom: "1px solid var(--surface-3)" }}>
                <td style={{ padding: "8px 10px", color: "var(--text-2)", fontWeight: 600 }}>{CATEGORIA_LABEL[e.categoria] || e.categoria}</td>
                <td style={{ padding: "8px 10px", color: "var(--text-3)" }}>{e.subcategoria || "-"}</td>
                <td style={{ padding: "8px 10px", color: "#c084fc", fontWeight: 700, fontFamily: "'DM Mono',monospace" }}>{formatBRL(e.valor)}</td>
                <td style={{ padding: "8px 10px", color: "var(--text-3)" }}>{e.data_competencia}</td>
                <td style={{ padding: "8px 10px" }}>
                  <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: e.data_pagamento ? "#d1fae5" : "#ffedd5", color: e.data_pagamento ? "#065f46" : "#9a3412" }}>
                    {e.data_pagamento ? "PAGO" : "PENDENTE"}
                  </span>
                </td>
                <td style={{ padding: "8px 10px", color: "var(--text-4)", fontSize: 11 }}>{e.recorrente ? "Fixa (auto)" : "Manual"}</td>
                <td style={{ padding: "8px 10px" }}>
                  <button onClick={() => onApagar(e.id)} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 11 }}>Apagar</button>
                </td>
              </tr>
            ))}
            {expenses.length === 0 && (
              <tr><td colSpan={7} style={{ padding: "16px 10px", color: "var(--text-4)", textAlign: "center" }}>Nenhuma despesa lançada ainda.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function DespesasFixasForm({ recurring, onChanged }) {
  const [categoria, setCategoria] = useState(CATEGORIAS[1]);
  const [subcategoria, setSubcategoria] = useState("");
  const [valor, setValor] = useState("");
  const [diaGeracao, setDiaGeracao] = useState("1");
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");

  async function salvar() {
    setSaving(true);
    setErro("");
    try {
      await callApi("/api/admin/despesas", { action: "criar_recorrente", categoria, subcategoria, valor, dia_geracao: diaGeracao });
      setSubcategoria(""); setValor("");
      onChanged();
    } catch (e) {
      setErro(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleAtivo(r) {
    setErro("");
    try {
      await callApi("/api/admin/despesas", { action: "atualizar_recorrente", id: r.id, categoria: r.categoria, subcategoria: r.subcategoria, valor: r.valor, dia_geracao: r.dia_geracao, ativo: !r.ativo });
      onChanged();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function apagar(id) {
    setErro("");
    try {
      await callApi("/api/admin/despesas", { action: "apagar_recorrente", id });
      onChanged();
    } catch (e) {
      setErro(e.message);
    }
  }

  return (
    <Card delay={0.1}>
      <SectionTitle accent="#fb923c">Despesas fixas (geradas automaticamente todo mês)</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
        {recurring.map((r) => (
          <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "var(--surface-2)", borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: "var(--text-2)" }}>
              <b>{CATEGORIA_LABEL[r.categoria]}</b>{r.subcategoria ? ` · ${r.subcategoria}` : ""} — {formatBRL(r.valor)} (todo dia {r.dia_geracao})
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => toggleAtivo(r)} style={{ fontSize: 11, color: r.ativo ? "#34d399" : "var(--text-4)", background: "none", border: "none", cursor: "pointer" }}>{r.ativo ? "Ativo" : "Inativo"}</button>
              <button onClick={() => apagar(r.id)} style={{ fontSize: 11, color: "#f87171", background: "none", border: "none", cursor: "pointer" }}>Apagar</button>
            </div>
          </div>
        ))}
        {recurring.length === 0 && <div style={{ fontSize: 12, color: "var(--text-4)" }}>Nenhuma despesa fixa cadastrada.</div>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, alignItems: "end" }}>
        <div>
          <div style={{ fontSize: 10, color: "var(--text-4)", marginBottom: 4 }}>Categoria</div>
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)} style={{ ...inputStyle, width: "100%" }}>
            {CATEGORIAS.map((c) => <option key={c} value={c}>{CATEGORIA_LABEL[c]}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 10, color: "var(--text-4)", marginBottom: 4 }}>Subcategoria</div>
          <input value={subcategoria} onChange={(e) => setSubcategoria(e.target.value)} style={{ ...inputStyle, width: "100%" }} placeholder="ex: Aluguel" />
        </div>
        <div>
          <div style={{ fontSize: 10, color: "var(--text-4)", marginBottom: 4 }}>Valor (R$)</div>
          <input type="number" min="0.01" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
        </div>
        <div>
          <div style={{ fontSize: 10, color: "var(--text-4)", marginBottom: 4 }}>Dia do mês (1-28)</div>
          <input type="number" min="1" max="28" value={diaGeracao} onChange={(e) => setDiaGeracao(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
        </div>
        <button onClick={salvar} disabled={saving || !valor} style={{
          padding: "8px 16px", borderRadius: 8, border: "none", cursor: saving ? "default" : "pointer",
          background: "linear-gradient(135deg,#fb923c,#f472b6)", color: "white", fontSize: 12, fontWeight: 700,
          opacity: saving || !valor ? 0.6 : 1,
        }}>{saving ? "Salvando..." : "Cadastrar fixa"}</button>
      </div>
      {erro && <div style={{ color: "#f87171", fontSize: 11, marginTop: 8 }}>{erro}</div>}
    </Card>
  );
}

function LoteProducaoForm({ produtos, onSaved }) {
  const [productId, setProductId] = useState("");
  const [novoProdutoAberto, setNovoProdutoAberto] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novaCategoria, setNovaCategoria] = useState("");
  const [novoPreco, setNovoPreco] = useState("");
  const [custoTotal, setCustoTotal] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");
  const [ultimoLote, setUltimoLote] = useState(null);

  async function salvar() {
    setSaving(true);
    setErro("");
    try {
      const body = {
        action: "criar",
        custo_total: custoTotal,
        quantidade_produzida: quantidade,
        data,
      };
      if (novoProdutoAberto) {
        body.novo_produto = { name: novoNome, category: novaCategoria, price: novoPreco };
      } else {
        body.product_id = productId;
      }
      const resultado = await callApi("/api/admin/lotes", body);
      setUltimoLote(resultado);
      setCustoTotal(""); setQuantidade(""); setNovoNome(""); setNovaCategoria(""); setNovoPreco("");
      onSaved(resultado);
    } catch (e) {
      setErro(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card delay={0.15}>
      <SectionTitle accent="#34d399">Registrar lote de produção</SectionTitle>
      <div style={{ marginBottom: 10 }}>
        <button onClick={() => setNovoProdutoAberto((v) => !v)} style={{ fontSize: 11, color: "var(--text-3)", background: "none", border: "1px solid var(--surface-7)", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>
          {novoProdutoAberto ? "← Escolher produto existente" : "+ Produto novo"}
        </button>
      </div>
      {!novoProdutoAberto ? (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: "var(--text-4)", marginBottom: 4 }}>Produto</div>
          <select value={productId} onChange={(e) => setProductId(e.target.value)} style={{ ...inputStyle, width: "100%" }}>
            <option value="">Selecione...</option>
            {produtos.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
          <input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Nome do produto" style={inputStyle} />
          <input value={novaCategoria} onChange={(e) => setNovaCategoria(e.target.value)} placeholder="Categoria" style={inputStyle} />
          <input type="number" step="0.01" value={novoPreco} onChange={(e) => setNovoPreco(e.target.value)} placeholder="Preço de venda" style={inputStyle} />
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, alignItems: "end" }}>
        <div>
          <div style={{ fontSize: 10, color: "var(--text-4)", marginBottom: 4 }}>Custo total (tecido+costura+logística)</div>
          <input type="number" step="0.01" value={custoTotal} onChange={(e) => setCustoTotal(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
        </div>
        <div>
          <div style={{ fontSize: 10, color: "var(--text-4)", marginBottom: 4 }}>Quantidade produzida</div>
          <input type="number" step="1" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
        </div>
        <div>
          <div style={{ fontSize: 10, color: "var(--text-4)", marginBottom: 4 }}>Data</div>
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
        </div>
        <button onClick={salvar} disabled={saving || !custoTotal || !quantidade || (!novoProdutoAberto && !productId)} style={{
          padding: "8px 16px", borderRadius: 8, border: "none", cursor: saving ? "default" : "pointer",
          background: "linear-gradient(135deg,#34d399,#38bdf8)", color: "white", fontSize: 12, fontWeight: 700,
          opacity: saving ? 0.6 : 1,
        }}>{saving ? "Salvando..." : "Registrar lote"}</button>
      </div>
      {erro && <div style={{ color: "#f87171", fontSize: 11, marginTop: 8 }}>{erro}</div>}
      {ultimoLote && (
        <div style={{ marginTop: 10, fontSize: 12, color: "#34d399" }}>
          Lote registrado — custo por peça: {formatBRL(ultimoLote.custoUnitario)}. Distribua o estoque abaixo.
        </div>
      )}
    </Card>
  );
}

function DistribuicaoLote({ lote, cores, tamanhos, onDistribuido }) {
  const restante = lote.quantidade_produzida - lote.quantidade_distribuida;
  const [linhas, setLinhas] = useState([{ color_id: "", size_id: "", quantity: "" }]);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");

  function addLinha() {
    setLinhas((l) => [...l, { color_id: "", size_id: "", quantity: "" }]);
  }

  function setLinha(i, campo, valor) {
    setLinhas((l) => l.map((x, idx) => (idx === i ? { ...x, [campo]: valor } : x)));
  }

  async function distribuir() {
    setSaving(true);
    setErro("");
    try {
      await callApi("/api/admin/lotes", { action: "distribuir", production_run_id: lote.id, distribuicao: linhas });
      setLinhas([{ color_id: "", size_id: "", quantity: "" }]);
      onDistribuido();
    } catch (e) {
      setErro(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: 12, background: "var(--surface-2)", borderRadius: 8, marginBottom: 10 }}>
      <div style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 700, marginBottom: 8 }}>
        {lote.products?.name} — {restante} peça{restante !== 1 ? "s" : ""} aguardando distribuição
      </div>
      {linhas.map((l, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 6 }}>
          <select value={l.color_id} onChange={(e) => setLinha(i, "color_id", e.target.value)} style={inputStyle}>
            <option value="">Cor...</option>
            {cores.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={l.size_id} onChange={(e) => setLinha(i, "size_id", e.target.value)} style={inputStyle}>
            <option value="">Tamanho...</option>
            {tamanhos.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input type="number" min="1" value={l.quantity} onChange={(e) => setLinha(i, "quantity", e.target.value)} placeholder="Qtd" style={inputStyle} />
        </div>
      ))}
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button onClick={addLinha} style={{ fontSize: 11, color: "var(--text-3)", background: "none", border: "1px solid var(--surface-7)", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>+ variante</button>
        <button onClick={distribuir} disabled={saving} style={{ fontSize: 11, color: "white", background: "linear-gradient(135deg,#34d399,#38bdf8)", border: "none", borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontWeight: 700 }}>
          {saving ? "Salvando..." : "Distribuir pro estoque"}
        </button>
      </div>
      {erro && <div style={{ color: "#f87171", fontSize: 11, marginTop: 6 }}>{erro}</div>}
    </div>
  );
}

export default function Despesas() {
  const [expenses, setExpenses] = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [cores, setCores] = useState([]);
  const [tamanhos, setTamanhos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function carregarDespesas() {
    const r = await callApi("/api/admin/despesas", { action: "listar" });
    setExpenses(r.expenses);
    setRecurring(r.recurring);
  }

  async function carregarLotes() {
    const r = await callApi("/api/admin/lotes", { action: "listar" });
    setLotes(r.rows);
  }

  useEffect(() => {
    Promise.all([
      carregarDespesas(),
      carregarLotes(),
      supabase.from("products").select("id, name").eq("is_active", true).order("name").then(({ data }) => setProdutos(data || [])),
      supabase.from("colors").select("id, name").order("name").then(({ data }) => setCores(data || [])),
      supabase.from("sizes").select("id, name").order("name").then(({ data }) => setTamanhos(data || [])),
    ])
      .catch((e) => setLoadError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function apagarDespesa(id) {
    setErrorMsg("");
    try {
      await callApi("/api/admin/despesas", { action: "apagar", id });
      await carregarDespesas();
    } catch (e) {
      setErrorMsg(e.message);
    }
  }

  const lotesPendentes = lotes.filter((l) => l.quantidade_distribuida < l.quantidade_produzida);

  if (loading) return <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-4)", fontSize: 13 }}>Carregando despesas...</div>;
  if (loadError) return <div style={{ textAlign: "center", padding: "80px 0", color: "#f87171", fontSize: 13 }}>Erro ao carregar despesas: {loadError}</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {errorMsg && (
        <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5", fontSize: 12 }}>
          ⚠️ {errorMsg}
        </div>
      )}
      <NovaDespesaForm onSaved={carregarDespesas} />
      <TabelaDespesas expenses={expenses} onApagar={apagarDespesa} />
      <DespesasFixasForm recurring={recurring} onChanged={carregarDespesas} />
      <LoteProducaoForm produtos={produtos} onSaved={carregarLotes} />
      {lotesPendentes.length > 0 && (
        <Card delay={0.2}>
          <SectionTitle accent="#38bdf8">Lotes aguardando distribuição de estoque ({lotesPendentes.length})</SectionTitle>
          {lotesPendentes.map((l) => (
            <DistribuicaoLote key={l.id} lote={l} cores={cores} tamanhos={tamanhos} onDistribuido={carregarLotes} />
          ))}
        </Card>
      )}
    </div>
  );
}
