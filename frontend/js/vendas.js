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
  // TAXAS DAS MAQUININAS
  // ============================
  const taxas = {
    debito: 0.0137,
    credito: {
      2: 0.0539,
      3: 0.0612,
      4: 0.0685,
      5: 0.0757,
      6: 0.0828,
      7: 0.0899,
      8: 0.0969,
      9: 0.1038,
      10: 0.1106,
      11: 0.1174
    }
  };

  // ============================
  // MÉTODO DE PAGAMENTO
  // ============================

  const pagamentoWrapper = document.createElement("div");
  pagamentoWrapper.style.marginTop = "10px";

  pagamentoWrapper.innerHTML = `
    <div class="line-item">
      <span>Método de pagamento:</span>
      <select id="pagamentoSelect" style="width:50%;">
        <option value="" disabled selected>Selecione</option>
        <option value="Cartao">Cartão</option>
        <option value="Dinheiro">Dinheiro</option>
        <option value="Pix">Pix</option>
      </select>
    </div>

    <div id="cartaoWrapper" style="display:none;margin-top:10px;">

      <div class="line-item">
        <span>Tipo:</span>
        <select id="tipoCartao">
          <option value="" disabled selected>Selecione</option>
          <option value="debito">Débito</option>
          <option value="credito">Crédito</option>
        </select>
      </div>

      <div class="line-item" id="parcelamentoWrapper" style="display:none;">
        <span>Parcelas:</span>
        <select id="parcelasSelect">
          <option value="1">1x</option>
          <option value="2">2x</option>
          <option value="3">3x</option>
          <option value="4">4x</option>
          <option value="5">5x</option>
          <option value="6">6x</option>
          <option value="7">7x</option>
          <option value="8">8x</option>
          <option value="9">9x</option>
          <option value="10">10x</option>
          <option value="11">11x</option>
        </select>
      </div>

      <p id="valorCartao" style="margin-top:5px;font-weight:bold;"></p>

    </div>

    <div id="dinheiroWrapper" style="display:none;margin-top:10px;">
      <div class="line-item">
        <span>Valor pago:</span>
        <input type="number" id="valorPago" min="0" step="0.01" style="width:50%;">
      </div>
      <p id="troco" style="margin-top:5px;font-weight:bold;"></p>
    </div>
  `;

  totalsBox.parentElement.insertBefore(pagamentoWrapper, finalizarBtn);

  const pagamentoSelect = document.getElementById("pagamentoSelect");
  const valorPagoInput = document.getElementById("valorPago");
  const dinheiroWrapper = document.getElementById("dinheiroWrapper");
  const trocoEl = document.getElementById("troco");

  const cartaoWrapper = document.getElementById("cartaoWrapper");
  const tipoCartao = document.getElementById("tipoCartao");
  const parcelasSelect = document.getElementById("parcelasSelect");
  const parcelamentoWrapper = document.getElementById("parcelamentoWrapper");
  const valorCartao = document.getElementById("valorCartao");

  // ============================
  // CARREGAR CLIENTES E PRODUTOS
  // ============================

  async function carregarSelects() {

    const clientesRes = await fetch("/api/vendas/clientes");
    const clientes = await clientesRes.json();

    clienteSelect.innerHTML = `
<option disabled selected>Selecione um cliente</option>
<option value="null">Sem cliente</option>
`;

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

  }

  carregarSelects();

  // ============================
  // MOSTRAR PRODUTO
  // ============================

  produtoSelect.addEventListener("change", () => {

  const option = produtoSelect.selectedOptions[0];

  const preco = Number(option.dataset.preco);
  const estoque = Number(option.dataset.estoque);
  const tipo = option.dataset.tipo;

  infoTipo.textContent = tipo;
  infoPreco.textContent = `R$ ${preco.toFixed(2)}`;
  infoEstoque.textContent = `${estoque} ${tipo === "kg" ? "kg" : "un"}`;

  // ajuste do campo quantidade conforme tipo
  if (tipo === "kg") {

    quantidadeInput.value = "0.00";
    quantidadeInput.step = "0.01";
    quantidadeInput.min = "0.01";

  } else {

    quantidadeInput.value = " ";
    quantidadeInput.step = "1";
    quantidadeInput.min = "1";

  }

  quantidadeInput.max = estoque;

  productInfo.style.display = "block";

});

  // ============================
  // MOSTRAR CAMPOS DE PAGAMENTO
  // ============================

  pagamentoSelect.addEventListener("change", () => {

    dinheiroWrapper.style.display = pagamentoSelect.value === "Dinheiro" ? "block" : "none";
    cartaoWrapper.style.display = pagamentoSelect.value === "Cartao" ? "block" : "none";

  });

  // ============================
  // CRÉDITO MOSTRA PARCELAS
  // ============================

  tipoCartao.addEventListener("change", () => {

    if (tipoCartao.value === "credito") {

      parcelamentoWrapper.style.display = "flex";

    } else {

      parcelamentoWrapper.style.display = "none";

    }

    calcularTaxaCartao();

  });

  parcelasSelect.addEventListener("change", calcularTaxaCartao);

  // ============================
  // CALCULAR TAXA CARTÃO
  // ============================

  function calcularTaxaCartao() {

  const total = carrinho.reduce((acc, i) => acc + i.preco * i.quantidade, 0);

  if (!total) return;

  let totalFinal = total;

  if (tipoCartao.value === "credito") {

    const parcelas = Number(parcelasSelect.value);

    if (parcelas > 1) {

      const taxa = taxas.credito[parcelas] || 0;

      totalFinal = total * (1 + taxa);

      const valorParcela = totalFinal / parcelas;

      valorCartao.textContent =
        `Total no cartão: R$ ${totalFinal.toFixed(2)} (${parcelas}x de R$ ${valorParcela.toFixed(2)})`;

      return;

    }

  }

  valorCartao.textContent = `Total no cartão: R$ ${totalFinal.toFixed(2)}`;

}
  // ============================
  // ADICIONAR AO CARRINHO
  // ============================

  addBtn.addEventListener("click", () => {

    const cliente = clienteSelect.value;

    if (!cliente) return alert("Selecione um cliente");

    const option = produtoSelect.selectedOptions[0];

   const nome = option.textContent.split(" - ")[0];
const preco = Number(option.dataset.preco);
const estoque = Number(option.dataset.estoque);
const quantidade = Number(quantidadeInput.value);

// soma quantidade já existente no carrinho do mesmo produto
const quantidadeNoCarrinho = carrinho
  .filter(i => i.id_produto === option.value)
  .reduce((acc, i) => acc + i.quantidade, 0);

if (quantidade <= 0 || (quantidade + quantidadeNoCarrinho) > estoque)
  return alert("Quantidade maior que o estoque disponível");

    if (!clienteCarrinho) {

      clienteCarrinho = cliente;
      clienteSelect.disabled = true;

    }

    carrinho.push({
      id_produto: option.value,
      nome,
      preco,
      quantidade
    });

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

    calcularTaxaCartao();

  }

  // ============================
// FINALIZAR VENDA
// ============================

  finalizarBtn.addEventListener("click", async () => {

    if (!carrinho.length) return alert("Carrinho vazio");

    const metodoPagamento = pagamentoSelect.value;

    if (!metodoPagamento) {
      alert("Selecione o método de pagamento");
      return;
    }

    const total = carrinho.reduce((acc, i) => acc + i.preco * i.quantidade, 0);

    if (metodoPagamento === "Dinheiro") {

      const pago = Number(valorPagoInput.value);

      if (isNaN(pago) || pago < total)
        return alert("Valor pago insuficiente");

    }

    const id_cliente = clienteSelect.value;

    const itens = carrinho.map(i => ({
      id_produto: i.id_produto,
      quantidade: i.quantidade,
      preco: i.preco
    }));

    let tipo_cartao = null;
    let parcelas = null;

    if (metodoPagamento === "Cartao") {

      tipo_cartao = tipoCartao.value;

      if (tipo_cartao === "credito") {
        parcelas = Number(parcelasSelect.value);
      } else {
        parcelas = 1;
      }

    }

    try {

      const res = await fetch("/api/vendas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id_cliente,
          itens,
          pagamento: metodoPagamento,
          tipo_cartao,
          parcelas
        })
      });

      const data = await res.json();

      if (!res.ok)
        throw new Error(data.erro || "Erro ao registrar venda");

      alert(`Venda realizada! ID: ${data.id_venda}`);

      carrinho = [];
      clienteCarrinho = null;
      clienteSelect.disabled = false;
      clienteSelect.selectedIndex = 0;
      produtoSelect.selectedIndex = 0;
      quantidadeInput.value = "";
      productInfo.style.display = "none";

      atualizarCarrinho();
      carregarSelects();

    } catch (err) {

      console.error(err);
      alert(err.message);

    }

  });

});