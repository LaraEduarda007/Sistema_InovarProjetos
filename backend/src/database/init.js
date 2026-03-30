import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdir } from 'fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '../../data/inovar.db');

async function initDatabase() {
  try {
    // Criar diretório data se não existir
    await mkdir(join(__dirname, '../../data'), { recursive: true });

    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath, (err) => {
        if (err) reject(err);

        console.log('📦 Inicializando banco de dados SQLite...');

        // Criar tabelas
        db.serialize(() => {
          // Tabela de Usuários
          db.run(`
            CREATE TABLE IF NOT EXISTS usuarios (
              id TEXT PRIMARY KEY,
              nome TEXT NOT NULL,
              email TEXT UNIQUE NOT NULL,
              senha TEXT NOT NULL,
              perfil TEXT NOT NULL CHECK(perfil IN ('admin', 'consultor', 'cliente')),
              especialidade TEXT,
              status TEXT DEFAULT 'ativo',
              criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
              atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `);

          // Tabela de Projetos
          db.run(`
            CREATE TABLE IF NOT EXISTS projetos (
              id TEXT PRIMARY KEY,
              nome TEXT NOT NULL,
              cliente_id TEXT NOT NULL,
              data_inicio DATE NOT NULL,
              duracao_meses INTEGER DEFAULT 12,
              status TEXT DEFAULT 'ativo' CHECK(status IN ('ativo', 'pausado', 'concluido')),
              criado_por_id TEXT NOT NULL,
              criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
              atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY(cliente_id) REFERENCES usuarios(id),
              FOREIGN KEY(criado_por_id) REFERENCES usuarios(id)
            )
          `);

          // Tabela de Projeto-Consultor (N:N)
          db.run(`
            CREATE TABLE IF NOT EXISTS projeto_consultor (
              projeto_id TEXT NOT NULL,
              consultor_id TEXT NOT NULL,
              area_atuacao TEXT,
              PRIMARY KEY(projeto_id, consultor_id),
              FOREIGN KEY(projeto_id) REFERENCES projetos(id),
              FOREIGN KEY(consultor_id) REFERENCES usuarios(id)
            )
          `);

          // Tabela de Atividades
          db.run(`
            CREATE TABLE IF NOT EXISTS atividades (
              id TEXT PRIMARY KEY,
              projeto_id TEXT NOT NULL,
              mes INTEGER NOT NULL CHECK(mes BETWEEN 1 AND 12),
              semana INTEGER NOT NULL CHECK(semana BETWEEN 1 AND 4),
              setor TEXT NOT NULL,
              titulo TEXT NOT NULL,
              observacao TEXT,
              status TEXT DEFAULT 'a_fazer' CHECK(status IN ('a_fazer', 'em_andamento', 'concluido', 'nao_realizado')),
              consultor_id TEXT NOT NULL,
              data_prevista DATE,
              data_realizacao DATETIME,
              criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
              atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY(projeto_id) REFERENCES projetos(id),
              FOREIGN KEY(consultor_id) REFERENCES usuarios(id)
            )
          `);

          // Tabela de Relatórios
          db.run(`
            CREATE TABLE IF NOT EXISTS relatorios (
              id TEXT PRIMARY KEY,
              atividade_id TEXT NOT NULL UNIQUE,
              o_que_foi_realizado TEXT,
              dificuldades TEXT,
              proximos_passos TEXT,
              avaliacao_equipe INTEGER CHECK(avaliacao_equipe BETWEEN 1 AND 5),
              observacoes TEXT,
              enviado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
              consultor_id TEXT NOT NULL,
              FOREIGN KEY(atividade_id) REFERENCES atividades(id),
              FOREIGN KEY(consultor_id) REFERENCES usuarios(id)
            )
          `);

          // Tabela de Imagens/Evidências
          db.run(`
            CREATE TABLE IF NOT EXISTS imagens (
              id TEXT PRIMARY KEY,
              relatorio_id TEXT,
              atividade_id TEXT,
              dados_base64 LONGTEXT NOT NULL,
              nome_original TEXT,
              tipo_mime TEXT,
              criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY(relatorio_id) REFERENCES relatorios(id),
              FOREIGN KEY(atividade_id) REFERENCES atividades(id)
            )
          `);

          // Tabela de Cobranças
          db.run(`
            CREATE TABLE IF NOT EXISTS cobrancas (
              id TEXT PRIMARY KEY,
              admin_id TEXT NOT NULL,
              consultor_id TEXT NOT NULL,
              mensagem TEXT,
              prazo DATE,
              urgencia TEXT DEFAULT 'normal' CHECK(urgencia IN ('normal', 'urgente')),
              status TEXT DEFAULT 'aberta' CHECK(status IN ('aberta', 'resolvida')),
              enviada_em DATETIME DEFAULT CURRENT_TIMESTAMP,
              resolvida_em DATETIME,
              FOREIGN KEY(admin_id) REFERENCES usuarios(id),
              FOREIGN KEY(consultor_id) REFERENCES usuarios(id)
            )
          `);

          // Tabela de Cobrança-Atividade (N:N)
          db.run(`
            CREATE TABLE IF NOT EXISTS cobranca_atividade (
              cobranca_id TEXT NOT NULL,
              atividade_id TEXT NOT NULL,
              PRIMARY KEY(cobranca_id, atividade_id),
              FOREIGN KEY(cobranca_id) REFERENCES cobrancas(id),
              FOREIGN KEY(atividade_id) REFERENCES atividades(id)
            )
          `);

          // Tabela de Notificações
          db.run(`
            CREATE TABLE IF NOT EXISTS notificacoes (
              id TEXT PRIMARY KEY,
              usuario_id TEXT NOT NULL,
              tipo TEXT NOT NULL,
              titulo TEXT NOT NULL,
              mensagem TEXT,
              lida BOOLEAN DEFAULT 0,
              criada_em DATETIME DEFAULT CURRENT_TIMESTAMP,
              referencia_id TEXT,
              FOREIGN KEY(usuario_id) REFERENCES usuarios(id)
            )
          `, (err) => {
            if (err) {
              console.error('❌ Erro ao criar tabelas:', err);
              reject(err);
            } else {
              console.log('✅ Tabelas criadas com sucesso!');
              insertDefaultData(db, resolve, reject);
            }
          });
        });
      });
    });
  } catch (error) {
    console.error('❌ Erro ao inicializar banco:', error);
    throw error;
  }
}

