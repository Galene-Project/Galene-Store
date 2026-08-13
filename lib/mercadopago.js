import { MercadoPagoConfig } from 'mercadopago';

// Server-only — o access token nunca deve chegar no client.
export const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});
