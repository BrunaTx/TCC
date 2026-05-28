const express = require("express");
const router = express.Router();
const dbPromise = require("../config/db");

// ==========================================
// LISTAR TODOS OS PRODUTOS (SOMENTE ATIVOS)
// ==========================================
router.get("/", async (req, res) => {
  try {
    const db = await dbPromise;

    // SQLite usa 1 para TRUE
    const rows = db.prepare(`
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
      WHERE p.ativo = 1
      ORDER BY p.nome
    `).all();

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
    const db = await dbPromise;
    const id_categoria = req.params.id;

    const rows = db.prepare(`
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
      WHERE p.id_categoria = ? AND p.ativo = 1
      ORDER BY p.nome
    `).all(id_categoria);

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
    const db = await dbPromise;
    const { codigo } = req.params;

    // Usamos .get() porque queremos apenas um produto
    const row = db.prepare(`
      SELECT 
        id_produto, nome, preco, estoque, tipo_venda, codigo_barras
      FROM produto
      WHERE codigo_barras = ? AND ativo = 1
    `).get(codigo);

    if (!row) {
      return res.status(404).json({
        erro: "Produto não encontrado ou inativo"
      });
    }

    res.json(row);

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
    const db = await dbPromise;

    const {
      nome,
      id_categoria,
      tipo_venda,
      preco,
      estoque,
      descricao,
      codigo_barras
    } = req.body;
    
    // No SQLite usamos 1 para representar TRUE no campo ativo
    const result = db.prepare(`
      INSERT INTO produto (
        nome,
        codigo_barras,
        id_categoria,
        tipo_venda,
        preco,
        estoque,
        descricao,
        ativo
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      nome,
      codigo_barras,
      id_categoria,
      tipo_venda,
      preco,
      estoque,
      descricao
    );
    
    // Pegamos o ID recém-criado
    const row = db.prepare(`
      SELECT * FROM produto WHERE id_produto = ?
    `).get(result.lastInsertRowid);

    res.json(row);

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
    const db = await dbPromise;
    const id = req.params.id;

    const {
      nome,
      codigo_barras,
      id_categoria,
      tipo_venda,
      preco,
      estoque,
      descricao
    } = req.body;

    db.prepare(`
      UPDATE produto
      SET nome=?, codigo_barras=?, id_categoria=?, tipo_venda=?, preco=?, estoque=?, descricao=?
      WHERE id_produto=?
    `).run(
      nome,
      codigo_barras,
      id_categoria,
      tipo_venda,
      preco,
      estoque,
      descricao,
      id
    );

    const row = db.prepare(`
      SELECT * FROM produto WHERE id_produto = ?
    `).get(id);

    res.json(row);

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
    const db = await dbPromise;

    // Muda ativo para 0 (FALSE no SQLite)
    db.prepare(
      "UPDATE produto SET ativo = 0 WHERE id_produto = ?"
    ).run(id);

    res.json({ message: "Produto removido da lista!" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;