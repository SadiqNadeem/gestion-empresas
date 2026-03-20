import { useState, useEffect } from 'react';
import { Plus, X, Truck, ToggleLeft, ToggleRight, Trash2, Pencil } from 'lucide-react';
import {
  getRepartidores,
  createRepartidor,
  updateRepartidor,
  deleteRepartidor,
} from '../services/repartidores';

const emptyForm = { nombre: '', telefono: '', vehiculo: '', zona: '' };

export default function Repartidores() {
  const [repartidores, setRepartidores] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [modal, setModal]               = useState(false);
  const [editTarget, setEditTarget]     = useState(null);
  const [form, setForm]                 = useState(emptyForm);
  const [saving, setSaving]             = useState(false);

  const load = () => {
    setLoading(true);
    getRepartidores().then(setRepartidores).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditTarget(null); setForm(emptyForm); setModal(true); };
  const openEdit   = (r)  => {
    setEditTarget(r);
    setForm({ nombre: r.nombre, telefono: r.telefono || '', vehiculo: r.vehiculo || '', zona: r.zona || '' });
    setModal(true);
  };
  const closeModal = () => { setModal(false); setEditTarget(null); setForm(emptyForm); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return alert('Name is required');
    setSaving(true);
    try {
      const payload = {
        nombre:   form.nombre.trim(),
        telefono: form.telefono.trim() || null,
        vehiculo: form.vehiculo.trim() || null,
        zona:     form.zona.trim()     || null,
      };
      if (editTarget) {
        const updated = await updateRepartidor(editTarget.id, payload);
        setRepartidores(prev => prev.map(r => r.id === updated.id ? updated : r));
      } else {
        const created = await createRepartidor(payload);
        setRepartidores(prev => [...prev, created].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      }
      closeModal();
    } catch (err) { alert('Error: ' + err.message); }
    finally { setSaving(false); }
  };

  const handleToggleActivo = async (r) => {
    try {
      if (r.activo) {
        // Desactivar → soft delete del servicio, quitar de la lista de activos
        await deleteRepartidor(r.id);
        setRepartidores(prev => prev.filter(x => x.id !== r.id));
      } else {
        const updated = await updateRepartidor(r.id, { activo: true });
        setRepartidores(prev => prev.map(x => x.id === updated.id ? updated : x));
      }
    } catch (err) { alert('Error: ' + err.message); }
  };

  const handleDelete = async (id, nombre) => {
    if (!confirm(`Delete "${nombre}"? They will be deactivated and removed from the list.`)) return;
    try {
      await deleteRepartidor(id);
      setRepartidores(prev => prev.filter(r => r.id !== id));
    } catch (err) { alert('Error: ' + err.message); }
  };

  return (
    <div className="g-page">
      <div className="g-section-header">
        <h1 className="g-page-title" style={{ margin: 0 }}>Drivers</h1>
        <button className="g-btn g-btn-primary" onClick={openCreate}>
          <Plus size={16} /> New driver
        </button>
      </div>

      <div className="g-card">
        {loading ? <div className="g-loading">Loading...</div> :
         repartidores.length === 0 ? <div className="g-empty">No active drivers found.</div> : (
          <div className="g-table-wrap">
            <table className="g-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Vehicle</th>
                  <th>Zone</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {repartidores.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.nombre}</td>
                    <td>{r.telefono || <span style={{ color: '#94a3b8' }}>—</span>}</td>
                    <td>{r.vehiculo || <span style={{ color: '#94a3b8' }}>—</span>}</td>
                    <td>{r.zona    || <span style={{ color: '#94a3b8' }}>—</span>}</td>
                    <td>
                      <span className="g-badge g-badge-green">Active</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="g-btn g-btn-secondary g-btn-sm" onClick={() => openEdit(r)} title="Editar">
                          <Pencil size={13} />
                        </button>
                        <button className="g-btn g-btn-secondary g-btn-sm" onClick={() => handleToggleActivo(r)} title="Deactivate">
                          <ToggleRight size={15} color="#059669" />
                        </button>
                        <button className="g-btn g-btn-danger g-btn-sm" onClick={() => handleDelete(r.id, r.nombre)} title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="g-modal-overlay" onClick={closeModal}>
          <div className="g-modal" onClick={e => e.stopPropagation()}>
            <div className="g-modal-header">
              <span className="g-modal-title">{editTarget ? 'Edit driver' : 'New driver'}</span>
              <button className="g-modal-close" onClick={closeModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="g-modal-body">
                <div className="g-field">
                  <label className="g-label">Name *</label>
                  <input className="g-input" required autoFocus value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Full name" />
                </div>
                <div className="g-field">
                  <label className="g-label">Phone</label>
                  <input className="g-input" type="tel" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} placeholder="+1 000 000 0000" />
                </div>
                <div className="g-field">
                  <label className="g-label">Vehicle</label>
                  <input className="g-input" value={form.vehiculo} onChange={e => setForm(f => ({ ...f, vehiculo: e.target.value }))} placeholder="Van, motorcycle..." />
                </div>
                <div className="g-field" style={{ marginBottom: 0 }}>
                  <label className="g-label">Zone</label>
                  <input className="g-input" value={form.zona} onChange={e => setForm(f => ({ ...f, zona: e.target.value }))} placeholder="North, Central..." />
                </div>
              </div>
              <div className="g-modal-footer">
                <button type="button" className="g-btn g-btn-secondary" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="g-btn g-btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editTarget ? 'Save changes' : 'Create driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
