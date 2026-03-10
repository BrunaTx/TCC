document.addEventListener("DOMContentLoaded", () => {
  // ============================
  // ELEMENTOS DO DOM
  // ============================
  const clienteSelect = document.getElementById("clienteSelect");
  const produtoSelect = document.getElementById("produtoSelect");
  const quantidadeInput = document.getElementById("quantidade");

  const infoTipo = document.getElementById("infoTipo");
  const infoPreco = document.getElementById("infoPreco");
  const infoEstoque = document.getElementById("infoEstoque");
  const productInfo = document.getElementById("productInfo");

  const cartItems = document.getElementById("cartItems");
  const subtotalEl = document.querySelector("#totalsBox .line-item span:last-child");
  const totalEl = document.querySelector(".total-row span:last-child");
  const totalsBox = document.getElementById("totalsBox");
  const addBtn = document.querySelector(".sale-add-btn");
  const finalizarBtn = document.querySelector(".finalize-btn");

  // ============================
  // VARIÁVEIS
  // ============================
  let carrinho = [];
  let clienteCarrinho = null;

  // ============================
  // CRIAR MÉTODO DE PAGAMENTO
  // ============================
  const pagamentoWrapper = document.createElement("div");
  pagamentoWrapper.style.marginTop = "10px";
  pagamentoWrapper.innerHTML = `
    <div class="line-item">
      <span>Método de pagamento:</span>
      <select id="pagamentoSelect" style="width:50%;">
        <option disabled selected>Selecione</option>
        <option value="Cartão">Cartão</option>
        <option value="Dinheiro">Dinheiro</option>
      </select>
    </div>
    <div id="dinheiroWrapper" style="display:none; margin-top:10px;">
      <div class="line-item">
        <span>Valor pago:</span>
        <input type="number" id="valorPago" min="0" step="0.01" style="width:50%;">
      </div>
      <p id="troco" style="margin-top:5px; font-weight:bold;"></p>
    </div>
  `;
  totalsBox.parentElement.insertBefore(pagamentoWrapper, finalizarBtn);

  const pagamentoSelect = document.getElementById("pagamentoSelect");
  const valorPagoInput = document.getElementById("valorPago");
  const dinheiroWrapper = document.getElementById("dinheiroWrapper");
  const trocoEl = document.getElementById("troco");

  // ============================
  // CARREGAR CLIENTES E PRODUTOS
  // ============================
  async function carregarSelects() {
    try {
      const clientesRes = await fetch("/api/vendas/clientes");
      const clientes = await clientesRes.json();
      clienteSelect.innerHTML = `<option disabled selected>Selecione um cliente</option>`;
      clientes.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.id_cliente;
        opt.textContent = c.nome;
        clienteSelect.appendChild(opt);
      });

      const produtosRes = await fetch("/api/vendas/produtos");
      const produtos = await produtosRes.json();
      produtoSelect.innerHTML = `<option disabled selected>Selecione um produto</option>`;
      produtos.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p.id_produto;
        opt.dataset.preco = p.preco;
        opt.dataset.estoque = p.estoque;
        opt.dataset.tipo = p.tipo_venda;
        opt.textContent = `${p.nome} - R$ ${Number(p.preco).toFixed(2)}`;
        produtoSelect.appendChild(opt);
      });
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar clientes ou produtos.");
    }
  }
  carregarSelects();

  // ============================
  // MOSTRAR INFORMAÇÕES DO PRODUTO
  // ============================
  produtoSelect.addEventListener("change", () => {
    const option = produtoSelect.selectedOptions[0];
    if (!option || !option.dataset.preco) return;

    const preco = Number(option.dataset.preco);
    const estoque = Number(option.dataset.estoque);
    const tipo = option.dataset.tipo;

    infoTipo.textContent = tipo;
    infoPreco.textContent = `R$ ${preco.toFixed(2)}`;
    infoEstoque.textContent = `${estoque} ${tipo === "kg" ? "kg" : "un"}`;

    if (tipo === "kg") {
      quantidadeInput.value = "0.00";
      quantidadeInput.step = "0.01";
      quantidadeInput.min = "0.01";
    } else {
      quantidadeInput.value = "1";
      quantidadeInput.step = "1";
      quantidadeInput.min = "1";
    }

    quantidadeInput.max = estoque;
    productInfo.style.display = "block";
  });

  // ============================
  // MOSTRAR CAMPO DE DINHEIRO
  // ============================
  pagamentoSelect.addEventListener("change", () => {
    dinheiroWrapper.style.display = pagamentoSelect.value === "Dinheiro" ? "block" : "none";
    if (pagamentoSelect.value !== "Dinheiro") {
      valorPagoInput.value = "";
      trocoEl.textContent = "";
    }
  });

  // ============================
  // CALCULAR TROCO
  // ============================
  valorPagoInput.addEventListener("input", () => {
    const total = carrinho.reduce((acc, i) => acc + i.preco * i.quantidade, 0);
    const pago = Number(valorPagoInput.value);
    if (!isNaN(pago) && pago >= total) {
      trocoEl.textContent = `Troco: R$ ${(pago - total).toFixed(2)}`;
    } else {
      trocoEl.textContent = "";
    }
  });

  // ============================
  // ADICIONAR AO CARRINHO
  // ============================
  addBtn.addEventListener("click", () => {
    const cliente = clienteSelect.value;
    if (!cliente) return alert("Selecione um cliente");

    const option = produtoSelect.selectedOptions[0];
    if (!option || !option.dataset.preco) return alert("Selecione um produto");

    const nome = option.textContent.split(" - ")[0];
    const preco = Number(option.dataset.preco);
    const estoque = Number(option.dataset.estoque);
    const quantidade = Number(quantidadeInput.value);

    if (quantidade <= 0 || quantidade > estoque) return alert("Quantidade inválida ou maior que o estoque disponível");

    if (!clienteCarrinho) {
      clienteCarrinho = cliente;
      clienteSelect.disabled = true;
    }

    carrinho.push({ id_produto: option.value, nome, preco, quantidade });
    atualizarCarrinho();
  });

  // ============================
  // ATUALIZAR CARRINHO
  // ============================
  function atualizarCarrinho() {
    cartItems.innerHTML = "";
    let subtotal = 0;

    carrinho.forEach((item, i) => {
      const totalItem = item.preco * item.quantidade;
      subtotal += totalItem;

      const div = document.createElement("div");
      div.className = "cart-item";
      div.innerHTML = `
        <div>
          <h4>${item.nome}</h4>
          <p>${item.quantidade} x R$ ${item.preco.toFixed(2)}</p>
          <strong>R$ ${totalItem.toFixed(2)}</strong>
        </div>
        <button class="delete-item">
          <span class="material-symbols-outlined">delete</span>
        </button>
      `;
      div.querySelector("button").onclick = () => {
        carrinho.splice(i, 1);
        if (!carrinho.length) {
          clienteCarrinho = null;
          clienteSelect.disabled = false;
        }
        atualizarCarrinho();
      };
      cartItems.appendChild(div);
    });

    subtotalEl.textContent = `R$ ${subtotal.toFixed(2)}`;
    totalEl.textContent = `R$ ${subtotal.toFixed(2)}`;
  }

  // ============================
  // FINALIZAR VENDA
  // ============================
  finalizarBtn.addEventListener("click", async () => {
    if (!carrinho.length) return alert("Carrinho vazio");
    const metodoPagamento = pagamentoSelect.value;
    if (!metodoPagamento) return alert("Selecione o método de pagamento");

    const total = carrinho.reduce((acc, i) => acc + i.preco * i.quantidade, 0);

    if (metodoPagamento === "Dinheiro") {
      const pago = Number(valorPagoInput.value);
      if (isNaN(pago) || pago < total) return alert("Valor pago insuficiente");
    }

    const id_cliente = clienteSelect.value;
    const itens = carrinho.map(i => ({ id_produto: i.id_produto, quantidade: i.quantidade, preco: i.preco }));

    try {
      const res = await fetch("/api/vendas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_cliente, itens, pagamento: metodoPagamento })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || "Erro ao registrar venda");

      let msg = `Venda realizada! ID: ${data.id_venda}`;
      if (metodoPagamento === "Dinheiro") msg += ` | Troco: R$ ${(Number(valorPagoInput.value) - total).toFixed(2)}`;

      alert(msg);

      // RESET
      carrinho = [];
      clienteCarrinho = null;
      clienteSelect.disabled = false;
      clienteSelect.selectedIndex = 0;
      produtoSelect.selectedIndex = 0;
      productInfo.style.display = "none";
      pagamentoSelect.selectedIndex = 0;
      dinheiroWrapper.style.display = "none";
      valorPagoInput.value = "";
      trocoEl.textContent = "";

      atualizarCarrinho();
      carregarSelects();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  });
});