import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("V77: Tailwind config includes all JS files with Tailwind classes", () => {
  const getConfigContent = () => {
    const configPath = resolve(process.cwd(), "tailwind.config.cjs");
    return readFileSync(configPath, "utf-8");
  };

  it("should include renderers.js in content array", () => {
    const configContent = getConfigContent();
    expect(configContent).toContain('"./js/renderers.js"');
  });

  it("should include carousel.js in content array", () => {
    const configContent = getConfigContent();
    expect(configContent).toContain('"./js/carousel.js"');
  });

  it("should include app.js in content array", () => {
    const configContent = getConfigContent();
    expect(configContent).toContain('"./js/app.js"');
  });

  it("should include index.html in content array", () => {
    const configContent = getConfigContent();
    expect(configContent).toContain('"./index.html"');
  });
});