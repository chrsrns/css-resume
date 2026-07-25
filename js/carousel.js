import EmblaCarousel from "embla-carousel";
import Autoplay from "embla-carousel-autoplay";

let projectsEmbla = null;
let autoplayPlugin = null;

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const destroyProjectsCarousel = () => {
  if (projectsEmbla) {
    projectsEmbla.destroy();
    projectsEmbla = null;
  }
  autoplayPlugin = null;
};

const getProjectCount = () => {
  const container = document.getElementById("projectsContainer");
  return container ? container.querySelectorAll(".static-project-card").length : 0;
};

const setCarouselNavVisible = (visible) => {
  const prevBtn = document.getElementById("projectsCarouselPrev");
  const nextBtn = document.getElementById("projectsCarouselNext");
  if (prevBtn) prevBtn.classList.toggle("hidden", !visible);
  if (nextBtn) nextBtn.classList.toggle("hidden", !visible);
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
    setCarouselNavVisible(false);
    destroyProjectsCarousel();
    return;
  }

  toggle?.classList.remove("hidden");

  // V61: static view selected -> destroy carousel and hide markup
  if (container.classList.contains("static-active")) {
    setCarouselNavVisible(false);
    destroyProjectsCarousel();
    return;
  }

  const viewport = carousel.querySelector(".projects-carousel-viewport");
  const prevBtn = document.getElementById("projectsCarouselPrev");
  const nextBtn = document.getElementById("projectsCarouselNext");
  if (!viewport) return;

  const reduced = prefersReducedMotion();
  // V50: reduced motion disables autoplay
  const autoplayOptions = { delay: 4000, stopOnInteraction: false };
  autoplayPlugin = reduced ? null : Autoplay(autoplayOptions);
  const plugins = reduced ? [] : [autoplayPlugin];
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
  setCarouselNavVisible(true);

  // V89, V90, V91: pause/reset autoplay on carousel hover
  if (autoplayPlugin && carousel) {
    carousel.addEventListener('mouseenter', () => {
      autoplayPlugin.stop();
    });
    carousel.addEventListener('mouseleave', () => {
      autoplayPlugin.play();
    });
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
  setCarouselNavVisible(false);
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
