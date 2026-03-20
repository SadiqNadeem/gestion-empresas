import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { getProductos } from '../lib/api';

function StockBadge({ stock }) {
  if (stock === 0) return <span className="g-badge g-badge-red">0 — Out of stock</span>;
  if (stock < 10)  return <span className="g-badge g-badge-yellow">{stock} units — Low</span>;
  return <span className="g-badge g-badge-green">{stock} units</span>;
}

export default function Stock() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => { getProductos().then(setProductos).finally(() => setLoading(false)); }, []);

  const sinStock = productos.filter(p => p.stock === 0);
  const bajos    = productos.filter(p => p.stock > 0 && p.stock < 10);
  const alertas  = sinStock.length + bajos.length;

  return (
    <div className="g-page">
      <h1 className="g-page-title">Stock Control</h1>

      {!loading && alertas > 0 && (
        <div className="g-alert g-alert-warning">
          <AlertTriangle size={20} />
          <span>
            <strong>
              {sinStock.length > 0 && `${sinStock.length} out of stock`}
              {sinStock.length > 0 && bajos.length > 0 && ' · '}
              {bajos.length > 0 && `${bajos.length} low stock`}
            </strong>
            {' '}— Restock the affected products
          </span>
        </div>
      )}

      {!loading && alertas === 0 && productos.length > 0 && (
        <div className="g-alert g-alert-success">
          <CheckCircle size={20} />
          <span>All stock levels are correct</span>
        </div>
      )}

      <div className="g-card">
        {loading ? <div className="g-loading">Loading...</div> :
         productos.length === 0 ? <div className="g-empty">No products found.</div> : (
          <div className="g-table-wrap">
            <table className="g-table">
              <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Current stock</th></tr></thead>
              <tbody>
                {[...productos].sort((a, b) => a.stock - b.stock).map(p => (
                  <tr key={p.id} style={{ background: p.stock === 0 ? '#fff5f5' : p.stock < 10 ? '#fffbeb' : undefined }}>
                    <td style={{ fontWeight: 600 }}>{p.nombre}</td>
                    <td><span className="g-badge g-badge-blue">{p.categoria}</span></td>
                    <td>{Number(p.precio).toFixed(2)} €</td>
                    <td><StockBadge stock={p.stock} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
