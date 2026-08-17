import React from "react";

export default function KPICard({ icon, label, value, sub, trend, accent = "#c084fc", delay = 0 }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "var(--surface-3)",
        border: "1px solid var(--surface-7)",
        borderRadius: 16,
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        cursor: "default",
        transform: hovered ? "translateY(-3px)" : "none",
        boxShadow: hovered ? `0 8px 32px rgba(192,132,252,0.12)` : "none",
        transition: "transform 0.2s, box-shadow 0.2s",
        animation: `fadeUp 0.5s ease ${delay}s both`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {trend && (
            <span style={{
              fontSize: 10, fontWeight: 700,
              color: trend.up ? "#34d399" : "#ef4444",
              display: "flex", alignItems: "center", gap: 2,
            }}>
              {trend.up ? "▲" : "▼"} {Math.abs(trend.pct)}%
            </span>
          )}
          {sub && (
            <span style={{
              fontSize: 10, color: "var(--text-4)",
              background: "var(--surface-5)",
              padding: "2px 8px", borderRadius: 20,
            }}>{sub}</span>
          )}
        </div>
      </div>
      <div style={{
        fontSize: 26, fontWeight: 800, color: accent,
        fontFamily: "'DM Mono', monospace", letterSpacing: -1,
      }}>{value}</div>
      <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 500 }}>{label}</div>
    </div>
  );
}
