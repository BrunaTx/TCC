const produtoSelect = document.getElementById("produtoSelect");
const productInfo = document.getElementById("productInfo");
const infoTipo = document.getElementById("infoTipo");
const infoPreco = document.getElementById("infoPreco");
const infoEstoque = document.getElementById("infoEstoque");
const quantidadeInput = document.getElementById("quantidade");
const cartItems = document.getElementById("cartItems");
const totalsBox = document.getElementById("totalsBox");

let carrinho = [];
let subtotal = 0;

produtoSelect.addEventListener("change", () => {
  const selected = produtoSelect.options[produtoSelect.selectedIndex];

  const preco = parseFloat(selected.dataset.preco);
  const estoque = parseInt(selected.dataset.estoque);
  const tipo = selected.dataset.tipo;

  infoTipo.textContent = tipo;
  infoPreco.textContent = `R$ ${preco.toFixed(2)}`;
  infoEstoque.textContent = estoque;

  productInfo.style.display = "block";
});

document.querySelector(".sale-add-btn").addEventListener("click", () => {
  const selected = produtoSelect.options[produtoSelect.selectedIndex];

  if (!selected.dataset.preco) {
    alert("Selecione um produto.");
    return;
  }

  const id = selected.value;
  const nome = selected.textContent;
  const preco = parseFloat(selected.dataset.preco);
  let estoque = parseInt(selected.dataset.estoque);
  const quantidade = parseInt(quantidadeInput.value);

  if (quantidade <= 0 || quantidade > estoque) {
    alert("Quantidade inválida.");
    return;
  }

  const existente = carrinho.find(item => item.id === id);

  if (existente) {
    if (existente.quantidade + quantidade > estoque) {
      alert("Estoque insuficiente.");
      return;
    }
    existente.quantidade += quantidade;
  } else {
    carrinho.push({ id, nome, preco, quantidade });
  }

  selected.dataset.estoque = estoque - quantidade;
  atualizarCarrinho();
});

function atualizarCarrinho() {
  cartItems.innerHTML = "";
  subtotal = 0;

  carrinho.forEach((item, index) => {
    const totalItem = item.preco * item.quantidade;
    subtotal += totalItem;

    const div = document.createElement("div");
    div.classList.add("cart-item");

    div.innerHTML = `
      <div>
        <h4>${item.nome}</h4>
        <p>${item.quantidade} un × R$ ${item.preco.toFixed(2)}</p>
        <strong>R$ ${totalItem.toFixed(2)}</strong>
      </div>
      <button class="delete-item" onclick="removerItem(${index})">🗑</button>
    `;

    cartItems.appendChild(div);
  });

  totalsBox.innerHTML = `
    <div class="line-item">
      <span>Subtotal:</span>
      <span>R$ ${subtotal.toFixed(2)}</span>
    </div>
    <div class="line-item total-row">
      <span>TOTAL:</span>
      <span>R$ ${subtotal.toFixed(2)}</span>
    </div>
  `;
}

function removerItem(index) {
  const item = carrinho[index];
  const option = document.querySelector(`option[value="${item.id}"]`);
  option.dataset.estoque = parseInt(option.dataset.estoque) + item.quantidade;

  carrinho.splice(index, 1);
  atualizarCarrinho();
}