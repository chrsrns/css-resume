import { dateFormat } from "./date.format.js";
import { clamp, formatDateRange, formatYear, sortByDisplayOrder } from "./helpers.js";

// DOM Manipulation Helpers

const clearEl = (el, preserveIds = []) => {
  const preserveSet = new Set(preserveIds);
  for (const child of Array.from(el.children)) {
    if (child.id && preserveSet.has(child.id)) {
      continue;
    }
    if (!child.id || !child.classList.contains("overlay-placeholder")) {
      el.removeChild(child);
    } else if (child.classList.contains("overlay-placeholder")) {
      child.classList.remove('opacity-100');
      child.classList.add('opacity-0');

      child.addEventListener('transitionend', () => {
        child.classList.add('hidden');
      }, { once: true });
    }
  }
};

const reAddSectionPlaceholder = (sectionEl) => {
  if (sectionEl && sectionEl.classList.contains("overlay-placeholder")) {
    sectionEl.classList.add('opacity-100');
    sectionEl.classList.remove('opacity-0');
    sectionEl.classList.remove('hidden');
  }
  for (const child of Array.from(sectionEl.children)) {
    if (child.classList.contains("overlay-placeholder")) {
      child.classList.add('opacity-100');
      child.classList.remove('opacity-0');
      child.classList.remove('hidden');
    }
  }
}

const el = (tag, attrs = {}, children = []) => {
  const svgTags = new Set([
    "svg",
    "path",
    "g",
    "circle",
    "rect",
    "line",
    "polyline",
    "polygon",
    "ellipse",
    "defs",
    "linearGradient",
    "stop",
  ]);

  const node = svgTags.has(tag)
    ? document.createElementNS("http://www.w3.org/2000/svg", tag)
    : document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null) continue;
    if (k === "class") {
      if (node instanceof SVGElement) node.setAttribute("class", v);
      else node.className = v;
    }
    else if (k === "text") node.textContent = v;
    else if (k === "html") node.innerHTML = v;
    else node.setAttribute(k, String(v));
  }
  for (const child of children) {
    if (child == null) continue;
    node.appendChild(child);
  }
  return node;
};

// Section Rendering

const renderProfile = (resume) => {
  if (!resume) return;

  // Hide the profile placeholder overlay
  const profilePlaceholder = document.getElementById("profilePlaceholderOverlay");
  if (profilePlaceholder) {
    profilePlaceholder.classList.remove('opacity-100');
    profilePlaceholder.classList.add('opacity-0');

    profilePlaceholder.addEventListener('transitionend', () => {
      profilePlaceholder.classList.add('hidden');
    }, { once: true });
  }

  const nameEl = document.getElementById("profileName");
  if (nameEl && resume.name) nameEl.textContent = resume.name;

  if (resume.name) document.title = `Online Resume - ${resume.name}`;

  const imgEl = document.getElementById("profileImage");
  if (imgEl && resume.profile_image_url) imgEl.setAttribute("src", resume.profile_image_url);

  const location = resume.location || "";
  if (location) {
    const [p1, ...rest] = location.split(",");
    const part1 = (p1 || "").trim();
    const part2 = rest.join(",").trim();
    const loc1 = document.getElementById("profileLocationPart1");
    const loc2 = document.getElementById("profileLocationPart2");
    if (loc1) loc1.textContent = part1 ? `${part1}${part2 ? ", " : ""}` : "";
    if (loc2) loc2.textContent = part2;
  }

  if (resume.email) {
    const [u, d] = String(resume.email).split("@");
    const e1 = document.getElementById("profileEmailText1");
    const e2 = document.getElementById("profileEmailText2");
    const link = document.getElementById("profileEmailLink");
    if (e1) e1.textContent = u || resume.email;
    if (e2) e2.textContent = d ? `@${d} ` : "";
    if (link) link.setAttribute("href", `mailto:${resume.email}`);
  }

  if (resume.github_url) {
    const link = document.getElementById("profileGithubLink");
    const text = document.getElementById("profileGithubText");
    if (link) link.setAttribute("href", resume.github_url);
    if (text) text.textContent = resume.github_url;
  }

  if (resume.mobile_number) {
    const mobile = document.getElementById("profileMobile");
    if (mobile) mobile.textContent = resume.mobile_number;
  }
};

