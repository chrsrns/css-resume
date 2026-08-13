import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Tests read the compiled stylesheet so they verify what the browser actually gets.
const css = readFileSync(resolve(process.cwd(), "css/style.css"), "utf-8");

function extractMediaPrintBlock(css) {
  const startIdx = css.indexOf("@media print");
  if (startIdx === -1) return "";
  const braceStart = css.indexOf("{", startIdx);
  let depth = 0;
  for (let i = braceStart; i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}") {
      depth--;
      if (depth === 0) return css.slice(braceStart + 1, i);
    }
  }
  return "";
}

/** Remove CSS block comments (/* ... *\/) so tests don't false-pass on commented-out declarations. */
function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

const printBlock = extractMediaPrintBlock(css);
// Raw block used only for tests that intentionally match inside comments (Letter swap).
const printBlockActive = stripComments(printBlock);

describe("print CSS contract (V30, V31, V32, V34, V35, V37)", () => {
  it("contains a @media print block", () => {
    expect(printBlockActive.length).toBeGreaterThan(0);
  });

  it("V30: body bound to 210mm × 297mm", () => {
    expect(printBlockActive).toMatch(/width:\s*210mm/);
    expect(printBlockActive).toMatch(/height:\s*297mm/);
  });

  it("V30: no zoom property in @media print", () => {
    expect(printBlockActive).not.toMatch(/zoom\s*:/);
  });

  it("V31: body overflow hidden", () => {
    expect(printBlockActive).toMatch(/overflow:\s*hidden/);
  });

  it("V32: @page size A4", () => {
    expect(printBlockActive).toMatch(/@page\s*\{[^}]*size:\s*A4[^}]*\}/);
  });

  it("V32: @page margin 0", () => {
    expect(printBlockActive).toMatch(/@page\s*\{[^}]*margin:\s*0[^}]*\}/);
  });

  // Letter swap block lives inside a comment intentionally — use raw printBlock.
  it("V32: Letter page size swap block comment present", () => {
    expect(printBlock).toMatch(/Letter page size swap block/);
    expect(printBlock).toMatch(/size:\s*Letter/);
  });

  it("V35: body margin 0 in @media print", () => {
    expect(printBlockActive).toMatch(/margin:\s*0/);
  });

  it("V35: body padding 1rem in @media print", () => {
    expect(printBlockActive).toMatch(/padding:\s*1rem/);
  });

  it("V34: html font-size set in @media print in pt units", () => {
    expect(printBlockActive).toMatch(/html\s*\{[^}]*font-size:\s*\d+(?:\.\d+)?pt[^}]*\}/);
  });

  it("V37: no :footer or :header @page pseudo-classes", () => {
    expect(printBlockActive).not.toMatch(/@page\s*:footer/);
    expect(printBlockActive).not.toMatch(/@page\s*:header/);
  });

  it("V36: #sidebarCard has flex-grow: 1 in @media print", () => {
    const match = printBlockActive.match(/#sidebarCard\s*\{([^}]*)\}/s);
    expect(match).toBeTruthy();
    expect(match[1]).toMatch(/flex-grow:\s*1/);
  });

  it("V36: #mainCard has flex-grow: 2 in @media print (1:2 ratio with sidebar)", () => {
    const match = printBlockActive.match(/#mainCard\s*\{([^}]*)\}/s);
    expect(match).toBeTruthy();
    expect(match[1]).toMatch(/flex-grow:\s*2/);
  });

  it("V38: .min-h-screen reset in @media print (avoid 100vh blank page)", () => {
    const match = printBlockActive.match(/\.min-h-screen\s*\{([^}]*)\}/s);
    expect(match).toBeTruthy();
    expect(match[1]).toMatch(/min-height:\s*(?:0|auto)\b/);
    expect(match[1]).not.toMatch(/min-height:\s*100vh/);
  });

  it("V39: .gap-4 reset in @media print (avoid subpixel overflow)", () => {
    const match = printBlockActive.match(/\.gap-4\s*\{([^}]*)\}/s);
    expect(match).toBeTruthy();
    expect(match[1]).toMatch(/gap:/);
    expect(match[1]).not.toMatch(/gap:\s*1rem/);
  });

  it("V40: .flex-col forced to row in @media print", () => {
    const match = printBlockActive.match(/\.flex-col\s*\{([^}]*)\}/s);
    expect(match).toBeTruthy();
    expect(match[1]).toMatch(/flex-direction:\s*row/);
  });

  it("project bullet lists limited to 3 items in print", () => {
    expect(printBlockActive).toMatch(
      /\.static-project-card\s+li:nth-child\(n\s*\+\s*4\)\s*\{[^}]*display:\s*none/s
    );
  });
});
