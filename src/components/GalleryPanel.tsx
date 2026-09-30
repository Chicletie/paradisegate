import { useState } from "react";
import { SpoilerBlock } from "../lib/markdown";
import type { WikiGalleryItem } from "../types";
import { Lightbox } from "./Lightbox";

/**
 * Porta de buildGalleryPanel na wiki original — imagem sempre inteira (nunca corta),
 * agrupada por `group`; clicar amplia e as setas passam pelas outras. Imagem em spoiler só
 * entra na sequência depois que o leitor a revelou (e clicou nela).
 */
export function GalleryPanel({ gallery, title }: { gallery: WikiGalleryItem[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const [seen, setSeen] = useState<ReadonlySet<number>>(new Set());
  const groups = Array.from(new Set(gallery.map((g) => g.group)));
  const order = groups.flatMap((g) => gallery.map((item, i) => (item.group === g ? i : -1)).filter((i) => i >= 0));
  const shown = order.filter((i) => gallery[i].vis !== "spoiler" || seen.has(i) || i === open);
  const zoom = (i: number) => {
    if (gallery[i].vis === "spoiler") setSeen((s) => new Set(s).add(i));
    setOpen(i);
  };
  return (
    <div className="article">
      {groups.map((g) => (
        <div key={g ?? "__geral"}>
          <div className="gal-grouphead">{g || "Geral"}</div>
          <div className="gal-grid">
            {order
              .filter((i) => gallery[i].group === g)
              .map((i) => {
                const item = gallery[i];
                const alt = item.caption || `${title} — imagem da galeria`;
                const img = <img src={item.url} alt={alt} onClick={() => zoom(i)} />;
                return (
                  <figure key={i} className="gal-item">
                    {item.vis === "spoiler" ? <SpoilerBlock at={item.at}>{img}</SpoilerBlock> : img}
                    {item.caption && <figcaption>{item.caption}</figcaption>}
                  </figure>
                );
              })}
          </div>
        </div>
      ))}
      {open != null && (
        <Lightbox items={shown.map((i) => ({ url: gallery[i].url, caption: gallery[i].caption }))} start={shown.indexOf(open)} onClose={() => setOpen(null)} />
      )}
    </div>
  );
}
