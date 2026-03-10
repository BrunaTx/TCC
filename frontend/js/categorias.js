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

  /* =========================
  FUNÇÃO GENÉRICA PARA TRATAR 401
  ========================= */
  async function fetchJson(url, options = {}) {
    const res = await fetch(url, options);
    if (res.status === 401) {
      alert("Sessão expirada. Redirecionando para login...");
      window.location.href = "/";
      return null;
    }
    if (!res.ok) throw new Error("Erro ao conectar com o servidor");
    return await res.json();
  }

  /* =========================
  CARREGAR CATEGORIAS
  ========================= */
  async function carregarCategorias() {
    const categorias = await fetchJson("/api/categorias");
    if (!categorias) return;

    tableBody.innerHTML = "";

    categorias.forEach(c => {
      const row = document.createElement("tr");
      row.dataset.id = c.id_categoria;
      row.innerHTML = `
        <td>${c.nome}</td>
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
    });
  }

  carregarCategorias();

  /* =========================
  ABRIR E FECHAR MODAL
  ========================= */
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

  closeProductsModalBtn.addEventListener("click", () => {
    categoryProductsModal.classList.add("hidden");
    categoryProductsList.innerHTML = "";
  });

  /* =========================
  SALVAR OU EDITAR CATEGORIA
  ========================= */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nome = form.nomeCategoria.value.trim();
    if (!nome) return;

    try {
      if (editingRow) {
        const id = editingRow.dataset.id;
        await fetchJson(`/api/categorias/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nome })
        });
      } else {
        await fetchJson("/api/categorias", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nome })
        });
      }
      closeModal();
      carregarCategorias();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar categoria.");
    }
  });

  /* =========================
  EDITAR / EXCLUIR / LISTAR PRODUTOS
  ========================= */
  tableBody.addEventListener("click", async (e) => {
    const row = e.target.closest("tr");
    if (!row) return;
    const id = row.dataset.id;

    const btn = e.target.closest("button");
    if (!btn) return;

    try {
      // Excluir
      if (btn.classList.contains("btn-danger")) {
        await fetchJson(`/api/categorias/${id}`, { method: "DELETE" });
        row.remove();
      }

      // Editar
      if (btn.classList.contains("btn-edit")) {
        editingRow = row;
        form.nomeCategoria.value = row.children[0].textContent;
        modal.classList.remove("hidden");
      }

      // Listar produtos
      if (btn.classList.contains("btn-list")) {
        const produtos = await fetchJson(`/api/produtos/categoria/${id}`);
        if (!produtos) return;

        categoryProductsList.innerHTML = produtos.length
          ? produtos.map(p => `<div>- ${p.nome}</div>`).join("")
          : `<div style="color:#666">Nenhum produto cadastrado nesta categoria.</div>`;

        categoryProductsModal.classList.remove("hidden");
      }

    } catch (err) {
      console.error(err);
      alert("Erro ao processar ação.");
    }
  });

  /* =========================
  FILTRO
  ========================= */
  searchInput.addEventListener("input", () => {
    const termo = searchInput.value.toLowerCase();
    tableBody.querySelectorAll("tr").forEach((linha) => {
      linha.style.display = linha.innerText.toLowerCase().includes(termo) ? "" : "none";
    });
  });

});