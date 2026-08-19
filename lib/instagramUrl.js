export function validateInstagramUrl(url) {
  const trimmed = (url || "").trim();
  if (!trimmed) return null;
  if (!/^https:\/\/(www\.)?instagram\.com\/(p|reel)\//.test(trimmed)) {
    throw new Error("Link precisa ser um post ou reel do Instagram (instagram.com/p/... ou /reel/...).");
  }
  return trimmed;
}

export function validateInstagramUrls(urls) {
  if (!Array.isArray(urls)) return [];
  return urls.map((u) => validateInstagramUrl(u)).filter((u) => u != null);
}

export function isReelUrl(url) {
  return /^https:\/\/(www\.)?instagram\.com\/reel\//.test(url || '');
}

// Vídeo (reel) sempre antes de post de foto, preservando a ordem dentro de cada grupo.
export function sortVideoFirst(urls) {
  if (!Array.isArray(urls)) return [];
  return [...urls].sort((a, b) => Number(isReelUrl(b)) - Number(isReelUrl(a)));
}
