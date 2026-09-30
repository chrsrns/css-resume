import { describe, expect, it } from "vitest";
import { clamp, formatDateRange, formatYear, parseIsoPartialDateLocal, sortByDisplayOrder } from "../js/helpers.js";

describe("sortByDisplayOrder", () => {
  it("sorts by display_order ascending", () => {
    const items = [{ id: 1, display_order: 3 }, { id: 2, display_order: 1 }, { id: 3, display_order: 2 }];
    const sorted = items.slice().sort(sortByDisplayOrder);
    expect(sorted.map((i) => i.id)).toEqual([2, 3, 1]);
  });

  it("falls back to id when display_order is missing", () => {
    const items = [{ id: 3 }, { id: 1 }, { id: 2 }];
    const sorted = items.slice().sort(sortByDisplayOrder);
    expect(sorted.map((i) => i.id)).toEqual([1, 2, 3]);
  });

  it("uses id as tiebreaker when display_order is equal", () => {
    const items = [{ id: 3, display_order: 1 }, { id: 1, display_order: 1 }, { id: 2, display_order: 1 }];
    const sorted = items.slice().sort(sortByDisplayOrder);
    expect(sorted.map((i) => i.id)).toEqual([1, 2, 3]);
  });

  it("puts items without display_order at the end", () => {
    const items = [{ id: 1, display_order: 1 }, { id: 2 }, { id: 3, display_order: 0 }];
    const sorted = items.slice().sort(sortByDisplayOrder);
    expect(sorted.map((i) => i.id)).toEqual([3, 1, 2]);
  });
});

describe("formatDateRange", () => {
  it("returns start - end when both present", () => {
    expect(formatDateRange("2020", "2022")).toBe("2020 - 2022");
  });

  it("returns start - Present when end is missing", () => {
    expect(formatDateRange("2020", "")).toBe("2020 - Present");
    expect(formatDateRange("2020", null)).toBe("2020 - Present");
  });

  it("returns empty string when start is missing", () => {
    expect(formatDateRange("", "2022")).toBe("");
    expect(formatDateRange(null, "2022")).toBe("");
  });
});

describe("formatYear", () => {
  it("extracts 4-digit year from string", () => {
    expect(formatYear("Started Jan 2020")).toBe("2020");
    expect(formatYear("2020-2021")).toBe("2020");
  });

  it("parses ISO date string", () => {
    expect(formatYear("2020-06-15")).toBe("2020");
  });

  it("returns empty string for null or empty input", () => {
    expect(formatYear(null)).toBe("");
    expect(formatYear("")).toBe("");
  });

  it("returns original string when no year or date found", () => {
    expect(formatYear("unknown")).toBe("unknown");
  });
});

describe("clamp", () => {
  it("returns value when within range", () => {
    expect(clamp(50, 0, 100)).toBe(50);
  });

  it("clamps to min when below", () => {
    expect(clamp(-5, 0, 100)).toBe(0);
  });

  it("clamps to max when above", () => {
    expect(clamp(150, 0, 100)).toBe(100);
  });
});

describe("parseIsoPartialDateLocal", () => {
  it("parses YYYY as local midnight January 1", () => {
    const d = parseIsoPartialDateLocal("2020");
    expect(d.getTime()).toBe(new Date(2020, 0, 1).getTime());
    expect(d.getFullYear()).toBe(2020);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(1);
  });

  it("parses YYYY-MM as local midnight first of month", () => {
    const d = parseIsoPartialDateLocal("2020-01");
    expect(d.getTime()).toBe(new Date(2020, 0, 1).getTime());
    expect(d.getFullYear()).toBe(2020);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(1);
  });

  it("parses YYYY-MM-DD as local midnight, not UTC", () => {
    const d = parseIsoPartialDateLocal("2020-01-15");
    expect(d.getTime()).toBe(new Date(2020, 0, 15).getTime());
    expect(d.getFullYear()).toBe(2020);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(15);
  });

  it("uses local components so negative-offset timezones do not shift the day", () => {
    const d = parseIsoPartialDateLocal("2020-01-01");
    expect(d.getFullYear()).toBe(2020);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(1);
  });

  it("falls back to native Date for non-ISO strings", () => {
    const d = parseIsoPartialDateLocal("January 15, 2020");
    expect(d instanceof Date).toBe(true);
    expect(Number.isNaN(d.getTime())).toBe(false);
  });

  it("returns empty string for unparseable or empty values", () => {
    expect(parseIsoPartialDateLocal("not a date")).toBe("");
    expect(parseIsoPartialDateLocal("")).toBe("");
    expect(parseIsoPartialDateLocal("   ")).toBe("");
    expect(parseIsoPartialDateLocal(null)).toBe("");
    expect(parseIsoPartialDateLocal(undefined)).toBe("");
  });

  it("rejects out-of-range ISO components instead of rolling over", () => {
    expect(parseIsoPartialDateLocal("2020-13")).toBe("");
    expect(parseIsoPartialDateLocal("2020-00")).toBe("");
    expect(parseIsoPartialDateLocal("2020-02-30")).toBe("");
    expect(parseIsoPartialDateLocal("2020-01-32")).toBe("");
  });
});
