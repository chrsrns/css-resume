import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

const resumeDocumentFixture = () => ({
  resume: {
    id: 1,
    name: "Jane Doe",
    email: "jane@example.com",
    executive_summary: "Seasoned developer.",
    location: "New York, NY",
    github_url: "https://github.com/janedoe",
    mobile_number: "+1 555",
    profile_image_url: "https://example.com/p.jpg",
  },
  education: [
    {
      id: 1,
      resume_id: 1,
      education_stage: "BS",
      institution_name: "State University",
      degree: "Computer Science",
      start_date: "2020-09",
      end_date: "2024-05",
      description: "Studied systems.",
      display_order: 1,
      active: true,
    },
  ],
  education_key_points: {
    1: [
      {
        id: 1,
        education_id: 1,
        key_point: "Graduated with honors",
        display_order: 1,
        active: true,
      },
    ],
  },
  skills: [
    {
      id: 1,
      resume_id: 1,
      skill_name: "Rust",
      confidence_percentage: 90,
      display_order: 1,
    },
  ],
  work_experiences: [
    {
      id: 1,
      resume_id: 1,
      job_title: "Engineer",
      company_name: "Acme",
      start_date: "2020-01",
      end_date: null,
      description: "Built services.",
      display_order: 1,
      active: true,
    },
  ],
  work_experience_key_points: {
    1: [
      {
        id: 1,
        work_experience_id: 1,
        key_point: "Led the team",
        display_order: 1,
        active: true,
      },
    ],
  },
  portfolio_projects: [
    {
      id: 1,
      resume_id: 1,
      project_name: "Resume Engine",
      image_url: "",
      project_link: "https://example.com",
      source_code_link: "https://github.com/janedoe/proj",
      description: "Demo project",
      display_order: 1,
      active: true,
      video_url: null,
    },
    {
      id: 2,
      resume_id: 1,
      project_name: "Second Project",
      image_url: "",
      project_link: "https://example.org",
      source_code_link: "https://github.com/janedoe/proj2",
      description: "Another demo",
      display_order: 2,
      active: true,
      video_url: null,
    },
  ],
  portfolio_key_points: {
    1: [
      {
        id: 1,
        portfolio_project_id: 1,
        key_point: "Shipped v1",
        display_order: 1,
        active: true,
      },
    ],
  },
  portfolio_technologies: {
    1: [
      {
        id: 1,
        portfolio_project_id: 1,
        technology_name: "Rust",
        display_order: 1,
        active: true,
      },
    ],
  },
  languages: [
    { id: 1, resume_id: 1, language_name: "Rust", display_order: 1 },
  ],
  frameworks: {
    1: [
      {
        id: 1,
        language_id: 1,
        framework_name: "Rocket",
        display_order: 1,
      },
    ],
  },
});

const setFullPageHtml = () => {
  document.body.innerHTML = `
    <div id="jsonErrorBanner" class="hidden print:hidden"></div>
    <div id="profilePlaceholderOverlay" class="overlay-placeholder opacity-100"></div>
    <h1 id="profileName"></h1>
    <img id="profileImage" />
    <span id="profileLocationPart1"></span>
    <span id="profileLocationPart2"></span>
    <a id="profileEmailLink"><span id="profileEmailText1"></span><span id="profileEmailText2"></span></a>
    <a id="profileGithubLink"><span id="profileGithubText"></span></a>
    <span id="profileMobile"></span>
    <ul id="skillsList" class="relative">
      <div id="skillsPlaceholderOverlay" class="overlay-placeholder opacity-100"></div>
    </ul>
    <div id="languagesContainer" class="relative">
      <div id="languagesPlaceholderOverlay" class="overlay-placeholder opacity-100"></div>
    </div>
    <h1 id="professionalSummaryHeading" class="text-2xl">Professional Summary</h1>
    <div id="professionalSummaryContainer" class="relative">
      <div id="professionalSummaryPlaceholderOverlay" class="overlay-placeholder opacity-100"></div>
    </div>
    <h1 id="educationHeading">Education</h1>
    <div id="educationContainer" class="relative">
      <div id="educationPlaceholderOverlay" class="overlay-placeholder opacity-100"></div>
    </div>
    <div id="experienceContainer" class="relative">
      <div id="experiencePlaceholderOverlay" class="overlay-placeholder opacity-100"></div>
    </div>
    <button id="projectsViewToggle" type="button">Show Static List</button>
    <button id="projectsCarouselPrev" type="button">Prev</button>
    <button id="projectsCarouselNext" type="button">Next</button>
    <div id="projectsContainer" class="relative">
      <div id="projectsPlaceholderOverlay" class="overlay-placeholder opacity-100"></div>
      <div id="projectsCarousel" class="projects-carousel">
        <div class="projects-carousel-viewport">
          <div class="projects-carousel-track"></div>
        </div>
      </div>
    </div>
  `;
};

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
