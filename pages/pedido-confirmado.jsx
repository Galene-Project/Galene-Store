import { useRouter } from 'next/router';
import Link from 'next/link';
import { T } from '../lib/galeneTheme';

export default function PedidoConfirmado() {
  const router = useRouter();
  const { numero } = router.query;

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Lato',sans-serif", padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ width: 72, height: 72, background: `linear-gradient(135deg,${T.goldDk},${T.gold})`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, color: T.goldDk, margin: '0 0 12px' }}>Pedido recebido!</h1>
        {numero && (
          <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 12, color: T.ink4, marginBottom: 12 }}>Nº {numero}</p>
        )}
        <p style={{ fontSize: 13, color: T.ink3, lineHeight: 1.7, marginBottom: 32 }}>
          Assim que o pagamento for confirmado pelo Mercado Pago, nossa equipe vai preparar seu pedido.
        </p>
        <Link href="/" style={{ display: 'inline-block', background: T.goldDk, borderRadius: 12, padding: '14px 36px', color: 'white', textDecoration: 'none', fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>
          Voltar ao catálogo
        </Link>
      </div>
    </div>
  );
}
