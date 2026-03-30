import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import './Login.css';

function Login() {
  const navigate = useNavigate();
  const { login, carregando, erro } = useApp();

  const [email, setEmail] = useState('lara@inovarvarejo.com.br');
  const [senha, setSenha] = useState('123456');
  const [perfil, setPerfil] = useState('admin');
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const credenciais = {
    admin: { email: 'lara@inovarvarejo.com.br', senha: '123456' },
    consultor: { email: 'ana@inovarvarejo.com.br', senha: '123456' }
  };

  const mudarPerfil = (novoPerfil) => {
    setPerfil(novoPerfil);
    setEmail(credenciais[novoPerfil].email);
    setSenha(credenciais[novoPerfil].senha);
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const resultado = await login(email, senha);

      // Redirecionar baseado no perfil
      switch (resultado.usuario.perfil) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'consultor':
          navigate('/consultor/dashboard');
          break;
        default:
          navigate('/');
      }
    } catch (erro) {
      console.error('Erro no login:', erro);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-icon">IP</div>
          <div>
            <div className="logo-name">Inovar Projetos</div>
            <div className="logo-subtitle">Gestão de consultoria especializada</div>
          </div>
        </div>

        <div className="tabs-perfis">
          <button
            className={`tab-perfil ${perfil === 'admin' ? 'ativo' : ''}`}
            onClick={() => mudarPerfil('admin')}
          >
            Admin
          </button>
          <button
            className={`tab-perfil ${perfil === 'consultor' ? 'ativo' : ''}`}
            onClick={() => mudarPerfil('consultor')}
          >
            Consultor
          </button>
        </div>

        {erro && <div className="erro-msg">{erro}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              disabled={carregando}
            />
          </div>

          <div className="form-group">
            <label>Senha</label>
            <div className="password-input">
              <input
                type={mostrarSenha ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                disabled={carregando}
              />
              <button
                type="button"
                className="toggle-senha"
                onClick={() => setMostrarSenha(!mostrarSenha)}
              >
                {mostrarSenha ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-login"
            disabled={carregando}
          >
            {carregando ? 'Entrando...' : 'Entrar no sistema'}
          </button>
        </form>

        <hr className="divider" />
        <p className="footer-text">
          Acesso restrito · Inovar Varejo Consultoria
        </p>
      </div>
    </div>
  );
}

export default Login;
