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
