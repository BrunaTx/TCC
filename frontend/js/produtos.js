document.addEventListener("DOMContentLoaded", () => {

  const modal = document.getElementById("productModal");
  const openBtn = document.getElementById("openModalBtn");
  const closeBtn = document.getElementById("closeModalBtn");
  const cancelBtn = document.getElementById("cancelModalBtn");
  const form = document.getElementById("productForm");
  const tableBody = document.getElementById("productsTableBody");
  const searchInput = document.getElementById("searchInput");

  const tipoSelect = form.tipoVenda;
  const estoqueInput = document.getElementById("estoqueInput");
  const descricaoInput = form.querySelector("textarea[name='descricao']");

  // Modal de descrição
  const infoModal = document.createElement("div");
  infoModal.className = "modal hidden";
  infoModal.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <h3>Descrição do Produto</h3>
        <button class="close-btn">×</button>
      </div>
      <p class="info-text"></p>
    </div>
  `;
  document.body.appendChild(infoModal);
  const infoText = infoModal.querySelector(".info-text");
  const infoClose = infoModal.querySelector(".close-btn");
  infoClose.addEventListener("click", () => infoModal.classList.add("hidden"));

  let editingRow = null; // controla se está editando

  // Abrir modal
  openBtn.addEventListener("click", () => {
    editingRow = null;
    form.reset();
    modal.classList.remove("hidden");
    tipoSelect.dispatchEvent(new Event("change"));
  });

  function closeModal() {
    modal.classList.add("hidden");
    form.reset();
    editingRow = null;
  }

  closeBtn.addEventListener("click", closeModal);
  cancelBtn.addEventListener("click", closeModal);

  // Ajustar estoque pelo tipo
  tipoSelect.addEventListener("change", () => {
    if (tipoSelect.value === "kg") {
      estoqueInput.step = "0.01";
      if (!editingRow) estoqueInput.value = "0.00";
    } else {
      estoqueInput.step = "1";
      if (!editingRow) estoqueInput.value = "0";
    }
  });

  // Impedir negativos
  estoqueInput.addEventListener("input", () => {
    if (estoqueInput.value < 0) estoqueInput.value = 0;
  });
  form.preco.addEventListener("input", () => {
    if (form.preco.value < 0) form.preco.value = 0;
  });

  // Salvar ou atualizar produto
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const nome = form.nomeProduto.value.trim();
    const categoria = form.categoria.value;
    const tipoVenda = form.tipoVenda.value;
    const preco = parseFloat(form.preco.value).toFixed(2);
    const estoque = tipoVenda === "kg"
      ? parseFloat(form.estoque.value).toFixed(2)
      : parseInt(form.estoque.value);
    const descricao = descricaoInput.value.trim();

    const tipoLabel = tipoVenda === "kg" ? "Quilograma" : "Unidade";
    const unidade = tipoVenda === "kg" ? "kg" : "un";

    if (editingRow) {
      // Atualiza
      editingRow.children[0].textContent = nome;
      editingRow.children[1].textContent = categoria;
      editingRow.children[2].innerHTML = `<span class="tag">${tipoLabel}</span>`;
      editingRow.children[3].textContent = `R$ ${preco}`;
      editingRow.children[4].textContent = `${estoque} ${unidade}`;
      editingRow.dataset.descricao = descricao;
    } else {
      // Novo produto
      const row = document.createElement("tr");
      row.dataset.descricao = descricao;
      row.innerHTML = `
        <td>${nome}</td>
        <td>${categoria}</td>
        <td><span class="tag">${tipoLabel}</span></td>
        <td>R$ ${preco}</td>
        <td>${estoque} ${unidade}</td>
        <td class="actions">
          <button type="button" class="btn-info">
            <span class="material-symbols-outlined">info</span>
          </button>
          <button type="button" class="btn-edit">
            <span class="material-symbols-outlined">edit_note</span>
          </button>
          <button type="button" class="btn-danger delete-btn">
            <span class="material-symbols-outlined">delete</span>
          </button>
        </td>
      `;
      tableBody.appendChild(row);
    }

    closeModal();
  });

  // Editar, excluir e info
  tableBody.addEventListener("click", (e) => {
    const row = e.target.closest("tr");
    if (!row) return;

    // Excluir
    if (e.target.closest(".btn-danger")) {
      row.remove();
    }

    // Editar
    if (e.target.closest(".btn-edit")) {
      editingRow = row;
      form.nomeProduto.value = row.children[0].textContent;
      form.categoria.value = row.children[1].textContent;
      form.tipoVenda.value = row.children[2].textContent.trim() === "Quilograma" ? "kg" : "un";
      form.preco.value = row.children[3].textContent.replace("R$ ", "");
      form.estoque.value = row.children[4].textContent.split(" ")[0];
      descricaoInput.value = row.dataset.descricao || "";

      tipoSelect.dispatchEvent(new Event("change"));
      modal.classList.remove("hidden");
    }

    // Info
    if (e.target.closest(".btn-info")) {
      infoText.textContent = row.dataset.descricao || "Sem descrição.";
      infoModal.classList.remove("hidden");
    }
  });

  // Filtrar tabela
  searchInput.addEventListener("input", () => {
    const termo = searchInput.value.toLowerCase();
    tableBody.querySelectorAll("tr").forEach(linha => {
      linha.style.display = linha.innerText.toLowerCase().includes(termo) ? "" : "none";
    });
  });
});