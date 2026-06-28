import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getConfig } from "../js/config.js";

const stubConfig = (config) => {
  vi.stubGlobal("window", { __CONFIG__: config });
};

describe("getConfig", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses defaults when window.__CONFIG__ is missing", () => {
    vi.stubGlobal("window", {});
    expect(getConfig()).toEqual({ apiBaseUrl: "/api", resumeId: 1 });
  });

  it("uses provided API_BASE_URL and RESUME_ID", () => {
    stubConfig({ API_BASE_URL: "https://api.example.com", RESUME_ID: 42 });
    expect(getConfig()).toEqual({ apiBaseUrl: "https://api.example.com", resumeId: 42 });
  });

  it("parses RESUME_ID from a numeric string", () => {
    stubConfig({ API_BASE_URL: "/api", RESUME_ID: "192" });
    expect(getConfig()).toEqual({ apiBaseUrl: "/api", resumeId: 192 });
  });

  it("defaults API_BASE_URL when it is not a string", () => {
    stubConfig({ API_BASE_URL: 123, RESUME_ID: 5 });
    expect(getConfig()).toEqual({ apiBaseUrl: "/api", resumeId: 5 });
  });

  it("returns NaN for a non-numeric RESUME_ID", () => {
    stubConfig({ API_BASE_URL: "/api", RESUME_ID: "not-a-number" });
    const cfg = getConfig();
    expect(cfg.apiBaseUrl).toBe("/api");
    expect(Number.isNaN(cfg.resumeId)).toBe(true);
  });
});
