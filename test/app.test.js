import { gzipSync } from "node:zlib";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  resumeDocumentFixture,
  setFullPageHtml,
} from "./fixtures/resumeDocument.js";

class FakeIntersectionObserver {
  observe() { }
  unobserve() { }
  disconnect() { }
}

const setProjectsHtml = () => {
  document.body.innerHTML = `
    <button id="projectsViewToggle" type="button">Show Static List</button>
    <button id="projectsCarouselPrev" type="button">Prev</button>
    <button id="projectsCarouselNext" type="button">Next</button>
    <div id="projectsContainer">
      <div id="projectsCarousel" class="projects-carousel">
        <div class="projects-carousel-viewport">
          <div class="projects-carousel-track"></div>
        </div>
      </div>
    </div>
  `;
};

describe("carousel module load failure", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.doMock("../js/carousel.js", () => {
      throw new Error("module load failed");
    });
    vi.doMock("../js/websocket.js", () => ({
      createWebSocketWithReconnect: vi.fn(),
    }));
    vi.stubGlobal("fetch", async () => ({
      ok: true,
      json: async () => ({ body: [] }),
    }));
    window.__CONFIG__ = { API_BASE_URL: "/api", RESUME_ID: 1 };
    setProjectsHtml();
  });

  afterEach(() => {
    vi.doUnmock("../js/carousel.js");
    vi.doUnmock("../js/websocket.js");
    vi.unstubAllGlobals();
  });

  it("degrades to the static project list without throwing", async () => {
    const { onReady } = await import("../js/app.js");
    await expect(onReady()).resolves.toBeUndefined();
    const container = document.getElementById("projectsContainer");
    expect(container.classList.contains("static-active")).toBe(true);
  });
});

const settleAllImages = async (ready) => {
  for (let i = 0; i < 50; i++) {
    for (const img of document.querySelectorAll("img")) {
      img.dispatchEvent(new Event("load"));
    }
    if (window.__RESUME_RENDER_DONE__) break;
    await new Promise((r) => setTimeout(r, 5));
  }
  await ready;
};

describe("JSON mode boot", () => {
  let fetchSpy;
  let wsSpy;

  beforeEach(() => {
    vi.resetModules();
    wsSpy = vi.fn();
    vi.doMock("../js/websocket.js", () => ({
      createWebSocketWithReconnect: wsSpy,
    }));
    fetchSpy = vi.fn(async () => ({
      ok: true,
      json: async () => ({ body: [] }),
    }));
    vi.stubGlobal("fetch", fetchSpy);
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    setFullPageHtml();
  });

  afterEach(() => {
    vi.doUnmock("../js/websocket.js");
    vi.unstubAllGlobals();
    delete window.__CONFIG__;
    delete window.__RESUME_RENDER_DONE__;
  });

  it("renders every section from RESUME_JSON without fetch or WebSocket", async () => {
    window.__CONFIG__ = {
      RESUME_ID: "bogus",
      RESUME_JSON: resumeDocumentFixture(),
    };
    const { onReady } = await import("../js/app.js");
    await settleAllImages(onReady());

    expect(document.getElementById("profileName").textContent).toBe("Jane Doe");
    expect(document.title).toBe("Online Resume - Jane Doe");
    expect(
      document.getElementById("professionalSummaryContainer").textContent,
    ).toContain("Seasoned developer.");
    expect(document.querySelectorAll("#skillsList li").length).toBe(1);
    expect(
      document.getElementById("educationContainer").textContent,
    ).toContain("State University");
    expect(
      document.getElementById("experienceContainer").textContent,
    ).toContain("Engineer @ Acme");
    expect(
      document.getElementById("languagesContainer").textContent,
    ).toContain("Rocket");
    expect(
      document.querySelectorAll("#projectsContainer .static-project-card")
        .length,
    ).toBe(2);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(wsSpy).not.toHaveBeenCalled();
  });

  it("builds carousel markup and activates the carousel view", async () => {
    window.__CONFIG__ = { RESUME_JSON: resumeDocumentFixture() };
    const { onReady } = await import("../js/app.js");
    await settleAllImages(onReady());

    const container = document.getElementById("projectsContainer");
    const track = document.querySelector(".projects-carousel-track");
    expect(track.querySelectorAll(".projects-carousel-slide").length).toBe(2);
    expect(container.classList.contains("carousel-active")).toBe(true);
  });

  it("renders fully offline even when every fetch would fail", async () => {
    fetchSpy.mockRejectedValue(new TypeError("network down"));
    window.__CONFIG__ = { RESUME_JSON: resumeDocumentFixture() };
    const { onReady } = await import("../js/app.js");
    await settleAllImages(onReady());

    expect(document.getElementById("profileName").textContent).toBe("Jane Doe");
    expect(
      document.querySelectorAll("#projectsContainer .static-project-card")
        .length,
    ).toBe(2);
    expect(window.__RESUME_RENDER_DONE__).toBe(true);
    expect(
      document.getElementById("jsonErrorBanner").classList.contains("hidden"),
    ).toBe(true);
  });

  it("accepts an envelope document", async () => {
    window.__CONFIG__ = {
      RESUME_JSON: {
        schema_version: 1,
        generator: "projects_backend_database",
        document: resumeDocumentFixture(),
      },
    };
    const { onReady } = await import("../js/app.js");
    await settleAllImages(onReady());
    expect(document.getElementById("profileName").textContent).toBe("Jane Doe");
  });
});