const renderSummary = (summary) => {
  const container = document.getElementById("professionalSummaryContainer");
  if (!container) return;

  clearEl(container);

  const section = document.getElementById("professionalSummarySection");
  const educationHeading = document.getElementById("educationHeading");

  if (typeof summary !== "string" || !summary.trim()) {
    if (section) section.classList.add("hidden");
    if (educationHeading) educationHeading.classList.remove("pt-4");
    return;
  }

  if (section) section.classList.remove("hidden");
  if (educationHeading) educationHeading.classList.add("pt-4");

  const p = el("p", { class: "mt-2 italic" });
  const parts = summary.trim().split(/\r?\n/);
  for (let i = 0; i < parts.length; i++) {
    p.appendChild(document.createTextNode(parts[i]));
    if (i < parts.length - 1) {
      p.appendChild(el("br"));
    }
  }
  container.appendChild(p);

  container.classList.remove("min-h-24");
  container.classList.add("min-h-fit");
};

const renderSkills = (skills) => {
  const list = document.getElementById("skillsList");
  if (!list) return;

  clearEl(list);

  for (const s of (skills || []).slice().sort(sortByDisplayOrder)) {
    const pct = clamp(Number(s.confidence_percentage || 0), 0, 100);
    const inner = el(
      "div",
      {
        class: "bg-blue-600 text-center text-xs text-white",
        style: `width: ${pct}%`,
      },
      [document.createTextNode(`${pct}%`)]
    );

    const li = el("li", { class: "py-2" }, [
      document.createTextNode(s.skill_name || ""),
      el("div", { class: "overflow-clip rounded-full bg-neutral-200" }, [inner]),
    ]);

    list.appendChild(li);
  }
};

const renderLanguages = (languages, frameworksByLanguageId) => {
  const container = document.getElementById("languagesContainer");
  if (!container) return;

  clearEl(container);

  for (const lang of (languages || []).slice().sort(sortByDisplayOrder)) {
    container.appendChild(el("h3", { class: "py-2", text: lang.language_name || "" }));

    const wrap = el("div", { class: "flex flex-wrap gap-2" });
    const fws = (frameworksByLanguageId && frameworksByLanguageId[lang.id]) || [];
    for (const fw of fws.slice().sort(sortByDisplayOrder)) {
      wrap.appendChild(
        el(
          "span",
          {
            class:
              "inline-flex items-center justify-center rounded-full bg-blue-100 px-2.5 py-0.5 text-blue-700",
          },
          [el("p", { class: "whitespace-nowrap text-sm", text: fw.framework_name || "" })]
        )
      );
    }

    container.appendChild(wrap);
  }
};

