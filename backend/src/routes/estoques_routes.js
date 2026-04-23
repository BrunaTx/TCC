const express = require("express");
const router = express.Router();
const dbPromise = require("../config/db");

// =============================
// LISTAR PRODUTOS PARA ESTOQUE
// =============================
router.get("/", async (req, res) => {
  try {
    const db = await dbPromise;
    // No SQLite, TRUE é 1. O JOIN continua igual.
    const rows = await db.all(`
      SELECT 
        p.id_produto,
        p.nome,
        p.estoque,
        p.tipo_venda,
        c.nome AS categoria
      FROM produto p
      LEFT JOIN categoria c 
        ON p.id_categoria = c.id_categoria
      WHERE p.ativo = 1
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
    const db = await dbPromise;
    const { id } = req.params;
    const { estoque } = req.body;

    await db.run(
      "UPDATE produto SET estoque = ? WHERE id_produto = ? AND ativo = 1",
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
  const db = await dbPromise;

  try {
    // Inicia a transação no SQLite
    await db.run("BEGIN TRANSACTION");

    // 1. Inserir a venda pai
    // MySQL usa NOW(), SQLite usa CURRENT_TIMESTAMP
    const venda = await db.run(
      "INSERT INTO venda (id_cliente, pagamento, data) VALUES (?, ?, CURRENT_TIMESTAMP)",
      [id_cliente, pagamento]
    );

    // No SQLite, o ID gerado fica em .lastID (no MySQL era .insertId)
    const id_venda = venda.lastID;

    // 2. Loop para itens e baixa de estoque
    for (const item of itens) {
      // Insere o item da venda
      await db.run(
        `INSERT INTO venda_item 
        (id_venda, id_produto, quantidade, preco)
        VALUES (?, ?, ?, ?)`,
        [id_venda, item.id_produto, item.quantidade, item.preco]
      );

      // Baixa o estoque
      await db.run(
        `UPDATE produto
         SET estoque = estoque - ?
         WHERE id_produto = ?`,
        [item.quantidade, item.id_produto]
      );
    }

    // Finaliza a transação com sucesso
    await db.run("COMMIT");
    res.json({ message: "Venda registrada com sucesso", id_venda });

  } catch (error) {
    // Se der erro em qualquer parte, desfaz tudo (Rollback)
    await db.run("ROLLBACK");
    console.error(error);
    res.status(500).json({ erro: "Erro ao registrar venda" });
  }
});

module.exports = router;