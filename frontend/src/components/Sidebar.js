import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import './Sidebar.css';

function Sidebar() {
  const navigate = useNavigate();
  const { usuario, logout } = useApp();

  if (!usuario) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuAdmin = [
    { id: 'dashboard', label: 'Painel geral', path: '/admin/dashboard' },
    { id: 'projetos', label: 'Projetos', path: '/admin/projetos' },
    { id: 'kanban', label: 'Kanban', path: '/admin/kanban' },
    { id: 'relatorios', label: 'Relatórios', path: '/admin/relatorios' },
    { id: 'cobrancas', label: 'Cobranças', path: '/admin/cobrancas' },
    { id: 'produtividade', label: 'Produtividade', path: '/admin/produtividade' },
    { id: 'consultores', label: 'Consultores', path: '/admin/consultores' },
    { id: 'acessos', label: 'Acessos', path: '/admin/acessos' }
  ];

  const menuConsultor = [
    { id: 'dashboard', label: 'Meu painel', path: '/consultor/dashboard' },
    { id: 'projetos', label: 'Meus projetos', path: '/consultor/projetos' },
    { id: 'kanban', label: 'Kanban', path: '/consultor/kanban' },
    { id: 'relatorios', label: 'Meus relatórios', path: '/consultor/relatorios' },
    { id: 'notificacoes', label: 'Notificações', path: '/consultor/notificacoes' }
  ];

  const menu = usuario.perfil === 'admin' ? menuAdmin : menuConsultor;

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">IP</div>
          <div className="logo-text">
            <div className="logo-name">Inovar Projetos</div>
          </div>
        </div>
      </div>

      <div className="sidebar-menu">
        {menu.map(item => (
          <button
            key={item.id}
            className="menu-item"
            onClick={() => navigate(item.path)}
          >
            <span className="menu-icon">•</span>
            <span className="menu-label">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <span className="menu-icon">•</span>
          <span>Sair</span>
        </button>
      </div>
    </nav>
  );
}

export default Sidebar;
