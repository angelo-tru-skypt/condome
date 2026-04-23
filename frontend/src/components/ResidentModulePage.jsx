import { Link } from "react-router-dom";
import { RESIDENT_MODULES } from "../data/residentModules";

const SURFACE = "rounded-[28px] border border-[var(--border-standard)] bg-[var(--surface-1)] shadow-[var(--shadow-card)]";
const SOFT = "rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-3)]";

export default function ResidentModulePage({ moduleKey }) {
  const module = RESIDENT_MODULES[moduleKey];

  if (!module) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className={`${SURFACE} max-w-xl p-8 text-center`}>
          <p className="text-sm font-semibold text-[var(--fg-primary)]">Modulo no disponible</p>
          <p className="mt-2 text-sm leading-7 text-[var(--fg-secondary)]">
            Esta vista todavia no tiene una interfaz configurada para el residente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section
        className="overflow-hidden rounded-[34px] border border-[rgba(30,26,23,0.08)]"
        style={{
          background: "linear-gradient(145deg, #121110 0%, #241B16 46%, #121110 100%)",
          boxShadow: "0 24px 60px rgba(18,17,16,0.18)",
        }}
      >
        <div className="relative px-7 py-8 md:px-10 md:py-10">
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-30"
            style={{ background: "radial-gradient(circle at 75% 30%, rgba(255,122,48,0.88) 0, rgba(255,122,48,0) 60%)" }}
          />

          <div className="relative z-10 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#FFB184]">{module.eyebrow}</p>
              <h1 className="mt-3 text-3xl font-semibold text-white md:text-4xl" style={{ fontFamily: "'Playfair Display', serif" }}>
                {module.title}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/74 md:text-[15px]">{module.description}</p>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/66">{module.summary}</p>

              <div className="mt-6 flex flex-wrap gap-2.5">
                {module.actions.map((action) => (
                  <span
                    key={action}
                    className="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-[12px] font-medium text-white"
                  >
                    {action}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-[26px] border border-white/10 bg-white/8 p-5 backdrop-blur-md">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#FFB184]">Resultado esperado</p>
              <div className="mt-4 space-y-3">
                {module.indicators.map((indicator) => (
                  <div key={indicator} className="rounded-[20px] border border-white/10 bg-black/10 px-4 py-3">
                    <p className="text-sm font-semibold text-white">{indicator}</p>
                    <p className="mt-1 text-xs leading-6 text-white/58">
                      Una experiencia simple, clara y accionable para el residente.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <div className={`${SURFACE} p-6 md:p-7`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--condome-orange)]">Flujo del residente</p>
              <h2 className="mt-2 text-xl font-semibold text-[var(--fg-primary)]">Lo que debe poder resolver desde esta vista</h2>
            </div>
            <span className="rounded-full bg-[rgba(217,79,16,0.1)] px-3 py-1.5 text-xs font-semibold text-[var(--condome-orange)]">
              Menos friccion, mas claridad
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {module.workflows.map((item, index) => (
              <div key={item} className={`${SOFT} grid gap-4 p-4 md:grid-cols-[56px_1fr]`}>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#FF7A30,#D94F10)] text-lg font-semibold text-white shadow-[0_12px_24px_rgba(217,79,16,0.18)]">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className="flex items-center">
                  <p className="text-sm leading-7 text-[var(--fg-secondary)]">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className={`${SURFACE} p-6`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--fg-tertiary)]">Rutas relacionadas</p>
            <div className="mt-4 space-y-3">
              {module.related.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="block rounded-[22px] border border-[var(--border-standard)] bg-white px-4 py-3 text-inherit no-underline transition-all hover:border-[var(--control-border-strong)] hover:shadow-[var(--shadow-whisper)]"
                >
                  <p className="text-sm font-semibold text-[var(--fg-primary)]">{item.label}</p>
                  <p className="mt-1 text-xs leading-6 text-[var(--fg-secondary)]">
                    Navega entre gestiones conectadas a la experiencia del residente.
                  </p>
                </Link>
              ))}
            </div>
          </div>

          <div className={`${SURFACE} p-6`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--fg-tertiary)]">Vista sugerida</p>
            <div className="mt-4 rounded-[24px] border border-dashed border-[var(--border-emphasis)] bg-[var(--surface-3)] p-5">
              <div className="grid gap-3">
                {[
                  ["Resumen personal", "Estado de la gestion, acciones rapidas y alertas utiles."],
                  ["Formulario guiado", "Solicitudes simples con pasos cortos y contexto claro."],
                  ["Seguimiento visible", "Estado, historial y respuesta sin salir del mismo flujo."],
                ].map(([title, copy]) => (
                  <div key={title} className="rounded-[20px] border border-[var(--border-standard)] bg-white p-4">
                    <p className="text-sm font-semibold text-[var(--fg-primary)]">{title}</p>
                    <p className="mt-1 text-xs leading-6 text-[var(--fg-secondary)]">{copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
