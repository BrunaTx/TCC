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
    const rows = db.prepare(`
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
    `).all();

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

    db.prepare(
      "UPDATE produto SET estoque = ? WHERE id_produto = ? AND ativo = 1"
    ).run(estoque, id);

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
    db.prepare("BEGIN TRANSACTION").run();

    // 1. Inserir a venda pai
    const venda = db.prepare(
      "INSERT INTO venda (id_cliente, pagamento, data) VALUES (?, ?, CURRENT_TIMESTAMP)"
    ).run(id_cliente, pagamento);

    // No better-sqlite3 o ID gerado fica em .lastInsertRowid
    const id_venda = venda.lastInsertRowid;

    // 2. Loop para itens e baixa de estoque
    for (const item of itens) {

      // Insere o item da venda
      db.prepare(`
        INSERT INTO venda_item 
        (id_venda, id_produto, quantidade, preco)
        VALUES (?, ?, ?, ?)
      `).run(
        id_venda,
        item.id_produto,
        item.quantidade,
        item.preco
      );

      // Baixa o estoque
      db.prepare(`
        UPDATE produto
        SET estoque = estoque - ?
        WHERE id_produto = ?
      `).run(
        item.quantidade,
        item.id_produto
      );
    }

    // Finaliza a transação com sucesso
    db.prepare("COMMIT").run();

    res.json({
      message: "Venda registrada com sucesso",
      id_venda
    });

  } catch (error) {

    // Se der erro em qualquer parte, desfaz tudo (Rollback)
    db.prepare("ROLLBACK").run();

    console.error(error);

    res.status(500).json({
      erro: "Erro ao registrar venda"
    });
  }
});

module.exports = router;