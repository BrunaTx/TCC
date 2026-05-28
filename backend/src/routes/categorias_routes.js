const express = require("express");
const router = express.Router();
const dbPromise = require("../config/db"); // Importa a promessa de conexão

/* =========================
   LISTAR CATEGORIAS
   ========================= */
router.get("/", async (req, res) => {
  try {
    const db = await dbPromise; // Aguarda a conexão com o SQLite
    
    // Adaptado para better-sqlite3
    const rows = db
      .prepare("SELECT * FROM categoria ORDER BY nome")
      .all();

    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao buscar categorias" });
  }
});

/* =========================
   CRIAR CATEGORIA
   ========================= */
router.post("/", async (req, res) => {
  try {
    const db = await dbPromise;
    const { nome } = req.body;

    // Adaptado para better-sqlite3
    db.prepare(
      "INSERT INTO categoria (nome) VALUES (?)"
    ).run(nome);

    res.json({ sucesso: true });

  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao criar categoria" });
  }
});

/* =========================
   ATUALIZAR CATEGORIA
   ========================= */
router.put("/:id", async (req, res) => {
  try {
    const db = await dbPromise;
    const id = req.params.id;
    const { nome } = req.body;

    // Adaptado para better-sqlite3
    db.prepare(
      "UPDATE categoria SET nome = ? WHERE id_categoria = ?"
    ).run(nome, id);

    res.json({ sucesso: true });

  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao atualizar categoria" });
  }
});

/* =========================
   DELETAR CATEGORIA
   ========================= */
router.delete("/:id", async (req, res) => {
  try {
    const db = await dbPromise;
    const id = req.params.id;

    // Adaptado para better-sqlite3
    db.prepare(
      "DELETE FROM categoria WHERE id_categoria = ?"
    ).run(id);

    res.json({ sucesso: true });

  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao deletar categoria" });
  }
});

module.exports = router;