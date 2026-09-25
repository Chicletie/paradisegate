import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { findSeason, isUnlocked, mergeObras, spoilerLabel, PageObrasContext, ProgressContext } from "./spoilerProgress";
import { mdInline, SpoilerBlock, SpoilerSpan } from "./markdown";
import type { ReactNode } from "react";
import type { SpoilerObra } from "../types";

const PG: SpoilerObra = { id: "fr1", name: "Paradise Gate", seasons: [{ id: "s1", name: "Temporada 1" }, { id: "s2", name: "Temporada 2" }, { id: "s3", name: "Temporada 3" }] };

describe("spoiler por obra", () => {
  it("acha a temporada e escreve de onde é", () => {
    expect(findSeason([PG], "s2")?.idx).toBe(1);
    expect(findSeason([PG], "zz")).toBeNull();
    expect(spoilerLabel([PG], "s3")).toBe("Paradise Gate · Temporada 3");
    expect(spoilerLabel([PG], undefined)).toBe("");
  });

  it("libera só o que o leitor já viu", () => {
    expect(isUnlocked({}, [PG], "s1")).toBe(false);
    expect(isUnlocked({ fr1: "s2" }, [PG], "s1")).toBe(true);
    expect(isUnlocked({ fr1: "s2" }, [PG], "s2")).toBe(true);
    expect(isUnlocked({ fr1: "s2" }, [PG], "s3")).toBe(false);
    expect(isUnlocked({ fr1: "*" }, [PG], "s3")).toBe(true);
    // spoiler comum (sem temporada) nunca abre sozinho
    expect(isUnlocked({ fr1: "*" }, [PG], undefined)).toBe(false);
    // temporada que o leitor marcou e depois sumiu: não libera nada
    expect(isUnlocked({ fr1: "apagada" }, [PG], "s1")).toBe(false);
  });

  it("junta obras sem repetir", () => {
    expect(mergeObras([PG], [PG, { id: "c1", name: "Campanha", seasons: [] }]).map((o) => o.id)).toEqual(["fr1", "c1"]);
  });

  it("a tarja diz a temporada, e some pra quem já viu", () => {
    const wrap = (seen: string, node: ReactNode) =>
      renderToStaticMarkup(
        <ProgressContext.Provider value={{ progress: seen ? { fr1: seen } : {}, inAccount: false, setSeen: () => {} }}>
          <PageObrasContext.Provider value={[PG]}>{node}</PageObrasContext.Provider>
        </ProgressContext.Provider>,
      );
    const closed = wrap("", <SpoilerBlock at="s2">segredo</SpoilerBlock>);
    expect(closed).toContain("spoiler de Paradise Gate · Temporada 2");
    expect(closed).not.toContain("segredo");
    expect(wrap("s2", <SpoilerBlock at="s2">segredo</SpoilerBlock>)).toBe("segredo");
    expect(wrap("s2", <SpoilerSpan text="irmã" at="s2" />)).toContain('class="md-unlocked"');
    expect(wrap("s1", <SpoilerSpan text="irmã" at="s2" />)).toContain("md-spoiler");
  });

  it("trecho no meio do texto com temporada: a marca nunca aparece", () => {
    const wrap = (seen: string, node: ReactNode) =>
      renderToStaticMarkup(
        <ProgressContext.Provider value={{ progress: seen ? { fr1: seen } : {}, inAccount: false, setSeen: () => {} }}>
          <PageObrasContext.Provider value={[PG]}>{node}</PageObrasContext.Provider>
        </ProgressContext.Provider>,
      );
    const txt = "Ela fugiu. ||@{s2} Na verdade é a herdeira.|| Fim.";
    const closed = wrap("", <>{mdInline(txt)}</>);
    expect(closed).toContain("md-spoiler");
    expect(closed).toContain("Spoiler de Paradise Gate · Temporada 2");
    expect(closed).not.toContain("@{");
    const open = wrap("s2", <>{mdInline(txt)}</>);
    expect(open).toContain("md-unlocked");
    expect(open).not.toContain("md-spoiler");
    // spoiler comum continua tarja mesmo pra quem viu tudo
    expect(wrap("*", <>{mdInline("||segredo||")}</>)).toContain("md-spoiler");
  });
});
