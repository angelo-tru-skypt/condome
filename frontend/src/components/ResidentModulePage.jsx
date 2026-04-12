import { Link } from "react-router-dom";
import { RESIDENT_MODULES } from "../data/residentModules";

const SURFACE = "bg-[#1A1A1A] border border-[#DCE7E7] rounded-[28px]";

export default function ResidentModulePage({ moduleKey }) {
  const module = RESIDENT_MODULES[moduleKey];

  if (!module) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className={`${SURFACE} max-w-xl p-8 text-center`}>
          <p className="text-sm font-semibold text-[#E5E5E5]">Modulo no disponible</p>
          <p className="text-sm text-[#6F7B7B] mt-2">
            Esta vista todavia no tiene configuracion para el residente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section
        className="rounded-[32px] overflow-hidden border border-[#CFE3E3]"
        style={{
          background:
            "linear-gradient(135deg, #0E2433 0%, #143349 46%, #1A6B9A 100%)",
          boxShadow: "0 18px 50px rgba(14,36,51,0.16)",
        }}
      >
        <div className="px-7 py-8 md:px-10 md:py-9 relative">
          <div
            className="absolute inset-y-0 right-0 w-1/2 opacity-25 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at 75% 30%, rgba(102,226,212,0.9) 0, rgba(102,226,212,0) 58%)",
            }}
          />
          <div className="relative z-10 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] font-semibold text-[#BCECEA]">
                {module.eyebrow}
              </p>
              <h1
                className="mt-3 text-3xl md:text-4xl text-white font-semibold"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {module.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm md:text-[15px] leading-7 text-white/78">
                {module.description}
              </p>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#E7F7F6]">
                {module.summary}
              </p>

              <div className="mt-6 flex flex-wrap gap-2.5">
                {module.actions.map((action) => (
                  <span
                    key={action}
                    className="px-4 py-2 rounded-full text-[12px] font-medium text-white border border-[#262626] bg-[#333333]"
                  >
                    {action}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] bg-[#333333] border border-[#262626] backdrop-blur-sm p-5">
              <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#BCECEA]">
                Resultado esperado
              </p>
              <div className="mt-4 space-y-3">
                {module.indicators.map((indicator) => (
                  <div
                    key={indicator}
                    className="rounded-2xl border border-[#262626] bg-black/10 px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-white">{indicator}</p>
                    <p className="text-xs text-white/60 mt-1">
                      Interfaz preparada para una experiencia simple y accionable del residente.
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
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#1A6B9A]">
                Flujo del residente
              </p>
              <h2 className="mt-2 text-xl font-semibold text-[#E5E5E5]">
                Lo que debe poder resolver desde esta vista
              </h2>
            </div>
            <span className="px-3 py-1.5 rounded-full bg-[#EAF7F6] text-[#16616B] text-xs font-semibold">
              Lista para conectarse con backend
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {module.workflows.map((item, index) => (
              <div
                key={item}
                className="grid gap-4 rounded-[22px] border border-[#262626] bg-[#141414] p-4 md:grid-cols-[56px_1fr]"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#0E2433] text-white flex items-center justify-center text-lg font-semibold">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className="flex items-center">
                  <p className="text-sm leading-7 text-[#33403F]">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className={`${SURFACE} p-6`}>
            <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#6F7B7B]">
              Rutas relacionadas
            </p>
            <div className="mt-4 space-y-3">
              {module.related.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="block rounded-2xl border border-[#262626] px-4 py-3 no-underline transition-all hover:border-[#1A6B9A]/30 hover:bg-[#F1FAFA]"
                >
                  <p className="text-sm font-semibold text-[#E5E5E5]">{item.label}</p>
                  <p className="text-xs text-[#6F7B7B] mt-1">
                    Navega entre gestiones conectadas a la experiencia del residente.
                  </p>
                </Link>
              ))}
            </div>
          </div>

          <div className={`${SURFACE} p-6`}>
            <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#6F7B7B]">
              Vista recomendada
            </p>
            <div className="mt-4 rounded-[24px] border border-dashed border-[#D6E4E4] bg-[#F7FBFB] p-5">
              <div className="grid gap-3">
                <div className="rounded-2xl bg-[#1A1A1A] border border-[#262626] p-4">
                  <p className="text-sm font-semibold text-[#E5E5E5]">Resumen personal</p>
                  <p className="text-xs text-[#6F7B7B] mt-1">
                    Estado de la gestion, acciones rapidas y alertas utiles.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-[#1A1A1A] border border-[#262626] p-4">
                    <p className="text-sm font-semibold text-[#E5E5E5]">Formulario guiado</p>
                    <p className="text-xs text-[#6F7B7B] mt-1">
                      Solicitudes simples con pocos pasos y contexto claro.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#1A1A1A] border border-[#262626] p-4">
                    <p className="text-sm font-semibold text-[#E5E5E5]">Seguimiento</p>
                    <p className="text-xs text-[#6F7B7B] mt-1">
                      Estado, historial y respuesta visible para el residente.
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl bg-[#1A1A1A] border border-[#262626] p-4">
                  <p className="text-sm font-semibold text-[#E5E5E5]">Soporte y evidencia</p>
                  <p className="text-xs text-[#6F7B7B] mt-1">
                    Comprobantes, archivos y mensajes ordenados en una sola vista.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
