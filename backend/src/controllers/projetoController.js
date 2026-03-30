import { runQuery, getQuery, allQuery } from '../database/connection.js';
import { v4 as uuidv4 } from 'uuid';

export async function listarProjetos(req, res) {
  try {
    const { perfil, id: usuarioId } = req.usuario;

    let sql = 'SELECT * FROM projetos';
    let params = [];

    // Consultores veem apenas seus projetos
    if (perfil === 'consultor') {
      sql += ` WHERE id IN (
        SELECT projeto_id FROM projeto_consultor WHERE consultor_id = ?
      )`;
      params.push(usuarioId);
    }
    // Clientes veem apenas seu projeto
    else if (perfil === 'cliente') {
      sql += ' WHERE cliente_id = ?';
      params.push(usuarioId);
    }

    sql += ' ORDER BY criado_em DESC';

    const projetos = await allQuery(sql, params);
    res.json({ sucesso: true, projetos });
  } catch (error) {
    console.error('Erro ao listar projetos:', error);
    res.status(500).json({ erro: 'Erro ao listar projetos' });
  }
}

export async function obterProjeto(req, res) {
  try {
    const { id } = req.params;
    const projeto = await getQuery('SELECT * FROM projetos WHERE id = ?', [id]);

    if (!projeto) {
      return res.status(404).json({ erro: 'Projeto não encontrado' });
    }

    // Obter consultores do projeto
    const consultores = await allQuery(`
      SELECT u.id, u.nome, u.email, pc.area_atuacao
      FROM projeto_consultor pc
      JOIN usuarios u ON pc.consultor_id = u.id
      WHERE pc.projeto_id = ?
    `, [id]);

    res.json({ sucesso: true, projeto: { ...projeto, consultores } });
  } catch (error) {
    console.error('Erro ao obter projeto:', error);
    res.status(500).json({ erro: 'Erro ao obter projeto' });
  }
}

export async function criarProjeto(req, res) {
  try {
    const { nome, clienteId, dataInicio, duracaoMeses, consultores } = req.body;
    const { id: usuarioId } = req.usuario;

    if (!nome || !clienteId || !dataInicio) {
      return res.status(400).json({ erro: 'Campos obrigatórios faltando' });
    }

    const projetoId = uuidv4();

    await runQuery(`
      INSERT INTO projetos (id, nome, cliente_id, data_inicio, duracao_meses, criado_por_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [projetoId, nome, clienteId, dataInicio, duracaoMeses || 12, usuarioId]);

    // Adicionar consultores ao projeto
    if (Array.isArray(consultores)) {
      for (const consultor of consultores) {
        await runQuery(`
          INSERT INTO projeto_consultor (projeto_id, consultor_id, area_atuacao)
          VALUES (?, ?, ?)
        `, [projetoId, consultor.id, consultor.area_atuacao]);
      }
    }

    res.status(201).json({
      sucesso: true,
      mensagem: 'Projeto criado com sucesso',
      projetoId
    });
  } catch (error) {
    console.error('Erro ao criar projeto:', error);
    res.status(500).json({ erro: 'Erro ao criar projeto' });
  }
}

export async function atualizarProjeto(req, res) {
  try {
    const { id } = req.params;
    const { nome, status } = req.body;

    await runQuery(
      'UPDATE projetos SET nome = ?, status = ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?',
      [nome, status, id]
    );

    res.json({ sucesso: true, mensagem: 'Projeto atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar projeto:', error);
    res.status(500).json({ erro: 'Erro ao atualizar projeto' });
  }
}

export async function deletarProjeto(req, res) {
  try {
    const { id } = req.params;

    // Verificar se há atividades antes de deletar
    const atividades = await allQuery(
      'SELECT id FROM atividades WHERE projeto_id = ?',
      [id]
    );

    if (atividades.length > 0) {
      return res.status(400).json({
        erro: 'Não é possível deletar um projeto com atividades'
      });
    }

    await runQuery('DELETE FROM projeto_consultor WHERE projeto_id = ?', [id]);
    await runQuery('DELETE FROM projetos WHERE id = ?', [id]);

    res.json({ sucesso: true, mensagem: 'Projeto deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar projeto:', error);
    res.status(500).json({ erro: 'Erro ao deletar projeto' });
  }
}
