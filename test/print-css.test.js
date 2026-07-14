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

const printBlock = extractMediaPrintBlock(css);

describe("print CSS contract (V30, V31, V32, V34, V35, V37)", () => {
  it("contains a @media print block", () => {
    expect(printBlock.length).toBeGreaterThan(0);
  });

  it("V30: body bound to 210mm × 297mm", () => {
    expect(printBlock).toMatch(/width:\s*210mm/);
    expect(printBlock).toMatch(/height:\s*297mm/);
  });

  it("V30: no zoom property in @media print", () => {
    expect(printBlock).not.toMatch(/zoom\s*:/);
  });

  it("V31: body overflow hidden", () => {
    expect(printBlock).toMatch(/overflow:\s*hidden/);
  });

  it("V32: @page size A4", () => {
    expect(printBlock).toMatch(/@page\s*\{[^}]*size:\s*A4[^}]*\}/);
  });

  it("V32: @page margin 0", () => {
    expect(printBlock).toMatch(/@page\s*\{[^}]*margin:\s*0[^}]*\}/);
  });

  it("V32: Letter page size swap block comment present", () => {
    expect(printBlock).toMatch(/Letter page size swap block/);
    expect(printBlock).toMatch(/size:\s*Letter/);
  });

  it("V35: body margin 0 in @media print", () => {
    expect(printBlock).toMatch(/margin:\s*0/);
  });

  it("V35: body padding 1rem in @media print", () => {
    expect(printBlock).toMatch(/padding:\s*1rem/);
  });

  it("V34: html font-size set in @media print in pt units", () => {
    expect(printBlock).toMatch(/html\s*\{[^}]*font-size:\s*\d+pt[^}]*\}/);
  });

  it("V37: no :footer or :header @page pseudo-classes", () => {
    expect(printBlock).not.toMatch(/@page\s*:footer/);
    expect(printBlock).not.toMatch(/@page\s*:header/);
  });

  it("V36: #sidebarCard and #mainCard have flex-grow in @media print", () => {
    expect(printBlock).toMatch(/#sidebarCard[^{]*\{[^}]*flex-grow[^}]*\}/);
    expect(printBlock).toMatch(/#mainCard[^{]*\{[^}]*flex-grow[^}]*\}/);
  });
});
