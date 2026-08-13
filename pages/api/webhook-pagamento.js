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
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('id, status')
        .eq('id', orderId)
        .single();

      if (order && order.status !== 'pago') {
        await supabaseAdmin
          .from('orders')
          .update({ status: 'pago', payment_id: String(paymentId) })
          .eq('id', orderId);

        const { data: items } = await supabaseAdmin
          .from('order_items')
          .select('product_id, color_id, size_id, quantity')
          .eq('order_id', orderId);

        for (const item of items || []) {
          const { data: stockRow } = await supabaseAdmin
            .from('stock')
            .select('id, quantity')
            .eq('product_id', item.product_id)
            .eq('color_id', item.color_id)
            .eq('size_id', item.size_id)
            .single();
          if (stockRow) {
            await supabaseAdmin
              .from('stock')
              .update({ quantity: Math.max(0, stockRow.quantity - item.quantity) })
              .eq('id', stockRow.id);
          }
        }
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
