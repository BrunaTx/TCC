const express = require("express");
const router = express.Router();
const db = require("../config/db");

// ==========================================
// LISTAR TODOS OS PRODUTOS (SOMENTE ATIVOS)
// ==========================================
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        p.id_produto,
        p.nome,
        p.codigo_barras,
        p.id_categoria,
        c.nome AS categoria,
        p.tipo_venda,
        p.preco,
        p.estoque,
        p.descricao
      FROM produto p
      JOIN categoria c ON p.id_categoria = c.id_categoria
      WHERE p.ativo = TRUE
      ORDER BY p.nome
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao listar produtos." });
  }
});

// ==========================================
// LISTAR POR CATEGORIA (SOMENTE ATIVOS)
// ==========================================
router.get("/categoria/:id", async (req, res) => {
  try {
    const id_categoria = req.params.id;
    const [rows] = await db.query(`
      SELECT 
        p.id_produto,
        p.nome,
        p.codigo_barras,
        p.id_categoria,
        c.nome AS categoria,
        p.tipo_venda,
        p.preco,
        p.estoque,
        p.descricao
      FROM produto p
      JOIN categoria c ON p.id_categoria = c.id_categoria
      WHERE p.id_categoria = ? AND p.ativo = TRUE
      ORDER BY p.nome
    `, [id_categoria]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao listar produtos da categoria." });
  }
});

// ==========================================
// BUSCAR POR CÓDIGO (PARA O PDV)
// ==========================================
router.get("/codigo/:codigo", async (req, res) => {
  try {
    const { codigo } = req.params;

    const [rows] = await db.query(
      `SELECT 
        id_produto, nome, preco, estoque, tipo_venda, codigo_barras
      FROM produto
      WHERE codigo_barras = ? AND ativo = TRUE`,
      [codigo]
    );

    if (!rows.length) {
      return res.status(404).json({ erro: "Produto não encontrado ou inativo" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao buscar produto" });
  }
});

// =========================
// CRIAR PRODUTO
// =========================
router.post("/", async (req, res) => {
  try {
    const { nome, id_categoria, tipo_venda, preco, estoque, descricao, codigo_barras } = req.body;
    
    // Incluímos 'ativo' como TRUE por padrão no INSERT
    const [result] = await db.query(
      `INSERT INTO produto (nome, codigo_barras, id_categoria, tipo_venda, preco, estoque, descricao, ativo)
       VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [nome, codigo_barras, id_categoria, tipo_venda, preco, estoque, descricao]
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
    const { nome, codigo_barras, id_categoria, tipo_venda, preco, estoque, descricao } = req.body;

    await db.query(
      `UPDATE produto
       SET nome=?, codigo_barras=?, id_categoria=?, tipo_venda=?, preco=?, estoque=?, descricao=?
       WHERE id_produto=?`,
      [nome, codigo_barras, id_categoria, tipo_venda, preco, estoque, descricao, id]
    );

    const [rows] = await db.query(`SELECT * FROM produto WHERE id_produto = ?`, [id]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao atualizar produto." });
  }
});

// ==========================================
// EXCLUIR PRODUTO (EXCLUSÃO LÓGICA)
// ==========================================
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Muda para FALSE para que o GET acima ignore este produto
    await db.query("UPDATE produto SET ativo = FALSE WHERE id_produto = ?", [id]);
    res.json({ message: "Produto removido da lista!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;