import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import './Sidebar.css';

const menuAdmin = [
  { id: 'dashboard',     label: 'Painel geral',   path: '/admin/dashboard' },
  { id: 'projetos',      label: 'Projetos',        path: '/admin/projetos' },
  { id: 'kanban',        label: 'Kanban',          path: '/admin/kanban' },
  { id: 'relatorios',    label: 'Relatórios',      path: '/admin/relatorios' },
  { id: 'sep1', sep: true },
  { id: 'cobrancas',     label: 'Cobranças',       path: '/admin/cobrancas', badge: true },
  { id: 'produtividade', label: 'Produtividade',   path: '/admin/produtividade' },
  { id: 'sep2', sep: true },
  { id: 'consultores',   label: 'Consultores',     path: '/admin/consultores' },
  { id: 'acessos',       label: 'Acessos',         path: '/admin/acessos' },
];

const menuConsultor = [
  { id: 'dashboard',     label: 'Meu painel',      path: '/consultor/dashboard' },
  { id: 'projetos',      label: 'Meus projetos',   path: '/consultor/projetos' },
  { id: 'kanban',        label: 'Kanban',           path: '/consultor/kanban' },
  { id: 'relatorios',    label: 'Meus relatórios', path: '/consultor/relatorios' },
  { id: 'sep1', sep: true },
  { id: 'notificacoes',  label: 'Notificações',    path: '/consultor/notificacoes', badge: true },
];

function Sidebar({ badgeCount }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario, logout } = useApp();

  if (!usuario) return null;

  const isAdmin = usuario.perfil === 'admin';
  const menu = isAdmin ? menuAdmin : menuConsultor;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className={`sidebar ${isAdmin ? 'sidebar-admin' : 'sidebar-consultor'}`}>

      {/* Logo */}
      <div className="sb-logo">
        <div className="sb-logo-icon">IP</div>
        <span className="sb-logo-text">Inovar Projetos</span>
      </div>

      {/* Itens de menu */}
      <div className="sb-menu">
        {menu.map((item) => {
          if (item.sep) return <div key={item.id} className="sb-sep" />;

          const ativo = location.pathname === item.path;

          return (
            <button
              key={item.id}
              className={`sb-item ${ativo ? 'ativo' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="sb-dot" />
              <span className="sb-label">{item.label}</span>
              {item.badge && badgeCount > 0 && (
                <span className="sb-badge">{badgeCount}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sair */}
      <div className="sb-footer">
        <button className="sb-item" onClick={handleLogout}>
          <span className="sb-dot" />
          <span className="sb-label">Sair</span>
        </button>
      </div>
    </nav>
  );
}

export default Sidebar;
