document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("categoryModal");
  const openBtn = document.getElementById("openModalBtn");
  const closeBtn = document.getElementById("closeModalBtn");
  const cancelBtn = document.getElementById("cancelModalBtn");
  const form = document.getElementById("categoryForm");
  const tableBody = document.getElementById("categoriesTableBody");
  const searchInput = document.getElementById("searchInput");

  const categoryProductsModal = document.getElementById("categoryProductsModal");
  const closeProductsModalBtn = document.getElementById("closeProductsModalBtn");
  const categoryProductsList = document.getElementById("categoryProductsList");

  let editingRow = null;

  // Simulação de produtos (você pode substituir pelo array real do produtos.js)
  const produtos = [
    { nome: "Alga Nori", categoria: "Algas Marinhas" },
    { nome: "Salmão Fresco", categoria: "Peixes Frescos" },
    { nome: "Lula Congelada", categoria: "Frutos do Mar" },
    { nome: "Algas Kombu", categoria: "Algas Marinhas" },
    { nome: "Atum em Lata", categoria: "Conservas" }
  ];

  /* ABRIR MODAL */
  openBtn.addEventListener("click", () => {
    editingRow = null;
    form.reset();
    modal.classList.remove("hidden");
  });

  function closeModal() {
    modal.classList.add("hidden");
    form.reset();
    editingRow = null;
  }

  closeBtn.addEventListener("click", closeModal);
  cancelBtn.addEventListener("click", closeModal);

  /* SALVAR OU ATUALIZAR CATEGORIA */
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const nome = form.nomeCategoria.value.trim();
    if (!nome) return;

    if (editingRow) {
      editingRow.children[0].textContent = nome;
    } else {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${nome}</td>
        <td class="actions">
          <button type="button" class="btn-list">
            <span class="material-symbols-outlined">list</span>
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

  /* FECHAR MODAL DE LISTA */
  closeProductsModalBtn.addEventListener("click", () => {
    categoryProductsModal.classList.add("hidden");
    categoryProductsList.innerHTML = "";
  });

  /* EDITAR, EXCLUIR E LISTAR PRODUTOS */
  tableBody.addEventListener("click", (e) => {
    const row = e.target.closest("tr");
    if (!row) return;

    // EXCLUIR
    if (e.target.closest(".btn-danger")) {
      row.remove();
    }

    // EDITAR
    if (e.target.closest(".btn-edit")) {
      editingRow = row;
      const nome = row.children[0].textContent;
      form.nomeCategoria.value = nome;
      modal.classList.remove("hidden");
    }

    // LISTAR PRODUTOS
    if (e.target.closest(".btn-list")) {
      const categoria = row.children[0].textContent;
      const produtosDaCategoria = produtos.filter(p => p.categoria === categoria);

      categoryProductsList.innerHTML = produtosDaCategoria.length
        ? produtosDaCategoria.map(p => `<div>- ${p.nome}</div>`).join("")
        : `<div style="color:#666">Nenhum produto cadastrado nesta categoria.</div>`;

      categoryProductsModal.classList.remove("hidden");
    }
  });

  /* FILTRAR TABELA */
  searchInput.addEventListener("input", () => {
    const termo = searchInput.value.toLowerCase();
    tableBody.querySelectorAll("tr").forEach((linha) => {
      linha.style.display =
        linha.innerText.toLowerCase().includes(termo) ? "" : "none";
    });
  });
});