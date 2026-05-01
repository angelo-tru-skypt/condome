import { useState } from "react";
import { useCondominio } from "../context/CondominioContext";

const INPUT = "w-full px-4 py-3 bg-[var(--surface-0)] border border-[var(--border-standard)] rounded-xl text-[var(--fg-primary)] text-sm outline-none transition-all focus:border-[var(--condome-orange)] focus:bg-[var(--surface-2)] focus:ring-4 focus:ring-[var(--condome-orange)]/10 font-medium shadow-sm";
const LABEL = "block text-[10px] font-bold tracking-[0.12em] uppercase text-[var(--fg-tertiary)] mb-1.5";
const SURFACE = "bg-[var(--surface-1)] border border-[var(--border-standard)] rounded-[28px] shadow-[var(--shadow-card)]";

export default function EdificiosPage() {
  const { condominio, edificios, crearEdificio, actualizarEdificio, eliminarEdificio, hasCondominio } = useCondominio();
  const [nombre, setNombre] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editItem, setEditItem] = useState(null);
  const [editNombre, setEditNombre] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

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

  const handleEdit = (ed) => {
    setEditItem(ed);
    setEditNombre(ed.nombre);
  };

  const handleEditSave = async () => {
    if (!editNombre.trim()) return;
    setSaving(true);
    setError("");
    try {
      await actualizarEdificio(editItem.id, { nombre: editNombre });
      setEditItem(null);
      setEditNombre("");
    } catch (err) {
      setError(err.message || "No se pudo actualizar el edificio");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ed) => {
    setSaving(true);
    setError("");
    try {
      await eliminarEdificio(ed.id);
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.message || "No se pudo eliminar el edificio");
    } finally {
      setSaving(false);
    }
  };

  if (!hasCondominio) {
    return (
      <div className={`${SURFACE} p-12 text-center`}>
        <div className="w-20 h-20 bg-[var(--signal-orange-fog)] rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-sm">🏠</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-2xl font-bold text-[var(--fg-primary)]">
          Condominio no registrado
        </h1>
        <p className="mt-4 text-sm leading-8 text-[var(--fg-secondary)] font-medium max-w-sm mx-auto">
          Para crear edificios primero debes completar el registro base de tu condominio.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="grid gap-4 sm:gap-6 xl:grid-cols-[340px_1fr] 2xl:grid-cols-[400px_1fr]">
        <div className={`${SURFACE} p-4 sm:p-6 md:p-7`}>
          <p className="text-[9px] sm:text-[10px] md:text-[11px] uppercase tracking-[0.18em] sm:tracking-[0.22em] font-bold text-[var(--condome-orange)]">Estructura</p>
          <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="mt-1.5 sm:mt-2 text-[1.25rem] sm:text-[1.5rem] md:text-2xl font-bold text-[var(--fg-primary)]">
            Crear Edificio
          </h1>
          <p className="mt-2 sm:mt-3 text-xs sm:text-sm leading-6 sm:leading-7 text-[var(--fg-secondary)] font-medium">
            Registra torres, bloques o secciones independientes del condominio {condominio?.nombre}.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 sm:mt-8 space-y-4 sm:space-y-6">
            {error && (
              <div className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs sm:text-sm font-bold">
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
              className="w-full py-2.5 sm:py-3 md:py-3.5 rounded-xl text-white text-xs sm:text-sm font-bold tracking-wide transition-all border-none cursor-pointer disabled:opacity-50 shadow-md"
              style={{ background: "linear-gradient(135deg, #FF7A30, #D94F10)" }}
            >
              {saving ? "Registrando..." : "Registrar edificio"}
            </button>
          </form>
        </div>

        <div className={`${SURFACE} overflow-hidden`}>
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-[var(--border-standard)] bg-[var(--surface-0)] flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-sm sm:text-lg font-bold text-[var(--fg-primary)]">Torres y edificios registrados</h2>
            <span className="px-2.5 sm:px-3 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--border-standard)] text-[9px] sm:text-[10px] font-bold text-[var(--condome-orange)] uppercase tracking-wider">
              {edificios.length} registros
            </span>
          </div>
          <div className="p-4 sm:p-6 md:p-7">
            {!edificios.length ? (
              <div className="py-12 sm:py-20 text-center opacity-60">
                <div className="text-4xl sm:text-5xl mb-3 sm:mb-4 text-[var(--fg-muted)]">🏗️</div>
                <p className="text-xs sm:text-sm font-bold text-[var(--fg-tertiary)]">Aun no has creado ningun edificio para este condominio</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {edificios.map((ed) => (
                  <div key={ed.id} className="group p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-[var(--surface-2)] border border-[var(--border-standard)] hover:border-[var(--condome-orange)] hover:shadow-md transition-all">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[var(--surface-0)] group-hover:bg-[var(--signal-orange-fog)] flex items-center justify-center text-lg sm:text-xl mb-3 sm:mb-4 transition-colors">
                      🏢
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-[var(--fg-primary)] group-hover:text-[var(--condome-orange)] transition-colors">{ed.nombre}</h3>
                    <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-[var(--fg-tertiary)] font-medium">ID: #{ed.id.toString().padStart(4, '0')}</p>
                    <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-[var(--border-standard)] flex items-center justify-between gap-2">
                      <span className="text-[9px] sm:text-[10px] font-bold text-[var(--fg-tertiary)] uppercase tracking-wider">Activo</span>
                      <div className="flex gap-1.5 sm:gap-2">
                        <button
                          onClick={() => handleEdit(ed)}
                          className="text-[9px] sm:text-[10px] font-bold text-[var(--condome-orange)] bg-[var(--signal-orange-fog)] border border-[var(--control-border-strong)] rounded-lg px-2.5 sm:px-3 py-1 sm:py-1.5 cursor-pointer hover:bg-[rgba(217,79,16,0.18)] transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(ed)}
                          className="text-[9px] sm:text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 rounded-lg px-2.5 sm:px-3 py-1 sm:py-1.5 cursor-pointer hover:bg-red-100 transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Modal Editar Edificio */}
      {editItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md" onClick={() => setEditItem(null)}>
          <div className="bg-[var(--surface-1)] rounded-[28px] w-full max-w-md p-8 relative border border-[var(--border-standard)] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setEditItem(null)} className="absolute right-6 top-6 text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] border-none bg-transparent cursor-pointer text-xl">✕</button>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--condome-orange)] mb-2">Editar</p>
            <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-2xl font-bold text-[var(--fg-primary)] mb-6">
              {editItem.nombre}
            </h2>
            <div className="space-y-4">
              <div>
                <label className={LABEL}>Nombre del edificio *</label>
                <input value={editNombre} onChange={(e) => setEditNombre(e.target.value)} className={INPUT} />
              </div>
              <button
                onClick={handleEditSave}
                disabled={saving || !editNombre.trim()}
                className="w-full py-3.5 rounded-xl text-white text-sm font-bold tracking-wide transition-all border-none cursor-pointer disabled:opacity-50 shadow-md"
                style={{ background: "linear-gradient(135deg, #FF7A30, #D94F10)" }}
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminar */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-[var(--surface-1)] rounded-[28px] w-full max-w-sm p-8 text-center relative border border-[var(--border-standard)] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-5 text-2xl border border-red-500/20">🗑️</div>
            <h2 className="text-xl font-bold text-[var(--fg-primary)] mb-2">Eliminar edificio</h2>
            <p className="text-sm text-[var(--fg-secondary)] font-medium mb-6">
              ¿Estas seguro de eliminar <strong>{deleteConfirm.nombre}</strong>? Esta accion no se puede deshacer y eliminara todos los apartamentos y residentes asociados.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 rounded-xl border border-[var(--border-standard)] bg-[var(--surface-0)] text-sm font-bold text-[var(--fg-secondary)] cursor-pointer hover:bg-[var(--surface-2)] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={saving}
                className="flex-1 py-3 rounded-xl border-none bg-red-500 text-white text-sm font-bold cursor-pointer hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {saving ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
