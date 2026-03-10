const express = require("express");
const router = express.Router();
const db = require("../config/db");

// =========================
// LISTAR TODOS OS CLIENTES
// =========================
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id_cliente, nome, cpf, telefone, endereco
      FROM cliente
      ORDER BY nome
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao listar clientes." });
  }
});

// =========================
// LISTAR COMPRAS DE UM CLIENTE
// =========================
// =========================
// LISTAR COMPRAS DE UM CLIENTE
// =========================
router.get("/compras/:id_cliente", async (req, res) => {
  try {
    const id_cliente = req.params.id_cliente;
    const [vendas] = await db.query(`
      SELECT 
        v.id_venda, 
        v.data, 
        v.pagamento,
        vi.id_produto, 
        vi.quantidade, 
        vi.preco, 
        p.nome
      FROM venda v
      JOIN venda_item vi ON v.id_venda = vi.id_venda
      JOIN produto p ON vi.id_produto = p.id_produto
      WHERE v.id_cliente = ?
      ORDER BY v.data DESC, v.id_venda DESC
    `, [id_cliente]);

    const historico = {};
    vendas.forEach(v => {
      if (!historico[v.id_venda]) historico[v.id_venda] = {
        data: v.data,
        pagamento: v.pagamento, // <- aqui é importante
        total: 0,
        produtos: []
      };
      historico[v.id_venda].produtos.push({ nome: v.nome, quantidade: v.quantidade, preco: v.preco });
      historico[v.id_venda].total += v.quantidade * v.preco;
    });

    res.json(historico);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao buscar compras do cliente" });
  }
});

// =========================
// LISTAR CLIENTES (para select)
// =========================
router.get("/clientes", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id_cliente, nome FROM cliente ORDER BY nome");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao carregar clientes" });
  }
});

// =========================
// LISTAR PRODUTOS (para select)
// =========================
router.get("/produtos", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.id_produto, p.nome, p.preco, p.estoque, p.tipo_venda
      FROM produto p
      ORDER BY p.nome
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao carregar produtos" });
  }
});

// =========================
// REGISTRAR VENDA
// =========================
router.post("/", async (req, res) => {
  try {
    const { id_cliente, itens, pagamento } = req.body; // pegar pagamento
    if (!id_cliente || !itens || !itens.length || !pagamento) {
      return res.status(400).json({ erro: "Dados incompletos" });
    }

    // Inserir venda com pagamento
    const [result] = await db.query(
      `INSERT INTO venda (id_cliente, data, pagamento) VALUES (?, NOW(), ?)`,
      [id_cliente, pagamento]
    );

    const id_venda = result.insertId;

    // Inserir itens da venda
    const valoresItens = itens.map(i => [id_venda, i.id_produto, i.quantidade, i.preco]);
    await db.query(
      `INSERT INTO venda_item (id_venda, id_produto, quantidade, preco) VALUES ?`,
      [valoresItens]
    );

    // Atualizar estoque
    for (let i of itens) {
      await db.query(`UPDATE produto SET estoque = estoque - ? WHERE id_produto = ?`, [i.quantidade, i.id_produto]);
    }

    res.json({ sucesso: true, id_venda });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao registrar venda" });
  }
});

module.exports = router;