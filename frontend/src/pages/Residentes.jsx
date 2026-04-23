import { useState } from "react";
import { Link } from "react-router-dom";
import { useCondominio } from "../context/CondominioContext";

// ── Estilos reutilizables (Modo Claro) ───────────────────────────────────────
const INPUT = "w-full px-4 py-3 bg-[var(--surface-0)] border border-[var(--border-standard)] rounded-xl text-[var(--fg-primary)] text-sm outline-none transition-all focus:border-[var(--condome-orange)] focus:bg-[var(--surface-2)] focus:ring-4 focus:ring-[var(--condome-orange)]/10 font-medium shadow-sm";
const LABEL = "block text-[10px] font-bold tracking-[0.12em] uppercase text-[var(--fg-tertiary)] mb-1.5";
const SURFACE = "rounded-[24px] border border-[var(--border-standard)] bg-[var(--surface-1)] shadow-[var(--shadow-card)]";

export default function ResidentesPage() {
  const { condominio, residentes, actualizarResidente, eliminarResidente, hasCondominio } = useCondominio();
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleEditOpen = (item) => {
    setEditItem(item);
    setEditForm({
      nombre: item.nombre || "",
      apellido: item.apellido || "",
      email: item.email || "",
      telefono: item.telefono || "",
      activo: item.activo !== undefined ? item.activo : true,
    });
  };

  const handleEditSave = async () => {
    if (!editForm.nombre.trim() || !editForm.apellido.trim()) return;
    setSaving(true);
    setError("");
    try {
      await actualizarResidente(editItem.id, editForm);
      setEditItem(null);
    } catch (err) {
      setError(err.message || "No se pudo actualizar el residente");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    setSaving(true);
    setError("");
    try {
      await eliminarResidente(item.id);
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.message || "No se pudo eliminar el residente");
    } finally {
      setSaving(false);
    }
  };

  if (!hasCondominio) {
    return (
      <div className={`${SURFACE} p-12 text-center`}>
         <div className="w-20 h-20 bg-[#FFF4EE] rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-sm">👥</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-2xl font-bold text-[#1A1A1A]">
          Primero registra tu condominio
        </h1>
        <p className="mt-4 text-sm leading-8 text-[#404040] font-medium max-w-sm mx-auto">
          El módulo de residentes se activa cuando ya existe un condominio base registrado en la plataforma.
        </p>
        <Link
          to="/condominio"
          className="inline-flex mt-8 px-10 py-4 rounded-2xl no-underline text-white font-black uppercase tracking-widest text-xs shadow-xl"
          style={{ background: "linear-gradient(135deg, var(--condome-orange-soft), var(--condome-orange))" }}
        >
          Ir a Registro
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className={`${SURFACE} p-6 md:p-8`}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] font-bold text-[#D94F10]">
              Comunidad
            </p>
            <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="mt-2 text-2xl font-bold text-[#1A1A1A]">
              Residentes del condominio
            </h1>
            <p className="mt-2 text-sm leading-7 text-[#404040] font-medium max-w-2xl">
              Los residentes se registran desde cada apartamento. Aquí ves el listado consolidado de <strong>{condominio?.nombre}</strong>.
            </p>
          </div>
          <Link
            to="/apartamentos"
            className="px-8 py-4 rounded-2xl no-underline text-white text-[11px] font-black uppercase tracking-widest shadow-lg"
            style={{ background: "linear-gradient(135deg, var(--condome-orange-soft), var(--condome-orange))" }}
          >
            Registrar desde apartamentos
          </Link>
        </div>
      </section>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-bold">
          {error}
        </div>
      )}

      <section className={`${SURFACE} p-6 md:p-8`}>
        <div className="flex items-center justify-between gap-4 flex-wrap mb-7">
          <h2 className="text-xl font-bold text-[#1A1A1A]">Listado consolidado</h2>
          <span className="px-4 py-1.5 rounded-full bg-[#FAF9F7] border border-[#E8DDD3] text-[#D94F10] text-[11px] font-bold uppercase tracking-wider">
            {residentes.length} residentes activos
          </span>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {residentes.length > 0 ? (
            residentes.map((item) => (
              <article key={item.id} className={`${SURFACE} p-7 group transition-all hover:translate-y-[-4px]`}>
                <div className="flex items-start justify-between gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--canvas)] flex items-center justify-center text-xl group-hover:bg-[var(--condome-orange)]/10 transition-colors">
                    👤
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${item.activo ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-gray-50 text-gray-500 border border-gray-100"}`}>
                    {item.activo ? "Activo" : "Inactivo"}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-[var(--fg-primary)] group-hover:text-[var(--condome-orange)] transition-colors">{item.nombre_completo}</h3>
                <p className="mt-1 text-xs font-black text-[var(--condome-orange-soft)] uppercase tracking-[0.1em]">{item.apartamento_nombre}</p>

                <div className="mt-6 space-y-4">
                  <MiniData label="Edificio" value={item.edificio_nombre} />
                  <MiniData label="Correo" value={item.email || "Sin correo"} />
                  <MiniData label="Teléfono" value={item.telefono || "Sin teléfono"} />
                </div>
                
                <div className="mt-8 pt-6 border-t border-[var(--border-standard)] flex items-center justify-between gap-2">
                   <div className="flex flex-col">
                      <span className="text-[9px] font-black text-[var(--fg-muted)] uppercase tracking-widest">Acceso</span>
                      <span className="text-[12px] font-bold text-[var(--fg-secondary)]">{item.login || "Pendiente"}</span>
                   </div>
                   <div className="flex gap-2">
                     <button
                       onClick={() => handleEditOpen(item)}
                       className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
                     >
                       Editar
                     </button>
                     <button
                       onClick={() => setDeleteConfirm(item)}
                       className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 border border-red-200 cursor-pointer hover:bg-red-100 transition-colors"
                     >
                       Eliminar
                     </button>
                   </div>
                </div>
              </article>
            ))
          ) : (
            <div className="md:col-span-2 xl:col-span-3 rounded-[24px] border border-dashed border-[#E8DDD3] bg-[#FAF9F7] p-12 text-center">
              <div className="text-4xl mb-4">📭</div>
              <h3 className="text-lg font-bold text-[#1A1A1A]">No hay residentes todavía</h3>
              <p className="mt-3 text-sm leading-7 text-[#404040] font-medium max-w-sm mx-auto">
                Registra el primer residente desde el módulo de apartamentos para que aparezca en este listado global.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Modal Editar Residente */}
      {editItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md" onClick={() => setEditItem(null)}>
          <div className="bg-[var(--surface-1)] rounded-[32px] w-full max-w-lg p-9 relative border border-[var(--border-standard)] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setEditItem(null)} className="absolute right-6 top-6 text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] border-none bg-transparent cursor-pointer text-xl">✕</button>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--condome-orange)] mb-2">Editar residente</p>
            <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-2xl font-bold text-[var(--fg-primary)] mb-6">
              {editItem.nombre_completo}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Nombre *</label>
                  <input value={editForm.nombre} onChange={(e) => setEditForm((f) => ({ ...f, nombre: e.target.value }))} className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>Apellido *</label>
                  <input value={editForm.apellido} onChange={(e) => setEditForm((f) => ({ ...f, apellido: e.target.value }))} className={INPUT} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Email</label>
                  <input type="email" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>Telefono</label>
                  <input value={editForm.telefono} onChange={(e) => setEditForm((f) => ({ ...f, telefono: e.target.value }))} className={INPUT} />
                </div>
              </div>
              <div>
                <label className={LABEL}>Estado</label>
                <select value={editForm.activo ? "true" : "false"} onChange={(e) => setEditForm((f) => ({ ...f, activo: e.target.value === "true" }))} className={INPUT}>
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </div>
              <button
                onClick={handleEditSave}
                disabled={saving}
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
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5 text-2xl border border-red-100">🗑️</div>
            <h2 className="text-xl font-bold text-[var(--fg-primary)] mb-2">Eliminar residente</h2>
            <p className="text-sm text-[var(--fg-secondary)] font-medium mb-6">
              ¿Estas seguro de eliminar a <strong>{deleteConfirm.nombre_completo}</strong>? Se desactivara su cuenta de acceso al portal.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 rounded-xl border border-[var(--border-standard)] bg-[var(--surface-0)] text-sm font-bold text-[var(--fg-secondary)] cursor-pointer hover:bg-[var(--canvas)] transition-colors">Cancelar</button>
              <button onClick={() => handleDelete(deleteConfirm)} disabled={saving} className="flex-1 py-3 rounded-xl border-none bg-red-500 text-white text-sm font-bold cursor-pointer hover:bg-red-600 disabled:opacity-50 transition-colors">
                {saving ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniData({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 border-b border-[#E8DDD3]/30 last:border-0">
      <span className="text-[10px] font-bold tracking-wider uppercase text-[#737373]">{label}</span>
      <span className="text-xs font-bold text-[#1A1A1A] text-right truncate max-w-[60%]">{value}</span>
    </div>
  );
}
