const getConfig = () => {
  const cfg = window.__CONFIG__ || {};
  return {
    apiBaseUrl: typeof cfg.API_BASE_URL === "string" ? cfg.API_BASE_URL : "/api",
    resumeId:
      typeof cfg.RESUME_ID === "number"
        ? cfg.RESUME_ID
        : Number.parseInt(String(cfg.RESUME_ID || "1"), 10),
  };
};

const sortByDisplayOrder = (a, b) => {
  const ao = a && a.display_order != null ? a.display_order : Number.MAX_SAFE_INTEGER;
  const bo = b && b.display_order != null ? b.display_order : Number.MAX_SAFE_INTEGER;
  if (ao !== bo) return ao - bo;
  const aid = a && a.id != null ? a.id : 0;
  const bid = b && b.id != null ? b.id : 0;
  return aid - bid;
};

const buildUrl = (apiBaseUrl, path) => {
  const base = apiBaseUrl.endsWith("/") ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
};

const fetchBody = async (apiBaseUrl, path) => {
  const url = buildUrl(apiBaseUrl, path);
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    let msg = res.statusText;
    try {
      const data = await res.json();
      if (data && typeof data.body === "string") msg = data.body;
    } catch {
      // ignore
    }
    throw new Error(`${res.status}: ${msg}`);
  }

  const data = await res.json();
  return data.body;
};

const clearEl = (el) => {
  while (el.firstChild) el.removeChild(el.firstChild);
};

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