describe("JSON mode render completion", () => {
  let fetchSpy;
  let wsSpy;

  beforeEach(() => {
    vi.resetModules();
    wsSpy = vi.fn();
    vi.doMock("../js/websocket.js", () => ({
      createWebSocketWithReconnect: wsSpy,
    }));
    fetchSpy = vi.fn(async () => ({
      ok: true,
      json: async () => ({ body: [] }),
    }));
    vi.stubGlobal("fetch", fetchSpy);
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    setFullPageHtml();
  });

  afterEach(() => {
    vi.doUnmock("../js/websocket.js");
    vi.unstubAllGlobals();
    restoreLocation();
    delete window.__CONFIG__;
    delete window.__RESUME_RENDER_DONE__;
  });

  it("sets __RESUME_RENDER_DONE__ and hides overlays after rendering", async () => {
    window.__CONFIG__ = { RESUME_JSON: resumeDocumentFixture() };
    const { onReady } = await import("../js/app.js");
    await settleAllImages(onReady());

    expect(window.__RESUME_RENDER_DONE__).toBe(true);
    for (const overlay of document.querySelectorAll(
      ".overlay-placeholder",
    )) {
      expect(overlay.classList.contains("hidden")).toBe(true);
    }
  });

  it("does not set __RESUME_RENDER_DONE__ in API mode", async () => {
    window.__CONFIG__ = { API_BASE_URL: "/api", RESUME_ID: 1 };
    const { onReady } = await import("../js/app.js");
    await onReady();
    expect(window.__RESUME_RENDER_DONE__).toBeUndefined();
  });

  it("waits for rendered images to settle before setting the flag", async () => {
    const doc = resumeDocumentFixture();
    doc.portfolio_projects[0].image_url = "https://example.com/card.png";
    window.__CONFIG__ = { RESUME_JSON: doc };
    const { onReady } = await import("../js/app.js");
    const ready = onReady();

    await new Promise((r) => setTimeout(r, 50));
    expect(window.__RESUME_RENDER_DONE__).toBeUndefined();

    const pendingImgs = [...document.querySelectorAll("img")].filter(
      (img) => img.getAttribute("src"),
    );
    expect(pendingImgs.length).toBeGreaterThan(1);

    // settle one image at a time; flag must wait for all of them
    pendingImgs[0].dispatchEvent(new Event("load"));
    await new Promise((r) => setTimeout(r, 20));
    expect(window.__RESUME_RENDER_DONE__).toBeUndefined();

    for (const img of pendingImgs.slice(1)) {
      img.dispatchEvent(new Event("error"));
    }
    await ready;
    expect(window.__RESUME_RENDER_DONE__).toBe(true);
  });
});

