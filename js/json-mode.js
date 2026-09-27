// JSON render mode: resolves a resume document from an inline source
// (URL fragment, query parameter, or page config) instead of the API.

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

export { resolveJsonSource };
