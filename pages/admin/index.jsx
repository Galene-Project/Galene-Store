'use client';
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Overview     from "../../components/admin/tabs/Overview";
import Vendas       from "../../components/admin/tabs/Vendas";
import Estoque      from "../../components/admin/tabs/Estoque";
import Catalogo     from "../../components/admin/tabs/Catalogo";
import Pedidos      from "../../components/admin/tabs/Pedidos";
import Relatorios   from "../../components/admin/tabs/Relatorios";
import Despesas     from "../../components/admin/tabs/Despesas";
import Clientes     from "../../components/admin/tabs/Clientes";
import FluxoCaixa    from "../../components/admin/tabs/FluxoCaixa";
import Visao360      from "../../components/admin/tabs/Visao360";
import LoginPage    from "../../components/admin/LoginPage";
import SettingsPage from "../../components/admin/SettingsPage";
import Icon         from "../../components/admin/Icon";
import { ADMIN_CSS } from "../../components/admin/adminCss";
import { fetchDashboardData } from "../../lib/adminData";
import { getSession, logout } from "../../lib/adminAuth";
import { supabase } from "../../lib/supabaseClient";

// Menu em grupos. `sub` é a linha sob o título da tela: fala do dado, não da interface.
const NAV = [
  { grupo: null, itens: [
    { id: "overview", label: "Visão geral", icon: "overview", sub: "O que pede atenção hoje e como a loja foi nos últimos 6 meses." },
    { id: "visao360", label: "Visão 360", icon: "compass", sub: "Vendas, financeiro e estoque no período escolhido." },
  ] },
  { grupo: "Vendas", itens: [
    { id: "vendas", label: "Vendas", icon: "trend", sub: "Faturamento e ranking dos últimos 6 meses." },
    { id: "pedidos", label: "Pedidos", icon: "bag", sub: "Aprovação, separação e entrega." },
    { id: "clientes", label: "Clientes", icon: "users", sub: "Base de clientes para recompra e remarketing." },
    { id: "balcao", label: "Venda no balcão", icon: "cash", href: "/admin/venda" },
  ] },
  { grupo: "Estoque", itens: [
    { id: "estoque", label: "Estoque", icon: "box", sub: "O que tem, o que está acabando e o que repor." },
    { id: "catalogo", label: "Catálogo", icon: "tag", sub: "Peças da loja: preço, promoção, destaque, fotos e vídeos." },
  ] },
  { grupo: "Financeiro", itens: [
    { id: "despesas", label: "Despesas", icon: "receipt", sub: "Despesas variáveis, despesas fixas e lotes de produção." },
    { id: "fluxocaixa", label: "Fluxo de caixa", icon: "wallet", sub: "Dinheiro que já entrou e saiu, por período." },
  ] },
  { grupo: "Análise", itens: [
    { id: "relatorios", label: "Relatórios", icon: "chart", sub: "Vendas e estoque de um produto, por cor e tamanho." },
  ] },
];
const LOJA = { id: "settings", label: "Loja", icon: "store", sub: "Nome, contato, pedido mínimo e pagamento da loja." };
const ITENS = [...NAV.flatMap((g) => g.itens), LOJA];

