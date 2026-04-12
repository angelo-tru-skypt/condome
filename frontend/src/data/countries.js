export const COUNTRIES = [
  { code: "DO", name: "Republica Dominicana" },
  { code: "US", name: "Estados Unidos" },
  { code: "MX", name: "Mexico" },
  { code: "CO", name: "Colombia" },
  { code: "VE", name: "Venezuela" },
  { code: "PE", name: "Peru" },
  { code: "CL", name: "Chile" },
  { code: "AR", name: "Argentina" },
  { code: "EC", name: "Ecuador" },
  { code: "GT", name: "Guatemala" },
  { code: "PA", name: "Panama" },
  { code: "CR", name: "Costa Rica" },
];

export function getCountryByCode(code) {
  const normalized = (code || "").trim().toUpperCase();
  return COUNTRIES.find((country) => country.code === normalized) || null;
}

export function getCountryLabel(code) {
  return getCountryByCode(code)?.name || (code || "").trim() || "";
}
