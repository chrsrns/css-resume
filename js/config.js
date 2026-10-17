const toPositiveInteger = (value) => {
  if (value == null) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) return undefined;
  return n;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const toUuid = (value) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return UUID_RE.test(trimmed) ? trimmed : undefined;
};

export const getConfig = () => {
  const cfg = (typeof window !== "undefined" && window.__CONFIG__) || {};
  return {
    apiBaseUrl:
      typeof cfg.API_BASE_URL === "string" ? cfg.API_BASE_URL : "/api",
    resumeId: toUuid(cfg.RESUME_ID),
  };
};

export const resolveResumeId = (
  search = typeof window !== "undefined" && window.location
    ? window.location.search
    : "",
  configResumeId = getConfig().resumeId,
) => {
  const params = new URLSearchParams(search);
  return toUuid(params.get("resume_id")) ?? configResumeId;
};

export const resolveSkillsInline = (
  search = typeof window !== "undefined" && window.location
    ? window.location.search
    : "",
  configSkillsInline = (
    (typeof window !== "undefined" && window.__CONFIG__) ||
    {}
  ).SKILLS_INLINE,
) => {
  const query = new URLSearchParams(search).get("skillsInline");
  if (query === "0") return false;
  if (query === "1") return true;
  return configSkillsInline !== false;
};

export const resolvePillsInline = (
  search = typeof window !== "undefined" && window.location
    ? window.location.search
    : "",
  configPillsInline = (
    (typeof window !== "undefined" && window.__CONFIG__) ||
    {}
  ).PILLS_INLINE,
) => {
  const query = new URLSearchParams(search).get("pillsInline");
  if (query === "0") return false;
  if (query === "1") return true;
  return configPillsInline !== false;
};

export const resolveProfileImageSize = (
  search = typeof window !== "undefined" && window.location
    ? window.location.search
    : "",
  configSize = ((typeof window !== "undefined" && window.__CONFIG__) || {})
    .PROFILE_IMAGE_SIZE,
) => {
  const params = new URLSearchParams(search);
  return (
    toPositiveInteger(params.get("profileImageSize")) ??
    toPositiveInteger(configSize)
  );
};

export const resolveProfileImageVisible = (
  search = typeof window !== "undefined" && window.location
    ? window.location.search
    : "",
  configProfileImage = (
    (typeof window !== "undefined" && window.__CONFIG__) ||
    {}
  ).PROFILE_IMAGE,
) => {
  const query = new URLSearchParams(search).get("profileImage");
  if (query === "0") return false;
  if (query === "1") return true;
  return configProfileImage !== false;
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

export const resolveExperiencePrintLimit = (
  search = typeof window !== "undefined" && window.location
    ? window.location.search
    : "",
  configLimit = ((typeof window !== "undefined" && window.__CONFIG__) || {})
    .EXPERIENCE_PRINT_LIMIT,
) => {
  const params = new URLSearchParams(search);
  return (
    toPositiveInteger(params.get("printExperiences")) ??
    toPositiveInteger(configLimit) ??
    2
  );
};