export default function AdminPage() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [session,     setSession]     = useState(null);
  const [activeTab,   setActiveTab]   = useState("overview");
  const [data,        setData]        = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [theme,       setTheme]       = useState("light");
  const [menuOpen,    setMenuOpen]    = useState(false);
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

  const ativo = ITENS.find((i) => i.id === activeTab) || ITENS[0];
  // Fila que precisa de ação: pedido de cartão esperando o operador aprovar.
  const aguardando = (data?.raw?.orders || []).filter((o) => o.status === "aguardando_aprovacao").length;

  function irPara(id) { setActiveTab(id); setMenuOpen(false); }

  function renderItem(item) {
    const inner = (
      <>
        <Icon name={item.icon} />
        <span>{item.label}</span>
        {item.id === "pedidos" && aguardando > 0 && (
          <span className="a-count" title={`${aguardando} aguardando aprovação`}>{aguardando}</span>
        )}
      </>
    );
    if (item.href) {
      return <Link key={item.id} href={item.href} className="a-nav" onClick={() => setMenuOpen(false)}>{inner}</Link>;
    }
    return (
      <button key={item.id} className="a-nav" aria-current={activeTab === item.id ? "page" : undefined} onClick={() => irPara(item.id)}>
        {inner}
      </button>
    );
  }

  function renderNav() {
    return (
      <>
        {NAV.map((g, i) => (
          <div className="a-group" key={g.grupo || i}>
            {g.grupo && <div className="a-group-label">{g.grupo}</div>}
            {g.itens.map(renderItem)}
          </div>
        ))}
      </>
    );
  }

  const rodape = (
    <div className="a-side-foot">
      {renderItem(LOJA)}
      <button className="a-nav" onClick={toggleTheme}>
        <Icon name={theme === "dark" ? "sun" : "moon"} />
        <span>{theme === "dark" ? "Tema claro" : "Tema escuro"}</span>
      </button>
      <button className="a-nav" onClick={handleLogout}>
        <Icon name="out" />
        <span>Sair</span>
      </button>
      <div className="a-user">{session.user.email}</div>
    </div>
  );

  const marca = (
    <div className="a-brand">
      <div className="a-mark" aria-hidden="true">G</div>
      <div>
        <div className="a-brand-name">Galene</div>
        <div className="a-brand-sub">Atacado feminino</div>
      </div>
    </div>
  );

  return (
    <div className="admin-root" data-theme={theme}>
      <style>{ADMIN_CSS}</style>

      <div className="a-topbar">
        <div className="a-brand" style={{ padding: 0 }}>
          <div className="a-mark" aria-hidden="true">G</div>
          <div className="a-brand-name">Galene</div>
        </div>
        <button className="a-btn" onClick={() => setMenuOpen(true)} aria-label="Abrir menu"><Icon name="menu" /> Menu</button>
      </div>

      {menuOpen && (
        <div className="a-sheet">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            {marca}
            <button className="a-btn" onClick={() => setMenuOpen(false)} aria-label="Fechar menu"><Icon name="close" /></button>
          </div>
          {renderNav()}
          {rodape}
        </div>
      )}

      <div className="a-shell">
        <aside className="a-side" aria-label="Menu do painel">
          {marca}
          {renderNav()}
          {rodape}
        </aside>

        <main className="a-main">
          <div className="a-main-inner">
            <div className="a-title-row">
              <div>
                <h1 className="a-title">{ativo.label}</h1>
                {ativo.sub && <p className="a-sub">{ativo.sub}</p>}
              </div>
              <div className="a-stamp">
                <span>{loadingData ? "Atualizando…" : "Dados ao vivo"}</span>
                <button className="a-btn" onClick={loadData} aria-label="Atualizar dados"><Icon name="refresh" /> Atualizar</button>
              </div>
            </div>

            <div key={activeTab}>
              {!data && activeTab !== "settings" && activeTab !== "catalogo" && activeTab !== "despesas" ? (
                <div style={{ textAlign:"center", padding:"80px 0", color:"var(--text-4)", fontSize:13 }}>
                  Carregando dados do painel...
                </div>
              ) : (
                <>
                  {activeTab==="overview" && <Overview data={data} onNavigate={irPara} />}
                  {activeTab==="visao360" && <Visao360 data={data} />}
                  {activeTab==="vendas"   && <Vendas   data={data} />}
                  {activeTab==="estoque"  && <Estoque  data={data} />}
                  {activeTab==="pedidos"  && <Pedidos data={data} onRefresh={loadData} justUpdated={justUpdated} />}
                  {activeTab==="clientes" && <Clientes data={data} />}
                  {activeTab==="relatorios" && <Relatorios data={data} />}
                  {activeTab==="fluxocaixa" && <FluxoCaixa data={data} />}
                </>
              )}
              {activeTab==="settings" && <SettingsPage />}
              {activeTab==="catalogo" && <Catalogo />}
              {activeTab==="despesas" && <Despesas onRefresh={loadData} />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
