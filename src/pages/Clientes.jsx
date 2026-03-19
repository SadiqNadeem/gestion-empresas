import { useState, useEffect } from 'react';
import { Plus, Trash2, History, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getClientes, addCliente, deleteCliente } from '../lib/api';

const emptyForm = { nombre: '', telefono: '', direccion: '' };

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState(emptyForm);
  const [saving, setSaving]     = useState(false);
  const navigate = useNavigate();

  const load = () => { setLoading(true); getClientes().then(setClientes).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await addCliente(form); setModal(false); setForm(emptyForm); load(); }
    catch (err) { alert('Error: ' + err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, nombre) => {
    if (!confirm(`¿Eliminar a "${nombre}"?`)) return;
    try { await deleteCliente(id); setClientes(c => c.filter(x => x.id !== id)); }
    catch (err) { alert('Error: ' + err.message); }
  };

  return (
    <div className="g-page">
      <div className="g-section-header">
        <h1 className="g-page-title" style={{ margin: 0 }}>Clientes</h1>
        <button className="g-btn g-btn-primary" onClick={() => { setForm(emptyForm); setModal(true); }}>
          <Plus size={16} /> Añadir cliente
        </button>
      </div>

      <div className="g-card">
        {loading ? <div className="g-loading">Cargando...</div> :
         clientes.length === 0 ? <div className="g-empty">No hay clientes aún.</div> : (
          <div className="g-table-wrap">
            <table className="g-table">
              <thead><tr><th>Nombre</th><th>Teléfono</th><th>Dirección</th><th></th></tr></thead>
              <tbody>
                {clientes.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.nombre}</td>
                    <td>{c.telefono || <span style={{ color: '#94a3b8' }}>—</span>}</td>
                    <td>{c.direccion || <span style={{ color: '#94a3b8' }}>—</span>}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="g-btn g-btn-secondary g-btn-sm" onClick={() => navigate(`/pedidos?cliente_id=${c.id}`)}>
                          <History size={14} /> Historial
                        </button>
                        <button className="g-btn g-btn-danger g-btn-sm" onClick={() => handleDelete(c.id, c.nombre)}>
                          <Trash2 size={14} />
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
        <div className="g-modal-overlay" onClick={() => setModal(false)}>
          <div className="g-modal" onClick={e => e.stopPropagation()}>
            <div className="g-modal-header">
              <span className="g-modal-title">Nuevo cliente</span>
              <button className="g-modal-close" onClick={() => setModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="g-modal-body">
                <div className="g-field">
                  <label className="g-label">Nombre *</label>
                  <input className="g-input" required autoFocus value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre del cliente" />
                </div>
                <div className="g-field">
                  <label className="g-label">Teléfono</label>
                  <input className="g-input" type="tel" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} placeholder="600 000 000" />
                </div>
                <div className="g-field" style={{ marginBottom: 0 }}>
                  <label className="g-label">Dirección</label>
                  <input className="g-input" value={form.direccion} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))} placeholder="Calle, número, ciudad..." />
                </div>
              </div>
              <div className="g-modal-footer">
                <button type="button" className="g-btn g-btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="g-btn g-btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
