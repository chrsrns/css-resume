import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const indexHtml = readFileSync(resolve(process.cwd(), "index.html"), "utf-8");
const css = readFileSync(resolve(process.cwd(), "css/style.css"), "utf-8");

describe("sidebar width cap on desktop", () => {
  it("caps sidebar at 28rem on sm and up", () => {
    const match = indexHtml.match(/id="sidebarCard"\s+class="([^"]+)"/s);
    expect(match).toBeTruthy();
    expect(match[1]).toContain("sm:max-w-[28rem]");
  });

  it("keeps print layout uncapped", () => {
    const match = indexHtml.match(/id="sidebarCard"\s+class="([^"]+)"/s);
    expect(match).toBeTruthy();
    expect(match[1]).toContain("print:max-w-none");
  });

  it("has compiled sm:max-w-[28rem] rule", () => {
    expect(css).toMatch(
      /\.sm\\:max-w-\\\[28rem\\\]\s*\{[^}]*max-width:\s*28rem/,
    );
  });

  it("has compiled print:max-w-none rule", () => {
    expect(css).toMatch(/\.print\\:max-w-none\s*\{[^}]*max-width:\s*none/);
  });
});
