// Visual do painel /admin: tokens, shell (sidebar + canvas) e peças base.
// Estilo "achromatic-ledger" (tasteskill): a casca não tem cor; o ouro da
// marca Galene aparece só nos dados principais (--accent). Os nomes antigos
// (--text-N, --surface-N, --panel-solid) continuam existindo porque as abas
// ainda os usam inline — só os valores mudaram.
export const ADMIN_CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&family=Cormorant+Garamond:wght@500;600&display=swap');

.admin-root { --font: 'DM Sans','Segoe UI',system-ui,sans-serif; --mono: 'DM Mono',ui-monospace,monospace; --serif: 'Cormorant Garamond',Georgia,serif;
  --radius-card: 8px; --radius-control: 6px; --gap: 16px; --control-height: 34px; }
.admin-root[data-theme="light"] {
  --ground:#f6f4f1; --surface:#ffffff; --panel-solid:#ffffff; --bg-grad:#f6f4f1;
  --text-1:#0a0a0a; --text-2:#1f1f1f; --text-3:#4a4a4a; --text-4:#5f5f5f; --text-5:#6b6b6b;
  --surface-1:#faf9f7; --surface-2:rgba(20,17,14,0.03); --surface-3:rgba(20,17,14,0.04); --surface-4:rgba(20,17,14,0.06);
  --surface-5:rgba(20,17,14,0.07); --surface-6:rgba(20,17,14,0.10); --surface-7:rgba(20,17,14,0.16); --surface-8:rgba(20,17,14,0.22);
  --border:#e7e4df; --rule:#efece8; --control:#d2cec8; --active:#ebe8e3;
  --accent:#8a6a38; --accent-tint:rgba(138,106,56,0.14); --chart-2:#8a8a8a; --chart-3:#bdbdbd; --grid:#e8e5e0;
  --primary:#141414; --primary-ink:#ffffff;
  --positive:#247b50; --negative:#c4242a; --warning:#92400e;
  --pill-positive-bg:#dcfae5; --pill-positive-ink:#04250e; --pill-negative-bg:#ffedea; --pill-negative-ink:#831c1e;
  --pill-warning-bg:#fffbeb; --pill-warning-ink:#92400e; --pill-neutral-bg:#eeebe6; --pill-neutral-ink:#3d3d3d;
}
.admin-root[data-theme="dark"] {
  --ground:#0c0c0c; --surface:#141414; --panel-solid:#1b1b1b; --bg-grad:#0c0c0c;
  --text-1:#ffffff; --text-2:#ececec; --text-3:#b8b8b8; --text-4:#9a9a9a; --text-5:#8f8f8f;
  --surface-1:#101010; --surface-2:rgba(255,255,255,0.03); --surface-3:rgba(255,255,255,0.05); --surface-4:rgba(255,255,255,0.06);
  --surface-5:rgba(255,255,255,0.08); --surface-6:rgba(255,255,255,0.10); --surface-7:rgba(255,255,255,0.16); --surface-8:rgba(255,255,255,0.22);
  --border:#262626; --rule:#1d1d1d; --control:#444444; --active:#222222;
  --accent:#d4b07a; --accent-tint:rgba(212,176,122,0.14); --chart-2:#8f8f8f; --chart-3:#5c5c5c; --grid:#2b2b2b;
  --primary:#ffffff; --primary-ink:#000000;
  --positive:#3fc07a; --negative:#e5566f; --warning:#e0a15a;
  --pill-positive-bg:#172a1d; --pill-positive-ink:#3fc07a; --pill-negative-bg:#2c1a20; --pill-negative-ink:#e5566f;
  --pill-warning-bg:#2b2112; --pill-warning-ink:#e0a15a; --pill-neutral-bg:#222222; --pill-neutral-ink:#cfcfcf;
}

.admin-root { font-variant-numeric:tabular-nums; min-height:100vh; background:var(--ground); color:var(--text-1); font-family:var(--font); font-size:14px; }
.admin-root *, .admin-root *::before, .admin-root *::after { box-sizing:border-box; }
.admin-root button { font-family:inherit; }
.admin-root ::-webkit-scrollbar { width:8px; height:8px; }
.admin-root ::-webkit-scrollbar-thumb { background:var(--control); border-radius:4px; }
.admin-root input, .admin-root select, .admin-root textarea { font-family:inherit; }
.admin-root input { font-size:13px !important; }
.admin-root :focus-visible { outline:2px solid var(--accent); outline-offset:2px; }

