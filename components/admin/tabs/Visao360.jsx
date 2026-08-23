import React, { useMemo, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import PeriodSelector from "../PeriodSelector";
import KPICard from "../KPICard";
import { SectionTitle, CustomTooltip, Card, CORES } from "../shared";
import { presetParaIntervalo, resumoVendas, serieFaturamento } from "../../../lib/dashboardMetrics";
import RelatorioProdutoVisual from "./RelatorioProdutoVisual";

function formatBRL(v) {
  return `R$${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

const grupoLabelStyle = {
  fontSize: 10, color: "var(--text-4)", textTransform: "uppercase",
  letterSpacing: "0.06em", marginBottom: 8,
};

export default function Visao360({ data }) {
  const [periodo, setPeriodo] = useState({ preset: "6m", ...presetParaIntervalo("6m") });

  const raw = data?.raw;

  const resumo = useMemo(() => {
    if (!raw) return null;
    return resumoVendas(raw.orders, raw.paidItems, raw.custoPorProdutoId, raw.expenses, periodo);
  }, [raw, periodo]);

  const serie = useMemo(() => {
    if (!raw) return [];
    return serieFaturamento(raw.orders, periodo);
  }, [raw, periodo]);

  if (!data || !resumo) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-4)", fontSize: 13 }}>
        Carregando Visão 360...
      </div>
    );
  }

  const { kpis, produtosParados, produtosParadosTotal } = data;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PeriodSelector value={periodo} onChange={setPeriodo} />

      <div>
        <div style={grupoLabelStyle}>Vendas</div>
        <div className="admin-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
          <KPICard icon="💰" label="Faturamento" value={formatBRL(resumo.faturamento)} sub="período" accent="#c084fc" />
          <KPICard icon="🛒" label="Pedidos" value={resumo.pedidos} sub="período" accent="#818cf8" />
          <KPICard icon="🎯" label="Ticket Médio" value={formatBRL(resumo.ticketMedio)} sub="período" accent="#38bdf8" />
        </div>
      </div>

      <div>
        <div style={grupoLabelStyle}>Financeiro</div>
        <div className="admin-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
          <KPICard
            icon="📈" label="Lucro Líquido" value={formatBRL(resumo.lucroLiquido)} sub="período, aproximado"
            accent={resumo.lucroLiquido >= 0 ? "#34d399" : "#ef4444"}
          />
          <KPICard
            icon="⚖️" label="Ponto de Equilíbrio"
            value={kpis.equilibrio.coberto ? "Coberto ✓" : `Faltam ${formatBRL(kpis.equilibrio.falta)}`}
            sub="mês corrente" accent={kpis.equilibrio.coberto ? "#34d399" : "#fb923c"}
          />
          <KPICard icon="🧾" label="Despesas" value={formatBRL(resumo.despesas)} sub="período" accent="#f472b6" />
        </div>
      </div>

      <div>
        <div style={grupoLabelStyle}>Estoque (agora)</div>
        <div className="admin-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
          <KPICard icon="📦" label="SKUs Ativos" value={kpis.totalSkus} sub={`${kpis.disponiveis} c/ estoque`} accent="#34d399" />
          <KPICard icon="⚠️" label="Estoque Baixo" value={kpis.estoqueBaixo} sub="atenção" accent="#fb923c" />
          <KPICard icon="❌" label="Esgotados" value={kpis.esgotados} sub="repor urgente" accent="#ef4444" />
        </div>
      </div>

      <Card>
        <SectionTitle>Faturamento no período</SectionTitle>
        {serie.length === 0 ? (
          <div style={{ fontSize: 12, color: "var(--text-4)", padding: "20px 0", textAlign: "center" }}>Sem faturamento no período.</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={serie}>
              <defs>
                <linearGradient id="gVisao360" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c084fc" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#c084fc" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-4)" />
              <XAxis dataKey="label" tick={{ fill: "var(--text-4)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--text-4)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(1)}k`} />
              <Tooltip content={<CustomTooltip prefix="R$" />} />
              <Area type="monotone" dataKey="valor" name="Faturamento" stroke="#c084fc" strokeWidth={2.5} fill="url(#gVisao360)" dot={{ r: 3, fill: "#c084fc" }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      <div className="admin-chart-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        <Card>
          <SectionTitle accent="#818cf8">Top Produtos (período)</SectionTitle>
          {resumo.topProdutos.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--text-4)" }}>Sem vendas no período.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {resumo.topProdutos.map((p, i) => {
                const pct = Math.round((p.vendas / resumo.topProdutos[0].vendas) * 100);
                return (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500 }}>{p.nome}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#c084fc", fontFamily: "'DM Mono',monospace" }}>{formatBRL(p.receita)}</span>
                    </div>
                    <div style={{ height: 4, background: "var(--surface-5)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: CORES[i % CORES.length], borderRadius: 2 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle accent="#f472b6">Clientes que Mais Compram (período)</SectionTitle>
          {resumo.topClientes.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--text-4)" }}>Sem pedidos pagos no período.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {resumo.topClientes.map((c, i) => {
                const pct = resumo.topClientes[0].totalGasto ? Math.round((c.totalGasto / resumo.topClientes[0].totalGasto) * 100) : 0;
                return (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500 }}>{c.nome}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#c084fc", fontFamily: "'DM Mono',monospace" }}>{formatBRL(c.totalGasto)}</span>
                    </div>
                    <div style={{ height: 4, background: "var(--surface-5)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: CORES[i % CORES.length], borderRadius: 2 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle accent="#60a5fa">Produtos Parados</SectionTitle>
          {produtosParados.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--text-4)" }}>Nenhum produto parado.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {produtosParados.slice(0, 7).map((p, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "var(--text-2)" }}>{p.produto}</span>
                  <span style={{ color: "#60a5fa", fontFamily: "'DM Mono',monospace" }}>
                    {p.diasSemVenda === null ? "sempre" : `${p.diasSemVenda}d`}
                  </span>
                </div>
              ))}
              {produtosParadosTotal > 7 && (
                <div style={{ fontSize: 10, color: "var(--text-4)" }}>+{produtosParadosTotal - 7} outros</div>
              )}
            </div>
          )}
        </Card>
      </div>

      <RelatorioProdutoVisual items={data.items} orders={data.orders} periodo={periodo} />
    </div>
  );
}
