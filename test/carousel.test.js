import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderProjects } from "../js/renderers.js";
import {
  destroyProjectsCarousel,
  getProjectCount,
  initProjectsCarousel,
  initProjectsToggle,
  showProjectsCarouselView,
  showProjectsStaticView,
} from "../js/carousel.js";

class FakeIntersectionObserver {
  observe() { }
  unobserve() { }
  disconnect() { }
}

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
});

const setProjectsHtml = () => {
  document.body.innerHTML = `
    <button id="projectsViewToggle" type="button">Show Static List</button>
    <div id="projectsContainer">
      <div id="projectsCarousel" class="projects-carousel">
        <div class="projects-carousel-viewport">
          <div class="projects-carousel-track"></div>
        </div>
        <button type="button" class="projects-carousel-prev">Prev</button>
        <button type="button" class="projects-carousel-next">Next</button>
      </div>
    </div>
  `;
};

const projectFixture = (id, overrides = {}) => ({
  id,
  project_name: `Project ${id}`,
  project_link: `https://demo${id}.example.com`,
  source_code_link: `https://github.com/proj${id}`,
  ...overrides,
});

describe("renderProjects carousel markup", () => {
  beforeEach(() => {
    setProjectsHtml();
  });

  it("renders static cards and carousel slides for each project", () => {
    const projects = [projectFixture(1), projectFixture(2), projectFixture(3)];
    renderProjects(projects, {}, {});

    const container = document.getElementById("projectsContainer");
    const track = document.querySelector(".projects-carousel-track");

    expect(container.querySelectorAll(".static-project-card").length).toBe(3);
    expect(track.querySelectorAll(".projects-carousel-slide").length).toBe(3);
  });

  it("returns projectCount equal to number of projects", () => {
    const result = renderProjects([projectFixture(1), projectFixture(2)], {}, {});
    expect(result.projectCount).toBe(2);
  });

  it("static cards are direct children of projectsContainer with class glow-on-hover", () => {
    renderProjects([projectFixture(1)], {}, {});
    const container = document.getElementById("projectsContainer");
    const staticCards = container.querySelectorAll(
      ".static-project-card.glow-on-hover"
    );
    expect(staticCards.length).toBe(1);
    expect(staticCards[0].parentElement).toBe(container);
  });

  it("carousel markup is rendered after the static list", () => {
    renderProjects([projectFixture(1), projectFixture(2)], {}, {});
    const container = document.getElementById("projectsContainer");
    const children = Array.from(container.children);
    const staticCardIndex = children.findIndex((c) =>
      c.classList.contains("static-project-card")
    );
    const carouselIndex = children.findIndex((c) => c.id === "projectsCarousel");
    expect(staticCardIndex).toBeGreaterThan(-1);
    expect(carouselIndex).toBeGreaterThan(staticCardIndex);
  });
});

describe("initProjectsCarousel", () => {
  beforeEach(() => {
    setProjectsHtml();
    destroyProjectsCarousel();
  });

  it("initializes carousel view by default for multiple projects", () => {
    renderProjects([projectFixture(1), projectFixture(2)], {}, {});
    initProjectsCarousel(2);

    const container = document.getElementById("projectsContainer");
    expect(container.classList.contains("carousel-active")).toBe(true);
    expect(container.classList.contains("static-active")).toBe(false);
  });

  it("hides toggle and switches to static view when project count <= 1", () => {
    renderProjects([projectFixture(1)], {}, {});
    initProjectsCarousel(1);

    const container = document.getElementById("projectsContainer");
    const toggle = document.getElementById("projectsViewToggle");
    expect(container.classList.contains("static-active")).toBe(true);
    expect(container.classList.contains("carousel-active")).toBe(false);
    expect(toggle.classList.contains("hidden")).toBe(true);
  });

  it("does not initialize carousel when static view is active", () => {
    renderProjects([projectFixture(1), projectFixture(2)], {}, {});
    const container = document.getElementById("projectsContainer");
    container.classList.add("static-active");

    initProjectsCarousel(2);
    expect(container.classList.contains("static-active")).toBe(true);
    expect(container.classList.contains("carousel-active")).toBe(false);
  });
});

