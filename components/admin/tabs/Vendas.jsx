import React from "react";
import {
  LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import KPICard from "../KPICard";
import { SectionTitle, CustomTooltip, Card, CORES } from "../shared";

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
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:22 }}>
        <KPICard icon="💰" label="Faturamento (6 meses)" value={`R$${(totalFat/1000).toFixed(1)}k`} accent="#c084fc" delay={0} />
        <KPICard icon="📈" label="Crescimento"           value={crescimento === null ? "—" : `${crescimento > 0 ? "+" : ""}${crescimento}%`} sub="vs mês anterior" accent="#34d399" delay={0.05} />
        <KPICard icon="🎯" label="Ticket Médio"          value={`R$${ticketMedio}`}                  sub="por pedido"      accent="#38bdf8" delay={0.1}  />
        <KPICard icon="🏆" label="Melhor Categoria"      value={melhorCat ? melhorCat.nome.split(" ")[0] : "—"} sub={melhorCat ? `R$${melhorCat.receita}` : "sem vendas"} accent="#f472b6" delay={0.15} />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"3fr 2fr", gap:16, marginBottom:16 }}>
        <Card delay={0.1}>
          <SectionTitle>Evolução — Faturamento & Pedidos</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={faturamentoMensal}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="mes" tick={{ fill:"#64748b", fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="l" tick={{ fill:"#64748b", fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v=>`R$${v}`} />
              <YAxis yAxisId="r" orientation="right" tick={{ fill:"#64748b", fontSize:11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize:11, color:"#94a3b8" }} />
              <Line yAxisId="l" type="monotone" dataKey="valor"   name="Faturamento (R$)" stroke="#c084fc" strokeWidth={3} dot={{ r:5, fill:"#c084fc", stroke:"#1e1b2e", strokeWidth:2 }} />
              <Line yAxisId="r" type="monotone" dataKey="pedidos" name="Nº Pedidos"       stroke="#34d399" strokeWidth={2} strokeDasharray="5 3" dot={{ r:4, fill:"#34d399" }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card delay={0.15}>
          <SectionTitle accent="#fb923c">Receita por Categoria</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={vendasPorCategoria} cx="50%" cy="50%" outerRadius={95} dataKey="receita" nameKey="nome"
                label={({ name, percent }) => `${name.split(" ")[0]} ${(percent*100).toFixed(0)}%`}
                labelLine={false} fontSize={9}>
                {vendasPorCategoria.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background:"#1e1b2e", border:"1px solid rgba(192,132,252,0.3)", borderRadius:8, fontSize:11 }} formatter={v=>[`R$${v}`,"Receita"]} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card delay={0.2}>
        <SectionTitle accent="#818cf8">Ranking — Receita vs Unidades Vendidas</SectionTitle>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={topProdutos}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="nome" tick={{ fill:"#64748b", fontSize:10 }} axisLine={false} tickLine={false}
              tickFormatter={n=>n.replace("Vestido ","").replace("Conjunto ","")} />
            <YAxis yAxisId="l" tick={{ fill:"#64748b", fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={v=>`R$${v}`} />
            <YAxis yAxisId="r" orientation="right" tick={{ fill:"#64748b", fontSize:10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize:11, color:"#94a3b8" }} />
            <Bar yAxisId="l" dataKey="receita" name="Receita (R$)" fill="#c084fc" radius={[4,4,0,0]} opacity={0.85} />
            <Bar yAxisId="r" dataKey="vendas"  name="Unidades"     fill="#38bdf8" radius={[4,4,0,0]} opacity={0.85} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </>
  );
}
