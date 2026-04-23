// auth_routes.js
const express = require("express");
const router = express.Router();
const dbPromise = require("../config/db"); // Importa a promessa do banco

// login
router.post("/login", async (req, res) => {
  try {
    const db = await dbPromise; // ESPERA a conexão abrir
    const { usuario, senha } = req.body;

    // No SQLite usamos .get() quando queremos apenas UM registro (mais rápido e limpo)
    // E não usamos [rows], pois ele retorna o objeto direto ou 'undefined'
    const user = await db.get(
      "SELECT id_usuario, nome FROM usuario WHERE usuario = ? AND senha = ?",
      [usuario, senha]
    );

    if (user) {
      // cria sessão
      req.session.usuario = {
        id: user.id_usuario,
        nome: user.nome
      };
      return res.json({ sucesso: true, nome: user.nome });
    } else {
      return res.status(401).json({ sucesso: false, mensagem: "Usuário ou senha incorretos." });
    }

  } catch (error) {
    console.error("Erro no SQLite:", error);
    return res.status(500).json({ sucesso: false, mensagem: "Erro interno no servidor." });
  }
});

// logout
router.get("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).send("Erro ao deslogar");
    res.redirect("/"); 
  });
});

module.exports = router;