/* ---- casca: sidebar + canvas ---- */
.a-shell { display:grid; grid-template-columns:240px minmax(0,1fr); min-height:100vh; }
.a-side { position:sticky; top:0; height:100vh; display:flex; flex-direction:column; padding:18px 12px 14px; border-right:1px solid var(--border); background:var(--ground); overflow-y:auto; }
.a-brand { display:flex; align-items:center; gap:10px; padding:2px 8px 18px; }
.a-mark { width:30px; height:30px; border-radius:6px; background:var(--primary); color:var(--primary-ink); display:flex; align-items:center; justify-content:center; font-family:var(--serif); font-size:20px; font-weight:600; line-height:1; flex:none; }
.a-brand-name { font-family:var(--serif); font-size:21px; font-weight:600; letter-spacing:0; line-height:1; color:var(--text-1); }
.a-brand-sub { font-size:12px; color:var(--text-5); margin-top:3px; }
.a-group { margin-top:20px; }
.a-group:first-of-type { margin-top:4px; }
.a-group-label { font-size:12px; color:var(--text-5); padding:0 10px 6px; }
.a-nav { display:flex; align-items:center; gap:10px; width:100%; min-height:32px; padding:6px 10px; border:0; border-radius:8px; background:transparent; color:var(--text-3); font-size:14px; font-weight:400; text-align:left; cursor:pointer; text-decoration:none; }
.a-nav:hover { background:var(--surface-3); color:var(--text-1); }
.a-nav[aria-current="page"] { background:var(--active); color:var(--text-1); font-weight:500; }
.a-nav svg { flex:none; color:var(--text-5); }
.a-nav[aria-current="page"] svg { color:var(--text-1); }
.a-count { margin-left:auto; min-width:20px; height:20px; padding:0 6px; border-radius:10px; background:var(--negative); color:#fff; font-size:12px; font-weight:500; display:inline-flex; align-items:center; justify-content:center; font-variant-numeric:tabular-nums; }
.a-side-foot { margin-top:auto; padding-top:16px; }
.a-user { display:flex; align-items:center; gap:8px; padding:10px 10px 0; border-top:1px solid var(--border); margin-top:10px; font-size:12px; color:var(--text-5); word-break:break-all; }

.a-main { min-width:0; padding:30px 36px 64px; }
.a-main-inner { max-width:1240px; margin:0 auto; }
.a-title-row { display:flex; align-items:flex-end; justify-content:space-between; gap:16px; flex-wrap:wrap; margin-bottom:22px; }
.a-title { margin:0; font-size:24px; font-weight:600; line-height:1.2; color:var(--text-1); }
.a-sub { margin:6px 0 0; font-size:14px; color:var(--text-4); }
.a-stamp { display:flex; align-items:center; gap:8px; font-size:12px; color:var(--text-5); }
.a-btn { display:inline-flex; align-items:center; gap:6px; height:var(--control-height); padding:0 12px; border-radius:var(--radius-control); border:1px solid var(--control); background:var(--surface); color:var(--text-2); font-size:13px; font-weight:500; cursor:pointer; }
.a-btn:hover { background:var(--surface-3); }
.a-btn-primary { background:var(--primary); color:var(--primary-ink); border-color:var(--primary); }
.a-btn-primary:hover { background:var(--primary); opacity:.88; }

.a-topbar { display:none; }
.a-sheet { display:none; }

/* ---- KPIs: um container dividido por linhas, sem tile nem ícone ---- */
.admin-kpi-grid { gap:0 !important; background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-card); overflow:hidden; margin-bottom:var(--gap) !important; }
.admin-kpi-grid > * { border-right:1px solid var(--rule); border-bottom:1px solid var(--rule); margin:0 -1px -1px 0; }

/* grid filho pode encolher: sem isso um gráfico largo empurra a página pro lado */
.admin-kpi-grid > *, .admin-chart-grid > * { min-width:0; }

/* ---- janela estreita: menos colunas, sem texto espremido ---- */
@media (max-width: 1180px) {
  .admin-kpi-grid { grid-template-columns:repeat(2,minmax(0,1fr)) !important; }
  .admin-kpi-grid:has(> :nth-child(5)) { grid-template-columns:repeat(3,minmax(0,1fr)) !important; }
  .admin-chart-grid { grid-template-columns:1fr !important; }
}

/* ---- celular ---- */
@media (max-width: 860px) {
  .a-shell { display:block; }
  .a-side { display:none; }
  .a-topbar { display:flex; position:sticky; top:0; z-index:40; height:48px; align-items:center; justify-content:space-between; padding:0 16px; background:var(--ground); border-bottom:1px solid var(--border); }
  .a-sheet { display:block; position:fixed; inset:0; z-index:60; background:var(--ground); overflow-y:auto; padding:12px 16px 24px; }
  .a-main { padding:20px 16px 56px; }
  .a-title { font-size:22px; }
  .a-nav { min-height:44px; font-size:15px; }
  .admin-kpi-grid, .admin-kpi-grid:has(> :nth-child(5)) { grid-template-columns:repeat(2,minmax(0,1fr)) !important; }
  .admin-chart-grid { grid-template-columns:1fr !important; }
}
`;
