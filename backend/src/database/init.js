import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdir } from 'fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '../../data/inovar.db');

async function initDatabase() {
  try {
    await mkdir(join(__dirname, '../../data'), { recursive: true });

    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath, (err) => {
        if (err) reject(err);

        console.log('📦 Inicializando banco de dados SQLite...');

        db.serialize(() => {
          // Tabela de Usuários
          db.run(`
            CREATE TABLE IF NOT EXISTS usuarios (
              id TEXT PRIMARY KEY,
              nome TEXT NOT NULL,
              email TEXT UNIQUE NOT NULL,
              senha TEXT NOT NULL,
              perfil TEXT NOT NULL,
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
              cliente_id TEXT,
              data_inicio DATE NOT NULL,
              duracao_meses INTEGER DEFAULT 12,
              status TEXT DEFAULT 'ativo',
              criado_por_id TEXT,
              criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
              atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `);

          // Tabela de Projeto-Consultor
          db.run(`
            CREATE TABLE IF NOT EXISTS projeto_consultor (
              projeto_id TEXT NOT NULL,
              consultor_id TEXT NOT NULL,
              area_atuacao TEXT,
              PRIMARY KEY(projeto_id, consultor_id)
            )
          `);

          // Tabela de Atividades
          db.run(`
            CREATE TABLE IF NOT EXISTS atividades (
              id TEXT PRIMARY KEY,
              projeto_id TEXT NOT NULL,
              mes INTEGER NOT NULL,
              semana INTEGER NOT NULL,
              setor TEXT NOT NULL,
              titulo TEXT NOT NULL,
              observacao TEXT,
              consultor_id TEXT,
              data_prevista DATE,
              data_realizacao DATE,
              status TEXT DEFAULT 'a-fazer',
              criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
              atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
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
              avaliacao_equipe INTEGER,
              observacoes TEXT,
              enviado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
              consultor_id TEXT NOT NULL
            )
          `);

          // Tabela de Imagens
          db.run(`
            CREATE TABLE IF NOT EXISTS imagens (
              id TEXT PRIMARY KEY,
              relatorio_id TEXT,
              atividade_id TEXT,
              dados_base64 LONGTEXT NOT NULL,
              nome_original TEXT,
              tipo_mime TEXT,
              criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `);

          // Tabela de Cobranças
          db.run(`
            CREATE TABLE IF NOT EXISTS cobrancas (
              id TEXT PRIMARY KEY,
              admin_id TEXT,
              consultor_id TEXT,
              mensagem TEXT,
              prazo DATE,
              urgencia TEXT DEFAULT 'normal',
              status TEXT DEFAULT 'aberta',
              enviada_em DATETIME DEFAULT CURRENT_TIMESTAMP,
              resolvida_em DATETIME
            )
          `);

          // Tabela de Cobrança-Atividade
          db.run(`
            CREATE TABLE IF NOT EXISTS cobranca_atividade (
              cobranca_id TEXT NOT NULL,
              atividade_id TEXT NOT NULL,
              PRIMARY KEY(cobranca_id, atividade_id)
            )
          `);

          // Tabela de Notificações
          db.run(`
            CREATE TABLE IF NOT EXISTS notificacoes (
              id TEXT PRIMARY KEY,
              usuario_id TEXT NOT NULL,
              tipo TEXT NOT NULL,
              titulo TEXT NOT NULL,
              mensagem TEXT NOT NULL,
              relacao_tipo TEXT,
              relacao_id TEXT,
              lida INTEGER DEFAULT 0,
              data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
              data_leitura DATETIME
            )
          `);

          db.all('SELECT COUNT(*) as count FROM sqlite_master WHERE type="table"', (err, rows) => {
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
      senha: '$2a$10$K7DY7aV.V2B/LQqPzqB7L.0y0nTQw8qJ8C0L4l0nTQw8qJ8C0L4l0',
      perfil: 'admin',
      especialidade: 'Administração'
    },
    {
      id: 'consultor-001',
      nome: 'Ana Lima',
      email: 'ana@inovarvarejo.com.br',
      senha: '$2a$10$K7DY7aV.V2B/LQqPzqB7L.0y0nTQw8qJ8C0L4l0nTQw8qJ8C0L4l0',
      perfil: 'consultor',
      especialidade: 'RH e Processos'
    },
    {
      id: 'consultor-002',
      nome: 'Carlos Mota',
      email: 'carlos@inovarvarejo.com.br',
      senha: '$2a$10$K7DY7aV.V2B/LQqPzqB7L.0y0nTQw8qJ8C0L4l0nTQw8qJ8C0L4l0',
      perfil: 'consultor',
      especialidade: 'Financeiro'
    },
    {
      id: 'consultor-003',
      nome: 'Priya Souza',
      email: 'priya@inovarvarejo.com.br',
      senha: '$2a$10$K7DY7aV.V2B/LQqPzqB7L.0y0nTQw8qJ8C0L4l0nTQw8qJ8C0L4l0',
      perfil: 'consultor',
      especialidade: 'Operações'
    }
  ];

  const projetos = [
    {
      id: 'proj-001',
      nome: 'Supermercado Bom Preço',
      cliente_id: 'admin-001',
      data_inicio: '2026-01-15',
      duracao_meses: 12,
      status: 'ativo',
      criado_por_id: 'admin-001'
    },
    {
      id: 'proj-002',
      nome: 'Mercado Serra Verde',
      cliente_id: 'admin-001',
      data_inicio: '2026-02-01',
      duracao_meses: 12,
      status: 'ativo',
      criado_por

initDatabase().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});

export async function db() {
  return new Promise((resolve) => {
    const database = new sqlite3.Database(dbPath);
    resolve(database);
  });
}
