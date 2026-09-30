import { useEffect, useRef, useState } from "react";

export interface LightboxItem {
  url: string;
  caption?: string;
}

/**
 * Imagem ampliada por cima da página (galeria, retrato da ficha, figura do texto). Mostra a
 * imagem inteira, com a legenda embaixo; com mais de uma, setas (e ← →) passam entre elas.
 * Esc, o ✕ ou um toque fora fecham. Quem chama decide a lista: imagem em spoiler só entra
 * depois de revelada.
 */
export function Lightbox({ items, start = 0, onClose }: { items: LightboxItem[]; start?: number; onClose: () => void }) {
  const [i, setI] = useState(Math.min(Math.max(start, 0), Math.max(items.length - 1, 0)));
  const closeRef = useRef<HTMLButtonElement>(null);
  const many = items.length > 1;
  const go = (d: number) => setI((n) => (n + d + items.length) % items.length);
  useEffect(() => {
    const back = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    function onKey(ev: KeyboardEvent) {
      if (ev.key === "Escape") onClose();
      else if (many && ev.key === "ArrowRight") go(1);
      else if (many && ev.key === "ArrowLeft") go(-1);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      back?.focus?.();
    };
    // uma vez por abertura: quem chama fecha desmontando
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const it = items[i];
  if (!it) return null;
  return (
    <div className="wb-lightbox" role="dialog" aria-modal="true" aria-label={it.caption || "Imagem ampliada"} onClick={onClose}>
      <figure className="wb-lightbox-fig" onClick={(ev) => ev.stopPropagation()}>
        <img src={it.url} alt={it.caption || ""} onClick={onClose} />
        {(it.caption || many) && (
          <figcaption>
            {it.caption}
            {many && <span className="wb-lightbox-count">{(it.caption ? " · " : "") + (i + 1) + " de " + items.length}</span>}
          </figcaption>
        )}
      </figure>
      <button ref={closeRef} type="button" className="wb-lightbox-btn wb-lightbox-close" aria-label="Fechar" onClick={onClose}>
        ✕
      </button>
      {many && (
        <>
          <button type="button" className="wb-lightbox-btn wb-lightbox-prev" aria-label="Imagem anterior" onClick={(ev) => (ev.stopPropagation(), go(-1))}>
            ‹
          </button>
          <button type="button" className="wb-lightbox-btn wb-lightbox-next" aria-label="Próxima imagem" onClick={(ev) => (ev.stopPropagation(), go(1))}>
            ›
          </button>
        </>
      )}
    </div>
  );
}
