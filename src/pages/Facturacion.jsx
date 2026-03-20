import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { getPedidos, getPedidoItems } from '../lib/api';

export default function Facturacion() {
  const [pedidos, setPedidos]           = useState([]);
  const [pedidoId, setPedidoId]         = useState('');
  const [items, setItems]               = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [ivaRate, setIvaRate]           = useState(21);
  const [conIva, setConIva]             = useState(true);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    getPedidos().then(data => {
      setPedidos(data);
      const pid = searchParams.get('pedidoId');
      if (pid) setPedidoId(pid);
    });
  }, []);

  useEffect(() => {
    if (!pedidoId) { setItems([]); return; }
    setLoadingItems(true);
    getPedidoItems(pedidoId).then(setItems).catch(console.error).finally(() => setLoadingItems(false));
  }, [pedidoId]);

  const pedido   = pedidos.find(p => p.id === pedidoId);
  const subtotal = items.reduce((s, i) => s + Number(i.cantidad) * Number(i.precio_unitario), 0);
  const iva      = conIva ? subtotal * (ivaRate / 100) : 0;
  const total    = subtotal + iva;

  const formatFecha = (p) => {
    if (!p) return '—';
    return p.fecha ? new Date(p.fecha + 'T00:00:00').toLocaleDateString('en-GB') : new Date(p.created_at).toLocaleDateString('en-GB');
  };

  const generarPDF = () => {
    const doc = new jsPDF();
    let y = 20;

    doc.setFont('helvetica', 'bold'); doc.setFontSize(26); doc.setTextColor(15, 23, 42);
    doc.text('INVOICE', 105, y, { align: 'center' }); y += 12;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(100, 116, 139);
    doc.text(`Ref: #${pedidoId.slice(0,8).toUpperCase()}`, 105, y, { align: 'center' }); y += 16;

    doc.setDrawColor(226, 232, 240); doc.line(20, y, 190, y); y += 10;

    doc.setTextColor(30, 41, 59); doc.setFontSize(10);
    doc.text(`Customer: ${pedido?.clientes?.nombre || '—'}`, 20, y);
    doc.text(`Date: ${formatFecha(pedido)}`, 140, y); y += 7;
    doc.text(`Status: ${pedido?.estado || '—'}`, 20, y); y += 14;

    doc.setFillColor(248, 250, 252); doc.rect(20, y - 5, 170, 10, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(71, 85, 105);
    doc.text('PRODUCT', 22, y + 1); doc.text('QTY.', 110, y + 1);
    doc.text('PRICE', 133, y + 1); doc.text('TOTAL', 165, y + 1); y += 11;

    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(30, 41, 59);
    items.forEach(item => {
      const lt = (Number(item.cantidad) * Number(item.precio_unitario)).toFixed(2);
      doc.text(item.productos?.nombre || '—', 22, y);
      doc.text(String(item.cantidad), 112, y);
      doc.text(`${Number(item.precio_unitario).toFixed(2)} €`, 131, y);
      doc.text(`${lt} €`, 163, y); y += 9;
      doc.setDrawColor(241, 245, 249); doc.line(20, y - 3, 190, y - 3);
    });

    y += 8; doc.setDrawColor(226, 232, 240); doc.line(120, y, 190, y); y += 8;
    doc.setFontSize(10); doc.setTextColor(100, 116, 139);
    if (conIva) {
      doc.text('Subtotal:', 120, y); doc.text(`${subtotal.toFixed(2)} €`, 183, y, { align: 'right' }); y += 8;
      doc.text(`VAT (${ivaRate}%):`, 120, y); doc.text(`${iva.toFixed(2)} €`, 183, y, { align: 'right' }); y += 5;
    }
    doc.line(120, y, 190, y); y += 9;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(15, 23, 42);
    doc.text('TOTAL:', 120, y); doc.text(`${total.toFixed(2)} €`, 183, y, { align: 'right' });

    doc.save(`invoice-${pedidoId.slice(0,8)}.pdf`);
  };

  return (
    <div className="g-page">
      <h1 className="g-page-title">Invoicing</h1>

      <div className="g-card" style={{ marginBottom: 24 }}>
        <div className="g-field">
          <label className="g-label">Select order</label>
          <select className="g-select" value={pedidoId} onChange={e => setPedidoId(e.target.value)}>
            <option value="">— Select an order —</option>
            {pedidos.map(p => (
              <option key={p.id} value={p.id}>
                #{p.id.slice(0,8).toUpperCase()} · {p.clientes?.nombre} · {formatFecha(p)} · {p.estado}
              </option>
            ))}
          </select>
        </div>
        <div className="g-field" style={{ marginBottom: 0 }}>
          <label className="g-label">VAT</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
              <input
                type="checkbox"
                checked={conIva}
                onChange={e => setConIva(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#059669', cursor: 'pointer' }}
              />
              Include VAT
            </label>
            {conIva && (
              <select
                className="g-select"
                style={{ width: 'auto' }}
                value={ivaRate}
                onChange={e => setIvaRate(Number(e.target.value))}
              >
                <option value={4}>4%</option>
                <option value={10}>10%</option>
                <option value={21}>21%</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {loadingItems && <div className="g-loading">Loading invoice...</div>}

      {pedidoId && !loadingItems && items.length > 0 && (
        <>
          <div className="g-invoice">
            <div className="g-invoice-header">
              <div>
                <div className="g-invoice-title">INVOICE</div>
                <div className="g-invoice-ref">#{pedidoId.slice(0,8).toUpperCase()}</div>
              </div>
              <div className="g-invoice-meta">
                <div><strong>Date:</strong> {formatFecha(pedido)}</div>
                <div><strong>Customer:</strong> {pedido?.clientes?.nombre}</div>
                <div><strong>Status: </strong>
                  <span className={`g-badge ${pedido?.estado === 'entregado' ? 'g-badge-green' : 'g-badge-yellow'}`}>{pedido?.estado}</span>
                </div>
              </div>
            </div>

            <div className="g-invoice-divider" />

            <table className="g-table">
              <thead><tr><th>Product</th><th>Quantity</th><th>Unit price</th><th>Line total</th></tr></thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>{item.productos?.nombre}</td>
                    <td>{item.cantidad}</td>
                    <td>{Number(item.precio_unitario).toFixed(2)} €</td>
                    <td style={{ fontWeight: 600 }}>{(Number(item.cantidad) * Number(item.precio_unitario)).toFixed(2)} €</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="g-invoice-divider" />

            <div className="g-invoice-totals">
              {conIva && <div className="g-invoice-total-row"><span>Subtotal</span><span>{subtotal.toFixed(2)} €</span></div>}
              {conIva && <div className="g-invoice-total-row"><span>VAT ({ivaRate}%)</span><span>{iva.toFixed(2)} €</span></div>}
              <div className="g-invoice-total-row main"><span>TOTAL</span><span>{total.toFixed(2)} €</span></div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 28 }}>
            <button className="g-btn g-btn-primary" style={{ padding: '13px 36px', fontSize: 16 }} onClick={generarPDF}>
              <Download size={18} /> Download PDF
            </button>
          </div>
        </>
      )}

      {pedidoId && !loadingItems && items.length === 0 && (
        <div className="g-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <FileText size={44} color="#cbd5e1" style={{ margin: '0 auto 12px', display: 'block' }} />
          <p style={{ color: '#94a3b8' }}>This order has no registered products.</p>
        </div>
      )}
    </div>
  );
}
