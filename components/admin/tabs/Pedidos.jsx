import React, { useState, useEffect } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import KPICard from "../KPICard";
import { SectionTitle, CustomTooltip, Card, statusStyle } from "../shared";
import { STATUS_LABEL } from "../../../lib/adminData";
import { VALID_STATUSES } from "../../../lib/orderStatus";
import { getSession } from "../../../lib/adminAuth";

export default function Pedidos({ data, onRefresh, justUpdated }) {
  const { faturamentoMensal, ultimosPedidos, kpis } = data;
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
  const statusCores = ["#34d399","#38bdf8","#ef4444"];
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
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14, gap:12, flexWrap:"wrap" }}>
        {showBanner ? (
          <div style={{
            padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:600,
            background:"rgba(52,211,153,0.12)", color:"#34d399", border:"1px solid rgba(52,211,153,0.3)",
          }}>
            🔔 Pedido atualizado
          </div>
        ) : <div />}
        <button
          onClick={onRefresh}
          style={{
            padding:"7px 14px", borderRadius:8, border:"1px solid var(--surface-7)",
            background:"var(--surface-3)", color:"var(--text-3)", fontSize:12, fontWeight:600, cursor:"pointer",
          }}>
          🔄 Atualizar
        </button>
      </div>

      {errorMsg && (
        <div style={{
          marginBottom:14, padding:"10px 14px", borderRadius:10,
          background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)",
          color:"#fca5a5", fontSize:12,
        }}>
          ⚠️ {errorMsg}
        </div>
      )}

      <div className="admin-kpi-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:22 }}>
        <KPICard icon="🛒" label="Pedidos (6 meses)"  value={kpis.pedidosMes}   accent="#c084fc" delay={0}    />
        <KPICard icon="✅" label="Entregues"           value={kpis.entregues}    sub={pct(kpis.entregues)}        accent="#34d399" delay={0.05} />
        <KPICard icon="🚚" label="Em Andamento"        value={kpis.emAndamento}  sub="este mês"   accent="#38bdf8" delay={0.1}  />
        <KPICard icon="❌" label="Cancelados"          value={kpis.cancelados}   sub={pct(kpis.cancelados)}       accent="#ef4444" delay={0.15} />
      </div>

      <Card delay={0.1} style={{ marginBottom:16 }}>
        <SectionTitle>Últimos Pedidos</SectionTitle>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead>
              <tr>
                {["Nº Pedido","Data","Cliente","Produto","Cor","Tam","Qtd","Total","Status"].map(h=>(
                  <th key={h} style={{ padding:"10px 14px", textAlign:"left", color:"var(--text-4)", fontWeight:600, borderBottom:"1px solid var(--surface-6)", whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ultimosPedidos.map((p) => {
                const st = statusStyle(p.status);
                const isExpanded = expandedId === p.id;
                return (
                  <React.Fragment key={p.id}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : p.id)}
                      style={{ borderBottom:"1px solid var(--surface-3)", transition:"background 0.15s", cursor:"pointer" }}
                      onMouseEnter={e=>e.currentTarget.style.background="var(--surface-2)"}
                      onMouseLeave={e=>e.currentTarget.style.background=""}>
                      <td style={{ padding:"11px 14px", fontFamily:"'DM Mono',monospace", fontSize:11, color:"#c084fc", fontWeight:600 }}>{p.num}</td>
                      <td style={{ padding:"11px 14px", color:"var(--text-4)" }}>{p.data}</td>
                      <td style={{ padding:"11px 14px", color:"var(--text-2)", fontWeight:600 }}>{p.cliente}</td>
                      <td style={{ padding:"11px 14px", color:"var(--text-3)" }}>{p.produto}</td>
                      <td style={{ padding:"11px 14px", color:"var(--text-4)" }}>{p.cor}</td>
                      <td style={{ padding:"11px 14px", color:"var(--text-4)" }}>{p.tam}</td>
                      <td style={{ padding:"11px 14px", color:"var(--text-3)", textAlign:"center" }}>{p.qtd}</td>
                      <td style={{ padding:"11px 14px", fontWeight:700, color:"#c084fc", fontFamily:"'DM Mono',monospace" }}>R${p.total}</td>
                      <td style={{ padding:"11px 14px" }}>
                        <span style={{ padding:"3px 10px", borderRadius:20, fontSize:10, fontWeight:700, background:st.bg, color:st.color }}>{p.status}</span>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={9} style={{ padding:"14px 14px 18px", background:"var(--surface-1)" }}>
                          <div style={{ marginBottom:12 }}>
                            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
                              <thead>
                                <tr>
                                  {["Produto","Cor","Tam","Qtd","Preço Unit."].map(h=>(
                                    <th key={h} style={{ padding:"6px 10px", textAlign:"left", color:"var(--text-4)", fontWeight:600 }}>{h}</th>
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
                                    <td style={{ padding:"6px 10px", color:"var(--text-3)", fontFamily:"'DM Mono',monospace" }}>R${it.precoUnit.toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {approvedLinks[p.id] ? (
                            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                              <label style={{ fontSize:11, color:"var(--text-4)", fontWeight:600 }}>Link de pagamento:</label>
                              <input
                                readOnly
                                value={approvedLinks[p.id]}
                                onClick={(e) => { e.stopPropagation(); e.target.select(); }}
                                style={{
                                  flex:1, maxWidth:360, padding:"6px 10px", borderRadius:8, fontSize:11,
                                  background:"var(--surface-3)", color:"var(--text-2)",
                                  border:"1px solid var(--surface-7)", fontFamily:"'DM Mono',monospace",
                                }}
                              />
                              <button
                                onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(approvedLinks[p.id]); }}
                                style={{
                                  padding:"6px 12px", borderRadius:8, border:"1px solid var(--surface-7)",
                                  background:"var(--surface-3)", color:"var(--text-3)", fontSize:11, fontWeight:600, cursor:"pointer",
                                }}>
                                Copiar
                              </button>
                            </div>
                          ) : p.statusRaw === "aguardando_aprovacao" ? (
                            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleApprove(p.id); }}
                                disabled={approvingId === p.id}
                                style={{
                                  padding:"7px 16px", borderRadius:8, border:"none",
                                  cursor: approvingId === p.id ? "wait" : "pointer",
                                  background:"linear-gradient(135deg,#34d399,#059669)", color:"white", fontSize:12, fontWeight:700,
                                }}>
                                {approvingId === p.id ? "Aprovando..." : "✅ Aprovar"}
                              </button>
                            </div>
                          ) : (
                            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                              <label style={{ fontSize:11, color:"var(--text-4)", fontWeight:600 }}>Status:</label>
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
                              {updatingId === p.id && <span style={{ fontSize:11, color:"var(--text-4)" }}>Salvando...</span>}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="admin-chart-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <Card delay={0.2}>
          <SectionTitle accent="#34d399">Pedidos por Mês</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={faturamentoMensal}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-4)" />
              <XAxis dataKey="mes" tick={{ fill:"var(--text-4)", fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:"var(--text-4)", fontSize:11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="pedidos" name="Pedidos" fill="#34d399" radius={[6,6,0,0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card delay={0.25}>
          <SectionTitle accent="#818cf8">Status dos Pedidos (6 meses)</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusPie} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                {statusPie.map((_, i) => <Cell key={i} fill={statusCores[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background:"var(--panel-solid)", border:"1px solid rgba(192,132,252,0.3)", borderRadius:8, fontSize:11 }} />
              <Legend wrapperStyle={{ fontSize:11, color:"var(--text-3)" }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </>
  );
}
