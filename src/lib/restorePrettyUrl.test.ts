import { describe, expect, it, vi } from "vitest";
import { restorePrettyUrl } from "./restorePrettyUrl";

describe("restorePrettyUrl", () => {
  it("devolve a URL original quando ?p= existe", () => {
    const replaceState = vi.fn();
    restorePrettyUrl("?p=%2Fwiki%2Falucard-whitefang", replaceState);
    expect(replaceState).toHaveBeenCalledWith("/wiki/alucard-whitefang");
  });

  it("volta pro perfil público /@nome", () => {
    const replaceState = vi.fn();
    restorePrettyUrl("?p=" + encodeURIComponent("/@ania_sombra"), replaceState);
    expect(replaceState).toHaveBeenCalledWith("/@ania_sombra");
  });

  it("não faz nada sem ?p=", () => {
    const replaceState = vi.fn();
    restorePrettyUrl("?q=busca", replaceState);
    expect(replaceState).not.toHaveBeenCalled();
  });
});
