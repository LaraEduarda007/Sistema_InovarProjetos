import { runQuery, getQuery, allQuery } from '../database/connection.js';
import { v4 as uuidv4 } from 'uuid';

export async function listarProjetos(req, res) {
  try {
    const projetos = await allQuery(`
  SELECT 
    p.id,
    p.nome,
    p.status,
    p.duracao_meses,
    u.nome as consultor_nome
  FROM projetos p
  LEFT JOIN projeto_consultor pc ON pc.projeto_id = p.id
  LEFT JOIN usuarios u ON u.id = pc.consultor_id
  ORDER BY p.criado_em DESC
`);

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
    const { 
      nome, 
      nome_cliente, 
      dataInicio, 
      data_inicio, 
      duracaoMeses, 
      duracao_meses,
      consultor_id
    } = req.body;

    const { id: usuarioId } = req.usuario;

    const nomeCliente = nome_cliente || nome;
    const dataI = data_inicio || dataInicio;
    const duracao = duracao_meses || duracaoMeses || 12;

    if (!nomeCliente || !dataI || !consultor_id) {
      return res.status(400).json({ 
        erro: 'Nome, data de início e consultor são obrigatórios' 
      });
    }

    const projetoId = uuidv4();

    await runQuery(
      `INSERT INTO projetos 
      (id, nome, cliente_id, data_inicio, duracao_meses, criado_por_id) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      [projetoId, nomeCliente, 'admin-001', dataI, duracao, usuarioId || 'admin-001']
    );

    // 🔥 AQUI ESTÁ O PULO DO GATO
    await runQuery(
      `INSERT INTO projeto_consultor (projeto_id, consultor_id)
       VALUES (?, ?)`,
      [projetoId, consultor_id]
    );

    res.status(201).json({
      sucesso: true,
      mensagem: 'Projeto criado com sucesso',
      projeto: {
        id: projetoId,
        nome: nomeCliente,
        data_inicio: dataI,
        duracao_meses: duracao,
        consultor_id,
        status: 'ativo'
      }
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
