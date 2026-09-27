// JSON render mode: resolves a resume document from an inline source
// (URL fragment, query parameter, or page config) instead of the API.

import {
  hideOverlayPlaceholders,
  renderEducation,
  renderExperience,
  renderLanguages,
  renderProfile,
  renderProjects,
  renderSkills,
  renderSummary,
} from "./renderers.js";

class JsonDocumentError extends Error {}

const resolveJsonSource = ({ search, hash, config } = {}) => {
  const cfg =
    config !== undefined
      ? config
      : (typeof window !== "undefined" && window.__CONFIG__) || {};
  const rawSearch =
    search !== undefined
      ? search
      : typeof window !== "undefined"
        ? window.location.search
        : "";
  const rawHash =
    hash !== undefined
      ? hash
      : typeof window !== "undefined"
        ? window.location.hash
        : "";

  const queryParams = new URLSearchParams(rawSearch);
  const fragmentParams = new URLSearchParams(
    rawHash.startsWith("#") ? rawHash.slice(1) : rawHash,
  );

  const candidates = [
    { type: "fragment-gz", value: fragmentParams.get("json.gz") },
    { type: "fragment", value: fragmentParams.get("json") },
    { type: "url", value: queryParams.get("json-url") },
    { type: "inline", value: cfg.RESUME_JSON },
    { type: "inline-url", value: cfg.RESUME_JSON_URL },
  ];

  for (const candidate of candidates) {
    if (candidate.value == null) continue;
    if (typeof candidate.value === "string" && !candidate.value.trim())
      continue;
    return candidate;
  }
  return null;
};

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const loadJsonDocument = async (source) => {
  switch (source.type) {
    case "inline":
      if (typeof source.value === "string") {
        try {
          return JSON.parse(source.value);
        } catch {
          throw new JsonDocumentError("RESUME_JSON is not valid JSON");
        }
      }
      return source.value;
    case "url":
    case "inline-url": {
      const res = await fetch(source.value, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        throw new JsonDocumentError(
          `JSON source fetch failed: ${res.status} ${res.statusText}`,
        );
      }
      return res.json();
    }
    default:
      throw new JsonDocumentError(`unsupported JSON source: ${source.type}`);
  }
};

const normalizeResumeDocument = (value) => {
  if (!isPlainObject(value)) {
    throw new JsonDocumentError("JSON source did not produce an object");
  }

  let doc;
  if ("document" in value) {
    if (value.schema_version !== 1) {
      throw new JsonDocumentError(
        `unsupported schema_version: ${value.schema_version}`,
      );
    }
    doc = value.document;
  } else {
    if ("schema_version" in value && value.schema_version !== 1) {
      throw new JsonDocumentError(
        `unsupported schema_version: ${value.schema_version}`,
      );
    }
    doc = value;
  }

  if (!isPlainObject(doc) || !isPlainObject(doc.resume)) {
    throw new JsonDocumentError(
      "JSON document must be an object containing a resume object",
    );
  }
  return doc;
};

const renderResumeDocument = (doc) => {
  renderProfile(doc.resume);
  renderSummary(doc.resume.executive_summary);
  renderEducation(doc.education || [], doc.education_key_points || {});
  renderExperience(
    doc.work_experiences || [],
    doc.work_experience_key_points || {},
  );
  renderSkills(doc.skills || []);
  const result = renderProjects(
    doc.portfolio_projects || [],
    doc.portfolio_key_points || {},
    doc.portfolio_technologies || {},
  );
  renderLanguages(doc.languages || [], doc.frameworks || {});
  return { projectCount: result?.projectCount || 0 };
};

const showJsonError = (message) => {
  const banner = document.getElementById("jsonErrorBanner");
  if (banner) {
    banner.textContent = `Resume JSON error: ${message}`;
    banner.classList.remove("hidden");
  }
  hideOverlayPlaceholders();
};

export {
  JsonDocumentError,
  loadJsonDocument,
  normalizeResumeDocument,
  renderResumeDocument,
  resolveJsonSource,
  showJsonError,
};