const originalLocationDescriptor = Object.getOwnPropertyDescriptor(
  window,
  "location",
);

const stubLocation = (location) => {
  Object.defineProperty(window, "location", {
    value: location,
    configurable: true,
    writable: true,
  });
};

const restoreLocation = () => {
  Object.defineProperty(window, "location", originalLocationDescriptor);
};

describe("JSON mode error state", () => {
  let fetchSpy;
  let wsSpy;

  beforeEach(() => {
    vi.resetModules();
    wsSpy = vi.fn();
    vi.doMock("../js/websocket.js", () => ({
      createWebSocketWithReconnect: wsSpy,
    }));
    fetchSpy = vi.fn(async () => ({
      ok: true,
      json: async () => ({ body: [] }),
    }));
    vi.stubGlobal("fetch", fetchSpy);
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    setFullPageHtml();
  });

  afterEach(() => {
    vi.doUnmock("../js/websocket.js");
    vi.unstubAllGlobals();
    restoreLocation();
    delete window.__CONFIG__;
    delete window.__RESUME_RENDER_DONE__;
  });

  it("shows the error banner on malformed RESUME_JSON and hides overlays", async () => {
    window.__CONFIG__ = { RESUME_JSON: "{not json" };
    const { onReady } = await import("../js/app.js");
    await onReady();

    const banner = document.getElementById("jsonErrorBanner");
    expect(banner.classList.contains("hidden")).toBe(false);
    expect(banner.textContent.length).toBeGreaterThan(0);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(wsSpy).not.toHaveBeenCalled();
    expect(window.__RESUME_RENDER_DONE__).toBeUndefined();

    for (const overlay of document.querySelectorAll(".overlay-placeholder")) {
      expect(overlay.classList.contains("hidden")).toBe(true);
    }
  });

  it("shows the error banner on a schema_version mismatch", async () => {
    window.__CONFIG__ = {
      RESUME_JSON: {
        schema_version: 2,
        generator: "x",
        document: resumeDocumentFixture(),
      },
    };
    const { onReady } = await import("../js/app.js");
    await onReady();

    const banner = document.getElementById("jsonErrorBanner");
    expect(banner.classList.contains("hidden")).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("shows the error banner on an invalid document shape", async () => {
    window.__CONFIG__ = { RESUME_JSON: { skills: [] } };
    const { onReady } = await import("../js/app.js");
    await onReady();

    const banner = document.getElementById("jsonErrorBanner");
    expect(banner.classList.contains("hidden")).toBe(false);
  });

  it("does not fall through to a lower-precedence source on failure", async () => {
    window.__CONFIG__ = {
      RESUME_JSON: "{not json",
      RESUME_JSON_URL: "https://example.com/valid.json",
    };
    const { onReady } = await import("../js/app.js");
    await onReady();

    const banner = document.getElementById("jsonErrorBanner");
    expect(banner.classList.contains("hidden")).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(document.getElementById("profileName").textContent).toBe("");
  });

  it("shows the error banner when the ?json-url fetch fails", async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });
    stubLocation({
      search: "?json-url=https%3A%2F%2Fexample.com%2Fdoc.json",
      hash: "",
      href: "http://localhost/?json-url=https%3A%2F%2Fexample.com%2Fdoc.json",
    });
    window.__CONFIG__ = {};
    const { onReady } = await import("../js/app.js");
    await onReady();

    const banner = document.getElementById("jsonErrorBanner");
    expect(banner.classList.contains("hidden")).toBe(false);
    expect(fetchSpy.mock.calls.length).toBeGreaterThan(0);
    for (const call of fetchSpy.mock.calls) {
      expect(call[0]).toBe("https://example.com/doc.json");
    }
    expect(wsSpy).not.toHaveBeenCalled();
  });
});

