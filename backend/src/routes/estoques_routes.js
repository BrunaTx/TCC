const express = require("express");
const router = express.Router();
const db = require("../config/db");


// =============================
// LISTAR PRODUTOS PARA ESTOQUE
// =============================
router.get("/", async (req, res) => {

  try {

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
      ORDER BY p.nome
    `);

    res.json(rows);

  } catch (error) {

    console.error(error);
    res.status(500).json({ erro: "Erro ao buscar estoque" });

  }

});


// =============================
// ATUALIZAR ESTOQUE
// =============================
router.put("/:id", async (req, res) => {

  try {

    const { id } = req.params;
    const { estoque } = req.body;

    await db.query(
      "UPDATE produto SET estoque = ? WHERE id_produto = ?",
      [estoque, id]
    );

    res.json({ message: "Estoque atualizado" });

  } catch (error) {

    console.error(error);
    res.status(500).json({ erro: "Erro ao atualizar estoque" });

  }

});


// =============================
// REGISTRAR VENDA
// =============================
router.post("/", async (req, res) => {

  const { id_cliente, pagamento, itens } = req.body;

  const conn = await db.getConnection();

  try {

    await conn.beginTransaction();

    const [venda] = await conn.query(
      "INSERT INTO venda (id_cliente, pagamento) VALUES (?, ?)",
      [id_cliente, pagamento]
    );

    const id_venda = venda.insertId;

    for (const item of itens) {

      await conn.query(
        `INSERT INTO venda_item 
        (id_venda, id_produto, quantidade, preco)
        VALUES (?, ?, ?, ?)`,
        [id_venda, item.id_produto, item.quantidade, item.preco]
      );

      // ↓ diminui estoque automaticamente
      await conn.query(
        `UPDATE produto
         SET estoque = estoque - ?
         WHERE id_produto = ?`,
        [item.quantidade, item.id_produto]
      );

    }

    await conn.commit();

    res.json({ message: "Venda registrada com sucesso" });

  } catch (error) {

    await conn.rollback();

    console.error(error);
    res.status(500).json({ erro: "Erro ao registrar venda" });

  } finally {

    conn.release();

  }

});

module.exports = router;