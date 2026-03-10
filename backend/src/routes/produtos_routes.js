const express = require("express");
const router = express.Router();
const db = require("../config/db");

// =========================
// LISTAR TODOS OS PRODUTOS
// =========================
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        p.id_produto,
        p.nome,
        p.id_categoria,
        c.nome AS categoria,
        p.tipo_venda,
        p.preco,
        p.estoque,
        p.descricao
      FROM produto p
      JOIN categoria c
        ON p.id_categoria = c.id_categoria
      ORDER BY p.nome
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao listar produtos." });
  }
});

// =========================
// LISTAR PRODUTOS POR CATEGORIA
// =========================
router.get("/categoria/:id", async (req, res) => {
  try {
    const id_categoria = req.params.id;
    const [rows] = await db.query(`
      SELECT 
        p.id_produto,
        p.nome,
        p.id_categoria,
        c.nome AS categoria,
        p.tipo_venda,
        p.preco,
        p.estoque,
        p.descricao
      FROM produto p
      JOIN categoria c
        ON p.id_categoria = c.id_categoria
      WHERE p.id_categoria = ?
      ORDER BY p.nome
    `, [id_categoria]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao listar produtos da categoria." });
  }
});

// =========================
// CRIAR PRODUTO
// =========================
router.post("/", async (req, res) => {
  try {
    const { nome, id_categoria, tipo_venda, preco, estoque, descricao } = req.body;
    const [result] = await db.query(
      `INSERT INTO produto (nome,id_categoria,tipo_venda,preco,estoque,descricao)
       VALUES (?,?,?,?,?,?)`,
      [nome, id_categoria, tipo_venda, preco, estoque, descricao]
    );
    const [rows] = await db.query(`SELECT * FROM produto WHERE id_produto = ?`, [result.insertId]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao criar produto." });
  }
});

// =========================
// EDITAR PRODUTO
// =========================
router.put("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { nome, id_categoria, tipo_venda, preco, estoque, descricao } = req.body;

    await db.query(
      `UPDATE produto
       SET nome=?, id_categoria=?, tipo_venda=?, preco=?, estoque=?, descricao=?
       WHERE id_produto=?`,
      [nome, id_categoria, tipo_venda, preco, estoque, descricao, id]
    );

    const [rows] = await db.query(`SELECT * FROM produto WHERE id_produto = ?`, [id]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao atualizar produto." });
  }
});

// =========================
// EXCLUIR PRODUTO
// =========================
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await db.query("DELETE FROM produto WHERE id_produto = ?", [id]);
    res.json({ sucesso: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao excluir produto." });
  }
});

module.exports = router;