import { useState } from "react";
import { useCondominio } from "../context/CondominioContext";

// ── Estilos reutilizables (Modo Claro) ───────────────────────────────────────
const INPUT = "w-full px-4 py-3 bg-[#FFFFFF] border border-[#E8DDD3] rounded-xl text-[#1A1A1A] text-sm outline-none transition-all focus:border-[#D94F10] focus:bg-[#FAF9F7] focus:ring-4 focus:ring-[#D94F10]/10 font-medium shadow-sm";
const LABEL = "block text-[10px] font-bold tracking-[0.12em] uppercase text-[#B15A27] mb-1.5";
const SURFACE = "bg-[#FFFFFF] border border-[#E8DDD3] rounded-[28px] shadow-sm";

export default function EdificiosPage() {
  const { condominio, edificios, crearEdificio, hasCondominio } = useCondominio();
  const [nombre, setNombre] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await crearEdificio({ nombre });
      setNombre("");
    } catch (err) {
      setError(err.message || "No se pudo crear el edificio");
    } finally {
      setSaving(false);
    }
  };

  if (!hasCondominio) {
    return (
      <div className={`${SURFACE} p-12 text-center`}>
        <div className="w-20 h-20 bg-[#FFF4EE] rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-sm">🏠</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-2xl font-bold text-[#1A1A1A]">
          Condominio no registrado
        </h1>
        <p className="mt-4 text-sm leading-8 text-[#404040] font-medium max-w-sm mx-auto">
          Para crear edificios primero debes completar el registro base de tu condominio.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[400px_1fr]">
        <div className={`${SURFACE} p-7`}>
          <p className="text-[11px] uppercase tracking-[0.22em] font-bold text-[#D94F10]">Estructura</p>
          <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="mt-2 text-2xl font-bold text-[#1A1A1A]">
            Crear Edificio
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#404040] font-medium">
            Registra torres, bloques o secciones independientes del condominio {condominio?.nombre}.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-bold">
                {error}
              </div>
            )}
            <div>
              <label className={LABEL}>Nombre del edificio / torre *</label>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className={INPUT}
                placeholder="Ej: Torre A, Bloque Sur..."
              />
            </div>
            <button
              disabled={saving}
              className="w-full py-3.5 rounded-xl text-white text-sm font-bold tracking-wide transition-all border-none cursor-pointer disabled:opacity-50 shadow-md"
              style={{ background: "linear-gradient(135deg, #FF7A30, #D94F10)" }}
            >
              {saving ? "Registrando..." : "Registrar edificio"}
            </button>
          </form>
        </div>

        <div className={`${SURFACE} overflow-hidden`}>
          <div className="px-7 py-5 border-b border-[#E8DDD3] bg-[#FAF9F7] flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#1A1A1A]">Torres y edificios registrados</h2>
            <span className="px-3 py-1 rounded-full bg-white border border-[#E8DDD3] text-[10px] font-bold text-[#D94F10] uppercase tracking-wider">
              {edificios.length} registros
            </span>
          </div>
          <div className="p-7">
            {!edificios.length ? (
              <div className="py-20 text-center opacity-60">
                <div className="text-5xl mb-4 text-[#E8DDD3]">🏗️</div>
                <p className="text-sm font-bold text-[#737373]">Aun no has creado ningun edificio para este condominio</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {edificios.map((ed) => (
                  <div key={ed.id} className="group p-5 rounded-2xl bg-white border border-[#E8DDD3] hover:border-[#D94F10] hover:shadow-md transition-all">
                    <div className="w-10 h-10 rounded-xl bg-[#FAF9F7] group-hover:bg-[#FFF4EE] flex items-center justify-center text-xl mb-4 transition-colors">
                      🏢
                    </div>
                    <h3 className="text-sm font-bold text-[#1A1A1A] group-hover:text-[#D94F10] transition-colors">{ed.nombre}</h3>
                    <p className="mt-2 text-[11px] text-[#737373] font-medium">ID: #{ed.id.toString().padStart(4, '0')}</p>
                    <div className="mt-5 pt-4 border-t border-[#FAF9F7] flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#B15A27] uppercase tracking-wider">Activo</span>
                      <button className="text-[10px] font-bold text-[#D94F10] bg-transparent border-none cursor-pointer hover:underline">Ver unidades →</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
