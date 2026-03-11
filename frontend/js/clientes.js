document.addEventListener("DOMContentLoaded", () => {

  const modal = document.getElementById("clientModal");
  const openBtn = document.getElementById("openModalBtn");
  const closeBtn = document.getElementById("closeModalBtn");
  const cancelBtn = document.getElementById("cancelModalBtn");
  const form = document.getElementById("clientForm");
  const tableBody = document.getElementById("clientsTableBody");
  const searchInput = document.getElementById("searchInput");

  const purchasesModal = document.getElementById("purchasesModal");
  const closePurchasesBtn = document.getElementById("closePurchasesModalBtn");
  const purchasesList = document.getElementById("purchasesList");

  let editingRow = null;

  // =========================
  // FORMATAR DATA
  // =========================
  function formatarDataBR(data) {
    const d = new Date(data);

    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    }) + " às " +
    d.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  // =========================
  // CARREGAR CLIENTES
  // =========================
  async function carregarClientes() {
    try {
      const res = await fetch("/api/clientes");
      if (!res.ok) throw new Error("Falha ao carregar clientes");

      const clientes = await res.json();

      tableBody.innerHTML = "";

      clientes.forEach(c => {

        const row = document.createElement("tr");
        row.dataset.id = c.id_cliente;

        row.innerHTML = `
          <td>${c.nome}</td>
          <td>${c.cpf}</td>
          <td>${c.telefone}</td>
          <td>${c.endereco}</td>
          <td class="actions">
            <button type="button" class="btn-info">
              <span class="material-symbols-outlined">list</span>
            </button>

            <button type="button" class="btn-edit">
              <span class="material-symbols-outlined">edit_note</span>
            </button>

            <button type="button" class="btn-danger">
              <span class="material-symbols-outlined">delete</span>
            </button>
          </td>
        `;

        tableBody.appendChild(row);
      });

    } catch (err) {
      console.error("Erro ao carregar clientes:", err);
      alert("Erro ao conectar com o servidor.");
    }
  }

  carregarClientes();

  // =========================
  // ABRIR MODAL
  // =========================
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

  // =========================
  // SALVAR CLIENTE
  // =========================
  form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const dados = {
      nome: form.nomeCliente.value.trim(),
      cpf: form.cpfCliente.value.trim(),
      telefone: form.telefoneCliente.value.trim(),
      endereco: form.enderecoCliente.value.trim()
    };

    if (!dados.nome || !dados.cpf) {
      alert("Nome e CPF são obrigatórios!");
      return;
    }

    if (!/^\d{11}$/.test(dados.cpf)) {
      alert("CPF inválido! Deve conter 11 números.");
      return;
    }

    if (!/^\d{10,11}$/.test(dados.telefone)) {
      alert("Telefone inválido!");
      return;
    }

    try {

      if (editingRow) {

        const id = editingRow.dataset.id;

        const res = await fetch(`/api/clientes/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dados)
        });

        if (!res.ok) throw new Error();

      } else {

        const res = await fetch("/api/clientes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dados)
        });

        if (!res.ok) {
          const err = await res.json();
          alert(err.erro || "Erro ao criar cliente");
          return;
        }
      }

      closeModal();
      carregarClientes();

    } catch (err) {
      console.error(err);
      alert("Erro ao salvar cliente.");
    }

  });

  // =========================
  // AÇÕES NA TABELA
  // =========================
  tableBody.addEventListener("click", async (e) => {

    const row = e.target.closest("tr");
    if (!row) return;

    const id = row.dataset.id;

    // EXCLUIR
    if (e.target.closest(".btn-danger")) {

      if (confirm("Deseja excluir este cliente?")) {

        try {

          const res = await fetch(`/api/clientes/${id}`, {
            method: "DELETE"
          });

          if (!res.ok) throw new Error();

          row.remove();

        } catch {
          alert("Erro ao excluir cliente.");
        }

      }

      return;
    }

    // EDITAR
    if (e.target.closest(".btn-edit")) {

      editingRow = row;

      form.nomeCliente.value = row.children[0].textContent;
      form.cpfCliente.value = row.children[1].textContent;
      form.telefoneCliente.value = row.children[2].textContent;
      form.enderecoCliente.value = row.children[3].textContent;

      modal.classList.remove("hidden");

      return;
    }

    // VER COMPRAS
    if (e.target.closest(".btn-info")) {

      try {

        const res = await fetch(`/api/clientes/compras/${id}`);

        if (!res.ok) throw new Error();

        const data = await res.json();

        const compras = Object.values(data || {});

        showPurchases(row, compras);

      } catch (err) {

        console.error(err);
        alert("Erro ao carregar compras.");

      }

    }

  });

  // =========================
  // FILTRO
  // =========================
  searchInput.addEventListener("input", () => {

    const termo = searchInput.value.toLowerCase();

    tableBody.querySelectorAll("tr").forEach(linha => {

      const nome = linha.children[0].textContent.toLowerCase();
      const cpf = linha.children[1].textContent;

      linha.style.display =
        nome.includes(termo) || cpf.includes(termo)
          ? ""
          : "none";

    });

  });

  // =========================
  // MOSTRAR COMPRAS
  // =========================
  function showPurchases(row, compras) {

    purchasesList.innerHTML = "";

    if (!compras.length) {

      purchasesList.innerHTML =
        `<div class="no-purchases">Nenhuma compra registrada.</div>`;

    } else {

      compras.forEach((c, i) => {

       const pagamento = c.pagamento || "Não informado";
const data = formatarDataBR(c.data);

const produtosHTML = c.produtos.map(p => `
  <div class="produto-item">
    <span>${p.nome}</span>
    <span>x${p.quantidade}</span>
  </div>
`).join("");

purchasesList.innerHTML += `
  <div class="compra-card">

    <div class="compra-header">
      <strong>Compra #${i + 1}</strong>
      <div class="data-compra">
        <strong>Data:</strong> <span class="data">${data}</span>
      </div>
    </div>

    <div class="produtos-lista">
      <strong class="produto-titulo">Produto:</strong>
      <div class="produtos">
        ${produtosHTML}
      </div>
    </div>

    <div class="compra-footer">
      <span>
        <strong>Pagamento:</strong>
        <span class="total">R$ ${c.total.toFixed(2)}</span>
        <b>(${pagamento})</b>
      </span>
    </div>

  </div>
`;

      });

    }

    purchasesList.innerHTML += `
      <button id="generatePDFBtn" class="primary-btn gerar-pdf-btn">
        Gerar PDF
      </button>
    `;

    document
      .getElementById("generatePDFBtn")
      .addEventListener("click", () => generatePDF(row, compras));

    purchasesModal.classList.remove("hidden");
  }

  // =========================
  // GERAR PDF
  // =========================
  function generatePDF(row, compras) {

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const nome = row.children[0].textContent;
    const cpf = row.children[1].textContent;
    const telefone = row.children[2].textContent;
    const endereco = row.children[3].textContent;

    let y = 20;

    doc.setFontSize(20);
    doc.text("RELATÓRIO DE COMPRAS", 105, y, { align: "center" });

    y += 15;

    doc.setFontSize(12);

    doc.text(`Cliente: ${nome}`, 20, y); y += 6;
    doc.text(`CPF: ${cpf}`, 20, y); y += 6;
    doc.text(`Telefone: ${telefone}`, 20, y); y += 6;
    doc.text(`Endereço: ${endereco}`, 20, y); y += 10;

    compras.forEach((c, i) => {

      const data = formatarDataBR(c.data);
      const pagamento = c.pagamento || "Não informado";

      doc.text(`Compra #${i + 1}`, 20, y);
      doc.text(`Data: ${data}`, 110, y);

      y += 6;

      doc.text(`Pagamento: ${pagamento}`, 20, y);
      doc.text(`Total: R$ ${c.total.toFixed(2)}`, 110, y);

      y += 8;

      c.produtos.forEach(p => {
        doc.text(`• ${p.nome} x${p.quantidade}`, 25, y);
        y += 6;
      });

      y += 6;

      if (y > 270) {
        doc.addPage();
        y = 20;
      }

    });

    doc.save(`Historico-${nome}.pdf`);
  }

  // =========================
  // FECHAR MODAL
  // =========================
  closePurchasesBtn.addEventListener("click", () => {
    purchasesModal.classList.add("hidden");
    purchasesList.innerHTML = "";
  });

});