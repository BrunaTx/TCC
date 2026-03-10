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
  const categoriaSelect = form.categoria;

  let editingRow = null;

  // =========================
  // Modal de descrição
  // =========================
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

  // =========================
  // FUNÇÃO GENÉRICA PARA FETCH JSON
  // =========================
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

  // =========================
  // Carregar categorias
  // =========================
  async function carregarCategorias() {
    const categorias = await fetchJson("/api/categorias");
    if (!categorias) return;

    categoriaSelect.innerHTML = `<option value="">Selecione</option>`;
    categorias.forEach(c => {
      const option = document.createElement("option");
      option.value = c.id_categoria;
      option.textContent = c.nome;
      categoriaSelect.appendChild(option);
    });
  }

  // =========================
  // Carregar produtos
  // =========================
  async function carregarProdutos() {
    await carregarCategorias();

    const produtos = await fetchJson("/api/produtos");
    if (!produtos) return;

    tableBody.innerHTML = "";

    produtos.forEach(prod => {
      const row = document.createElement("tr");
      row.dataset.id = prod.id_produto;
      row.dataset.descricao = prod.descricao || "";
      row.dataset.id_categoria = prod.id_categoria;
      row.innerHTML = `
        <td>${prod.nome}</td>
        <td>${prod.categoria}</td>
        <td><span class="tag">${prod.tipo_venda === "kg" ? "Quilograma" : "Unidade"}</span></td>
        <td>R$ ${parseFloat(prod.preco).toFixed(2)}</td>
        <td>${prod.tipo_venda === "kg" ? parseFloat(prod.estoque).toFixed(2) : prod.estoque} ${prod.tipo_venda === "kg" ? "kg" : "un"}</td>
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
    });
  }

  carregarProdutos();

  // =========================
  // Abrir modal
  // =========================
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

  // =========================
  // Ajustar estoque pelo tipo
  // =========================
  tipoSelect.addEventListener("change", () => {
    if (tipoSelect.value === "kg") {
      estoqueInput.step = "0.01";
      if (!editingRow) estoqueInput.value = "0.00";
    } else {
      estoqueInput.step = "1";
      if (!editingRow) estoqueInput.value = "0";
    }
  });

  // Impedir valores negativos
  estoqueInput.addEventListener("input", () => {
    if (estoqueInput.value < 0) estoqueInput.value = 0;
  });
  form.preco.addEventListener("input", () => {
    if (form.preco.value < 0) form.preco.value = 0;
  });

  // =========================
  // Salvar ou atualizar produto
  // =========================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const dados = {
      nome: form.nomeProduto.value.trim(),
      id_categoria: parseInt(categoriaSelect.value),
      tipo_venda: form.tipoVenda.value,
      preco: parseFloat(form.preco.value).toFixed(2),
      estoque: tipoSelect.value === "kg"
        ? parseFloat(estoqueInput.value).toFixed(2)
        : parseInt(estoqueInput.value),
      descricao: descricaoInput.value.trim()
    };

    if (!dados.nome || !dados.id_categoria) {
      alert("Preencha o nome e a categoria!");
      return;
    }

    try {
      if (editingRow) {
        const id = editingRow.dataset.id;
        await fetchJson(`/api/produtos/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dados)
        });
      } else {
        await fetchJson("/api/produtos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dados)
        });
      }

      closeModal();
      carregarProdutos();

    } catch (err) {
      console.error(err);
      alert("Erro ao salvar produto. Veja o console.");
    }
  });

  // =========================
  // Editar, excluir e info
  // =========================
  tableBody.addEventListener("click", async (e) => {
    const row = e.target.closest("tr");
    if (!row) return;
    const btn = e.target.closest("button");
    if (!btn) return;

    const id = row.dataset.id;

    try {
      // Excluir
      if (btn.classList.contains("btn-danger")) {
        await fetchJson(`/api/produtos/${id}`, { method: "DELETE" });
        carregarProdutos();
        return;
      }

      // Editar
      if (btn.classList.contains("btn-edit")) {
        editingRow = row;
        form.nomeProduto.value = row.children[0].textContent;
        form.categoria.value = row.dataset.id_categoria;
        form.tipoVenda.value = row.children[2].textContent.trim() === "Quilograma" ? "kg" : "un";
        form.preco.value = row.children[3].textContent.replace("R$ ", "");
        form.estoque.value = row.children[4].textContent.split(" ")[0];
        descricaoInput.value = row.dataset.descricao || "";
        tipoSelect.dispatchEvent(new Event("change"));
        modal.classList.remove("hidden");
        return;
      }

      // Info
      if (btn.classList.contains("btn-info")) {
        infoText.textContent = row.dataset.descricao || "Sem descrição.";
        infoModal.classList.remove("hidden");
        return;
      }

    } catch (err) {
      console.error(err);
      alert("Erro ao processar ação.");
    }
  });

  // =========================
  // Filtrar tabela
  // =========================
  searchInput.addEventListener("input", () => {
    const termo = searchInput.value.toLowerCase();
    tableBody.querySelectorAll("tr").forEach(linha => {
      linha.style.display = linha.innerText.toLowerCase().includes(termo) ? "" : "none";
    });
  });

});