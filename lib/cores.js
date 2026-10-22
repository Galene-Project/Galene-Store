// Cor nova do cadastro: nome sem duplicar (ignora maiúscula/acento) e hex #RRGGBB.
const chave = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function validateCor({ name, hex }, existentes = []) {
  const nome = String(name || '').trim().replace(/\s+/g, ' ');
  if (!nome) throw new Error('Nome da cor obrigatório.');
  if (nome.length > 30) throw new Error('Nome da cor muito longo (máx. 30).');
  if (!/^#[0-9A-Fa-f]{6}$/.test(String(hex || ''))) throw new Error('Cor inválida (use o formato #RRGGBB).');
  if (existentes.some((e) => chave(e) === chave(nome))) throw new Error('Essa cor já existe.');
  return { name: nome, hex: hex.toUpperCase() };
}

// Tons por nome vindos do banco (colors.hex_code) — fonte única de cor da loja.
export function mapaDeCores(linhas) {
  const mapa = {};
  for (const c of linhas || []) {
    if (c?.name && /^#[0-9A-Fa-f]{6}$/.test(c.hex_code || '')) mapa[c.name] = c.hex_code;
  }
  return mapa;
}
