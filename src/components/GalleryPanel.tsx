import { useState } from "react";
import { SpoilerBlock } from "../lib/markdown";
import type { WikiGalleryItem } from "../types";

/**
 * Porta de buildGalleryPanel em wiki-core.js (arvore) — imagem sempre inteira (nunca corta),
 * agrupada por `group`, com lightbox simples ao clicar.
 */
export function GalleryPanel({ gallery, title }: { gallery: WikiGalleryItem[]; title: string }) {
  const [lightbox, setLightbox] = useState<{ url: string; caption?: string } | null>(null);
  const groups = Array.from(new Set(gallery.map((g) => g.group)));
  return (
    <div className="article">
      {groups.map((g) => (
        <div key={g ?? "__geral"}>
          <div className="gal-grouphead">{g || "Geral"}</div>
          <div className="gal-grid">
            {gallery
              .filter((item) => item.group === g)
              .map((item, i) => {
                const alt = item.caption || `${title} — imagem da galeria`;
                return (
                  <figure key={i} className="gal-item">
                    {item.vis === "spoiler" ? (
                      <SpoilerBlock>
                        <img src={item.url} alt={alt} />
                      </SpoilerBlock>
                    ) : (
                      <img src={item.url} alt={alt} onClick={() => setLightbox({ url: item.url, caption: item.caption })} />
                    )}
                    {item.caption && <figcaption>{item.caption}</figcaption>}
                  </figure>
                );
              })}
          </div>
        </div>
      ))}
      {lightbox && (
        <div className="wb-lightbox" onClick={() => setLightbox(null)}>
          <img src={lightbox.url} alt={lightbox.caption || ""} />
        </div>
      )}
    </div>
  );
}
