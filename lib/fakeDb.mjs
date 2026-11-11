// Banco falso em memória para testar rotas de API sem Supabase.
// Imita só o que as rotas usam: select/insert/update/delete com eq/in/order/limit/single e rpc.
// Não é um arquivo de teste (não termina em .test.mjs).
let seq = 0;

export function fakeDb(tables = {}, { rpc = {}, falhar = [] } = {}) {
  const t = Object.fromEntries(Object.entries(tables).map(([k, v]) => [k, v.map((r) => ({ ...r }))]));
  for (const nome of ['orders', 'order_items', 'customers']) t[nome] ??= [];
  const chamadas = [];

  function from(nome) {
    t[nome] ??= [];
    const q = { op: 'select', filtros: [], unico: false, payload: null };
    const b = {
      select: () => b,
      insert: (p) => { q.op = 'insert'; q.payload = [].concat(p); return b; },
      update: (p) => { q.op = 'update'; q.payload = p; return b; },
      delete: () => { q.op = 'delete'; return b; },
      eq: (c, v) => { q.filtros.push((r) => r[c] === v); return b; },
      in: (c, vs) => { q.filtros.push((r) => vs.includes(r[c])); return b; },
      gte: (c, v) => { q.filtros.push((r) => r[c] >= v); return b; },
      order: () => b,
      limit: () => b,
      single: () => { q.unico = 'single'; return b; },
      maybeSingle: () => { q.unico = 'maybe'; return b; },
      then: (ok, ko) => Promise.resolve(exec()).then(ok, ko),
    };
    function exec() {
      chamadas.push(`${nome}.${q.op}`);
      if (falhar.includes(`${nome}.${q.op}`)) return { data: null, error: new Error(`falha simulada em ${nome}.${q.op}`) };
      let rows;
      if (q.op === 'insert') {
        rows = q.payload.map((p) => ({ id: `id${++seq}`, created_at: new Date().toISOString(), ...p }));
        t[nome].push(...rows);
      } else {
        rows = t[nome].filter((r) => q.filtros.every((f) => f(r)));
        if (q.op === 'update') rows.forEach((r) => Object.assign(r, q.payload));
        if (q.op === 'delete') t[nome] = t[nome].filter((r) => !rows.includes(r));
      }
      if (q.unico === 'single') return rows[0] ? { data: rows[0], error: null } : { data: null, error: { code: 'PGRST116', message: 'sem linha' } };
      if (q.unico === 'maybe') return { data: rows[0] ?? null, error: null };
      return { data: rows, error: null };
    }
    return b;
  }

  return {
    from,
    rpc: async (nome, args) => {
      chamadas.push(`rpc.${nome}`);
      const fn = rpc[nome];
      return fn ? fn(args, t) : { data: null, error: new Error(`rpc sem simulação: ${nome}`) };
    },
    auth: { getUser: async (token) => (token === 'admin-ok' || token === 'user-comum' ? { data: { user: { id: token } } } : { error: {} }) },
    tabelas: t,
    chamadas,
  };
}

export const resFalso = () => {
  const r = { status(s) { r.s = s; return r; }, json(b) { r.b = b; return r; } };
  return r;
};
