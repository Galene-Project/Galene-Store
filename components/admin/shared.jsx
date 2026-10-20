import React from "react";

export const inputStyle = {
  padding: "9px 12px", borderRadius: 6, border: "1px solid var(--control)",
  background: "var(--surface)", color: "var(--text-1)", fontSize: 13,
  fontFamily: "'DM Sans','Segoe UI',sans-serif", lineHeight: 1.4,
  boxSizing: "border-box",
};

// <select> ignora appearance nativo do SO (Windows/Mac/Linux renderizam
// tamanho e fonte diferentes) — appearance:none + seta própria deixa
// select do mesmo tamanho/fonte que input/textarea em qualquer SO.
export const selectStyle = {
  ...inputStyle,
  appearance: "none", WebkitAppearance: "none", MozAppearance: "none",
  paddingRight: 34, cursor: "pointer",
  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2364748b'/%3E%3C/svg%3E\")",
  backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center",
};

export const labelStyle = {
  fontSize: 12, fontWeight: 500, color: "var(--text-4)", marginBottom: 6,
};

export function SectionTitle({ children }) {
  return (
    <h2 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 600, color: "var(--text-1)" }}>{children}</h2>
  );
}

export function CustomTooltip({ active, payload, label, prefix = "", suffix = "" }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--panel-solid)",
      border: "1px solid var(--border)",
      borderRadius: 6, padding: "8px 12px", fontSize: 12,
    }}>
      <div style={{ color: "var(--text-3)", marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: "var(--text-1)", fontWeight: 500 }}>
          {p.name}: {prefix}{p.value?.toLocaleString("pt-BR")}{suffix}
        </div>
      ))}
    </div>
  );
}

export function Card({ children, style = {} }) {
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 8, padding: 20,
      ...style,
    }}>
      {children}
    </div>
  );
}

// Uma matiz só: o ouro da marca no dado principal e tons neutros nos demais.
export const CORES = ["var(--accent)","var(--chart-2)","var(--chart-3)","var(--text-3)","var(--text-5)","var(--control)","var(--border)","var(--surface-8)","var(--surface-7)"];
export const CORES_TAM = ["var(--accent)","var(--chart-2)","var(--chart-3)","var(--text-3)"];

export function statusStyle(s) {
  // Fila do pedido: neutro enquanto anda, aviso quando espera alguém, verde só no fim, vermelho no cancelado.
  const pill = (t) => ({ tone: t, bg: `var(--pill-${t}-bg)`, color: `var(--pill-${t}-ink)` });
  const map = {
    'Em Análise': pill('warning'),
    Pendente: pill('warning'),
    Pago: pill('neutral'),
    Confirmado: pill('neutral'),
    Separado: pill('neutral'),
    Enviado: pill('neutral'),
    Entregue: pill('positive'),
    Cancelado: pill('negative'),
  };
  return map[s] || pill('neutral');
}

// Gráfico sem dado: texto no lugar do quadro em branco.
export function SemDados({ height = 160, texto = "Sem dados no período." }) {
  return (
    <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "var(--text-4)" }}>
      {texto}
    </div>
  );
}

// Marca de estado ao lado de um valor: tinta pálida com texto escuro da mesma família.
export function Pill({ tone = "neutral", children }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", height: 20, padding: "0 8px", borderRadius: 4,
      fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", flex: "none",
      background: `var(--pill-${tone}-bg)`, color: `var(--pill-${tone}-ink)`,
    }}>{children}</span>
  );
}

// Lista de ranking: nome, detalhe cinza, valor à direita (tabular) e uma barra fina
// proporcional — a primeira em tinta, as outras em cinza.
export function RankList({ rows, vazio = "Sem dados no período." }) {
  if (!rows.length) return <div style={{ fontSize: 13, color: "var(--text-4)" }}>{vazio}</div>;
  const max = Math.max(...rows.map((r) => r.pct ?? 0), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {rows.map((r, i) => (
        <div key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
            <span style={{ fontSize: 14, color: "var(--text-1)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</span>
            <span style={{ fontSize: 13, color: "var(--text-1)", fontFamily: "var(--font)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{r.value}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 2 }}>
            <span style={{ fontSize: 12, color: "var(--text-5)" }}>{r.detail}</span>
          </div>
          <div style={{ height: 2, background: "var(--rule)", marginTop: 6 }}>
            <div style={{ height: "100%", width: `${Math.round(((r.pct ?? 0) / max) * 100)}%`, background: i === 0 ? "var(--text-1)" : "var(--control)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// Cabeçalho de card com uma ação à direita ("Ver todos").
export function CardHead({ title, action, onAction }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14, gap: 12 }}>
      <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--text-1)" }}>{title}</h2>
      {action && <button onClick={onAction} style={{ background: "none", border: 0, padding: 0, color: "var(--text-3)", fontSize: 13, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>{action}</button>}
    </div>
  );
}
