const clienteSelect = document.getElementById("clienteSelect")
const produtoSelect = document.getElementById("produtoSelect")
const quantidadeInput = document.getElementById("quantidade")

const infoTipo = document.getElementById("infoTipo")
const infoPreco = document.getElementById("infoPreco")
const infoEstoque = document.getElementById("infoEstoque")

const productInfo = document.getElementById("productInfo")

const cartItems = document.getElementById("cartItems")

const subtotalEl = document.querySelector("#totalsBox .line-item span:last-child")
const totalEl = document.querySelector(".total-row span:last-child")

const addBtn = document.querySelector(".sale-add-btn")
const finalizarBtn = document.querySelector(".finalize-btn")

let carrinho = []
let clienteCarrinho = null

/* MOSTRAR INFORMAÇÕES DO PRODUTO */

produtoSelect.addEventListener("change", () => {

  const option = produtoSelect.selectedOptions[0]

  const preco = option.dataset.preco
  const estoque = option.dataset.estoque
  const tipo = option.dataset.tipo

  infoTipo.textContent = tipo
  infoPreco.textContent = `R$ ${Number(preco).toFixed(2)}`
  infoEstoque.textContent = estoque

  quantidadeInput.max = estoque

  productInfo.style.display = "block"

})

/* ADICIONAR AO CARRINHO */

addBtn.addEventListener("click", () => {

  const cliente = clienteSelect.value

  if (!cliente) {
    alert("Selecione um cliente")
    return
  }

  const option = produtoSelect.selectedOptions[0]

  if (!option || !option.dataset.preco) {
    alert("Selecione um produto")
    return
  }

  const nome = option.textContent.split(" - ")[0]
  const preco = Number(option.dataset.preco)
  const estoque = Number(option.dataset.estoque)
  const quantidade = Number(quantidadeInput.value)

  if (quantidade <= 0) {
    alert("Quantidade inválida")
    return
  }

  if (quantidade > estoque) {
    alert("Quantidade maior que o estoque disponível")
    return
  }

  /* DEFINE O CLIENTE DO CARRINHO */
  if (!clienteCarrinho) {
    clienteCarrinho = cliente
    clienteSelect.disabled = true
  }

  carrinho.push({
    nome,
    preco,
    quantidade
  })

  atualizarCarrinho()

})

/* ATUALIZAR CARRINHO */

function atualizarCarrinho() {

  cartItems.innerHTML = ""

  let subtotal = 0

  carrinho.forEach((item, index) => {

    const totalItem = item.preco * item.quantidade
    subtotal += totalItem

    const div = document.createElement("div")
    div.className = "cart-item"

    div.innerHTML = `
      <div>
        <h4>${item.nome}</h4>
        <p>${item.quantidade} x R$ ${item.preco.toFixed(2)}</p>
        <strong>R$ ${totalItem.toFixed(2)}</strong>
      </div>

      <button class="delete-item">
        <span class="material-symbols-outlined">delete</span>
      </button>
    `

    div.querySelector("button").onclick = () => {

      carrinho.splice(index,1)

      if(carrinho.length === 0){
        clienteCarrinho = null
        clienteSelect.disabled = false
      }

      atualizarCarrinho()

    }

    cartItems.appendChild(div)

  })

  subtotalEl.textContent = `R$ ${subtotal.toFixed(2)}`
  totalEl.textContent = `R$ ${subtotal.toFixed(2)}`

}

/* FINALIZAR VENDA */

finalizarBtn.addEventListener("click", () => {

  if (carrinho.length === 0) {
    alert("Carrinho vazio")
    return
  }

  const clienteNome = clienteSelect.selectedOptions[0].textContent

  alert(`Venda realizada com sucesso para ${clienteNome}!`)

  carrinho = []
  clienteCarrinho = null

  clienteSelect.disabled = false
  clienteSelect.selectedIndex = 0

  atualizarCarrinho()

})