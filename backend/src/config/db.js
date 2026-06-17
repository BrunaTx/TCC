const Database = require('better-sqlite3');
const path = require('path');

/**
 * Função que gerencia a conexão e a estrutura do banco de dados.
 * Ela substitui o MySQL/XAMPP para tornar o projeto portátil.
 */
function configurarBanco() {

  const caminhoBanco = path.join(__dirname, '../banco_loja.db');

console.log("BANCO:", caminhoBanco);

const db = new Database(caminhoBanco);

  // Habilita o suporte a chaves estrangeiras
  db.pragma('foreign_keys = ON');

  // 1. CRIAÇÃO DAS TABELAS
  db.exec(`
    CREATE TABLE IF NOT EXISTS categoria (
      id_categoria INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cliente (
      id_cliente INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      cpf TEXT,
      telefone TEXT,
      endereco TEXT,
      ativo INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS produto (
      id_produto INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      id_categoria INTEGER,
      tipo_venda TEXT CHECK(tipo_venda IN ('un', 'kg')),
      preco REAL,
      estoque REAL,
      descricao TEXT,
      codigo_barras TEXT,
      ativo INTEGER DEFAULT 1,
      FOREIGN KEY (id_categoria) REFERENCES categoria(id_categoria)
    );

    CREATE TABLE IF NOT EXISTS usuario (
      id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT,
      usuario TEXT UNIQUE,
      senha TEXT
    );

    CREATE TABLE IF NOT EXISTS venda (
      id_venda INTEGER PRIMARY KEY AUTOINCREMENT,
      id_cliente INTEGER,
      data DATETIME DEFAULT CURRENT_TIMESTAMP,
      pagamento TEXT,
      tipo_cartao TEXT,
      parcelas INTEGER,
      FOREIGN KEY (id_cliente) REFERENCES cliente(id_cliente)
    );

    CREATE TABLE IF NOT EXISTS venda_item (
      id_venda_item INTEGER PRIMARY KEY AUTOINCREMENT,
      id_venda INTEGER,
      id_produto INTEGER,
      quantidade REAL,
      preco REAL,
      FOREIGN KEY (id_venda) REFERENCES venda(id_venda),
      FOREIGN KEY (id_produto) REFERENCES produto(id_produto)
    );
  `);

  // 2. INSERÇÃO DO USUÁRIO PADRÃO
  db.exec(`
    INSERT OR IGNORE INTO usuario (nome, usuario, senha) 
    VALUES ('Administrador', 'essenciamar@gmail.com', 'essenciamar')
  `);

  console.log('--- BANCO DE DADOS PRONTO ---');
  console.log('Arquivo: banco_loja.db gerado com sucesso.');
  console.log('Tabelas verificadas e Usuário Mestre ok.');
  
  return db;
}

module.exports = configurarBanco();