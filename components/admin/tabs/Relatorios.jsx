import React, { useMemo, useState } from "react";
import { productReport } from "../../../lib/reportMetrics";
import { SectionTitle, Card } from "../shared";

const selectStyle = {
  padding: "8px 12px", borderRadius: 8, border: "1px solid var(--surface-7)",
  background: "var(--surface-3)", color: "var(--text-2)", fontSize: 12,
};

function toISODate(d) { return d.toISOString().slice(0, 10); }

function presetRange(preset) {
  const today = new Date();
  if (preset === "7d") {
    const start = new Date(today); start.setDate(start.getDate() - 7);
    return { startDate: toISODate(start), endDate: toISODate(today) };
  }
  if (preset === "30d") {
    const start = new Date(today); start.setDate(start.getDate() - 30);
    return { startDate: toISODate(start), endDate: toISODate(today) };
  }
  if (preset === "mes") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { startDate: toISODate(start), endDate: toISODate(today) };
  }
  return { startDate: null, endDate: null }; // "todo"
}

export default function Relatorios({ data }) {
  const { items = [], orders = [] } = data || {};
  const [productName, setProductName] = useState("");
  const [preset, setPreset] = useState("todo");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const produtos = useMemo(() => {
    const set = new Set();
    items.forEach((i) => { if (i.products?.name) set.add(i.products.name); });
    return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [items]);

  const { startDate, endDate } = preset === "custom"
    ? { startDate: customStart || null, endDate: customEnd || null }
    : presetRange(preset);

  const report = useMemo(
    () => productReport(items, orders, { productName, startDate, endDate }),
    [items, orders, productName, startDate, endDate]
  );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle>Relatório por Produto</SectionTitle>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <select value={productName} onChange={(e) => setProductName(e.target.value)} style={{ ...selectStyle, minWidth: 220 }}>
            <option value="">Selecione um produto</option>
            {produtos.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>

          <select value={preset} onChange={(e) => setPreset(e.target.value)} style={selectStyle}>
            <option value="todo">Todo período</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="mes">Mês atual</option>
            <option value="custom">Intervalo customizado</option>
          </select>

          {preset === "custom" && (
            <>
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} style={selectStyle} />
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} style={selectStyle} />
            </>
          )}
        </div>
      </Card>

      {!productName && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-4)", fontSize: 12 }}>
          Selecione um produto pra ver o relatório.
        </div>
      )}

      {productName && (
        <>
          <div className="admin-chart-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <Card>
              <div style={{ fontSize: 11, color: "var(--text-4)", marginBottom: 6 }}>Peças vendidas</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text-1)" }}>{report.totalPecas}</div>
            </Card>
            <Card>
              <div style={{ fontSize: 11, color: "var(--text-4)", marginBottom: 6 }}>Receita</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text-1)" }}>
                R${report.totalReceita.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
            </Card>
          </div>

          <Card>
            <SectionTitle accent="#38bdf8">Detalhamento por cor/tamanho</SectionTitle>
            {report.breakdown.length === 0 ? (
              <div style={{ fontSize: 12, color: "var(--text-4)", padding: "12px 0" }}>
                Nenhuma venda desse produto no período selecionado.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ textAlign: "left", color: "var(--text-4)" }}>
                      <th style={{ padding: "8px 10px" }}>Cor</th>
                      <th style={{ padding: "8px 10px" }}>Tamanho</th>
                      <th style={{ padding: "8px 10px" }}>Peças</th>
                      <th style={{ padding: "8px 10px" }}>Receita</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.breakdown.map((row, i) => (
                      <tr key={i} style={{ borderTop: "1px solid var(--surface-5)" }}>
                        <td style={{ padding: "8px 10px", color: "var(--text-2)" }}>{row.cor}</td>
                        <td style={{ padding: "8px 10px", color: "var(--text-2)" }}>{row.tamanho}</td>
                        <td style={{ padding: "8px 10px", color: "var(--text-2)" }}>{row.pecas}</td>
                        <td style={{ padding: "8px 10px", color: "var(--text-2)" }}>
                          R${row.receita.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
