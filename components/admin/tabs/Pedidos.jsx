import React, { useState, useEffect } from "react";
import {
  PieChart, Pie, Cell, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import KPICard from "../KPICard";
import { SectionTitle, Card, Pill, statusStyle, SemDados } from "../shared";
import { formatBRL } from "../../../lib/format";
import { STATUS_LABEL } from "../../../lib/adminData";
import { VALID_STATUSES } from "../../../lib/orderStatus";
import { getSession } from "../../../lib/adminAuth";

const CONFIRMADOS_STATUSES = new Set(['confirmado', 'separado', 'enviado', 'entregue']);

function TabelaPedidos({
  titulo, accent, pedidos, vazio,
  expandedId, setExpandedId, updatingId, handleStatusChange,
  approvingId, handleApprove, approvedLinks,
}) {
  return (
    <Card delay={0.1} style={{ marginBottom:16 }}>
      <SectionTitle accent={accent}>{titulo}</SectionTitle>
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:14 }}>
          <thead>
            <tr>
              {["Nº Pedido","Data","Cliente","Produto","Cor","Tam","Qtd","Total","Status"].map(h=>(
                <th key={h} style={{ padding:"8px 14px", textAlign:(h==="Qtd"||h==="Total")?"right":"left", color:"var(--text-4)", fontWeight:400, fontSize:12, borderBottom:"1px solid var(--border)", whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pedidos.map((p) => {
              const st = statusStyle(p.status);
              const isExpanded = expandedId === p.id;
              return (
                <React.Fragment key={p.id}>
                  <tr
                    onClick={() => setExpandedId(isExpanded ? null : p.id)}
                    style={{ borderBottom:"1px solid var(--rule)", cursor:"pointer" }}
                    onMouseEnter={e=>e.currentTarget.style.background="var(--surface-2)"}
                    onMouseLeave={e=>e.currentTarget.style.background=""}>
                    <td style={{ padding:"11px 14px", fontFamily:"var(--mono)", fontSize: 12, color:"var(--text-3)" }}>{p.num}</td>
                    <td style={{ padding:"11px 14px", color:"var(--text-4)" }}>{p.data}</td>
                    <td style={{ padding:"11px 14px", color:"var(--text-1)" }}>{p.cliente}</td>
                    <td style={{ padding:"11px 14px", color:"var(--text-3)" }}>{p.produto}</td>
                    <td style={{ padding:"11px 14px", color:"var(--text-4)" }}>{p.cor}</td>
                    <td style={{ padding:"11px 14px", color:"var(--text-4)" }}>{p.tam}</td>
                    <td style={{ padding:"11px 14px", color:"var(--text-3)", textAlign:"right" }}>{p.qtd}</td>
                    <td style={{ padding:"11px 14px", fontWeight: 500, color:"var(--text-1)", textAlign:"right" }}>{formatBRL(p.total)}</td>
                    <td style={{ padding:"11px 14px" }}>
                      <Pill tone={st.tone}>{p.status}</Pill>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={9} style={{ padding:"14px 14px 18px", background:"var(--surface-1)" }}>
                        <div style={{ marginBottom:12 }}>
                          <table style={{ width:"100%", borderCollapse:"collapse", fontSize: 12 }}>
                            <thead>
                              <tr>
                                {["Produto","Cor","Tam","Qtd","Preço Unit."].map(h=>(
                                  <th key={h} style={{ padding:"6px 10px", textAlign:"left", color:"var(--text-4)", fontWeight:400 }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {p.itens.map((it, idx) => (
                                <tr key={idx}>
                                  <td style={{ padding:"6px 10px", color:"var(--text-2)" }}>{it.produto}</td>
                                  <td style={{ padding:"6px 10px", color:"var(--text-4)" }}>{it.cor}</td>
                                  <td style={{ padding:"6px 10px", color:"var(--text-4)" }}>{it.tam}</td>
                                  <td style={{ padding:"6px 10px", color:"var(--text-3)" }}>{it.quantidade}</td>
                                  <td style={{ padding:"6px 10px", color:"var(--text-3)", fontFamily:"var(--font)" }}>R${it.precoUnit.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {approvedLinks[p.id] ? (
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <label style={{ fontSize: 12, color:"var(--text-4)", fontWeight:400 }}>Link de pagamento:</label>
                            <input
                              readOnly
                              value={approvedLinks[p.id]}
                              onClick={(e) => { e.stopPropagation(); e.target.select(); }}
                              style={{
                                flex:1, maxWidth:360, padding:"6px 10px", borderRadius:8, fontSize: 12,
                                background:"var(--surface-3)", color:"var(--text-2)",
                                border:"1px solid var(--surface-7)", fontFamily:"var(--font)",
                              }}
                            />
                            <button
                              onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(approvedLinks[p.id]); }}
                              style={{
                                padding:"6px 12px", borderRadius:8, border:"1px solid var(--surface-7)",
                                background:"var(--surface-3)", color:"var(--text-3)", fontSize: 12, fontWeight:600, cursor:"pointer",
                              }}>
                              Copiar
                            </button>
                          </div>
                        ) : p.statusRaw === "aguardando_aprovacao" ? (
                          <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleApprove(p.id); }}
                              disabled={approvingId === p.id}
                              style={{
                                padding:"7px 16px", borderRadius:8, border:"none",
                                cursor: approvingId === p.id ? "wait" : "pointer",
                                background:"var(--primary)", color: "var(--primary-ink)", fontSize:12, fontWeight: 600,
                              }}>
                              {approvingId === p.id ? "Aprovando..." : "Aprovar"}
                            </button>
                            <label style={{ fontSize: 12, color:"var(--text-4)", fontWeight:400 }}>Status:</label>
                            <select
                              value={p.statusRaw}
                              disabled={updatingId === p.id}
                              onChange={(e) => handleStatusChange(p.id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                padding:"6px 10px", borderRadius:8, fontSize:12,
                                background:"var(--surface-3)", color:"var(--text-2)",
                                border:"1px solid var(--surface-7)",
                              }}>
                              {VALID_STATUSES.map((s) => (
                                <option key={s} value={s}>{STATUS_LABEL[s] || s}</option>
                              ))}
                            </select>
                            {updatingId === p.id && <span style={{ fontSize: 12, color:"var(--text-4)" }}>Salvando...</span>}
                          </div>
                        ) : (
                          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <label style={{ fontSize: 12, color:"var(--text-4)", fontWeight:400 }}>Status:</label>
                            <select
                              value={p.statusRaw}
                              disabled={updatingId === p.id}
                              onChange={(e) => handleStatusChange(p.id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                padding:"6px 10px", borderRadius:8, fontSize:12,
                                background:"var(--surface-3)", color:"var(--text-2)",
                                border:"1px solid var(--surface-7)",
                              }}>
                              {VALID_STATUSES.map((s) => (
                                <option key={s} value={s}>{STATUS_LABEL[s] || s}</option>
                              ))}
                            </select>
                            {updatingId === p.id && <span style={{ fontSize: 12, color:"var(--text-4)" }}>Salvando...</span>}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {pedidos.length === 0 && (
              <tr><td colSpan={9} style={{ padding:"16px 14px", color:"var(--text-4)", textAlign:"center" }}>{vazio}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default function Pedidos({ data, onRefresh, justUpdated }) {
  const { ultimosPedidos, kpis } = data;
  const [expandedId, setExpandedId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showBanner, setShowBanner] = useState(false);
  const [approvingId, setApprovingId] = useState(null);
  const [approvedLinks, setApprovedLinks] = useState({});

  useEffect(() => {
    if (!justUpdated) return;
    setShowBanner(true);
    const t = setTimeout(() => setShowBanner(false), 4000);
    return () => clearTimeout(t);
  }, [justUpdated]);

  const statusPie = [
    { name:"Entregue",     value: kpis.entregues    },
    { name:"Em andamento", value: kpis.emAndamento  },
    { name:"Cancelado",    value: kpis.cancelados   },
  ];
  const statusCores = ["var(--positive)","var(--chart-2)","var(--negative)"];
  const totalStatus = kpis.entregues + kpis.emAndamento + kpis.cancelados;
  const pct = (n) => totalStatus ? `${Math.round((n / totalStatus) * 100)}%` : "—";

  async function handleStatusChange(orderId, novoStatus) {
    setUpdatingId(orderId);
    setErrorMsg("");
    try {
      const session = await getSession();
      const res = await fetch("/api/admin/pedidos/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ orderId, novoStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message || "Falha ao atualizar status.");
      onRefresh();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleApprove(orderId) {
    setApprovingId(orderId);
    setErrorMsg("");
    try {
      const session = await getSession();
      const res = await fetch("/api/admin/pedidos/aprovar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ orderId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message || "Falha ao aprovar pedido.");
      setApprovedLinks((prev) => ({ ...prev, [orderId]: json.checkout_url }));
      onRefresh();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setApprovingId(null);
    }
  }

  return (
    <>
      {showBanner && (
        <div style={{ marginBottom:14 }}><Pill tone="positive">Pedido atualizado</Pill></div>
      )}

      {errorMsg && (
        <div style={{ marginBottom:14, padding:"10px 14px", borderRadius:6, background:"var(--pill-negative-bg)", color:"var(--pill-negative-ink)", fontSize:13 }}>
          {errorMsg}
        </div>
      )}

      <div className="admin-kpi-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)" }}>
        <KPICard icon="" label="Pedidos (6 meses)"  value={kpis.pedidosMes}   accent="var(--accent)" delay={0}    />
        <KPICard icon="" label="Entregues"           value={kpis.entregues}    sub={pct(kpis.entregues)}        accent="var(--positive)" delay={0.05} />
        <KPICard icon="" label="Em Andamento"        value={kpis.emAndamento}  sub="este mês"   accent="var(--chart-2)" delay={0.1}  />
        <KPICard icon="" label="Cancelados"          value={kpis.cancelados}   sub={pct(kpis.cancelados)}       accent="var(--negative)" delay={0.15} />
      </div>

      <TabelaPedidos
        titulo="Últimos Pedidos" vazio="Nenhum pedido ainda."
        pedidos={ultimosPedidos.filter((p) => !CONFIRMADOS_STATUSES.has(p.statusRaw))}
        expandedId={expandedId} setExpandedId={setExpandedId}
        updatingId={updatingId} handleStatusChange={handleStatusChange}
        approvingId={approvingId} handleApprove={handleApprove} approvedLinks={approvedLinks}
      />

      <TabelaPedidos
        titulo="Confirmados — prontos pra separação" accent="var(--positive)" vazio="Nenhum pedido confirmado ainda."
        pedidos={ultimosPedidos.filter((p) => CONFIRMADOS_STATUSES.has(p.statusRaw))}
        expandedId={expandedId} setExpandedId={setExpandedId}
        updatingId={updatingId} handleStatusChange={handleStatusChange}
        approvingId={approvingId} handleApprove={handleApprove} approvedLinks={approvedLinks}
      />

      <div style={{ maxWidth:560 }}>
        <Card delay={0.25}>
          <SectionTitle>Status dos Pedidos (6 meses)</SectionTitle>
          {totalStatus ? (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusPie} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                {statusPie.map((_, i) => <Cell key={i} fill={statusCores[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background:"var(--panel-solid)", border:"1px solid var(--accent-tint)", borderRadius:8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12, color:"var(--text-3)" }} />
            </PieChart>
          </ResponsiveContainer>
          ) : <SemDados height={200} />}
        </Card>
      </div>
    </>
  );
}
