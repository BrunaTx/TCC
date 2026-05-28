const express = require("express");
const router = express.Router();
const dbPromise = require("../config/db");

router.get("/", async (req, res) => {
  try {
    const db = await dbPromise;

    // Faturamento e total de vendas do dia
    const faturamentoRes = db.prepare(`
      SELECT 
        SUM(vi.preco * vi.quantidade) AS faturamento,
        COUNT(DISTINCT v.id_venda) AS vendas
      FROM venda v
      JOIN venda_item vi ON v.id_venda = vi.id_venda
      WHERE date(v.data) = date('now')
    `).get();

    // Contagem de estoque baixo (Unidade)
    const estoqueBaixoUnRes = db.prepare(`
      SELECT COUNT(*) AS estoqueBaixoUn
      FROM produto
      WHERE tipo_venda = 'un'
      AND estoque <= 10
    `).get();

    // Contagem de estoque baixo (Quilo)
    const estoqueBaixoKgRes = db.prepare(`
      SELECT COUNT(*) AS estoqueBaixoKg
      FROM produto
      WHERE tipo_venda = 'kg'
      AND estoque <= 5
    `).get();

    // Lista de produtos com estoque baixo
    const produtosEstoqueBaixoRes = db.prepare(`
      SELECT nome, estoque, tipo_venda
      FROM produto
      WHERE 
        (tipo_venda = 'un' AND estoque <= 10)
        OR
        (tipo_venda = 'kg' AND estoque <= 5)
      ORDER BY nome
    `).all();

    // Mais vendido (Unidade)
    const maisVendidoUnRes = db.prepare(`
      SELECT p.nome, SUM(vi.quantidade) AS total
      FROM venda v
      JOIN venda_item vi ON v.id_venda = vi.id_venda
      JOIN produto p ON vi.id_produto = p.id_produto
      WHERE date(v.data) = date('now')
      AND p.tipo_venda = 'un'
      GROUP BY p.id_produto
      ORDER BY total DESC
      LIMIT 1
    `).get();

    // Mais vendido (Quilo)
    const maisVendidoKgRes = db.prepare(`
      SELECT p.nome, SUM(vi.quantidade) AS total
      FROM venda v
      JOIN venda_item vi ON v.id_venda = vi.id_venda
      JOIN produto p ON vi.id_produto = p.id_produto
      WHERE date(v.data) = date('now')
      AND p.tipo_venda = 'kg'
      GROUP BY p.id_produto
      ORDER BY total DESC
      LIMIT 1
    `).get();

    // Menos vendido (Unidade)
    const menosVendidoUnRes = db.prepare(`
      SELECT p.nome, SUM(vi.quantidade) AS total
      FROM venda v
      JOIN venda_item vi ON v.id_venda = vi.id_venda
      JOIN produto p ON vi.id_produto = p.id_produto
      WHERE date(v.data) = date('now')
      AND p.tipo_venda = 'un'
      GROUP BY p.id_produto
      ORDER BY total ASC
      LIMIT 1
    `).get();

    // Menos vendido (Quilo)
    const menosVendidoKgRes = db.prepare(`
      SELECT p.nome, SUM(vi.quantidade) AS total
      FROM venda v
      JOIN venda_item vi ON v.id_venda = vi.id_venda
      JOIN produto p ON vi.id_produto = p.id_produto
      WHERE date(v.data) = date('now')
      AND p.tipo_venda = 'kg'
      GROUP BY p.id_produto
      ORDER BY total ASC
      LIMIT 1
    `).get();

    // Total de produtos vendidos (Unidade)
    const produtosVendidosUnRes = db.prepare(`
      SELECT SUM(vi.quantidade) AS total
      FROM venda v
      JOIN venda_item vi ON v.id_venda = vi.id_venda
      JOIN produto p ON vi.id_produto = p.id_produto
      WHERE date(v.data) = date('now')
      AND p.tipo_venda = 'un'
    `).get();

    // Total de produtos vendidos (Quilo)
    const produtosVendidosKgRes = db.prepare(`
      SELECT SUM(vi.quantidade) AS total
      FROM venda v
      JOIN venda_item vi ON v.id_venda = vi.id_venda
      JOIN produto p ON vi.id_produto = p.id_produto
      WHERE date(v.data) = date('now')
      AND p.tipo_venda = 'kg'
    `).get();

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