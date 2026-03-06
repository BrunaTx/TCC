document.addEventListener("DOMContentLoaded", () => {

const btn = document.getElementById("generatePDFBtn");

if(btn){
btn.addEventListener("click", gerarPDF);
}

});


function gerarPDF(){

const { jsPDF } = window.jspdf;

const doc = new jsPDF();

const tipo = document.getElementById("reportType").value;
const data = document.getElementById("reportDate").value;

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

doc.text(`Data: ${data}`,20,y);
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