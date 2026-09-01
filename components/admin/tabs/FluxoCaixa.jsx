import React, { useMemo, useState } from "react";
import PeriodSelector from "../PeriodSelector";
import KPICard from "../KPICard";
import { SectionTitle, Card } from "../shared";
import { presetParaIntervalo } from "../../../lib/dashboardMetrics";
import { fluxoCaixa } from "../../../lib/cashFlow";

function formatBRL(v) {
  const n = Number(v);
  const sign = n < 0 ? "-" : "";
  return `${sign}R$${Math.abs(n).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

export default function FluxoCaixa({ data }) {
  const [periodo, setPeriodo] = useState({ preset: "30d", ...presetParaIntervalo("30d") });

  const raw = data?.raw;

  const resumo = useMemo(() => {
    if (!raw) return null;
    return fluxoCaixa(raw.orders, raw.expenses, raw.productionRuns || [], periodo);
  }, [raw, periodo]);

  if (!raw || !resumo) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-4)", fontSize: 13 }}>
        Carregando Fluxo de Caixa...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PeriodSelector value={periodo} onChange={setPeriodo} />

      <div className="admin-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        <KPICard icon="⬆️" label="Entrada" value={formatBRL(resumo.totalEntrada)} sub="período" accent="#34d399" />
        <KPICard icon="⬇️" label="Saída" value={formatBRL(resumo.totalSaida)} sub="período" accent="#ef4444" />
        <KPICard
          icon="💵" label="Saldo" value={formatBRL(resumo.saldo)} sub="período"
          accent={resumo.saldo >= 0 ? "#34d399" : "#ef4444"}
        />
      </div>

      <Card>
        <SectionTitle accent="#f472b6">Saída por categoria</SectionTitle>
        {resumo.saidaPorCategoria.length === 0 ? (
          <div style={{ fontSize: 12, color: "var(--text-4)" }}>Nenhuma saída no período.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {resumo.saidaPorCategoria.map((c, i) => {
              const pct = resumo.saidaPorCategoria[0].valor ? Math.round((c.valor / resumo.saidaPorCategoria[0].valor) * 100) : 0;
              return (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500 }}>{c.categoria}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#f472b6", fontFamily: "'DM Mono',monospace" }}>{formatBRL(c.valor)}</span>
                  </div>
                  <div style={{ height: 4, background: "var(--surface-5)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: "#f472b6", borderRadius: 2 }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle>Movimentos</SectionTitle>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                {["Data", "Tipo", "Categoria", "Descrição", "Valor"].map((h) => (
                  <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: "var(--text-4)", fontWeight: 600, borderBottom: "1px solid var(--surface-6)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resumo.movimentos.map((m, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--surface-3)" }}>
                  <td style={{ padding: "8px 10px", color: "var(--text-3)" }}>{m.data.split('-').reverse().join('/')}</td>
                  <td style={{ padding: "8px 10px" }}>
                    <span style={{
                      padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                      background: m.tipo === "entrada" ? "#d1fae5" : "#fee2e2",
                      color: m.tipo === "entrada" ? "#065f46" : "#991b1b",
                    }}>{m.tipo === "entrada" ? "ENTRADA" : "SAÍDA"}</span>
                  </td>
                  <td style={{ padding: "8px 10px", color: "var(--text-2)", fontWeight: 600 }}>{m.categoria}</td>
                  <td style={{ padding: "8px 10px", color: "var(--text-3)" }}>{m.descricao}</td>
                  <td style={{
                    padding: "8px 10px", fontWeight: 700, fontFamily: "'DM Mono',monospace",
                    color: m.tipo === "entrada" ? "#34d399" : "#ef4444",
                  }}>{m.tipo === "entrada" ? "+" : "-"}{formatBRL(m.valor)}</td>
                </tr>
              ))}
              {resumo.movimentos.length === 0 && (
                <tr><td colSpan={5} style={{ padding: "16px 10px", color: "var(--text-4)", textAlign: "center" }}>Nenhum movimento no período.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
