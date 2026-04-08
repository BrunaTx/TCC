const express = require("express");
const router = express.Router();
const db = require("../config/db");

// ==========================
// LISTAR CLIENTES
// ==========================
router.get("/clientes", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id_cliente, nome FROM cliente ORDER BY nome");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao carregar clientes" });
  }
});

// ==========================
// LISTAR PRODUTOS
// ==========================
router.get("/produtos", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id_produto, nome, preco, estoque, tipo_venda FROM produto ORDER BY nome");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao carregar produtos" });
  }
});

// ==========================
// REGISTRAR VENDA
// ==========================
router.post("/", async (req, res) => {
  try {
    let { id_cliente, itens, pagamentos } = req.body;

    if (!itens || !itens.length || !pagamentos || !pagamentos.length) {
      return res.status(400).json({ erro: "Dados incompletos" });
    }

    if (id_cliente === "null") id_cliente = null;

    // Concatena métodos para salvar na coluna única 'pagamento'
    const resumoPagamento = pagamentos.map(p => `${p.metodo} (R$ ${p.valor})`).join(" + ");
    const tipoCartaoPrincipal = pagamentos[0].metodo === "Cartao" ? pagamentos[0].tipo_cartao : null;
    const parcelasPrincipal = pagamentos[0].metodo === "Cartao" ? pagamentos[0].parcelas : null;

    // 1. Inserir Venda
    const [result] = await db.query(
      `INSERT INTO venda (id_cliente, data, pagamento, tipo_cartao, parcelas)
       VALUES (?, NOW(), ?, ?, ?)`,
      [id_cliente, resumoPagamento, tipoCartaoPrincipal, parcelasPrincipal]
    );

    const id_venda = result.insertId;

    // 2. Inserir Itens da Venda
    const valoresItens = itens.map(i => [id_venda, i.id_produto, i.quantidade, i.preco]);
    await db.query(
      `INSERT INTO venda_item (id_venda, id_produto, quantidade, preco) VALUES ?`,
      [valoresItens]
    );

    // 3. Atualizar Estoque
    for (let i of itens) {
      await db.query(
        `UPDATE produto SET estoque = estoque - ? WHERE id_produto = ?`,
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