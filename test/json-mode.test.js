import { describe, expect, it } from "vitest";
import { resolveJsonSource } from "../js/json-mode.js";

describe("resolveJsonSource", () => {
  it("returns null when no JSON source is configured", () => {
    expect(
      resolveJsonSource({ search: "", hash: "", config: {} }),
    ).toBeNull();
  });

  it("returns the ?json-url query parameter source", () => {
    expect(
      resolveJsonSource({
        search: "?json-url=https%3A%2F%2Fexample.com%2Fdoc.json",
        hash: "",
        config: {},
      }),
    ).toEqual({
      type: "url",
      value: "https://example.com/doc.json",
    });
  });

  it("returns the RESUME_JSON config source", () => {
    const doc = { resume: { name: "Jane" } };
    expect(
      resolveJsonSource({ search: "", hash: "", config: { RESUME_JSON: doc } }),
    ).toEqual({ type: "inline", value: doc });
  });

  it("accepts RESUME_JSON as a JSON string", () => {
    expect(
      resolveJsonSource({
        search: "",
        hash: "",
        config: { RESUME_JSON: "{\"resume\":{}}" },
      }),
    ).toEqual({ type: "inline", value: "{\"resume\":{}}" });
  });

  it("returns the RESUME_JSON_URL config source", () => {
    expect(
      resolveJsonSource({
        search: "",
        hash: "",
        config: { RESUME_JSON_URL: "/doc.json" },
      }),
    ).toEqual({ type: "inline-url", value: "/doc.json" });
  });

  it("returns the #json fragment source", () => {
    expect(
      resolveJsonSource({ search: "", hash: "#json=eyJhIjoxfQ", config: {} }),
    ).toEqual({ type: "fragment", value: "eyJhIjoxfQ" });
  });

  it("returns the #json.gz fragment source", () => {
    expect(
      resolveJsonSource({
        search: "",
        hash: "#json.gz=H4sIAAAA",
        config: {},
      }),
    ).toEqual({ type: "fragment-gz", value: "H4sIAAAA" });
  });

  it("prefers #json.gz over #json over ?json-url over RESUME_JSON over RESUME_JSON_URL", () => {
    const base = {
      search: "?json-url=https%3A%2F%2Fexample.com%2Fq.json",
      hash: "#json=AAA&json.gz=BBB",
      config: { RESUME_JSON: "{}", RESUME_JSON_URL: "/c.json" },
    };
    expect(resolveJsonSource(base).type).toBe("fragment-gz");

    expect(
      resolveJsonSource({ ...base, hash: "#json=AAA" }).type,
    ).toBe("fragment");

    expect(resolveJsonSource({ ...base, hash: "" }).type).toBe("url");

    expect(
      resolveJsonSource({ ...base, hash: "", search: "" }).type,
    ).toBe("inline");

    expect(
      resolveJsonSource({ ...base, hash: "", search: "", config: { RESUME_JSON_URL: "/c.json" } }).type,
    ).toBe("inline-url");
  });

  it("skips empty and whitespace-only sources and tries the next one", () => {
    expect(
      resolveJsonSource({
        search: "?json-url=%20%20",
        hash: "#json=",
        config: { RESUME_JSON: "   ", RESUME_JSON_URL: "/doc.json" },
      }),
    ).toEqual({ type: "inline-url", value: "/doc.json" });
  });

  it("returns null when every source is empty or whitespace", () => {
    expect(
      resolveJsonSource({
        search: "?json-url=",
        hash: "#json=%20",
        config: { RESUME_JSON: "", RESUME_JSON_URL: "  " },
      }),
    ).toBeNull();
  });
});
