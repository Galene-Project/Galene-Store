import React, { useMemo, useState } from "react";
import {
  LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import KPICard from "../KPICard";
import PeriodSelector from "../PeriodSelector";
import { SectionTitle, CustomTooltip, Card, CORES, SemDados } from "../shared";
import { formatBRL, formatBRLk } from "../../../lib/format";
import { presetParaIntervalo, periodoAnterior, resumoVendas, serieFaturamento } from "../../../lib/dashboardMetrics";

export default function Vendas({ data }) {
  const [periodo, setPeriodo] = useState({ preset: "6m", ...presetParaIntervalo("6m") });
  const raw = data?.raw;

  const { atual, anterior, serie } = useMemo(() => {
    if (!raw) return {};
    const calc = (p) => resumoVendas(raw.orders, raw.paidItems, raw.custoPorProdutoId, raw.expenses, p);
    return { atual: calc(periodo), anterior: calc(periodoAnterior(periodo)), serie: serieFaturamento(raw.orders, periodo) };
  }, [raw, periodo]);

  if (!atual) return <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-4)", fontSize: 13 }}>Carregando vendas...</div>;

  const { vendasPorCategoria, topProdutos } = atual;
  const melhorCat = vendasPorCategoria[0];
  const crescimento = anterior.faturamento
    ? Math.round(((atual.faturamento - anterior.faturamento) / anterior.faturamento) * 100)
    : null;

  return (
    <>
      <PeriodSelector value={periodo} onChange={setPeriodo} />
      <div className="admin-kpi-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:22 }}>
        <KPICard label="Faturamento" value={formatBRLk(atual.faturamento)} sub="no período" />
        <KPICard label="Crescimento" value={crescimento === null ? "—" : `${crescimento > 0 ? "+" : ""}${crescimento}%`} sub="vs período anterior" />
        <KPICard label="Ticket médio" value={formatBRL(atual.ticketMedio)} sub="por pedido" />
        <KPICard label="Melhor categoria" value={melhorCat ? melhorCat.nome.split(" ")[0] : "—"} sub={melhorCat ? formatBRL(melhorCat.receita) : "sem vendas"} />
      </div>

      <div className="admin-chart-grid" style={{ display:"grid", gridTemplateColumns:"3fr 2fr", gap:16, marginBottom:16 }}>
        <Card delay={0.1}>
          <SectionTitle>Evolução do faturamento</SectionTitle>
          {serie.length ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={serie}>
              <CartesianGrid stroke="var(--grid)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill:"var(--text-4)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:"var(--text-4)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={formatBRLk} width={56} />
              <Tooltip content={<CustomTooltip prefix="R$" />} />
              <Line type="linear" dataKey="valor" name="Faturamento" stroke="var(--accent)" strokeWidth={2} dot={{ r:3, fill:"var(--accent)" }} />
            </LineChart>
          </ResponsiveContainer>
          ) : <SemDados height={260} />}
        </Card>

        <Card delay={0.15}>
          <SectionTitle>Receita por Categoria</SectionTitle>
          {vendasPorCategoria.length ? (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={vendasPorCategoria} cx="50%" cy="50%" outerRadius={95} dataKey="receita" nameKey="nome"
                label={({ name, percent }) => `${name.split(" ")[0]} ${(percent*100).toFixed(0)}%`}
                labelLine={false} fontSize={9}>
                {vendasPorCategoria.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background:"var(--panel-solid)", border:"1px solid var(--accent-tint)", borderRadius:8, fontSize: 12 }} formatter={v=>[`R$${v}`,"Receita"]} />
            </PieChart>
          </ResponsiveContainer>
          ) : <SemDados height={260} />}
        </Card>
      </div>

      <Card delay={0.2}>
        <SectionTitle>Ranking — Receita vs Unidades Vendidas</SectionTitle>
        {topProdutos.length ? (
          <ResponsiveContainer width="100%" height={220}>
          <BarChart data={topProdutos}>
            <CartesianGrid stroke="var(--grid)" vertical={false} />
            <XAxis dataKey="nome" tick={{ fill:"var(--text-4)", fontSize: 12 }} axisLine={false} tickLine={false}
              tickFormatter={n=>n.replace("Vestido ","").replace("Conjunto ","")} />
            <YAxis yAxisId="l" tick={{ fill:"var(--text-4)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v=>`R$${v}`} />
            <YAxis yAxisId="r" orientation="right" tick={{ fill:"var(--text-4)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color:"var(--text-3)" }} />
            <Bar yAxisId="l" dataKey="receita" name="Receita (R$)" fill="var(--accent)" radius={[4,4,0,0]} opacity={0.85} />
            <Bar yAxisId="r" dataKey="vendas"  name="Unidades"     fill="var(--chart-2)" radius={[4,4,0,0]} opacity={0.85} />
          </BarChart>
        </ResponsiveContainer>
          ) : <SemDados height={220} />}
      </Card>
    </>
  );
}
