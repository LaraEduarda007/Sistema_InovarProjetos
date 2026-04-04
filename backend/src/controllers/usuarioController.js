import { allQuery } from '../database/connection.js';

// Retorna todos os consultores ativos
export async function listarConsultores(req, res) {
  try {
    const consultores = await allQuery(
      `SELECT id, nome, email, especialidade
       FROM usuarios
       WHERE perfil = 'consultor' AND status = 'ativo'
       ORDER BY nome ASC`
    );
    res.json({ sucesso: true, consultores });
  } catch (error) {
    console.error('Erro ao listar consultores:', error);
    res.status(500).json({ erro: 'Erro ao listar consultores' });
  }
}
