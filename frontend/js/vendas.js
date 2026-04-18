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

    // Configuração de Taxas
    const taxas = {
        debito: 0.0137,
        credito: {
            1: 0.03, 
            2: 0.0539, 3: 0.0612, 4: 0.0685, 5: 0.0757,
            6: 0.0828, 7: 0.0899, 8: 0.0969, 9: 0.1038,
            10: 0.1106, 11: 0.1174
        }
    };

    // Injeção da interface de pagamento
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
            <div id="cartaoWrapper1" style="display:none;margin-top:10px;">
                <div class="line-item"><span>Tipo:</span>
                    <select id="tipoCartao1"><option value="debito">Débito</option><option value="credito">Crédito</option></select>
                </div>
                <div class="line-item" id="parcelamentoWrapper1" style="display:none;">
                    <span>Parcelas:</span>
                    <select id="parcelasSelect1">${[...Array(11).keys()].map(i => `<option value="${i + 1}">${i + 1}x</option>`).join('')}</select>
                </div>
                <p id="valorCartao1" style="font-weight:bold;"></p>
            </div>
            <div id="dinheiroWrapper1" style="display:none;margin-top:10px;">
                <div class="line-item"><span>Valor entregue:</span><input type="number" id="valorPago1" step="0.01" style="width:50%;"></div>
                <p id="troco1" style="font-weight:bold;"></p>
            </div>
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
            <div id="cartaoWrapper2" style="display:none;margin-top:10px;">
                <div class="line-item"><span>Tipo:</span>
                    <select id="tipoCartao2"><option value="debito">Débito</option><option value="credito">Crédito</option></select>
                </div>
                <div class="line-item" id="parcelamentoWrapper2" style="display:none;">
                    <span>Parcelas:</span>
                    <select id="parcelasSelect2">${[...Array(11).keys()].map(i => `<option value="${i + 1}">${i + 1}x</option>`).join('')}</select>
                </div>
                <p id="valorCartao2" style="font-weight:bold;"></p>
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
                produtoHtml += `<option value="${p.id_produto}" 
                    data-preco="${p.preco}" 
                    data-estoque="${p.estoque}" 
                    data-tipo="${p.tipo_venda}">
                    ${p.nome} - R$ ${Number(p.preco).toFixed(2)}
                </option>`;
            });
            produtoSelect.innerHTML = produtoHtml;

            $('#clienteSelect, #produtoSelect').trigger('change');
        } catch (err) { console.error("Erro ao carregar dados:", err); }
    }

    $('#produtoSelect').on('change', function() {
        const opt = this.selectedOptions[0];
        if(!opt || !opt.dataset.preco) return;
        infoTipo.textContent = opt.dataset.tipo === 'kg' ? 'Quilograma' : 'Unidade';
        infoPreco.textContent = `R$ ${Number(opt.dataset.preco).toFixed(2)}`;
        infoEstoque.textContent = `${opt.dataset.estoque} ${opt.dataset.tipo}`;
        productInfo.style.display = "block";
    });

    codigoBarrasVendaInput.addEventListener("keydown", async (e) => {
        if (e.key !== "Enter") return;
        e.preventDefault();
        const codigo = codigoBarrasVendaInput.value.trim();
        if (!codigo) return;

        try {
            let codigoBusca = codigo;
            let valorTotalEtiqueta = null;

            if (codigo.startsWith("2") && codigo.length === 13) {
                codigoBusca = codigo.substring(0, 7);
                valorTotalEtiqueta = parseInt(codigo.substring(7, 12)) / 100;
            }

            const res = await fetch(`/api/produtos/codigo/${codigoBusca}`);
            const produto = await res.json();
            if (!res.ok) throw new Error("Produto não encontrado");

            const precoUnit = Number(produto.preco);
            const qtd = valorTotalEtiqueta ? (valorTotalEtiqueta / precoUnit) : 1;
            const qtdFinal = parseFloat(qtd.toFixed(3));
            
            adicionarAoCarrinho(produto.id_produto, produto.nome, precoUnit, qtdFinal, Number(produto.estoque), produto.tipo_venda);
            codigoBarrasVendaInput.value = "";
        } catch (err) { alert(err.message); }
    });

    addBtn.addEventListener("click", () => {
        const opt = produtoSelect.selectedOptions[0];
        const qtdRaw = Number(quantidadeInput.value);
        if(!opt.value || qtdRaw <= 0) return alert("Verifique produto e quantidade");
        
        const qtdFinal = parseFloat(qtdRaw.toFixed(3));
        adicionarAoCarrinho(opt.value, opt.textContent.split(" - ")[0].trim(), Number(opt.dataset.preco), qtdFinal, Number(opt.dataset.estoque), opt.dataset.tipo);
    });

    function adicionarAoCarrinho(id, nome, preco, qtd, estoque, tipo) {
        const jaNoCart = carrinho.filter(i => i.id_produto == id).reduce((acc, i) => acc + i.quantidade, 0);
        if ((qtd + jaNoCart) > (estoque + 0.001)) return alert("Estoque insuficiente");
        
        carrinho.push({ 
            id_produto: id, 
            nome, 
            preco: Number(preco), 
            quantidade: Number(qtd),
            tipo: tipo 
        });
        atualizarCarrinho();
    }

    function atualizarCarrinho() {
        cartItems.innerHTML = "";
        let subtotal = 0;
        
        carrinho.forEach((item, i) => {
            // REMOVIDO O Math.round PARA MANTER PRECISÃO NO CÁLCULO
            const totalItem = item.preco * item.quantidade;
            subtotal += totalItem;

            const div = document.createElement("div");
            div.className = "cart-item";
            div.innerHTML = `
                <div>
                    <h4>${item.nome}</h4>
                    <p>${item.quantidade.toFixed(3)} ${item.tipo === 'kg' ? 'kg' : 'un'} x R$ ${item.preco.toFixed(2)}</p>
                    <strong>R$ ${totalItem.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </div>
                <button class="delete-item"><span class="material-symbols-outlined">delete</span></button>
            `;
            div.querySelector("button").onclick = () => { carrinho.splice(i, 1); atualizarCarrinho(); };
            cartItems.appendChild(div);
        });

        // Arredondamos apenas na exibição final dos totais
        document.querySelector("#subtotalDisplay").textContent = `R$ ${subtotal.toFixed(2)}`;
        document.querySelector("#totalDisplay").textContent = `R$ ${subtotal.toFixed(2)}`;
        
        if (qtdMetodos.value === "2") {
            const v1 = parseFloat(valorMetodo1.value) || 0;
            valorMetodo2.value = Math.max(0, subtotal - v1).toFixed(2);
        }
        
        calcularTaxasCartaoTodas();
    }

    qtdMetodos.addEventListener("change", function() {
        document.getElementById("rowValor1").style.display = this.value === "2" ? "flex" : "none";
        document.getElementById("metodo2Container").style.display = this.value === "2" ? "block" : "none";
        atualizarCarrinho();
    });

    valorMetodo1.addEventListener("input", atualizarCarrinho);

    [1, 2].forEach(id => {
        document.getElementById(`pagamentoSelect${id}`).addEventListener("change", function() {
            document.getElementById(`cartaoWrapper${id}`).style.display = this.value === "Cartao" ? "block" : "none";
            const dinheiroDiv = document.getElementById(`dinheiroWrapper1`);
            if (id === 1) dinheiroDiv.style.display = this.value === "Dinheiro" ? "block" : "none";
        });
        document.getElementById(`tipoCartao${id}`).addEventListener("change", function() {
            document.getElementById(`parcelamentoWrapper${id}`).style.display = this.value === "credito" ? "flex" : "none";
            calcularTaxasCartaoTodas();
        });
        document.getElementById(`parcelasSelect${id}`).addEventListener("change", calcularTaxasCartaoTodas);
    });

    function calcularTaxasCartaoTodas() {
        const subtotalStr = document.querySelector("#totalDisplay").textContent.replace("R$ ", "");
        const subtotal = parseFloat(subtotalStr) || 0;

        [1, 2].forEach(id => {
            const valorBase = qtdMetodos.value === "2" 
                ? (id === 1 ? parseFloat(valorMetodo1.value) : parseFloat(valorMetodo2.value))
                : subtotal;
            
            if(!valorBase || isNaN(valorBase)) return;
            
            const tipo = document.getElementById(`tipoCartao${id}`).value;
            const parcelas = Number(document.getElementById(`parcelasSelect${id}`).value);
            let totalComTaxa = valorBase;

            if(tipo === "debito") {
                totalComTaxa = valorBase * (1 + taxas.debito);
            } else if(tipo === "credito") {
                totalComTaxa = valorBase * (1 + (taxas.credito[parcelas] || 0));
            }

            const el = document.getElementById(`valorCartao${id}`);
            if(el) el.textContent = `Total com taxa: R$ ${totalComTaxa.toFixed(2)}`;
        });
    }

    finalizarBtn.addEventListener("click", async () => {
        if (!carrinho.length) return alert("Carrinho vazio");

        const subtotalStr = document.querySelector("#totalDisplay").textContent.replace("R$ ", "");
        const totalVenda = parseFloat(subtotalStr);
        
        const ids = qtdMetodos.value === "1" ? [1] : [1, 2];
        let pagamentos = [];
        let somaPagamentos = 0;

        for (let id of ids) {
            const metodo = document.getElementById(`pagamentoSelect${id}`).value;
            if(!metodo) return alert(`Selecione o método de pagamento ${id}`);

            let valorMetodo = (ids.length === 2) 
                ? (id === 1 ? parseFloat(valorMetodo1.value) : parseFloat(valorMetodo2.value)) 
                : totalVenda;

            pagamentos.push({ 
                metodo, 
                valor: valorMetodo, 
                tipo_cartao: document.getElementById(`tipoCartao${id}`).value,
                parcelas: document.getElementById(`parcelasSelect${id}`).value
            });
            somaPagamentos += valorMetodo;
        }

        if (Math.abs(somaPagamentos - totalVenda) > 0.01) {
            return alert("A soma dos pagamentos não confere com o total da venda!");
        }

        try {
            finalizarBtn.disabled = true;
            const res = await fetch("/api/vendas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id_cliente: clienteSelect.value === "null" ? null : clienteSelect.value,
                    itens: carrinho.map(i => ({ 
                        id_produto: i.id_produto, 
                        quantidade: i.quantidade, 
                        preco: i.preco 
                    })),
                    pagamentos
                })
            });

            const data = await res.json();
            if(!res.ok) throw new Error(data.erro);

            alert("Venda finalizada com sucesso!");
            location.reload();
        } catch (err) { 
            alert(err.message); 
            finalizarBtn.disabled = false; 
        }
    });
});