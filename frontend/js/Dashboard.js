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

function updateDashboard(stats) {

  const faturamento = Number(stats.faturamento) || 0;
  const vendas = Number(stats.vendas) || 0;
  const produtosVendidos = Number(stats.produtosVendidos) || 0;

  const estoqueBaixoUn = Number(stats.estoqueBaixoUn) || 0;
  const estoqueBaixoKg = Number(stats.estoqueBaixoKg) || 0;

  document.querySelector(".stats-grid .stat-card:nth-child(1) .value").textContent = `R$ ${faturamento.toFixed(2)}`;
  document.querySelector(".stats-grid .stat-card:nth-child(1) .meta").textContent = `${vendas} vendas realizadas`;

  document.querySelector(".stats-grid .stat-card:nth-child(2) .value").textContent = produtosVendidos;
  document.querySelector(".stats-grid .stat-card:nth-child(2) .meta").textContent = "itens no total";

  document.querySelector(".stats-grid .stat-card:nth-child(3) .value").textContent = estoqueBaixoUn;
  document.querySelector(".stats-grid .stat-card:nth-child(3) .meta").textContent = "produtos abaixo de 10 unidades";

  document.querySelector(".stats-grid .stat-card:nth-child(4) .value").textContent = estoqueBaixoKg;
  document.querySelector(".stats-grid .stat-card:nth-child(4) .meta").textContent = "produtos abaixo de 5 kg";

  const resumo = document.querySelector(".summary-card p");

  let html = vendas === 0
    ? "• Sem movimentações registradas até o momento."
    : `<p style="margin-top:10px; font-weight:bold; color: black">• Hoje foram registradas ${vendas} vendas, totalizando R$ ${faturamento.toFixed(2)}.</p>`;

  // Produtos com estoque baixo
  if (stats.produtosEstoqueBaixo && stats.produtosEstoqueBaixo.length > 0) {

    html += `<p style="margin-top:10px; font-weight:bold; color: black">• Produtos com estoque baixo:</p>`;

    stats.produtosEstoqueBaixo.forEach(prod => {

      let estoque = prod.tipo_venda === "un"
        ? parseInt(prod.estoque)
        : Number(prod.estoque);

      let unidade = prod.tipo_venda === "kg"
        ? "kg"
        : (estoque == 1 ? "unidade" : "unidades");

      html += `<p>${prod.nome} - ${estoque} ${unidade} em estoque</p>`;

    });
  }

  // Mais vendido unidade
  if (stats.maisVendidoUn) {

    let total = parseInt(stats.maisVendidoUn.total);
    let unidade = total == 1 ? "unidade" : "unidades";

    html += `<p style="margin-top:10px; font-weight:bold; color: black">• Produto mais vendido (unidades):</p>`;
    html += `<p>${stats.maisVendidoUn.nome} - ${total} ${unidade}</p>`;
  }

  // Mais vendido kg
  if (stats.maisVendidoKg) {

    let total = Number(stats.maisVendidoKg.total);

    html += `<p style="margin-top:10px; font-weight:bold; color: black">• Produto mais vendido (kg):</p>`;
    html += `<p>${stats.maisVendidoKg.nome} - ${total} kg</p>`;
  }

  // Menos vendido unidade
  if (stats.menosVendidoUn) {

    let total = parseInt(stats.menosVendidoUn.total);
    let unidade = total == 1 ? "unidade" : "unidades";

    html += `<p style="margin-top:10px; font-weight:bold; color: black">• Produto menos vendido (unidades):</p>`;
    html += `<p>${stats.menosVendidoUn.nome} - ${total} ${unidade}</p>`;
  }

  // Menos vendido kg
  if (stats.menosVendidoKg) {

    let total = Number(stats.menosVendidoKg.total);

    html += `<p style="margin-top:10px; font-weight:bold; color: black">• Produto menos vendido (kg):</p>`;
    html += `<p>${stats.menosVendidoKg.nome} - ${total} kg</p>`;
  }

  resumo.innerHTML = html;
}

// Pega os dados
fetch("/api/dashboard")
  .then(res => res.json())
  .then(data => updateDashboard(data))
  .catch(err => console.error("Erro ao carregar dashboard:", err));