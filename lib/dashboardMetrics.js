import { NAO_CONTA_RECEITA } from './orderStatus.js';

const MS_POR_DIA = 24 * 60 * 60 * 1000;

function pctVariacao(atual, anterior) {
  if (!anterior) return null;
  return Math.round(((atual - anterior) / anterior) * 100);
}

export function comparativoMensal(atual, anterior) {
  return {
    faturamentoPct: pctVariacao(atual.valor, anterior.valor),
    pedidosPct: pctVariacao(atual.pedidos, anterior.pedidos),
  };
}

export function rankClientes(pedidos, limite = 10) {
  const porCliente = new Map();
  for (const p of pedidos) {
    if (NAO_CONTA_RECEITA.has(p.status)) continue;
    const entry = porCliente.get(p.customerId) || { nome: p.nome, totalGasto: 0, totalPedidos: 0 };
    entry.totalGasto += p.total;
    entry.totalPedidos += 1;
    porCliente.set(p.customerId, entry);
  }
  return [...porCliente.values()]
    .sort((a, b) => b.totalGasto - a.totalGasto)
    .slice(0, limite);
}

export function produtosParados(vendas, diasLimite = 60, agora = new Date()) {
  return vendas
    .filter((v) => {
      if (!v.ultimaVenda) return true;
      const dias = Math.floor((agora - v.ultimaVenda) / MS_POR_DIA);
      return dias >= diasLimite;
    })
    .map((v) => ({
      produto: v.produto,
      estoqueTotal: v.estoqueTotal,
      diasSemVenda: v.ultimaVenda ? Math.floor((agora - v.ultimaVenda) / MS_POR_DIA) : null,
    }));
}

export function lucroLiquido({ faturamento, cogs, despesas }) {
  return faturamento - cogs - despesas;
}

export function pontoEquilibrio(despesaFixaMensal, faturamentoMesCorrente) {
  const falta = despesaFixaMensal - faturamentoMesCorrente;
  return { meta: despesaFixaMensal, falta: Math.max(0, falta), coberto: falta <= 0 };
}
