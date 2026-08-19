import { useEffect, useRef } from "react";

let scriptPromise = null;
function loadEmbedScript() {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve) => {
    if (window.instgrm) return resolve();
    const script = document.createElement("script");
    script.src = "https://www.instagram.com/embed.js";
    script.async = true;
    script.onload = resolve;
    document.body.appendChild(script);
  });
  return scriptPromise;
}

export default function InstagramEmbed({ url }) {
  const ref = useRef(null);

  useEffect(() => {
    let cancelled = false;
    loadEmbedScript().then(() => {
      if (!cancelled && window.instgrm) window.instgrm.Embeds.process();
    });
    return () => { cancelled = true; };
  }, [url]);

  return (
    <blockquote
      ref={ref}
      className="instagram-media"
      data-instgrm-permalink={url}
      data-instgrm-version="14"
      style={{ margin: "0 auto", maxWidth: 400, minWidth: 280, width: "100%" }}
    />
  );
}
