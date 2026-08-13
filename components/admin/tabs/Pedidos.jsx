import React from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import KPICard from "../KPICard";
import { SectionTitle, CustomTooltip, Card, statusStyle } from "../shared";

export default function Pedidos({ data }) {
  const { faturamentoMensal, ultimosPedidos, kpis } = data;

  const statusPie = [
    { name:"Entregue",     value: kpis.entregues    },
    { name:"Em andamento", value: kpis.emAndamento  },
    { name:"Cancelado",    value: kpis.cancelados   },
  ];
  const statusCores = ["#34d399","#38bdf8","#ef4444"];
  const totalStatus = kpis.entregues + kpis.emAndamento + kpis.cancelados;
  const pct = (n) => totalStatus ? `${Math.round((n / totalStatus) * 100)}%` : "—";

  return (
    <>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:22 }}>
        <KPICard icon="🛒" label="Pedidos (6 meses)"  value={kpis.pedidosMes}   accent="#c084fc" delay={0}    />
        <KPICard icon="✅" label="Entregues"           value={kpis.entregues}    sub={pct(kpis.entregues)}        accent="#34d399" delay={0.05} />
        <KPICard icon="🚚" label="Em Andamento"        value={kpis.emAndamento}  sub="este mês"   accent="#38bdf8" delay={0.1}  />
        <KPICard icon="❌" label="Cancelados"          value={kpis.cancelados}   sub={pct(kpis.cancelados)}       accent="#ef4444" delay={0.15} />
      </div>

      <Card delay={0.1} style={{ marginBottom:16 }}>
        <SectionTitle>Últimos Pedidos</SectionTitle>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead>
              <tr>
                {["Nº Pedido","Data","Cliente","Produto","Cor","Tam","Qtd","Total","Status"].map(h=>(
                  <th key={h} style={{ padding:"10px 14px", textAlign:"left", color:"#64748b", fontWeight:600, borderBottom:"1px solid rgba(255,255,255,0.07)", whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ultimosPedidos.map((p, i) => {
                const st = statusStyle(p.status);
                return (
                  <tr key={i}
                    style={{ borderBottom:"1px solid rgba(255,255,255,0.04)", transition:"background 0.15s", cursor:"default" }}
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.03)"}
                    onMouseLeave={e=>e.currentTarget.style.background=""}>
                    <td style={{ padding:"11px 14px", fontFamily:"'DM Mono',monospace", fontSize:11, color:"#c084fc", fontWeight:600 }}>{p.num}</td>
                    <td style={{ padding:"11px 14px", color:"#64748b" }}>{p.data}</td>
                    <td style={{ padding:"11px 14px", color:"#e2e8f0", fontWeight:600 }}>{p.cliente}</td>
                    <td style={{ padding:"11px 14px", color:"#94a3b8" }}>{p.produto}</td>
                    <td style={{ padding:"11px 14px", color:"#64748b" }}>{p.cor}</td>
                    <td style={{ padding:"11px 14px", color:"#64748b" }}>{p.tam}</td>
                    <td style={{ padding:"11px 14px", color:"#94a3b8", textAlign:"center" }}>{p.qtd}</td>
                    <td style={{ padding:"11px 14px", fontWeight:700, color:"#c084fc", fontFamily:"'DM Mono',monospace" }}>R${p.total}</td>
                    <td style={{ padding:"11px 14px" }}>
                      <span style={{ padding:"3px 10px", borderRadius:20, fontSize:10, fontWeight:700, background:st.bg, color:st.color }}>{p.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <Card delay={0.2}>
          <SectionTitle accent="#34d399">Pedidos por Mês</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={faturamentoMensal}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="mes" tick={{ fill:"#64748b", fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:"#64748b", fontSize:11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="pedidos" name="Pedidos" fill="#34d399" radius={[6,6,0,0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card delay={0.25}>
          <SectionTitle accent="#818cf8">Status dos Pedidos (6 meses)</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusPie} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                {statusPie.map((_, i) => <Cell key={i} fill={statusCores[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background:"#1e1b2e", border:"1px solid rgba(192,132,252,0.3)", borderRadius:8, fontSize:11 }} />
              <Legend wrapperStyle={{ fontSize:11, color:"#94a3b8" }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </>
  );
}
