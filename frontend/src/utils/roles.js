export function normalizeRoleValue(role) {
  return String(role || "").trim().toLowerCase();
}

// Ahora 'owner' es el administrador de todo el sistema (Super Admin)
export function isSystemAdminRole(role) {
  const safeRole = normalizeRoleValue(role);
  return safeRole === "owner";
}

// El administrador de un condominio particular es el 'admin' del condo
export function isCondoAdminRole(role) {
  const safeRole = normalizeRoleValue(role);
  return safeRole === "admin" || safeRole === "encargado";
}

// Para compatibilidad hacia atrás si se usaba isAdminRole
export function isAdminRole(role) {
  return isSystemAdminRole(role) || isCondoAdminRole(role);
}

// Verifica si es el propietario de una unidad (Property Owner)
export function isPropertyOwnerRole(role) {
  return normalizeRoleValue(role) === "propietario";
}

// Verifica si es un rol de residente
export function isResidentRole(role) {
  return normalizeRoleValue(role) === "residente";
}

export function getRoleLabel(role) {
  const safeRole = normalizeRoleValue(role);
  if (safeRole === "owner") return "Super Administrador";
  if (safeRole === "admin") return "Admin. Condominio";
  if (safeRole === "propietario") return "Propietario Encargado";
  if (safeRole === "residente") return "Residente";
  return "Usuario";
}
