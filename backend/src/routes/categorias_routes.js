const express = require("express");
const router = express.Router();
const db = require("../config/db");

/* =========================
LISTAR CATEGORIAS
========================= */

router.get("/", async (req, res) => {
  try {

    const [rows] = await db.query(
      "SELECT * FROM categoria ORDER BY nome"
    );

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

    const { nome } = req.body;

    await db.query(
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

    const id = req.params.id;
    const { nome } = req.body;

    await db.query(
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

    const id = req.params.id;

    await db.query(
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