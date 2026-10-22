import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { fetchAll } from "../lib/fetchAll";
import { buildCatalogo } from "../lib/catalogo";
import { registrarCores } from "../lib/galeneTheme";
import { mapaDeCores } from "../lib/cores";

// Busca catálogo + status público de estoque + configurações da loja.
// Usado pela vitrine e pelo balcão (/admin/venda). `enabled=false` adia a
// busca (balcão só busca depois do login).
export function useCatalogo({ enabled = true } = {}) {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [minOrder, setMinOrder] = useState(6);
  const [redes, setRedes] = useState({ whatsapp: null, instagram: null, facebook: null });

  const refetch = useCallback(async () => {
    if (!enabled) return;
    const [produtosRes, statusRes, { data: settingsRow }] = await Promise.all([
      fetchAll((a, b) => supabase
        .from("products")
        .select(`
          id, name, category, material, price, price_original, discount_percentage, description, featured, tag, instagram_urls, is_launch,
          product_colors ( colors ( name, hex_code ), photo_url ),
          stock ( color_id, size_id, colors ( name ), sizes ( name ) ),
          product_media ( type, url )
        `)
        .eq("is_active", true)
        .order("id")
        .range(a, b)),
      fetchAll((a, b) => supabase
        .from("estoque_status_publico")
        .select("product_id, color_id, size_id, status")
        .order("product_id").order("color_id").order("size_id")
        .range(a, b)),
      supabase.from("store_settings").select("min_order, whatsapp, instagram, facebook").limit(1).single(),
    ]);
    if (produtosRes.error) { console.error("Erro ao buscar produtos:", produtosRes.error); setLoading(false); return; }
    // Sem status, toda variante cairia em "ok" (parece disponível) — melhor
    // não mostrar a vitrine do que mostrar estoque falso.
    if (statusRes.error) { console.error("Erro ao buscar status de estoque:", statusRes.error); setLoading(false); return; }

    if (settingsRow?.min_order) setMinOrder(settingsRow.min_order);
    if (settingsRow) setRedes({ whatsapp: settingsRow.whatsapp, instagram: settingsRow.instagram, facebook: settingsRow.facebook });
    registrarCores(mapaDeCores(produtosRes.data.flatMap((p) => p.product_colors.map((pc) => pc.colors))));
    setProdutos(buildCatalogo(produtosRes.data, statusRes.data));
    setLoading(false);
  }, [enabled]);

  useEffect(() => { refetch(); }, [refetch]);

  return { produtos, loading, minOrder, redes, refetch };
}
