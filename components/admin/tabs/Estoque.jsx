import React from "react";
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import KPICard from "../KPICard";
import { SectionTitle, CustomTooltip, Card, Pill, SemDados } from "../shared";

export default function Estoque({ data }) {
  const { vendasPorCategoria, estoqueAlertas, distribuicaoTamanho, kpis, estoquePorCategoria, estoquePorTamanho } = data;
  // Cruza o que mais vende com o que tem no estoque: o tamanho líder de
  // vendas é o que mais pesa no reabastecimento.
  const lider = [...distribuicaoTamanho].sort((a, b) => b.value - a.value)[0];
  const totalEstoqueTam = estoquePorTamanho.reduce((s, t) => s + t.value, 0);
  const estoqueDoLider = lider && totalEstoqueTam
    ? Math.round(((estoquePorTamanho.find((t) => t.name === lider.name)?.value || 0) / totalEstoqueTam) * 100)
    : null;
  const insightTamanho = lider && estoqueDoLider !== null
    ? `Tamanho ${lider.name}: ${lider.value}% das vendas e ${estoqueDoLider}% do estoque${lider.value > estoqueDoLider ? " — priorize no reabastecimento" : ""}`
    : null;
  // totalSkus conta produtos; disponiveis/esgotados contam variantes (cor × tamanho)
  // — porcentagem só faz sentido entre as duas últimas.
  const totalVariantes = kpis.disponiveis + kpis.esgotados;
  const vendidoPorCategoria = new Map(vendasPorCategoria.map((v) => [v.nome, v.vendas]));
  const estoqueReal = estoquePorCategoria.map((e) => ({
    nome: e.nome, estoque: e.estoque, vendido: vendidoPorCategoria.get(e.nome) || 0,
  }));

  return (
    <>
      <div className="admin-kpi-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)" }}>
        <KPICard icon="" label="Produtos Ativos" value={kpis.totalSkus}   sub={`${totalVariantes} variantes`} accent="var(--accent)"  delay={0}    />
        <KPICard icon="" label="Variantes Disponíveis" value={kpis.disponiveis} sub={`${totalVariantes ? Math.round(kpis.disponiveis/totalVariantes*100) : 0}%`} accent="var(--positive)" delay={0.05} />
        <KPICard icon="" label="Estoque Baixo"  value={kpis.estoqueBaixo} sub="atenção"     accent="var(--warning)" delay={0.1}  />
        <KPICard icon="" label="Esgotados"       value={kpis.esgotados}   sub="repor urgente" accent="var(--negative)" delay={0.15} />
      </div>

      <div className="admin-chart-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16, alignItems:"start" }}>
        <Card delay={0.1}>
          <SectionTitle>Estoque por categoria (un.)</SectionTitle>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={estoqueReal} layout="vertical">
              <CartesianGrid stroke="var(--grid)" horizontal={false} />
              <XAxis type="number" tick={{ fill:"var(--text-4)", fontSize:12 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="nome" tick={{ fill:"var(--text-3)", fontSize:12 }} axisLine={false} tickLine={false} width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize:12, color:"var(--text-3)" }} />
              <Bar dataKey="estoque" name="Em estoque" fill="var(--accent)" />
              <Bar dataKey="vendido" name="Vendido"    fill="var(--chart-3)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card delay={0.15}>
          <SectionTitle>Estoque por tamanho (un.)</SectionTitle>
          {estoquePorTamanho.length ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={estoquePorTamanho}>
              <CartesianGrid stroke="var(--grid)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill:"var(--text-3)", fontSize:13 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:"var(--text-4)", fontSize:12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Unidades" fill="var(--accent)" />
            </BarChart>
          </ResponsiveContainer>
          ) : <SemDados height={200} />}
          {insightTamanho && (
            <div style={{ marginTop:14, fontSize:13, color:"var(--text-3)" }}>{insightTamanho}</div>
          )}
        </Card>
      </div>

      <Card>
        <SectionTitle>{`Produtos para repor (${estoqueAlertas.length})`}</SectionTitle>
        <div style={{ overflow:"auto", maxHeight:480 }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:14 }}>
            <thead>
              <tr>
                {[["SKU","left"],["Produto","left"],["Cor","left"],["Tam.","left"],["Estoque","right"],["Mínimo","right"],["Situação","left"]].map(([h,al])=>(
                  <th key={h} style={{ position:"sticky", top:0, background:"var(--surface)", padding:"8px 12px", textAlign:al, color:"var(--text-4)", fontWeight:400, fontSize:12, borderBottom:"1px solid var(--border)", whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {estoqueAlertas.map((a, i) => (
                <tr key={i} style={{ borderBottom:"1px solid var(--rule)" }}>
                  <td style={{ padding:"10px 12px", color:"var(--text-5)", fontFamily:"var(--mono)", fontSize:12 }}>{a.sku}</td>
                  <td style={{ padding:"10px 12px", color:"var(--text-1)" }}>{a.produto}</td>
                  <td style={{ padding:"10px 12px", color:"var(--text-3)" }}>{a.cor}</td>
                  <td style={{ padding:"10px 12px", color:"var(--text-3)" }}>{a.tam}</td>
                  <td style={{ padding:"10px 12px", textAlign:"right", fontFamily:"var(--font)", fontVariantNumeric:"tabular-nums", color: a.real <= 0 ? "var(--negative)" : "var(--text-1)" }}>{a.real}</td>
                  <td style={{ padding:"10px 12px", textAlign:"right", fontFamily:"var(--font)", fontVariantNumeric:"tabular-nums", color:"var(--text-4)" }}>{a.minimo}</td>
                  <td style={{ padding:"10px 12px" }}><Pill tone={a.status==="esgotado"?"negative":"warning"}>{a.status==="esgotado"?"Esgotado":"Baixo"}</Pill></td>
                </tr>
              ))}
              {estoqueAlertas.length === 0 && (
                <tr><td colSpan={7} style={{ padding:"16px 12px", color:"var(--text-4)", textAlign:"center" }}>Nenhuma variante esgotada ou com estoque baixo.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
