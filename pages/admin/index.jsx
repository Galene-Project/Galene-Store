'use client';
import { useState, useEffect } from "react";
import Overview     from "../../components/admin/tabs/Overview";
import Vendas       from "../../components/admin/tabs/Vendas";
import Estoque      from "../../components/admin/tabs/Estoque";
import Pedidos      from "../../components/admin/tabs/Pedidos";
import LoginPage    from "../../components/admin/LoginPage";
import SettingsPage from "../../components/admin/SettingsPage";
import { fetchDashboardData } from "../../lib/adminData";
import { getSession, logout } from "../../lib/adminAuth";

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

  useEffect(() => {
    getSession().then(s => { setSession(s); setCheckingSession(false); });
  }, []);

  useEffect(() => {
    if (!session) return;
    setLoadingData(true);
    fetchDashboardData()
      .then(setData)
      .catch((err) => console.error("Erro ao buscar dados do painel:", err))
      .finally(() => setLoadingData(false));
  }, [session]);

  async function handleLogout() {
    await logout();
    setSession(null);
  }

  if (checkingSession) return null;
  if (!session) return <LoginPage onLogin={() => getSession().then(setSession)} />;

  return (
    <div style={{
      minHeight:"100vh",
      background:"linear-gradient(135deg,#0f0c1a 0%,#130f23 50%,#0a0f1a 100%)",
      fontFamily:"'DM Sans','Segoe UI',sans-serif",
      color:"#f1f5f9",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;600&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing:border-box; }
        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-thumb { background:rgba(192,132,252,0.3); border-radius:3px; }
      `}</style>

      <div style={{
        background:"rgba(255,255,255,0.02)",
        borderBottom:"1px solid rgba(255,255,255,0.06)",
        padding:"14px 32px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        backdropFilter:"blur(12px)",
        position:"sticky", top:0, zIndex:100,
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
            <div style={{ fontSize:10, color:"#475569" }}>Painel de Vendas & Estoque</div>
          </div>
        </div>

        <div style={{ display:"flex", gap:4 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding:"7px 16px", borderRadius:8, border:"none", cursor:"pointer",
              fontSize:12, fontWeight:600,
              background: activeTab===t.id
                ? (t.id==="settings" ? "rgba(251,146,60,0.15)" : "linear-gradient(135deg,#c084fc,#818cf8)")
                : "rgba(255,255,255,0.04)",
              color: activeTab===t.id
                ? (t.id==="settings" ? "#fb923c" : "white")
                : "#64748b",
              border: activeTab===t.id && t.id==="settings" ? "1px solid rgba(251,146,60,0.3)" : "1px solid transparent",
              transition:"all 0.2s",
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <span style={{ fontSize:11, color:"#475569", display:"flex", alignItems:"center", gap:6 }}>
            <span style={{
              width:7, height:7, borderRadius:"50%",
              background: loadingData ? "#475569" : "#34d399",
            }} />
            {loadingData ? "Carregando..." : "Dado real · Supabase"}
          </span>

          <div style={{ position:"relative" }}>
            <button
              onClick={() => setShowLogout(s => !s)}
              style={{
                display:"flex", alignItems:"center", gap:8,
                padding:"6px 12px", borderRadius:8, border:"1px solid rgba(255,255,255,0.08)",
                background:"rgba(255,255,255,0.04)", cursor:"pointer", color:"#94a3b8", fontSize:12,
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
                background:"#1a1625", border:"1px solid rgba(255,255,255,0.1)",
                borderRadius:10, overflow:"hidden", minWidth:160, zIndex:200,
                boxShadow:"0 16px 40px rgba(0,0,0,0.5)",
              }}>
                <button
                  onClick={() => { setActiveTab("settings"); setShowLogout(false); }}
                  style={{ width:"100%", padding:"10px 16px", background:"none", border:"none", color:"#94a3b8", fontSize:12, cursor:"pointer", textAlign:"left", display:"flex", alignItems:"center", gap:8 }}>
                  ⚙️ Integrações
                </button>
                <div style={{ height:1, background:"rgba(255,255,255,0.07)" }} />
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

      <div style={{ padding:"28px 32px", maxWidth:1400, margin:"0 auto" }} key={activeTab}>
        {!data && activeTab !== "settings" ? (
          <div style={{ textAlign:"center", padding:"80px 0", color:"#64748b", fontSize:13 }}>
            Carregando dados do painel...
          </div>
        ) : (
          <>
            {activeTab==="overview" && <Overview data={data} />}
            {activeTab==="vendas"   && <Vendas   data={data} />}
            {activeTab==="estoque"  && <Estoque  data={data} />}
            {activeTab==="pedidos"  && <Pedidos  data={data} />}
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
