const express = require("express");
const router = express.Router();
const dbPromise = require("../config/db"); // Importa a promessa de conexão

/* =========================
   LISTAR CATEGORIAS
   ========================= */
router.get("/", async (req, res) => {
  try {
    const db = await dbPromise; // Aguarda a conexão com o SQLite
    
    // No SQLite usamos .all() para buscar uma lista
    const rows = await db.all("SELECT * FROM categoria ORDER BY nome");

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

    // No SQLite usamos .run() para comandos de alteração/inserção
    await db.run(
      "INSERT INTO categoria (nome) VALUES (?)",
      [nome]
    );

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

    await db.run(
      "UPDATE categoria SET nome = ? WHERE id_categoria = ?",
      [nome, id]
    );

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

    await db.run(
      "DELETE FROM categoria WHERE id_categoria = ?",
      [id]
    );

    res.json({ sucesso: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao deletar categoria" });
  }
});

module.exports = router;