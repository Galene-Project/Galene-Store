'use client';
import { useState, useEffect, useCallback } from "react";
import Overview     from "../../components/admin/tabs/Overview";
import Vendas       from "../../components/admin/tabs/Vendas";
import Estoque      from "../../components/admin/tabs/Estoque";
import Pedidos      from "../../components/admin/tabs/Pedidos";
import LoginPage    from "../../components/admin/LoginPage";
import SettingsPage from "../../components/admin/SettingsPage";
import { fetchDashboardData } from "../../lib/adminData";
import { getSession, logout } from "../../lib/adminAuth";
import { supabase } from "../../lib/supabaseClient";

const TABS = [
  { id:"overview",  label:"Visão Geral",  icon:"📊" },
  { id:"vendas",    label:"Vendas",       icon:"💰" },
  { id:"estoque",   label:"Estoque",      icon:"📦" },
  { id:"pedidos",   label:"Pedidos",      icon:"🛒" },
  { id:"settings",  label:"Integrações",  icon:"⚙️" },
];

export default function AdminPage() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [session,     setSession]     = useState(null);
  const [activeTab,   setActiveTab]   = useState("overview");
  const [data,        setData]        = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [showLogout,  setShowLogout]  = useState(false);
  const [theme,       setTheme]       = useState("dark");
  const [justUpdated, setJustUpdated] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("galene-admin-theme");
    if (saved) setTheme(saved);
  }, []);

  function toggleTheme() {
    setTheme(t => {
      const next = t === "dark" ? "light" : "dark";
      localStorage.setItem("galene-admin-theme", next);
      return next;
    });
  }

  useEffect(() => {
    getSession().then(s => { setSession(s); setCheckingSession(false); });
  }, []);

  const loadData = useCallback(() => {
    setLoadingData(true);
    fetchDashboardData()
      .then(setData)
      .catch((err) => console.error("Erro ao buscar dados do painel:", err))
      .finally(() => setLoadingData(false));
  }, []);

  useEffect(() => {
    if (!session) return;
    loadData();
  }, [session, loadData]);

  useEffect(() => {
    if (!session) return;
    const channel = supabase
      .channel('orders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadData();
        setJustUpdated(Date.now());
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session, loadData]);

  async function handleLogout() {
    await logout();
    setSession(null);
  }

  if (checkingSession) return null;
  if (!session) return <LoginPage onLogin={() => getSession().then(setSession)} />;

  return (
    <div className="admin-root" data-theme={theme} style={{
      minHeight:"100vh",
      background:"var(--bg-grad)",
      fontFamily:"'DM Sans','Segoe UI',sans-serif",
      color:"var(--text-1)",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;600&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing:border-box; }
        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-thumb { background:rgba(192,132,252,0.3); border-radius:3px; }

        @media (max-width: 720px) {
          .admin-header { padding:12px 16px !important; }
          .admin-content { padding:18px 16px !important; }
          .admin-kpi-grid { grid-template-columns: repeat(auto-fit, minmax(130px,1fr)) !important; }
          .admin-chart-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .admin-status-text { display:none !important; }
        }

        .admin-root[data-theme="dark"] {
          --bg-grad: linear-gradient(135deg,#0f0c1a 0%,#130f23 50%,#0a0f1a 100%);
          --text-1:#f1f5f9; --text-2:#e2e8f0; --text-3:#94a3b8; --text-4:#64748b; --text-5:#475569;
          --panel-solid:#1e1b2e;
          --surface-1:rgba(255,255,255,0.02); --surface-2:rgba(255,255,255,0.03);
          --surface-3:rgba(255,255,255,0.04); --surface-4:rgba(255,255,255,0.05);
          --surface-5:rgba(255,255,255,0.06); --surface-6:rgba(255,255,255,0.07);
          --surface-7:rgba(255,255,255,0.08); --surface-8:rgba(255,255,255,0.1);
        }
        .admin-root[data-theme="light"] {
          --bg-grad: linear-gradient(135deg,#f8f7fc 0%,#f3f0fa 50%,#eef2fb 100%);
          --text-1:#0f172a; --text-2:#1e293b; --text-3:#475569; --text-4:#64748b; --text-5:#94a3b8;
          --panel-solid:#ffffff;
          --surface-1:rgba(255,255,255,0.75); --surface-2:rgba(15,23,42,0.035);
          --surface-3:rgba(15,23,42,0.05); --surface-4:rgba(15,23,42,0.06);
          --surface-5:rgba(15,23,42,0.07); --surface-6:rgba(15,23,42,0.09);
          --surface-7:rgba(15,23,42,0.12); --surface-8:rgba(15,23,42,0.16);
        }
      `}</style>

      <div className="admin-header" style={{
        background:"var(--surface-1)",
        borderBottom:"1px solid var(--surface-5)",
        padding:"14px 32px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        flexWrap:"wrap", rowGap:10, columnGap:16,
        backdropFilter:"blur(12px)",
        position:"sticky", top:0, zIndex:160,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{
            width:36, height:36, borderRadius:10,
            background:"linear-gradient(135deg,#c084fc,#818cf8)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:16, fontWeight:800, color:"white",
          }}>G</div>
          <div>
            <div style={{ fontSize:14, fontWeight:800, letterSpacing:-0.3 }}>Galene</div>
            <div style={{ fontSize:10, color:"var(--text-5)" }}>Painel de Vendas & Estoque</div>
          </div>
        </div>

        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding:"7px 16px", borderRadius:8, border:"none", cursor:"pointer",
              fontSize:12, fontWeight:600,
              background: activeTab===t.id
                ? (t.id==="settings" ? "rgba(251,146,60,0.15)" : "linear-gradient(135deg,#c084fc,#818cf8)")
                : "var(--surface-3)",
              color: activeTab===t.id
                ? (t.id==="settings" ? "#fb923c" : "white")
                : "var(--text-4)",
              border: activeTab===t.id && t.id==="settings" ? "1px solid rgba(251,146,60,0.3)" : "1px solid transparent",
              transition:"all 0.2s",
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
          <span className="admin-status-text" style={{ fontSize:11, color:"var(--text-5)", display:"flex", alignItems:"center", gap:6 }}>
            <span style={{
              width:7, height:7, borderRadius:"50%",
              background: loadingData ? "var(--text-5)" : "#34d399",
            }} />
            {loadingData ? "Carregando..." : "Dado real · Supabase"}
          </span>

          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Tema claro" : "Tema escuro"}
            style={{
              width:30, height:30, borderRadius:8, border:"1px solid var(--surface-7)",
              background:"var(--surface-3)", cursor:"pointer", fontSize:14,
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          <button
            onClick={handleLogout}
            title="Sair"
            style={{
              display:"flex", alignItems:"center", gap:6,
              padding:"6px 12px", borderRadius:8, border:"1px solid rgba(239,68,68,0.25)",
              background:"rgba(239,68,68,0.08)", cursor:"pointer", color:"#f87171", fontSize:12, fontWeight:600,
            }}>
            🚪 Sair
          </button>

          <div style={{ position:"relative" }}>
            <button
              onClick={() => setShowLogout(s => !s)}
              style={{
                display:"flex", alignItems:"center", gap:8,
                padding:"6px 12px", borderRadius:8, border:"1px solid var(--surface-7)",
                background:"var(--surface-3)", cursor:"pointer", color:"var(--text-3)", fontSize:12,
              }}>
              <div style={{
                width:24, height:24, borderRadius:6,
                background:"linear-gradient(135deg,#c084fc,#818cf8)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:11, fontWeight:700, color:"white",
              }}>G</div>
              {session.user.email} ▾
            </button>
            {showLogout && (
              <div style={{
                position:"absolute", right:0, top:"calc(100% + 6px)",
                background:"var(--panel-solid)", border:"1px solid var(--surface-8)",
                borderRadius:10, overflow:"hidden", minWidth:160, zIndex:200,
                boxShadow:"0 16px 40px rgba(0,0,0,0.5)",
              }}>
                <button
                  onClick={() => { setActiveTab("settings"); setShowLogout(false); }}
                  style={{ width:"100%", padding:"10px 16px", background:"none", border:"none", color:"var(--text-3)", fontSize:12, cursor:"pointer", textAlign:"left", display:"flex", alignItems:"center", gap:8 }}>
                  ⚙️ Integrações
                </button>
                <div style={{ height:1, background:"var(--surface-6)" }} />
                <button
                  onClick={handleLogout}
                  style={{ width:"100%", padding:"10px 16px", background:"none", border:"none", color:"#f87171", fontSize:12, cursor:"pointer", textAlign:"left", display:"flex", alignItems:"center", gap:8 }}>
                  🚪 Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="admin-content" style={{ padding:"28px 32px", maxWidth:1400, margin:"0 auto" }} key={activeTab}>
        {!data && activeTab !== "settings" ? (
          <div style={{ textAlign:"center", padding:"80px 0", color:"var(--text-4)", fontSize:13 }}>
            Carregando dados do painel...
          </div>
        ) : (
          <>
            {activeTab==="overview" && <Overview data={data} />}
            {activeTab==="vendas"   && <Vendas   data={data} />}
            {activeTab==="estoque"  && <Estoque  data={data} />}
            {activeTab==="pedidos"  && <Pedidos data={data} onRefresh={loadData} justUpdated={justUpdated} />}
          </>
        )}
        {activeTab==="settings" && <SettingsPage />}
      </div>

      {showLogout && (
        <div style={{ position:"fixed", inset:0, zIndex:150 }} onClick={() => setShowLogout(false)} />
      )}
    </div>
  );
}
