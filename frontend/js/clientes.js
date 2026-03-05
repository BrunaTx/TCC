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

  // Simulação de compras
  const clientesCompras = {
    "12345678901": [
      { total: 150, pagamento: "Cartão", produtos: [{ nome: "Salmão", quantidade: 2 }], data: "2026-03-03" },
      { total: 70, pagamento: "Dinheiro", produtos: [{ nome: "Alga Nori", quantidade: 1 }], data: "2026-03-01" }
    ],
    "98765432100": [
      { total: 200, pagamento: "PIX", produtos: [{ nome: "Atum", quantidade: 3 }], data: "2026-02-28" }
    ]
  };

  // -----------------------
  // MODAL CLIENTE
  // -----------------------
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

  // -----------------------
  // SUBMIT FORM CLIENTE
  // -----------------------
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const nome = form.nomeCliente.value.trim();
    const cpf = form.cpfCliente.value.trim();
    const telefone = form.telefoneCliente.value.trim();
    const endereco = form.enderecoCliente.value.trim();

    if (!/^\d{11}$/.test(cpf)) { alert("CPF inválido! Deve conter 11 números."); return; }
    if (!/^\d{10,11}$/.test(telefone)) { alert("Telefone inválido! Deve conter 10 ou 11 números."); return; }

    if (editingRow) {
      editingRow.children[0].textContent = nome;
      editingRow.children[1].textContent = cpf;
      editingRow.children[2].textContent = telefone;
      editingRow.children[3].textContent = endereco;
    } else {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${nome}</td>
        <td>${cpf}</td>
        <td>${telefone}</td>
        <td>${endereco}</td>
        <td class="actions">
          <button type="button" class="btn-info"><span class="material-symbols-outlined">list</span></button>
          <button type="button" class="btn-edit"><span class="material-symbols-outlined">edit_note</span></button>
          <button type="button" class="btn-danger"><span class="material-symbols-outlined">delete</span></button>
        </td>
      `;
      tableBody.appendChild(row);
    }

    closeModal();
  });

  // -----------------------
  // AÇÕES NA TABELA CLIENTES
  // -----------------------
  tableBody.addEventListener("click", (e) => {
    const row = e.target.closest("tr");
    if (!row) return;

    if (e.target.closest(".btn-danger")) row.remove();

    if (e.target.closest(".btn-edit")) {
      editingRow = row;
      form.nomeCliente.value = row.children[0].textContent;
      form.cpfCliente.value = row.children[1].textContent;
      form.telefoneCliente.value = row.children[2].textContent;
      form.enderecoCliente.value = row.children[3].textContent;
      modal.classList.remove("hidden");
    }

    if (e.target.closest(".btn-info")) {
      showPurchases(row);
    }
  });

  // -----------------------
  // PESQUISA
  // -----------------------
  searchInput.addEventListener("input", () => {
    const termo = searchInput.value.toLowerCase();
    tableBody.querySelectorAll("tr").forEach(linha => {
      const nome = linha.children[0].textContent.toLowerCase();
      const cpf = linha.children[1].textContent;
      linha.style.display = (nome.includes(termo) || cpf.includes(termo)) ? "" : "none";
    });
  });

  // -----------------------
  // FUNÇÃO MOSTRAR COMPRAS
  // -----------------------
  function showPurchases(row) {
    const cpfCliente = row.children[1].textContent;
    const compras = clientesCompras[cpfCliente] || [];

    purchasesList.innerHTML = compras.length
      ? compras.map((c, i) => `<div style="border-bottom:1px solid #ccc; padding:6px;">
          <strong>Compra ${i + 1}:</strong> Total R$ ${c.total} | Pagamento: ${c.pagamento} | Data: ${c.data}
          <br>Produtos: ${c.produtos.map(p => `${p.nome} x${p.quantidade}`).join(", ")}
        </div>`).join("")
      : `<div style="color:#666">Nenhuma compra registrada.</div>`;

    purchasesList.innerHTML += `<button id="generatePDFBtn" class="primary-btn" style="margin-top:10px;">Gerar PDF</button>`;

    const btn = document.getElementById("generatePDFBtn");
    btn.replaceWith(btn.cloneNode(true)); // remove listeners antigos
    document.getElementById("generatePDFBtn").addEventListener("click", () => generatePDF(row, compras));

    purchasesModal.classList.remove("hidden");
  }

  // -----------------------
  // FUNÇÃO GERAR PDF
  // -----------------------
function generatePDF(row, compras) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const clienteNome = row.children[0].textContent;
  const clienteCPF = row.children[1].textContent;
  const clienteTelefone = row.children[2].textContent;
  const clienteEndereco = row.children[3].textContent;

 const primaryColor = [46, 125, 50];   // verde corporativo
 const secondaryColor = [139, 195, 74]; // verde claro destaque
 const textColor = [40, 40, 40];

  let y = 20;

  // =============================
  // TÍTULO PRINCIPAL
  // =============================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...primaryColor);
  doc.text("RELATÓRIO DE COMPRAS", 105, y, { align: "center" });

  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.8);
  doc.line(20, y + 5, 190, y + 5);

  y += 20;

  // =============================
  // DADOS DO CLIENTE
  // =============================
  doc.setFontSize(14);
  doc.setTextColor(...primaryColor);
  doc.text("DADOS DO CLIENTE", 20, y);

  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(...textColor);

  doc.text(`Nome: ${clienteNome}`, 20, y);
  y += 7;
  doc.text(`CPF: ${clienteCPF}`, 20, y);
  y += 7;
  doc.text(`Telefone: ${clienteTelefone}`, 20, y);
  y += 7;
  doc.text(`Endereço: ${clienteEndereco}`, 20, y);

  y += 15;

  // =============================
  // COMPRAS
  // =============================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...primaryColor);
  doc.text("HISTÓRICO DE COMPRAS", 20, y);

  y += 10;

  if (compras.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(120);
    doc.text("Nenhuma compra registrada.", 20, y);
  } else {

    compras.forEach((c, i) => {

      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      // Caixa da compra
      doc.setFillColor(245, 248, 252);
      doc.roundedRect(18, y - 6, 174, 28 + c.produtos.length * 6, 3, 3, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...primaryColor);
      doc.text(`Compra ${i + 1}`, 22, y);

      doc.setTextColor(...secondaryColor);
      doc.text(`R$ ${c.total}`, 185, y, { align: "right" });

      y += 8;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...textColor);
      doc.text(`Data: ${c.data}`, 22, y);
      y += 6;
      doc.text(`Pagamento: ${c.pagamento}`, 22, y);

      y += 8;

      c.produtos.forEach(p => {
        doc.text(`• ${p.nome} (Qtd: ${p.quantidade})`, 26, y);
        y += 6;
      });

      y += 10;
    });
  }

  // =============================
  // RODAPÉ
  // =============================
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${pages}`, 105, 290, { align: "center" });
  }

  doc.save(`Relatorio-${clienteNome}.pdf`);
}

  // -----------------------
  // FECHAR MODAL COMPRAS
  // -----------------------
  closePurchasesBtn.addEventListener("click", () => {
    purchasesModal.classList.add("hidden");
    purchasesList.innerHTML = "";
  });
});