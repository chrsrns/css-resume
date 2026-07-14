import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("V78: Carousel containers have overflow-visible for hover effects", () => {
  it("should have overflow-visible on projectsCarousel container", () => {
    const htmlPath = resolve(process.cwd(), "index.html");
    const htmlContent = readFileSync(htmlPath, "utf-8");

    // Check that projectsCarousel has overflow-visible class
    expect(htmlContent).toMatch(/id="projectsCarousel"[^>]*overflow-visible/);
  });

  it("should have overflow-visible on projects-carousel-viewport", () => {
    const htmlPath = resolve(process.cwd(), "index.html");
    const htmlContent = readFileSync(htmlPath, "utf-8");

    // Check that projects-carousel-viewport has overflow-visible class
    expect(htmlContent).toMatch(/class="projects-carousel-viewport[^"]*overflow-visible/);
  });

  it("should not have overflow-hidden on projectsCarousel container", () => {
    const htmlPath = resolve(process.cwd(), "index.html");
    const htmlContent = readFileSync(htmlPath, "utf-8");

    // Extract the projectsCarousel div
    const carouselMatch = htmlContent.match(/id="projectsCarousel"[^>]*>/);
    expect(carouselMatch).toBeTruthy();

    if (carouselMatch) {
      const carouselDiv = carouselMatch[0];
      expect(carouselDiv).not.toContain("overflow-hidden");
    }
  });

  it("should not have overflow-hidden on projects-carousel-viewport", () => {
    const htmlPath = resolve(process.cwd(), "index.html");
    const htmlContent = readFileSync(htmlPath, "utf-8");

    // Extract the projects-carousel-viewport div
    const viewportMatch = htmlContent.match(/class="projects-carousel-viewport[^"]*"/);
    expect(viewportMatch).toBeTruthy();

    if (viewportMatch) {
      const viewportDiv = viewportMatch[0];
      expect(viewportDiv).not.toContain("overflow-hidden");
    }
  });
});