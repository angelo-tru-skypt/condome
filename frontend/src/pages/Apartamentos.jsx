import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCondominio } from "../context/CondominioContext";

// ── Estilos reutilizables (Modo Claro) ───────────────────────────────────────
const INPUT = "w-full px-4 py-3 bg-[var(--surface-0)] border border-[var(--border-standard)] rounded-xl text-[var(--fg-primary)] text-sm outline-none transition-all focus:border-[var(--condome-orange)] focus:bg-[var(--surface-2)] focus:ring-4 focus:ring-[var(--condome-orange)]/10 font-medium shadow-sm";
const LABEL = "block text-[10px] font-bold tracking-[0.12em] uppercase text-[var(--fg-tertiary)] mb-1.5";
const SURFACE = "rounded-[24px] border border-[var(--border-standard)] bg-[var(--surface-1)] shadow-[var(--shadow-card)]";
const INK_CARD = "rounded-[22px] border border-[#1A1612]/10 bg-[#1A1612] text-white p-6 shadow-2xl";

export default function ApartamentosPage() {
  const {
    condominio,
    edificios,
    apartamentos,
    crearApartamento,
    actualizarApartamento,
    eliminarApartamento,
    crearResidente,
    hasCondominio,
  } = useCondominio();

  const [form, setForm] = useState({
    nombre: "",
    edificio_id: "",
    piso: "",
    tipo_unidad: "apartamento",
    metraje: "",
    estado: "disponible",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedApartment, setSelectedApartment] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const resumen = useMemo(() => {
    const disponibles = apartamentos.filter((item) => item.estado === "disponible").length;
    const ocupados = apartamentos.filter((item) => item.estado === "ocupado").length;
    return { total: apartamentos.length, disponibles, ocupados };
  }, [apartamentos]);

  const handleChange = ({ target: { name, value } }) => {
    setForm((current) => ({ ...current, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await crearApartamento({
        ...form,
        edificio_id: Number(form.edificio_id),
        metraje: Number(form.metraje || 0),
      });
      setForm({
        nombre: "",
        edificio_id: "",
        piso: "",
        tipo_unidad: "apartamento",
        metraje: "",
        estado: "disponible",
      });
    } catch (err) {
      setError(err.message || "No se pudo crear el apartamento");
    } finally {
      setSaving(false);
    }
  };

  const handleEditOpen = (apt) => {
    setEditItem(apt);
    setEditForm({
      nombre: apt.nombre || "",
      edificio_id: apt.edificio_id || "",
      piso: apt.piso || "",
      tipo_unidad: apt.tipo_unidad || "apartamento",
      metraje: apt.metraje || "",
      estado: apt.estado || "disponible",
    });
  };

  const handleEditSave = async () => {
    if (!editForm.nombre.trim()) return;
    setSaving(true);
    setError("");
    try {
      await actualizarApartamento(editItem.id, {
        ...editForm,
        edificio_id: Number(editForm.edificio_id),
        metraje: Number(editForm.metraje || 0),
      });
      setEditItem(null);
    } catch (err) {
      setError(err.message || "No se pudo actualizar el apartamento");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (apt) => {
    setSaving(true);
    setError("");
    try {
      await eliminarApartamento(apt.id);
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.message || "No se pudo eliminar el apartamento");
    } finally {
      setSaving(false);
    }
  };

  if (!hasCondominio) {
    return <MissingCondominio moduleName="apartamentos" />;
  }

  if (!edificios.length) {
    return (
      <div className={`${SURFACE} p-8 text-center`}>
        <div className="w-16 h-16 bg-[#FFF4EE] rounded-full flex items-center justify-center mx-auto mb-5 text-2xl">
          🏗️
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif" }}
          className="text-2xl font-bold text-[#1A1A1A]">
          Primero crea un edificio
        </h1>
        <p className="mt-3 text-sm leading-7 text-[#404040] font-medium max-w-sm mx-auto">
          Los apartamentos necesitan pertenecer a un edificio dentro de {condominio?.nombre}.
        </p>
        <Link
          to="/edificios"
          className="inline-flex mt-6 px-6 py-3 rounded-2xl no-underline text-white text-sm font-bold shadow-md"
          style={{ background: "linear-gradient(135deg, var(--condome-orange-soft), var(--condome-orange))" }}
        >
          Ir a edificios
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className={`${SURFACE} p-6`}>
          <p className="text-[11px] uppercase tracking-[0.22em] font-bold text-[var(--condome-orange)]">
            Unidades
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', serif" }}
            className="mt-2 text-2xl font-bold text-[var(--fg-primary)]">
            Registrar apartamento
          </h1>
          <p className="mt-2 text-sm leading-7 text-[var(--fg-secondary)] font-medium">
            Crea las unidades del condominio y prepara la ocupación de residentes.
          </p>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <SummaryTile label="Total" value={resumen.total} color="#B15A27" />
            <SummaryTile label="Disp" value={resumen.disponibles} color="#2E7D52" />
            <SummaryTile label="Ocup" value={resumen.ocupados} color="#1A1A1A" />
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[13px] font-bold">
                {error}
              </div>
            )}

            <div>
              <label className={LABEL}>Nombre / Numero *</label>
              <input name="nombre" value={form.nombre} onChange={handleChange} required className={INPUT} placeholder="Ej: Apt 101, local B-2..." />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Edificio *</label>
                <select name="edificio_id" value={form.edificio_id} onChange={handleChange} required className={INPUT}>
                  <option value="">Seleccionar...</option>
                  {edificios.map((ed) => (
                    <option key={ed.id} value={ed.id}>{ed.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL}>Piso / Nivel</label>
                <input name="piso" value={form.piso} onChange={handleChange} className={INPUT} placeholder="Ej: 1er nivel" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Tipo</label>
                <select name="tipo_unidad" value={form.tipo_unidad} onChange={handleChange} className={INPUT}>
                  <option value="apartamento">Apartamento</option>
                  <option value="local">Local</option>
                  <option value="oficina">Oficina</option>
                  <option value="penthouse">Penthouse</option>
                </select>
              </div>
              <div>
                <label className={LABEL}>Metraje (m2)</label>
                <input name="metraje" value={form.metraje} onChange={handleChange} className={INPUT} placeholder="0.00" />
              </div>
            </div>

            <button
              disabled={saving}
              className="w-full py-3.5 mt-2 rounded-xl text-white text-sm font-bold tracking-wide transition-all border-none cursor-pointer disabled:opacity-50 shadow-md"
              style={{ background: "linear-gradient(135deg, #FF7A30, #D94F10)" }}
            >
              {saving ? "Registrando..." : "Registrar unidad"}
            </button>
          </form>
        </div>

        <div className={`${SURFACE} overflow-hidden flex flex-col bg-[var(--canvas)]`}>
          <div className="px-6 py-5 border-b border-[var(--border-standard)] flex items-center justify-between bg-[var(--surface-0)]">
            <h2 className="text-lg font-bold text-[var(--fg-primary)]">Listado de unidades</h2>
            <div className="px-3 py-1 rounded-full bg-white border border-[var(--border-standard)] text-[11px] font-bold text-[var(--condome-orange)]">
              {apartamentos.length} unidades registradas
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-[500px] p-4">
            {!apartamentos.length ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-sm font-medium text-[#737373]">No hay unidades registradas todavia</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {apartamentos.map((apt) => (
                  <ApartmentCard
                    key={apt.id}
                    apt={apt}
                    edificio={edificios.find((e) => e.id === apt.edificio_id)}
                    onManage={() => setSelectedApartment(apt)}
                    onEdit={() => handleEditOpen(apt)}
                    onDelete={() => setDeleteConfirm(apt)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Modal Residentes */}
      {selectedApartment && (
        <ResidentsModal
          apt={selectedApartment}
          onClose={() => setSelectedApartment(null)}
          onAddResidente={crearResidente}
        />
      )}

      {/* Modal Editar Apartamento */}
      {editItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md" onClick={() => setEditItem(null)}>
          <div className="bg-[var(--surface-1)] rounded-[32px] w-full max-w-lg p-9 relative border border-[var(--border-standard)] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setEditItem(null)} className="absolute right-6 top-6 text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] border-none bg-transparent cursor-pointer text-xl">✕</button>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--condome-orange)] mb-2">Editar unidad</p>
            <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-2xl font-bold text-[var(--fg-primary)] mb-6">
              {editItem.nombre}
            </h2>
            <div className="space-y-4">
              <div>
                <label className={LABEL}>Nombre / Numero *</label>
                <input value={editForm.nombre} onChange={(e) => setEditForm((f) => ({ ...f, nombre: e.target.value }))} className={INPUT} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Edificio</label>
                  <select value={editForm.edificio_id} onChange={(e) => setEditForm((f) => ({ ...f, edificio_id: e.target.value }))} className={INPUT}>
                    {edificios.map((ed) => (<option key={ed.id} value={ed.id}>{ed.nombre}</option>))}
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Piso</label>
                  <input value={editForm.piso} onChange={(e) => setEditForm((f) => ({ ...f, piso: e.target.value }))} className={INPUT} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Tipo</label>
                  <select value={editForm.tipo_unidad} onChange={(e) => setEditForm((f) => ({ ...f, tipo_unidad: e.target.value }))} className={INPUT}>
                    <option value="apartamento">Apartamento</option>
                    <option value="local">Local</option>
                    <option value="oficina">Oficina</option>
                    <option value="penthouse">Penthouse</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Metraje (m2)</label>
                  <input value={editForm.metraje} onChange={(e) => setEditForm((f) => ({ ...f, metraje: e.target.value }))} className={INPUT} />
                </div>
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
        <ConfirmDeleteModal
          title="Eliminar unidad"
          message={<>¿Estas seguro de eliminar <strong>{deleteConfirm.nombre}</strong>? Se eliminaran los residentes asociados.</>}
          saving={saving}
          onCancel={() => setDeleteConfirm(null)}
          onConfirm={() => handleDelete(deleteConfirm)}
        />
      )}
    </div>
  );
}

function SummaryTile({ label, value, color }) {
  return (
    <div className="bg-[#FAF9F7] border border-[#E8DDD3]/60 rounded-xl p-3 text-center">
      <p className="text-[9px] uppercase tracking-[0.14em] font-bold text-[#A3A3A3] mb-1">{label}</p>
      <p className="text-lg font-extrabold" style={{ color }}>{value}</p>
    </div>
  );
}

function ApartmentCard({ apt, edificio, onManage, onEdit, onDelete }) {
  const BADGE = apt.estado === "disponible"
    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
    : "bg-[var(--condome-orange)]/10 text-[var(--condome-orange)] border-[var(--condome-orange)]/20";

  return (
    <div className={`rounded-[24px] border border-[var(--border-standard)] bg-[var(--surface-1)] shadow-[var(--shadow-card)] p-4 border-[var(--border-standard)] hover:border-[var(--condome-orange)] hover:shadow-lg transition-all group`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--canvas)] flex items-center justify-center text-xl group-hover:bg-[var(--condome-orange)]/10 transition-colors">
          🏢
        </div>
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wide ${BADGE}`}>
          {apt.estado}
        </span>
      </div>
      <h3 className="text-sm font-bold text-[var(--fg-primary)] group-hover:text-[var(--condome-orange)] transition-colors">{apt.nombre}</h3>
      <p className="text-[11px] text-[var(--fg-tertiary)] mt-1 font-medium truncate">
        {edificio?.nombre || "Edificio s/n"} • {apt.piso || "Planta baja"}
      </p>
      <div className="mt-3 pt-3 border-t border-[var(--border-standard)] flex items-center justify-between gap-1">
        <span className="text-[10px] font-bold text-[var(--fg-tertiary)] uppercase tracking-tight">{apt.metraje} m2</span>
        <div className="flex gap-1.5">
          <button onClick={onManage} className="text-[9px] font-bold text-[var(--condome-orange)] bg-[var(--condome-orange)]/5 border border-[var(--condome-orange)]/20 rounded-lg px-2 py-1 cursor-pointer hover:bg-[var(--condome-orange)]/10 transition-colors">Residentes</button>
          <button onClick={onEdit} className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1 cursor-pointer hover:bg-blue-100 transition-colors">Editar</button>
          <button onClick={onDelete} className="text-[9px] font-bold text-red-500 bg-red-50 border border-red-200 rounded-lg px-2 py-1 cursor-pointer hover:bg-red-100 transition-colors">×</button>
        </div>
      </div>
    </div>
  );
}

function ResidentsModal({ apt, onClose, onAddResidente }) {
  const [form, setForm] = useState({ nombre: "", apellido: "", telefono: "", email: "" });
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await onAddResidente(apt.id, form);
      if (response && response.credenciales) {
        setResult(response.credenciales);
      } else {
        onClose();
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (result) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md" onClick={onClose}>
        <div className={`${INK_CARD} w-full max-w-md text-center`} onClick={e => e.stopPropagation()}>
           <div className="w-16 h-16 bg-[var(--condome-orange)]/20 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">🔑</div>
           <h2 className="text-2xl font-bold mb-2">Acceso Generado</h2>
           <p className="text-sm text-white/60 mb-8">Copia estas credenciales para entregárselas al residente. Podrá cambiarlas desde su perfil.</p>
           
           <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8 space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Usuario / Login</p>
                <p className="text-lg font-bold font-mono text-[var(--condome-orange-soft)]">{result.login}</p>
              </div>
              <div className="pt-4 border-t border-white/5">
                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Clave Temporal</p>
                <p className="text-lg font-bold font-mono text-[var(--condome-orange-soft)]">{result.password_temporal}</p>
              </div>
           </div>

           <button onClick={onClose} className="w-full py-4 rounded-xl bg-white text-black text-sm font-black uppercase tracking-widest hover:bg-white/90">
             Cerrar y Finalizar
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[var(--surface-1)] rounded-[32px] w-full max-w-lg p-9 relative border border-[var(--border-standard)] shadow-2xl">
        <button onClick={onClose} className="absolute right-6 top-6 text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] border-none bg-transparent cursor-pointer text-xl">✕</button>
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--condome-orange)] mb-2">Comunidad</p>
        <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-bold text-[var(--fg-primary)] mb-1">
          {apt.nombre}
        </h2>
        <p className="text-sm text-[var(--fg-tertiary)] font-medium mb-8">Registra un nuevo residente y genera su acceso oficial.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Nombre *</label>
              <input name="nombre" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} required className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Apellido *</label>
              <input name="apellido" value={form.apellido} onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))} required className={INPUT} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Telefono</label>
              <input name="telefono" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Email *</label>
              <input type="email" name="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required className={INPUT} />
            </div>
          </div>
          <button disabled={saving} className="w-full py-4 rounded-xl text-white text-sm font-black uppercase tracking-widest cursor-pointer border-none shadow-lg mt-4 transition-transform active:scale-95"
            style={{ background: "linear-gradient(135deg, var(--condome-orange-soft), var(--condome-orange))" }}>
            {saving ? "Registrando..." : "Crear Acceso y Asignar"}
          </button>
        </form>
      </div>
    </div>
  );
}

function ConfirmDeleteModal({ title, message, saving, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md" onClick={onCancel}>
      <div className="bg-[var(--surface-1)] rounded-[28px] w-full max-w-sm p-8 text-center relative border border-[var(--border-standard)] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5 text-2xl border border-red-100">🗑️</div>
        <h2 className="text-xl font-bold text-[var(--fg-primary)] mb-2">{title}</h2>
        <p className="text-sm text-[var(--fg-secondary)] font-medium mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl border border-[var(--border-standard)] bg-[var(--surface-0)] text-sm font-bold text-[var(--fg-secondary)] cursor-pointer hover:bg-[var(--canvas)] transition-colors">Cancelar</button>
          <button onClick={onConfirm} disabled={saving} className="flex-1 py-3 rounded-xl border-none bg-red-500 text-white text-sm font-bold cursor-pointer hover:bg-red-600 disabled:opacity-50 transition-colors">
            {saving ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function MissingCondominio({ moduleName }) {
  return (
    <div className={`${SURFACE} p-12 text-center bg-[var(--surface-1)]`}>
      <div className="w-24 h-24 bg-[var(--condome-orange)]/10 rounded-full flex items-center justify-center mx-auto mb-8 text-4xl">
        🏠
      </div>
      <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-bold text-[var(--fg-primary)]">
        Condominio no registrado
      </h1>
      <p className="mt-4 text-sm leading-8 text-[var(--fg-secondary)] font-medium max-w-md mx-auto">
        No puedes gestionar {moduleName} hasta que registres la ficha principal del condominio.
      </p>
      <Link to="/condominio" className="inline-block mt-8 px-10 py-4 rounded-2xl no-underline text-white font-black uppercase tracking-widest text-xs shadow-xl"
        style={{ background: "linear-gradient(135deg, var(--condome-orange-soft), var(--condome-orange))" }}>
        Registrar mi condominio
      </Link>
    </div>
  );
}