function insertDefaultData(db, resolve, reject) {
  const usuarios = [
    {
      id: 'admin-001',
      nome: 'Lara Assis',
      email: 'lara@inovarvarejo.com.br',
      senha: '$2a$10$K7DY7aV.V2B/LQqPzqB7L.0y0nTQw8qJ8C0L4l0nTQw8qJ8C0L4l0', // 123456
      perfil: 'admin',
      especialidade: 'Administração'
    },
    {
      id: 'consultor-001',
      nome: 'Ana Lima',
      email: 'ana@inovarvarejo.com.br',
      senha: '$2a$10$K7DY7aV.V2B/LQqPzqB7L.0y0nTQw8qJ8C0L4l0nTQw8qJ8C0L4l0', // 123456
      perfil: 'consultor',
      especialidade: 'RH e Processos'
    },
    {
      id: 'consultor-002',
      nome: 'Carlos Mota',
      email: 'carlos@inovarvarejo.com.br',
      senha: '$2a$10$K7DY7aV.V2B/LQqPzqB7L.0y0nTQw8qJ8C0L4l0nTQw8qJ8C0L4l0', // 123456
      perfil: 'consultor',
      especialidade: 'Financeiro'
    },
    {
      id: 'consultor-003',
      nome: 'Priya Souza',
      email: 'priya@inovarvarejo.com.br',
      senha: '$2a$10$K7DY7aV.V2B/LQqPzqB7L.0y0nTQw8qJ8C0L4l0nTQw8qJ8C0L4l0', // 123456
      perfil: 'consultor',
      especialidade: 'Operações'
    }
  ];

  let inserted = 0;
  usuarios.forEach((usuario) => {
    db.run(
      `INSERT OR IGNORE INTO usuarios (id, nome, email, senha, perfil, especialidade) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [usuario.id, usuario.nome, usuario.email, usuario.senha, usuario.perfil, usuario.especialidade],
      (err) => {
        if (err) {
          console.error('❌ Erro ao inserir usuário:', err);
        } else {
          inserted++;
          if (inserted === usuarios.length) {
            console.log('✅ Dados padrão inseridos com sucesso!');
            db.close();
            resolve();
          }
        }
      }
    );
  });
}

// Executar inicialização
initDatabase().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
