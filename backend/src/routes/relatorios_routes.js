const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/", async (req,res)=>{

  try{

    const tipo = req.query.tipo;
    const dataInicio = req.query.dataInicio;
    const dataFim = req.query.dataFim;

    let filtro = "1=1";
    let params = [];

    if(dataInicio && dataFim){
      filtro = "DATE(v.data) BETWEEN ? AND ?";
      params = [dataInicio,dataFim];
    }else if(tipo === "Diario"){
      filtro = "DATE(v.data) = CURDATE()";
    }else if(tipo === "Semanal"){
      filtro = "v.data >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
    }else if(tipo === "Mensal"){
      filtro = "MONTH(v.data)=MONTH(CURDATE()) AND YEAR(v.data)=YEAR(CURDATE())";
    }else if(tipo === "Anual"){
      filtro = "YEAR(v.data)=YEAR(CURDATE())";
    }else{
      filtro = "1=1";
    }

    const [vendas] = await db.query(`

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

    `, params);

    const totalVendas = vendas.length;
    const itensVendidos = vendas.reduce((s,v)=> s + v.quantidade,0);
    const faturamento = vendas.reduce((s,v)=> s + (v.quantidade * v.preco),0);

    res.json({
      totalVendas,
      itensVendidos,
      faturamento,
      detalhes:vendas
    });

  }catch(err){
    console.log(err);
    res.status(500).json({erro:"Erro no relatório"});
  }

});

module.exports = router;