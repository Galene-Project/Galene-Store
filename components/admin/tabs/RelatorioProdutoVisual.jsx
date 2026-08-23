import React, { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { productReport } from "../../../lib/reportMetrics";
import { SectionTitle, Card, CustomTooltip, CORES } from "../shared";
import { supabase } from "../../../lib/supabaseClient";

const selectStyle = {
  padding: "8px 12px", borderRadius: 8, border: "1px solid var(--surface-7)",
  background: "var(--surface-3)", color: "var(--text-2)", fontSize: 12,
};

export default function RelatorioProdutoVisual({ items, orders, periodo }) {
  const [produtos, setProdutos] = useState([]);
  const [categoria, setCategoria] = useState("");
  const [produtoId, setProdutoId] = useState("");
  const [tipo, setTipo] = useState("vendas");
  const [estoqueRows, setEstoqueRows] = useState([]);

  useEffect(() => {
    supabase
      .from("products")
      .select("id, name, category")
      .eq("is_active", true)
      .order("category")
      .order("name")
      .then(({ data: rows }) => setProdutos(rows || []));
  }, []);

  useEffect(() => {
    if (tipo !== "estoque" || !produtoId) { setEstoqueRows([]); return () => {}; }
    let cancelado = false;
    supabase
      .from("stock")
      .select("quantity, color_id, size_id, colors(name), sizes(name)")
      .eq("product_id", produtoId)
      .then(({ data: rows }) => { if (!cancelado) setEstoqueRows(rows || []); });
    return () => { cancelado = true; };
  }, [tipo, produtoId]);

  const categorias = useMemo(() => {
    const set = new Set(produtos.map((p) => p.category).filter(Boolean));
    return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [produtos]);

  const produtosFiltrados = useMemo(
    () => (categoria ? produtos.filter((p) => p.category === categoria) : produtos),
    [produtos, categoria]
  );

  const report = useMemo(
    () => productReport(items, orders, { productId: produtoId, startDate: periodo.startDate, endDate: periodo.endDate }),
    [items, orders, produtoId, periodo]
  );

  const dadosGraficoVendas = report.breakdown.map((b) => ({ nome: `${b.cor}/${b.tamanho}`, peças: b.pecas }));
  const dadosGraficoEstoque = estoqueRows.map((r) => ({ nome: `${r.colors?.name || "-"}/${r.sizes?.name || "-"}`, quantidade: r.quantity }));

  return (
    <Card>
      <SectionTitle accent="#38bdf8">Relatório por produto</SectionTitle>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={selectStyle}>
          <option value="vendas">Vendas</option>
          <option value="estoque">Estoque</option>
        </select>
        <select value={categoria} onChange={(e) => { setCategoria(e.target.value); setProdutoId(""); }} style={selectStyle}>
          <option value="">Categoria: todas</option>
          {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={produtoId} onChange={(e) => setProdutoId(e.target.value)} style={{ ...selectStyle, minWidth: 220 }}>
          <option value="">Selecione um produto</option>
          {produtosFiltrados.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {!produtoId ? (
        <div style={{ fontSize: 12, color: "var(--text-4)", padding: "20px 0", textAlign: "center" }}>
          Selecione um produto pra ver o gráfico.
        </div>
      ) : tipo === "vendas" ? (
        dadosGraficoVendas.length === 0 ? (
          <div style={{ fontSize: 12, color: "var(--text-4)", padding: "20px 0", textAlign: "center" }}>
            Nenhuma venda desse produto no período selecionado.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dadosGraficoVendas}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-4)" />
              <XAxis dataKey="nome" tick={{ fill: "var(--text-3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--text-4)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="peças" radius={[6, 6, 0, 0]}>
                {dadosGraficoVendas.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )
      ) : dadosGraficoEstoque.length === 0 ? (
        <div style={{ fontSize: 12, color: "var(--text-4)", padding: "20px 0", textAlign: "center" }}>
          Nenhuma linha de estoque cadastrada pra esse produto.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={dadosGraficoEstoque}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-4)" />
            <XAxis dataKey="nome" tick={{ fill: "var(--text-3)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "var(--text-4)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="quantidade" radius={[6, 6, 0, 0]}>
              {dadosGraficoEstoque.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