const renderProfile = (resume) => {
  if (!resume) return;

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

const renderSkills = (skills) => {
  const list = document.getElementById("skillsList");
  if (!list) return;

  clearEl(list);

  for (const s of (skills || []).slice().sort(sortByDisplayOrder)) {
    const pct = Math.max(0, Math.min(100, Number(s.confidence_percentage || 0)));
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

const formatDateRange = (start, end) => {
  if (start && end) return `${start} - ${end}`;
  if (start && !end) return `${start} - Present`;
  return "";
};

const formatYear = (value) => {
  if (value == null) return "";
  const s = String(value).trim();
  if (!s) return "";

  const match = s.match(/(19|20)\d{2}/);
  if (match) return match[0];

  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return String(d.getFullYear());

  return s;
};

const renderEducation = (educations, keyPointsByEducationId) => {
  const container = document.getElementById("educationContainer");
  if (!container) return;

  clearEl(container);

  for (const ed of (educations || []).slice().sort(sortByDisplayOrder)) {
    const header = el("div", { class: "my-4 flex flex-wrap gap-2 print:my-3" }, [
      el(
        "span",
        {
          class:
            "inline-flex items-center justify-center rounded bg-yellow-100 px-2.5 py-0.5 text-yellow-700",
        },
        [el("p", { class: "whitespace-nowrap text-sm", text: ed.education_stage || "" })]
      ),
      el("h2", { class: "inline-flex text-lg font-bold", text: ed.institution_name || "" }),
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

  for (const w of (items || []).slice().sort(sortByDisplayOrder)) {
    const title = w.company_name ? `${w.job_title} @ ${w.company_name}` : w.job_title;
    container.appendChild(el("h2", { class: "mt-4 inline-flex text-lg font-bold print:mt-2", text: title }));

    const points = (keyPointsByWorkId && keyPointsByWorkId[w.id]) || [];
    const ul = el(
      "ul",
      { class: "ms-4 mt-2 list-disc" },
      points.slice().sort(sortByDisplayOrder).map((kp) => el("li", { text: kp.key_point || "" }))
    );

    if (w.description) {
      ul.appendChild(el("li", { text: w.description }));
    }

    container.appendChild(ul);
  }
};

const renderProjects = (projects, keyPointsByProjectId, techByProjectId) => {
  const container = document.getElementById("projectsContainer");
  if (!container) return;

  clearEl(container);

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
          d: "M579.8 267.7c56.5-56.5 56.5-148 0-204.5-50-50-128.8-56.5-186.3-15.4l-1.6 1.1c-14.4 10.3-17.7 30.3-7.4 44.6s30.3 17.7 44.6 7.4l1.6-1.1c32.1-22.9 76-19.3 103.8 8.6 31.5 31.5 31.5 82.5 0 114L422.3 334.8c-31.5 31.5-82.5 31.5-114 0-27.9-27.9-31.5-71.8-8.6-103.8l1.1-1.6c10.3-14.4 6.9-34.4-7.4-44.6s-34.4-6.9-44.6 7.4l-1.1 1.6C206.5 251.2 213 330 263 380c56.5 56.5 148 56.5 204.5 0l112.3-112.3zM60.2 244.3c-56.5 56.5-56.5 148 0 204.5 50 50 128.8 56.5 186.3 15.4l1.6-1.1c14.4-10.3 17.7-30.3 7.4-44.6s-30.3-17.7-44.6-7.4l-1.6 1.1c-32.1 22.9-76 19.3-103.8-8.6C74 372 74 321 105.5 289.5l112.2-112.3c31.5-31.5 82.5-31.5 114 0 27.9 27.9 31.5 71.8 8.6 103.9l-1.1 1.6c-10.3 14.4-6.9 34.4 7.4 44.6s34.4 6.9 44.6-7.4l1.1-1.6C433.5 260.8 427 182 377 132c-56.5-56.5-148-56.5-204.5 0L60.2 244.3z",
        }),
      ]
    );

  for (const p of (projects || []).slice().sort(sortByDisplayOrder)) {
    const href = p.project_link || p.source_code_link || "#";
    const title = el(
      "h3",
      { class: "text-lg font-medium text-gray-900" },
      [linkIconSvg(), document.createTextNode(" "), document.createTextNode(p.project_name || "")]
    );

    const link = el("a", { href }, [title]);
    const printLink = el("p", { class: "hidden text-sm print:block", text: href !== "#" ? href : "" });

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

    const body = el("div", { class: "px-4 pt-4 print:pt-2" },
      [link, printLink, pointsList, techWrap].filter(Boolean)
    );

    const article = el("article", { class: "group" }, [body]);
    const card = el("div", { class: "glow-on-hover rounded-lg" }, [article]);
    container.appendChild(card);
  }
};

const onReady = async () => {
  const btn = document.getElementById("printButton");
  if (btn) {
    btn.onclick = function () {
      window.print();
    };
  }

  const { apiBaseUrl, resumeId } = getConfig();
  if (!Number.isFinite(resumeId)) return;

  try {
    const [resume, skills, educations, work, projects, languages] = await Promise.all([
      fetchBody(apiBaseUrl, `/resume/${resumeId}`),
      fetchBody(apiBaseUrl, `/resume/${resumeId}/skills`),
      fetchBody(apiBaseUrl, `/resume/${resumeId}/education`),
      fetchBody(apiBaseUrl, `/resume/${resumeId}/work_experiences`),
      fetchBody(apiBaseUrl, `/resume/${resumeId}/portfolio_projects`),
      fetchBody(apiBaseUrl, `/resume/${resumeId}/languages`),
    ]);

    const educationKeyPointsPairs = await Promise.all(
      (educations || []).map(async (ed) => {
        try {
          const items = await fetchBody(apiBaseUrl, `/resume/${resumeId}/education/${ed.id}/key_points`);
          return [ed.id, items || []];
        } catch {
          return [ed.id, []];
        }
      })
    );

    const workKeyPointsPairs = await Promise.all(
      (work || []).map(async (w) => {
        try {
          const items = await fetchBody(apiBaseUrl, `/resume/${resumeId}/work_experiences/${w.id}/key_points`);
          return [w.id, items || []];
        } catch {
          return [w.id, []];
        }
      })
    );

    const projectKeyPointsPairs = await Promise.all(
      (projects || []).map(async (p) => {
        try {
          const items = await fetchBody(apiBaseUrl, `/resume/${resumeId}/portfolio_projects/${p.id}/key_points`);
          return [p.id, items || []];
        } catch {
          return [p.id, []];
        }
      })
    );

    const projectTechPairs = await Promise.all(
      (projects || []).map(async (p) => {
        try {
          const items = await fetchBody(
            apiBaseUrl,
            `/resume/${resumeId}/portfolio_projects/${p.id}/technologies`
          );
          return [p.id, items || []];
        } catch {
          return [p.id, []];
        }
      })
    );

    const frameworkPairs = await Promise.all(
      (languages || []).map(async (lang) => {
        try {
          const items = await fetchBody(apiBaseUrl, `/resume/${resumeId}/languages/${lang.id}/frameworks`);
          return [lang.id, items || []];
        } catch {
          return [lang.id, []];
        }
      })
    );

    const educationKeyPointsById = Object.fromEntries(educationKeyPointsPairs);
    const workKeyPointsById = Object.fromEntries(workKeyPointsPairs);
    const projectKeyPointsById = Object.fromEntries(projectKeyPointsPairs);
    const projectTechById = Object.fromEntries(projectTechPairs);
    const frameworksByLanguageId = Object.fromEntries(frameworkPairs);

    renderProfile(resume);
    renderSkills(skills);
    renderLanguages(languages, frameworksByLanguageId);
    renderEducation(educations, educationKeyPointsById);
    renderExperience(work, workKeyPointsById);
    renderProjects(projects, projectKeyPointsById, projectTechById);
  } catch (err) {
    console.error(err);
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", onReady);
} else {
  void onReady();
}
