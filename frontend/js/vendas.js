document.addEventListener("DOMContentLoaded", () => {

    const clienteSelect = document.getElementById("clienteSelect");

    const produtoSelect = document.getElementById("produtoSelect");

    const quantidadeInput = document.getElementById("quantidade");

    const infoTipo = document.getElementById("infoTipo");

    const infoPreco = document.getElementById("infoPreco");

    const infoEstoque = document.getElementById("infoEstoque");

    const productInfo = document.getElementById("productInfo");

    const cartItems = document.getElementById("cartItems");

    const totalsBox = document.getElementById("totalsBox");

    const addBtn = document.querySelector(".sale-add-btn");

    const finalizarBtn = document.querySelector(".finalize-btn");

    const codigoBarrasVendaInput = document.getElementById("codigoBarrasVenda");



    let carrinho = [];



    const taxas = {

        debito: 0.0137,

        credito: {

            1: 0.03, 2: 0.0539, 3: 0.0612, 4: 0.0685, 5: 0.0757,

            6: 0.0828, 7: 0.0899, 8: 0.0969, 9: 0.1038,

            10: 0.1106, 11: 0.1174, 12: 0.1241

        }

    };



    // Interface de pagamento

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

            <hr><strong>Pagamento 1</strong>

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

            <div id="dinheiroWrapper1" style="display:none; margin-top:5px;">

                <div class="line-item"><span>Valor Recebido:</span>

                    <input type="number" id="recebido1" step="0.01" style="width:50%;">

                </div>

            </div>

            <div id="cartaoWrapper1" style="display:none;margin-top:10px;">

                <div class="line-item"><span>Tipo:</span>

                    <select id="tipoCartao1"><option value="debito">Débito</option><option value="credito">Crédito</option></select>

                </div>

                <div class="line-item" id="parcelamentoWrapper1" style="display:none;">

                    <span>Parcelas:</span>

                   <select id="parcelasSelect1">${[...Array(12).keys()].map(i => `<option value="${i + 1}">${i + 1}x</option>`).join('')}</select>
                </div>

                <p id="valorCartao1" style="font-weight:bold; font-size: 0.85em; color: #666;"></p>

            </div>

        </div>
         <div id="trocoContainer" style="display:none; margin-top:15px; padding:10px;">
    <div id="troco1" style="display:none;">
        <strong style="color:#6f8864;">Troco Método 1: <span id="valorTroco1">R$ 0,00</span></strong>
    </div>

        <div id="metodo2Container" style="display:none;">

            <hr><strong>Pagamento 2</strong>

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

            <div id="dinheiroWrapper2" style="display:none; margin-top:5px;">

                <div class="line-item"><span>Valor Recebido:</span>

                    <input type="number" id="recebido2" step="0.01" style="width:50%;">

                </div>

            </div>

            <div id="cartaoWrapper2" style="display:none;margin-top:10px;">

                <div class="line-item"><span>Tipo:</span>

                    <select id="tipoCartao2"><option value="debito">Débito</option><option value="credito">Crédito</option></select>

                </div>

                <div class="line-item" id="parcelamentoWrapper2" style="display:none;">

                    <span>Parcelas:</span>

                   <select id="parcelasSelect2">${[...Array(12).keys()].map(i => `<option value="${i + 1}">${i + 1}x</option>`).join('')}</select>
                </div>

                <p id="valorCartao2" style="font-weight:bold; font-size: 0.85em; color: #666;"></p>

            </div>

        </div>

    <div id="troco2" style="display:none; margin-top:5px;">
        <strong style="color:#6f8864;">Troco Método 2: <span id="valorTroco2">R$ 0,00</span></strong>
    </div>
</div>

    `;

    totalsBox.parentElement.insertBefore(pagamentoWrapper, finalizarBtn);



    const qtdMetodos = document.getElementById("qtdMetodos");

    const valorMetodo1 = document.getElementById("valorMetodo1");

    const valorMetodo2 = document.getElementById("valorMetodo2");



    $(document).ready(async () => {

        $('#clienteSelect').select2({ placeholder: "Selecione um cliente", width: '100%' });

        $('#produtoSelect').select2({ placeholder: "Selecione um produto", width: '100%' });

        await carregarSelects();

    });



    async function carregarSelects() {

        try {

            const [resClientes, resProdutos] = await Promise.all([

                fetch("/api/vendas/clientes"),

                fetch("/api/vendas/produtos")

            ]);

            const clientes = await resClientes.json();

            const produtos = await resProdutos.json();

            let clienteHtml = `<option value="null">Consumidor Final (Sem cadastro)</option>`;

            clientes.forEach(c => clienteHtml += `<option value="${c.id_cliente}">${c.nome}</option>`);

            clienteSelect.innerHTML = clienteHtml;

            let produtoHtml = `<option disabled selected value="">Selecione um produto...</option>`;

            produtos.forEach(p => {

                produtoHtml += `<option value="${p.id_produto}" data-preco="${p.preco}" data-estoque="${p.estoque}" data-tipo="${p.tipo_venda}">${p.nome} - R$ ${Number(p.preco).toFixed(2)}</option>`;

            });

            produtoSelect.innerHTML = produtoHtml;

        } catch (err) { console.error("Erro ao carregar dados:", err); }

    }



    $('#produtoSelect').on('change', function() {

        const opt = this.selectedOptions[0];

        if(!opt || !opt.dataset.preco) return;

        const tipoVenda = opt.dataset.tipo;

        infoTipo.textContent = tipoVenda === 'kg' ? 'Quilograma' : 'Unidade';

        infoPreco.textContent = `R$ ${Number(opt.dataset.preco).toFixed(2).replace('.', ',')}`;

        infoEstoque.textContent = `${parseFloat(Number(opt.dataset.estoque).toFixed(3)).toString().replace('.', ',')} ${tipoVenda}`;

        quantidadeInput.step = tipoVenda === 'un' ? "1" : "0.001";

        if(tipoVenda === 'un') quantidadeInput.value = Math.floor(quantidadeInput.value) || "";

        productInfo.style.display = "block";

    });
    function atualizarParcelasComValor() {
    const subtotalStr = document.querySelector("#subtotalDisplay").textContent.replace("R$ ", "").replace(",", ".");
    const total = parseFloat(subtotalStr) || 0;

    [1, 2].forEach(id => {
        const select = document.getElementById(`parcelasSelect${id}`);
        if (!select) return;

        const tipo = document.getElementById(`tipoCartao${id}`).value;

        for (let i = 1; i <= 12; i++) {
            const valorBase = qtdMetodos.value === "2"
    ? (id === 1 ? parseFloat(valorMetodo1.value) : parseFloat(valorMetodo2.value))
    : total;

if (!valorBase || isNaN(valorBase)) return;

let valorParcela = valorBase;

if (tipo === "credito") {
    const taxa = taxas.credito[i] || 0;
    const totalComTaxa = valorBase * (1 + taxa);
    valorParcela = totalComTaxa / i;
}
 const option = select.querySelector(`option[value="${i}"]`);
            if (option) {
                option.textContent = `${i}x - R$ ${valorParcela.toFixed(2).replace('.', ',')}`;
            }
        }
    });
}



    function limparCamposProduto() {

        $('#produtoSelect').val('').trigger('change');

        quantidadeInput.value = "";

        productInfo.style.display = "none";

    }



    function resetarPagamentos() {

        qtdMetodos.value = "1";

        document.getElementById("rowValor1").style.display = "none";

        document.getElementById("metodo2Container").style.display = "none";

        valorMetodo1.value = "";

        valorMetodo2.value = "";

        [1, 2].forEach(id => {

            document.getElementById(`pagamentoSelect${id}`).selectedIndex = 0;

            document.getElementById(`cartaoWrapper${id}`).style.display = "none";

            document.getElementById(`dinheiroWrapper${id}`).style.display = "none";

            document.getElementById(`recebido${id}`).value = "";

            document.getElementById(`valorCartao${id}`).textContent = "";

        });

        document.getElementById("trocoContainer").style.display = "none";

        limparCamposProduto();

    }



   function calcularTroco() {

    let exibirContainer = false;

    const totalVendaStr = document.querySelector("#totalDisplay").textContent.replace("R$ ", "").replace(",", ".");
    const totalVenda = parseFloat(totalVendaStr) || 0;

    [1, 2].forEach(id => {

        const metodo = document.getElementById(`pagamentoSelect${id}`).value;
        const trocoDiv = document.getElementById(`troco${id}`);
        const trocoSpan = document.getElementById(`valorTroco${id}`);

        if (metodo === "Dinheiro") {

            const recebido = parseFloat(document.getElementById(`recebido${id}`).value) || 0;

            const valorDevido = (qtdMetodos.value === "2")
                ? (id === 1 ? parseFloat(valorMetodo1.value) || 0 : parseFloat(valorMetodo2.value) || 0)
                : totalVenda;

            const troco = recebido > valorDevido ? (recebido - valorDevido) : 0;

            trocoSpan.textContent = `R$ ${troco.toFixed(2).replace('.', ',')}`;
            trocoDiv.style.display = "block";

            if (troco > 0) exibirContainer = true;

        } else {
            trocoDiv.style.display = "none";
        }

         document.getElementById("trocoContainer").style.display = exibirContainer ? "block" : "none";

    });

   




        document.getElementById("trocoContainer").style.display = exibirTroco ? "block" : "none";

        document.getElementById("valorTroco").textContent = `R$ ${trocoTotal.toFixed(2).replace('.', ',')}`;

    }



   function calcularTaxasCartaoTodas() {

    const subtotalStr = document.querySelector("#subtotalDisplay").textContent.replace("R$ ", "").replace(",", ".");

    const subtotalOriginal = parseFloat(subtotalStr) || 0;

   

    let totalGeralComTaxas = 0;

    let temTaxaExtra = false;



    [1, 2].forEach(id => {

        const metodoSelect = document.getElementById(`pagamentoSelect${id}`);

        const valorBase = qtdMetodos.value === "2"

            ? (id === 1 ? parseFloat(valorMetodo1.value) : parseFloat(valorMetodo2.value))

            : subtotalOriginal;

       

        if(!valorBase || isNaN(valorBase)) return;



        const metodo = metodoSelect.value;

        const tipo = document.getElementById(`tipoCartao${id}`).value;

        const parcelas = Number(document.getElementById(`parcelasSelect${id}`).value);

       

        let valorDesteMetodoComTaxa = valorBase;



        // Só aplica cálculo se for Cartão

        if(metodo === "Cartao") {

            temTaxaExtra = true;

            if(tipo === "debito") {

                valorDesteMetodoComTaxa = valorBase * (1 + taxas.debito);

            } else if(tipo === "credito") {

                valorDesteMetodoComTaxa = valorBase * (1 + (taxas.credito[parcelas] || 0));

            }

        }



        // Atualiza o texto pequeno embaixo do select do cartão

        const el = document.getElementById(`valorCartao${id}`);

        if(el) el.textContent = `Valor com taxa: R$ ${valorDesteMetodoComTaxa.toFixed(2)}`;

       

        totalGeralComTaxas += valorDesteMetodoComTaxa;

    });



    const wrapper = document.getElementById("totalComTaxaWrapper");

    const displayComTaxa = document.getElementById("totalComTaxaDisplay");



    if (temTaxaExtra) {

        if(wrapper) wrapper.style.display = "block";

        if(displayComTaxa) displayComTaxa.textContent = `R$ ${totalGeralComTaxas.toFixed(2)}`;

    } else {

        if(wrapper) wrapper.style.display = "none";

    }
    atualizarParcelasComValor();

}



    addBtn.addEventListener("click", () => {

        const opt = produtoSelect.selectedOptions[0];

        let qtdRaw = Number(quantidadeInput.value);

        if(!opt || !opt.value || qtdRaw <= 0) return alert("Verifique produto e quantidade");

        if(opt.dataset.tipo === 'un' && !Number.isInteger(qtdRaw)) return alert("Unidades devem ser inteiras.");



        const id = opt.value;

        const estoque = Number(opt.dataset.estoque);

        const jaNoCart = carrinho.filter(i => i.id_produto == id).reduce((acc, i) => acc + i.quantidade, 0);

       

        if ((qtdRaw + jaNoCart) > (estoque + 0.001)) return alert("Estoque insuficiente");



        carrinho.push({

            id_produto: id,

            nome: opt.textContent.split(" - ")[0].trim(),

            preco: Number(opt.dataset.preco),

            quantidade: qtdRaw,

            tipo: opt.dataset.tipo

        });

        atualizarCarrinho();

        limparCamposProduto();

    });



    function atualizarCarrinho() {

        cartItems.innerHTML = "";

        let subtotal = 0;

        if (carrinho.length === 0) {

            resetarPagamentos();

            document.querySelector("#subtotalDisplay").textContent = "R$ 0,00";

            document.querySelector("#totalDisplay").textContent = "R$ 0,00";

            return;

        }



        carrinho.forEach((item, i) => {

            const totalItem = item.preco * item.quantidade;

            subtotal += totalItem;

            const div = document.createElement("div");

            div.className = "cart-item";

            div.innerHTML = `

                <div>

                    <h4>${item.nome}</h4>

                    <p>${item.quantidade.toString().replace('.', ',')} ${item.tipo} x R$ ${item.preco.toFixed(2).replace('.', ',')}</p>

                    <strong>R$ ${totalItem.toFixed(2).replace('.', ',')}</strong>

                </div>

                <button class="delete-item"><span class="material-symbols-outlined">delete</span></button>

            `;

            div.querySelector("button").onclick = () => { carrinho.splice(i, 1); atualizarCarrinho(); };

            cartItems.appendChild(div);

        });



        document.querySelector("#subtotalDisplay").textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;

        document.querySelector("#totalDisplay").textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;

       

        if (qtdMetodos.value === "2") {

            const v1 = parseFloat(valorMetodo1.value) || 0;

            valorMetodo2.value = Math.max(0, subtotal - v1).toFixed(2);

        }

        calcularTaxasCartaoTodas();

        calcularTroco();

    }



    qtdMetodos.addEventListener("change", function() {

        document.getElementById("rowValor1").style.display = this.value === "2" ? "flex" : "none";

        document.getElementById("metodo2Container").style.display = this.value === "2" ? "block" : "none";

        atualizarCarrinho();

    });



    valorMetodo1.addEventListener("input", atualizarCarrinho);



    [1, 2].forEach(id => {

        document.getElementById(`pagamentoSelect${id}`).addEventListener("change", function() {

            const isCartao = this.value === "Cartao";

            const isDinheiro = this.value === "Dinheiro";

            document.getElementById(`cartaoWrapper${id}`).style.display = isCartao ? "block" : "none";

            document.getElementById(`dinheiroWrapper${id}`).style.display = isDinheiro ? "block" : "none";

            if(!isDinheiro) document.getElementById(`recebido${id}`).value = "";

            calcularTaxasCartaoTodas();

            calcularTroco();

        });

        document.getElementById(`recebido${id}`).addEventListener("input", calcularTroco);

        document.getElementById(`tipoCartao${id}`).addEventListener("change", function() {

            document.getElementById(`parcelamentoWrapper${id}`).style.display = this.value === "credito" ? "flex" : "none";

            calcularTaxasCartaoTodas();

        });

        document.getElementById(`parcelasSelect${id}`).addEventListener("change", calcularTaxasCartaoTodas);

    });

    


    finalizarBtn.addEventListener("click", async () => {

        if (!carrinho.length) return alert("Carrinho vazio");

        const totalVenda = parseFloat(document.querySelector("#totalDisplay").textContent.replace("R$ ", "").replace(",", "."));

        const ids = qtdMetodos.value === "1" ? [1] : [1, 2];

       

        for (let id of ids) {

            if (document.getElementById(`pagamentoSelect${id}`).value === "Dinheiro") {

                const recebido = parseFloat(document.getElementById(`recebido${id}`).value) || 0;

                const devido = (ids.length === 2)

                    ? (id === 1 ? parseFloat(valorMetodo1.value) : parseFloat(valorMetodo2.value))

                    : totalVenda;

                if (recebido < devido) return alert(`Dinheiro insuficiente no Método ${id}! Falta R$ ${(devido - recebido).toFixed(2).replace('.', ',')}`);

            }

        }



        let pagamentos = [];

        let soma = 0;

        for (let id of ids) {

            const metodo = document.getElementById(`pagamentoSelect${id}`).value;

            if(!metodo) return alert("Selecione o método de pagamento");

            let valor = (ids.length === 2) ? (id === 1 ? parseFloat(valorMetodo1.value) : parseFloat(valorMetodo2.value)) : totalVenda;

            pagamentos.push({ metodo, valor, tipo_cartao: document.getElementById(`tipoCartao${id}`).value, parcelas: document.getElementById(`parcelasSelect${id}`).value });

            soma += valor;

        }



        if (Math.abs(soma - totalVenda) > 0.01) return alert("Soma dos pagamentos incorreta");



        try {

            finalizarBtn.disabled = true;

            const res = await fetch("/api/vendas", {

                method: "POST",

                headers: { "Content-Type": "application/json" },

                body: JSON.stringify({

                    id_cliente: clienteSelect.value === "null" ? null : clienteSelect.value,

                    itens: carrinho,

                    pagamentos

                })

            });

            if(!res.ok) throw new Error("Erro ao finalizar");

            alert("Venda finalizada!");

            location.reload();

        } catch (err) { alert(err.message); finalizarBtn.disabled = false; }

    });

});