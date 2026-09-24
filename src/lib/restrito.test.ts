import { describe, expect, it, vi } from "vitest";
import { allOrOwn, isPermissionDenied } from "./restrito";

const denied = Object.assign(new Error("Missing or insufficient permissions."), { code: "permission-denied" });

describe("conteúdo restrito de uma página", () => {
  it("todos os itens liberados pro leitor: a lista inteira passa e não precisa de outra consulta", async () => {
    const own = vi.fn(async () => ["meu"]);
    await expect(allOrOwn(async () => ["meu", "também meu"], own)).resolves.toEqual(["meu", "também meu"]);
    expect(own).not.toHaveBeenCalled();
  });

  it("página com item de outra pessoa: a lista inteira é recusada e vêm só os do leitor", async () => {
    const own = vi.fn(async () => ["meu"]);
    await expect(allOrOwn(async () => Promise.reject(denied), own)).resolves.toEqual(["meu"]);
    expect(own).toHaveBeenCalledOnce();
  });

  it("outro erro (rede) não vira consulta filtrada: sobe como veio", async () => {
    const own = vi.fn(async () => ["meu"]);
    const offline = Object.assign(new Error("offline"), { code: "unavailable" });
    await expect(allOrOwn(async () => Promise.reject(offline), own)).rejects.toBe(offline);
    expect(own).not.toHaveBeenCalled();
  });

  it("reconhece a recusa pelo código do erro", () => {
    expect(isPermissionDenied(denied)).toBe(true);
    expect(isPermissionDenied(new Error("permission-denied"))).toBe(false);
    expect(isPermissionDenied(null)).toBe(false);
  });
});