const toFragmentJson = (doc) =>
  Buffer.from(JSON.stringify(doc), "utf8").toString("base64url");

const toFragmentJsonGzip = (doc) =>
  gzipSync(JSON.stringify(doc)).toString("base64url");

describe("JSON fragment sources", () => {
  let fetchSpy;
  let wsSpy;

  beforeEach(() => {
    vi.resetModules();
    wsSpy = vi.fn();
    vi.doMock("../js/websocket.js", () => ({
      createWebSocketWithReconnect: wsSpy,
    }));
    fetchSpy = vi.fn(async () => ({
      ok: true,
      json: async () => ({ body: [] }),
    }));
    vi.stubGlobal("fetch", fetchSpy);
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    setFullPageHtml();
  });

  afterEach(() => {
    vi.doUnmock("../js/websocket.js");
    vi.unstubAllGlobals();
    restoreLocation();
    delete window.__CONFIG__;
    delete window.__RESUME_RENDER_DONE__;
  });

  const boot = async (hash) => {
    stubLocation({ search: "", hash, href: `http://localhost/${hash}` });
    window.__CONFIG__ = {};
    const { onReady } = await import("../js/app.js");
    const ready = onReady();
    await settleAllImages(ready);
    return ready;
  };

  it("renders a document from the #json fragment with no fetch", async () => {
    await boot(`#json=${toFragmentJson(resumeDocumentFixture())}`);

    expect(document.getElementById("profileName").textContent).toBe("Jane Doe");
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(wsSpy).not.toHaveBeenCalled();
    expect(window.__RESUME_RENDER_DONE__).toBe(true);
  });

  it("renders a document from the #json.gz fragment (gzip round-trip)", async () => {
    await boot(`#json.gz=${toFragmentJsonGzip(resumeDocumentFixture())}`);

    expect(document.getElementById("profileName").textContent).toBe("Jane Doe");
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(window.__RESUME_RENDER_DONE__).toBe(true);
  });

  it("shows the error banner for an invalid #json payload", async () => {
    await boot("#json=not!base64url");

    const banner = document.getElementById("jsonErrorBanner");
    expect(banner.classList.contains("hidden")).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(window.__RESUME_RENDER_DONE__).toBeUndefined();
  });

  it("shows the error banner for #json that decodes to bad JSON", async () => {
    const bad = Buffer.from("{nope", "utf8").toString("base64url");
    await boot(`#json=${bad}`);

    const banner = document.getElementById("jsonErrorBanner");
    expect(banner.classList.contains("hidden")).toBe(false);
  });

  it("shows the error banner when DecompressionStream is unavailable", async () => {
    vi.stubGlobal("DecompressionStream", undefined);
    await boot(`#json.gz=${toFragmentJsonGzip(resumeDocumentFixture())}`);

    const banner = document.getElementById("jsonErrorBanner");
    expect(banner.classList.contains("hidden")).toBe(false);
    expect(window.__RESUME_RENDER_DONE__).toBeUndefined();
  });

  it("shows the error banner for corrupt gzip data", async () => {
    const corrupt = Buffer.from("not gzip at all", "utf8").toString(
      "base64url",
    );
    await boot(`#json.gz=${corrupt}`);

    const banner = document.getElementById("jsonErrorBanner");
    expect(banner.classList.contains("hidden")).toBe(false);
  });

  it("shows the error banner when decompressed output exceeds 16 MB", async () => {
    const huge = JSON.stringify({
      resume: { name: "Jane", email: "x" },
      pad: "x".repeat(17 * 1024 * 1024),
    });
    await boot(`#json.gz=${gzipSync(huge).toString("base64url")}`);

    const banner = document.getElementById("jsonErrorBanner");
    expect(banner.classList.contains("hidden")).toBe(false);
    expect(banner.textContent).toContain("16 MB");
  });

  it("rejects a fragment payload containing standard-base64 characters", async () => {
    await boot(`#json=${toFragmentJson(resumeDocumentFixture())}+`);

    const banner = document.getElementById("jsonErrorBanner");
    expect(banner.classList.contains("hidden")).toBe(false);
  });

  it("does not fall through to RESUME_JSON when the fragment fails", async () => {
    stubLocation({
      search: "",
      hash: "#json=%%%bad",
      href: "http://localhost/#json=%%%bad",
    });
    window.__CONFIG__ = { RESUME_JSON: resumeDocumentFixture() };
    const { onReady } = await import("../js/app.js");
    await onReady();

    const banner = document.getElementById("jsonErrorBanner");
    expect(banner.classList.contains("hidden")).toBe(false);
    expect(document.getElementById("profileName").textContent).toBe("");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("API mode ?resume_id override", () => {
  let fetchSpy;
  let wsSpy;

  beforeEach(() => {
    vi.resetModules();
    wsSpy = vi.fn();
    vi.doMock("../js/websocket.js", () => ({
      createWebSocketWithReconnect: wsSpy,
    }));
    fetchSpy = vi.fn(async () => ({
      ok: true,
      json: async () => ({ body: [] }),
    }));
    vi.stubGlobal("fetch", fetchSpy);
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    setFullPageHtml();
  });

  afterEach(() => {
    vi.doUnmock("../js/websocket.js");
    vi.unstubAllGlobals();
    restoreLocation();
    delete window.__CONFIG__;
    delete window.__RESUME_RENDER_DONE__;
  });

  const bootApi = async (
    search,
    config = { API_BASE_URL: "/api", RESUME_ID: 1 },
  ) => {
    stubLocation({ search, hash: "", href: `http://localhost/${search}` });
    window.__CONFIG__ = config;
    const { onReady } = await import("../js/app.js");
    await onReady();
  };

  it("fetches every section and subscribes with the ?resume_id override", async () => {
    await bootApi("?resume_id=7");

    expect(fetchSpy).toHaveBeenCalled();
    for (const [url] of fetchSpy.mock.calls) {
      expect(url).toContain("/resume/7");
    }
    expect(wsSpy).toHaveBeenCalledWith("/api", 7, null, expect.any(Function));
  });

  it("ignores an invalid ?resume_id and falls back to RESUME_ID", async () => {
    await bootApi("?resume_id=abc");

    expect(fetchSpy).toHaveBeenCalled();
    for (const [url] of fetchSpy.mock.calls) {
      expect(url).toContain("/resume/1");
    }
    expect(wsSpy).toHaveBeenCalledWith("/api", 1, null, expect.any(Function));
  });

  it("a resume.changed refresh fetches the resolved id", async () => {
    await bootApi("?resume_id=7");
    fetchSpy.mockClear();

    const handler = wsSpy.mock.calls[0][3];
    handler({
      data: JSON.stringify({
        type: "resume.changed",
        resume_id: 7,
        action: { updated: "skills" },
      }),
    });
    await new Promise((r) => setTimeout(r, 0));

    expect(fetchSpy).toHaveBeenCalled();
    for (const [url] of fetchSpy.mock.calls) {
      expect(url).toContain("/resume/7/skills");
    }
  });

  it("ignores resume.changed events for a different resume id", async () => {
    await bootApi("?resume_id=7");
    fetchSpy.mockClear();

    const handler = wsSpy.mock.calls[0][3];
    handler({
      data: JSON.stringify({
        type: "resume.changed",
        resume_id: 99,
        action: { updated: "skills" },
      }),
    });
    await new Promise((r) => setTimeout(r, 0));

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("a JSON source beats ?resume_id", async () => {
    stubLocation({
      search: "?resume_id=9",
      hash: "",
      href: "http://localhost/?resume_id=9",
    });
    window.__CONFIG__ = { RESUME_JSON: resumeDocumentFixture() };
    const { onReady } = await import("../js/app.js");
    await settleAllImages(onReady());

    expect(document.getElementById("profileName").textContent).toBe("Jane Doe");
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(wsSpy).not.toHaveBeenCalled();
  });
});
