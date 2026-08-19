// Identidade visual real da Galene (portada do Galene_2.0/src/lib/data.js).
// Dado de produto NÃO fica aqui — vem do Supabase (ver components/store/GaleneStore.jsx).

export const T = {
  bg: "#FAFAF8", bg2: "#F4F1EC", bg3: "#EDE8E0", panel: "#FFFFFF",
  border: "#E0D8CC", border2: "#C8BFB0",
  gold: "#B8935A", goldDk: "#8A6A38", goldLt: "#D4B07A", goldXlt: "#F5EDD8",
  ink: "#1A1714", ink2: "#3A3530", ink3: "#6A6058", ink4: "#7A726B",
  ruby: "#8B3A3A", jade: "#3A6B4A",
};

export const fmt = (v) => "R$ " + Number(v).toFixed(2).replace(".", ",");

export const COR_HEX = {
  Preto: "#1A1A1A", Branco: "#F5F2EE", OffWhite: "#EEEADE",
  Vinho: "#6B2737", Marinho: "#1E3A5F", Nude: "#C4A882",
  Bege: "#C8B89A", Caramelo: "#B5743A", Rosa: "#E8A0A0",
  Vermelho: "#8B2020", Laranja: "#C97A3A", Amarelo: "#D4A82A",
  Azul: "#3A6B9E", Verde: "#4A6B3A", Cinza: "#8A8A8A",
  Grafite: "#484848", Marrom: "#6B4226", Jeans: "#3A5A7A",
  Colorido: "#B8935A", Lilas: "#9B7EC8", Coral: "#E07A5F",
  Musgo: "#5C6B3A", Terracota: "#C16A3A",
  "Azul Marinho": "#000080", Roxo: "#800080",
};

export const CATS = [
  { id: "destaques",   label: "Destaques",   icon: "✦" },
  { id: "lancamentos", label: "Lançamentos", icon: "▶" },
  { id: "promocoes",   label: "Promoções",   icon: "🏷" },
  { id: "Vestidos",  label: "Vestidos",  icon: "+" },
  { id: "Moletinho", label: "Moletinho", icon: "+" },
  { id: "Lanzinha",  label: "Lanzinha",  icon: "+" },
  { id: "Conjuntos", label: "Conjuntos", icon: "+" },
  { id: "Blusas",    label: "Blusas",    icon: "›" },
  { id: "Regatas",   label: "Regatas",   icon: "v" },
  { id: "Cardigans", label: "Cardigans", icon: "o" },
  { id: "Calcas",    label: "Calcas",    icon: "=" },
  { id: "Macacoes",  label: "Macacoes",  icon: "o" },
];

const SIZE_ORDER = ["P", "M", "G", "GG", "XG", "XGG", "XXG", "Unico"];
export function sortSizes(sizes) {
  return [...sizes].sort((a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b));
}