const renderEducation = (educations, keyPointsByEducationId) => {
  const container = document.getElementById("educationContainer");
  if (!container) return;

  clearEl(container);

  for (const ed of (educations || []).slice().sort(sortByDisplayOrder)) {
    const header = el("div", { class: "text-lg my-4 flex flex-col gap-1 sm:flex-row sm:gap-2 print:my-3" }, [
      el(
        "span",
        {
          class:
            "w-fit h-[1lh] -ms-1 inline-flex items-center justify-center rounded bg-yellow-100 px-2.5 py-0.5 text-yellow-700",
        },
        [el("p", { class: "whitespace-nowrap text-sm", text: ed.education_stage || "" })]
      ),
      el("h2", { class: "inline-flex font-bold", text: ed.institution_name || "" }),
    ]);

    const degree = ed.degree ? el("p", { class: "mt-2 font-semibold", text: ed.degree }) : null;
    const rangeText = formatDateRange(formatYear(ed.start_date), formatYear(ed.end_date));

    const range = rangeText
      ? el("div", { class: "mt-1" }, [
        el("span", { class: "inline-block" }, [
          el(
            "svg",
            {
              fill: "currentColor",
              "stroke-width": "0",
              xmlns: "http://www.w3.org/2000/svg",
              viewBox: "0 0 448 512",
              style: "overflow: visible; color: currentcolor",
              height: "1em",
              width: "1em",
            },
            [
              el("path", {
                d: "M152 24c0-13.3-10.7-24-24-24s-24 10.7-24 24v40H64C28.7 64 0 92.7 0 128v320c0 35.3 28.7 64 64 64h320c35.3 0 64-28.7 64-64V128c0-35.3-28.7-64-64-64h-40V24c0-13.3-10.7-24-24-24s-24 10.7-24 24v40H152V24zM48 192h80v56H48v-56zm0 104h80v64H48v-64zm128 0h96v64h-96v-64zm144 0h80v64h-80v-64zm80-48h-80v-56h80v56zm0 160v40c0 8.8-7.2 16-16 16h-64v-56h80zm-128 0v56h-96v-56h96zm-144 0v56H64c-8.8 0-16-7.2-16-16v-40h80zm144-160h-96v-56h96v56z",
              }),
            ]
          ),
        ]),
        document.createTextNode(" "),
        el("span", { text: rangeText }),
      ])
      : null;

    const points = (keyPointsByEducationId && keyPointsByEducationId[ed.id]) || [];
    const pointsList = points.length
      ? el(
        "ul",
        { class: "ms-4 list-disc" },
        points.slice().sort(sortByDisplayOrder).map((kp) => el("li", { text: kp.key_point || "" }))
      )
      : null;

    const desc = ed.description ? el("p", { class: "mt-2", text: ed.description }) : null;

    const block = el("div", {}, [
      header,
      degree,
      range,
      el("div", { class: "mt-4 print:mt-2" }, [pointsList, desc].filter(Boolean)),
    ]);

    container.appendChild(block);
  }
};

const renderExperience = (items, keyPointsByWorkId) => {
  const container = document.getElementById("experienceContainer");
  if (!container) return;

  clearEl(container);

  for (const [idx, w] of (items || []).slice().sort(sortByDisplayOrder).entries()) {
    const title = w.company_name ? `${w.job_title} @ ${w.company_name}` : w.job_title;
    const isCurrent = w && (w.end_date == null || String(w.end_date).trim() === "");
    const h2Children = [document.createTextNode(title || "")];
    if (isCurrent) {
      h2Children.push(
        el(
          "span",
          {
            class:
              "w-fit h-[1lh] -ms-1 sm:-ms-0 inline-flex items-center justify-center rounded bg-yellow-100 px-2.5 py-0.5 text-yellow-700",
          },
          [el("p", { class: "whitespace-nowrap text-sm", text: "Current" })]
        )
      );
    }
    container.appendChild(
      el(
        "h2",
        {
          class: `mt-4 ${isCurrent ? "flex flex-col-reverse gap-1 sm:flex-row sm:gap-2" : "inline-flex"} text-lg font-bold print:mt-2 ${idx >= 2 ? "print:hidden" : ""}`,
        },
        h2Children
      )
    );

    const startDateStr = dateFormat(new Date(w.start_date), "mmm d, yyyy");
    const endDateStr = w.end_date
      ? dateFormat(new Date(w.end_date), "mmm d, yyyy")
      : "now";

    const rangeText = `${startDateStr} - ${endDateStr}`;

    const range = rangeText
      ? el("div", { class: `mt-1 ${idx >= 2 ? "print:hidden" : ""}` }, [
        el("span", { class: "inline-block" }, [
          el(
            "svg",
            {
              fill: "currentColor",
              "stroke-width": "0",
              xmlns: "http://www.w3.org/2000/svg",
              viewBox: "0 0 448 512",
              style: "overflow: visible; color: currentcolor",
              height: "1em",
              width: "1em",
            },
            [
              el("path", {
                d: "M152 24c0-13.3-10.7-24-24-24s-24 10.7-24 24v40H64C28.7 64 0 92.7 0 128v320c0 35.3 28.7 64 64 64h320c35.3 0 64-28.7 64-64V128c0-35.3-28.7-64-64-64h-40V24c0-13.3-10.7-24-24-24s-24 10.7-24 24v40H152V24zM48 192h80v56H48v-56zm0 104h80v64H48v-64zm128 0h96v64h-96v-64zm144 0h80v64h-80v-64zm80-48h-80v-56h80v56zm0 160v40c0 8.8-7.2 16-16 16h-64v-56h80zm-128 0v56h-96v-56h96zm-144 0v56H64c-8.8 0-16-7.2-16-16v-40h80zm144-160h-96v-56h96v56z",
              }),
            ],
          ),
        ]),
        document.createTextNode(" "),
        el("span", { text: rangeText }),
      ])
      : null;
    container.appendChild(range);

    if (w.description) {
      container.appendChild(
        el("p", { class: `mt-2 ${idx >= 2 ? "print:hidden" : ""}`, text: w.description })
      );
    }

    const points = (keyPointsByWorkId && keyPointsByWorkId[w.id]) || [];
    const ul = el(
      "ul",
      { class: `ms-4 mt-2 list-disc ${idx >= 2 ? "print:hidden" : ""}` },
      points.slice().sort(sortByDisplayOrder).map((kp) => el("li", { text: kp.key_point || "" }))
    );
    container.appendChild(ul);
  }
};

