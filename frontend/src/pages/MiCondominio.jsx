import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCondominio } from "../context/CondominioContext";
import RegistroCondominio from "../components/condominio/RegistroCondominio";
import { COUNTRIES, getCountryLabel } from "../data/countries";

const SURFACE = "rounded-[24px] border border-[var(--border-standard)] bg-[var(--surface-1)] shadow-[var(--shadow-card)]";
const SOFT_PANEL = "rounded-[20px] border border-[var(--border-subtle)] bg-[var(--canvas)]";
const EYEBROW = "text-[10px] uppercase tracking-[0.24em] font-bold text-[var(--fg-tertiary)]";
const SECTION_TITLE = "mt-2 text-[1.5rem] leading-tight font-bold text-[var(--fg-primary)] tracking-tight";
const INK_CARD = "rounded-[24px] border border-[#1A1612]/10 bg-[#1A1612] text-white p-7 shadow-xl";

export default function MiCondominio() {
  const { user } = useAuth();
  const { condominio, loading, actualizarCondominio } = useCondominio();
  const [editMode, setEditMode] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 rounded-full border-2 border-[#E8DDD3] border-t-[#D94F10]"
            style={{ animation: "spin 0.8s linear infinite" }}
          />
          <p className="text-sm text-[#6D625A]">Cargando condominio...</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  if (!condominio) {
    return (
      <div className="space-y-6">
        <section
          className="rounded-[34px] overflow-hidden border border-[#E6D9CD]"
          style={{
            background:
              "linear-gradient(140deg, #1A1612 0%, #4E2C1D 42%, #121110 100%)",
            boxShadow: "0 24px 60px rgba(37,24,15,0.16)",
          }}
        >
          <div className="relative px-7 py-8 md:px-10 md:py-10">
            <div
              className="absolute inset-y-0 right-0 w-[44%] opacity-30 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at 72% 26%, rgba(255,160,112,0.88) 0, rgba(255,160,112,0) 56%)",
              }}
            />
            <div className="relative z-10 grid gap-6 lg:grid-cols-[1.45fr_1fr]">
              <div>
                <span className="px-3 py-1 rounded-full bg-[#2A211C]/80 border border-white/10 text-[11px] font-semibold tracking-[0.2em] uppercase text-[#F5D2BC]">
                  Inicio del condominio
                </span>
                <h1
                  className="mt-4 text-3xl md:text-[3rem] leading-tight font-semibold text-white"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Hola, {user?.name?.split(" ")[0] || "Propietario"}. El primer paso es registrar los datos base de tu condominio.
                </h1>
                <p className="mt-4 max-w-2xl text-sm md:text-[15px] leading-7 text-white/76">
                  Desde aqui se activa todo el backend administrativo: estructura, comunidad,
                  pagos, accesos, avisos y trazabilidad. Sin esta ficha inicial, el resto del
                  panel no puede organizarse correctamente.
                </p>
              </div>

              <div className="rounded-[26px] border border-white/10 bg-white/10 backdrop-blur-md p-5">
                <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#F5D2BC]">
                  Lo que desbloquea este registro
                </p>
                <div className="mt-4 space-y-3">
                  {[
                    "Ficha maestra del condominio y configuracion inicial.",
                    "Estructura de edificios, apartamentos y comunidad.",
                    "Interfaces operativas de avisos, visitas, incidencias y cobros.",
                  ].map((item) => (
                    <div key={item} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                      <p className="text-sm leading-6 text-white/86">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={`${SURFACE} p-6 md:p-8`}>
          <RegistroCondominio />
        </section>
      </div>
    );
  }

  const stats = [
    {
      label: "Edificios",
      value: condominio.totales?.edificios ?? 0,
      helper: "Torres o bloques registrados",
      color: "#D94F10",
    },
    {
      label: "Apartamentos",
      value: condominio.totales?.apartamentos ?? 0,
      helper: "Unidades bajo gestion",
      color: "#B86A2D",
    },
    {
      label: "Residentes activos",
      value: condominio.totales?.residentes ?? 0,
      helper: "Comunidad ya vinculada",
      color: "#2E7D52",
    },
  ];

  const detailRows = [
    { label: "Tipo", value: condominio.tipo || "Sin definir" },
    { label: "RNC", value: condominio.rnc || "No registrado" },
    { label: "Telefono", value: condominio.telefono || "No registrado" },
    { label: "Email", value: condominio.email || "No registrado" },
    { label: "Ciudad", value: condominio.ciudad || "No registrada" },
    { label: "Pais", value: getCountryLabel(condominio.pais) || "No registrado" },
  ];

  const quickActions = [
    { to: "/edificios", title: "Edificios", description: "Ordena la estructura vertical del condominio.", color: "#D94F10" },
    { to: "/apartamentos", title: "Apartamentos", description: "Gestiona unidades, estados y asignaciones.", color: "#B86A2D" },
    { to: "/residentes", title: "Residentes", description: "Activa la comunidad y sus relaciones operativas.", color: "#C56A1C" },
    { to: "/configuracion", title: "Configuracion", description: "Ajusta reglas base y parametros generales.", color: "#8F5A26" },
  ];

  const condoBars = [
    { label: "Edificios", value: condominio.totales?.edificios ?? 0, color: "#D94F10" },
    { label: "Apartamentos", value: condominio.totales?.apartamentos ?? 0, color: "#B86A2D" },
    { label: "Residentes", value: condominio.totales?.residentes ?? 0, color: "#C56A1C" },
  ];

  return (
    <div className="space-y-6">
      <section
        className="rounded-[34px] overflow-hidden border border-[#E6D9CD]"
        style={{
          background:
            "linear-gradient(140deg, #1A1612 0%, #4E2C1D 42%, #121110 100%)",
          boxShadow: "0 24px 60px rgba(37,24,15,0.16)",
        }}
      >
        <div className="relative px-7 py-8 md:px-10 md:py-10">
          <div
            className="absolute inset-y-0 right-0 w-[45%] opacity-32 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at 70% 30%, rgba(255,160,112,0.92) 0, rgba(255,160,112,0) 56%), radial-gradient(circle at 74% 68%, rgba(217,79,16,0.22) 0, rgba(217,79,16,0) 48%)",
            }}
          />

          <div className="relative z-10 grid gap-6 lg:grid-cols-[1.55fr_1fr]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-[0.24em] uppercase text-white/50">
                  Mi condominio
                </span>
                <span className="px-3 py-1 rounded-full bg-[var(--condome-orange)]/10 text-[var(--condome-orange-soft)] text-[10px] font-black uppercase tracking-[0.1em] border border-[var(--condome-orange)]/20">
                  Ficha central
                </span>
              </div>

              <h1
                className="mt-4 text-3xl md:text-[3rem] leading-tight font-semibold text-white"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {condominio.nombre}
              </h1>
              <p className="mt-4 max-w-2xl text-sm md:text-[15px] leading-7 text-white/78">
                Esta ficha concentra los datos base del condominio y sirve como punto de partida
                para el resto del backend administrativo. Desde aqui puedes afinar identidad,
                contacto y estructura operativa.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => setEditMode(true)}
                  className="px-8 py-4 rounded-full text-xs font-black uppercase tracking-widest text-white border-none cursor-pointer shadow-lg transition-all hover:scale-105"
                  style={{ background: "linear-gradient(135deg, var(--condome-orange-soft), var(--condome-orange))" }}
                >
                  Editar condominio
                </button>
                <Link
                  to="/configuracion"
                  className="px-8 py-4 rounded-full no-underline text-xs font-black uppercase tracking-widest text-white border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Ajustes
                </Link>
              </div>
            </div>

            <div className="rounded-[26px] border border-white/10 bg-white/10 backdrop-blur-md p-5">
              <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#F5D2BC]">
                Resumen operativo
              </p>
              <div className="mt-4 grid gap-3">
                {stats.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em]" style={{ color: "#F5D2BC" }}>
                      {item.label}
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-white">{item.value}</p>
                    <p className="mt-1 text-xs text-white/68">{item.helper}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-[22px] border border-white/10 bg-black/10 p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/46">Grafico del condominio</p>
                <div className="mt-3">
                  <CondoBarsChart items={condoBars} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <div className={`${SURFACE} hover-glow-orange p-6 md:p-7 animate-soft-pop`}>
          <p className="text-[10px] uppercase tracking-[0.24em] font-black text-[var(--condome-orange)]">
            Datos base
          </p>
          <h2 className={SECTION_TITLE}>
            Informacion central
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {detailRows.map((row) => (
              <div key={row.label} className={`${SOFT_PANEL} p-5`}>
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--fg-tertiary)]">{row.label}</p>
                <p className="mt-2 text-sm font-bold text-[var(--fg-primary)] uppercase tracking-tight">{row.value}</p>
              </div>
            ))}
            <div className={`${SOFT_PANEL} p-5 sm:col-span-2`}>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--fg-tertiary)]">Direccion</p>
              <p className="mt-2 text-sm font-bold text-[var(--fg-primary)]">
                {condominio.direccion || "No registrada"}
              </p>
            </div>
          </div>
        </div>

        <div className={`${SURFACE} hover-glow-orange p-6 md:p-7 animate-soft-pop`}>
          <p className="text-[10px] uppercase tracking-[0.24em] font-black text-[var(--condome-orange)]">
            Siguientes movimientos
          </p>
          <h2 className={SECTION_TITLE}>
            Atajos de arranque
          </h2>
          <div className="mt-6 grid gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className="rounded-[22px] border border-[#E6D9CD] bg-[#FFF8F2] p-4 no-underline transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: `${action.color}16`, color: action.color }}
                  >
                    <ArrowIcon />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1F1A16]">{action.title}</p>
                    <p className="mt-1 text-sm leading-6 text-[#6D625A]">{action.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {editMode ? (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={(event) => event.target === event.currentTarget && setEditMode(false)}
        >
          <div
            className="bg-[#FFFCF8] rounded-[28px] w-full max-w-2xl p-6 md:p-7 relative border border-[#E6D9CD]"
            style={{ boxShadow: "0 24px 64px rgba(26,22,18,0.24)" }}
          >
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#B15A27]">Edicion</p>
                <h2
                  style={{ fontFamily: "'Playfair Display', serif" }}
                  className="mt-2 text-2xl font-semibold text-[#1F1A16]"
                >
                  Actualizar condominio
                </h2>
              </div>
              <button
                onClick={() => setEditMode(false)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[#6D625A] hover:bg-[#F4ECE4] transition-all cursor-pointer bg-transparent border-none text-lg"
              >
                ✕
              </button>
            </div>
            <EditForm
              condominio={condominio}
              onSave={(values) => actualizarCondominio(condominio.id, values)}
              onSuccess={() => setEditMode(false)}
              onCancel={() => setEditMode(false)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EditForm({ condominio, onSave, onSuccess, onCancel }) {
  const INPUT = "w-full px-4 py-3 bg-[var(--surface-0)] border border-[var(--border-standard)] rounded-xl text-[var(--fg-primary)] text-sm outline-none transition-all focus:border-[var(--condome-orange)] focus:bg-[var(--surface-2)] focus:ring-4 focus:ring-[var(--condome-orange)]/10 font-medium shadow-sm";
  const LABEL = "block text-[10px] font-bold tracking-[0.12em] uppercase text-[var(--fg-tertiary)] mb-1.5";

  const [form, setForm] = useState({ ...condominio });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm({ ...condominio });
  }, [condominio]);

  const handleChange = ({ target: { name, value } }) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await onSave(form);
      onSuccess?.(response?.data);
    } catch (saveError) {
      setError(saveError.message || "Error al actualizar el condominio");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error ? (
        <div className="px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className={LABEL}>Nombre</label>
          <input name="nombre" value={form.nombre || ""} onChange={handleChange} className={INPUT} />
        </div>
        <div className="md:col-span-2">
          <label className={LABEL}>Direccion</label>
          <input name="direccion" value={form.direccion || ""} onChange={handleChange} className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>Telefono</label>
          <input name="telefono" value={form.telefono || ""} onChange={handleChange} className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>Ciudad</label>
          <input name="ciudad" value={form.ciudad || ""} onChange={handleChange} className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>Email</label>
          <input name="email" value={form.email || ""} onChange={handleChange} className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>RNC</label>
          <input name="rnc" value={form.rnc || ""} onChange={handleChange} className={INPUT} />
        </div>
        <div className="md:col-span-2">
          <label className={LABEL}>Pais</label>
          <select name="pais" value={form.pais || "DO"} onChange={handleChange} className={INPUT}>
            {COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <button
          onClick={onCancel}
          className="flex-1 py-4 rounded-xl border border-[var(--border-standard)] text-[var(--fg-tertiary)] text-xs font-black uppercase tracking-widest cursor-pointer bg-transparent hover:bg-[var(--surface-0)] transition-all"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex-1 py-4 rounded-xl text-white text-xs font-black uppercase tracking-widest cursor-pointer border-none disabled:opacity-50 shadow-lg"
          style={{ background: "linear-gradient(135deg, var(--condome-orange-soft), var(--condome-orange))" }}
        >
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

function CondoBarsChart({ items }) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="flex items-end gap-4 h-32">
      {items.map((item) => (
        <div key={item.label} className="flex flex-1 flex-col items-center gap-3">
          <div className="flex h-24 w-full items-end rounded-[18px] bg-white/5 px-2 py-2">
            <div
              className="w-full rounded-[14px] transition-all duration-700"
              style={{
                height: `${Math.max((item.value / maxValue) * 100, item.value ? 18 : 0)}%`,
                background: `linear-gradient(180deg, #FFB184, ${item.color})`,
                boxShadow: `0 12px 24px ${item.color}33`,
              }}
            />
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/46">{item.label}</p>
            <p className="mt-1 text-sm font-semibold text-white">{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
