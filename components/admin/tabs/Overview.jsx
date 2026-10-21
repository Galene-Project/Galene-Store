import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import KPICard from "../KPICard";
import { Card, CardHead, CustomTooltip, Pill, RankList, SemDados } from "../shared";
import { formatBRL, formatBRLk } from "../../../lib/format";

// Visão geral = resumo das abas detalhadas. A pergunta dela: "o que pede
// atenção hoje?" — por isso a fila de pedidos e o estoque vêm antes dos
// rankings, e cada bloco leva à aba onde se resolve.
const FILA = { aguardando_aprovacao: "Aprovar cartão", aguardando_pagamento: "Confirmar pagamento" };

export default function Overview({ data, onNavigate = () => {} }) {
  const { faturamentoMensal, topProdutos, estoqueAlertas, kpis, comparativo, topClientes, produtosParados, produtosParadosTotal } = data;
  const totalFat = faturamentoMensal.reduce((a, b) => a + b.valor, 0);
  const totalPedidos = faturamentoMensal.reduce((a, b) => a + b.pedidos, 0);
  const ticketMedio = totalPedidos ? totalFat / totalPedidos : 0;

  const fila = (data.raw?.orders || [])
    .filter((o) => FILA[o.status])
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const esgotadas = kpis.esgotados;
  const baixas = kpis.estoqueBaixo;

  const resumo = [
    fila.length && `${fila.length} pedido${fila.length > 1 ? "s" : ""} esperando você`,
    esgotadas && `${esgotadas} variante${esgotadas > 1 ? "s" : ""} esgotada${esgotadas > 1 ? "s" : ""}`,
    baixas && `${baixas} com estoque baixo`,
  ].filter(Boolean);

  return (
    <>
      <p style={{ margin: "0 0 16px", fontSize: 15, color: "var(--text-2)" }}>
        {resumo.length ? resumo.join(" · ") : "Nada pendente agora: sem pedido na fila e sem estoque em alerta."}
      </p>

      <div className="admin-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)" }}>
        <KPICard label="Faturamento" value={formatBRLk(totalFat)} sub="últimos 6 meses"
          trend={comparativo.faturamentoPct !== null ? { pct: comparativo.faturamentoPct, up: comparativo.faturamentoPct >= 0 } : null} />
        <KPICard label="Pedidos" value={totalPedidos} sub="últimos 6 meses"
          trend={comparativo.pedidosPct !== null ? { pct: comparativo.pedidosPct, up: comparativo.pedidosPct >= 0 } : null} />
        <KPICard label="Ticket médio" value={formatBRL(ticketMedio)} sub="por pedido" />
        <KPICard label="Produtos ativos" value={kpis.totalSkus} sub={`${kpis.disponiveis} variantes com estoque`} />
        <KPICard label="Lucro líquido" value={formatBRLk(kpis.lucroLiquido)} sub="6 meses, aproximado"
          accent={kpis.lucroLiquido < 0 ? "var(--negative)" : undefined} />
        <KPICard label="Ponto de equilíbrio" value={kpis.equilibrio.coberto ? "Coberto" : formatBRLk(kpis.equilibrio.falta)}
          sub={kpis.equilibrio.coberto ? "fixo do mês coberto" : "faltam para cobrir o fixo do mês"} />
      </div>

      <div className="admin-chart-grid" style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16, marginBottom: 16, alignItems: "start" }}>
        <Card>
          <CardHead title="Faturamento mensal" action="Ver vendas" onAction={() => onNavigate("vendas")} />
          {totalFat > 0 ? (
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={faturamentoMensal}>
                <defs>
                  <linearGradient id="gFat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.16} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--grid)" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: "var(--text-4)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--text-4)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={formatBRLk} width={56} />
                <Tooltip content={<CustomTooltip prefix="R$" />} />
                <Area type="linear" dataKey="valor" name="Faturamento" stroke="var(--accent)" strokeWidth={2} fill="url(#gFat)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <SemDados height={230} texto="Nenhum pedido pago nos últimos 6 meses." />}
        </Card>

        <Card>
          <CardHead title="Pedidos esperando você" action="Ver pedidos" onAction={() => onNavigate("pedidos")} />
          {fila.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--text-4)" }}>Nenhum pedido esperando aprovação ou pagamento.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {fila.slice(0, 5).map((o) => (
                <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "10px 0", borderTop: "1px solid var(--rule)" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.customers?.company_name || o.customers?.name || "—"}</div>
                    <div style={{ fontSize: 12, color: "var(--text-5)", fontFamily: "var(--font)" }}>{o.order_number} · {o.canal === "loja" ? "Loja · " : ""}{formatBRL(o.total)}</div>
                  </div>
                  <Pill tone="warning">{FILA[o.status]}</Pill>
                </div>
              ))}
              {fila.length > 5 && <div style={{ fontSize: 12, color: "var(--text-5)", paddingTop: 8 }}>+{fila.length - 5} na fila</div>}
            </div>
          )}
        </Card>
      </div>

      <div className="admin-chart-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16, alignItems: "start" }}>
        <Card>
          <CardHead title="Estoque pedindo reposição" action="Ver estoque" onAction={() => onNavigate("estoque")} />
          {estoqueAlertas.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--text-4)" }}>Nenhuma variante esgotada ou com estoque baixo.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {estoqueAlertas.slice(0, 6).map((a, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "10px 0", borderTop: "1px solid var(--rule)" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.produto}</div>
                    <div style={{ fontSize: 12, color: "var(--text-5)" }}>{a.cor} · tam. {a.tam}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: "var(--font)", fontSize: 14, color: "var(--text-1)", fontVariantNumeric: "tabular-nums", minWidth: 18, textAlign: "right" }}>{a.real}</span>
                    <Pill tone={a.status === "esgotado" ? "negative" : "warning"}>{a.status === "esgotado" ? "Esgotado" : "Baixo"}</Pill>
                  </div>
                </div>
              ))}
              {kpis.estoqueBaixo + kpis.esgotados > 6 && <div style={{ fontSize: 12, color: "var(--text-5)", paddingTop: 8 }}>+{kpis.estoqueBaixo + kpis.esgotados - 6} variantes em alerta</div>}
            </div>
          )}
        </Card>

        <Card>
          <CardHead title="Produtos parados" action="Ver estoque" onAction={() => onNavigate("estoque")} />
          {produtosParados.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--text-4)" }}>Nenhum produto parado: tudo girando.</div>
          ) : (
            <>
              <div style={{ fontSize: 12, color: "var(--text-5)", marginBottom: 6 }}>Sem venda há 60+ dias · {produtosParadosTotal} no total, os 6 com mais peças paradas</div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {produtosParados.slice(0, 6).map((p, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 0", borderTop: "1px solid var(--rule)" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.produto}</div>
                      <div style={{ fontSize: 12, color: "var(--text-5)" }}>{p.estoqueTotal} un. em estoque</div>
                    </div>
                    <span style={{ fontFamily: "var(--font)", fontSize: 13, color: "var(--text-3)", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                      {p.diasSemVenda === null ? "nunca vendeu" : `${p.diasSemVenda} dias`}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      <div className="admin-chart-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
        <Card>
          <CardHead title="Produtos que mais vendem" action="Ver vendas" onAction={() => onNavigate("vendas")} />
          <RankList vazio="Nenhuma venda ainda."
            rows={topProdutos.slice(0, 5).map((p) => ({ label: p.nome, detail: `${p.vendas} un.`, value: formatBRL(p.receita), pct: p.vendas }))} />
        </Card>
        <Card>
          <CardHead title="Clientes que mais compram" action="Ver clientes" onAction={() => onNavigate("clientes")} />
          <RankList vazio="Nenhum pedido pago ainda."
            rows={topClientes.slice(0, 5).map((c) => ({ label: c.nome, detail: `${c.totalPedidos} pedido${c.totalPedidos !== 1 ? "s" : ""}`, value: formatBRL(c.totalGasto), pct: c.totalGasto }))} />
        </Card>
      </div>
    </>
  );
}
