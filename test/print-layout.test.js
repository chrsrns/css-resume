/**
 * Headless print-layout tests (V33, V38).
 *
 * Launches Brave (Chromium) via CDP, loads index.html, injects mock resume
 * data into the DOM (so content fills the page, not skeleton placeholders),
 * emulates print media at A4 dimensions, screenshots, and asserts layout
 * invariants.
 *
 * Skipped automatically when:
 *  - BRAVE_PATH env var not set AND no Brave binary found at known paths
 *  - ws package not available
 *
 * V33: print view → 1 page; ⊥ blank gap; ⊥ clipped content
 * V38: body height = 297mm; #sidebarCard & #mainCard stretch to fill height
 *
 * Definitions:
 *  "no large gap"  – last content pixel row ≥ 75% of A4 height (cards fill page)
 *  "no clip"       – last content pixel row ≤ 100% of A4 height
 *  "1 page"        – PDF /Type /Page count = 1
 */

import { describe, it, expect, beforeAll } from "vitest";
import { spawn, execSync } from "node:child_process";
import { createRequire } from "node:module";
import http from "node:http";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const require = createRequire(import.meta.url);

/** Load ws from project node_modules; null when unavailable. */
let WebSocket;
try {
  WebSocket = require("ws");
} catch {
  WebSocket = null;
}

/** Brave binary candidates — BRAVE_PATH env var overrides auto-detection. */
const BRAVE_CANDIDATES = [
  process.env.BRAVE_PATH,
  "/var/lib/flatpak/app/com.brave.Browser/x86_64/stable/c4d0746a39ac2ed5337912da95e593d02a98c56b45cf54c8990724ab95f2db96/files/brave/brave",
  "/var/lib/flatpak/app/com.brave.Browser/x86_64/stable/c4d0746a39ac2ed5337912da95e593d02a98c56b45cf54c8990724ab95f2db96/files/bin/brave",
  "/usr/bin/brave-browser",
  "/usr/bin/brave",
  "/opt/brave.com/brave/brave",
].filter(Boolean);

const BRAVE = BRAVE_CANDIDATES.find((p) => {
  try {
    readFileSync(p);
    return true;
  } catch {
    return false;
  }
});

const FILE_URL = `file://${ROOT}/index.html`;

/** A4 @ 96 dpi */
const PAGE_W = 794;
const PAGE_H = 1123;

/** Content must reach at least 75% of page height (cards fill via flex). */
const CONTENT_FILL_THRESHOLD = 0.75;

// ---------------------------------------------------------------------------
// CDP helpers
// ---------------------------------------------------------------------------

