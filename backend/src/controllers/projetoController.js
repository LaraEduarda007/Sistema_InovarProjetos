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
    p.data_inicio,
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
      consultor_id,
      objetivo,
      clienteUserId
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
      (id, nome, cliente_id, data_inicio, duracao_meses, objetivo, criado_por_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [projetoId, nomeCliente, clienteUserId || null, dataI, duracao, objetivo || null, usuarioId || 'admin-001']
    );

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

// Portal do cliente — retorna o projeto vinculado ao cliente logado
export async function projetoDoCliente(req, res) {
  try {
    const { id: clienteId } = req.usuario;

    const projeto = await getQuery(
      'SELECT * FROM projetos WHERE cliente_id = ?',
      [clienteId]
    );

    if (!projeto) {
      return res.status(404).json({ erro: 'Nenhum projeto vinculado a este cliente' });
    }

    // Consultores
    const consultores = await allQuery(`
      SELECT u.id, u.nome, u.email, u.especialidade, pc.area_atuacao
      FROM projeto_consultor pc
      JOIN usuarios u ON pc.consultor_id = u.id
      WHERE pc.projeto_id = ?
    `, [projeto.id]);

    // Atividades com status
    const atividades = await allQuery(`
      SELECT a.*, u.nome as consultor_nome
      FROM atividades a
      LEFT JOIN usuarios u ON u.id = a.consultor_id
      WHERE a.projeto_id = ?
      ORDER BY a.mes ASC, a.semana ASC
    `, [projeto.id]);

    // Progresso por mês
    const meses = {};
    for (const a of atividades) {
      if (!meses[a.mes]) meses[a.mes] = { total: 0, concluidas: 0 };
      meses[a.mes].total++;
      if (a.status === 'concluido') meses[a.mes].concluidas++;
    }

    const progressoPorMes = Object.entries(meses).map(([mes, dados]) => ({
      mes: parseInt(mes),
      total: dados.total,
      concluidas: dados.concluidas,
      pct: dados.total ? Math.round((dados.concluidas / dados.total) * 100) : 0
    })).sort((a, b) => a.mes - b.mes);

    const totalAtiv = atividades.length;
    const totalConc = atividades.filter(a => a.status === 'concluido').length;
    const totalAndamento = atividades.filter(a => a.status === 'em-andamento').length;
    const pctGlobal = totalAtiv ? Math.round((totalConc / totalAtiv) * 100) : 0;

    // Mês atual (primeira com atividades não concluídas)
    const mesAtual = atividades.find(a => a.status !== 'concluido')?.mes || projeto.duracao_meses;

    res.json({
      sucesso: true,
      projeto,
      consultores,
      atividades,
      progressoPorMes,
      metricas: { totalAtiv, totalConc, totalAndamento, pctGlobal, mesAtual }
    });
  } catch (error) {
    console.error('Erro ao buscar projeto do cliente:', error);
    res.status(500).json({ erro: 'Erro ao buscar projeto' });
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

    // Busca atividades do projeto para deletar em cascata
    const atividades = await allQuery(
      'SELECT id FROM atividades WHERE projeto_id = ?',
      [id]
    );

    // Deleta relatórios vinculados às atividades do projeto
    for (const atv of atividades) {
      await runQuery('DELETE FROM relatorios WHERE atividade_id = ?', [atv.id]);
    }

    // Deleta atividades do projeto
    await runQuery('DELETE FROM atividades WHERE projeto_id = ?', [id]);

    // Deleta vínculo com consultores
    await runQuery('DELETE FROM projeto_consultor WHERE projeto_id = ?', [id]);

    // Deleta o projeto
    await runQuery('DELETE FROM projetos WHERE id = ?', [id]);

    res.json({ sucesso: true, mensagem: 'Projeto deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar projeto:', error);
    res.status(500).json({ erro: 'Erro ao deletar projeto' });
  }
}
