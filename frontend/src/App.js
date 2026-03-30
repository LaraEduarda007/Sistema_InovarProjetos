import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Login from './pages/Login';
import './App.css';

function ProtectedRoute({ children }) {
  const { usuario, carregando } = useApp();

  if (carregando) {
    return <div className="loading">Carregando...</div>;
  }

  if (!usuario) {
    return <Navigate to="/login" />;
  }

  return children;
}

function AppContent() {
  const { usuario } = useApp();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Rotas Admin */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute>
            <div className="admin-placeholder">
              <h1>✅ Dashboard Admin Funcionando!</h1>
              <p>Usuário: {usuario?.nome}</p>
              <p>Email: {usuario?.email}</p>
              <p>Página em desenvolvimento...</p>
            </div>
          </ProtectedRoute>
        }
      />

      {/* Rotas Consultor */}
      <Route
        path="/consultor/*"
        element={
          <ProtectedRoute>
            <div className="consultor-placeholder">
              <h1>✅ Dashboard Consultor Funcionando!</h1>
              <p>Usuário: {usuario?.nome}</p>
              <p>Especialidade: {usuario?.especialidade}</p>
              <p>Página em desenvolvimento...</p>
            </div>
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to="/login" />} />
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
