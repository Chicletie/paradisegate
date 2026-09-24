import { describe, expect, it } from "vitest";
import { fmtEventDate, eventSortKey } from "./events";

describe("fmtEventDate", () => {
  it("dia + mês + ano", () => {
    expect(fmtEventDate({ y: 2026, m: 3, d: 12 })).toBe("12/3/2026");
  });
  it("só mês + ano", () => {
    expect(fmtEventDate({ y: 2026, m: 9 })).toBe("9/2026");
  });
  it("só ano", () => {
    expect(fmtEventDate({ y: 2026 })).toBe("ano 2026");
  });
});

describe("eventSortKey", () => {
  it("ordena por ano, depois mês, depois dia", () => {
    const events = [{ y: 2026, m: 9 }, { y: 2016, m: 3, d: 12 }, { y: 2026, m: 1 }];
    const sorted = [...events].sort((a, b) => eventSortKey(a) - eventSortKey(b));
    expect(sorted.map((e) => e.y)).toEqual([2016, 2026, 2026]);
    expect(sorted[1].m).toBe(1);
  });
});
