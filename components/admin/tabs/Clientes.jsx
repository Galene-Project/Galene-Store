import React, { useEffect, useMemo, useState } from "react";
import KPICard from "../KPICard";
import { Card, SectionTitle, inputStyle, selectStyle } from "../shared";
import { supabase } from "../../../lib/supabaseClient";
import { fetchAll } from "../../../lib/fetchAll";
import { formatBRL } from "../../../lib/format";
import { resumoClientes, filtrarClientes, whatsappLink, clientesParaCsv, DIAS_INATIVO } from "../../../lib/clientes";

const SEGMENTOS = [
  { id: "todos", label: "Todos" },
  { id: "recorrentes", label: "Recorrentes (2+ compras)" },
  { id: "inativos", label: `Sem comprar há ${DIAS_INATIVO}+ dias` },
  { id: "sem_compra", label: "Cadastrados sem compra" },
  { id: "sem_email", label: "Sem e-mail" },
];

function baixarCsv(rows) {
  const blob = new Blob([clientesParaCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `clientes-galene-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Clientes({ data }) {
  const [customers, setCustomers] = useState(null);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [segmento, setSegmento] = useState("todos");

  useEffect(() => {
    fetchAll((a, b) => supabase
      .from("customers")
      .select("id, name, company_name, cnpj, phone, email, created_at")
      .order("id")
      .range(a, b)
    ).then(({ data: rows, error }) => {
      if (error) setErro(error.message);
      else setCustomers(rows);
    });
  }, []);

  const rows = useMemo(
    () => (customers ? resumoClientes(customers, data?.raw?.orders || []) : []),
    [customers, data]
  );
  const filtrados = useMemo(
    () => filtrarClientes(rows, { busca, segmento }).sort((a, b) => b.gasto - a.gasto || a.nome.localeCompare(b.nome, "pt-BR")),
    [rows, busca, segmento]
  );

  if (erro) return <div style={{ textAlign: "center", padding: "80px 0", color: "#f87171", fontSize: 13 }}>Erro ao carregar clientes: {erro}</div>;
  if (!customers) return <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-4)", fontSize: 13 }}>Carregando clientes...</div>;

  const recorrentes = rows.filter((r) => r.compras >= 2).length;
  const inativos = filtrarClientes(rows, { segmento: "inativos" }).length;
  const comEmail = rows.filter((r) => r.email).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="admin-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        <KPICard icon="👥" label="Clientes cadastrados" value={rows.length} accent="#c084fc" />
        <KPICard icon="🔁" label="Recorrentes" value={recorrentes} sub="2+ compras" accent="#34d399" />
        <KPICard icon="💤" label={`Sem comprar há ${DIAS_INATIVO}+ dias`} value={inativos} sub="remarketing" accent="#fb923c" />
        <KPICard icon="✉️" label="Com e-mail" value={comEmail} sub={`${rows.length ? Math.round((comEmail / rows.length) * 100) : 0}%`} accent="#38bdf8" />
      </div>

      <Card>
        <SectionTitle accent="#818cf8">Clientes</SectionTitle>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
          <input
            placeholder="Buscar por nome, telefone ou e-mail..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={{ ...inputStyle, flex: 1, minWidth: 220, maxWidth: 360 }}
          />
          <select value={segmento} onChange={(e) => setSegmento(e.target.value)} style={selectStyle}>
            {SEGMENTOS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <button
            onClick={() => baixarCsv(filtrados)}
            disabled={filtrados.length === 0}
            style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#c084fc,#818cf8)", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: filtrados.length ? 1 : 0.5 }}>
            ⬇ Exportar CSV ({filtrados.length})
          </button>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                {["Cliente", "Telefone", "E-mail", "Compras", "Total gasto", "Última compra"].map((h) => (
                  <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: "var(--text-4)", fontWeight: 600, borderBottom: "1px solid var(--surface-6)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((r) => {
                const wa = whatsappLink(r.telefone);
                return (
                  <tr key={r.id} style={{ borderBottom: "1px solid var(--surface-3)" }}>
                    <td style={{ padding: "8px 10px", color: "var(--text-2)", fontWeight: 600 }}>{r.nome}</td>
                    <td style={{ padding: "8px 10px", fontFamily: "'DM Mono',monospace" }}>
                      {wa ? <a href={wa} target="_blank" rel="noopener noreferrer" style={{ color: "#34d399", textDecoration: "none" }}>{r.telefone} ↗</a> : <span style={{ color: "var(--text-4)" }}>{r.telefone || "—"}</span>}
                    </td>
                    <td style={{ padding: "8px 10px", color: r.email ? "var(--text-3)" : "var(--text-5)" }}>{r.email || "—"}</td>
                    <td style={{ padding: "8px 10px", color: "var(--text-3)", textAlign: "center" }}>{r.compras}</td>
                    <td style={{ padding: "8px 10px", color: "#c084fc", fontWeight: 700, fontFamily: "'DM Mono',monospace" }}>{formatBRL(r.gasto)}</td>
                    <td style={{ padding: "8px 10px", color: "var(--text-3)" }}>
                      {r.ultimaCompra ? `${r.ultimaCompra.split("-").reverse().join("/")} (${r.diasSemComprar}d)` : "—"}
                    </td>
                  </tr>
                );
              })}
              {filtrados.length === 0 && (
                <tr><td colSpan={6} style={{ padding: "16px 10px", color: "var(--text-4)", textAlign: "center" }}>
                  {rows.length === 0 ? "Nenhum cliente cadastrado ainda — eles entram aqui na primeira compra." : "Nenhum cliente nesse filtro."}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
