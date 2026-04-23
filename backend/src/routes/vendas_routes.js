const express = require("express");
const router = express.Router();
const dbPromise = require("../config/db");

// ==========================
// LISTAR CLIENTES
// ==========================
router.get("/clientes", async (req, res) => {
  try {
    const db = await dbPromise;
    // SQLite: ativo = 1 (em vez de TRUE)
    const rows = await db.all("SELECT id_cliente, nome FROM cliente WHERE ativo = 1 ORDER BY nome");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao carregar clientes" });
  }
});

// ==========================
// LISTAR PRODUTOS (SOMENTE ATIVOS)
// ==========================
router.get("/produtos", async (req, res) => {
  try {
    const db = await dbPromise;
    const rows = await db.all(`
      SELECT id_produto, nome, preco, estoque, tipo_venda 
      FROM produto 
      WHERE ativo = 1 
      ORDER BY nome
    `);
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
    const db = await dbPromise;
    let { id_cliente, itens, pagamentos } = req.body;

    const taxasMaquininha = {
      debito: 0.0137,
      credito: {
        1: 0.03, 2: 0.0539, 3: 0.0612, 4: 0.0685, 5: 0.0757,
        6: 0.0828, 7: 0.0899, 8: 0.0969, 9: 0.1038,
        10: 0.1106, 11: 0.1174, 12: 0.1241
      }
    };

    if (!itens || !itens.length || !pagamentos || !pagamentos.length) {
      return res.status(400).json({ erro: "Dados incompletos" });
    }

    if (id_cliente === "null" || id_cliente === "") id_cliente = null;

    // A lógica de formatação do texto de pagamento permanece IGUAL
    const resumoPagamento = pagamentos.map(p => { 
      let valorTotalComTaxa = Number(p.valor);
      let infoTexto = "";

      if (p.metodo === "Cartao") {
        const taxa = p.tipo_cartao === "debito" 
          ? taxasMaquininha.debito 
          : (taxasMaquininha.credito[p.parcelas] || 0.03);
        
        valorTotalComTaxa = p.valor * (1 + taxa);

        if (p.tipo_cartao === "credito") {
          const qtdParcelas = Number(p.parcelas);
          const valorParcela = valorTotalComTaxa / qtdParcelas;
          infoTexto = ` ${qtdParcelas}x de R$ ${valorParcela.toFixed(2).replace('.', ',')} (Total R$ ${valorTotalComTaxa.toFixed(2).replace('.', ',')})`;
        } else {
          infoTexto = ` Débito (R$ ${valorTotalComTaxa.toFixed(2).replace('.', ',')})`;
        }
      } else {
        infoTexto = ` (R$ ${valorTotalComTaxa.toFixed(2).replace('.', ',')})`;
      }
      return `${p.metodo}${infoTexto}`;
    }).join(" + ");

    const pgCartao = pagamentos.find(p => p.metodo === "Cartao");
    const tipoCartaoPrincipal = pgCartao ? pgCartao.tipo_cartao : null;
    const parcelasPrincipal = pgCartao ? pgCartao.parcelas : null;

    // --- INÍCIO DA TRANSAÇÃO ---
    await db.run("BEGIN TRANSACTION");

    // 1. Inserir Venda (NOW() vira CURRENT_TIMESTAMP)
    const result = await db.run(
      `INSERT INTO venda (id_cliente, data, pagamento, tipo_cartao, parcelas)
       VALUES (?, CURRENT_TIMESTAMP, ?, ?, ?)`,
      [id_cliente, resumoPagamento, tipoCartaoPrincipal, parcelasPrincipal]
    );

    const id_venda = result.lastID; // SQLite usa lastID

    // 2. Inserir Itens da Venda e 3. Atualizar Estoque
    // Fizemos em um loop para garantir compatibilidade total com SQLite
    for (let i of itens) {
      // Inserir item
      await db.run(
        `INSERT INTO venda_item (id_venda, id_produto, quantidade, preco) VALUES (?, ?, ?, ?)`,
        [id_venda, i.id_produto, i.quantidade, i.preco]
      );

      // Baixar estoque
      await db.run(
        `UPDATE produto SET estoque = estoque - ? WHERE id_produto = ?`,
        [i.quantidade, i.id_produto]
      );
    }

    await db.run("COMMIT");
    res.json({ sucesso: true, id_venda });

  } catch (err) {
    const db = await dbPromise;
    await db.run("ROLLBACK");
    console.error("ERRO AO REGISTRAR VENDA:", err);
    res.status(500).json({ erro: "Erro ao registrar venda" });
  }
});

module.exports = router;