import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import NavLayout from './components/NavLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Productos from './pages/Productos';
import Clientes from './pages/Clientes';
import Pedidos from './pages/Pedidos';
import Stock from './pages/Stock';
import Facturacion from './pages/Facturacion';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            element={
              <PrivateRoute>
                <NavLayout />
              </PrivateRoute>
            }
          >
            <Route path="/dashboard"   element={<Dashboard />}   />
            <Route path="/productos"   element={<Productos />}   />
            <Route path="/clientes"    element={<Clientes />}    />
            <Route path="/pedidos"     element={<Pedidos />}     />
            <Route path="/stock"       element={<Stock />}       />
            <Route path="/facturacion" element={<Facturacion />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);
