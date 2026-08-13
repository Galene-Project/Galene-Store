import React from "react";
import {
  AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import KPICard from "../KPICard";
import { SectionTitle, CustomTooltip, Card, CORES, CORES_TAM } from "../shared";

export default function Overview({ data }) {
  const { faturamentoMensal, vendasPorCategoria, topProdutos, estoqueAlertas, distribuicaoTamanho, kpis } = data;
  const totalFat = faturamentoMensal.reduce((a, b) => a + b.valor, 0);
  const totalPedidos = faturamentoMensal.reduce((a, b) => a + b.pedidos, 0);
  const ticketMedio = totalPedidos ? Math.round(totalFat / totalPedidos) : 0;

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 14, marginBottom: 22 }}>
        <KPICard icon="💰" label="Faturamento (6 meses)"  value={`R$${(totalFat/1000).toFixed(1)}k`} sub="6 meses"          accent="#c084fc" delay={0}    />
        <KPICard icon="🛒" label="Total de Pedidos"       value={totalPedidos}                        sub="6 meses"          accent="#818cf8" delay={0.05}  />
        <KPICard icon="🎯" label="Ticket Médio"           value={`R$${ticketMedio}`}                  sub="por pedido"       accent="#38bdf8" delay={0.1}   />
        <KPICard icon="📦" label="SKUs Ativos"            value={kpis.totalSkus}                      sub={`${kpis.disponiveis} c/ estoque`} accent="#34d399" delay={0.15}  />
        <KPICard icon="⚠️" label="Alertas de Estoque"    value={estoqueAlertas.length}               sub={`${kpis.esgotados} esgotados`} accent="#fb923c" delay={0.2} />
        <KPICard icon="📅" label="Pedidos Hoje"           value={kpis.pedidosHoje}                    sub={`R$${kpis.faturamentoHoje}`}    accent="#f472b6" delay={0.25} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card delay={0.1}>
          <SectionTitle>Faturamento Mensal</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={faturamentoMensal}>
              <defs>
                <linearGradient id="gFat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#c084fc" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#c084fc" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gPed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#38bdf8" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="mes" tick={{ fill:"#64748b", fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="l" tick={{ fill:"#64748b", fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v=>`R$${(v/1000).toFixed(1)}k`} />
              <YAxis yAxisId="r" orientation="right" tick={{ fill:"#64748b", fontSize:11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize:11, color:"#94a3b8" }} />
              <Area yAxisId="l" type="monotone" dataKey="valor"   name="Faturamento" stroke="#c084fc" strokeWidth={2.5} fill="url(#gFat)" dot={{ r:4, fill:"#c084fc" }} />
              <Area yAxisId="r" type="monotone" dataKey="pedidos" name="Pedidos"     stroke="#38bdf8" strokeWidth={2}   fill="url(#gPed)" dot={{ r:3, fill:"#38bdf8" }} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card delay={0.15}>
          <SectionTitle accent="#f472b6">Vendas por Tamanho</SectionTitle>
          <ResponsiveContainer width="100%" height={175}>
            <PieChart>
              <Pie data={distribuicaoTamanho} cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={3} dataKey="value">
                {distribuicaoTamanho.map((_, i) => <Cell key={i} fill={CORES_TAM[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background:"#1e1b2e", border:"1px solid rgba(192,132,252,0.3)", borderRadius:8, fontSize:11 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
            {distribuicaoTamanho.map((d, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ width:8, height:8, borderRadius:2, background:CORES_TAM[i] }} />
                <span style={{ fontSize:11, color:"#94a3b8" }}>{d.name}: <b style={{ color:"#e2e8f0" }}>{d.value}%</b></span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
        <Card delay={0.2}>
          <SectionTitle accent="#34d399">Receita por Categoria</SectionTitle>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={vendasPorCategoria} layout="vertical" margin={{ left:0, right:16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill:"#64748b", fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={v=>`R$${v}`} />
              <YAxis type="category" dataKey="nome" tick={{ fill:"#94a3b8", fontSize:10 }} axisLine={false} tickLine={false} width={130} />
              <Tooltip content={<CustomTooltip prefix="R$" />} />
              <Bar dataKey="receita" name="Receita" radius={[0,6,6,0]}>
                {vendasPorCategoria.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card delay={0.25}>
          <SectionTitle accent="#818cf8">Top 7 Produtos</SectionTitle>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {topProdutos.map((p, i) => {
              const pct = Math.round((p.vendas / topProdutos[0].vendas) * 100);
              return (
                <div key={i}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:11, fontWeight:700, color:CORES[i], minWidth:18, fontFamily:"'DM Mono',monospace" }}>#{i+1}</span>
                      <span style={{ fontSize:12, color:"#e2e8f0", fontWeight:500 }}>{p.nome}</span>
                    </div>
                    <div style={{ display:"flex", gap:12 }}>
                      <span style={{ fontSize:11, color:"#64748b" }}>{p.vendas} un.</span>
                      <span style={{ fontSize:11, fontWeight:700, color:"#c084fc", fontFamily:"'DM Mono',monospace" }}>R${p.receita}</span>
                    </div>
                  </div>
                  <div style={{ height:4, background:"rgba(255,255,255,0.06)", borderRadius:2, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:"100%", transform:`scaleX(${pct/100})`, transformOrigin:"left", background:`linear-gradient(90deg,${CORES[i]},${CORES[(i+1)%CORES.length]})`, borderRadius:2, transition:"transform 1s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card style={{ background:"rgba(251,146,60,0.05)", border:"1px solid rgba(251,146,60,0.2)" }} delay={0.3}>
        <SectionTitle accent="#fb923c">🚨 Alertas de Estoque</SectionTitle>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
          {estoqueAlertas.map((a, i) => (
            <div key={i} style={{
              background: a.status==="esgotado" ? "rgba(239,68,68,0.1)" : "rgba(251,146,60,0.08)",
              border: `1px solid ${a.status==="esgotado" ? "rgba(239,68,68,0.3)" : "rgba(251,146,60,0.25)"}`,
              borderRadius:10, padding:"12px 14px",
              display:"flex", alignItems:"center", justifyContent:"space-between",
            }}>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:"#e2e8f0" }}>{a.produto}</div>
                <div style={{ fontSize:11, color:"#94a3b8" }}>{a.cor} · Tam {a.tam} · {a.sku}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:11, color:"#64748b" }}>Estoque</div>
                <div style={{ fontSize:20, fontWeight:800, color:a.status==="esgotado"?"#ef4444":"#fb923c", fontFamily:"'DM Mono',monospace" }}>{a.real}</div>
                <span style={{ fontSize:10, padding:"1px 6px", borderRadius:4, fontWeight:700,
                  background:a.status==="esgotado"?"#fee2e2":"#ffedd5",
                  color:a.status==="esgotado"?"#991b1b":"#9a3412" }}>
                  {a.status==="esgotado"?"ESGOTADO":"BAIXO"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
