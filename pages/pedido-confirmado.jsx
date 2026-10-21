import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { T, fmt } from '../lib/galeneTheme';

// Pix gravado pelo carrinho (sessionStorage) para o pedido recém-criado.
function usePixDoPedido(numero) {
  const [pix, setPix] = useState(null);
  const [qr, setQr] = useState(null);
  useEffect(() => {
    if (!numero) return;
    try {
      const salvo = JSON.parse(sessionStorage.getItem('galene_pix') || 'null');
      if (salvo?.numero === numero && salvo.pix) setPix(salvo);
    } catch (e) { /* sem storage */ }
  }, [numero]);
  useEffect(() => {
    if (!pix) return;
    import('qrcode').then((m) => m.toDataURL(pix.pix, { margin: 1, width: 240 })).then(setQr).catch(() => setQr(null));
  }, [pix]);
  return { pix, qr };
}

export default function PedidoConfirmado() {
  const router = useRouter();
  const { numero, emAnalise } = router.query;
  const { pix, qr } = usePixDoPedido(numero);
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    try { await navigator.clipboard.writeText(pix.pix); setCopiado(true); setTimeout(() => setCopiado(false), 2500); } catch (e) { /* o texto fica selecionável */ }
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Lato',sans-serif", padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ width: 72, height: 72, background: T.goldDk, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, color: T.goldDk, margin: '0 0 12px' }}>Pedido recebido!</h1>
        {numero && (
          <p style={{ fontSize: 14, color: T.ink3, marginBottom: 12 }}>Nº {numero}</p>
        )}

        {pix && (
          <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, margin: '0 0 24px' }}>
            <div style={{ fontSize: 14, color: T.ink3, marginBottom: 4 }}>Pague com Pix</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 34, color: T.goldDk, fontWeight: 600, marginBottom: 12 }}>{fmt(pix.total)}</div>
            {qr && <img src={qr} alt="QR code do Pix" width={220} height={220} style={{ display: 'block', margin: '0 auto 12px' }} />}
            <textarea readOnly value={pix.pix} onFocus={(e) => e.target.select()} rows={4}
              style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'monospace', fontSize: 12, color: T.ink2, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, resize: 'none' }} />
            <button onClick={copiar} style={{ width: '100%', marginTop: 10, background: T.goldDk, border: 'none', borderRadius: 10, padding: '12px', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              {copiado ? 'Copiado!' : 'Copiar código Pix'}
            </button>
            <div style={{ fontSize: 13, color: T.ink4, marginTop: 10 }}>Depois de pagar, nossa equipe confirma e separa suas peças.</div>
          </div>
        )}

        <p style={{ fontSize: 14, color: T.ink3, lineHeight: 1.7, marginBottom: 32 }}>
          {pix
            ? 'Se preferir outra forma de pagamento, é só falar com nossa equipe.'
            : emAnalise
              ? 'Recebemos seu pedido. Nossa equipe vai entrar em contato para combinar o pagamento e, depois da confirmação, separar suas peças.'
              : 'Assim que o pagamento for confirmado pelo Mercado Pago, nossa equipe vai preparar seu pedido.'}
        </p>
        <Link href="/" style={{ display: 'inline-block', background: T.goldDk, borderRadius: 12, padding: '14px 36px', color: 'white', textDecoration: 'none', fontSize: 14, fontWeight: 700, letterSpacing: 1 }}>
          Voltar ao catálogo
        </Link>
      </div>
    </div>
  );
}
