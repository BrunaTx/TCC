const express = require("express");
const router = express.Router();
const db = require("../config/db");

// =============================
// DASHBOARD
// =============================
router.get("/", async (req, res) => {
  try {
    // Faturamento e vendas de hoje
    const [faturamentoRes] = await db.query(`
      SELECT 
        SUM(vi.preco * vi.quantidade) AS faturamento,
        COUNT(DISTINCT v.id_venda) AS vendas
      FROM venda v
      JOIN venda_item vi ON v.id_venda = vi.id_venda
      WHERE DATE(v.data) = CURDATE()
    `);

    // Produtos vendidos hoje
    const [produtosVendidosRes] = await db.query(`
      SELECT SUM(vi.quantidade) AS produtosVendidos
      FROM venda v
      JOIN venda_item vi ON v.id_venda = vi.id_venda
      WHERE DATE(v.data) = CURDATE()
    `);

    // Estoque baixo
    const [estoqueBaixoRes] = await db.query(`
      SELECT COUNT(*) AS estoqueBaixo
      FROM produto
      WHERE estoque <= 10
    `);

    const [produtosEstoqueBaixoRes] = await db.query(`
  SELECT nome, estoque, tipo_venda
  FROM produto
  WHERE estoque <= 10
  ORDER BY nome
`);

   res.json({
  faturamento: faturamentoRes[0].faturamento || 0,
  vendas: faturamentoRes[0].vendas || 0,
  produtosVendidos: produtosVendidosRes[0].produtosVendidos || 0,
  estoqueBaixo: estoqueBaixoRes[0].estoqueBaixo || 0,
  produtosEstoqueBaixo: produtosEstoqueBaixoRes // lista para o resumo
});

  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao carregar dashboard" });
  }
});

module.exports = router;