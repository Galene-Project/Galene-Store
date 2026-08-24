export function validateColorPhotos(entries) {
  if (!Array.isArray(entries)) return [];
  const result = [];
  for (const entry of entries) {
    if (!entry?.color_id) {
      throw new Error('Cada item precisa de color_id.');
    }
    const url = (entry.photo_url || '').trim();
    if (!url) continue;
    if (!/^https?:\/\//.test(url)) {
      throw new Error(`URL de foto inválida pra cor ${entry.color_id} — precisa começar com http:// ou https://.`);
    }
    result.push({ color_id: entry.color_id, photo_url: url });
  }
  return result;
}

export function buildCarouselItems(media, coresFotos, cor) {
  const fotoCor = coresFotos?.[cor];
  if (!fotoCor) return media;
  return [{ type: 'image', url: fotoCor }, ...media];
}
