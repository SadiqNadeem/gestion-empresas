import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, X, Pencil, Search } from 'lucide-react';
import { getProductos, addProducto, updateProducto, deleteProducto } from '../lib/api';
import { getCategorias, addCategoria, deleteCategoria } from '../lib/api';

function StockBadge({ stock }) {
  if (stock === 0) return <span className="g-badge g-badge-red">Out of stock</span>;
  if (stock < 10)  return <span className="g-badge g-badge-yellow">{stock} units</span>;
  return <span className="g-badge g-badge-green">{stock} units</span>;
}

const emptyForm = { nombre: '', categoria: '', precio: '', stock: '0', descripcion: '' };

export default function Productos() {
  const [productos, setProductos]     = useState([]);
  const [categorias, setCategorias]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [modal, setModal]             = useState(false);
  const [catModal, setCatModal]       = useState(false);
  const [editId, setEditId]           = useState(null);
  const [form, setForm]               = useState(emptyForm);
  const [saving, setSaving]           = useState(false);
  const [search, setSearch]           = useState('');
  const [filtCat, setFiltCat]         = useState('');
  const [newCatNombre, setNewCatNombre] = useState('');

  const loadProductos = () => {
    setLoading(true);
    getProductos().then(setProductos).finally(() => setLoading(false));
  };
  const loadCategorias = () => getCategorias().then(data => {
    setCategorias(data);
  });

  useEffect(() => { loadProductos(); loadCategorias(); }, []);

  const productosFiltrados = useMemo(() => {
    return productos.filter(p => {
      const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase());
      const matchCat = filtCat === '' || p.categoria === filtCat;
      return matchSearch && matchCat;
    });
  }, [productos, search, filtCat]);

  const productosPorCategoria = useMemo(() => {
    const grupos = {};
    productosFiltrados.forEach(p => {
      const cat = p.categoria || 'Sin categoría';
      if (!grupos[cat]) grupos[cat] = [];
      grupos[cat].push(p);
    });
    return Object.entries(grupos).sort(([a], [b]) => a.localeCompare(b));
  }, [productosFiltrados]);

  const openNew = () => {
    setEditId(null);
    setForm({ ...emptyForm, categoria: categorias[0]?.nombre || '' });
    setModal(true);
  };
  const openEdit = (p) => {
    setEditId(p.id);
    setForm({ nombre: p.nombre, categoria: p.categoria, precio: String(p.precio), stock: String(p.stock), descripcion: p.descripcion || '' });
    setModal(true);
  };
  const closeModal = () => { setModal(false); setEditId(null); setForm(emptyForm); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { nombre: form.nombre, categoria: form.categoria, precio: Number(form.precio), stock: Number(form.stock), descripcion: form.descripcion };
      if (editId) {
        await updateProducto(editId, data);
        setProductos(prev => prev.map(p => p.id === editId ? { ...p, ...data } : p));
      } else {
        await addProducto(data);
        loadProductos();
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

  const handleAddCat = async (e) => {
    e.preventDefault();
    if (!newCatNombre.trim()) return;
    try {
      await addCategoria(newCatNombre.trim());
      setNewCatNombre('');
      loadCategorias();
    } catch (err) { alert('Error: ' + err.message); }
  };

  const handleDeleteCat = async (id, nombre) => {
    if (!confirm(`Eliminar categoría "${nombre}"?`)) return;
    try { await deleteCategoria(id); loadCategorias(); }
    catch (err) { alert('Error: ' + err.message); }
  };

  return (
    <div className="g-page">
      <div className="g-section-header">
        <h1 className="g-page-title" style={{ margin: 0 }}>Products</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="g-btn g-btn-secondary" onClick={() => setCatModal(true)}>Categorías</button>
          <button className="g-btn g-btn-primary" onClick={openNew}>
            <Plus size={16} /> Add product
          </button>
        </div>
      </div>

      {/* Buscador y filtro de categorías */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 320 }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            className="g-input"
            style={{ paddingLeft: 34, marginBottom: 0 }}
            placeholder="Buscar producto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            className={`g-btn g-btn-sm ${filtCat === '' ? 'g-btn-primary' : 'g-btn-secondary'}`}
            onClick={() => setFiltCat('')}
          >
            Todos
          </button>
          {categorias.map(c => (
            <button
              key={c.id}
              className={`g-btn g-btn-sm ${filtCat === c.nombre ? 'g-btn-primary' : 'g-btn-secondary'}`}
              onClick={() => setFiltCat(filtCat === c.nombre ? '' : c.nombre)}
            >
              {c.nombre}
            </button>
          ))}
        </div>
      </div>

      <div className="g-card">
        {loading ? <div className="g-loading">Loading...</div> :
         productosFiltrados.length === 0 ? <div className="g-empty">No hay productos.</div> : (
          <div className="g-table-wrap">
            <table className="g-table">
              <thead><tr><th>Name</th><th>Price</th><th>Stock</th><th></th></tr></thead>
              <tbody>
                {productosPorCategoria.map(([categoria, items]) => (
                  <>
                    <tr key={`cat-${categoria}`}>
                      <td colSpan={4} style={{ background: '#f3f4f6', fontWeight: 700, fontSize: 13, color: '#374151', padding: '8px 16px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        {categoria} <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: 12 }}>({items.length})</span>
                      </td>
                    </tr>
                    {items.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>{p.nombre}</td>
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
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal producto */}
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
                      {categorias.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                    </select>
                  </div>
                  <div className="g-field">
                    <label className="g-label">Price (€) *</label>
                    <input className="g-input" type="number" step="0.01" min="0" required value={form.precio} onChange={e => setForm(f => ({ ...f, precio: e.target.value }))} placeholder="0.00" />
                  </div>
                </div>
                <div className="g-field">
                  <label className="g-label">Stock</label>
                  <input className="g-input" type="number" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
                </div>
                <div className="g-field" style={{ marginBottom: 0 }}>
                  <label className="g-label">Description</label>
                  <textarea className="g-input" rows={3} style={{ resize: 'vertical' }} value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Optional description..." />
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

      {/* Modal gestión de categorías */}
      {catModal && (
        <div className="g-modal-overlay" onClick={() => setCatModal(false)}>
          <div className="g-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="g-modal-header">
              <span className="g-modal-title">Gestionar categorías</span>
              <button className="g-modal-close" onClick={() => setCatModal(false)}><X size={20} /></button>
            </div>
            <div className="g-modal-body">
              <form onSubmit={handleAddCat} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input
                  className="g-input"
                  style={{ marginBottom: 0, flex: 1 }}
                  placeholder="Nueva categoría..."
                  value={newCatNombre}
                  onChange={e => setNewCatNombre(e.target.value)}
                />
                <button type="submit" className="g-btn g-btn-primary"><Plus size={16} /></button>
              </form>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {categorias.map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f9fafb', borderRadius: 8 }}>
                    <span style={{ fontWeight: 500 }}>{c.nombre}</span>
                    <button className="g-btn g-btn-danger g-btn-sm" onClick={() => handleDeleteCat(c.id, c.nombre)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
