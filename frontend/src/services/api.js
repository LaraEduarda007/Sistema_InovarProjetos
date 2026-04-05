import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Autenticação
export const authService = {
  login: async (email, senha) => {
    const response = await api.post('/auth/login', { email, senha });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('usuario', JSON.stringify(response.data.usuario));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  },

  verificarToken: async () => {
    try {
      const response = await api.get('/auth/verificar');
      return response.data;
    } catch (error) {
      localStorage.removeItem('token');
      throw error;
    }
  }
};

// Projetos
export const projetosService = {
  listar: async () => {
    const response = await api.get('/projetos');
    return response.data;
  },

  obter: async (id) => {
    const response = await api.get(`/projetos/${id}`);
    return response.data;
  },

  criar: async (dados) => {
    const response = await api.post('/projetos', dados);
    return response.data;
  },

  atualizar: async (id, dados) => {
    const response = await api.put(`/projetos/${id}`, dados);
    return response.data;
  },

  deletar: async (id) => {
    const response = await api.delete(`/projetos/${id}`);
    return response.data;
  },

  meuProjeto: async () => {
    const response = await api.get('/projetos/cliente');
    return response.data;
  }
};

// Atividades
export const atividadesService = {
  listar: async (projetoId) => {
    const response = await api.get('/atividades', { params: { projetoId } });
    return response.data;
  },

  obter: async (id) => {
    const response = await api.get(`/atividades/${id}`);
    return response.data;
  },

  criar: async (dados) => {
    const response = await api.post('/atividades', dados);
    return response.data;
  },

  atualizar: async (id, dados) => {
    const response = await api.put(`/atividades/${id}`, dados);
    return response.data;
  },

  deletar: async (id) => {
    const response = await api.delete(`/atividades/${id}`);
    return response.data;
  }
};

// Relatórios
export const relatoriosService = {
  listar: async (projetoId) => {
    const response = await api.get('/relatorios', { params: { projetoId: projetoId || '' } });
    return { sucesso: true, relatorios: response.data.relatorios || [] };
  },

  obter: async (id) => {
    const response = await api.get(`/relatorios/${id}`);
    return response.data;
  },

  criar: async (dados) => {
    const response = await api.post('/relatorios', dados);
    return response.data;
  }
};

// Cobranças
export const cobrancasService = {
  listar: async () => {
    const response = await api.get('/cobrancas');
    return response.data;
  },

  obter: async (id) => {
    const response = await api.get(`/cobrancas/${id}`);
    return response.data;
  },

  criar: async (dados) => {
    const response = await api.post('/cobrancas', dados);
    return response.data;
  },

  responder: async (id, resposta) => {
    const response = await api.put(`/cobrancas/${id}/responder`, { resposta });
    return response.data;
  },

  atualizar: async (id, dados) => {
    const response = await api.put(`/cobrancas/${id}`, dados);
    return response.data;
  },

  deletar: async (id) => {
    const response = await api.delete(`/cobrancas/${id}`);
    return response.data;
  }
};

// Notificações
export const notificacoesService = {
  listar: async () => {
    const response = await api.get('/notificacoes');
    return response.data;
  },

  obter: async (id) => {
    const response = await api.get(`/notificacoes/${id}`);
    return response.data;
  },

  criar: async (dados) => {
    const response = await api.post('/notificacoes', dados);
    return response.data;
  },

  marcarComoLida: async (id) => {
    const response = await api.put(`/notificacoes/${id}/lida`);
    return response.data;
  },

  marcarTodasComoLidas: async () => {
    const response = await api.put('/notificacoes/marcar-todas-como-lidas');
    return response.data;
  },

  deletar: async (id) => {
    const response = await api.delete(`/notificacoes/${id}`);
    return response.data;
  }
};

// Usuários / Consultores
export const usuariosService = {
  listarConsultores: async () => {
    const response = await api.get('/usuarios/consultores');
    return response.data;
  },

  listarTodos: async () => {
    const response = await api.get('/usuarios');
    return response.data;
  },

  listarComMetricas: async () => {
    const response = await api.get('/usuarios/consultores/metricas');
    return response.data;
  },

  atualizar: async (id, dados) => {
    const response = await api.put(`/usuarios/${id}`, dados);
    return response.data;
  },

  criar: async (dados) => {
    const response = await api.post('/usuarios', dados);
    return response.data;
  },

  detalhe: async (id) => {
    const response = await api.get(`/usuarios/${id}/detalhes`);
    return response.data;
  }
};

// Resumos de semana
export const semanaResumosService = {
  listar: async (projetoId) => {
    const response = await api.get('/semana-resumos', { params: { projetoId } });
    return response.data;
  },
  salvar: async (dados) => {
    const response = await api.post('/semana-resumos', dados);
    return response.data;
  }
};

export default api;
