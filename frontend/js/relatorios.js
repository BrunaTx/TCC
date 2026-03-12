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



async function carregarRelatorio(){

try{

const tipo = document.getElementById("reportType").value;
const dataInicio = document.getElementById("dataInicio").value;
const dataFim = document.getElementById("dataFim").value;

let url = `/api/relatorios?tipo=${tipo}`;

if(dataInicio && dataFim){
url += `&dataInicio=${dataInicio}&dataFim=${dataFim}`;
}

const res = await fetch(url);

const dados = await res.json();

document.getElementById("totalVendas").innerText = dados.totalVendas || 0;
document.getElementById("itensVendidos").innerText = dados.itensVendidos || 0;

document.getElementById("faturamento").innerText =
"R$ " + Number(dados.faturamento || 0).toFixed(2);

const lista = document.getElementById("purchasesList");
lista.innerHTML = "";

dados.detalhes.forEach(item=>{

const div = document.createElement("div");

const total = item.preco * item.quantidade;

const dataVenda = new Date(item.data);

const dataFormatada =
dataVenda.toLocaleDateString("pt-BR") +
" " +
dataVenda.toLocaleTimeString("pt-BR");

div.innerText =
`Produto: ${item.nome} | Quantidade: ${item.quantidade} | Valor: R$ ${total.toFixed(2)} | Data: ${dataFormatada}`;

lista.appendChild(div);

});

}catch(err){

console.error("Erro:",err);

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