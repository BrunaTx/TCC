document.addEventListener("DOMContentLoaded", () => {

  const btn = document.getElementById("generatePDFBtn");

  if(btn){
    btn.addEventListener("click", gerarPDF);
  }

  document.getElementById("reportType").addEventListener("change", carregarRelatorio);
  document.getElementById("dataInicio").addEventListener("change", carregarRelatorio);
  document.getElementById("dataFim").addEventListener("change", carregarRelatorio);

  carregarRelatorio();

});

async function carregarRelatorio() {
  try {
    const tipo = document.getElementById("reportType").value;
    const dataInicio = document.getElementById("dataInicio").value;
    const dataFim = document.getElementById("dataFim").value;

    let url = `/api/relatorios?tipo=${tipo}`;
    if (dataInicio && dataFim) {
      url += `&dataInicio=${dataInicio}&dataFim=${dataFim}`;
    }

    const res = await fetch(url);
    const dados = await res.json();

    // =============================
    // RESUMO BONITINHO
    // =============================
    const totalVendas = Number(dados.totalVendas || 0);

    // converte itensVendidos para número seguro
    let itensVendidosRaw = Number(dados.itensVendidos || 0);
    let itensFormatado;

    if (itensVendidosRaw % 1 !== 0) {
      // decimal, exibir duas casas
      itensFormatado = itensVendidosRaw.toFixed(2).replace(".", ",");
    } else {
      // inteiro
      itensFormatado = itensVendidosRaw.toString();
    }

    document.getElementById("totalVendas").innerText = totalVendas;
    document.getElementById("itensVendidos").innerText = itensFormatado;

    const faturamento = Number(dados.faturamento || 0).toFixed(2).replace(".", ",");
    document.getElementById("faturamento").innerText = "R$ " + faturamento;

    // =============================
    // DETALHES DOS ITENS
    // =============================
    const lista = document.getElementById("purchasesList");
    lista.innerHTML = "";

    dados.detalhes.forEach(item => {
      const div = document.createElement("div");

      // total do item
      const totalItem = (item.preco * Number(item.quantidade)).toFixed(2).replace(".", ",");

      // data formatada
      const dataVenda = new Date(item.data);
      const dataFormatada =
        dataVenda.toLocaleDateString("pt-BR") + " " + dataVenda.toLocaleTimeString("pt-BR");

      let unidade;
      let quantidade;

      if (item.tipo_venda === "kg") {
        unidade = "kg";
        quantidade = Number(item.quantidade).toFixed(2).replace(".", ",");
      } else {
        unidade = "un";
        quantidade = parseInt(item.quantidade);
      }

      div.innerText =
        `Produto: ${item.nome} | Quantidade: ${quantidade} ${unidade} | Valor: R$ ${totalItem} | Data: ${dataFormatada}`;
      lista.appendChild(div);
    });

  } catch (err) {
    console.error("Erro ao carregar relatório:", err);
  }
}

function gerarPDF(){

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const tipo = document.getElementById("reportType").value;
  const dataInicio = document.getElementById("dataInicio").value;
  const dataFim = document.getElementById("dataFim").value;
  const data = `${dataInicio || "-"} até ${dataFim || "-"}`;

  const totalVendas = document.getElementById("totalVendas").innerText;
  const itens = document.getElementById("itensVendidos").innerText;
  const faturamento = document.getElementById("faturamento").innerText;

  let y = 20;

  doc.setFontSize(18);
  doc.text("Relatório de Vendas - Essência do Mar",105,y,{align:"center"});
  y += 15;

  doc.setFontSize(12);
  doc.text(`Tipo de relatório: ${tipo}`,20,y);
  y+=8;

  doc.text(`Período: ${data}`,20,y);
  y+=15;

  doc.text("Resumo:",20,y);
  y+=10;

  doc.text(`Total de vendas: ${totalVendas}`,20,y);
  y+=8;

  doc.text(`Itens vendidos: ${itens}`,20,y);
  y+=8;

  doc.text(`Faturamento: ${faturamento}`,20,y);
  y+=15;

  doc.text("Detalhamento:",20,y);
  y+=10;

  const compras = document.querySelectorAll("#purchasesList div");

  compras.forEach(compra=>{
    const texto = compra.innerText;
    const linhas = doc.splitTextToSize(texto,170);
    doc.text(linhas,20,y);
    y += linhas.length * 7;
    if(y>270){
      doc.addPage();
      y=20;
    }
    y+=5;
  });

  doc.save("relatorio-vendas.pdf");

}