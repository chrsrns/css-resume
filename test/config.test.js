import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getConfig,
  resolvePillsInline,
  resolveProfileImageSize,
  resolveProfileImageVisible,
  resolveProjectLimits,
  resolveResumeId,
  resolveSkillsInline,
} from "../js/config.js";

const stubConfig = (config) => {
  vi.stubGlobal("window", { __CONFIG__: config });
};

const RESUME_UUID = "018e5c5e-8f4a-7b2c-9d1e-3f4a5b6c7d8e";
const RESUME_UUID_V4 = "2a4f6b8c-0d1e-4f2a-8b3c-5d7e9f0a1b2c";

describe("getConfig", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses defaults when window.__CONFIG__ is missing", () => {
    vi.stubGlobal("window", {});
    const cfg = getConfig();
    expect(cfg.apiBaseUrl).toBe("/api");
    expect(cfg.resumeId).toBeUndefined();
  });

  it("uses provided API_BASE_URL and RESUME_ID", () => {
    stubConfig({
      API_BASE_URL: "https://api.example.com",
      RESUME_ID: RESUME_UUID,
    });
    expect(getConfig()).toEqual({
      apiBaseUrl: "https://api.example.com",
      resumeId: RESUME_UUID,
    });
  });

  it("trims a RESUME_ID UUID string", () => {
    stubConfig({ API_BASE_URL: "/api", RESUME_ID: `  ${RESUME_UUID}  ` });
    expect(getConfig()).toEqual({ apiBaseUrl: "/api", resumeId: RESUME_UUID });
  });

  it("defaults API_BASE_URL when it is not a string", () => {
    stubConfig({ API_BASE_URL: 123, RESUME_ID: RESUME_UUID });
    expect(getConfig()).toEqual({ apiBaseUrl: "/api", resumeId: RESUME_UUID });
  });

  it("returns undefined resumeId for a non-string RESUME_ID", () => {
    stubConfig({ API_BASE_URL: "/api", RESUME_ID: 42 });
    const cfg = getConfig();
    expect(cfg.apiBaseUrl).toBe("/api");
    expect(cfg.resumeId).toBeUndefined();
  });

  it("returns undefined resumeId for a malformed RESUME_ID", () => {
    stubConfig({ API_BASE_URL: "/api", RESUME_ID: "not-a-uuid" });
    const cfg = getConfig();
    expect(cfg.apiBaseUrl).toBe("/api");
    expect(cfg.resumeId).toBeUndefined();
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

  it("?resume_id UUID overrides RESUME_ID", () => {
    stubConfig({ RESUME_ID: RESUME_UUID });
    expect(resolveResumeId(`?resume_id=${RESUME_UUID_V4}`)).toBe(
      RESUME_UUID_V4,
    );
  });

  it("accepts upper and mixed case UUIDs", () => {
    stubConfig({ RESUME_ID: RESUME_UUID });
    const upper = RESUME_UUID_V4.toUpperCase();
    expect(resolveResumeId(`?resume_id=${upper}`)).toBe(upper);
  });

  it("ignores non-UUID values and falls back to RESUME_ID", () => {
    stubConfig({ RESUME_ID: RESUME_UUID });
    const hyphenless = RESUME_UUID_V4.replaceAll("-", "");
    for (const bad of [
      "",
      "7",
      "0",
      "-3",
      "abc",
      "NaN",
      "Infinity",
      "2.5",
      hyphenless,
      RESUME_UUID_V4.slice(0, -2),
      `${RESUME_UUID_V4}-1234`,
      `{${RESUME_UUID_V4}}`,
      ` ${RESUME_UUID_V4}x`,
    ]) {
      expect(resolveResumeId(`?resume_id=${bad}`)).toBe(RESUME_UUID);
    }
  });

  it("returns RESUME_ID when the param is absent", () => {
    stubConfig({ RESUME_ID: RESUME_UUID });
    expect(resolveResumeId("")).toBe(RESUME_UUID);
    expect(resolveResumeId("?projects=3")).toBe(RESUME_UUID);
  });

  it("returns undefined when RESUME_ID is missing or malformed", () => {
    stubConfig({ RESUME_ID: 0 });
    expect(resolveResumeId("?resume_id=abc")).toBeUndefined();
    stubConfig({ RESUME_ID: "bogus" });
    expect(resolveResumeId("")).toBeUndefined();
    stubConfig({});
    expect(resolveResumeId("")).toBeUndefined();
  });

  it("does not throw when window.location is absent", () => {
    stubConfig({ RESUME_ID: RESUME_UUID });
    expect(resolveResumeId()).toBe(RESUME_UUID);
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

describe("resolvePillsInline", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns inline mode when the param is absent and no config is set", () => {
    stubConfig({});
    expect(resolvePillsInline("")).toBe(true);
  });

  it("returns inline mode for ?pillsInline=1", () => {
    stubConfig({ PILLS_INLINE: false });
    expect(resolvePillsInline("?pillsInline=1")).toBe(true);
  });

  it("returns pill mode for ?pillsInline=0", () => {
    stubConfig({ PILLS_INLINE: true });
    expect(resolvePillsInline("?pillsInline=0")).toBe(false);
  });

  it("falls back to config for invalid, empty, or other values", () => {
    stubConfig({ PILLS_INLINE: false });
    for (const bad of ["abc", "2", "", "10", "true"]) {
      expect(resolvePillsInline(`?pillsInline=${bad}`)).toBe(false);
    }
    stubConfig({ PILLS_INLINE: true });
    for (const bad of ["abc", "2", "", "10", "false"]) {
      expect(resolvePillsInline(`?pillsInline=${bad}`)).toBe(true);
    }
  });

  it("returns pill mode only when PILLS_INLINE is false", () => {
    stubConfig({ PILLS_INLINE: false });
    expect(resolvePillsInline("")).toBe(false);
    stubConfig({ PILLS_INLINE: true });
    expect(resolvePillsInline("")).toBe(true);
    stubConfig({ PILLS_INLINE: 0 });
    expect(resolvePillsInline("")).toBe(true);
    stubConfig({});
    expect(resolvePillsInline("")).toBe(true);
  });

  it("does not throw when window.location is absent and search is explicit", () => {
    stubConfig({ PILLS_INLINE: false });
    expect(resolvePillsInline("?pillsInline=1")).toBe(true);
    expect(resolvePillsInline("?pillsInline=0")).toBe(false);
    expect(resolvePillsInline("")).toBe(false);
  });
});

describe("resolveProfileImageVisible", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns enabled when the param is absent and no config is set", () => {
    stubConfig({});
    expect(resolveProfileImageVisible("")).toBe(true);
  });

  it("returns enabled for ?profileImage=1", () => {
    stubConfig({ PROFILE_IMAGE: false });
    expect(resolveProfileImageVisible("?profileImage=1")).toBe(true);
  });

  it("returns hidden for ?profileImage=0", () => {
    stubConfig({ PROFILE_IMAGE: true });
    expect(resolveProfileImageVisible("?profileImage=0")).toBe(false);
  });

  it("falls back to config for invalid, empty, or other values", () => {
    stubConfig({ PROFILE_IMAGE: false });
    for (const bad of ["abc", "2", "", "10", "true"]) {
      expect(resolveProfileImageVisible(`?profileImage=${bad}`)).toBe(false);
    }
    stubConfig({ PROFILE_IMAGE: true });
    for (const bad of ["abc", "2", "", "10", "false"]) {
      expect(resolveProfileImageVisible(`?profileImage=${bad}`)).toBe(true);
    }
  });

  it("returns hidden only when PROFILE_IMAGE is false", () => {
    stubConfig({ PROFILE_IMAGE: false });
    expect(resolveProfileImageVisible("")).toBe(false);
    stubConfig({ PROFILE_IMAGE: true });
    expect(resolveProfileImageVisible("")).toBe(true);
    stubConfig({ PROFILE_IMAGE: 0 });
    expect(resolveProfileImageVisible("")).toBe(true);
    stubConfig({});
    expect(resolveProfileImageVisible("")).toBe(true);
  });

  it("does not throw when window.location is absent and search is explicit", () => {
    stubConfig({ PROFILE_IMAGE: false });
    expect(resolveProfileImageVisible("?profileImage=1")).toBe(true);
    expect(resolveProfileImageVisible("?profileImage=0")).toBe(false);
    expect(resolveProfileImageVisible("")).toBe(false);
  });
});
