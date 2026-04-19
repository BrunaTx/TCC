const express = require("express");
const router = express.Router();
const db = require("../config/db");

// =============================
// LISTAR PRODUTOS PARA ESTOQUE
// =============================
router.get("/", async (req, res) => {
  try {
    // Adicionado WHERE p.ativo = TRUE para listar apenas produtos ativos
    const [rows] = await db.query(`
      SELECT 
        p.id_produto,
        p.nome,
        p.estoque,
        p.tipo_venda,
        c.nome AS categoria
      FROM produto p
      LEFT JOIN categoria c 
        ON p.id_categoria = c.id_categoria
      WHERE p.ativo = TRUE
      ORDER BY p.nome
    `);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao buscar estoque" });
  }
});

// =============================
// ATUALIZAR ESTOQUE (MANUAL)
// =============================
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { estoque } = req.body;

    // Também garantimos que só atualiza se estiver ativo (opcional, mas seguro)
    await db.query(
      "UPDATE produto SET estoque = ? WHERE id_produto = ? AND ativo = TRUE",
      [estoque, id]
    );

    res.json({ message: "Estoque atualizado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao atualizar estoque" });
  }
});

// =============================
// REGISTRAR VENDA (COM BAIXA AUTOMÁTICA)
// =============================
router.post("/", async (req, res) => {
  const { id_cliente, pagamento, itens } = req.body;
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // 1. Inserir a venda pai
    const [venda] = await conn.query(
      "INSERT INTO venda (id_cliente, pagamento, data) VALUES (?, ?, NOW())",
      [id_cliente, pagamento]
    );

    const id_venda = venda.insertId;

    // 2. Loop para itens e baixa de estoque
    for (const item of itens) {
      // Insere o item da venda
      await conn.query(
        `INSERT INTO venda_item 
        (id_venda, id_produto, quantidade, preco)
        VALUES (?, ?, ?, ?)`,
        [id_venda, item.id_produto, item.quantidade, item.preco]
      );

      // Baixa o estoque (Independente de estar ativo ou não, 
      // para manter o saldo correto caso o produto tenha sido desativado agora)
      await conn.query(
        `UPDATE produto
         SET estoque = estoque - ?
         WHERE id_produto = ?`,
        [item.quantidade, item.id_produto]
      );
    }

    await conn.commit();
    res.json({ message: "Venda registrada com sucesso", id_venda });

  } catch (error) {
    await conn.rollback();
    console.error(error);
    res.status(500).json({ erro: "Erro ao registrar venda" });
  } finally {
    conn.release();
  }
});

module.exports = router;