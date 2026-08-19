import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { validateMove, validateBaixa } from '../../../../lib/defectStock';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST', details: [] } });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Token ausente.', details: [] } });
  }

  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
  if (userErr || !userData?.user) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Sessão inválida ou expirada.', details: [] } });
  }

  const { action, productId } = req.body || {};
  if (!productId || !['listar', 'mover', 'baixar'].includes(action)) {
    return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: 'productId ou action inválido.', details: [] } });
  }

  try {
    if (action === 'listar') {
      const { data, error } = await supabaseAdmin
        .from('defect_stock')
        .select('id, quantity, defect_price, reason, colors(name), sizes(name)')
        .eq('product_id', productId)
        .order('created_at');
      if (error) throw error;
      return res.status(200).json({ ok: true, rows: data || [] });
    }

    if (action === 'mover') {
      const { colorId, sizeId, quantity, defectPrice, reason } = req.body || {};
      if (!colorId || !sizeId) {
        return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: 'Cor e tamanho obrigatórios.', details: [] } });
      }

      const { data: stockRow, error: stockErr } = await supabaseAdmin
        .from('stock')
        .select('id, quantity')
        .eq('product_id', productId).eq('color_id', colorId).eq('size_id', sizeId)
        .single();
      if (stockErr || !stockRow) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Linha de estoque não encontrada.', details: [] } });
      }

      let qty, preco;
      try {
        ({ qty, preco } = validateMove({ availableQty: stockRow.quantity, moveQty: quantity, defectPrice }));
      } catch (e) {
        return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: e.message, details: [] } });
      }

      const { data: updatedStock, error: decErr } = await supabaseAdmin
        .from('stock')
        .update({ quantity: stockRow.quantity - qty })
        .eq('id', stockRow.id)
        .gte('quantity', qty)
        .select('id')
        .single();
      if (decErr || !updatedStock) {
        return res.status(409).json({ error: { code: 'CONFLICT', message: 'Estoque mudou, tente novamente.', details: [] } });
      }

      const { data: existingDefect } = await supabaseAdmin
        .from('defect_stock')
        .select('id, quantity')
        .eq('product_id', productId).eq('color_id', colorId).eq('size_id', sizeId)
        .maybeSingle();

      if (existingDefect) {
        const { error: updErr } = await supabaseAdmin
          .from('defect_stock')
          .update({ quantity: existingDefect.quantity + qty, defect_price: preco, reason: reason || null, updated_at: new Date().toISOString() })
          .eq('id', existingDefect.id);
        if (updErr) throw updErr;
      } else {
        const { error: insErr } = await supabaseAdmin
          .from('defect_stock')
          .insert({ product_id: productId, color_id: colorId, size_id: sizeId, quantity: qty, defect_price: preco, reason: reason || null });
        if (insErr) throw insErr;
      }

      return res.status(200).json({ ok: true });
    }

    // action === 'baixar'
    const { defectStockId, quantity } = req.body || {};
    if (!defectStockId) {
      return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: 'defectStockId obrigatório.', details: [] } });
    }

    const { data: defectRow, error: defectErr } = await supabaseAdmin
      .from('defect_stock')
      .select('id, quantity')
      .eq('id', defectStockId)
      .single();
    if (defectErr || !defectRow) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Lote de defeito não encontrado.', details: [] } });
    }

    let qtyBaixa;
    try {
      qtyBaixa = validateBaixa({ availableQty: defectRow.quantity, baixaQty: quantity });
    } catch (e) {
      return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: e.message, details: [] } });
    }

    const restante = defectRow.quantity - qtyBaixa;
    if (restante === 0) {
      const { error: delErr } = await supabaseAdmin.from('defect_stock').delete().eq('id', defectStockId).eq('quantity', defectRow.quantity);
      if (delErr) throw delErr;
    } else {
      const { data: updatedDefect, error: updErr } = await supabaseAdmin
        .from('defect_stock')
        .update({ quantity: restante, updated_at: new Date().toISOString() })
        .eq('id', defectStockId)
        .eq('quantity', defectRow.quantity)
        .select('id')
        .single();
      if (updErr || !updatedDefect) {
        return res.status(409).json({ error: { code: 'CONFLICT', message: 'Lote mudou, tente novamente.', details: [] } });
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Erro na rota de estoque de defeito:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Não foi possível processar a operação.', details: [] } });
  }
}
