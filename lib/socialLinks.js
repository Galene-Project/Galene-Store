function isUrl(v) {
  return /^https?:\/\//.test(v || "");
}

export function buildInstagramLink(v) {
  if (!v) return null;
  if (isUrl(v)) return v;
  return `https://instagram.com/${v.replace(/^@/, "")}`;
}

export function buildFacebookLink(v) {
  if (!v) return null;
  if (isUrl(v)) return v;
  return `https://facebook.com/${v.replace(/^@/, "")}`;
}

export function buildWhatsappLink(v) {
  if (!v) return null;
  if (isUrl(v)) return v;
  const digits = v.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}
