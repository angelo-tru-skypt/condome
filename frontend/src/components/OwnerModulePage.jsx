import { Link } from "react-router-dom";
import { OWNER_MODULES } from "../data/ownerModules";

const SURFACE = "bg-[#1A1A1A] border border-[#262626] rounded-[28px]";

export default function OwnerModulePage({ moduleKey }) {
  const module = OWNER_MODULES[moduleKey];

  if (!module) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className={`${SURFACE} max-w-xl p-8 text-center`}>
          <p className="text-sm font-semibold text-[#E5E5E5]">Modulo no disponible</p>
          <p className="text-sm text-[#737373] mt-2">
            Esta vista todavia no tiene configuracion de interfaz.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section
        className="rounded-[32px] overflow-hidden border border-[#E9D5C6]"
        style={{
          background:
            "linear-gradient(135deg, #1A1612 0%, #2A221D 44%, #4A2A1A 100%)",
          boxShadow: "0 18px 50px rgba(26,22,18,0.14)",
        }}
      >
        <div className="px-7 py-8 md:px-10 md:py-9 relative">
          <div
            className="absolute inset-y-0 right-0 w-1/2 opacity-25 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at 75% 30%, rgba(255,122,48,0.95) 0, rgba(255,122,48,0) 58%)",
            }}
          />
          <div className="relative z-10 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] font-semibold text-[#F5D2BC]">
                {module.eyebrow}
              </p>
              <h1
                className="mt-3 text-3xl md:text-4xl text-white font-semibold"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {module.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm md:text-[15px] leading-7 text-white/72">
                {module.description}
              </p>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#F1E7DE]">
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
              <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#F5D2BC]">
                Resultado esperado
              </p>
              <div className="mt-4 space-y-3">
                {module.indicators.map((indicator) => (
                  <div
                    key={indicator}
                    className="rounded-2xl border border-[#262626] bg-black/10 px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-white">{indicator}</p>
                    <p className="text-xs text-white/58 mt-1">
                      Interfaz preparada para seguimiento y operacion del propietario.
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
              <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#B15A27]">
                Flujo de trabajo
              </p>
              <h2 className="mt-2 text-xl font-semibold text-[#E5E5E5]">
                Lo que debe poder hacer el propietario
              </h2>
            </div>
            <span className="px-3 py-1.5 rounded-full bg-[#FFF0E7] text-[#B14F12] text-xs font-semibold">
              Interfaz lista para evolucionar a CRUD
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {module.workflows.map((item, index) => (
              <div
                key={item}
                className="grid gap-4 rounded-[22px] border border-[#EFE6DE] bg-[#141414] p-4 md:grid-cols-[56px_1fr]"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#1A1612] text-white flex items-center justify-center text-lg font-semibold">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className="flex items-center">
                  <p className="text-sm leading-7 text-[#A3A3A3]">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className={`${SURFACE} p-6`}>
            <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#A3A3A3]">
              Rutas relacionadas
            </p>
            <div className="mt-4 space-y-3">
              {module.related.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="block rounded-2xl border border-[#EFE6DE] px-4 py-3 no-underline transition-all hover:border-[#D94F10]/30 hover:bg-[#FFF6F0]"
                >
                  <p className="text-sm font-semibold text-[#E5E5E5]">{item.label}</p>
                  <p className="text-xs text-[#737373] mt-1">
                    Navega entre modulos conectados al trabajo del propietario.
                  </p>
                </Link>
              ))}
            </div>
          </div>

          <div className={`${SURFACE} p-6`}>
            <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#A3A3A3]">
              Vista recomendada
            </p>
            <div className="mt-4 rounded-[24px] border border-dashed border-[#E4D9D0] bg-[#141414] p-5">
              <div className="grid gap-3">
                <div className="rounded-2xl bg-[#1A1A1A] border border-[#262626] p-4">
                  <p className="text-sm font-semibold text-[#E5E5E5]">Resumen superior</p>
                  <p className="text-xs text-[#737373] mt-1">
                    KPIs, filtros y acciones principales del modulo.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-[#1A1A1A] border border-[#262626] p-4">
                    <p className="text-sm font-semibold text-[#E5E5E5]">Listado principal</p>
                    <p className="text-xs text-[#737373] mt-1">
                      Tabla, tarjetas o agenda segun el caso.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#1A1A1A] border border-[#262626] p-4">
                    <p className="text-sm font-semibold text-[#E5E5E5]">Panel lateral</p>
                    <p className="text-xs text-[#737373] mt-1">
                      Filtros, detalle o seguimiento rapido.
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl bg-[#1A1A1A] border border-[#262626] p-4">
                  <p className="text-sm font-semibold text-[#E5E5E5]">Historial y trazabilidad</p>
                  <p className="text-xs text-[#737373] mt-1">
                    Bitacora, cambios recientes y acciones relacionadas.
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
