import { describe, expect, it } from "vitest";
import { filterTimeline, timelineEvents, timelineTypes, yearFromQuery } from "./timeline";
import type { WikiIndex } from "../types";

const INDEX: WikiIndex = {
  alucard: { title: "Alucard", type: "Personagem", events: [{ label: "Foge", y: 2026, m: 9 }, { label: "Pacto", y: 2016, m: 3, d: 12, major: true }] },
  ordem: { title: "Ordem", type: "Facção", events: [{ label: "Testemunha", y: 2016, m: 3, d: 12, major: true }] },
  vel: { title: "Vel", type: "Local" },
};

describe("linha do tempo geral", () => {
  it("junta os eventos de todas as páginas em ordem de data (empate: ordem do índice)", () => {
    expect(timelineEvents(INDEX).map((e) => e.label)).toEqual(["Pacto", "Testemunha", "Foge"]);
    expect(timelineEvents(INDEX)[1]).toMatchObject({ entryId: "ordem", entryTitle: "Ordem", entryType: "Facção", major: true });
  });

  it("tipos do filtro em ordem de sort() puro, incluindo página sem eventos", () => {
    expect(timelineTypes(INDEX)).toEqual(["Facção", "Local", "Personagem"]);
  });

  it("filtra por tipo, ano e só principais", () => {
    const ev = timelineEvents(INDEX);
    expect(filterTimeline(ev, "Personagem", "", false).map((e) => e.label)).toEqual(["Pacto", "Foge"]);
    expect(filterTimeline(ev, "", "2016", false)).toHaveLength(2);
    expect(filterTimeline(ev, "", "", true).map((e) => e.label)).toEqual(["Pacto", "Testemunha"]);
  });

  it("?ano= que o campo numérico não aceita vira campo vazio", () => {
    expect(yearFromQuery("2016")).toBe("2016");
    expect(yearFromQuery("abc")).toBe("");
    expect(yearFromQuery(null)).toBe("");
    expect(yearFromQuery("-5")).toBe("-5");
    expect(yearFromQuery("1.")).toBe("");
  });
});
