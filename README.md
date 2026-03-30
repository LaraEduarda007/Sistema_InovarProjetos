# Inovar Projetos - Sistema de Gestão de Consultoria

Sistema web de gerenciamento de projetos de consultoria especializada para supermercados.

Desenvolvido como Projeto Integrador III-B - PUC Goiás | Análise e Desenvolvimento de Sistemas

---

## Sobre o Projeto

Contexto Extensionista:
Sistema desenvolvido em parceria com a Inovar Varejo Consultoria, para gerenciar projetos de consultoria em supermercados, permitindo acompanhamento de atividades, relatórios e controle de produtividade.

Funcionalidades Principais:
- Autenticação de 2 perfis (Admin, Consultor)
- Gestão de projetos e atividades
- Kanban com status de atividades
- Registro de atividades com fotos e evidências
- Relatórios com data e hora (internos e para apresentação)
- Exportação em PDF e Excel
- Sistema de cobranças e notificações
- Banco de dados persistente com SQLite

---

## Stack Tecnológico

- Frontend: React.js com CSS3 responsivo
- Backend: Node.js com Express.js
- Banco de Dados: SQLite3
- Ferramentas de Exportação: jsPDF e XLSX
- Versionamento: Git e GitHub

---

## Instalação

Pré-requisitos:
- Node.js versão 16 ou superior
- npm ou yarn
- Git

Passo 1: Clonar o repositório
```bash
git clone https://github.com/seu-usuario/inovar-projetos.git
cd inovar-projetos
```

Passo 2: Instalar dependências do Backend
```bash
cd backend
npm install
```

Passo 3: Instalar dependências do Frontend
```bash
cd ../frontend
npm install
```

Passo 4: Configurar variáveis de ambiente
Criar arquivo .env na pasta backend/:
```
PORT=5000
NODE_ENV=development
DATABASE_PATH=./data/inovar.db
```

---

## Executar o Projeto

Terminal 1 - Backend (porta 5000)
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend (porta 3000)
```bash
cd frontend
npm start
```

O frontend abrirá automaticamente em http://localhost:3000

---

## Credenciais de Teste

Admin:
- Email: lara@inovarvarejo.com.br
- Senha: 123456

Consultor:
- Email: ana@inovarvarejo.com.br
- Senha: 123456

Consultores Adicionais:
- Email: carlos@inovarvarejo.com.br
- Email: priya@inovarvarejo.com.br
- Senha: 123456 (para todos)

---

## Estrutura do Projeto

```
inovar-projetos/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── services/
│   │   ├── styles/
│   │   └── App.js
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── middleware/
│   │   ├── database/
│   │   └── server.js
│   ├── data/
│   │   └── inovar.db
│   └── package.json
│
├── docs/
│   └── especificacao.md
│
├── .gitignore
└── README.md
```

---

## Funcionalidades por Perfil

Admin:
- Dashboard com métricas gerais
- Gestão completa de projetos
- Acompanhamento de atividades em tempo real
- Sistema de cobranças e notificações
- Gestão de consultores e seus acessos
- Visualização de relatórios consolidados

Consultor:
- Painel personalizado com informações relevantes
- Visualização de projetos atribuídos
- Kanban de atividades com status
- Registro de atividades com upload de fotos
- Envio de relatórios com observações
- Notificações de cobranças e atualizações

---

## Banco de Dados

O banco SQLite é criado automaticamente na primeira execução com as seguintes tabelas:

- usuarios: informações de login e perfis de acesso
- projetos: projetos ativos e inativos
- atividades: tarefas do projeto organizadas por mês e semana
- relatorios: registros das atividades realizadas
- imagens: fotos e evidências de atividades
- cobrancas: controle de atividades pendentes
- notificacoes: avisos do sistema para usuários
- projeto_consultor: relação entre projetos e consultores



## Referências Técnicas

- React.js: https://react.dev
- Express.js: https://expressjs.com
- SQLite: https://www.sqlite.org
- jsPDF: https://github.com/parallax/jsPDF
- XLSX: https://github.com/SheetJS/sheetjs

---

Status atual: Em desenvolvimento
Data de entrega: 07/04/2026
