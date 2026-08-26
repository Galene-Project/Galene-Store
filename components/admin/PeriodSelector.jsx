import React, { useState, useEffect } from "react";
import { presetParaIntervalo } from "../../lib/dashboardMetrics";
import { inputStyle } from "./shared";

const PRESETS = [
  { id: "7d", label: "7 dias" },
  { id: "30d", label: "30 dias" },
  { id: "6m", label: "6 meses" },
  { id: "12m", label: "12 meses" },
];

const buttonStyle = (ativo) => ({
  padding: "6px 14px", borderRadius: 8, border: "1px solid var(--surface-7)",
  background: ativo ? "linear-gradient(135deg,#c084fc,#818cf8)" : "var(--surface-3)",
  color: ativo ? "white" : "var(--text-3)", fontSize: 12, fontWeight: 600, cursor: "pointer",
});

export default function PeriodSelector({ value, onChange }) {
  const [customOpen, setCustomOpen] = useState(value.preset === "custom");

  useEffect(() => {
    setCustomOpen(value.preset === "custom");
  }, [value.preset]);

  function escolherPreset(preset) {
    setCustomOpen(false);
    onChange({ preset, ...presetParaIntervalo(preset) });
  }

  function abrirCustom() {
    setCustomOpen(true);
    onChange({ preset: "custom", startDate: value.startDate, endDate: value.endDate });
  }

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
      {PRESETS.map((p) => (
        <button key={p.id} onClick={() => escolherPreset(p.id)} style={buttonStyle(value.preset === p.id)}>
          {p.label}
        </button>
      ))}
      <button onClick={abrirCustom} style={buttonStyle(value.preset === "custom")}>
        Personalizado
      </button>
      {customOpen && (
        <>
          <input
            type="date"
            value={value.startDate}
            onChange={(e) => onChange({ preset: "custom", startDate: e.target.value, endDate: value.endDate })}
            style={inputStyle}
          />
          <input
            type="date"
            value={value.endDate}
            onChange={(e) => onChange({ preset: "custom", startDate: value.startDate, endDate: e.target.value })}
            style={inputStyle}
          />
        </>
      )}
    </div>
  );
}
