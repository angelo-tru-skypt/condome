export const PLAN_CATALOG = {
  free: {
    code: "free",
    label: "Free",
    max_condominios: 1,
    monthly_price_dop: 0,
    supports_automatic_reports: false,
    feature_summary: [
      "Límite de 1 condominio",
      "Gestión de residentes",
      "Pagos básicos",
    ],
  },
  pro: {
    code: "pro",
    label: "Pro",
    max_condominios: 3,
    monthly_price_dop: 1200,
    supports_automatic_reports: true,
    feature_summary: [
      "Límite de 3 condominios",
      "Soporte prioritario",
      "Reportes automáticos mensuales",
    ],
  },
  premium: {
    code: "premium",
    label: "Premium",
    max_condominios: null,
    monthly_price_dop: 6000,
    supports_automatic_reports: true,
    feature_summary: [
      "Condominios ilimitados",
      "API de integración",
      "Reportes automáticos mensuales",
    ],
  },
};

export function getPlanDetails(user) {
  const planCode = user?.plan || "free";
  return {
    ...(PLAN_CATALOG[planCode] || PLAN_CATALOG.free),
    ...(user?.plan_details || {}),
  };
}

export function getPlanUsage(user, condominios = []) {
  const details = getPlanDetails(user);
  const count = Array.isArray(condominios) ? condominios.length : 0;
  const limit = details.max_condominios ?? null;
  const canAddMore = limit === null || count < limit;
  const remainingSlots = limit === null ? null : Math.max(limit - count, 0);

  return {
    details,
    count,
    limit,
    canAddMore,
    remainingSlots,
    hasUnlimitedCondominios: limit === null,
    usageLabel: limit === null ? `${count} / Ilimitados` : `${count} / ${limit}`,
    automationCopy: details.supports_automatic_reports
      ? "Incluye reporte financiero mensual automático por cada condominio activo."
      : "Los reportes automáticos mensuales se activan con Pro o Premium.",
    upgradeCopy:
      details.code === "pro"
        ? "Actualiza a Premium para seguir agregando condominios sin límite."
        : "Actualiza tu plan a Pro o Premium para añadir más condominios.",
  };
}
