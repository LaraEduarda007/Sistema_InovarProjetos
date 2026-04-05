import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import AdminProjectsPage from './pages/AdminProjectsPage';
import KanbanPage from './pages/KanbanPage';
import RelatoriosPage from './pages/RelatoriosPage';
import CobrancasPage from './pages/CobrancasPage';
import NotificacoesPage from './pages/NotificacoesPage';
import ConsultorDashboard from './pages/ConsultorDashboard';
import ProjetoDetalhePage from './pages/ProjetoDetalhePage';
import ConsultorProjetosPage from './pages/ConsultorProjetosPage';
import PlaceholderPage from './pages/PlaceholderPage';
import ConsultoresPage from './pages/ConsultoresPage';
import DetalheConsultorPage from './pages/DetalheConsultorPage';
import AcessosPage from './pages/AcessosPage';
import ProdutividadePage from './pages/ProdutividadePage';
import ClienteDashboard from './pages/ClienteDashboard';
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
      <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/projetos" element={<ProtectedRoute requiredRole="admin"><AdminProjectsPage /></ProtectedRoute>} />
      <Route path="/admin/projetos/:id" element={<ProtectedRoute requiredRole="admin"><ProjetoDetalhePage /></ProtectedRoute>} />
      <Route path="/admin/kanban" element={<ProtectedRoute requiredRole="admin"><KanbanPage /></ProtectedRoute>} />
      <Route path="/admin/relatorios" element={<ProtectedRoute requiredRole="admin"><RelatoriosPage /></ProtectedRoute>} />
      <Route path="/admin/cobrancas" element={<ProtectedRoute requiredRole="admin"><CobrancasPage /></ProtectedRoute>} />
      <Route path="/admin/produtividade" element={<ProtectedRoute requiredRole="admin"><ProdutividadePage /></ProtectedRoute>} />
      <Route path="/admin/consultores" element={<ProtectedRoute requiredRole="admin"><ConsultoresPage /></ProtectedRoute>} />
      <Route path="/admin/consultores/:id" element={<ProtectedRoute requiredRole="admin"><DetalheConsultorPage /></ProtectedRoute>} />
      <Route path="/admin/acessos" element={<ProtectedRoute requiredRole="admin"><AcessosPage /></ProtectedRoute>} />

      {/* CONSULTOR ROUTES */}
      <Route path="/consultor/dashboard" element={<ProtectedRoute requiredRole="consultor"><ConsultorDashboard /></ProtectedRoute>} />
      <Route path="/consultor/projetos" element={<ProtectedRoute requiredRole="consultor"><ConsultorProjetosPage /></ProtectedRoute>} />
      <Route path="/consultor/projetos/:id" element={<ProtectedRoute requiredRole="consultor"><ProjetoDetalhePage /></ProtectedRoute>} />
      <Route path="/consultor/kanban" element={<ProtectedRoute requiredRole="consultor"><KanbanPage /></ProtectedRoute>} />
      <Route path="/consultor/relatorios" element={<ProtectedRoute requiredRole="consultor"><RelatoriosPage /></ProtectedRoute>} />
      <Route path="/consultor/notificacoes" element={<ProtectedRoute requiredRole="consultor"><NotificacoesPage /></ProtectedRoute>} />

      {/* CLIENTE ROUTES */}
      <Route path="/cliente/dashboard" element={<ProtectedRoute requiredRole="cliente"><ClienteDashboard /></ProtectedRoute>} />

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
