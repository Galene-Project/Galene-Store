import { NAO_CONTA_RECEITA } from './orderStatus.js';
import { toISODate } from './dashboardMetrics.js';
import { normalizePhone } from './customers.js';

const MS_DIA = 24 * 60 * 60 * 1000;
export const DIAS_INATIVO = 60;

// Uma linha por cliente cadastrado, com o que importa pra remarketing:
// quantas compras reais (pedido cancelado/aguardando não conta, mesma regra
// do resto do painel), quanto gastou e há quantos dias não compra.
export function resumoClientes(customers, orders, agora = new Date()) {
  const porCliente = new Map();
  for (const o of orders) {
    if (!o.customer_id || NAO_CONTA_RECEITA.has(o.status)) continue;
    const e = porCliente.get(o.customer_id) || { compras: 0, gasto: 0, ultima: null };
    e.compras += 1;
    e.gasto += Number(o.total || 0);
    const d = o.paid_at || o.created_at;
    if (d && (!e.ultima || new Date(d) > new Date(e.ultima))) e.ultima = d;
    porCliente.set(o.customer_id, e);
  }

  return customers.map((c) => {
    const e = porCliente.get(c.id) || { compras: 0, gasto: 0, ultima: null };
    const ultima = e.ultima ? new Date(e.ultima) : null;
    return {
      id: c.id,
      nome: c.company_name || c.name || '—',
      telefone: c.phone || '',
      email: c.email || '',
      cnpj: c.cnpj || '',
      compras: e.compras,
      gasto: e.gasto,
      ultimaCompra: ultima ? toISODate(ultima) : null,
      diasSemComprar: ultima ? Math.floor((agora - ultima) / MS_DIA) : null,
      cadastro: c.created_at || null,
    };
  });
}

export function filtrarClientes(rows, { busca = '', segmento = 'todos' } = {}) {
  const q = busca.trim().toLowerCase();
  const qTel = normalizePhone(busca);
  return rows.filter((r) => {
    if (q) {
      const bateTexto = r.nome.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
      const bateTel = qTel && normalizePhone(r.telefone).includes(qTel);
      if (!bateTexto && !bateTel) return false;
    }
    if (segmento === 'recorrentes') return r.compras >= 2;
    if (segmento === 'inativos') return r.diasSemComprar !== null && r.diasSemComprar >= DIAS_INATIVO;
    if (segmento === 'sem_compra') return r.compras === 0;
    if (segmento === 'sem_email') return !r.email;
    return true;
  });
}

// wa.me exige número com DDI. Cadastro guarda só dígitos (DDD+número);
// 10/11 dígitos = BR sem DDI.
export function whatsappLink(telefone) {
  const d = normalizePhone(telefone);
  if (d.length < 10) return null;
  return `https://wa.me/${d.length <= 11 ? `55${d}` : d}`;
}

// Nome/e-mail vêm de formulário público: célula começando com = + - @ vira
// fórmula no Excel/Sheets (injeção de CSV). Prefixa com apóstrofo.
function celula(v) {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// ';' e BOM: Excel pt-BR abre em colunas e com acento certo.
export function clientesParaCsv(rows) {
  const cab = ['Nome', 'Telefone', 'E-mail', 'CNPJ', 'Compras', 'Total gasto', 'Última compra', 'Dias sem comprar'];
  const linhas = rows.map((r) => [
    r.nome, r.telefone, r.email, r.cnpj, r.compras,
    r.gasto.toFixed(2).replace('.', ','),
    r.ultimaCompra ? r.ultimaCompra.split('-').reverse().join('/') : '',
    r.diasSemComprar ?? '',
  ].map(celula).join(';'));
  return '﻿' + [cab.join(';'), ...linhas].join('\r\n');
}
