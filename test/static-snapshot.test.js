import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Strip external resource tags so the parser does not fetch scripts/styles.
const html = readFileSync(path.resolve(__dirname, "../index.html"), "utf8")
  .replace(/<script[\s\S]*?<\/script>/g, "")
  .replace(/<link[^>]*>/g, "");
const doc = new DOMParser().parseFromString(html, "text/html");

const nonOverlayChildren = (el) =>
  [...el.children].filter((c) => !c.classList.contains("overlay-placeholder"));

describe("index.html static snapshots mirror inline render markup", () => {
  it("#skillsList holds a single bullet-joined li", () => {
    const list = doc.getElementById("skillsList");
    const lis = nonOverlayChildren(list).filter((c) => c.tagName === "LI");
    expect(lis.length).toBe(1);
    expect(lis[0].classList.contains("py-2")).toBe(true);
    expect(lis[0].textContent.trim()).toBe(
      "Javascript • SQL • Flutter • Rust • Kotlin • Python",
    );
    expect(lis[0].querySelector("div")).toBeNull();
    expect(lis[0].textContent).not.toContain("%");
  });

  it("#languagesContainer holds per-language bullet strings", () => {
    const container = doc.getElementById("languagesContainer");
    const children = nonOverlayChildren(container);
    const headings = children.filter((c) => c.tagName === "H3");
    const groups = children.filter((c) => c.tagName === "DIV");

    expect(headings.map((h) => h.textContent.trim())).toEqual([
      "Javascript",
      "HTML/CSS",
      "Android Kotlin",
      "Python",
      "Dart",
      "SQL Databases",
    ]);
    headings.forEach((h) => expect(h.className).toBe("pt-2 pb-1"));
    expect(groups.length).toBe(headings.length);

    const expected = [
      "TypeScript • NodeJS • SolidJS • ReactJS • NextJS • Express.js • Prisma ORM • 11ty's WebC",
      "TailwindCSS",
      "Jetpack Compose • Room Persistence Database",
      "LangChain • Odoo",
      "Flutter",
      "MySQL • PostgreSQL • SQLite",
    ];
    groups.forEach((wrap, i) => {
      expect(wrap.className).toBe("mb-1");
      const p = wrap.querySelector("p.text-base");
      expect(p).not.toBeNull();
      expect(p.className).toBe("text-base text-neutral-700");
      expect(p.textContent.trim()).toBe(expected[i]);
    });
    expect(container.querySelector(".bg-blue-100")).toBeNull();
  });

  it("project cards hold per-card bullet-joined tech strings", () => {
    const container = doc.getElementById("projectsContainer");
    const cards = nonOverlayChildren(container).filter((c) =>
      c.classList.contains("glow-on-hover"),
    );
    expect(cards.length).toBe(6);

    const expected = [
      "Yarn • NextJS • ReactJS • TailwindCSS • TypeScript • WebSockets",
      "SolidJS • NodeJS • TailwindCSS • TypeScript",
      "Dart • Flutter • SQL",
      "WebC for HTML • TailwindCSS • Pure JS • Web Components",
      "Kotlin • Android Studio • Jetpack Compose • Room Persistence Database",
      "NodeJS • Express • Prisma • React • Bootstrap",
    ];
    cards.forEach((card, i) => {
      const wrap = card.querySelector("div.mt-2");
      expect(wrap).not.toBeNull();
      expect(wrap.className).toBe("mt-2");
      const p = wrap.querySelector("p.text-base");
      expect(p).not.toBeNull();
      expect(p.className).toBe("text-base text-neutral-700");
      expect(p.textContent.trim()).toBe(expected[i]);
      expect(wrap.querySelector("span")).toBeNull();
    });
    expect(container.querySelector(".bg-blue-100")).toBeNull();
  });
});
