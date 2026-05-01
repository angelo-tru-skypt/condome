export const DASHBOARD_ROOT = "/dashboard";

export function toDashboardPath(path = "") {
  const safePath = String(path || "").trim();

  if (!safePath || safePath === "/" || safePath === "dashboard" || safePath === DASHBOARD_ROOT) {
    return DASHBOARD_ROOT;
  }

  if (safePath.startsWith(`${DASHBOARD_ROOT}/`)) {
    return safePath;
  }

  const normalizedPath = safePath
    .replace(/^\/+/, "")
    .replace(/^dashboard\/?/, "");

  return `${DASHBOARD_ROOT}/${normalizedPath}`;
}
