import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { validateExpense, validateRecurringExpense } from '../../../lib/expenses';

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
      const [expensesRes, recurringRes] = await Promise.all([
        supabaseAdmin.from('expenses').select('id, categoria, subcategoria, valor, data_competencia, data_pagamento, recorrente, observacao, created_at').order('data_competencia', { ascending: false }).limit(200),
        supabaseAdmin.from('recurring_expenses').select('id, categoria, subcategoria, valor, dia_geracao, ativo').order('created_at', { ascending: false }),
      ]);
      if (expensesRes.error) throw expensesRes.error;
      if (recurringRes.error) throw recurringRes.error;
      return res.status(200).json({ ok: true, expenses: expensesRes.data || [], recurring: recurringRes.data || [] });
    }

    if (action === 'criar') {
      let parsed;
      try {
        parsed = validateExpense(req.body || {});
      } catch (e) {
        return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: e.message, details: [] } });
      }

      const { error } = await supabaseAdmin.from('expenses').insert(parsed);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    if (action === 'apagar') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: 'id obrigatório.', details: [] } });

      const { error } = await supabaseAdmin.from('expenses').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    if (action === 'criar_recorrente') {
      let parsed;
      try {
        parsed = validateRecurringExpense(req.body || {});
      } catch (e) {
        return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: e.message, details: [] } });
      }

      const { error } = await supabaseAdmin.from('recurring_expenses').insert(parsed);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    if (action === 'atualizar_recorrente') {
      const { id, ativo } = req.body || {};
      if (!id) return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: 'id obrigatório.', details: [] } });
      if (typeof ativo !== 'boolean') {
        return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: 'ativo obrigatório (true ou false).', details: [] } });
      }

      let parsed;
      try {
        parsed = validateRecurringExpense(req.body || {});
      } catch (e) {
        return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: e.message, details: [] } });
      }

      const { error } = await supabaseAdmin
        .from('recurring_expenses')
        .update({ ...parsed, ativo, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    if (action === 'apagar_recorrente') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: 'id obrigatório.', details: [] } });

      const { error } = await supabaseAdmin.from('recurring_expenses').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: 'action inválida.', details: [] } });
  } catch (err) {
    console.error('Erro na rota de despesas:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Não foi possível processar a operação.', details: [] } });
  }
}
