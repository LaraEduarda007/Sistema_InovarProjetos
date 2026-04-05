import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import './Login.css';

function Login() {
  const navigate = useNavigate();
  const { login, carregando, erro } = useApp();

  const [email, setEmail]               = useState('');
  const [senha, setSenha]               = useState('');
  const [perfil, setPerfil]             = useState('admin');
  const [mostrarSenha, setMostrarSenha] = useState(false);

  // Ao trocar a aba, preenche o e-mail de exemplo para facilitar testes
  const mudarPerfil = (novoPerfil) => {
    setPerfil(novoPerfil);
    if (novoPerfil === 'admin')     setEmail('lara@inovarvarejo.com.br');
    else if (novoPerfil === 'consultor') setEmail('ana@inovarvarejo.com.br');
    else setEmail('');
    setSenha('123456');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const resultado = await login(email, senha);
      const p = resultado.usuario.perfil;
      if (p === 'admin')      navigate('/admin/dashboard');
      else if (p === 'cliente') navigate('/cliente/dashboard');
      else                    navigate('/consultor/dashboard');
    } catch (err) {
      // erro já é tratado no AppContext
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">

        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">IP</div>
          <div>
            <div className="login-logo-nome">Inovar Projetos</div>
            <div className="login-logo-sub">Gestão de consultoria especializada</div>
          </div>
        </div>

        {/* Tabs de perfil */}
        <div className="login-tabs">
          <button
            className={`login-tab ${perfil === 'admin' ? 'ativo' : ''}`}
            onClick={() => mudarPerfil('admin')}
            type="button"
          >
            Administrador
          </button>
          <button
            className={`login-tab ${perfil === 'consultor' ? 'ativo' : ''}`}
            onClick={() => mudarPerfil('consultor')}
            type="button"
          >
            Consultor
          </button>
          <button
            className={`login-tab ${perfil === 'cliente' ? 'ativo' : ''}`}
            onClick={() => mudarPerfil('cliente')}
            type="button"
          >
            Cliente
          </button>
        </div>

        {/* Mensagem de erro */}
        {erro && <div className="login-erro">{erro}</div>}

        {/* Formulário */}
        <form onSubmit={handleLogin}>

          <div className="login-field">
            <label>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@inovarvarejo.com.br"
              disabled={carregando}
              required
            />
          </div>

          <div className="login-field">
            <label>Senha</label>
            <div className="senha-wrap">
              <input
                type={mostrarSenha ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                disabled={carregando}
                required
              />
              <button
                type="button"
                className="senha-toggle"
                onClick={() => setMostrarSenha(!mostrarSenha)}
              >
                {mostrarSenha ? 'OCULTAR' : 'MOSTRAR'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-btn btn"
            disabled={carregando}
          >
            {carregando ? 'Entrando...' : 'Entrar no sistema'}
          </button>
        </form>

        <hr className="login-divider" />
        <p className="login-footer">Acesso restrito · Inovar Varejo Consultoria</p>
      </div>
    </div>
  );
}

export default Login;
