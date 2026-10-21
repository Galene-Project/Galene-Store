// Pix "copia e cola" (BR Code estático do Banco Central) com valor e identificador
// do pedido. Sem gateway: o dinheiro cai direto na chave da loja; quem confirma
// o pagamento continua sendo o operador no painel.

const tlv = (id, value) => `${id}${String(value.length).padStart(2, '0')}${value}`;

// CRC16-CCITT (poly 0x1021, init 0xFFFF), exigido no fim do payload.
export function crc16(str) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

const semAcento = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9 ]/g, '').toUpperCase().trim();

// CPF/CNPJ digitado com pontuação vira só dígitos; e-mail, telefone (+55...) e
// chave aleatória seguem como estão.
export function normalizaChavePix(chave) {
  const c = String(chave || '').trim();
  return /^[\d.\-/\s]+$/.test(c) ? c.replace(/\D/g, '') : c;
}

export function buildPixPayload({ key, name, city, amount, txid }) {
  const chave = normalizaChavePix(key);
  const valor = Number(amount);
  if (!chave || !(valor > 0)) throw new Error('Chave Pix e valor positivo são obrigatórios.');
  const id = String(txid || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || '***';
  const corpo =
    tlv('00', '01') +
    tlv('01', '12') +
    tlv('26', tlv('00', 'BR.GOV.BCB.PIX') + tlv('01', chave)) +
    tlv('52', '0000') +
    tlv('53', '986') +
    tlv('54', valor.toFixed(2)) +
    tlv('58', 'BR') +
    tlv('59', (semAcento(name || '') || 'LOJA').slice(0, 25)) +
    tlv('60', (semAcento(city || '') || 'SAO PAULO').slice(0, 15)) +
    tlv('62', tlv('05', id)) +
    '6304';
  return corpo + crc16(corpo);
}