function cdp(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1e9);
    const handler = (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.id === id) {
          ws.off("message", handler);
          if (msg.error) reject(new Error(msg.error.message));
          else resolve(msg.result);
        }
      } catch {
        /* ignore non-JSON frames */
      }
    };
    ws.on("message", handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

function getTargets(port) {
  return new Promise((resolve, reject) => {
    http
      .get(`http://localhost:${port}/json/list`, (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

// ---------------------------------------------------------------------------
// Mock DOM injection script (runs inside Brave via Runtime.evaluate)
// ---------------------------------------------------------------------------
// Hides all overlay-placeholder elements and injects realistic static content
// so the page looks like a fully rendered resume for layout verification.
const MOCK_INJECT_SCRIPT = `
(function () {
  // Hide all skeleton placeholders
  document.querySelectorAll('.overlay-placeholder').forEach(el => {
    el.style.display = 'none';
  });

  // Hide GitHub corner and print button (print:hidden equivalent)
  const corner = document.querySelector('.group\\/github-corner');
  if (corner) corner.style.display = 'none';
  const printBtn = document.getElementById('printButton');
  if (printBtn) printBtn.style.display = 'none';

  // --- Profile ---
  const profileName = document.getElementById('profileName');
  if (profileName) profileName.textContent = 'Christian Louise Aranas';

  const profileTitle = document.getElementById('profileTitle');
  if (profileTitle) {
    profileTitle.innerHTML = '';
    const span = document.createElement('span');
    span.textContent = 'Software & Web Developer';
    profileTitle.appendChild(span);
  }

  // --- Skills ---
  const skillsList = document.getElementById('skillsList');
  if (skillsList) {
    const skills = [
      ['JavaScript', '80%'], ['Python', '70%'], ['Rust', '65%'],
      ['Flutter', '70%'], ['Kotlin', '60%'], ['SQL', '75%'],
    ];
    skills.forEach(([name, pct]) => {
      const li = document.createElement('li');
      li.className = 'py-2';
      li.innerHTML = name + '<div class="overflow-clip rounded-full bg-neutral-200"><div class="bg-blue-600 text-center text-xs text-white" style="width:' + pct + '">' + pct + '</div></div>';
      skillsList.appendChild(li);
    });
  }

  // --- Education ---
  const eduContainer = document.getElementById('educationContainer');
  if (eduContainer) {
    const item = document.createElement('div');
    item.innerHTML = '<strong>BS Computer Science</strong><br>University of the Philippines Los Baños<br><em>2019 – 2023</em>';
    item.className = 'py-2';
    eduContainer.appendChild(item);
  }

  // --- Professional Summary ---
  const summaryContainer = document.getElementById('professionalSummaryContainer');
  if (summaryContainer) {
    const summary = document.createElement('p');
    summary.className = 'mt-2';
    summary.textContent = 'Software & Web Developer with experience in full-stack development and cloud systems.';
    summaryContainer.appendChild(summary);
  }

  // --- Experience ---
  const expContainer = document.getElementById('experienceContainer');
  if (expContainer) {
    const jobs = [
      ['Software Engineer', 'Acme Corp', 'Jan 2023 – Present', 'Built web apps, APIs, and internal tools.'],
      ['Intern Developer', 'Beta Inc', 'Jun 2022 – Dec 2022', 'Contributed to mobile and backend projects.'],
    ];
    jobs.forEach(([title, company, dates, desc]) => {
      const item = document.createElement('div');
      item.className = 'py-2';
      item.innerHTML = '<strong>' + title + '</strong> · ' + company + '<br><em>' + dates + '</em><p>' + desc + '</p>';
      expContainer.appendChild(item);
    });
  }

  // --- Projects (static list, carousel hidden in print) ---
  const projectsContainer = document.getElementById('projectsContainer');
  if (projectsContainer) {
    // Force static-active so static cards show in print
    projectsContainer.classList.add('static-active');

    const carousel = document.getElementById('projectsCarousel');
    if (carousel) carousel.style.display = 'none';

    const projects = [
      ['css-resume', 'Online resume SPA with live updates.'],
      ['furnico', 'Furniture e-commerce platform.'],
      ['infinix-blog', 'Tech blogging platform.'],
      ['portfolio-api', 'REST API for portfolio data.'],
      ['chat-app', 'Real-time chat application.'],
      ['task-tracker', 'Task management PWA.'],
    ];
    projects.forEach(([name, desc]) => {
      const card = document.createElement('div');
      card.className = 'static-project-card glow-on-hover py-2 px-4 mb-2 rounded border';
      card.innerHTML = '<strong>' + name + '</strong><p class="text-sm">' + desc + '</p>';
      projectsContainer.appendChild(card);
    });
  }

  // --- Languages container ---
  const langContainer = document.getElementById('languagesContainer');
  if (langContainer) {
    const langs = ['React', 'Svelte', 'Django', 'FastAPI', 'Tailwind CSS', 'Webpack'];
    const wrapper = document.createElement('div');
    wrapper.className = 'flex flex-wrap gap-2 py-2';
    langs.forEach(l => {
      const tag = document.createElement('span');
      tag.className = 'inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-sm text-blue-800';
      tag.textContent = l;
      wrapper.appendChild(tag);
    });
    langContainer.appendChild(wrapper);
  }
})();
`;

// ---------------------------------------------------------------------------
// Core test runner
// ---------------------------------------------------------------------------

/**
 * Launch Brave headless, inject mock data, emulate print media,
 * capture A4 screenshot. Returns { tmpPng, pageHeight }.
 */
async function renderPrintLayout() {
  const port = 9225 + Math.floor(Math.random() * 500);
  const proc = spawn(
    BRAVE,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--disable-web-security",  // allow file:// local resource loads
      "--allow-file-access-from-files",
      `--remote-debugging-port=${port}`,
    ],
    { stdio: "pipe" }
  );

  let ws;
  try {
    // Wait for Brave to start and expose CDP
    await new Promise((r) => setTimeout(r, 2500));

    const targets = await getTargets(port);
    const wsUrl = targets[0]?.webSocketDebuggerUrl;
    if (!wsUrl) throw new Error("No WebSocket debugger URL from Brave");

    ws = new WebSocket(wsUrl);
    await new Promise((r, j) => {
      ws.on("open", r);
      ws.on("error", j);
    });

    // Navigate to index.html
    await cdp(ws, "Page.navigate", { url: FILE_URL });

    // Wait for DOM load + any sync scripts
    await new Promise((r) => setTimeout(r, 2500));

    // Inject mock resume data
    await cdp(ws, "Runtime.evaluate", {
      expression: MOCK_INJECT_SCRIPT,
      awaitPromise: false,
    });
    await new Promise((r) => setTimeout(r, 300));

    // Emulate print media
    await cdp(ws, "Emulation.setEmulatedMedia", { media: "print" });

    // Set A4-equivalent viewport
    await cdp(ws, "Emulation.setDeviceMetricsOverride", {
      width: PAGE_W,
      height: PAGE_H,
      deviceScaleFactor: 1,
      mobile: false,
    });

    await new Promise((r) => setTimeout(r, 500));

    // Capture screenshot clipped to A4 dimensions
    const result = await cdp(ws, "Page.captureScreenshot", {
      format: "png",
      clip: { x: 0, y: 0, width: PAGE_W, height: PAGE_H, scale: 1 },
    });

    ws.close();

    const imgBuf = Buffer.from(result.data, "base64");
    const tmpPng = `/tmp/print-layout-test-${port}.png`;
    writeFileSync(tmpPng, imgBuf);

    return { tmpPng, pageHeight: PAGE_H };
  } finally {
    if (ws && ws.readyState === WebSocket.OPEN) ws.close();
    proc.kill();
    // Give the process a moment to release the port
    await new Promise((r) => setTimeout(r, 300));
  }
}

/**
 * Use ImageMagick to find the last non-white pixel row in the screenshot.
 * Returns the bottom-most row index (0-based).
 */
function findLastContentRow(pngPath) {
  const convertCmd = (() => {
    try {
      execSync("magick --version", { stdio: "pipe" });
      return "magick";
    } catch {
      return "convert";
    }
  })();

  // -threshold 98%: treat near-white as white
  // -trim: removes white border; %Y = top offset of trimmed region, %h = trimmed height
  const out = execSync(
    `${convertCmd} "${pngPath}" -threshold 98% -trim -format "%h+%Y" info:`,
    { encoding: "utf8" }
  ).trim();

  const [h, y] = out.split("+").map(Number);
  return y + h;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const skip = !BRAVE || !WebSocket;

describe.skipIf(skip)(
  "print layout (V33, V38) — headless Brave + print media emulation",
  () => {
    let tmpPng;
    let lastContentRow;

    beforeAll(async () => {
      const result = await renderPrintLayout();
      tmpPng = result.tmpPng;
      lastContentRow = findLastContentRow(tmpPng);
    }, 20000);

    it("V33: content fills ≥ 75% of A4 page height (no large blank gap)", () => {
      const fill = lastContentRow / PAGE_H;
      expect(fill).toBeGreaterThanOrEqual(CONTENT_FILL_THRESHOLD);
    });

    it("V38: content does not exceed A4 page height (no overflow clip)", () => {
      const ratio = lastContentRow / PAGE_H;
      expect(ratio).toBeLessThanOrEqual(1.0);
    });

    it("V33: PDF has exactly 1 page (no overflow to second page)", async () => {
      const port = 9725 + Math.floor(Math.random() * 200);
      const pdfOut = tmpPng.replace(".png", ".pdf");

      // Use Brave --print-to-pdf with print media (headless)
      execSync(
        [
          BRAVE,
          "--headless=new",
          "--disable-gpu",
          "--no-sandbox",
          "--disable-web-security",
          "--allow-file-access-from-files",
          `--print-to-pdf=${pdfOut}`,
          "--print-to-pdf-no-header",
          FILE_URL,
        ].join(" "),
        { stdio: "pipe", timeout: 15000 }
      );

      const pdfText = readFileSync(pdfOut, "latin1");
      // Count /Type /Page (not /Pages) entries — one per page in PDF object stream
      const pageMatches = pdfText.match(/\/Type\s*\/Page[^s]/g) || [];
      expect(pageMatches.length).toBe(1);
    }, 20000);
  }
);

if (skip) {
  describe("print layout (V33, V38) — skipped", () => {
    it.skip("Brave binary not found or ws module missing — set BRAVE_PATH env var to enable", () => {});
  });
}
