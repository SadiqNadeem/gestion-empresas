import { useState, useEffect } from 'react';
import { Plus, X, Truck, ToggleLeft, ToggleRight, Trash2, Pencil } from 'lucide-react';
import { getRepartidores, addRepartidor, updateRepartidor, deleteRepartidor } from '../lib/api';

const emptyForm = { nombre: '', telefono: '', vehiculo: '', zona: '' };

export default function Repartidores() {
  const [repartidores, setRepartidores] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [modal, setModal]               = useState(false);
  const [editTarget, setEditTarget]     = useState(null); // null = crear, obj = editar
  const [form, setForm]                 = useState(emptyForm);
  const [saving, setSaving]             = useState(false);

  const load = async () => {
    setLoading(true);
    try { setRepartidores(await getRepartidores()); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditTarget(null); setForm(emptyForm); setModal(true); };
  const openEdit   = (r)  => { setEditTarget(r);   setForm({ nombre: r.nombre, telefono: r.telefono || '', vehiculo: r.vehiculo || '', zona: r.zona || '' }); setModal(true); };
  const closeModal = ()   => { setModal(false); setEditTarget(null); setForm(emptyForm); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return alert('El nombre es obligatorio');
    setSaving(true);
    try {
      if (editTarget) {
        const updated = await updateRepartidor(editTarget.id, { nombre: form.nombre.trim(), telefono: form.telefono.trim() || null, vehiculo: form.vehiculo.trim() || null, zona: form.zona.trim() || null });
        setRepartidores(prev => prev.map(r => r.id === updated.id ? updated : r));
      } else {
        const created = await addRepartidor({ nombre: form.nombre.trim(), telefono: form.telefono.trim() || null, vehiculo: form.vehiculo.trim() || null, zona: form.zona.trim() || null });
        setRepartidores(prev => [...prev, created].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      }
      closeModal();
    } catch (err) { alert('Error: ' + err.message); }
    finally { setSaving(false); }
  };

  const handleToggleActivo = async (r) => {
    try {
      const updated = await updateRepartidor(r.id, { activo: !r.activo });
      setRepartidores(prev => prev.map(x => x.id === updated.id ? updated : x));
    } catch (err) { alert('Error: ' + err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este repartidor? Esta acción no se puede deshacer.')) return;
    try {
      await deleteRepartidor(id);
      setRepartidores(prev => prev.filter(r => r.id !== id));
    } catch (err) { alert('Error: ' + err.message); }
  };

  const activos   = repartidores.filter(r => r.activo);
  const inactivos = repartidores.filter(r => !r.activo);

  return (
    <div className="g-page">
      <div className="g-section-header">
        <h1 className="g-page-title">Repartidores</h1>
        <button className="g-btn g-btn-primary" onClick={openCreate}>
          <Plus size={16} /> Nuevo repartidor
        </button>
      </div>

      <div className="g-card">
        {loading ? <div className="g-loading">Cargando...</div> :
         repartidores.length === 0 ? (
           <div className="g-empty">
             <Truck size={32} style={{ color: '#cbd5e1', marginBottom: 8 }} />
             <p>No hay repartidores registrados.</p>
           </div>
         ) : (
          <div className="g-table-wrap">
            <table className="g-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Vehículo</th>
                  <th>Zona</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {activos.map(r => <RepartidorRow key={r.id} r={r} onEdit={openEdit} onToggle={handleToggleActivo} onDelete={handleDelete} />)}
                {inactivos.length > 0 && activos.length > 0 && (
                  <tr><td colSpan={6} style={{ padding: '8px 12px', fontSize: 12, color: '#94a3b8', fontWeight: 600, background: '#f8fafc' }}>INACTIVOS</td></tr>
                )}
                {inactivos.map(r => <RepartidorRow key={r.id} r={r} onEdit={openEdit} onToggle={handleToggleActivo} onDelete={handleDelete} />)}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="g-modal-overlay" onClick={closeModal}>
          <div className="g-modal" onClick={e => e.stopPropagation()}>
            <div className="g-modal-header">
              <span className="g-modal-title">{editTarget ? 'Editar repartidor' : 'Nuevo repartidor'}</span>
              <button className="g-modal-close" onClick={closeModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="g-modal-body">
                <div className="g-grid-2">
                  <div className="g-field">
                    <label className="g-label">Nombre *</label>
                    <input className="g-input" autoFocus required value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre completo" />
                  </div>
                  <div className="g-field">
                    <label className="g-label">Teléfono</label>
                    <input className="g-input" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} placeholder="600 000 000" />
                  </div>
                  <div className="g-field">
                    <label className="g-label">Vehículo</label>
                    <input className="g-input" value={form.vehiculo} onChange={e => setForm(f => ({ ...f, vehiculo: e.target.value }))} placeholder="Furgoneta, moto..." />
                  </div>
                  <div className="g-field">
                    <label className="g-label">Zona</label>
                    <input className="g-input" value={form.zona} onChange={e => setForm(f => ({ ...f, zona: e.target.value }))} placeholder="Norte, Centro..." />
                  </div>
                </div>
              </div>
              <div className="g-modal-footer">
                <button type="button" className="g-btn g-btn-secondary" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="g-btn g-btn-primary" disabled={saving}>{saving ? 'Guardando...' : editTarget ? 'Guardar cambios' : 'Crear repartidor'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function RepartidorRow({ r, onEdit, onToggle, onDelete }) {
  return (
    <tr style={{ opacity: r.activo ? 1 : 0.5 }}>
      <td style={{ fontWeight: 600 }}>{r.nombre}</td>
      <td>{r.telefono || '—'}</td>
      <td>{r.vehiculo || '—'}</td>
      <td>{r.zona || '—'}</td>
      <td>
        <span className={`g-badge ${r.activo ? 'g-badge-green' : 'g-badge-gray'}`}>
          {r.activo ? 'Activo' : 'Inactivo'}
        </span>
      </td>
      <td>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="g-btn g-btn-secondary g-btn-sm" onClick={() => onEdit(r)} title="Editar">
            <Pencil size={13} />
          </button>
          <button className="g-btn g-btn-secondary g-btn-sm" onClick={() => onToggle(r)} title={r.activo ? 'Desactivar' : 'Activar'}>
            {r.activo ? <ToggleRight size={15} color="#059669" /> : <ToggleLeft size={15} />}
          </button>
          <button className="g-btn g-btn-danger g-btn-sm" onClick={() => onDelete(r.id)} title="Eliminar">
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
}
