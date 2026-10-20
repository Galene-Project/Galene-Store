import React from "react";
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell,
} from "recharts";
import KPICard from "../KPICard";
import { SectionTitle, CustomTooltip, Card, CORES_TAM, SemDados } from "../shared";

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
      <div className="admin-kpi-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:22 }}>
        <KPICard icon="📦" label="Produtos Ativos" value={kpis.totalSkus}   sub={`${totalVariantes} variantes`} accent="#c084fc"  delay={0}    />
        <KPICard icon="✅" label="Variantes Disponíveis" value={kpis.disponiveis} sub={`${totalVariantes ? Math.round(kpis.disponiveis/totalVariantes*100) : 0}%`} accent="#34d399" delay={0.05} />
        <KPICard icon="⚠️" label="Estoque Baixo"  value={kpis.estoqueBaixo} sub="atenção"     accent="#fb923c" delay={0.1}  />
        <KPICard icon="❌" label="Esgotados"       value={kpis.esgotados}   sub="repor urgente" accent="#ef4444" delay={0.15} />
      </div>

      <div className="admin-chart-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
        <Card delay={0.1}>
          <SectionTitle>Estoque por Categoria (un.)</SectionTitle>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={estoqueReal} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-4)" horizontal={false} />
              <XAxis type="number" tick={{ fill:"var(--text-4)", fontSize:10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="nome" tick={{ fill:"var(--text-3)", fontSize:10 }} axisLine={false} tickLine={false} width={130} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize:11, color:"var(--text-3)" }} />
              <Bar dataKey="estoque" name="Em Estoque" fill="#34d399" radius={[0,4,4,0]} opacity={0.85} />
              <Bar dataKey="vendido" name="Vendido"    fill="#c084fc" radius={[0,4,4,0]} opacity={0.6}  />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card delay={0.15}>
          <SectionTitle accent="#f472b6">Estoque por Tamanho (un.)</SectionTitle>
          {estoquePorTamanho.length ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={estoquePorTamanho}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-4)" />
              <XAxis dataKey="name" tick={{ fill:"var(--text-3)", fontSize:13, fontWeight:700 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:"var(--text-4)", fontSize:11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Unidades" radius={[6,6,0,0]}>
                {estoquePorTamanho.map((_, i) => <Cell key={i} fill={CORES_TAM[i % CORES_TAM.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          ) : <SemDados height={200} />}
          {insightTamanho && (
            <div style={{ marginTop:14, padding:12, background:"var(--surface-2)", borderRadius:10 }}>
              <div style={{ fontSize:11, color:"var(--text-4)" }}>💡 {insightTamanho}</div>
            </div>
          )}
        </Card>
      </div>

      <Card style={{ background:"rgba(251,146,60,0.05)", border:"1px solid rgba(251,146,60,0.2)" }} delay={0.2}>
        <SectionTitle accent="#fb923c">🚨 Produtos para Repor</SectionTitle>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead>
              <tr>
                {["SKU","Produto","Cor","Tam","Estoque Real","Mínimo","Status","Ação"].map(h=>(
                  <th key={h} style={{ padding:"10px 12px", textAlign:"left", color:"var(--text-4)", fontWeight:600, borderBottom:"1px solid var(--surface-6)", whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {estoqueAlertas.map((a, i) => (
                <tr key={i} style={{ borderBottom:"1px solid var(--surface-3)" }}>
                  <td style={{ padding:"10px 12px", color:"var(--text-4)", fontFamily:"'DM Mono',monospace", fontSize:11 }}>{a.sku}</td>
                  <td style={{ padding:"10px 12px", color:"var(--text-2)", fontWeight:600 }}>{a.produto}</td>
                  <td style={{ padding:"10px 12px", color:"var(--text-3)" }}>{a.cor}</td>
                  <td style={{ padding:"10px 12px", color:"var(--text-3)" }}>{a.tam}</td>
                  <td style={{ padding:"10px 12px" }}>
                    <span style={{ fontSize:20, fontWeight:800, color:a.status==="esgotado"?"#ef4444":"#fb923c", fontFamily:"'DM Mono',monospace" }}>{a.real}</span>
                  </td>
                  <td style={{ padding:"10px 12px", color:"var(--text-4)" }}>{a.minimo}</td>
                  <td style={{ padding:"10px 12px" }}>
                    <span style={{ padding:"3px 8px", borderRadius:6, fontSize:10, fontWeight:700,
                      background:a.status==="esgotado"?"#fee2e2":"#ffedd5",
                      color:a.status==="esgotado"?"#991b1b":"#9a3412" }}>
                      {a.status==="esgotado"?"❌ ESGOTADO":"⚠️ BAIXO"}
                    </span>
                  </td>
                  <td style={{ padding:"10px 12px" }}>
                    <span style={{ padding:"4px 12px", borderRadius:6, fontSize:10, fontWeight:700,
                      background:"linear-gradient(135deg,#c084fc,#818cf8)", color:"white", cursor:"pointer" }}>
                      Repor →
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
