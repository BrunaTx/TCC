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
  // FUNÇÃO PARA CARREGAR CLIENTES DO BACKEND
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
            <button type="button" class="btn-info"><span class="material-symbols-outlined">list</span></button>
            <button type="button" class="btn-edit"><span class="material-symbols-outlined">edit_note</span></button>
            <button type="button" class="btn-danger"><span class="material-symbols-outlined">delete</span></button>
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
  // SALVAR OU EDITAR CLIENTE
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

    if (!/^\d{11}$/.test(dados.cpf)) { alert("CPF inválido! Deve conter 11 números."); return; }
    if (!/^\d{10,11}$/.test(dados.telefone)) { alert("Telefone inválido! Deve conter 10 ou 11 números."); return; }

    try {
      if (editingRow) {
        // Editar cliente
        const id = editingRow.dataset.id;
        const res = await fetch(`/api/clientes/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dados)
        });
        if (!res.ok) throw new Error("Erro ao atualizar cliente");
      } else {
        // Criar cliente
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

    // EXCLUIR
    if (e.target.closest(".btn-danger")) {
      const id = row.dataset.id;
      if (confirm("Deseja realmente excluir este cliente?")) {
        try {
          const res = await fetch(`/api/clientes/${id}`, { method: "DELETE" });
          if (!res.ok) throw new Error("Erro ao excluir cliente");
          row.remove();
        } catch (err) {
          console.error(err);
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
  const id_cliente = row.dataset.id; // use o id_cliente
  try {
    const res = await fetch(`/api/clientes/compras/${id_cliente}`);
    if (!res.ok) throw new Error("Erro ao carregar compras");
    const compras = Object.values(await res.json());
    showPurchases(row, compras);
  } catch (err) {
    console.error(err);
    alert("Erro ao conectar com o servidor.");
  }
  return;
}
  });

  // =========================
  // FILTRAR CLIENTES
  // =========================
  searchInput.addEventListener("input", () => {
    const termo = searchInput.value.toLowerCase();
    tableBody.querySelectorAll("tr").forEach(linha => {
      const nome = linha.children[0].textContent.toLowerCase();
      const cpf = linha.children[1].textContent;
      linha.style.display = (nome.includes(termo) || cpf.includes(termo)) ? "" : "none";
    });
  });

  // =========================
  // MOSTRAR COMPRAS
  // =========================
  // =========================
// MOSTRAR COMPRAS
// =========================
function showPurchases(row, compras) {
  purchasesList.innerHTML = compras.length
    ? compras.map((c, i) => {
        // c já contém: data, total, pagamento, produtos[]
        const pagamento = c.pagamento || "Desconhecido";
        const produtosText = c.produtos.map(p => `${p.nome} x${p.quantidade}`).join(", ");
        return `
          <div style="border-bottom:1px solid #ccc; padding:6px;">
            <strong>Compra ${i + 1}:</strong> Total R$ ${c.total.toFixed(2)} | Pagamento: ${pagamento} | Data: ${c.data}
            <br>Produtos: ${produtosText}
          </div>
        `;
      }).join("")
    : `<div style="color:#666">Nenhuma compra registrada.</div>`;

  purchasesList.innerHTML += `<button id="generatePDFBtn" class="primary-btn" style="margin-top:10px;">Gerar PDF</button>`;

  const btn = document.getElementById("generatePDFBtn");
  btn.replaceWith(btn.cloneNode(true)); // remove listeners antigos
  document.getElementById("generatePDFBtn").addEventListener("click", () => generatePDF(row, compras));

  purchasesModal.classList.remove("hidden");
}

// =========================
// GERAR PDF
// =========================
function generatePDF(row, compras) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const clienteNome = row.children[0].textContent;
  const clienteCPF = row.children[1].textContent;
  const clienteTelefone = row.children[2].textContent;
  const clienteEndereco = row.children[3].textContent;

  let y = 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("RELATÓRIO DE COMPRAS", 105, y, { align: "center" });
  y += 15;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(`Nome: ${clienteNome}`, 20, y); y += 7;
  doc.text(`CPF: ${clienteCPF}`, 20, y); y += 7;
  doc.text(`Telefone: ${clienteTelefone}`, 20, y); y += 7;
  doc.text(`Endereço: ${clienteEndereco}`, 20, y); y += 10;

  compras.forEach((c, i) => {
    const pagamento = c.pagamento || "Desconhecido";
    doc.text(`Compra ${i + 1} - Total: R$ ${c.total.toFixed(2)} - Pagamento: ${pagamento} - Data: ${c.data}`, 20, y);
    y += 7;
    c.produtos.forEach(p => {
      doc.text(`• ${p.nome} x${p.quantidade}`, 25, y);
      y += 6;
    });
    y += 5;
  });

  doc.save(`Relatorio-${clienteNome}.pdf`);
}

  // =========================
  // FECHAR MODAL COMPRAS
  // =========================
  closePurchasesBtn.addEventListener("click", () => {
    purchasesModal.classList.add("hidden");
    purchasesList.innerHTML = "";
  });

});