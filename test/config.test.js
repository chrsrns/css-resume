import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getConfig, resolveProfileImageSize, resolveProjectLimits, resolveResumeId, resolveSkillsInline } from "../js/config.js";

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

describe("resolveResumeId", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("?resume_id overrides RESUME_ID", () => {
    stubConfig({ RESUME_ID: 1 });
    expect(resolveResumeId("?resume_id=7")).toBe(7);
  });

  it("ignores empty, zero, negative, NaN, Infinity, fractional, and non-numeric values", () => {
    stubConfig({ RESUME_ID: 5 });
    for (const bad of ["", "0", "-3", "abc", "NaN", "Infinity", "2.5"]) {
      expect(resolveResumeId(`?resume_id=${bad}`)).toBe(5);
    }
  });

  it("returns RESUME_ID when the param is absent", () => {
    stubConfig({ RESUME_ID: 42 });
    expect(resolveResumeId("")).toBe(42);
    expect(resolveResumeId("?projects=3")).toBe(42);
  });

  it("passes the RESUME_ID fallback through unvalidated", () => {
    stubConfig({ RESUME_ID: 0 });
    expect(resolveResumeId("?resume_id=abc")).toBe(0);
    stubConfig({ RESUME_ID: "bogus" });
    expect(Number.isNaN(resolveResumeId(""))).toBe(true);
  });

  it("does not throw when window.location is absent", () => {
    stubConfig({ RESUME_ID: 3 });
    expect(resolveResumeId()).toBe(3);
  });
});

describe("resolveSkillsInline", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns inline mode when the param is absent and no config is set", () => {
    stubConfig({});
    expect(resolveSkillsInline("")).toBe(true);
  });

  it("returns inline mode for ?skillsInline=1", () => {
    stubConfig({ SKILLS_INLINE: false });
    expect(resolveSkillsInline("?skillsInline=1")).toBe(true);
  });

  it("returns bars mode for ?skillsInline=0", () => {
    stubConfig({ SKILLS_INLINE: true });
    expect(resolveSkillsInline("?skillsInline=0")).toBe(false);
  });

  it("falls back to config for invalid, empty, or other values", () => {
    stubConfig({ SKILLS_INLINE: false });
    for (const bad of ["abc", "2", "", "10", "true"]) {
      expect(resolveSkillsInline(`?skillsInline=${bad}`)).toBe(false);
    }
    stubConfig({ SKILLS_INLINE: true });
    for (const bad of ["abc", "2", "", "10", "false"]) {
      expect(resolveSkillsInline(`?skillsInline=${bad}`)).toBe(true);
    }
  });

  it("returns bars mode only when SKILLS_INLINE is false", () => {
    stubConfig({ SKILLS_INLINE: false });
    expect(resolveSkillsInline("")).toBe(false);
    stubConfig({ SKILLS_INLINE: true });
    expect(resolveSkillsInline("")).toBe(true);
    stubConfig({ SKILLS_INLINE: 0 });
    expect(resolveSkillsInline("")).toBe(true);
    stubConfig({});
    expect(resolveSkillsInline("")).toBe(true);
  });

  it("does not throw when window.location is absent and search is explicit", () => {
    stubConfig({ SKILLS_INLINE: false });
    expect(resolveSkillsInline("?skillsInline=1")).toBe(true);
    expect(resolveSkillsInline("?skillsInline=0")).toBe(false);
    expect(resolveSkillsInline("")).toBe(false);
  });
});

describe("resolveProfileImageSize", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns undefined when no size is configured", () => {
    stubConfig({});
    expect(resolveProfileImageSize("")).toBeUndefined();
  });

  it("reads a positive integer from ?profileImageSize", () => {
    stubConfig({});
    expect(resolveProfileImageSize("?profileImageSize=128")).toBe(128);
  });

  it("prefers the query param over PROFILE_IMAGE_SIZE", () => {
    stubConfig({ PROFILE_IMAGE_SIZE: 64 });
    expect(resolveProfileImageSize("?profileImageSize=128")).toBe(128);
  });

  it("falls back to PROFILE_IMAGE_SIZE when the query is absent", () => {
    stubConfig({ PROFILE_IMAGE_SIZE: 96 });
    expect(resolveProfileImageSize("")).toBe(96);
    expect(resolveProfileImageSize("?skillsInline=1")).toBe(96);
  });

  it("ignores zero, negative, NaN, Infinity, fractional, and non-numeric values", () => {
    stubConfig({ PROFILE_IMAGE_SIZE: 48 });
    for (const bad of ["0", "-3", "abc", "NaN", "Infinity", "2.5", ""]) {
      expect(resolveProfileImageSize(`?profileImageSize=${bad}`)).toBe(48);
    }
    stubConfig({ PROFILE_IMAGE_SIZE: -10 });
    expect(resolveProfileImageSize("?profileImageSize=abc")).toBeUndefined();
    stubConfig({ PROFILE_IMAGE_SIZE: 3.5 });
    expect(resolveProfileImageSize("")).toBeUndefined();
  });

  it("accepts numeric coercions like exponent strings", () => {
    stubConfig({});
    expect(resolveProfileImageSize("?profileImageSize=1e2")).toBe(100);
  });

  it("does not throw when window.location is absent and search is explicit", () => {
    stubConfig({ PROFILE_IMAGE_SIZE: 72 });
    expect(resolveProfileImageSize("?profileImageSize=64")).toBe(64);
    expect(resolveProfileImageSize("")).toBe(72);
  });
});
