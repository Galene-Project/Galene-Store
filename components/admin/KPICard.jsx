import React from "react";

// Célula de um indicador: rótulo, valor, uma linha de contexto. Sem ícone,
// sem tile e sem animação — o container (.admin-kpi-grid) divide as células
// com linhas finas. A cor do valor só muda quando o número é ruim; o resto é
// tinta (a cor vai nos gráficos, não nos números).
const NEGATIVOS = new Set(["#ef4444", "#f87171", "var(--negative)"]);

export default function KPICard({ label, value, sub, trend, accent }) {
  const zero = Number(String(value).replace(/[^0-9,.-]/g, "").replace(",", ".")) === 0;
  const ruim = NEGATIVOS.has(accent) && !zero; // zero é zero, não alerta
  return (
    <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
      <div style={{ fontSize: 13, color: "var(--text-4)" }}>{label}</div>
      <div style={{
        fontSize: String(value).length > 9 ? 22 : 26, fontWeight: 500, lineHeight: 1.15,
        color: ruim ? "var(--negative)" : "var(--text-1)",
        fontFamily: "var(--font)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap",
      }}>{value}</div>
      {(sub || trend) && (
        <div style={{ fontSize: 12, color: "var(--text-5)", display: "flex", gap: 8, flexWrap: "wrap" }}>
          {trend && (
            <span style={{ color: trend.up ? "var(--text-4)" : "var(--negative)" }}>
              {trend.up ? "▲" : "▼"} {Math.abs(trend.pct)}% vs mês anterior
            </span>
          )}
          {sub && <span>{sub}</span>}
        </div>
      )}
    </div>
  );
}