const buildProjectCard = (p, keyPointsByProjectId, techByProjectId, isCarousel = false) => {
  const linkIconSvg = () =>
    el(
      "svg",
      {
        class: "inline-block print:hidden",
        fill: "currentColor",
        "stroke-width": "0",
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 640 512",
        style: "overflow: visible; color: currentcolor",
        height: "1em",
        width: "1em",
      },
      [
        el("path", {
          d: "M579.8 267.7c56.5-56.5 56.5-148 0-204.5-50-50-128.8-56.5-186.3-15.4l-1.6 1.1c-14.4 10.3-17.7 30.3-7.4 44.6s30.3 17.7 44.6 7.4l1.6-1.1c32.1-22.9 76-19.3 103.8 8.6 31.5 31.5 31.5 82.5 0 114L422.3 334.8c-31.5 31.5-82.5 31.5-114 0-27.9-27.9-31.5-71.8-8.6-103.8l1.1-1.6c10.3-14.4 6.9-34.4-7.4-44.6s-34.4-6.9-44.6 7.4l-1.1 1.6C206.5 251.2 213 330 263 380c56.5 56.5 148 56.5 204.5 0l112.3-112.3zM60.2 244.3c-56.5 56.5-56.5 148 0 204.5 50 50 128.8 56.5 186.3 15.4l1.6-1.1c14.4-10.3 17.7-30.3 7.4-44.6s-30.3-17.7-44.6-7.4l-1.6 1.1c-32.1 22.9-76 19.3-103.8-8.6C74 372 74 321 105.5 289.5l112.2-112.3c31.5-31.5 82.5-31.5 114 0 27.9 27.9 31.5 71.8 8.6 103.9l-1.1 1.6c-10.3 14.4-6.9-34.4 7.4-44.6s34.4 6.9 44.6-7.4l1.1-1.6C433.5 260.8 427 182 377 132c-56.5-56.5-148-56.5-204.5 0L60.2 244.3z",
        }),
      ]
    );

  const href = p.project_link || p.source_code_link || "#";
  const noPreview = !p.project_link || String(p.project_link).trim() === "";
  const titleChildren = [
    linkIconSvg(),
    document.createTextNode(" "),
    document.createTextNode(p.project_name || ""),
  ];

  if (noPreview) {
    titleChildren.push(
      el(
        "span",
        {
          class:
            "inline-block items-center justify-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-yellow-700 print:hidden",
        },
        [el("p", { class: "whitespace-nowrap text-sm", text: "No Preview" })]
      )
    );
  }
  const title = el(
    "h3",
    { class: `text-lg font-medium text-gray-900${noPreview ? " inline-flex items-center gap-2" : ""}` },
    titleChildren
  );

  const link = el("a", { href }, [title]);
  const printLink = el("p", { class: "hidden text-sm print:block", text: href !== "#" ? href : "" });

  // V85, V88: For carousel cards, wrap entire content in single anchor (remove title link to avoid nested anchors)
  const cardLink = isCarousel ? el("a", { href, class: "print:hidden" }, [title]) : link;

  const techWrap = el("div", { class: "mt-2 flex flex-wrap gap-2" });
  const techs = (techByProjectId && techByProjectId[p.id]) || [];
  for (const t of techs.slice().sort(sortByDisplayOrder)) {
    techWrap.appendChild(
      el(
        "span",
        {
          class:
            "inline-flex items-center justify-center rounded-full bg-blue-100 px-2.5 py-0.5 text-blue-700",
        },
        [el("p", { class: "whitespace-nowrap text-sm", text: t.technology_name || "" })]
      )
    );
  }

  const points = (keyPointsByProjectId && keyPointsByProjectId[p.id]) || [];
  const pointsList = points.length
    ? el(
      "ul",
      { class: "ms-4 mt-2 list-disc" },
      points.slice().sort(sortByDisplayOrder).map((kp) => el("li", { text: kp.key_point || "" }))
    )
    : null;

  const body = el("div", { class: `px-4 ${isCarousel ? "py-4" : "pt-4"} print:pt-2` },
    [isCarousel ? title : cardLink, printLink, pointsList, techWrap].filter(Boolean)
  );

  const projectImage = isCarousel && p.image_url && String(p.image_url).trim() !== ""
    ? el("img", {
      src: p.image_url,
      alt: p.project_name || "Project image",
      class: "project-card-image w-full h-48 object-cover print:hidden",
    })
    : null;

  const article = el("article", { class: "group" }, [projectImage, body].filter(Boolean));

  // V85, V88: Wrap entire carousel card article in single anchor for clickability
  const cardContent = isCarousel
    ? el("a", { href, class: "print:hidden" }, [article])
    : article;

  const cardClass = isCarousel
    ? "carousel-card glow-on-hover rounded-lg"
    : "glow-on-hover rounded-lg";
  return el("div", { class: cardClass }, [cardContent]);
};

