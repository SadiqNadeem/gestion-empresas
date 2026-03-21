import { useState, useEffect } from 'react';
import { Plus, Trash2, X, Pencil } from 'lucide-react';
import { getProductos, addProducto, updateProducto, deleteProducto } from '../lib/api';

const CATEGORIAS = ['Bebidas', 'Cajas', 'Bolsas', 'Varios', 'Alimentación', 'Embalaje', 'Film'];

function StockBadge({ stock }) {
  if (stock === 0) return <span className="g-badge g-badge-red">Out of stock</span>;
  if (stock < 10)  return <span className="g-badge g-badge-yellow">{stock} units</span>;
  return <span className="g-badge g-badge-green">{stock} units</span>;
}

const emptyForm = { nombre: '', categoria: 'Bebidas', precio: '', stock: '0' };

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [editId, setEditId]       = useState(null);
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]       = useState(false);

  const load = () => { setLoading(true); getProductos().then(setProductos).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditId(null); setForm(emptyForm); setModal(true); };
  const openEdit = (p) => {
    setEditId(p.id);
    setForm({ nombre: p.nombre, categoria: p.categoria, precio: String(p.precio), stock: String(p.stock) });
    setModal(true);
  };
  const closeModal = () => { setModal(false); setEditId(null); setForm(emptyForm); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { nombre: form.nombre, categoria: form.categoria, precio: Number(form.precio), stock: Number(form.stock) };
      if (editId) {
        await updateProducto(editId, data);
        setProductos(prev => prev.map(p => p.id === editId ? { ...p, ...data } : p));
      } else {
        await addProducto(data);
        load();
      }
      closeModal();
    } catch (err) { alert('Error: ' + err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, nombre) => {
    if (!confirm(`Delete "${nombre}"?`)) return;
    try { await deleteProducto(id); setProductos(p => p.filter(x => x.id !== id)); }
    catch (err) { alert('Error: ' + err.message); }
  };

  return (
    <div className="g-page">
      <div className="g-section-header">
        <h1 className="g-page-title" style={{ margin: 0 }}>Products</h1>
        <button className="g-btn g-btn-primary" onClick={openNew}>
          <Plus size={16} /> Add product
        </button>
      </div>

      <div className="g-card">
        {loading ? <div className="g-loading">Loading...</div> :
         productos.length === 0 ? <div className="g-empty">No products yet.</div> : (
          <div className="g-table-wrap">
            <table className="g-table">
              <thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th></th></tr></thead>
              <tbody>
                {productos.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.nombre}</td>
                    <td><span className="g-badge g-badge-blue">{p.categoria}</span></td>
                    <td>{Number(p.precio).toFixed(2)} €</td>
                    <td><StockBadge stock={p.stock} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="g-btn g-btn-secondary g-btn-sm" onClick={() => openEdit(p)}>
                          <Pencil size={14} />
                        </button>
                        <button className="g-btn g-btn-danger g-btn-sm" onClick={() => handleDelete(p.id, p.nombre)}>
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
        <div className="g-modal-overlay" onClick={closeModal}>
          <div className="g-modal" onClick={e => e.stopPropagation()}>
            <div className="g-modal-header">
              <span className="g-modal-title">{editId ? 'Edit product' : 'New product'}</span>
              <button className="g-modal-close" onClick={closeModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="g-modal-body">
                <div className="g-field">
                  <label className="g-label">Name *</label>
                  <input className="g-input" required autoFocus value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
                </div>
                <div className="g-row-2">
                  <div className="g-field">
                    <label className="g-label">Category</label>
                    <select className="g-select" value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
                      {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="g-field">
                    <label className="g-label">Price (€) *</label>
                    <input className="g-input" type="number" step="0.01" min="0" required value={form.precio} onChange={e => setForm(f => ({ ...f, precio: e.target.value }))} placeholder="0.00" />
                  </div>
                </div>
                <div className="g-field" style={{ marginBottom: 0 }}>
                  <label className="g-label">Stock</label>
                  <input className="g-input" type="number" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
                </div>
              </div>
              <div className="g-modal-footer">
                <button type="button" className="g-btn g-btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="g-btn g-btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
