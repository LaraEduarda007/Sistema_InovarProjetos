import React, { createContext, useState, useCallback, useEffect } from 'react';
import { authService } from '../services/api';

export const AppContext = createContext();

export function AppProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [projetos, setProjetos] = useState([]);
  const [atividadesAtivas, setAtividadesAtivas] = useState([]);

  // Verificar autenticação ao carregar
  useEffect(() => {
    const tokenStorado = localStorage.getItem('token');
    const usuarioStorado = localStorage.getItem('usuario');

    if (tokenStorado && usuarioStorado) {
      setToken(tokenStorado);
      setUsuario(JSON.parse(usuarioStorado));
    }

    setCarregando(false);
  }, []);

  const login = useCallback(async (email, senha) => {
    try {
      setCarregando(true);
      const resultado = await authService.login(email, senha);

      setToken(resultado.token);
      setUsuario(resultado.usuario);
      setErro(null);

      return resultado;
    } catch (erro) {
      setErro(erro.response?.data?.erro || 'Erro ao fazer login');
      throw erro;
    } finally {
      setCarregando(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUsuario(null);
    setToken(null);
    setProjetos([]);
    setAtividadesAtivas([]);
  }, []);

  const value = {
    usuario,
    token,
    carregando,
    erro,
    projetos,
    atividadesAtivas,
    login,
    logout,
    setProjetos,
    setAtividadesAtivas,
    setErro
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = React.useContext(AppContext);
  if (!context) {
    throw new Error('useApp deve ser usado dentro de AppProvider');
  }
  return context;
}
