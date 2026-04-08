document.addEventListener("DOMContentLoaded", () => {

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

  let carrinho = [];
  let clienteCarrinho = null;

  const taxas = {
    debito: 0.0137,
    credito: {
      2: 0.0539, 3: 0.0612, 4: 0.0685, 5: 0.0757,
      6: 0.0828, 7: 0.0899, 8: 0.0969, 9: 0.1038,
      10: 0.1106, 11: 0.1174
    }
  };

  const pagamentoWrapper = document.createElement("div");
  pagamentoWrapper.style.marginTop = "10px";

  pagamentoWrapper.innerHTML = `
    <div class="line-item">
      <span>Quantidade de Métodos:</span>
      <select id="qtdMetodos" style="width:50%;">
        <option value="1">1 Método</option>
        <option value="2">2 Métodos</option>
      </select>
    </div>

    <div id="metodo1Container">
      <hr>
      <strong>Pagamento 1</strong>
      <div class="line-item" id="rowValor1" style="display:none;">
        <span>Valor Método 1:</span>
        <input type="number" id="valorMetodo1" step="0.01" style="width:50%;">
      </div>
      <div class="line-item">
        <span>Método 1:</span>
        <select id="pagamentoSelect1" style="width:50%;">
          <option value="" disabled selected>Selecione</option>
          <option value="Cartao">Cartão</option>
          <option value="Dinheiro">Dinheiro</option>
          <option value="Pix">Pix</option>
        </select>
      </div>
      <div id="cartaoWrapper1" style="display:none;margin-top:10px;">
        <div class="line-item"><span>Tipo:</span>
          <select id="tipoCartao1"><option value="debito">Débito</option><option value="credito">Crédito</option></select>
        </div>
        <div class="line-item" id="parcelamentoWrapper1" style="display:none;">
          <span>Parcelas:</span>
          <select id="parcelasSelect1">${[...Array(11).keys()].map(i => `<option value="${i+1}">${i+1}x</option>`).join('')}</select>
        </div>
        <p id="valorCartao1" style="font-weight:bold;"></p>
      </div>
      <div id="dinheiroWrapper1" style="display:none;margin-top:10px;">
        <div class="line-item"><span>Valor entregue:</span><input type="number" id="valorPago1" step="0.01" style="width:50%;"></div>
        <p id="troco1" style="font-weight:bold;"></p>
      </div>
    </div>

    <div id="metodo2Container" style="display:none;">
      <hr>
      <strong>Pagamento 2</strong>
      <div class="line-item">
        <span>Valor Método 2 (Saldo):</span>
        <input type="number" id="valorMetodo2" readonly style="width:50%; background:#f0f0f0;">
      </div>
      <div class="line-item">
        <span>Método 2:</span>
        <select id="pagamentoSelect2" style="width:50%;">
          <option value="" disabled selected>Selecione</option>
          <option value="Cartao">Cartão</option>
          <option value="Dinheiro">Dinheiro</option>
          <option value="Pix">Pix</option>
        </select>
      </div>
      <div id="cartaoWrapper2" style="display:none;margin-top:10px;">
        <div class="line-item"><span>Tipo:</span>
          <select id="tipoCartao2"><option value="debito">Débito</option><option value="credito">Crédito</option></select>
        </div>
        <div class="line-item" id="parcelamentoWrapper2" style="display:none;">
          <span>Parcelas:</span>
          <select id="parcelasSelect2">${[...Array(11).keys()].map(i => `<option value="${i+1}">${i+1}x</option>`).join('')}</select>
        </div>
        <p id="valorCartao2" style="font-weight:bold;"></p>
      </div>
      <div id="dinheiroWrapper2" style="display:none;margin-top:10px;">
        <div class="line-item"><span>Valor entregue:</span><input type="number" id="valorPago2" step="0.01" style="width:50%;"></div>
        <p id="troco2" style="font-weight:bold;"></p>
      </div>
    </div>
  `;

  totalsBox.parentElement.insertBefore(pagamentoWrapper, finalizarBtn);

  const qtdMetodos = document.getElementById("qtdMetodos");
  const valorMetodo1 = document.getElementById("valorMetodo1");
  const valorMetodo2 = document.getElementById("valorMetodo2");
  const rowValor1 = document.getElementById("rowValor1");
  const metodo2Container = document.getElementById("metodo2Container");

  qtdMetodos.addEventListener("change", () => {
    const isMisto = qtdMetodos.value === "2";
    rowValor1.style.display = isMisto ? "flex" : "none";
    metodo2Container.style.display = isMisto ? "block" : "none";
  });

  valorMetodo1.addEventListener("input", () => {
    const total = carrinho.reduce((acc, i) => acc + i.preco * i.quantidade, 0);
    const v1 = parseFloat(valorMetodo1.value) || 0;
    valorMetodo2.value = Math.max(0, total - v1).toFixed(2);
    calcularTaxasCartaoTodas();
  });

  [1, 2].forEach(id => {
    document.getElementById(`pagamentoSelect${id}`).addEventListener("change", (e) => {
        document.getElementById(`cartaoWrapper${id}`).style.display = e.target.value === "Cartao" ? "block" : "none";
        document.getElementById(`dinheiroWrapper${id}`).style.display = e.target.value === "Dinheiro" ? "block" : "none";
    });
    document.getElementById(`tipoCartao${id}`).addEventListener("change", (e) => {
        document.getElementById(`parcelamentoWrapper${id}`).style.display = e.target.value === "credito" ? "flex" : "none";
        calcularTaxasCartaoTodas();
    });
    document.getElementById(`parcelasSelect${id}`).addEventListener("change", calcularTaxasCartaoTodas);
    
    document.getElementById(`valorPago${id}`).addEventListener("input", () => {
        const total = carrinho.reduce((acc, i) => acc + i.preco * i.quantidade, 0);
        const valorReferencia = qtdMetodos.value === "2" 
            ? (id === 1 ? parseFloat(valorMetodo1.value) : parseFloat(valorMetodo2.value))
            : total;
        const pago = parseFloat(document.getElementById(`valorPago${id}`).value) || 0;
        const troco = pago - valorReferencia;
        document.getElementById(`troco${id}`).textContent = troco > 0 ? `Troco: R$ ${troco.toFixed(2)}` : "";
    });
  });

  function calcularTaxasCartaoTodas() {
    [1, 2].forEach(id => {
        const totalCarrinho = carrinho.reduce((acc, i) => acc + i.preco * i.quantidade, 0);
        const valorBase = qtdMetodos.value === "2" 
            ? (id === 1 ? parseFloat(valorMetodo1.value) : parseFloat(valorMetodo2.value))
            : totalCarrinho;

        if (!valorBase || isNaN(valorBase)) return;

        const tipo = document.getElementById(`tipoCartao${id}`).value;
        const parcelas = Number(document.getElementById(`parcelasSelect${id}`).value);
        let totalFinal = valorBase;

        if (tipo === "credito" && parcelas > 1) {
            const taxa = taxas.credito[parcelas] || 0;
            totalFinal = valorBase * (1 + taxa);
            const vParcela = totalFinal / parcelas;
            document.getElementById(`valorCartao${id}`).textContent = `Total Cartão: R$ ${totalFinal.toFixed(2)} (${parcelas}x R$ ${vParcela.toFixed(2)})`;
        } else {
            document.getElementById(`valorCartao${id}`).textContent = `Total Cartão: R$ ${totalFinal.toFixed(2)}`;
        }
    });
  }

  async function carregarSelects() {
    const clientes = await (await fetch("/api/vendas/clientes")).json();
    clienteSelect.innerHTML = `<option disabled selected>Selecione um cliente</option><option value="null">Sem cliente</option>`;
    clientes.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id_cliente;
      opt.textContent = c.nome;
      clienteSelect.appendChild(opt);
    });

    const produtos = await (await fetch("/api/vendas/produtos")).json();
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
    $('#clienteSelect').trigger('change');
    $('#produtoSelect').trigger('change');
  }

  carregarSelects();

  $(document).ready(function() {
    $('#clienteSelect').select2({ placeholder: "Selecione um cliente", width: '100%' });
    $('#produtoSelect').select2({ placeholder: "Selecione um produto", width: '100%' });
  });

  $('#produtoSelect').on('change', function () {
    const option = produtoSelect.selectedOptions[0];
    if(!option.dataset.preco) return;
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
      quantidadeInput.value = "";
      quantidadeInput.step = "1";
      quantidadeInput.min = "1";
    }
    quantidadeInput.max = estoque;
    productInfo.style.display = "block";
  });

  addBtn.addEventListener("click", () => {
    const cliente = clienteSelect.value;
    if (!cliente) return alert("Selecione um cliente");
    const option = produtoSelect.selectedOptions[0];
    const nome = option.textContent.split(" - ")[0];
    const preco = Number(option.dataset.preco);
    const estoque = Number(option.dataset.estoque);
    const quantidade = Number(quantidadeInput.value);
    const quantidadeNoCarrinho = carrinho.filter(i => i.id_produto === option.value).reduce((acc, i) => acc + i.quantidade, 0);

    if (quantidade <= 0 || (quantidade + quantidadeNoCarrinho) > estoque) return alert("Quantidade maior que o estoque disponível");

    if (!clienteCarrinho) {
      clienteCarrinho = cliente;
      clienteSelect.disabled = true;
    }
    carrinho.push({ id_produto: option.value, nome, preco, quantidade });
    atualizarCarrinho();
  });

  function atualizarCarrinho() {
    cartItems.innerHTML = "";
    let subtotal = 0;
    carrinho.forEach((item, i) => {
      const totalItem = item.preco * item.quantidade;
      subtotal += totalItem;
      const div = document.createElement("div");
      div.className = "cart-item";
      div.innerHTML = `<div><h4>${item.nome}</h4><p>${item.quantidade} x R$ ${item.preco.toFixed(2)}</p><strong>R$ ${totalItem.toFixed(2)}</strong></div><button class="delete-item"><span class="material-symbols-outlined">delete</span></button>`;
      div.querySelector("button").onclick = () => {
        carrinho.splice(i, 1);
        if (!carrinho.length) { clienteCarrinho = null; clienteSelect.disabled = false; }
        atualizarCarrinho();
      };
      cartItems.appendChild(div);
    });
    subtotalEl.textContent = `R$ ${subtotal.toFixed(2)}`;
    totalEl.textContent = `R$ ${subtotal.toFixed(2)}`;
    calcularTaxasCartaoTodas();
  }

  finalizarBtn.addEventListener("click", async () => {
    if (!carrinho.length) return alert("Carrinho vazio");

    const totalVenda = carrinho.reduce((acc, i) => acc + i.preco * i.quantidade, 0);
    const ids = qtdMetodos.value === "1" ? [1] : [1, 2];
    let pagamentos = [];

    for (let id of ids) {
        let metodoOriginal = document.getElementById(`pagamentoSelect${id}`).value;
        if (!metodoOriginal) return alert(`Selecione o método de pagamento ${id}`);

        let metodoNomeExibicao = metodoOriginal;
        const tipoCartao = document.getElementById(`tipoCartao${id}`).value;
        const parcelas = Number(document.getElementById(`parcelasSelect${id}`).value);

        const valorBase = id === 1 
            ? (qtdMetodos.value === "2" ? parseFloat(valorMetodo1.value) : totalVenda)
            : parseFloat(valorMetodo2.value);

        if (isNaN(valorBase)) return alert(`Informe o valor para o Método ${id}`);

        // Cálculo de taxa para salvar o valor exato que o cliente vai pagar no cartão
        let valorFinalComTaxa = valorBase;
        if (metodoOriginal === "Cartao") {
            if (tipoCartao === "debito") {
                metodoNomeExibicao = "Débito";
            } else {
                const taxa = taxas.credito[parcelas] || 0;
                valorFinalComTaxa = valorBase * (1 + taxa);
                const valorParcela = valorFinalComTaxa / parcelas;
                // Formatação: Crédito 2x de R$ 20.00
                metodoNomeExibicao = `Crédito ${parcelas}x de R$ ${valorParcela.toFixed(2)}`;
            }
        }

        pagamentos.push({
            metodo: metodoNomeExibicao,
            valor: valorFinalComTaxa.toFixed(2), // Garante o 40.00
            tipo_cartao: tipoCartao,
            parcelas: parcelas
        });
    }

    try {
      const res = await fetch("/api/vendas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_cliente: clienteSelect.value,
          itens: carrinho.map(i => ({ 
            id_produto: i.id_produto, 
            quantidade: i.quantidade, 
            preco: i.preco.toFixed(2) 
          })),
          pagamentos: pagamentos
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || "Erro ao registrar venda");

      alert(`Venda realizada! ID: ${data.id_venda}`);
      location.reload();
    } catch (err) {
      alert(err.message);
    }
  });
});