const express = require("express");
const router = express.Router();
const dbPromise = require("../config/db");

// ==========================
// LISTAR TODOS OS CLIENTES
// ==========================
router.get("/", async (req, res) => {
  try {
    const db = await dbPromise;

    // SQLite usa 1 para TRUE e 0 para FALSE por padrão
    const rows = db.prepare(`
      SELECT id_cliente, nome, cpf, telefone, endereco
      FROM cliente
      WHERE ativo = 1
      ORDER BY nome
    `).all();

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
    const db = await dbPromise;
    const { nome, cpf, telefone, endereco } = req.body;

    if (!nome || !cpf) {
      return res.status(400).json({ erro: "Nome e CPF são obrigatórios" });
    }

    // Verifica se já existe
    const existe = db.prepare(
      "SELECT id_cliente FROM cliente WHERE cpf = ?"
    ).all(cpf);

    if (existe.length > 0) {
      return res.status(400).json({ erro: "CPF já cadastrado" });
    }

    db.prepare(
      "INSERT INTO cliente (nome, cpf, telefone, endereco) VALUES (?, ?, ?, ?)"
    ).run(nome, cpf, telefone, endereco);

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
    const db = await dbPromise;
    const { id } = req.params;
    const { nome, cpf, telefone, endereco } = req.body;

    db.prepare(`
      UPDATE cliente 
      SET nome = ?, cpf = ?, telefone = ?, endereco = ?
      WHERE id_cliente = ?
    `).run(nome, cpf, telefone, endereco, id);

    res.json({ sucesso: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao atualizar cliente" });
  }
});

// ==========================
// EXCLUIR CLIENTE (Desativação lógica)
// ==========================
router.delete("/:id", async (req, res) => {
  try {
    const db = await dbPromise;
    const { id } = req.params;

    db.prepare(
      "UPDATE cliente SET ativo = 0 WHERE id_cliente = ?"
    ).run(id);

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
    const db = await dbPromise;
    const id_cliente = req.params.id_cliente;

    const vendas = db.prepare(`
      SELECT 
        v.id_venda,
        v.data,
        v.pagamento,
        v.tipo_cartao,
        v.parcelas,
        vi.quantidade,
        vi.preco,
        p.nome
      FROM venda v
      JOIN venda_item vi ON v.id_venda = vi.id_venda
      JOIN produto p ON vi.id_produto = p.id_produto
      WHERE v.id_cliente = ?
      ORDER BY v.data DESC
    `).all(id_cliente);

    const historico = {};

    vendas.forEach(v => {
      if (!historico[v.id_venda]) {
        historico[v.id_venda] = {
          data: v.data,
          pagamento: v.pagamento,
          tipo_cartao: v.tipo_cartao,
          parcelas: v.parcelas,
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