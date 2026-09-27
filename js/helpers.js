export const sortByDisplayOrder = (a, b) => {
  const ao = a && a.display_order != null ? a.display_order : Number.MAX_SAFE_INTEGER;
  const bo = b && b.display_order != null ? b.display_order : Number.MAX_SAFE_INTEGER;
  if (ao !== bo) return ao - bo;
  const aid = a && a.id != null ? a.id : 0;
  const bid = b && b.id != null ? b.id : 0;
  return aid - bid;
};

export const formatDateRange = (start, end) => {
  if (start && end) return `${start} - ${end}`;
  if (start && !end) return `${start} - Present`;
  return "";
};

export const formatYear = (value) => {
  if (value == null) return "";
  const s = String(value).trim();
  if (!s) return "";

  const match = s.match(/(19|20)\d{2}/);
  if (match) return match[0];

  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return String(d.getFullYear());

  return s;
};

export const parseIsoPartialDateLocal = (value) => {
  if (value == null) return "";
  const s = String(value).trim();
  if (!s) return "";

  const match = s.match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/);
  if (match) {
    const year = Number(match[1]);
    const month = match[2] ? Number(match[2]) : 1;
    const day = match[3] ? Number(match[3]) : 1;
    const d = new Date(year, month - 1, day);
    return d.getFullYear() === year &&
      d.getMonth() === month - 1 &&
      d.getDate() === day
      ? d
      : "";
  }

  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? "" : d;
};

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
