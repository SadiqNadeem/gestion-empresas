import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Check, FileText, X, Trash2, ArrowLeft, Truck, Map } from 'lucide-react';
import { getPedidos, getPedidosByCliente, getClientes, getProductos, addPedido, addCliente, updateEstadoPedido, getRepartidores, asignarRepartidor, updateEstadoEntrega } from '../lib/api';
import MapPicker from '../components/MapPicker';

const UNIDADES = ['units', 'boxes', 'sacks', 'packages', 'kg', 'liters'];
const emptyRow = () => ({ producto_id: '', cantidad: 1, precio_unitario: 0, unidad: 'units' });
const NUEVO_CLIENTE = '__nuevo__';

export default function Pedidos() {
  const [pedidos, setPedidos]               = useState([]);
  const [clientes, setClientes]             = useState([]);
  const [productos, setProductos]           = useState([]);
  const [repartidores, setRepartidores]     = useState([]);
  const [loading, setLoading]               = useState(true);
  const [modal, setModal]                   = useState(false);
  const [clienteId, setClienteId]           = useState('');
  const [nuevoNombre, setNuevoNombre]       = useState('');
  const [direccionEntrega, setDireccionEntrega] = useState('');
  const [repartidorId, setRepartidorId]     = useState('');
  const [rows, setRows]                     = useState([emptyRow()]);
  const [saving, setSaving]                 = useState(false);
  const [mapOpen, setMapOpen]               = useState(false);
  const [asignandoId, setAsignandoId]       = useState(null); // pedido al que se está asignando repartidor
  const [repartidorAsignar, setRepartidorAsignar] = useState('');
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

  useEffect(() => {
    load();
    getClientes().then(setClientes);
    getProductos().then(setProductos);
    getRepartidores().then(r => setRepartidores(r.filter(x => x.activo)));
  }, [filtroId]);

  const openModal = () => {
    setClienteId(''); setNuevoNombre(''); setDireccionEntrega(''); setRepartidorId(''); setRows([emptyRow()]); setModal(true);
  };

  const closeModal = () => {
    setModal(false); setClienteId(''); setNuevoNombre(''); setDireccionEntrega(''); setRepartidorId(''); setRows([emptyRow()]);
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
    if (!clienteId)                                        return alert('Please select a customer');
    if (clienteId === NUEVO_CLIENTE && !nuevoNombre.trim()) return alert('Please enter the new customer name');
    if (!valid.length)                                     return alert('Add at least one product');
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
      if (repartidorId) { pedidoData.repartidor_id = repartidorId; pedidoData.estado_entrega = 'en_ruta'; }
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
    try {
      await updateEstadoPedido(id, 'entregado');
      await updateEstadoEntrega(id, 'entregado');
      setPedidos(p => p.map(x => x.id === id ? { ...x, estado: 'entregado', estado_entrega: 'entregado' } : x));
    } catch (err) { alert('Error: ' + err.message); }
  };

  const handleAsignarRepartidor = async (pedidoId) => {
    if (!repartidorAsignar) return alert('Please select a driver');
    try {
      await asignarRepartidor(pedidoId, repartidorAsignar);
      const rep = repartidores.find(r => r.id === repartidorAsignar);
      setPedidos(p => p.map(x => x.id === pedidoId ? { ...x, repartidor_id: repartidorAsignar, repartidores: { nombre: rep?.nombre }, estado_entrega: 'en_ruta' } : x));
      setAsignandoId(null);
      setRepartidorAsignar('');
    } catch (err) { alert('Error: ' + err.message); }
  };

  const formatFecha = (p) => p.fecha ? new Date(p.fecha + 'T00:00:00').toLocaleDateString('en-GB') : new Date(p.created_at).toLocaleDateString('en-GB');

  return (
    <div className="g-page">
      <div className="g-section-header">
        <div>
          <h1 className="g-page-title" style={{ margin: 0 }}>
            {filtroId ? `Orders from ${filtroNombre || '...'}` : 'Orders'}
          </h1>
          {filtroId && (
            <button style={{ marginTop: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#059669', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, padding: 0 }} onClick={() => navigate('/pedidos')}>
              <ArrowLeft size={14} /> View all
            </button>
          )}
        </div>
        {pedidos.length > 0 && (
          <button className="g-btn g-btn-primary" onClick={openModal}>
            <Plus size={16} /> New order
          </button>
        )}
      </div>

      <div className="g-card">
        {loading ? <div className="g-loading">Loading...</div> :
         pedidos.length === 0 ? (
          <div className="g-empty">
            No orders yet.
            <br />
            <button className="g-btn g-btn-primary" style={{ marginTop: 16 }} onClick={openModal}>
              <Plus size={16} /> New order
            </button>
          </div>
         ) : (
          <div className="g-table-wrap">
            <table className="g-table">
              <thead><tr><th>Ref.</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th><th>Driver</th><th></th></tr></thead>
              <tbody>
                {pedidos.map(p => {
                  const total = (p.pedido_items ?? []).reduce((s, i) => s + Number(i.cantidad) * Number(i.precio_unitario), 0);
                  const estadoEntrega = p.estado_entrega || 'pendiente';
                  const badgeEntrega = estadoEntrega === 'entregado' ? 'g-badge-green' : estadoEntrega === 'en_ruta' ? 'g-badge-blue' : 'g-badge-yellow';
                  return (
                  <tr key={p.id}>
                    <td><span style={{ fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>#{p.id.slice(0,8).toUpperCase()}</span></td>
                    <td style={{ fontWeight: 600 }}>{p.clientes?.nombre || '—'}</td>
                    <td>{formatFecha(p)}</td>
                    <td style={{ fontWeight: 600 }}>{total.toFixed(2)} €</td>
                    <td><span className={`g-badge ${badgeEntrega}`}>{estadoEntrega.replace('_', ' ')}</span></td>
                    <td>
                      {asignandoId === p.id ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <select className="g-select" style={{ fontSize: 12, padding: '2px 6px' }} value={repartidorAsignar} onChange={e => setRepartidorAsignar(e.target.value)}>
                            <option value="">— Select —</option>
                            {repartidores.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                          </select>
                          <button className="g-btn g-btn-success g-btn-sm" onClick={() => handleAsignarRepartidor(p.id)}><Check size={13} /></button>
                          <button className="g-btn g-btn-secondary g-btn-sm" onClick={() => { setAsignandoId(null); setRepartidorAsignar(''); }}><X size={13} /></button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13 }}>{p.repartidores?.nombre || '—'}</span>
                          {estadoEntrega !== 'entregado' && (
                            <button className="g-btn g-btn-secondary g-btn-sm" onClick={() => { setAsignandoId(p.id); setRepartidorAsignar(p.repartidor_id || ''); }} title="Assign driver">
                              <Truck size={13} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {p.estado === 'pendiente' && (
                          <button className="g-btn g-btn-success g-btn-sm" onClick={() => handleEntregado(p.id)}>
                            <Check size={14} /> Deliver
                          </button>
                        )}
                        <button className="g-btn g-btn-secondary g-btn-sm" onClick={() => navigate(`/facturacion?pedidoId=${p.id}`)}>
                          <FileText size={14} /> Invoice
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
              <span className="g-modal-title">New order</span>
              <button className="g-modal-close" onClick={closeModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="g-modal-body">

                {/* ── Cliente ── */}
                <div className="g-field">
                  <label className="g-label">Customer *</label>
                  <select className="g-select" value={clienteId} onChange={e => setClienteId(e.target.value)}>
                    <option value="">— Select customer —</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    <option value={NUEVO_CLIENTE}>＋ New customer</option>
                  </select>
                </div>

                {clienteId === NUEVO_CLIENTE && (
                  <div className="g-field">
                    <label className="g-label">New customer name *</label>
                    <input
                      className="g-input"
                      autoFocus
                      required
                      value={nuevoNombre}
                      onChange={e => setNuevoNombre(e.target.value)}
                      placeholder="Full name or company"
                    />
                  </div>
                )}

                {/* ── Dirección de entrega ── */}
                <div className="g-field">
                  <label className="g-label">Delivery address <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional)</span></label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="g-input"
                      style={{ flex: 1 }}
                      value={direccionEntrega}
                      onChange={e => setDireccionEntrega(e.target.value)}
                      placeholder="Street, number, city..."
                    />
                    <button
                      type="button"
                      title="Select on map"
                      onClick={() => setMapOpen(true)}
                      style={{
                        flexShrink: 0, padding: '0 12px', borderRadius: 8,
                        border: '1px solid #e2e8f0', background: '#f8fafc',
                        cursor: 'pointer', color: '#059669', display: 'flex', alignItems: 'center', gap: 5,
                        fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap',
                      }}
                    >
                      <Map size={15} /> Map
                    </button>
                  </div>
                </div>

                {/* ── Repartidor ── */}
                {repartidores.length > 0 && (
                  <div className="g-field">
                    <label className="g-label">Driver <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional)</span></label>
                    <select className="g-select" value={repartidorId} onChange={e => setRepartidorId(e.target.value)}>
                      <option value="">— Assign later —</option>
                      {repartidores.map(r => <option key={r.id} value={r.id}>{r.nombre}{r.zona ? ` · ${r.zona}` : ''}</option>)}
                    </select>
                  </div>
                )}

                {/* ── Productos ── */}
                <div className="g-field" style={{ marginBottom: 0 }}>
                  <label className="g-label">Products</label>
                  <div className="g-item-row-header">
                    <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Product</span>
                    <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Qty.</span>
                    <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Unit</span>
                    <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Price €</span>
                    <span></span>
                  </div>
                  {rows.map((row, i) => (
                    <div key={i} className="g-item-row">
                      <select className="g-select" value={row.producto_id} onChange={e => handleRowChange(i, 'producto_id', e.target.value)}>
                        <option value="">— Product —</option>
                        {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                      </select>
                      <input className="g-input" type="number" min="1" value={row.cantidad} onChange={e => handleRowChange(i, 'cantidad', e.target.value)} />
                      <select className="g-select" value={row.unidad} onChange={e => handleRowChange(i, 'unidad', e.target.value)}>
                        {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                      <input className="g-input" type="number" step="0.01" min="0" value={row.precio_unitario} onChange={e => handleRowChange(i, 'precio_unitario', e.target.value)} />
                      <button type="button" className="g-remove-btn" disabled={rows.length === 1} onClick={() => setRows(p => p.filter((_, j) => j !== i))}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <button type="button" className="g-btn g-btn-secondary g-btn-sm" style={{ marginTop: 8 }} onClick={() => setRows(p => [...p, emptyRow()])}>
                    <Plus size={14} /> Add product
                  </button>
                  <div className="g-item-row-total">Total: <strong>{total.toFixed(2)} €</strong></div>
                </div>

              </div>
              <div className="g-modal-footer">
                <button type="button" className="g-btn g-btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="g-btn g-btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create order'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mapOpen && (
        <MapPicker
          onClose={() => setMapOpen(false)}
          onConfirm={(addr) => {
            setDireccionEntrega(addr);
            setMapOpen(false);
          }}
        />
      )}
    </div>
  );
}
