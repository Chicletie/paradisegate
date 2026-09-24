import { describe, expect, it, vi } from "vitest";
import { restorePrettyUrl } from "./restorePrettyUrl";

describe("restorePrettyUrl", () => {
  it("devolve a URL original quando ?p= existe", () => {
    const replaceState = vi.fn();
    restorePrettyUrl("?p=%2Fwiki%2Falucard-whitefang", replaceState);
    expect(replaceState).toHaveBeenCalledWith("/wiki/alucard-whitefang");
  });

  it("não faz nada sem ?p=", () => {
    const replaceState = vi.fn();
    restorePrettyUrl("?q=busca", replaceState);
    expect(replaceState).not.toHaveBeenCalled();
  });
});
