import { useState, useEffect, useRef } from "react";

// Ativa o card quando ele fica visível na tela — equivalente ao hover
// do desktop, mas pra mobile (que não tem hover). threshold 0.3: card
// precisa estar pelo menos 30% visível pra contar como "em foco",
// evita ativar vídeo de um card que só apareceu 1px na borda da tela.
export function useInView() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return [ref, inView];
}
