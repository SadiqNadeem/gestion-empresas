import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Users, ShoppingCart, AlertTriangle, BarChart2, FileText } from 'lucide-react';
import { getProductos, getClientes, getPedidos, getStockBajo } from '../lib/api';

export default function Dashboard() {
  const [metrics, setMetrics] = useState({ productos: 0, clientes: 0, pendientes: 0, stockBajo: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getProductos(), getClientes(), getPedidos(), getStockBajo()])
      .then(([productos, clientes, pedidos, stockBajo]) => {
        setMetrics({
          productos:  productos.length,
          clientes:   clientes.length,
          pendientes: pedidos.filter(p => p.estado === 'pendiente').length,
          stockBajo:  stockBajo.length,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { icon: <Package size={26} color="#059669" />,                                       value: metrics.productos,  label: 'Total products'    },
    { icon: <Users size={26} color="#2563eb" />,                                         value: metrics.clientes,   label: 'Total customers'   },
    { icon: <ShoppingCart size={26} color="#d97706" />,                                  value: metrics.pendientes, label: 'Pending orders'    },
    { icon: <AlertTriangle size={26} color={metrics.stockBajo > 0 ? '#dc2626' : '#059669'} />, value: metrics.stockBajo,  label: 'Stock alerts' },
  ];

  const buttons = [
    { to: '/productos',   icon: <Package size={34} />,     label: 'Products'  },
    { to: '/clientes',    icon: <Users size={34} />,        label: 'Customers' },
    { to: '/pedidos',     icon: <ShoppingCart size={34} />, label: 'Orders'    },
    { to: '/stock',       icon: <BarChart2 size={34} />,    label: 'Stock'     },
    { to: '/facturacion', icon: <FileText size={34} />,     label: 'Invoicing' },
  ];

  if (loading) return <div className="g-page"><div className="g-loading">Loading...</div></div>;

  return (
    <div className="g-page">
      <h1 className="g-page-title">Dashboard</h1>

      <div className="g-metrics">
        {cards.map((c, i) => (
          <div key={i} className="g-metric">
            <div className="g-metric-icon">{c.icon}</div>
            <div className="g-metric-value">{c.value}</div>
            <div className="g-metric-label">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="g-nav-buttons">
        {buttons.map(b => (
          <Link key={b.to} to={b.to} className="g-nav-btn">
            {b.icon}{b.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
