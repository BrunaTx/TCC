const express = require("express");
const router = express.Router();
const dbPromise = require("../config/db");

router.get("/", async (req, res) => {
  try {
    const db = await dbPromise;

    // Faturamento e total de vendas do dia
    // MySQL: DATE(v.data) = CURDATE() -> SQLite: date(v.data) = date('now')
    const faturamentoRes = await db.get(`
      SELECT 
        SUM(vi.preco * vi.quantidade) AS faturamento,
        COUNT(DISTINCT v.id_venda) AS vendas
      FROM venda v
      JOIN venda_item vi ON v.id_venda = vi.id_venda
      WHERE date(v.data) = date('now')
    `);

    // Contagem de estoque baixo (Unidade)
    const estoqueBaixoUnRes = await db.get(`
      SELECT COUNT(*) AS estoqueBaixoUn
      FROM produto
      WHERE tipo_venda = 'un'
      AND estoque <= 10
    `);

    // Contagem de estoque baixo (Quilo)
    const estoqueBaixoKgRes = await db.get(`
      SELECT COUNT(*) AS estoqueBaixoKg
      FROM produto
      WHERE tipo_venda = 'kg'
      AND estoque <= 5
    `);

    // Lista de produtos com estoque baixo
    const produtosEstoqueBaixoRes = await db.all(`
      SELECT nome, estoque, tipo_venda
      FROM produto
      WHERE 
        (tipo_venda = 'un' AND estoque <= 10)
        OR
        (tipo_venda = 'kg' AND estoque <= 5)
      ORDER BY nome
    `);

    // Mais vendido (Unidade)
    const maisVendidoUnRes = await db.get(`
      SELECT p.nome, SUM(vi.quantidade) AS total
      FROM venda v
      JOIN venda_item vi ON v.id_venda = vi.id_venda
      JOIN produto p ON vi.id_produto = p.id_produto
      WHERE date(v.data) = date('now')
      AND p.tipo_venda = 'un'
      GROUP BY p.id_produto
      ORDER BY total DESC
      LIMIT 1
    `);

    // Mais vendido (Quilo)
    const maisVendidoKgRes = await db.get(`
      SELECT p.nome, SUM(vi.quantidade) AS total
      FROM venda v
      JOIN venda_item vi ON v.id_venda = vi.id_venda
      JOIN produto p ON vi.id_produto = p.id_produto
      WHERE date(v.data) = date('now')
      AND p.tipo_venda = 'kg'
      GROUP BY p.id_produto
      ORDER BY total DESC
      LIMIT 1
    `);

    // Menos vendido (Unidade)
    const menosVendidoUnRes = await db.get(`
      SELECT p.nome, SUM(vi.quantidade) AS total
      FROM venda v
      JOIN venda_item vi ON v.id_venda = vi.id_venda
      JOIN produto p ON vi.id_produto = p.id_produto
      WHERE date(v.data) = date('now')
      AND p.tipo_venda = 'un'
      GROUP BY p.id_produto
      ORDER BY total ASC
      LIMIT 1
    `);

    // Menos vendido (Quilo)
    const menosVendidoKgRes = await db.get(`
      SELECT p.nome, SUM(vi.quantidade) AS total
      FROM venda v
      JOIN venda_item vi ON v.id_venda = vi.id_venda
      JOIN produto p ON vi.id_produto = p.id_produto
      WHERE date(v.data) = date('now')
      AND p.tipo_venda = 'kg'
      GROUP BY p.id_produto
      ORDER BY total ASC
      LIMIT 1
    `);

    // Total de produtos vendidos (Unidade)
    const produtosVendidosUnRes = await db.get(`
      SELECT SUM(vi.quantidade) AS total
      FROM venda v
      JOIN venda_item vi ON v.id_venda = vi.id_venda
      JOIN produto p ON vi.id_produto = p.id_produto
      WHERE date(v.data) = date('now')
      AND p.tipo_venda = 'un'
    `);

    // Total de produtos vendidos (Quilo)
    const produtosVendidosKgRes = await db.get(`
      SELECT SUM(vi.quantidade) AS total
      FROM venda v
      JOIN venda_item vi ON v.id_venda = vi.id_venda
      JOIN produto p ON vi.id_produto = p.id_produto
      WHERE date(v.data) = date('now')
      AND p.tipo_venda = 'kg'
    `);

    // Resposta final montada exatamente como o seu original esperava
    res.json({
      faturamento: faturamentoRes.faturamento || 0,
      vendas: faturamentoRes.vendas || 0,
      produtosVendidosUn: produtosVendidosUnRes.total || 0,
      produtosVendidosKg: produtosVendidosKgRes.total || 0,
      estoqueBaixoUn: estoqueBaixoUnRes.estoqueBaixoUn || 0,
      estoqueBaixoKg: estoqueBaixoKgRes.estoqueBaixoKg || 0,
      produtosEstoqueBaixo: produtosEstoqueBaixoRes,
      maisVendidoUn: maisVendidoUnRes || null,
      maisVendidoKg: maisVendidoKgRes || null,
      menosVendidoUn: menosVendidoUnRes || null,
      menosVendidoKg: menosVendidoKgRes || null
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao carregar dashboard" });
  }
});

module.exports = router;