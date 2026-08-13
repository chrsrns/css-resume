import { beforeEach, describe, expect, it } from "vitest";
import { buildProjectCard, renderEducation, renderExperience, renderProfile, renderProjects, renderSummary } from "../js/renderers.js";

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

const setExperienceHtml = () => {
  document.body.innerHTML = `<div id="experienceContainer"></div>`;
};

const setEducationHtml = () => {
  document.body.innerHTML = `<div id="educationContainer"></div>`;
};

const setSummaryHtml = () => {
  document.body.innerHTML = `
    <div id="professionalSummarySection">
      <div id="professionalSummaryContainer" class="relative min-h-24">
        <div id="professionalSummaryPlaceholderOverlay" class="overlay-placeholder absolute w-full h-full bg-white opacity-100"></div>
      </div>
    </div>
    <h1 id="educationHeading" class="text-2xl">Education</h1>
  `;
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

describe("project image rendering", () => {
  it("project image rendered when image_url present and non-empty in carousel cards (V81)", () => {
    const project = { id: 1, project_name: "Test Project", image_url: "https://example.com/image.jpg" };
    const card = buildProjectCard(project, {}, {}, true);
    const img = card.querySelector("img.project-card-image");
    expect(img).not.toBeNull();
    expect(img.getAttribute("src")).toBe("https://example.com/image.jpg");
    expect(img.getAttribute("alt")).toBe("Test Project");
  });

  it("project image not rendered in static cards (V81)", () => {
    const project = { id: 1, project_name: "Test Project", image_url: "https://example.com/image.jpg" };
    const card = buildProjectCard(project, {}, {}, false);
    const img = card.querySelector("img.project-card-image");
    expect(img).toBeNull();
  });

  it("missing image_url renders no image element (V83)", () => {
    const project = { id: 1, project_name: "Test Project" };
    const card = buildProjectCard(project, {}, {}, true);
    const img = card.querySelector("img.project-card-image");
    expect(img).toBeNull();
  });

  it("empty image_url renders no image element (V83)", () => {
    const project = { id: 1, project_name: "Test Project", image_url: "" };
    const card = buildProjectCard(project, {}, {}, true);
    const img = card.querySelector("img.project-card-image");
    expect(img).toBeNull();
  });

  it("whitespace-only image_url renders no image element (V83)", () => {
    const project = { id: 1, project_name: "Test Project", image_url: "   " };
    const card = buildProjectCard(project, {}, {}, true);
    const img = card.querySelector("img.project-card-image");
    expect(img).toBeNull();
  });

  it("project images have print:hidden class (V84)", () => {
    const project = { id: 1, project_name: "Test Project", image_url: "https://example.com/image.jpg" };
    const card = buildProjectCard(project, {}, {}, true);
    const img = card.querySelector("img.project-card-image");
    expect(img).not.toBeNull();
    expect(img.classList.contains("print:hidden")).toBe(true);
  });

  it("project images have object-fit cover and aspect ratio styling (V82)", () => {
    const project = { id: 1, project_name: "Test Project", image_url: "https://example.com/image.jpg" };
    const card = buildProjectCard(project, {}, {}, true);
    const img = card.querySelector("img.project-card-image");
    expect(img).not.toBeNull();
    expect(img.classList.contains("object-cover")).toBe(true);
  });
});

describe("clickable carousel cards", () => {
  it("carousel card has single anchor wrapper with no nested anchors (V85)", () => {
    const project = { id: 1, project_name: "Test Project", project_link: "https://example.com" };
    const card = buildProjectCard(project, {}, {}, true);
    const anchors = card.querySelectorAll("a");
    expect(anchors.length).toBe(1);
    expect(anchors[0].getAttribute("href")).toBe("https://example.com");
  });

  it("carousel card anchor href uses correct priority: project_link (V86)", () => {
    const project = { id: 1, project_name: "Test Project", project_link: "https://example.com", source_code_link: "https://github.com/test" };
    const card = buildProjectCard(project, {}, {}, true);
    const anchor = card.querySelector("a");
    expect(anchor.getAttribute("href")).toBe("https://example.com");
  });

  it("carousel card anchor href uses correct priority: source_code_link fallback (V86)", () => {
    const project = { id: 1, project_name: "Test Project", source_code_link: "https://github.com/test" };
    const card = buildProjectCard(project, {}, {}, true);
    const anchor = card.querySelector("a");
    expect(anchor.getAttribute("href")).toBe("https://github.com/test");
  });

  it("carousel card anchor href uses correct priority: # fallback (V86)", () => {
    const project = { id: 1, project_name: "Test Project" };
    const card = buildProjectCard(project, {}, {}, true);
    const anchor = card.querySelector("a");
    expect(anchor.getAttribute("href")).toBe("#");
  });

  it("static list cards retain title link structure (V88)", () => {
    const project = { id: 1, project_name: "Test Project", project_link: "https://example.com" };
    const card = buildProjectCard(project, {}, {}, false);
    const anchors = card.querySelectorAll("a");
    expect(anchors.length).toBe(1);
    // In static cards, the link wraps the title (h3)
    const titleLink = card.querySelector("h3");
    expect(titleLink.parentElement.tagName).toBe("A");
  });

  it("carousel card anchor has print:hidden class (V87)", () => {
    const project = { id: 1, project_name: "Test Project", project_link: "https://example.com" };
    const card = buildProjectCard(project, {}, {}, true);
    const anchor = card.querySelector("a");
    expect(anchor).not.toBeNull();
    expect(anchor.classList.contains("print:hidden")).toBe(true);
  });
});

describe("renderExperience", () => {
  beforeEach(() => {
    setExperienceHtml();
  });

  it("renders key points as bullets", () => {
    renderExperience(
      [{ id: 1, job_title: "Engineer", company_name: "Acme", start_date: "2023-01-01", end_date: "2023-12-31" }],
      { 1: [{ key_point: "Shipped X", display_order: 0 }, { key_point: "Built Y", display_order: 1 }] }
    );
    const lis = document.querySelectorAll("#experienceContainer ul li");
    expect(lis.length).toBe(2);
    expect(lis[0].textContent).toBe("Shipped X");
    expect(lis[1].textContent).toBe("Built Y");
  });

  it("renders description as separate paragraph, not a bullet", () => {
    renderExperience(
      [{ id: 1, job_title: "Engineer", company_name: "Acme", start_date: "2023-01-01", end_date: "2023-12-31", description: "Did backend work." }],
      { 1: [{ key_point: "Shipped X", display_order: 0 }] }
    );
    const lis = document.querySelectorAll("#experienceContainer ul li");
    const ps = document.querySelectorAll("#experienceContainer p");
    expect(lis.length).toBe(1);
    expect(lis[0].textContent).toBe("Shipped X");
    expect([...ps].some((p) => p.textContent === "Did backend work.")).toBe(true);
    expect([...lis].some((li) => li.textContent === "Did backend work.")).toBe(false);
  });

  it("renders description before key points", () => {
    renderExperience(
      [{ id: 1, job_title: "Engineer", company_name: "Acme", start_date: "2023-01-01", end_date: "2023-12-31", description: "Did backend work." }],
      { 1: [{ key_point: "Shipped X", display_order: 0 }] }
    );
    const container = document.getElementById("experienceContainer");
    const children = [...container.children];
    const pIdx = children.findIndex((c) => c.tagName === "P" && c.textContent === "Did backend work.");
    const ulIdx = children.findIndex((c) => c.tagName === "UL");
    expect(pIdx).toBeGreaterThan(-1);
    expect(ulIdx).toBeGreaterThan(-1);
    expect(pIdx).toBeLessThan(ulIdx);
  });

  it("stacks Current badge above title on small screens", () => {
    renderExperience(
      [{ id: 1, job_title: "Engineer", company_name: "Acme", start_date: "2023-01-01", description: "Did backend work." }],
      { 1: [{ key_point: "Shipped X", display_order: 0 }] }
    );
    const h2 = document.querySelector("#experienceContainer h2");
    expect(h2).not.toBeNull();
    expect(h2.classList.contains("flex-col-reverse")).toBe(true);
    expect(h2.classList.contains("gap-1")).toBe(true);
    expect(h2.classList.contains("sm:flex-row")).toBe(true);
    expect(h2.classList.contains("sm:gap-2")).toBe(true);
  });

  it("keeps Current badge source order after title for sm row layout", () => {
    renderExperience(
      [{ id: 1, job_title: "Engineer", company_name: "Acme", start_date: "2023-01-01", description: "Did backend work." }],
      { 1: [{ key_point: "Shipped X", display_order: 0 }] }
    );
    const h2 = document.querySelector("#experienceContainer h2");
    const children = [...h2.childNodes];
    const textIdx = children.findIndex((c) => c.nodeType === Node.TEXT_NODE && c.textContent.includes("Engineer @ Acme"));
    const badgeIdx = children.findIndex((c) => c.tagName === "SPAN" && c.textContent.includes("Current"));
    expect(textIdx).toBeGreaterThan(-1);
    expect(badgeIdx).toBeGreaterThan(-1);
    expect(textIdx).toBeLessThan(badgeIdx);
  });
});

describe("renderEducation", () => {
  beforeEach(() => {
    setEducationHtml();
  });

  it("stacks education stage and institution vertically on small screens with tight spacing", () => {
    renderEducation(
      [{ id: 1, education_stage: "College", institution_name: "XYZ University", start_date: "2020", end_date: "2024" }],
      {}
    );
    const header = document.querySelector("#educationContainer .my-4");
    expect(header).not.toBeNull();
    expect(header.classList.contains("flex-col")).toBe(true);
    expect(header.classList.contains("gap-1")).toBe(true);
    expect(header.classList.contains("sm:flex-row")).toBe(true);
  });

  it("keeps education stage and institution on the same row at sm breakpoint and up", () => {
    renderEducation(
      [{ id: 1, education_stage: "College", institution_name: "XYZ University", start_date: "2020", end_date: "2024" }],
      {}
    );
    const header = document.querySelector("#educationContainer .my-4");
    expect(header.classList.contains("sm:flex-row")).toBe(true);
    expect(header.classList.contains("sm:gap-2")).toBe(true);
  });
});

describe("renderSummary", () => {
  beforeEach(() => {
    setSummaryHtml();
  });

  it("renders summary text into container", () => {
    renderSummary("Experienced developer with a focus on web technologies.");
    const container = document.getElementById("professionalSummaryContainer");
    expect(container.textContent.trim()).toBe("Experienced developer with a focus on web technologies.");
  });

  it("hides the placeholder overlay", () => {
    const placeholder = document.getElementById("professionalSummaryPlaceholderOverlay");
    renderSummary("Experienced developer.");
    expect(placeholder.classList.contains("opacity-100")).toBe(false);
    expect(placeholder.classList.contains("opacity-0")).toBe(true);
  });

  it("switches the container from min-h-24 to min-h-fit when a summary is rendered", () => {
    const container = document.getElementById("professionalSummaryContainer");
    renderSummary("Experienced developer.");
    expect(container.classList.contains("min-h-24")).toBe(false);
    expect(container.classList.contains("min-h-fit")).toBe(true);
  });

  it("does not switch to min-h-fit when summary is empty", () => {
    const container = document.getElementById("professionalSummaryContainer");
    renderSummary("");
    expect(container.classList.contains("min-h-24")).toBe(true);
    expect(container.classList.contains("min-h-fit")).toBe(false);
  });

  it("does not render when summary is empty", () => {
    renderSummary("");
    const container = document.getElementById("professionalSummaryContainer");
    expect(container.querySelector("p")).toBeNull();
  });

  it("does not render when summary is whitespace only", () => {
    renderSummary("   \n  ");
    const container = document.getElementById("professionalSummaryContainer");
    expect(container.querySelector("p")).toBeNull();
  });

  it("does not render when summary is null", () => {
    renderSummary(null);
    const container = document.getElementById("professionalSummaryContainer");
    expect(container.querySelector("p")).toBeNull();
  });

  it("renders newlines as br elements", () => {
    renderSummary("Line 1\n\nLine 2");
    const p = document.querySelector("#professionalSummaryContainer p");
    expect(p).not.toBeNull();
    expect(p.querySelectorAll("br").length).toBe(2);
  });

  it("shows the section when summary is present", () => {
    const section = document.getElementById("professionalSummarySection");
    section.classList.add("hidden");
    renderSummary("Experienced developer.");
    expect(section.classList.contains("hidden")).toBe(false);
  });

  it("hides the section when summary is empty", () => {
    renderSummary("");
    const section = document.getElementById("professionalSummarySection");
    expect(section.classList.contains("hidden")).toBe(true);
  });

  it("hides the section when summary is null or not a string", () => {
    renderSummary(null);
    const section = document.getElementById("professionalSummarySection");
    expect(section.classList.contains("hidden")).toBe(true);

    section.classList.remove("hidden");
    renderSummary({});
    expect(section.classList.contains("hidden")).toBe(true);
  });

  it("handles CRLF newlines", () => {
    renderSummary("Line 1\r\nLine 2");
    const p = document.querySelector("#professionalSummaryContainer p");
    expect(p).not.toBeNull();
    expect(p.textContent).toBe("Line 1Line 2");
    expect(p.querySelectorAll("br").length).toBe(1);
  });

  it("renders summary in italic", () => {
    renderSummary("Experienced developer.");
    const p = document.querySelector("#professionalSummaryContainer p");
    expect(p.classList.contains("italic")).toBe(true);
  });

  it("adds top padding to education heading when summary is present", () => {
    renderSummary("Experienced developer.");
    const heading = document.getElementById("educationHeading");
    expect(heading.classList.contains("pt-4")).toBe(true);
  });

  it("removes top padding from education heading when summary is empty", () => {
    const heading = document.getElementById("educationHeading");
    heading.classList.add("pt-4");
    renderSummary("");
    expect(heading.classList.contains("pt-4")).toBe(false);
  });
});
