import EmblaCarousel from "embla-carousel";
import Autoplay from "embla-carousel-autoplay";

let projectsEmbla = null;

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const destroyProjectsCarousel = () => {
  if (projectsEmbla) {
    projectsEmbla.destroy();
    projectsEmbla = null;
  }
};

const getProjectCount = () => {
  const container = document.getElementById("projectsContainer");
  return container ? container.querySelectorAll(".static-project-card").length : 0;
};

const initProjectsCarousel = (projectCount) => {
  const carousel = document.getElementById("projectsCarousel");
  const container = document.getElementById("projectsContainer");
  const toggle = document.getElementById("projectsViewToggle");
  if (!carousel || !container) return;

  // V58: <=1 project -> static list even when carousel enabled
  if (projectCount <= 1) {
    container.classList.add("static-active");
    container.classList.remove("carousel-active");
    toggle?.classList.add("hidden");
    destroyProjectsCarousel();
    return;
  }

  toggle?.classList.remove("hidden");

  // V61: static view selected -> destroy carousel and hide markup
  if (container.classList.contains("static-active")) {
    destroyProjectsCarousel();
    return;
  }

  const viewport = carousel.querySelector(".projects-carousel-viewport");
  const prevBtn = carousel.querySelector(".projects-carousel-prev");
  const nextBtn = carousel.querySelector(".projects-carousel-next");
  if (!viewport) return;

  const reduced = prefersReducedMotion();
  // V50: reduced motion disables autoplay
  const plugins = reduced ? [] : [Autoplay({ delay: 4000, stopOnInteraction: false })];
  // V51: loop true; V56: reduced motion instant transitions
  const options = {
    loop: true,
    duration: reduced ? 0 : 25,
  };

  destroyProjectsCarousel();
  projectsEmbla = EmblaCarousel(viewport, options, plugins);

  // V54: prev/next buttons call scrollPrev/scrollNext
  if (prevBtn) {
    prevBtn.onclick = () => projectsEmbla?.scrollPrev();
  }
  if (nextBtn) {
    nextBtn.onclick = () => projectsEmbla?.scrollNext();
  }

  container.classList.add("carousel-active");
  container.classList.remove("static-active");
};

const showProjectsCarouselView = () => {
  const container = document.getElementById("projectsContainer");
  const toggle = document.getElementById("projectsViewToggle");
  container?.classList.remove("static-active");
  initProjectsCarousel(getProjectCount());
  if (toggle) toggle.textContent = "Show Static List";
};

const showProjectsStaticView = () => {
  const container = document.getElementById("projectsContainer");
  const toggle = document.getElementById("projectsViewToggle");
  container?.classList.add("static-active");
  container?.classList.remove("carousel-active");
  destroyProjectsCarousel();
  if (toggle) toggle.textContent = "Show Carousel";
};

const initProjectsToggle = () => {
  const toggle = document.getElementById("projectsViewToggle");
  const container = document.getElementById("projectsContainer");
  if (!toggle || !container) return;

  toggle.addEventListener("click", () => {
    if (container.classList.contains("static-active")) {
      showProjectsCarouselView();
    } else {
      showProjectsStaticView();
    }
  });
};

export {
  destroyProjectsCarousel,
  getProjectCount,
  initProjectsCarousel,
  initProjectsToggle,
  prefersReducedMotion,
  showProjectsCarouselView,
  showProjectsStaticView,
};
