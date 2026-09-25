import { describe, expect, it } from "vitest";
import { byteLength, canonical, fingerprint, parseDrawer, parseSheetId, sheetKeys } from "./keys";

describe("ficha da conta no endereço", () => {
  it("[REGRESSÃO] sem ?sheet= é a ficha só deste aparelho", () => {
    expect(parseSheetId("")).toBeNull();
    expect(parseSheetId("?tema=deusa")).toBeNull();
  });
  it("só aceita um id de verdade", () => {
    expect(parseSheetId("?sheet=12")).toBe(12);
    for (const bad of ["?sheet=0", "?sheet=-1", "?sheet=12x", "?sheet=abc", "?sheet=1.5", "?sheet=" + "9".repeat(13), "?sheet=%2F..%2F"]) {
      expect(parseSheetId(bad), bad).toBeNull();
    }
  });
  it("uma gaveta por ficha, com o mesmo nome que a fichas.html usa", () => {
    expect(sheetKeys(7).drawer).toBe("fichaPG_save_v1:7");
    expect(sheetKeys(7).version).toBe("pg_version:7");
  });
});

describe("impressão da ficha", () => {
  it("não liga pra ordem das chaves (o Postgres devolve em outra ordem)", () => {
    const a = { campos: { nome: "Ânia", nivel: "3" }, raList: [{ nome: "x", atual: "1" }] };
    const b = { raList: [{ atual: "1", nome: "x" }], campos: { nivel: "3", nome: "Ânia" } };
    expect(canonical(a)).toBe(canonical(b));
    expect(fingerprint(a)).toBe(fingerprint(b));
  });
  it("muda quando qualquer valor muda, inclusive a ordem de uma lista", () => {
    const base = { campos: { nome: "Ânia" }, lista: [1, 2] };
    expect(fingerprint(base)).not.toBe(fingerprint({ campos: { nome: "Ania" }, lista: [1, 2] }));
    expect(fingerprint(base)).not.toBe(fingerprint({ campos: { nome: "Ânia" }, lista: [2, 1] }));
  });
  it("gaveta quebrada ou que não é objeto não conta como ficha", () => {
    expect(parseDrawer('{"campos":{}}')).toEqual({ campos: {} });
    expect(parseDrawer("{quebrado")).toBeNull();
    expect(parseDrawer("[1,2]")).toBeNull();
    expect(parseDrawer("null")).toBeNull();
  });
});

it("tamanho em bytes conta acento", () => {
  expect(byteLength("ação")).toBe(6);
});
