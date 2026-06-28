export const getConfig = () => {
  const cfg = window.__CONFIG__ || {};
  return {
    apiBaseUrl: typeof cfg.API_BASE_URL === "string" ? cfg.API_BASE_URL : "/api",
    resumeId:
      typeof cfg.RESUME_ID === "number"
        ? cfg.RESUME_ID
        : Number.parseInt(String(cfg.RESUME_ID || "1"), 10),
  };
};
