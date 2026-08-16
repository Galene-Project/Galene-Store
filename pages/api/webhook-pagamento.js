import { Payment } from 'mercadopago';
import { mpClient } from '../../lib/mercadopago';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

// Não confiamos no corpo da notificação (qualquer um pode forjar um POST
// pra essa URL). Em vez de validar assinatura, buscamos o pagamento de
// volta na API do Mercado Pago usando nosso próprio access token — só
// quem tem a chave real consegue ver esse pagamento, então essa consulta
// já autentica a origem.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).end();

  const paymentId = req.body?.data?.id || req.query['data.id'];
  const type = req.body?.type || req.query.type;
  if (type !== 'payment' || !paymentId) return res.status(200).end();

  try {
    const payment = new Payment(mpClient);
    const info = await payment.get({ id: paymentId });

    const orderId = info.external_reference;
    if (!orderId) return res.status(200).end();

    if (info.status === 'approved') {
      // Marcar como pago e baixar o estoque acontecem dentro de uma função
      // Postgres só (`claim_payment_and_decrement_stock`), logo numa transação
      // só. Duas coisas dependem disso:
      //   1. O Mercado Pago reenvia notificação; o update condicional lá dentro
      //      (`status <> 'pago'`) faz o banco arbitrar quem ganha a transição,
      //      então o estoque não é decrementado duas vezes.
      //   2. Se faltar saldo, o CHECK (quantity >= 0) estoura e reverte tudo,
      //      inclusive o status. A versão anterior fazia
      //      `Math.max(0, quantity - pedido)` aqui no JS: uma venda de 5 sobre
      //      um estoque de 2 zerava a linha e perdia as 3 restantes, e o
      //      cancelamento depois devolvia as 5 cheias — estoque terminava com
      //      3 peças inexistentes, sem nenhum erro em lugar nenhum.
      // A prevenção de verdade é o checkout recusar antes (ver
      // `lib/stock.js`); isso aqui é a rede embaixo, pra corrida entre dois
      // pedidos simultâneos disputando as últimas peças.
      const { data: resultado, error: rpcErr } = await supabaseAdmin.rpc(
        'claim_payment_and_decrement_stock',
        { p_order_id: orderId, p_payment_id: String(paymentId) },
      );
      if (rpcErr) throw rpcErr;
      if (resultado === 'already_paid') {
        console.log(`Webhook repetido pro pedido ${orderId}, ignorado.`);
      }
    } else if (['rejected', 'cancelled'].includes(info.status)) {
      await supabaseAdmin.from('orders').update({ status: 'cancelado' }).eq('id', orderId);
    }

    return res.status(200).end();
  } catch (err) {
    console.error('Erro no webhook de pagamento:', err);
    // Sempre 200 pro Mercado Pago não ficar re-tentando um erro que não
    // vai se resolver sozinho; o log acima é o que importa pra debugar.
    return res.status(200).end();
  }
}
