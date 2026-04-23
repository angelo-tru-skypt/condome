import { useEffect, useState } from "react";
import authService from "../utils/AuthService";
import { useAuth } from "../context/AuthContext";

const SURFACE = "rounded-[24px] border border-[var(--border-standard)] bg-[var(--surface-1)] shadow-[var(--shadow-card)]";
const INPUT = "w-full px-4 py-3 bg-[var(--surface-0)] border border-[var(--border-standard)] rounded-xl text-[var(--fg-primary)] text-sm outline-none transition-all focus:border-[var(--condome-orange)] focus:bg-[var(--surface-2)] focus:ring-4 focus:ring-[var(--condome-orange)]/10 font-medium shadow-sm";
const LABEL = "block text-[10px] font-bold tracking-[0.12em] uppercase text-[var(--fg-tertiary)] mb-1.5";
const INK_CARD = "rounded-[24px] border border-[#1A1612]/10 bg-[#1A1612] text-white p-7 shadow-xl";

export default function ResidentProfilePage() {
  const { user, refreshSession } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    billing_name: "",
    tax_id: "",
    billing_address: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    authService
      .getProfile()
      .then((data) => {
        setProfile(data.profile);
        setForm({
          nombre: data.profile?.nombre || "",
          apellido: data.profile?.apellido || "",
          email: data.profile?.email || "",
          telefono: data.profile?.telefono || "",
          billing_name: data.profile?.billing_name || "",
          tax_id: data.profile?.tax_id || "",
          billing_address: data.profile?.billing_address || "",
        });
      })
      .catch((error) => {
        setProfileError(error.message || "No se pudo cargar el perfil");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleProfileChange = ({ target: { name, value } }) => {
    setForm((current) => ({ ...current, [name]: value }));
    if (profileError) setProfileError("");
    if (profileSuccess) setProfileSuccess("");
  };

  const handlePasswordChange = ({ target: { name, value } }) => {
    setPasswordForm((current) => ({ ...current, [name]: value }));
    if (passwordError) setPasswordError("");
    if (passwordSuccess) setPasswordSuccess("");
  };

  const submitProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    setProfileError("");
    setProfileSuccess("");
    try {
      const data = await authService.updateProfile(form);
      setProfile(data.profile);
      setForm({
        nombre: data.profile?.nombre || "",
        apellido: data.profile?.apellido || "",
        email: data.profile?.email || "",
        telefono: data.profile?.telefono || "",
        billing_name: data.profile?.billing_name || "",
        tax_id: data.profile?.tax_id || "",
        billing_address: data.profile?.billing_address || "",
      });
      await refreshSession();
      setProfileSuccess("Perfil actualizado correctamente.");
    } catch (error) {
      setProfileError(error.message || "No se pudo actualizar el perfil");
    } finally {
      setSavingProfile(false);
    }
  };

  const submitPassword = async (event) => {
    event.preventDefault();
    setSavingPassword(true);
    setPasswordError("");
    setPasswordSuccess("");
    try {
      await authService.changePassword(passwordForm);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordSuccess("Contraseña actualizada correctamente.");
    } catch (error) {
      setPasswordError(error.message || "No se pudo cambiar la contraseña");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 rounded-full border-2 border-[var(--border-standard)] border-t-[var(--condome-orange)]"
            style={{ animation: "spin 0.8s linear infinite" }}
          />
          <p className="text-sm text-[var(--fg-tertiary)]">Cargando tu perfil...</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section
        className="rounded-[34px] overflow-hidden border border-[var(--border-standard)]"
        style={{
          background: "linear-gradient(135deg, #0E2433 0%, #1A1612 45%, #1A1612 100%)",
          boxShadow: "0 24px 60px rgba(14,36,51,0.16)",
        }}
      >
        <div className="px-7 py-8 md:px-10 md:py-10 relative">
          <div
            className="absolute inset-y-0 right-0 w-1/2 opacity-20 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at 75% 30%, var(--condome-orange-soft) 0, transparent 65%)",
            }}
          />
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] font-black text-[var(--condome-orange-soft)]">
                Mi residencia
              </p>
              <h1
                className="mt-4 text-4xl md:text-[3.2rem] text-white font-bold leading-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {user?.name || "Perfil del residente"}
              </h1>
              <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-white/70 font-medium">
                Desde aqui puedes actualizar tus datos personales y cambiar tu contraseña sin salir del dashboard.
              </p>
            </div>

            <div className="rounded-[28px] bg-white/5 border border-white/10 backdrop-blur-sm p-6">
              <p className="text-[10px] uppercase tracking-[0.24em] font-black text-white/40">
                Tu unidad oficial
              </p>
              <div className="mt-5 space-y-3">
                <InfoTile label="Apartamento" value={profile?.apartamento || "Pendiente"} />
                <InfoTile label="Edificio" value={profile?.edificio || "Pendiente"} />
                <InfoTile label="Condominio" value={profile?.condominio || "Pendiente"} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.95fr]">
        <div className={`${SURFACE} p-6 md:p-7`}>
          <p className="text-[10px] uppercase tracking-[0.24em] font-black text-[var(--condome-orange)]">
            Datos personales
          </p>
          <h2 className="mt-2 text-2xl font-bold text-[var(--fg-primary)] tracking-tight">
            Edita tu perfil
          </h2>

          <form className="mt-6 space-y-4" onSubmit={submitProfile}>
            {profileError && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                {profileError}
              </div>
            )}
            {profileSuccess && (
              <div className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                {profileSuccess}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Nombre</label>
                <input name="nombre" value={form.nombre} onChange={handleProfileChange} className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Apellido</label>
                <input name="apellido" value={form.apellido} onChange={handleProfileChange} className={INPUT} />
              </div>
            </div>

            <div>
              <label className={LABEL}>Correo</label>
              <input name="email" type="email" value={form.email} onChange={handleProfileChange} className={INPUT} />
            </div>

            <div>
              <label className={LABEL}>Teléfono</label>
              <input name="telefono" value={form.telefono} onChange={handleProfileChange} className={INPUT} />
            </div>

            <div className="pt-6 mt-6 border-t border-[var(--border-standard)]">
              <p className="text-[10px] uppercase tracking-[0.24em] font-black text-[var(--condome-orange)] mb-4">
                Datos de Facturación
              </p>
              <div className="space-y-4">
                <div>
                  <label className={LABEL}>Nombre Fiscal (Para recibos)</label>
                  <input name="billing_name" value={form.billing_name} onChange={handleProfileChange} className={INPUT} placeholder="Ej: Juan Perez S.R.L" />
                </div>
                <div>
                  <label className={LABEL}>Tax ID / RNC / Cédula</label>
                  <input name="tax_id" value={form.tax_id} onChange={handleProfileChange} className={INPUT} placeholder="001-0000000-0" />
                </div>
                <div>
                  <label className={LABEL}>Dirección de Facturación</label>
                  <textarea name="billing_address" value={form.billing_address} onChange={handleProfileChange} className={`${INPUT} h-24 resize-none`} placeholder="Calle, Número, Ciudad..." />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full py-4 rounded-xl text-white text-xs font-black uppercase tracking-widest border-none disabled:opacity-50 cursor-pointer shadow-lg transition-transform active:scale-95"
              style={{ background: "linear-gradient(135deg, #1A1612, #000000)" }}
            >
              {savingProfile ? "Guardando..." : "Actualizar mis datos"}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className={`${SURFACE} p-7`}>
            <p className="text-[10px] uppercase tracking-[0.24em] font-black text-[var(--condome-orange)]">
              Seguridad
            </p>
            <h2 className="mt-2 text-2xl font-bold text-[var(--fg-primary)] tracking-tight">
              Asegurar cuenta
            </h2>

            <form className="mt-6 space-y-4" onSubmit={submitPassword}>
              {passwordError && (
                <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                  {passwordSuccess}
                </div>
              )}

              <div>
                <label className={LABEL}>Contraseña actual</label>
                <input
                  name="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  className={INPUT}
                />
              </div>

              <div>
                <label className={LABEL}>Nueva contraseña</label>
                <input
                  name="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  className={INPUT}
                />
              </div>

              <div>
                <label className={LABEL}>Confirmar nueva contraseña</label>
                <input
                  name="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  className={INPUT}
                />
              </div>

              <button
                type="submit"
                disabled={savingPassword}
                className="w-full py-4 rounded-xl text-white text-xs font-black uppercase tracking-widest border-none disabled:opacity-50 cursor-pointer shadow-lg transition-transform active:scale-95"
                style={{ background: "linear-gradient(135deg, var(--condome-orange-soft), var(--condome-orange))" }}
              >
                {savingPassword ? "Actualizando..." : "Cambiar contraseña"}
              </button>
            </form>
          </div>

          <div className={`${SURFACE} p-6`}>
            <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#6F7B7B]">
              Resumen de acceso
            </p>
            <div className="mt-4 space-y-3">
              <SummaryRow label="Rol" value={profile?.role || "Residente"} />
              <SummaryRow label="Correo de acceso" value={form.email || "Sin definir"} />
              <SummaryRow label="Teléfono" value={form.telefono || "Sin definir"} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoTile({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#262626] bg-black/10 px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-[var(--surface-0)] border border-[var(--border-subtle)] px-4 py-3.5">
      <span className="text-xs font-bold uppercase tracking-wider text-[var(--fg-tertiary)]">{label}</span>
      <span className="text-sm font-bold text-[var(--fg-primary)] text-right">{value}</span>
    </div>
  );
}
