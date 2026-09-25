import { describe, expect, it } from "vitest";
import { nextChangeAt, normalizeUsername, usernameProblem } from "./username";

describe("username", () => {
  it("guarda sem @, minúsculo e sem acento", () => {
    expect(normalizeUsername("  @Ânia_Sombra ")).toBe("ania_sombra");
  });
  it("aceita e recusa como o banco", () => {
    expect(usernameProblem("ania_sombra")).toBe("");
    expect(usernameProblem("a1")).toMatch(/Pelo menos/);
    expect(usernameProblem("x".repeat(21))).toMatch(/No máximo/);
    expect(usernameProblem("ania sombra")).toMatch(/sem espaço/);
    expect(usernameProblem("_ania")).toMatch(/Comece/);
    expect(usernameProblem("admin")).toMatch(/reservado/);
  });
  it("30 dias entre uma troca e outra", () => {
    const now = Date.parse("2026-10-01T12:00:00Z");
    expect(nextChangeAt(null, now)).toBeNull();
    expect(nextChangeAt(new Date("2026-08-01T00:00:00Z"), now)).toBeNull();
    const t = nextChangeAt({ toMillis: () => Date.parse("2026-09-20T12:00:00Z") }, now);
    expect(t).toBe(Date.parse("2026-10-20T12:00:00Z"));
  });
});

describe("nomes proibidos", () => {
  it("bloqueia ódio, palavrão e sexual, mesmo disfarçado", () => {
    for (const n of ["hitler", "h1tl3r", "h_i_t_l_e_r", "xx_nazi_xx", "n4z1smo", "neonazi88", "buceta", "bucet4", "pussy_cat", "caralho", "porra_loka", "super_puta", "pu7a", "cu_de_ferro", "vsf", "fuck_you", "rola_grande"]) {
      expect(usernameProblem(n), n).toBe("Esse nome não é permitido.");
    }
  });
  it("não bloqueia nome inocente que só contém as letras", () => {
    for (const n of ["computador", "paulo_silva", "carolina", "enviado", "canal_do_ze", "cuidado", "pintor", "essex", "washington", "sextante", "picanha", "xananda", "petits", "cucumber", "rolamento", "ania_sombra", "anytsa"]) {
      expect(usernameProblem(n), n).toBe("");
    }
  });
});
