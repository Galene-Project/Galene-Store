import React from "react";

export function SectionTitle({ children, accent = "#c084fc" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <div style={{ width: 3, height: 18, borderRadius: 2, background: accent }} />
      <span style={{
        fontSize: 12, fontWeight: 700, color: "var(--text-2)",
        letterSpacing: "0.06em", textTransform: "uppercase",
      }}>{children}</span>
    </div>
  );
}

export function CustomTooltip({ active, payload, label, prefix = "", suffix = "" }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--panel-solid)",
      border: "1px solid rgba(192,132,252,0.3)",
      borderRadius: 10, padding: "10px 14px", fontSize: 12,
    }}>
      <div style={{ color: "var(--text-3)", marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || "#c084fc", fontWeight: 700 }}>
          {p.name}: {prefix}{p.value?.toLocaleString("pt-BR")}{suffix}
        </div>
      ))}
    </div>
  );
}

export function Card({ children, style = {}, delay = 0 }) {
  return (
    <div style={{
      background: "var(--surface-2)",
      border: "1px solid var(--surface-6)",
      borderRadius: 16, padding: 24,
      animation: `fadeUp 0.5s ease ${delay}s both`,
      ...style,
    }}>
      {children}
    </div>
  );
}

export const CORES = ["#c084fc","#818cf8","#38bdf8","#34d399","#fb923c","#f472b6","#a78bfa","#60a5fa","#4ade80"];
export const CORES_TAM = ["#c084fc","#818cf8","#38bdf8","#34d399"];

export function statusStyle(s) {
  const map = {
    Entregue:   { bg: "#d1fae5", color: "#065f46" },
    Enviado:    { bg: "#dbeafe", color: "#1e40af" },
    Separado:   { bg: "#fef9c3", color: "#854d0e" },
    Confirmado: { bg: "#f3e8ff", color: "#6b21a8" },
    Pendente:   { bg: "#ffedd5", color: "#9a3412" },
    Cancelado:  { bg: "#fee2e2", color: "#991b1b" },
  };
  return map[s] || { bg: "#f3f4f6", color: "#374151" };
}
