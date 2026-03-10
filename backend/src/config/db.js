const mysql = require('mysql2/promise'); // Adicionado o /promise
require('dotenv').config();

// Usar createPool é melhor para servidores Express que o createConnection
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Teste de conexão para o Pool (opcional, mas bom para o log)
db.getConnection()
  .then(conn => {
    console.log('Banco de dados conectado');
    conn.release();
  })
  .catch(err => {
    console.error('Erro ao conectar no banco:', err);
  });

module.exports = db;