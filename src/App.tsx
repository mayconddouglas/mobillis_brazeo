import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppLayout from './components/layout/AppLayout';

import Dashboard from './pages/Dashboard';
import Earnings from './pages/Earnings';
import Expenses from './pages/Expenses';
import Wallets from './pages/Wallets';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Signup from './pages/Signup';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="h-screen flex items-center justify-center">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/receitas" element={<Earnings />} />
          <Route path="/despesas" element={<Expenses />} />
          <Route path="/contas" element={<Wallets />} />
          <Route path="/configuracoes" element={<Settings />} />

          <Route path="/earnings" element={<Navigate to="/receitas" replace />} />
          <Route path="/expenses" element={<Navigate to="/despesas" replace />} />
          <Route path="/wallets" element={<Navigate to="/contas" replace />} />
          <Route path="/settings" element={<Navigate to="/configuracoes" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
