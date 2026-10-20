import React from "react";

// Ícones de contorno, 16px, traço 1.5 — um só conjunto para a navegação e
// poucos controles (nunca em círculo colorido nem em card).
const PATHS = {
  overview: "M4 5h6v6H4zM14 5h6v4h-6zM14 13h6v6h-6zM4 15h6v4H4z",
  compass: "M12 3a9 9 0 100 18 9 9 0 000-18zM15.5 8.5l-2 5-5 2 2-5z",
  trend: "M3 17l6-6 4 4 7-8M15 7h5v5",
  box: "M12 3l8 4v10l-8 4-8-4V7zM4 7l8 4 8-4M12 11v10",
  tag: "M3 12V4h8l9 9-8 8zM8 8h.01",
  bag: "M5 8h14l-1 12H6zM9 8V6a3 3 0 016 0v2",
  users: "M9 11a3 3 0 100-6 3 3 0 000 6zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 5.5a3 3 0 010 5.8M18 14.5c1.9.7 3 2.5 3 5.5",
  receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6",
  wallet: "M4 7h15a1 1 0 011 1v10a1 1 0 01-1 1H5a1 1 0 01-1-1zM4 7l2-3h11M16 13.5h.01",
  chart: "M5 20V10M12 20V4M19 20v-7",
  store: "M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9a2.7 2.7 0 005.3 0 2.7 2.7 0 005.4 0A2.7 2.7 0 0020 9M10 20v-5h4v5",
  cash: "M3 7h18v10H3zM12 14.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
  sun: "M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  moon: "M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z",
  out: "M9 4H5v16h4M16 8l4 4-4 4M20 12H9",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6L6 18",
  refresh: "M20 11a8 8 0 10-2.3 5.7M20 5v6h-6",
  download: "M12 4v11M7 11l5 5 5-5M5 20h14",
};

export default function Icon({ name, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name] || PATHS.overview} />
    </svg>
  );
}
