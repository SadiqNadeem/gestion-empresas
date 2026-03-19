import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Check, FileText, X, Trash2, ArrowLeft } from 'lucide-react';
import { getPedidos, getPedidosByCliente, getClientes, getProductos, addPedido, addCliente, updateEstadoPedido } from '../lib/api';

const emptyRow = () => ({ producto_id: '', cantidad: 1, precio_unitario: 0 });
const NUEVO_CLIENTE = '__nuevo__';

export default function Pedidos() {
  const [pedidos, setPedidos]               = useState([]);
  const [clientes, setClientes]             = useState([]);
  const [productos, setProductos]           = useState([]);
  const [loading, setLoading]               = useState(true);
  const [modal, setModal]                   = useState(false);
  const [clienteId, setClienteId]           = useState('');
  const [nuevoNombre, setNuevoNombre]       = useState('');
  const [direccionEntrega, setDireccionEntrega] = useState('');
  const [rows, setRows]                     = useState([emptyRow()]);
  const [saving, setSaving]                 = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filtroId     = searchParams.get('cliente_id');
  const filtroNombre = clientes.find(c => c.id === filtroId)?.nombre;

  const load = async () => {
    setLoading(true);
    try {
      const data = filtroId ? await getPedidosByCliente(filtroId) : await getPedidos();
      setPedidos(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); getClientes().then(setClientes); getProductos().then(setProductos); }, [filtroId]);

  const openModal = () => {
    setClienteId(''); setNuevoNombre(''); setDireccionEntrega(''); setRows([emptyRow()]); setModal(true);
  };

  const closeModal = () => {
    setModal(false); setClienteId(''); setNuevoNombre(''); setDireccionEntrega(''); setRows([emptyRow()]);
  };

  const handleRowChange = (i, field, value) => {
    setRows(prev => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      if (field === 'producto_id') {
        const prod = productos.find(p => p.id === value);
        next[i].precio_unitario = prod ? Number(prod.precio) : 0;
      }
      return next;
    });
  };

  const total = rows.reduce((s, r) => s + Number(r.precio_unitario) * Number(r.cantidad), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const valid = rows.filter(r => r.producto_id);
    if (!clienteId)                                        return alert('Selecciona un cliente');
    if (clienteId === NUEVO_CLIENTE && !nuevoNombre.trim()) return alert('Escribe el nombre del nuevo cliente');
    if (!valid.length)                                     return alert('Añade al menos un producto');
    setSaving(true);
    try {
      let resolvedId = clienteId;
      if (clienteId === NUEVO_CLIENTE) {
        const creado = await addCliente({ nombre: nuevoNombre.trim() });
        resolvedId = creado.id;
        setClientes(prev => [...prev, creado].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      }
      const pedidoData = { cliente_id: resolvedId };
      if (direccionEntrega.trim()) pedidoData.direccion_entrega = direccionEntrega.trim();
      await addPedido(
        pedidoData,
        valid.map(r => ({ producto_id: r.producto_id, cantidad: Number(r.cantidad), precio_unitario: Number(r.precio_unitario) }))
      );
      closeModal();
      load();
    } catch (err) { alert('Error: ' + err.message); }
    finally { setSaving(false); }
  };

  const handleEntregado = async (id) => {
    try { await updateEstadoPedido(id, 'entregado'); setPedidos(p => p.map(x => x.id === id ? { ...x, estado: 'entregado' } : x)); }
    catch (err) { alert('Error: ' + err.message); }
  };

  const formatFecha = (p) => p.fecha ? new Date(p.fecha + 'T00:00:00').toLocaleDateString('es-ES') : new Date(p.created_at).toLocaleDateString('es-ES');

  return (
    <div className="g-page">
      <div className="g-section-header">
        <div>
          <h1 className="g-page-title" style={{ margin: 0 }}>
            {filtroId ? `Pedidos de ${filtroNombre || '...'}` : 'Pedidos'}
          </h1>
          {filtroId && (
            <button style={{ marginTop: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#059669', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, padding: 0 }} onClick={() => navigate('/pedidos')}>
              <ArrowLeft size={14} /> Ver todos
            </button>
          )}
        </div>
        <button className="g-btn g-btn-primary" onClick={openModal}>
          <Plus size={16} /> Nuevo pedido
        </button>
      </div>

      <div className="g-card">
        {loading ? <div className="g-loading">Cargando...</div> :
         pedidos.length === 0 ? <div className="g-empty">No hay pedidos.</div> : (
          <div className="g-table-wrap">
            <table className="g-table">
              <thead><tr><th>Ref.</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                {pedidos.map(p => {
                  const total = (p.pedido_items ?? []).reduce((s, i) => s + Number(i.cantidad) * Number(i.precio_unitario), 0);
                  return (
                  <tr key={p.id}>
                    <td><span style={{ fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>#{p.id.slice(0,8).toUpperCase()}</span></td>
                    <td style={{ fontWeight: 600 }}>{p.clientes?.nombre || '—'}</td>
                    <td>{formatFecha(p)}</td>
                    <td style={{ fontWeight: 600 }}>{total.toFixed(2)} €</td>
                    <td><span className={`g-badge ${p.estado === 'entregado' ? 'g-badge-green' : 'g-badge-yellow'}`}>{p.estado}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {p.estado === 'pendiente' && (
                          <button className="g-btn g-btn-success g-btn-sm" onClick={() => handleEntregado(p.id)}>
                            <Check size={14} /> Entregar
                          </button>
                        )}
                        <button className="g-btn g-btn-secondary g-btn-sm" onClick={() => navigate(`/facturacion?pedidoId=${p.id}`)}>
                          <FileText size={14} /> Factura
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="g-modal-overlay" onClick={closeModal}>
          <div className="g-modal g-modal-lg" onClick={e => e.stopPropagation()}>
            <div className="g-modal-header">
              <span className="g-modal-title">Nuevo pedido</span>
              <button className="g-modal-close" onClick={closeModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="g-modal-body">

                {/* ── Cliente ── */}
                <div className="g-field">
                  <label className="g-label">Cliente *</label>
                  <select className="g-select" value={clienteId} onChange={e => setClienteId(e.target.value)}>
                    <option value="">— Seleccionar cliente —</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    <option value={NUEVO_CLIENTE}>＋ Nuevo cliente</option>
                  </select>
                </div>

                {clienteId === NUEVO_CLIENTE && (
                  <div className="g-field">
                    <label className="g-label">Nombre del nuevo cliente *</label>
                    <input
                      className="g-input"
                      autoFocus
                      required
                      value={nuevoNombre}
                      onChange={e => setNuevoNombre(e.target.value)}
                      placeholder="Nombre completo o empresa"
                    />
                  </div>
                )}

                {/* ── Dirección de entrega ── */}
                <div className="g-field">
                  <label className="g-label">Dirección de entrega <span style={{ fontWeight: 400, color: '#94a3b8' }}>(opcional)</span></label>
                  <input
                    className="g-input"
                    value={direccionEntrega}
                    onChange={e => setDireccionEntrega(e.target.value)}
                    placeholder="Calle, número, ciudad..."
                  />
                </div>

                {/* ── Productos ── */}
                <div className="g-field" style={{ marginBottom: 0 }}>
                  <label className="g-label">Productos</label>
                  <div className="g-item-row-header">
                    <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Producto</span>
                    <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Cant.</span>
                    <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Precio €</span>
                    <span></span>
                  </div>
                  {rows.map((row, i) => (
                    <div key={i} className="g-item-row">
                      <select className="g-select" value={row.producto_id} onChange={e => handleRowChange(i, 'producto_id', e.target.value)}>
                        <option value="">— Producto —</option>
                        {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                      </select>
                      <input className="g-input" type="number" min="1" value={row.cantidad} onChange={e => handleRowChange(i, 'cantidad', e.target.value)} />
                      <input className="g-input" type="number" step="0.01" min="0" value={row.precio_unitario} onChange={e => handleRowChange(i, 'precio_unitario', e.target.value)} />
                      <button type="button" className="g-remove-btn" disabled={rows.length === 1} onClick={() => setRows(p => p.filter((_, j) => j !== i))}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <button type="button" className="g-btn g-btn-secondary g-btn-sm" style={{ marginTop: 8 }} onClick={() => setRows(p => [...p, emptyRow()])}>
                    <Plus size={14} /> Añadir producto
                  </button>
                  <div className="g-item-row-total">Total: <strong>{total.toFixed(2)} €</strong></div>
                </div>

              </div>
              <div className="g-modal-footer">
                <button type="button" className="g-btn g-btn-secondary" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="g-btn g-btn-primary" disabled={saving}>{saving ? 'Creando...' : 'Crear pedido'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
