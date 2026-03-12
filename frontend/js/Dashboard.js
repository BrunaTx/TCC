// Atualiza a data
const dateLabel = document.getElementById("dateLabel");
if (dateLabel) {
  const today = new Date();
  dateLabel.textContent = today.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Atualiza os cards do dashboard
function updateDashboard(stats) {
  const faturamento = Number(stats.faturamento) || 0;
  const vendas = Number(stats.vendas) || 0;
  const produtosVendidos = Number(stats.produtosVendidos) || 0;
  const estoqueBaixo = Number(stats.estoqueBaixo) || 0;

  document.querySelector(".stats-grid .stat-card:nth-child(1) .value").textContent = `R$ ${faturamento.toFixed(2)}`;
  document.querySelector(".stats-grid .stat-card:nth-child(1) .meta").textContent = `${vendas} vendas realizadas`;

  document.querySelector(".stats-grid .stat-card:nth-child(2) .value").textContent = produtosVendidos;
  document.querySelector(".stats-grid .stat-card:nth-child(2) .meta").textContent = "itens no total";

  document.querySelector(".stats-grid .stat-card:nth-child(3) .value").textContent = estoqueBaixo;
  document.querySelector(".stats-grid .stat-card:nth-child(3) .meta").textContent = "produtos abaixo de 10 unidades";


// Seleciona o elemento de resumo
const resumo = document.querySelector(".summary-card p");

// Texto principal do resumo, com ponto inicial
let html = vendas === 0
  ? "• Sem movimentações registradas até o momento."
  : `<p style="margin-top:10px; font-weight:bold; color:black;">• Hoje foram registradas ${vendas} vendas, totalizando R$ ${faturamento.toFixed(2)}.</p>`;

// Lista de produtos com estoque baixo, com título e itens em preto
if (stats.produtosEstoqueBaixo && stats.produtosEstoqueBaixo.length > 0) {
  html += `<p style="margin-top:10px; font-weight:bold; color:black;">• Produtos que tiveram diminuição no estoque hoje:</p>`;
  
  stats.produtosEstoqueBaixo.forEach(prod => {
    html += `<p style="color:black;">${prod.nome} - ${prod.estoque} ${prod.tipo_venda === 'kg' ? 'kg' : 'un'}</p>`;
  });



}

// Atualiza o conteúdo do resumo
resumo.innerHTML = html;
}

// Pega os dados do backend
fetch("/api/dashboard")
  .then(res => res.json())
  .then(data => updateDashboard(data))
  .catch(err => console.error("Erro ao carregar dashboard:", err));