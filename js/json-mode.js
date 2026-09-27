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

const MAX_GUNZIP_BYTES = 16 * 1024 * 1024;

const decodeBase64Url = (value) => {
  if (typeof value !== "string") {
    throw new JsonDocumentError("fragment payload must be a string");
  }
  let s = value;
  const padMatch = s.match(/=+$/);
  if (padMatch) {
    if (padMatch[0].length > 2) {
      throw new JsonDocumentError("invalid base64url padding");
    }
    s = s.slice(0, -padMatch[0].length);
  }
  if (s.length === 0 || !/^[A-Za-z0-9_-]+$/.test(s)) {
    throw new JsonDocumentError("fragment payload is not valid base64url");
  }
  const remainder = s.length % 4;
  if (remainder === 1) {
    throw new JsonDocumentError("invalid base64url length");
  }
  const b64 =
    (s + "===".slice(0, (4 - remainder) % 4))
      .replace(/-/g, "+")
      .replace(/_/g, "/");
  let binary;
  try {
    binary = atob(b64);
  } catch {
    throw new JsonDocumentError("fragment payload failed base64 decode");
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const gunzipBytes = async (bytes) => {
  const Decompression = globalThis.DecompressionStream;
  if (typeof Decompression !== "function") {
    throw new JsonDocumentError(
      "#json.gz requires the DecompressionStream API, which is unavailable",
    );
  }
  const input = new ReadableStream({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
  const reader = input
    .pipeThrough(new Decompression("gzip"))
    .getReader();
  const chunks = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_GUNZIP_BYTES) {
        await reader.cancel();
        throw new JsonDocumentError(
          "decompressed #json.gz payload exceeds 16 MB",
        );
      }
      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof JsonDocumentError) throw error;
    throw new JsonDocumentError(
      `#json.gz decompression failed: ${error instanceof Error ? error.message : error}`,
    );
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
};

const parseFragmentJson = (bytes, label) => {
  const text = new TextDecoder().decode(bytes);
  try {
    return JSON.parse(text);
  } catch {
    throw new JsonDocumentError(`${label} did not decode to valid JSON`);
  }
};

const loadJsonDocument = async (source) => {
  switch (source.type) {
    case "fragment": {
      const bytes = decodeBase64Url(source.value);
      return parseFragmentJson(bytes, "#json");
    }
    case "fragment-gz": {
      const compressed = decodeBase64Url(source.value);
      const bytes = await gunzipBytes(compressed);
      return parseFragmentJson(bytes, "#json.gz");
    }
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

const waitForRenderedImages = () => {
  const imgs = [...document.querySelectorAll("img")].filter((img) =>
    img.getAttribute("src"),
  );
  return Promise.all(
    imgs.map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete) return resolve();
          img.addEventListener("load", resolve, { once: true });
          img.addEventListener("error", resolve, { once: true });
        }),
    ),
  );
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
  decodeBase64Url,
  JsonDocumentError,
  loadJsonDocument,
  normalizeResumeDocument,
  renderResumeDocument,
  resolveJsonSource,
  showJsonError,
  waitForRenderedImages,
};
