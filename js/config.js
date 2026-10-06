const toPositiveInteger = (value) => {
  if (value == null) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) return undefined;
  return n;
};

export const getConfig = () => {
  const cfg = (typeof window !== "undefined" && window.__CONFIG__) || {};
  return {
    apiBaseUrl:
      typeof cfg.API_BASE_URL === "string" ? cfg.API_BASE_URL : "/api",
    resumeId:
      typeof cfg.RESUME_ID === "number"
        ? cfg.RESUME_ID
        : Number.parseInt(String(cfg.RESUME_ID || "1"), 10),
  };
};

export const resolveResumeId = (
  search = typeof window !== "undefined" && window.location
    ? window.location.search
    : "",
  configResumeId = getConfig().resumeId,
) => {
  const params = new URLSearchParams(search);
  return toPositiveInteger(params.get("resume_id")) ?? configResumeId;
};

export const resolveProjectLimits = (
  search = typeof window !== "undefined" && window.location
    ? window.location.search
    : "",
  overrides = {},
) => {
  const cfg = (typeof window !== "undefined" && window.__CONFIG__) || {};
  const params = new URLSearchParams(search);

  const queryScreen = toPositiveInteger(params.get("projects"));
  const queryPrint = toPositiveInteger(params.get("printProjects"));
  const cfgScreen = toPositiveInteger(cfg.PROJECT_LIMIT);
  const cfgPrint = toPositiveInteger(cfg.PROJECT_PRINT_LIMIT);

  const screenLimit =
    toPositiveInteger(overrides.screenCap) ?? queryScreen ?? cfgScreen;
  const printLimit =
    toPositiveInteger(overrides.printCap) ?? queryPrint ?? cfgPrint ?? 6;

  return { screenLimit, printLimit };
};
