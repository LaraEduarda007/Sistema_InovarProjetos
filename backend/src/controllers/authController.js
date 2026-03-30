import { getQuery } from '../database/connection.js';
import { gerarToken } from '../middleware/auth.js';

export async function login(req, res) {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
    }

    const usuario = await getQuery(
      'SELECT * FROM usuarios WHERE email = ?',
      [email]
    );

    if (!usuario) {
      return res.status(401).json({ erro: 'Email ou senha incorretos' });
    }

    // Para desenvolvimento, aceitar qualquer senha "123456"
    if (senha !== '123456') {
      return res.status(401).json({ erro: 'Email ou senha incorretos' });
    }

    const token = gerarToken(usuario);

    res.json({
      sucesso: true,
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        especialidade: usuario.especialidade
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ erro: 'Erro ao fazer login' });
  }
}

export async function verificarToken(req, res) {
  res.json({
    sucesso: true,
    usuario: req.usuario
  });
}
