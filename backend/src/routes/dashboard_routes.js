const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/", async (req, res) => {
  try {

    const [faturamentoRes] = await db.query(`
      SELECT 
        SUM(vi.preco * vi.quantidade) AS faturamento,
        COUNT(DISTINCT v.id_venda) AS vendas
      FROM venda v
      JOIN venda_item vi ON v.id_venda = vi.id_venda
      WHERE DATE(v.data) = CURDATE()
    `);


    const [estoqueBaixoUnRes] = await db.query(`
      SELECT COUNT(*) AS estoqueBaixoUn
      FROM produto
      WHERE tipo_venda = 'un'
      AND estoque <= 10
    `);

    const [estoqueBaixoKgRes] = await db.query(`
      SELECT COUNT(*) AS estoqueBaixoKg
      FROM produto
      WHERE tipo_venda = 'kg'
      AND estoque <= 5
    `);

    const [produtosEstoqueBaixoRes] = await db.query(`
      SELECT nome, estoque, tipo_venda
      FROM produto
      WHERE 
        (tipo_venda = 'un' AND estoque <= 10)
        OR
        (tipo_venda = 'kg' AND estoque <= 5)
      ORDER BY nome
    `);

    const [maisVendidoUnRes] = await db.query(`
      SELECT p.nome, SUM(vi.quantidade) AS total
      FROM venda v
      JOIN venda_item vi ON v.id_venda = vi.id_venda
      JOIN produto p ON vi.id_produto = p.id_produto
      WHERE DATE(v.data) = CURDATE()
      AND p.tipo_venda = 'un'
      GROUP BY p.id_produto
      ORDER BY total DESC
      LIMIT 1
    `);

    const [maisVendidoKgRes] = await db.query(`
      SELECT p.nome, SUM(vi.quantidade) AS total
      FROM venda v
      JOIN venda_item vi ON v.id_venda = vi.id_venda
      JOIN produto p ON vi.id_produto = p.id_produto
      WHERE DATE(v.data) = CURDATE()
      AND p.tipo_venda = 'kg'
      GROUP BY p.id_produto
      ORDER BY total DESC
      LIMIT 1
    `);

    const [menosVendidoUnRes] = await db.query(`
      SELECT p.nome, SUM(vi.quantidade) AS total
      FROM venda v
      JOIN venda_item vi ON v.id_venda = vi.id_venda
      JOIN produto p ON vi.id_produto = p.id_produto
      WHERE DATE(v.data) = CURDATE()
      AND p.tipo_venda = 'un'
      GROUP BY p.id_produto
      ORDER BY total ASC
      LIMIT 1
    `);

    const [menosVendidoKgRes] = await db.query(`
      SELECT p.nome, SUM(vi.quantidade) AS total
      FROM venda v
      JOIN venda_item vi ON v.id_venda = vi.id_venda
      JOIN produto p ON vi.id_produto = p.id_produto
      WHERE DATE(v.data) = CURDATE()
      AND p.tipo_venda = 'kg'
      GROUP BY p.id_produto
      ORDER BY total ASC
      LIMIT 1
    `);
    const [produtosVendidosUnRes] = await db.query(`
  SELECT SUM(vi.quantidade) AS total
  FROM venda v
  JOIN venda_item vi ON v.id_venda = vi.id_venda
  JOIN produto p ON vi.id_produto = p.id_produto
  WHERE DATE(v.data) = CURDATE()
  AND p.tipo_venda = 'un'
`);

const [produtosVendidosKgRes] = await db.query(`
  SELECT SUM(vi.quantidade) AS total
  FROM venda v
  JOIN venda_item vi ON v.id_venda = vi.id_venda
  JOIN produto p ON vi.id_produto = p.id_produto
  WHERE DATE(v.data) = CURDATE()
  AND p.tipo_venda = 'kg'
`);

    res.json({
      faturamento: faturamentoRes[0].faturamento || 0,
      vendas: faturamentoRes[0].vendas || 0,
      produtosVendidosUn: produtosVendidosUnRes[0].total || 0,
produtosVendidosKg: produtosVendidosKgRes[0].total || 0,

      estoqueBaixoUn: estoqueBaixoUnRes[0].estoqueBaixoUn || 0,
      estoqueBaixoKg: estoqueBaixoKgRes[0].estoqueBaixoKg || 0,

      produtosEstoqueBaixo: produtosEstoqueBaixoRes,

      maisVendidoUn: maisVendidoUnRes[0] || null,
      maisVendidoKg: maisVendidoKgRes[0] || null,

      

      menosVendidoUn: menosVendidoUnRes[0] || null,
      menosVendidoKg: menosVendidoKgRes[0] || null
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao carregar dashboard" });
  }
});

module.exports = router;