describe("projects view toggle", () => {
  beforeEach(() => {
    setProjectsHtml();
    destroyProjectsCarousel();
  });

  it("clicking toggle switches from carousel to static view", () => {
    renderProjects([projectFixture(1), projectFixture(2)], {}, {});
    initProjectsCarousel(2);
    initProjectsToggle();

    const toggle = document.getElementById("projectsViewToggle");
    const container = document.getElementById("projectsContainer");
    toggle.click();

    expect(container.classList.contains("static-active")).toBe(true);
    expect(container.classList.contains("carousel-active")).toBe(false);
    expect(toggle.textContent).toBe("Show Carousel");
  });

  it("clicking toggle again switches back to carousel view", () => {
    renderProjects([projectFixture(1), projectFixture(2)], {}, {});
    initProjectsCarousel(2);
    initProjectsToggle();

    const toggle = document.getElementById("projectsViewToggle");
    const container = document.getElementById("projectsContainer");
    toggle.click();
    toggle.click();

    expect(container.classList.contains("carousel-active")).toBe(true);
    expect(container.classList.contains("static-active")).toBe(false);
    expect(toggle.textContent).toBe("Show Static List");
  });
});

describe("showProjectsCarouselView / showProjectsStaticView", () => {
  beforeEach(() => {
    setProjectsHtml();
    destroyProjectsCarousel();
  });

  it("showProjectsStaticView hides carousel and destroys instance", () => {
    renderProjects([projectFixture(1), projectFixture(2)], {}, {});
    initProjectsCarousel(2);

    const container = document.getElementById("projectsContainer");
    showProjectsStaticView();

    expect(container.classList.contains("static-active")).toBe(true);
    expect(container.classList.contains("carousel-active")).toBe(false);
  });

  it("showProjectsCarouselView restores carousel view", () => {
    renderProjects([projectFixture(1), projectFixture(2)], {}, {});
    const container = document.getElementById("projectsContainer");
    container.classList.add("static-active");

    showProjectsCarouselView();

    expect(container.classList.contains("carousel-active")).toBe(true);
    expect(container.classList.contains("static-active")).toBe(false);
  });
});

describe("V55 destroy before re-render", () => {
  beforeEach(() => {
    setProjectsHtml();
    destroyProjectsCarousel();
  });

  it("destroys carousel before re-rendering and re-initializes cleanly", () => {
    // first render + init
    renderProjects([projectFixture(1), projectFixture(2)], {}, {});
    initProjectsCarousel(2);
    const container = document.getElementById("projectsContainer");
    const track = document.querySelector(".projects-carousel-track");
    expect(container.classList.contains("carousel-active")).toBe(true);
    expect(track.querySelectorAll(".projects-carousel-slide").length).toBe(2);

    // simulate refreshPortfolioProjects sequence: destroy, render, init
    destroyProjectsCarousel();
    renderProjects([projectFixture(3), projectFixture(4), projectFixture(5)], {}, {});
    expect(container.querySelectorAll(".static-project-card").length).toBe(3);
    expect(track.querySelectorAll(".projects-carousel-slide").length).toBe(3);

    initProjectsCarousel(3);
    expect(container.classList.contains("carousel-active")).toBe(true);
    expect(track.querySelectorAll(".projects-carousel-slide").length).toBe(3);
  });
});

describe("reduced motion and autoplay", () => {
  const emblaSpy = vi.fn();
  const autoplaySpy = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    vi.resetModules();
    vi.clearAllMocks();
    emblaSpy.mockClear();
    autoplaySpy.mockClear();
    vi.doMock("embla-carousel", () => ({
      default: emblaSpy,
    }));
    vi.doMock("embla-carousel-autoplay", () => ({
      default: autoplaySpy,
    }));
    setProjectsHtml();
  });

  afterEach(() => {
    vi.doUnmock("embla-carousel");
    vi.doUnmock("embla-carousel-autoplay");
  });

  it("initProjectsCarousel with reduced motion disables autoplay and sets duration 0", async () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: true }))
    );

    const { initProjectsCarousel: init } = await import("../js/carousel.js");
    renderProjects([projectFixture(1), projectFixture(2)], {}, {});
    init(2);

    expect(emblaSpy).toHaveBeenCalled();
    const [, options, plugins] = emblaSpy.mock.calls[0];
    expect(options.loop).toBe(true);
    expect(options.duration).toBe(0);
    expect(plugins).toHaveLength(0);
  });

  it("initProjectsCarousel without reduced motion enables autoplay with 4000ms delay", async () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: false }))
    );
    autoplaySpy.mockImplementation((opts) => ({ name: "autoplay", options: opts }));

    const { initProjectsCarousel: init } = await import("../js/carousel.js");
    renderProjects([projectFixture(1), projectFixture(2)], {}, {});
    init(2);

    expect(emblaSpy).toHaveBeenCalled();
    const [, options, plugins] = emblaSpy.mock.calls[0];
    expect(options.loop).toBe(true);
    expect(options.duration).toBeUndefined();
    expect(plugins).toHaveLength(1);
    expect(autoplaySpy).toHaveBeenCalledWith({ delay: 4000, stopOnInteraction: false });
  });
});
