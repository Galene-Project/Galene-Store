import React from "react";
import {
  LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import KPICard from "../KPICard";
import { SectionTitle, CustomTooltip, Card, CORES, SemDados } from "../shared";
import { formatBRLk } from "../../../lib/format";

export default function Vendas({ data }) {
  const { faturamentoMensal, vendasPorCategoria, topProdutos } = data;
  const totalFat = faturamentoMensal.reduce((a, b) => a + b.valor, 0);
  const totalPedidos = faturamentoMensal.reduce((a, b) => a + b.pedidos, 0);
  const ticketMedio = totalPedidos ? Math.round(totalFat / totalPedidos) : 0;
  const melhorCat = [...vendasPorCategoria].sort((a,b)=>b.receita-a.receita)[0];
  const mesAtual = faturamentoMensal[faturamentoMensal.length - 1];
  const mesAnterior = faturamentoMensal[faturamentoMensal.length - 2];
  const crescimento = mesAnterior?.valor
    ? Math.round(((mesAtual.valor - mesAnterior.valor) / mesAnterior.valor) * 100)
    : null;

  return (
    <>
      <div className="admin-kpi-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:22 }}>
        <KPICard icon="" label="Faturamento (6 meses)" value={formatBRLk(totalFat)} accent="var(--accent)" delay={0} />
        <KPICard icon="" label="Crescimento"           value={crescimento === null ? "—" : `${crescimento > 0 ? "+" : ""}${crescimento}%`} sub="vs mês anterior" accent="var(--positive)" delay={0.05} />
        <KPICard icon="" label="Ticket Médio"          value={`R$${ticketMedio}`}                  sub="por pedido"      accent="var(--chart-2)" delay={0.1}  />
        <KPICard icon="" label="Melhor Categoria"      value={melhorCat ? melhorCat.nome.split(" ")[0] : "—"} sub={melhorCat ? `R$${melhorCat.receita}` : "sem vendas"} accent="var(--chart-2)" delay={0.15} />
      </div>

      <div className="admin-chart-grid" style={{ display:"grid", gridTemplateColumns:"3fr 2fr", gap:16, marginBottom:16 }}>
        <Card delay={0.1}>
          <SectionTitle>Evolução — Faturamento & Pedidos</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={faturamentoMensal}>
              <CartesianGrid stroke="var(--grid)" vertical={false} />
              <XAxis dataKey="mes" tick={{ fill:"var(--text-4)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="l" tick={{ fill:"var(--text-4)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v=>`R$${v}`} />
              <YAxis yAxisId="r" orientation="right" tick={{ fill:"var(--text-4)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color:"var(--text-3)" }} />
              <Line yAxisId="l" type="linear" dataKey="valor"   name="Faturamento (R$)" stroke="var(--accent)" strokeWidth={3} dot={{ r:5, fill:"var(--accent)", stroke:"var(--panel-solid)", strokeWidth:2 }} />
              <Line yAxisId="r" type="linear" dataKey="pedidos" name="Nº Pedidos"       stroke="var(--positive)" strokeWidth={2} strokeDasharray="5 3" dot={{ r:4, fill:"var(--positive)" }} />
            </LineChart>
          </ResponsiveContainer>
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
