const express = require("express");
const router = express.Router();
const dbPromise = require("../config/db");

router.get("/", async (req, res) => {
  try {
    const db = await dbPromise;
    const tipo = req.query.tipo;
    const dataInicio = req.query.dataInicio;
    const dataFim = req.query.dataFim;

    let filtro = "1=1";
    let params = [];

    // TRADUÇÃO DA LÓGICA DE DATAS PARA SQLITE
    if (dataInicio && dataFim) {

      // No SQLite, date(v.data) funciona igual ao DATE(v.data) do MySQL
      filtro = "date(v.data) BETWEEN ? AND ?";
      params = [dataInicio, dataFim];

    } else if (tipo === "Diario") {

      // MySQL: CURDATE() -> SQLite: date('now')
      filtro = "date(v.data) = date('now')";

    } else if (tipo === "Semanal") {

      // MySQL: DATE_SUB(..., INTERVAL 7 DAY) -> SQLite: date('now', '-7 days')
      filtro = "date(v.data) >= date('now', '-7 days')";

    } else if (tipo === "Mensal") {

      // MySQL: MONTH() e YEAR() -> SQLite: strftime('%m', ...) e strftime('%Y', ...)
      filtro = `
        strftime('%m', v.data) = strftime('%m', 'now')
        AND strftime('%Y', v.data) = strftime('%Y', 'now')
      `;

    } else if (tipo === "Anual") {

      // MySQL: YEAR() -> SQLite: strftime('%Y', ...)
      filtro = "strftime('%Y', v.data) = strftime('%Y', 'now')";
    }

    // Execução da query
    const vendas = db.prepare(`
      SELECT 
        p.nome,
        vi.quantidade,
        vi.preco,
        p.tipo_venda,
        v.data
      FROM venda_item vi
      JOIN produto p ON p.id_produto = vi.id_produto
      JOIN venda v ON v.id_venda = vi.id_venda
      WHERE ${filtro}
      ORDER BY v.data DESC
    `).all(...params);

    const totalVendas = vendas.length;

    // A lógica de cálculo permanece IGUAL
    const itensVendidos = vendas.reduce(
      (s, v) => s + Number(v.quantidade),
      0
    );

    const faturamento = vendas.reduce(
      (s, v) => s + (Number(v.quantidade) * Number(v.preco)),
      0
    );

    res.json({
      totalVendas,
      itensVendidos: Number(itensVendidos.toFixed(2)),
      faturamento: Number(faturamento.toFixed(2)),
      detalhes: vendas
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro no relatório" });
  }
});

module.exports = router;