import { useState, useEffect } from "react";
import { advanceCycle } from "../lib/mediaCycle";

// Cicla pelos itens de `media` enquanto `active` for true (hover no
// desktop, visível na tela no mobile). Ao ficar inativo, reseta pro
// primeiro item — card nunca fica "parado no meio do ciclo" depois
// que o mouse sai ou ele sai da tela.
export function useMediaCycle(media, active, intervalMs = 3000) {
  const [index, setIndex] = useState(0);
  const length = media?.length || 0;

  useEffect(() => {
    if (!active) {
      setIndex(0);
      return;
    }
    if (length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => advanceCycle(i, length));
    }, intervalMs);
    return () => clearInterval(id);
  }, [active, length, intervalMs]);

  return { index, item: media?.[index] || null };
}
