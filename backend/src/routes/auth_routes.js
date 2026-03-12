// auth_routes.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");

// login
router.post("/login", async (req, res) => {
  try {
    const { usuario, senha } = req.body;
    const [rows] = await db.query(
      "SELECT id_usuario, nome FROM usuario WHERE usuario = ? AND senha = ?",
      [usuario, senha]
    );

    if (rows.length === 1) {
      // cria sessão
      req.session.usuario = {
        id: rows[0].id_usuario,
        nome: rows[0].nome
      };
      return res.json({ sucesso: true, nome: rows[0].nome });
    } else {
      return res.status(401).json({ sucesso: false, mensagem: "Usuário ou senha incorretos." });
    }

  } catch (error) {
    console.error("Erro no MySQL:", error);
    return res.status(500).json({ sucesso: false, mensagem: "Erro interno no servidor." });
  }
});

// logout
router.get("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).send("Erro ao deslogar");
    res.redirect("/"); // volta para a página de login
  });
});

module.exports = router;