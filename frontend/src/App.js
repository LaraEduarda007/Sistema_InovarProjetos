import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import AdminProjects from './pages/AdminProjects';
import ConsultorDashboard from './pages/ConsultorDashboard';
import PlaceholderPage from './pages/PlaceholderPage';
import './App.css';

function ProtectedRoute({ children, requiredRole }) {
  const { usuario, carregando } = useApp();

  if (carregando) {
    return <div className="loading">Carregando...</div>;
  }

  if (!usuario) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && usuario.perfil !== requiredRole) {
    return <Navigate to="/login" />;
  }

  return children;
}

function AppContent() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* ADMIN ROUTES */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/projetos"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminProjects />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/kanban"
        element={
          <ProtectedRoute requiredRole="admin">
            <PlaceholderPage title="Kanban" subtitle="Visão geral de atividades por status" />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/relatorios"
        element={
          <ProtectedRoute requiredRole="admin">
            <PlaceholderPage title="Relatórios" subtitle="Todos os relatórios enviados pelos consultores" />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/cobrancas"
        element={
          <ProtectedRoute requiredRole="admin">
            <PlaceholderPage title="Cobranças" subtitle="Atividades sem relatório — cobre e acompanhe consultores" />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/produtividade"
        element={
          <ProtectedRoute requiredRole="admin">
            <PlaceholderPage title="Produtividade" subtitle="Atividades concluídas com relatório ÷ esperadas até hoje" />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/consultores"
        element={
          <ProtectedRoute requiredRole="admin">
            <PlaceholderPage title="Consultores" subtitle="Gerencie os consultores do sistema" />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/acessos"
        element={
          <ProtectedRoute requiredRole="admin">
            <PlaceholderPage title="Acessos" subtitle="Gerencie logins e senhas dos usuários" />
          </ProtectedRoute>
        }
      />

      {/* CONSULTOR ROUTES */}
      <Route
        path="/consultor/dashboard"
        element={
          <ProtectedRoute requiredRole="consultor">
            <ConsultorDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/consultor/projetos"
        element={
          <ProtectedRoute requiredRole="consultor">
            <PlaceholderPage title="Meus Projetos" subtitle="Projetos aos quais você está atribuído" />
          </ProtectedRoute>
        }
      />

      <Route
        path="/consultor/kanban"
        element={
          <ProtectedRoute requiredRole="consultor">
            <PlaceholderPage title="Kanban" subtitle="Todas as suas atividades por status" />
          </ProtectedRoute>
        }
      />

      <Route
        path="/consultor/relatorios"
        element={
          <ProtectedRoute requiredRole="consultor">
            <PlaceholderPage title="Meus Relatórios" subtitle="Histórico de tudo que você registrou" />
          </ProtectedRoute>
        }
      />

      <Route
        path="/consultor/notificacoes"
        element={
          <ProtectedRoute requiredRole="consultor">
            <PlaceholderPage title="Notificações" subtitle="Suas notificações e cobranças" />
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
