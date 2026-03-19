import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Users, ShoppingCart, BarChart2, FileText, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard'   },
  { to: '/productos',   icon: Package,         label: 'Productos'   },
  { to: '/clientes',    icon: Users,           label: 'Clientes'    },
  { to: '/pedidos',     icon: ShoppingCart,    label: 'Pedidos'     },
  { to: '/stock',       icon: BarChart2,       label: 'Stock'       },
  { to: '/facturacion', icon: FileText,        label: 'Facturación' },
];

export default function NavLayout() {
  const { logout } = useAuth();
  const navigate   = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="g-app">
      <nav className="g-nav">
        <span className="g-nav-brand">
          <Package size={20} color="#059669" />
          Gestión
        </span>

        <div className="g-nav-links">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `g-nav-link${isActive ? ' active' : ''}`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>

        <button className="g-nav-logout" onClick={handleLogout}>
          <LogOut size={16} />
          <span>Salir</span>
        </button>
      </nav>

      <Outlet />
    </div>
  );
}
