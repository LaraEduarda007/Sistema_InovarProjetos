import { runQuery, getQuery, allQuery } from '../database/connection.js';
import { v4 as uuidv4 } from 'uuid';

// Lista consultores para dropdowns
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

// Lista todos os usuários (admin + consultores) — para Acessos
export async function listarTodos(req, res) {
  try {
    const usuarios = await allQuery(
      `SELECT id, nome, email, perfil, especialidade, status, criado_em
       FROM usuarios
       ORDER BY perfil ASC, nome ASC`
    );
    res.json({ sucesso: true, usuarios });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ erro: 'Erro ao listar usuários' });
  }
}

// Lista consultores com métricas — para Produtividade e Consultores
export async function listarConsultoresComMetricas(req, res) {
  try {
    const consultores = await allQuery(`
      SELECT
        u.id, u.nome, u.email, u.especialidade, u.status,
        COUNT(DISTINCT pc.projeto_id)                                    AS total_projetos,
        COUNT(DISTINCT a.id)                                             AS total_atividades,
        COUNT(DISTINCT CASE WHEN a.status = 'concluido' THEN a.id END)  AS atividades_concluidas,
        COUNT(DISTINCT r.id)                                             AS total_relatorios,
        ROUND(AVG(r.avaliacao_equipe), 1)                                AS media_avaliacao
      FROM usuarios u
      LEFT JOIN projeto_consultor pc ON pc.consultor_id = u.id
      LEFT JOIN atividades a         ON a.consultor_id  = u.id
      LEFT JOIN relatorios r         ON r.consultor_id  = u.id
      WHERE u.perfil = 'consultor'
      GROUP BY u.id
      ORDER BY atividades_concluidas DESC, u.nome ASC
    `);
    res.json({ sucesso: true, consultores });
  } catch (error) {
    console.error('Erro ao listar consultores com métricas:', error);
    res.status(500).json({ erro: 'Erro ao listar consultores' });
  }
}

// Cria novo usuário
export async function criarUsuario(req, res) {
  try {
    const { nome, email, perfil, especialidade } = req.body;

    if (!nome || !email || !perfil) {
      return res.status(400).json({ erro: 'nome, email e perfil são obrigatórios' });
    }

    if (!['admin', 'consultor', 'cliente'].includes(perfil)) {
      return res.status(400).json({ erro: 'Perfil inválido' });
    }

    const existente = await getQuery('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (existente) {
      return res.status(409).json({ erro: 'E-mail já cadastrado' });
    }

    const id = uuidv4();
    await runQuery(
      `INSERT INTO usuarios (id, nome, email, perfil, especialidade, status, criado_em)
       VALUES (?, ?, ?, ?, ?, 'ativo', CURRENT_TIMESTAMP)`,
      [id, nome, email, perfil, especialidade || null]
    );

    res.status(201).json({ sucesso: true, mensagem: 'Usuário criado com sucesso', id });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ erro: 'Erro ao criar usuário' });
  }
}

// Retorna detalhes de um consultor: info + breakdown por projeto
export async function detalheConsultor(req, res) {
  try {
    const { id } = req.params;

    const usuario = await getQuery(
      `SELECT id, nome, email, especialidade, status, criado_em FROM usuarios WHERE id = ?`,
      [id]
    );
    if (!usuario) return res.status(404).json({ erro: 'Consultor não encontrado' });

    const projetos = await allQuery(`
      SELECT
        p.id, p.nome, p.status AS projeto_status, p.cliente,
        COUNT(a.id)                                                    AS total_atividades,
        COUNT(CASE WHEN a.status = 'concluido' THEN 1 END)            AS atividades_concluidas,
        COUNT(CASE WHEN a.status = 'em-andamento' THEN 1 END)         AS em_andamento,
        COUNT(CASE WHEN a.status = 'a-fazer' THEN 1 END)              AS a_fazer,
        COUNT(CASE WHEN a.status = 'nao-realizado' THEN 1 END)        AS nao_realizado,
        COUNT(DISTINCT r.id)                                           AS total_relatorios,
        ROUND(AVG(r.avaliacao_equipe), 1)                              AS media_avaliacao
      FROM projeto_consultor pc
      JOIN projetos p    ON p.id = pc.projeto_id
      LEFT JOIN atividades a ON a.projeto_id = p.id AND a.consultor_id = ?
      LEFT JOIN relatorios r  ON r.projeto_id = p.id AND r.consultor_id = ?
      WHERE pc.consultor_id = ?
      GROUP BY p.id
      ORDER BY p.nome ASC
    `, [id, id, id]);

    res.json({ sucesso: true, usuario, projetos });
  } catch (error) {
    console.error('Erro ao buscar detalhe do consultor:', error);
    res.status(500).json({ erro: 'Erro ao buscar detalhe' });
  }
}

// Atualiza status ou especialidade de um usuário
export async function atualizarUsuario(req, res) {
  try {
    const { id } = req.params;
    const { status, especialidade, nome } = req.body;

    const sets = [];
    const params = [];
    if (status !== undefined)       { sets.push('status = ?');       params.push(status); }
    if (especialidade !== undefined){ sets.push('especialidade = ?'); params.push(especialidade); }
    if (nome !== undefined)         { sets.push('nome = ?');          params.push(nome); }

    if (sets.length === 0) {
      return res.status(400).json({ erro: 'Nenhum campo para atualizar' });
    }

    sets.push('atualizado_em = CURRENT_TIMESTAMP');
    params.push(id);

    await runQuery(`UPDATE usuarios SET ${sets.join(', ')} WHERE id = ?`, params);
    res.json({ sucesso: true, mensagem: 'Usuário atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ erro: 'Erro ao atualizar usuário' });
  }
}
