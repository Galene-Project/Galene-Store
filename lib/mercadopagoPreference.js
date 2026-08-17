import { Preference } from 'mercadopago';
import { mpClient } from './mercadopago';

export async function createOrderPreference(order, items, origin) {
  const preference = new Preference(mpClient);
  return preference.create({
    body: {
      items: items.map((i) => ({
        title: `${i.nome} — ${i.cor}/${i.tam}`,
        quantity: i.quantity,
        unit_price: i.unitPrice,
        currency_id: 'BRL',
      })),
      external_reference: order.id,
      back_urls: {
        success: `${origin}/pedido-confirmado?numero=${order.order_number}`,
        pending: `${origin}/pedido-confirmado?numero=${order.order_number}`,
        failure: `${origin}/`,
      },
      auto_return: 'approved',
      notification_url: `${origin}/api/webhook-pagamento`,
    },
  });
}
