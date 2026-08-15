import { useState, useEffect } from "react";

export function useWindowWidth() {
  // Sempre 1400 no primeiro render (server e client) — ler window.innerWidth
  // aqui divergia SSR de CSR e causava o erro de hidratação #418/#423.
  const [w, setW] = useState(1400);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    fn();
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return w;
}