const renderProjects = (projects, keyPointsByProjectId, techByProjectId) => {
  const container = document.getElementById("projectsContainer");
  if (!container) return;

  clearEl(container, ["projectsCarousel"]);

  const carousel = document.getElementById("projectsCarousel");
  const track = carousel?.querySelector(".projects-carousel-track");
  if (track) {
    track.innerHTML = "";
  }

  const sortedProjects = (projects || []).slice().sort(sortByDisplayOrder);
  for (const p of sortedProjects) {
    const card = buildProjectCard(p, keyPointsByProjectId, techByProjectId);
    card.classList.add("static-project-card");
    container.appendChild(card);

    if (track) {
      const carouselCard = buildProjectCard(p, keyPointsByProjectId, techByProjectId, true);
      const slide = el("div", { class: "projects-carousel-slide flex-shrink-0 flex-grow-0" }, [
        carouselCard,
      ]);
      track.appendChild(slide);
    }
  }

  // V60: ensure carousel markup is after the static list
  if (carousel && carousel.parentElement === container) {
    container.appendChild(carousel);
  }

  return { projectCount: sortedProjects.length };
};

export { buildProjectCard, clearEl, el, reAddSectionPlaceholder, renderEducation, renderExperience, renderLanguages, renderProfile, renderProjects, renderSkills, renderSummary };
