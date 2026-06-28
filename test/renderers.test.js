import { beforeEach, describe, expect, it } from "vitest";
import { renderProfile, renderProjects } from "../js/renderers.js";

const setProfileHtml = () => {
  document.body.innerHTML = `
    <div id="profilePlaceholderOverlay" class="overlay-placeholder opacity-100"></div>
    <h1 id="profileName"></h1>
    <img id="profileImage" />
    <span id="profileLocationPart1"></span>
    <span id="profileLocationPart2"></span>
    <a id="profileEmailLink"><span id="profileEmailText1"></span><span id="profileEmailText2"></span></a>
    <a id="profileGithubLink"><span id="profileGithubText"></span></a>
    <span id="profileMobile"></span>
  `;
};

const setProjectsHtml = () => {
  document.body.innerHTML = `<div id="projectsContainer"></div>`;
};

describe("renderProfile", () => {
  beforeEach(() => {
    document.title = "Online Resume";
    setProfileHtml();
  });

  it("sets name and document title", () => {
    renderProfile({ name: "Ada Lovelace" });
    expect(document.getElementById("profileName").textContent).toBe("Ada Lovelace");
    expect(document.title).toBe("Online Resume - Ada Lovelace");
  });

  it("splits location into two parts", () => {
    renderProfile({ location: "London, England, UK" });
    expect(document.getElementById("profileLocationPart1").textContent).toBe("London, ");
    expect(document.getElementById("profileLocationPart2").textContent).toBe("England, UK");
  });

  it("splits email into user and domain parts", () => {
    renderProfile({ email: "ada@example.com" });
    expect(document.getElementById("profileEmailText1").textContent).toBe("ada");
    expect(document.getElementById("profileEmailText2").textContent).toBe("@example.com ");
    expect(document.getElementById("profileEmailLink").getAttribute("href")).toBe("mailto:ada@example.com");
  });

  it("sets github link and text", () => {
    renderProfile({ github_url: "https://github.com/ada" });
    expect(document.getElementById("profileGithubLink").getAttribute("href")).toBe("https://github.com/ada");
    expect(document.getElementById("profileGithubText").textContent).toBe("https://github.com/ada");
  });

  it("sets mobile number", () => {
    renderProfile({ mobile_number: "+1 555 0100" });
    expect(document.getElementById("profileMobile").textContent).toBe("+1 555 0100");
  });

  it("hides the profile placeholder overlay", () => {
    const placeholder = document.getElementById("profilePlaceholderOverlay");
    renderProfile({ name: "Ada Lovelace" });
    expect(placeholder.classList.contains("opacity-100")).toBe(false);
    expect(placeholder.classList.contains("opacity-0")).toBe(true);
  });
});

describe("renderProjects", () => {
  beforeEach(() => {
    setProjectsHtml();
  });

  it("uses project_link as the primary href", () => {
    renderProjects([{ id: 1, project_name: "App", project_link: "https://app.example.com", source_code_link: "https://github.com/app" }], {}, {});
    const link = document.querySelector("#projectsContainer a");
    expect(link.getAttribute("href")).toBe("https://app.example.com");
  });

  it("falls back to source_code_link when project_link is missing", () => {
    renderProjects([{ id: 1, project_name: "Lib", source_code_link: "https://github.com/lib" }], {}, {});
    const link = document.querySelector("#projectsContainer a");
    expect(link.getAttribute("href")).toBe("https://github.com/lib");
  });

  it("falls back to '#' when no link is provided", () => {
    renderProjects([{ id: 1, project_name: "Draft" }], {}, {});
    const link = document.querySelector("#projectsContainer a");
    expect(link.getAttribute("href")).toBe("#");
  });

  it("shows the 'No Preview' badge when project_link is missing or empty", () => {
    renderProjects([{ id: 1, project_name: "Draft", project_link: "" }], {}, {});
    const badge = document.querySelector("#projectsContainer span.text-yellow-700");
    expect(badge).not.toBeNull();
    expect(badge.textContent).toBe("No Preview");
  });

  it("does not show the 'No Preview' badge when project_link is present", () => {
    renderProjects([{ id: 1, project_name: "App", project_link: "https://app.example.com" }], {}, {});
    const badge = document.querySelector("#projectsContainer span.text-yellow-700");
    expect(badge).toBeNull();
  });
});
