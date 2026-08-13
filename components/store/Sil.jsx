import { T } from "../../lib/galeneTheme";

export default function Sil({ cat, cor = T.gold, sz = 160 }) {
  const lightColors = ["#F5F2EE", "#EEEADE", "#C4A882", "#C8B89A", "#D4A82A", "#E8A0A0"];
  const isLight = lightColors.includes(cor);
  const p = { fill: cor, stroke: isLight ? "#C0A880" : "none", strokeWidth: 0.5 };
  const accent = "rgba(184,147,90,0.3)";

  if (["Blusas", "Regatas", "Cardigans"].includes(cat)) return (
    <svg width={sz} height={sz} viewBox="0 0 200 185" style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.12))" }}>
      <path d="M36 59C68 47 90 64 100 64C110 64 132 47 164 59L174 97L152 92L152 158L48 158L48 92L26 97Z" {...p} />
      <ellipse cx="100" cy="34" rx="19" ry="22" fill="none" stroke={isLight ? "#B0906A" : accent} strokeWidth="1.5" />
    </svg>
  );

  if (cat === "Conjuntos") return (
    <svg width={sz} height={sz} viewBox="0 0 200 245" style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.12))" }}>
      <path d="M79 55C63 62 48 75 45 95L48 122L152 122L155 95C152 75 137 62 121 55C112 65 88 65 79 55Z" {...p} />
      <path d="M79 55C68 48 43 45 34 60L41 97C54 93 58 82 67 76Z" {...p} opacity=".7" />
      <path d="M121 55C132 48 157 45 166 60L159 97C146 93 142 82 133 76Z" {...p} opacity=".7" />
      <path d="M64 129L57 235L91 235L101 173L111 235L143 235L136 129Z" {...p} opacity=".92" />
      <ellipse cx="100" cy="30" rx="17" ry="19" fill="none" stroke={isLight ? "#B0906A" : accent} strokeWidth="1.5" />
    </svg>
  );

  if (cat === "Macacoes") return (
    <svg width={sz} height={sz} viewBox="0 0 200 255" style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.12))" }}>
      <path d="M79 55C61 62 44 78 41 100L44 134C58 130 66 120 74 111L77 142L66 250L91 250L101 185L111 250L134 250L123 142L126 111C134 120 142 130 156 134L159 100C156 78 139 62 121 55C112 65 88 65 79 55Z" {...p} />
      <path d="M79 55C67 48 42 44 33 60L39 100C52 96 57 84 66 77Z" {...p} opacity=".7" />
      <path d="M121 55C133 48 158 44 167 60L161 100C148 96 143 84 134 77Z" {...p} opacity=".7" />
      <ellipse cx="100" cy="30" rx="17" ry="19" fill="none" stroke={isLight ? "#B0906A" : accent} strokeWidth="1.5" />
    </svg>
  );

  if (cat === "Calcas") return (
    <svg width={sz} height={sz} viewBox="0 0 200 248" style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.12))" }}>
      <rect x="43" y="20" width="114" height="21" rx="3" {...p} />
      <path d="M50 41L150 41L158 128L126 128L113 248L87 248L74 128L42 128Z" {...p} />
    </svg>
  );

  return (
    <svg width={sz} height={sz} viewBox="0 0 200 250" style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.12))" }}>
      <path d="M77 61C60 68 43 83 39 108L43 140C61 135 69 127 77 117L81 150L70 235L130 235L119 150L123 117C131 127 139 135 157 140L161 108C157 83 140 68 123 61C114 71 86 71 77 61Z" {...p} />
      <path d="M77 61C65 54 40 51 31 67L37 104C53 100 59 87 68 80Z" {...p} opacity=".7" />
      <path d="M123 61C135 54 160 51 169 67L163 104C147 100 141 87 132 80Z" {...p} opacity=".7" />
      <ellipse cx="100" cy="33" rx="19" ry="22" fill="none" stroke={isLight ? "#B0906A" : accent} strokeWidth="1.5" />
    </svg>
  );
}
