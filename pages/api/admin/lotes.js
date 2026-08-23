import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { validateProductionRun, validateProdutoBasico, validateDistribuicao } from '../../../lib/productionRun';
import { computeVariantCodes } from '../../../lib/barcode';

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

  const { action } = req.body || {};

  try {
    if (action === 'listar') {
      const { data, error } = await supabaseAdmin
        .from('production_runs')
        .select('id, product_id, custo_total, quantidade_produzida, quantidade_distribuida, data, products(name)')
        .order('data', { ascending: false })
        .limit(100);
      if (error) throw error;
      return res.status(200).json({ ok: true, rows: data || [] });
    }

    if (action === 'criar') {
      const { product_id, novo_produto, custo_total, quantidade_produzida, data } = req.body || {};

      let parsedRun;
      try {
        parsedRun = validateProductionRun({ custo_total, quantidade_produzida, data });
      } catch (e) {
        return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: e.message, details: [] } });
      }

      let productId = product_id;

      if (!productId) {
        let parsedProduto;
        try {
          parsedProduto = validateProdutoBasico(novo_produto || {});
        } catch (e) {
          return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: e.message, details: [] } });
        }

        const sku = `AUTO-${Date.now().toString(36).toUpperCase()}`;
        const { data: novoProduto, error: prodErr } = await supabaseAdmin
          .from('products')
          .insert({ name: parsedProduto.name, category: parsedProduto.category, price: parsedProduto.price, sku, is_active: false })
          .select('id')
          .single();
        if (prodErr) throw prodErr;
        productId = novoProduto.id;
      } else {
        const { data: existingProduct, error: checkErr } = await supabaseAdmin.from('products').select('id').eq('id', productId).maybeSingle();
        if (checkErr) throw checkErr;
        if (!existingProduct) {
          return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Produto não encontrado.', details: [] } });
        }
      }

      const { data: run, error: runErr } = await supabaseAdmin
        .from('production_runs')
        .insert({
          product_id: productId,
          custo_total: parsedRun.custo_total,
          quantidade_produzida: parsedRun.quantidade_produzida,
          data: parsedRun.data,
        })
        .select('id')
        .single();
      if (runErr) {
        if (!product_id) {
          await supabaseAdmin.from('products').delete().eq('id', productId);
        }
        throw runErr;
      }

      return res.status(200).json({ ok: true, productionRunId: run.id, productId, custoUnitario: parsedRun.custo_unitario });
    }

    if (action === 'distribuir') {
      const { production_run_id, distribuicao } = req.body || {};
      if (!production_run_id) {
        return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: 'production_run_id obrigatório.', details: [] } });
      }

      const { data: run, error: runErr } = await supabaseAdmin
        .from('production_runs')
        .select('quantidade_produzida, quantidade_distribuida, product_id')
        .eq('id', production_run_id)
        .single();
      if (runErr || !run) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Lote não encontrado.', details: [] } });
      }

      const disponivel = run.quantidade_produzida - run.quantidade_distribuida;
      try {
        validateDistribuicao(distribuicao, disponivel);
      } catch (e) {
        return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: e.message, details: [] } });
      }

      const { data: product, error: productErr } = await supabaseAdmin
        .from('products')
        .select('sku')
        .eq('id', run.product_id)
        .single();
      if (productErr) throw productErr;

      const codedDistribuicao = computeVariantCodes(product.sku, distribuicao);
      const p_items = codedDistribuicao.map((d) => ({ color_id: d.color_id, size_id: d.size_id, quantity: d.quantity, barcode: d.code }));

      const { error: rpcErr } = await supabaseAdmin.rpc('distribute_production_run', {
        p_run_id: production_run_id,
        p_items,
      });
      if (rpcErr) throw rpcErr;

      await supabaseAdmin.from('products').update({ is_active: true }).eq('id', run.product_id);

      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: 'action inválida.', details: [] } });
  } catch (err) {
    console.error('Erro na rota de lotes:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Não foi possível processar a operação.', details: [] } });
  }
}
