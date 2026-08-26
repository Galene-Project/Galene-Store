import { useState } from "react";
import Sil from "./Sil";
import { T, COR_HEX, fmt } from "../../lib/galeneTheme";
import { useWindowWidth } from "../../hooks/useWindowWidth";

export default function Carrinho({ cart, onRemove, onFinish, onBack, minOrder, presencial = false, onBuscarCliente, onConfirmarPresencial }) {
  const [step, setStep] = useState(1);
  const [met, setMet]   = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erroServidor, setErroServidor] = useState(null);

  const [form, setForm] = useState({ razao: "", cnpj: "", email: "", tel: "", end: "", cidade: "" });
  const [formErros, setFormErros] = useState({});
  const [telefoneBusca, setTelefoneBusca] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [buscaResultado, setBuscaResultado] = useState(null); // null | "encontrado" | "nao_encontrado"
  const [clienteId, setClienteId] = useState(null);
  const [idempotencyKey] = useState(() => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`));

  const w = useWindowWidth();
  const mob = w < 768;

  const totPcs = cart.reduce((s, i) => s + i.sel.reduce((a, x) => a + x.qtd, 0), 0);
  const totVal = cart.reduce((s, i) => s + i.sel.reduce((a, x) => a + x.qtd * i.preco, 0), 0);
  const ok6 = totPcs >= minOrder;

  const validarForm = () => {
    const erros = {};
    if (!form.razao.trim()) erros.razao = true;
    if (!form.email.trim() || !form.email.includes("@")) erros.email = true;
    if (!form.tel.trim())   erros.tel   = true;
    if (!form.end.trim())   erros.end   = true;
    setFormErros(erros);
    return Object.keys(erros).length === 0;
  };

  const irParaPagamento = () => { if (validarForm()) { setMet(presencial ? null : "pix"); setStep(3); } };

  const confirmarPedido = async (pagamento) => {
    setSalvando(true);
    setErroServidor(null);
    try {
      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form, cart, pagamento, totalPecas: totPcs, totalValor: totVal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || 'Erro ao criar pedido');
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        window.location.href = `/pedido-confirmado?numero=${data.order_number}&emAnalise=1`;
      }
    } catch (e) {
      setSalvando(false);
      setErroServidor("Não foi possível registrar o pedido. Tente novamente.");
    }
  };

  const buscarCliente = async () => {
    if (!telefoneBusca.trim() || !onBuscarCliente) return;
    setBuscando(true);
    setBuscaResultado(null);
    try {
      const cliente = await onBuscarCliente(telefoneBusca.trim());
      if (cliente) {
        setClienteId(cliente.id);
        setForm({
          razao: cliente.name || cliente.company_name || "",
          cnpj: cliente.cnpj || "",
          email: cliente.email || "",
          tel: cliente.phone || telefoneBusca.trim(),
          end: "",
          cidade: "",
        });
        setBuscaResultado("encontrado");
      } else {
        setClienteId(null);
        setBuscaResultado("nao_encontrado");
      }
    } catch (e) {
      console.error('Erro ao buscar cliente:', e);
      setClienteId(null);
      setBuscaResultado("erro");
    } finally {
      setBuscando(false);
    }
  };

  const confirmarVendaPresencial = async () => {
    setSalvando(true);
    setErroServidor(null);
    try {
      const resultado = await onConfirmarPresencial({ form, cart, metodo: met, clienteId, idempotencyKey });
      onFinish?.(resultado);
    } catch (e) {
      setErroServidor(e.message || "Não foi possível registrar a venda.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: mob ? "20px 14px 100px" : "36px 32px 60px" }}>

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
        <button onClick={onBack} style={{ background: "none", border: `1.5px solid ${T.border}`, borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontFamily: "'Lato',sans-serif", fontSize: 11, color: T.ink3, fontWeight: 700 }}>
          Voltar
        </button>
        <h1 style={{ margin: 0, fontFamily: "'Cormorant Garamond',serif", fontSize: mob ? 24 : 32, color: T.ink, fontWeight: 600 }}>
          Meu Pedido
        </h1>
        <div style={{ marginLeft: "auto", fontFamily: "'Lato',sans-serif", fontSize: 11, color: ok6 ? T.jade : T.ruby, fontWeight: 700 }}>
          {totPcs} pc {ok6 ? "— mínimo atingido" : `— faltam ${minOrder - totPcs}`}
        </div>
      </div>

      {!ok6 && totPcs > 0 && (
        <div style={{ background: "#FFF8E6", border: "1px solid #E8C96A", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontFamily: "'Lato',sans-serif", fontSize: 12, color: "#8A6A00" }}>
          Adicione mais {minOrder - totPcs} peça{minOrder - totPcs > 1 ? "s" : ""} para finalizar — pedido mínimo de {minOrder} peças.
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28, overflowX: "auto", paddingBottom: 4 }}>
        {["Itens", "Dados", "Pagamento"].map((s, i) => (
          <div key={s} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", border: `2px solid ${step > i ? T.gold : T.border}`, background: step > i ? T.goldXlt : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: "'Lato',sans-serif", fontSize: 11, fontWeight: 700, color: step > i ? T.gold : T.ink4 }}>{i + 1}</span>
              </div>
              <span style={{ fontFamily: "'Lato',sans-serif", fontSize: 11, fontWeight: 600, color: step === i + 1 ? T.ink : T.ink4, whiteSpace: "nowrap" }}>{s}</span>
            </div>
            {i < 2 && <div style={{ width: mob ? 20 : 40, height: 2, background: step > i + 1 ? T.jade : T.border, margin: "0 8px" }} />}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 300px", gap: 24 }}>
        <div>

          {step === 1 && (
            <>
              {cart.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px", color: T.ink4, fontFamily: "'Lato',sans-serif", fontSize: 13 }}>
                  Seu carrinho está vazio.
                </div>
              ) : (
                <>
                  {cart.map((item, idx) => (
                    <div key={idx} style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, marginBottom: 12, overflow: "hidden" }}>
                      <div style={{ display: "flex", gap: 14, padding: "14px 16px" }}>
                        <div style={{ width: 54, height: 62, background: `linear-gradient(135deg,${T.bg2},${T.bg3})`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Sil cat={item.cat} cor={COR_HEX[item.sel[0]?.cor] || T.gold} sz={48} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, color: T.ink, fontWeight: 600 }}>{item.nome}</div>
                          <div style={{ fontFamily: "'Lato',sans-serif", fontSize: 10, color: T.ink4, marginTop: 2 }}>{item.cat} — {fmt(item.preco)}/pc</div>
                        </div>
                        <button onClick={() => onRemove(idx)} aria-label="Remover item" style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: T.ruby, fontSize: 12, fontWeight: 700 }}>
                          ✕
                        </button>
                      </div>
                      <div style={{ borderTop: `1px solid ${T.border}`, padding: "10px 16px", background: T.bg }}>
                        {item.sel.map((s) => (
                          <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: COR_HEX[s.cor] || T.gold }} />
                            <span style={{ fontFamily: "'Lato',sans-serif", fontSize: 11, color: T.ink3, flex: 1 }}>{s.cor} / {s.tam} — {s.qtd}</span>
                            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 13, color: T.goldDk }}>{fmt(s.qtd * item.preco)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button onClick={() => ok6 && setStep(2)} disabled={!ok6} style={{ width: "100%", height: 50, marginTop: 8, background: ok6 ? T.goldDk : T.bg2, border: "none", borderRadius: 12, cursor: ok6 ? "pointer" : "not-allowed", fontFamily: "'Lato',sans-serif", fontSize: 13, fontWeight: 700, color: ok6 ? "white" : T.ink4, letterSpacing: 1 }}>
                    {ok6 ? "Continuar" : `Mínimo ${minOrder} peças (faltam ${minOrder - totPcs})`}
                  </button>
                </>
              )}
            </>
          )}

          {step === 2 && (
            <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 14 }}>
              {presencial && (
                <div style={{ gridColumn: `span ${mob ? "1" : "2"}`, display: "flex", gap: 10, alignItems: "flex-end", marginBottom: 4 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontFamily: "'Lato',sans-serif", fontSize: 10, letterSpacing: 1.5, color: T.ink4, textTransform: "uppercase", marginBottom: 6 }}>
                      Buscar cliente por telefone
                    </label>
                    <input
                      value={telefoneBusca}
                      onChange={(e) => setTelefoneBusca(e.target.value)}
                      placeholder="(00) 00000-0000"
                      style={{ width: "100%", background: T.panel, border: `1.5px solid ${T.border}`, borderRadius: 8, padding: "11px 14px", fontFamily: "'Lato',sans-serif", fontSize: 13, color: T.ink, outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                  <button onClick={buscarCliente} disabled={buscando || !telefoneBusca.trim()} style={{ background: "none", border: `1.5px solid ${T.border}`, borderRadius: 8, padding: "11px 16px", cursor: buscando ? "wait" : "pointer", fontFamily: "'Lato',sans-serif", fontSize: 12, fontWeight: 700, color: T.ink3 }}>
                    {buscando ? "Buscando..." : "Buscar"}
                  </button>
                </div>
              )}
              {presencial && buscaResultado === "encontrado" && (
                <div style={{ gridColumn: `span ${mob ? "1" : "2"}`, fontFamily: "'Lato',sans-serif", fontSize: 11, color: T.jade }}>
                  Cliente encontrado — dados preenchidos abaixo.
                </div>
              )}
              {presencial && buscaResultado === "nao_encontrado" && (
                <div style={{ gridColumn: `span ${mob ? "1" : "2"}`, fontFamily: "'Lato',sans-serif", fontSize: 11, color: T.ink4 }}>
                  Cliente não encontrado — cadastre abaixo.
                </div>
              )}
              {presencial && buscaResultado === "erro" && (
                <div style={{ gridColumn: `span ${mob ? "1" : "2"}`, fontFamily: "'Lato',sans-serif", fontSize: 11, color: T.ruby }}>
                  Erro ao buscar cliente — tente de novo.
                </div>
              )}
              {[
                ["razao",  "Razão Social *",          "2"],
                ["cnpj",   "CNPJ / CPF",              "1"],
                ["email",  "E-mail *",                "1"],
                ["tel",    "Telefone / WhatsApp *",   "1"],
                ["end",    "Endereço *",              "2"],
                ["cidade", "Cidade / Estado",         "2"],
              ].map(([f, label, c]) => (
                <div key={f} style={{ gridColumn: `span ${mob ? "1" : c}` }}>
                  <label style={{ display: "block", fontFamily: "'Lato',sans-serif", fontSize: 10, letterSpacing: 1.5, color: T.ink4, textTransform: "uppercase", marginBottom: 6 }}>{label}</label>
                  <input
                    value={form[f] || ""}
                    onChange={(e) => { setForm((p) => ({ ...p, [f]: e.target.value })); setFormErros((p) => ({ ...p, [f]: false })); }}
                    style={{ width: "100%", background: T.panel, border: `1.5px solid ${formErros[f] ? T.ruby : T.border}`, borderRadius: 8, padding: "11px 14px", fontFamily: "'Lato',sans-serif", fontSize: 13, color: T.ink, outline: "none", boxSizing: "border-box" }}
                    onFocus={(e)  => (e.target.style.borderColor = T.gold)}
                    onBlur={(e)   => (e.target.style.borderColor = formErros[f] ? T.ruby : T.border)}
                  />
                  {formErros[f] && <div style={{ fontFamily: "'Lato',sans-serif", fontSize: 10, color: T.ruby, marginTop: 4 }}>Campo obrigatório</div>}
                </div>
              ))}
              <div style={{ gridColumn: `span ${mob ? "1" : "2"}`, display: "flex", gap: 10, marginTop: 4 }}>
                <button onClick={() => setStep(1)} style={{ background: "none", border: `1.5px solid ${T.border}`, borderRadius: 10, padding: "12px 20px", cursor: "pointer", fontFamily: "'Lato',sans-serif", fontSize: 12, fontWeight: 700, color: T.ink3 }}>
                  Voltar
                </button>
                <button onClick={irParaPagamento} style={{ flex: 1, background: T.goldDk, border: "none", borderRadius: 10, padding: "12px", cursor: "pointer", fontFamily: "'Lato',sans-serif", fontSize: 13, fontWeight: 700, color: "white", letterSpacing: 1 }}>
                  Continuar
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <button onClick={() => setStep(2)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Lato',sans-serif", fontSize: 12, color: T.ink3, marginBottom: 16, fontWeight: 700 }}>
                ← Voltar
              </button>

              {erroServidor && (
                <div style={{ background: "#FFF0F0", border: `1px solid ${T.ruby}`, borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontFamily: "'Lato',sans-serif", fontSize: 12, color: T.ruby }}>
                  {erroServidor}
                </div>
              )}

              {presencial ? (
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                  <div style={{ background: T.goldXlt, border: `1px solid ${T.border}`, borderRadius: 16, padding: "28px 24px", marginBottom: 20 }}>
                    <div style={{ fontFamily: "'Lato',sans-serif", fontSize: 11, color: T.ink3, marginBottom: 8, letterSpacing: 1 }}>TOTAL A RECEBER</div>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, color: T.ink2, marginBottom: 4 }}>{totPcs} peças</div>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 42, color: T.gold, fontWeight: 600 }}>{fmt(totVal)}</div>
                  </div>
                  <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 20, flexWrap: "wrap" }}>
                    {[["cartao", "Cartão"], ["dinheiro", "Dinheiro"], ["pix", "Pix"]].map(([id, label]) => (
                      <button
                        key={id}
                        onClick={() => setMet(id)}
                        style={{ border: `1.5px solid ${met === id ? T.gold : T.border}`, background: met === id ? T.goldXlt : "none", borderRadius: 10, padding: "10px 18px", cursor: "pointer", fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: 12, color: met === id ? T.goldDk : T.ink3 }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={confirmarVendaPresencial}
                    disabled={salvando || !met}
                    style={{ width: "100%", background: (salvando || !met) ? T.bg2 : T.goldDk, border: "none", borderRadius: 12, padding: "16px", color: (salvando || !met) ? T.ink4 : "white", fontFamily: "'Lato',sans-serif", fontSize: 13, fontWeight: 700, cursor: (salvando || !met) ? "default" : "pointer", letterSpacing: 1 }}
                  >
                    {salvando ? "Registrando..." : "Confirmar pagamento e finalizar venda"}
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                  <div style={{ background: met === "pix" ? "#EAF5EE" : T.goldXlt, border: `1px solid ${met === "pix" ? "#B8D8C4" : T.border}`, borderRadius: 16, padding: "28px 24px", marginBottom: 20 }}>
                    <div style={{ fontFamily: "'Lato',sans-serif", fontSize: 11, color: T.ink3, marginBottom: 8, letterSpacing: 1 }}>TOTAL A PAGAR</div>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, color: T.ink2, marginBottom: 4 }}>{totPcs} peças</div>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 42, color: met === "pix" ? T.jade : T.gold, fontWeight: 600 }}>{fmt(totVal)}</div>
                    <div style={{ fontFamily: "'Lato',sans-serif", fontSize: 10, color: T.ink3, marginTop: 8, letterSpacing: 1 }}>
                      Você vai finalizar em uma página segura do Mercado Pago
                    </div>
                  </div>
                  <button
                    onClick={() => confirmarPedido(met)}
                    disabled={salvando}
                    style={{ width: "100%", background: salvando ? T.bg2 : T.goldDk, border: "none", borderRadius: 12, padding: "16px", color: salvando ? T.ink4 : "white", fontFamily: "'Lato',sans-serif", fontSize: 13, fontWeight: 700, cursor: salvando ? "wait" : "pointer", letterSpacing: 1 }}
                  >
                    {salvando ? "Redirecionando…" : "Ir para o pagamento"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {(!mob || step === 1) && (
          <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: "20px", height: "fit-content", position: mob ? "static" : "sticky", top: 130 }}>
            <div style={{ fontFamily: "'Lato',sans-serif", fontSize: 10, letterSpacing: 2.5, color: T.ink4, textTransform: "uppercase", marginBottom: 16 }}>Resumo</div>
            {cart.map((item, idx) => (
              <div key={idx} style={{ marginBottom: 12 }}>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 14, color: T.ink, fontWeight: 600, marginBottom: 4 }}>{item.nome}</div>
                {item.sel.map((s) => (
                  <div key={s.key} style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontFamily: "'Lato',sans-serif", fontSize: 10, color: T.ink4 }}>{s.cor} / {s.tam} — {s.qtd}</span>
                    <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 12, color: T.ink3 }}>{fmt(s.qtd * item.preco)}</span>
                  </div>
                ))}
              </div>
            ))}
            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12, marginTop: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontFamily: "'Lato',sans-serif", fontSize: 11, color: T.ink3 }}>{totPcs} peças</span>
                <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 14, color: T.ink3 }}>{fmt(totVal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
                <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, color: T.ink, fontWeight: 600 }}>Total</span>
                <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, color: T.goldDk, fontWeight: 600 }}>{fmt(totVal)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
