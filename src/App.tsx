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
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import CreatePassword from './pages/CreatePassword';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isOAuthWithoutPassword } = useAuth();

  if (loading) return <div className="h-screen flex items-center justify-center">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;

  // Usuário OAuth sem senha: redireciona para criar senha antes de acessar o app
  if (isOAuthWithoutPassword) return <Navigate to="/criar-senha" replace />;

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/esqueci-senha" element={<ForgotPassword />} />
        <Route path="/redefinir-senha" element={<ResetPassword />} />
        <Route path="/criar-senha" element={<CreatePassword />} />
        <Route path="/termos" element={<Terms />} />
        <Route path="/privacidade" element={<Privacy />} />
        
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/receitas" element={<Earnings />} />
          <Route path="/despesas" element={<Expenses />} />
          <Route path="/contas" element={<Wallets />} />
          <Route path="/configuracoes" element={<Settings />} />

          {/* Redirects para manter compatibilidade com links antigos */}
          <Route path="/earnings" element={<Navigate to="/receitas" replace />} />
          <Route path="/expenses" element={<Navigate to="/despesas" replace />} />
          <Route path="/wallets" element={<Navigate to="/contas" replace />} />
          <Route path="/settings" element={<Navigate to="/configuracoes" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
