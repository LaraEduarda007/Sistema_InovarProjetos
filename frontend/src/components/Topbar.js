import React from 'react';
import { useApp } from '../context/AppContext';
import './Topbar.css';

function Topbar({ title, subtitle }) {
  const { usuario } = useApp();

  return (
    <div className="topbar">
      <div>
        <h1 className="topbar-title">{title}</h1>
        {subtitle && <p className="topbar-subtitle">{subtitle}</p>}
      </div>
      <div className="topbar-user">
        <div className="user-avatar">
          {usuario?.nome?.charAt(0)?.toUpperCase()}
        </div>
        <div className="user-info">
          <div className="user-name">{usuario?.nome}</div>
          <div className="user-role">
            {usuario?.perfil === 'admin' ? 'Administrador' : 'Consultor'}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Topbar;
