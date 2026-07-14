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

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
