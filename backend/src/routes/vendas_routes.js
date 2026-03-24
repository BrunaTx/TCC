const express = require("express");
const router = express.Router();
const db = require("../config/db");


// ==========================
// LISTAR CLIENTES
// ==========================
router.get("/clientes", async (req, res) => {
  try {

    const [rows] = await db.query(
      "SELECT id_cliente, nome FROM cliente ORDER BY nome"
    );

    res.json(rows);

  } catch (err) {

    console.error(err);
    res.status(500).json({ erro: "Erro ao carregar clientes" });

  }
});


// ==========================
// LISTAR PRODUTOS
// ==========================
router.get("/produtos", async (req, res) => {
  try {

    const [rows] = await db.query(`
      SELECT id_produto, nome, preco, estoque, tipo_venda
      FROM produto
      ORDER BY nome
    `);

    res.json(rows);

  } catch (err) {

    console.error(err);
    res.status(500).json({ erro: "Erro ao carregar produtos" });

  }
});


// ==========================
// REGISTRAR VENDA
// ==========================
router.post("/", async (req, res) => {
  

  try {

    

    let { id_cliente, itens, pagamento, tipo_cartao, parcelas } = req.body;

    if (!itens || !itens.length || !pagamento) {
      return res.status(400).json({ erro: "Dados incompletos" });
    }

    // transformar "null" em NULL real
    if (id_cliente === "null") {
      id_cliente = null;
    }

   const [result] = await db.query(
  `INSERT INTO venda (id_cliente, data, pagamento, tipo_cartao, parcelas)
   VALUES (?, NOW(), ?, ?, ?)`,
  [id_cliente, pagamento, tipo_cartao || null, parcelas || null]
);

    const id_venda = result.insertId;

    res.json({
  sucesso: true,
  id_venda
});

    const valoresItens = itens.map(i => [
      id_venda,
      i.id_produto,
      i.quantidade,
      i.preco
    ]);

    await db.query(
      `INSERT INTO venda_item (id_venda, id_produto, quantidade, preco)
       VALUES ?`,
      [valoresItens]
    );

    for (let i of itens) {

      await db.query(
        `UPDATE produto
         SET estoque = estoque - ?
         WHERE id_produto = ?`,
        [i.quantidade, i.id_produto]
      );

    }

    res.json({ sucesso: true, id_venda });

  } catch (err) {

    console.error("ERRO AO REGISTRAR VENDA:", err);
    res.status(500).json({ erro: "Erro ao registrar venda" });

  }

});

module.exports = router;