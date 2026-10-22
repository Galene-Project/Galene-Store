import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { requireAdmin } from '../../../../lib/requireAdmin';
import { validateEdit, applyBasePrice } from '../../../../lib/productEdit';
import { resolveCategoria } from '../../../../lib/categorias';

// Edita dados de um produto (nome, categoria, material, descrição, preço base) e/ou
// desativa/reativa (`ativo`). Desativado some da loja e dos números do painel;
// estoque e histórico de pedidos ficam intactos.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST', details: [] } });
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const { productId, ativo } = req.body || {};
  if (!productId || (ativo !== undefined && typeof ativo !== 'boolean')) {
    return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: 'productId ou ativo inválido.', details: [] } });
  }

  let campos;
  try {
    campos = validateEdit(req.body);
  } catch (e) {
    return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: e.message, details: [] } });
  }

  try {
    const { data: product, error: prodErr } = await supabaseAdmin
      .from('products')
      .select('id, price, price_original')
      .eq('id', productId)
      .single();
    if (prodErr || !product) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Produto não encontrado.', details: [] } });
    }

    const update = { ...campos };
    if (campos.price !== undefined) {
      delete update.price;
      try {
        Object.assign(update, applyBasePrice(product, campos.price));
      } catch (e) {
        return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: e.message, details: [] } });
      }
    }
    if (campos.category !== undefined) {
      const { data: catRows } = await supabaseAdmin.from('products').select('category');
      update.category = resolveCategoria(campos.category, [...new Set((catRows || []).map((r) => r.category).filter(Boolean))]);
    }
    if (ativo !== undefined) update.is_active = ativo;

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: 'Nada para alterar.', details: [] } });
    }
    update.updated_at = new Date().toISOString();

    const { error: updateErr } = await supabaseAdmin.from('products').update(update).eq('id', productId);
    if (updateErr) throw updateErr;

    return res.status(200).json({ ok: true, product: update });
  } catch (err) {
    console.error('Erro ao editar produto:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Não foi possível salvar o produto.', details: [] } });
  }
}
