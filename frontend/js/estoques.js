document.addEventListener("DOMContentLoaded", () => {
  const productsTableBody = document.getElementById("productsTableBody");
  const filterButtons = Array.from(document.querySelectorAll(".filter-btn"));

  const totalCount = document.getElementById("totalCount");
  const lowCount = document.getElementById("lowCount");
  const criticalCount = document.getElementById("criticalCount");

  const stockValue = document.getElementById("stockValue");
  const lowValue = document.getElementById("lowValue");
  const criticalValue = document.getElementById("criticalValue");

  const products = [
    { nome: "Alga Nori", categoria: "Algas Marinhas", tipo: "Unidade", estoque: 50, unidade: "un" },
    { nome: "Salmão Fresco", categoria: "Peixes Frescos", tipo: "Quilograma", estoque: 25, unidade: "kg" },
    { nome: "Sardinha em Conserva", categoria: "Conservas", tipo: "Unidade", estoque: 100, unidade: "un" }
  ];

  const getStatus = (estoque) => {
    if (estoque < 5) return { key: "critical", label: "Crítico" };
    if (estoque <= 10) return { key: "low", label: "Baixo" };
    return { key: "normal", label: "Normal" };
  };

  const renderRows = (filter = "todos") => {
    productsTableBody.innerHTML = "";

    const visibleProducts = products.filter((product) => {
      const status = getStatus(product.estoque).key;
      if (filter === "baixo") return status === "low";
      if (filter === "critico") return status === "critical";
      return true;
    });

    visibleProducts.forEach((product) => {
      const status = getStatus(product.estoque);

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${product.nome}</td>
        <td>${product.categoria}</td>
        <td><span class="pill type">${product.tipo}</span></td>
        <td>${product.estoque} ${product.unidade}</td>
        <td><span class="pill status ${status.key}">${status.label}</span></td>
        <td><button class="update-btn" type="button">Atualizar</button></td>
      `;

      productsTableBody.appendChild(row);
    });
  };

  const updateCounters = () => {
    const low = products.filter((item) => item.estoque >= 5 && item.estoque <= 10).length;
    const critical = products.filter((item) => item.estoque < 5).length;
    const total = products.length;

    totalCount.textContent = total;
    lowCount.textContent = low;
    criticalCount.textContent = critical;

    stockValue.textContent = total;
    lowValue.textContent = low;
    criticalValue.textContent = critical;
  };

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filterButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      renderRows(button.dataset.filter);
    });
  });

  updateCounters();
  renderRows();
});