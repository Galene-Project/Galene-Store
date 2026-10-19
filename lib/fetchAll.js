// PostgREST corta cada consulta em max_rows (padrão 1000) sem avisar —
// tabela que passa disso volta truncada e o resto some em silêncio. Pagina
// até vir uma página incompleta. `build(from, to)` monta a query com
// .order(...).range(from, to); ordem estável é obrigatória, senão a
// paginação repete/perde linhas.
// ponytail: assume max_rows >= PAGE; se o projeto baixar max_rows, reduzir PAGE.
const PAGE = 1000;

export async function fetchAll(build, pageSize = PAGE) {
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await build(from, from + pageSize - 1);
    if (error) return { data: null, error };
    rows.push(...(data || []));
    if (!data || data.length < pageSize) return { data: rows, error: null };
  }
}
