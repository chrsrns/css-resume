import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
