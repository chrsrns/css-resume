import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getConfig, resolveProjectLimits } from "../js/config.js";

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
    expect(getConfig()).toEqual({
      apiBaseUrl: "https://api.example.com",
      resumeId: 42,
    });
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

describe("resolveProjectLimits", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("defaults to no screen cap and print cap 6", () => {
    stubConfig({});
    expect(resolveProjectLimits("")).toEqual({
      screenLimit: undefined,
      printLimit: 6,
    });
  });

  it("uses PROJECT_LIMIT and PROJECT_PRINT_LIMIT from config", () => {
    stubConfig({ PROJECT_LIMIT: 4, PROJECT_PRINT_LIMIT: 3 });
    expect(resolveProjectLimits("")).toEqual({ screenLimit: 4, printLimit: 3 });
  });

  it("?projects overrides screen cap", () => {
    stubConfig({ PROJECT_LIMIT: 4 });
    expect(resolveProjectLimits("?projects=2")).toEqual({
      screenLimit: 2,
      printLimit: 6,
    });
  });

  it("?printProjects overrides print cap", () => {
    stubConfig({ PROJECT_PRINT_LIMIT: 3 });
    expect(resolveProjectLimits("?printProjects=8")).toEqual({
      screenLimit: undefined,
      printLimit: 8,
    });
  });

  it("query params take precedence over config", () => {
    stubConfig({ PROJECT_LIMIT: 4, PROJECT_PRINT_LIMIT: 3 });
    expect(resolveProjectLimits("?projects=5&printProjects=10")).toEqual({
      screenLimit: 5,
      printLimit: 10,
    });
  });

  it("ignores invalid, negative, zero, NaN, and Infinity values", () => {
    stubConfig({ PROJECT_LIMIT: -1, PROJECT_PRINT_LIMIT: 0 });
    expect(
      resolveProjectLimits("?projects=abc&printProjects=Infinity"),
    ).toEqual({ screenLimit: undefined, printLimit: 6 });
  });

  it("ignores non-integer values", () => {
    stubConfig({ PROJECT_LIMIT: 3.7, PROJECT_PRINT_LIMIT: 2.5 });
    expect(resolveProjectLimits("")).toEqual({
      screenLimit: undefined,
      printLimit: 6,
    });
  });
});
