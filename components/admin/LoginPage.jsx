import React, { useState } from "react";
import { login } from "../../lib/adminAuth";
import { ADMIN_CSS } from "./adminCss";

// Mesmo vocabulário do painel: fundo liso (pedra), uma folha branca com borda
// de 1px, botão preto. Nenhum efeito — é a porta de um painel de trabalho.
export default function LoginPage({ onLogin }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit() {
    if (!email || !password) { setError("Preencha e-mail e senha."); return; }
    setLoading(true);
    setError("");
    const result = await login(email, password);
    if (result.ok) {
      onLogin();
    } else {
      setError(result.error === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : result.error);
      setLoading(false);
    }
  }

  function handleKey(e) { if (e.key === "Enter") handleSubmit(); }

  const campo = { width: "100%", height: 40, padding: "0 12px", borderRadius: 6, border: "1px solid var(--control)", background: "var(--surface)", color: "var(--text-1)", fontSize: 14, outline: "none" };
  const rotulo = { display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500, color: "var(--text-3)" };

  return (
    <div className="admin-root" data-theme="light" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <style>{ADMIN_CSS}</style>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div className="a-mark" style={{ width: 40, height: 40, fontSize: 26 }} aria-hidden="true">G</div>
          <div>
            <div className="a-brand-name" style={{ fontSize: 28 }}>Galene</div>
            <div style={{ fontSize: 13, color: "var(--text-4)", marginTop: 2 }}>Painel de vendas e estoque</div>
          </div>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 24 }}>
          <h1 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 600 }}>Entrar</h1>
          <p style={{ margin: "0 0 20px", fontSize: 14, color: "var(--text-4)" }}>Acesso restrito à equipe da loja.</p>

          <div style={{ marginBottom: 16 }}>
            <label htmlFor="login-email" style={rotulo}>E-mail</label>
            <input id="login-email" type="email" placeholder="voce@galene.com" value={email} style={campo}
              onChange={e => { setEmail(e.target.value); setError(""); }} onKeyDown={handleKey} autoComplete="username" />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label htmlFor="login-senha" style={rotulo}>Senha</label>
            <div style={{ position: "relative" }}>
              <input id="login-senha" type={showPass ? "text" : "password"} value={password} style={{ ...campo, paddingRight: 64 }}
                onChange={e => { setPassword(e.target.value); setError(""); }} onKeyDown={handleKey} autoComplete="current-password" />
              <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: 0, cursor: "pointer", color: "var(--text-4)", fontSize: 13, padding: 6 }}>
                {showPass ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </div>

          {error && (
            <div role="alert" style={{ marginBottom: 16, padding: "10px 12px", borderRadius: 6, background: "var(--pill-negative-bg)", color: "var(--pill-negative-ink)", fontSize: 13 }}>
              {error}
            </div>
          )}

          <button className="a-btn a-btn-primary" onClick={handleSubmit} disabled={loading}
            style={{ width: "100%", height: 42, justifyContent: "center", fontSize: 14, opacity: loading ? 0.6 : 1, cursor: loading ? "wait" : "pointer" }}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
