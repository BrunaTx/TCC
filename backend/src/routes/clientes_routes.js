const express = require("express");
const router = express.Router();
const db = require("../config/db");


// ==========================
// LISTAR TODOS OS CLIENTES
// ==========================
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
    res.status(500).json({ erro: "Erro ao listar clientes" });

  }
});


// ==========================
// CRIAR CLIENTE
// ==========================
router.post("/", async (req, res) => {

  try {

    const { nome, cpf, telefone, endereco } = req.body;

    if (!nome || !cpf) {
      return res.status(400).json({ erro: "Nome e CPF são obrigatórios" });
    }

    const [existe] = await db.query(
      "SELECT id_cliente FROM cliente WHERE cpf = ?",
      [cpf]
    );

    if (existe.length > 0) {
      return res.status(400).json({ erro: "CPF já cadastrado" });
    }

    await db.query(
      "INSERT INTO cliente (nome, cpf, telefone, endereco) VALUES (?, ?, ?, ?)",
      [nome, cpf, telefone, endereco]
    );

    res.json({ sucesso: true });

  } catch (err) {

    console.error(err);
    res.status(500).json({ erro: "Erro ao criar cliente" });

  }

});


// ==========================
// EDITAR CLIENTE
// ==========================
router.put("/:id", async (req, res) => {

  try {

    const { id } = req.params;
    const { nome, cpf, telefone, endereco } = req.body;

    await db.query(
      `UPDATE cliente 
       SET nome = ?, cpf = ?, telefone = ?, endereco = ?
       WHERE id_cliente = ?`,
      [nome, cpf, telefone, endereco, id]
    );

    res.json({ sucesso: true });

  } catch (err) {

    console.error(err);
    res.status(500).json({ erro: "Erro ao atualizar cliente" });

  }

});


// ==========================
// EXCLUIR CLIENTE
// ==========================
router.delete("/:id", async (req, res) => {

  try {

    const { id } = req.params;

    await db.query(
      "DELETE FROM cliente WHERE id_cliente = ?",
      [id]
    );

    res.json({ sucesso: true });

  } catch (err) {

    console.error(err);
    res.status(500).json({ erro: "Erro ao excluir cliente" });

  }

});


// ==========================
// HISTÓRICO DE COMPRAS
// ==========================
router.get("/compras/:id_cliente", async (req, res) => {

  try {

    const id_cliente = req.params.id_cliente;

    const [vendas] = await db.query(`
      SELECT 
        v.id_venda,
        v.data,
        v.pagamento,
        vi.quantidade,
        vi.preco,
        p.nome
      FROM venda v
      JOIN venda_item vi ON v.id_venda = vi.id_venda
      JOIN produto p ON vi.id_produto = p.id_produto
      WHERE v.id_cliente = ?
      ORDER BY v.data DESC
    `, [id_cliente]);

    const historico = {};

    vendas.forEach(v => {

      if (!historico[v.id_venda]) {

        historico[v.id_venda] = {
          data: v.data,
          pagamento: v.pagamento,
          total: 0,
          produtos: []
        };

      }

      historico[v.id_venda].produtos.push({
        nome: v.nome,
        quantidade: v.quantidade,
        preco: v.preco
      });

      historico[v.id_venda].total += v.quantidade * v.preco;

    });

    res.json(historico);

  } catch (err) {

    console.error(err);
    res.status(500).json({ erro: "Erro ao buscar compras" });

  }

});

module.exports = router;