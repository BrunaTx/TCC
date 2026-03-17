document.addEventListener("DOMContentLoaded", () => {

const productsTableBody = document.getElementById("productsTableBody");
const filterButtons = Array.from(document.querySelectorAll(".filter-btn"));

const totalCount = document.getElementById("totalCount");
const lowCount = document.getElementById("lowCount");
const criticalCount = document.getElementById("criticalCount");

const modal = document.getElementById("estoqueModal");
const produtoNome = document.getElementById("produtoNome");
const novoEstoque = document.getElementById("novoEstoque");

const salvarEstoque = document.getElementById("salvarEstoque");
const cancelarEstoque = document.getElementById("cancelarEstoque");



let products = [];
let produtoSelecionado = null;


// STATUS DO ESTOQUE
const getStatus = (estoque, unidade) => {

if(unidade === "kg"){

if(estoque < 3) return {key:"critical",label:"Crítico"};
if(estoque <= 5) return {key:"low",label:"Baixo"};

}else{

if(estoque < 5) return {key:"critical",label:"Crítico"};
if(estoque <= 10) return {key:"low",label:"Baixo"};

}

return {key:"normal",label:"Normal"};

};



async function carregarProdutos(){

try{

const response = await fetch("/api/estoques");
const data = await response.json();

products = data.map(produto => ({

id:produto.id_produto,
nome:produto.nome,
categoria:produto.categoria,
tipo:produto.tipo_venda === "kg" ? "Quilograma":"Unidade",
estoque:Number(produto.estoque),
unidade:produto.tipo_venda

}));

updateCounters();
renderRows();

}catch(err){

console.error(err);

}

}



const renderRows = (filter="todos")=>{

productsTableBody.innerHTML="";

const visibleProducts = products.filter(product=>{

const status = getStatus(product.estoque,product.unidade).key;

if(filter==="baixo") return status==="low";
if(filter==="critico") return status==="critical";

return true;

});

visibleProducts.forEach(product=>{

const status = getStatus(product.estoque,product.unidade);

const row=document.createElement("tr");

row.innerHTML=`

<td>${product.nome}</td>
<td>${product.categoria}</td>
<td>${product.tipo}</td>
<td>${product.estoque} ${product.unidade}</td>
<td>${status.label}</td>

<td>

<button class="update-btn" data-id="${product.id}">
<span class="material-symbols-outlined">refresh</span>
</button>

</td>

`;

productsTableBody.appendChild(row);

});

};



const updateCounters = ()=>{

const lowUn = products.filter(item=>item.unidade==="un" && item.estoque>=5 && item.estoque<=10).length;
const criticalUn = products.filter(item=>item.unidade==="un" && item.estoque<5).length;

const lowKg = products.filter(item=>item.unidade==="kg" && item.estoque>=3 && item.estoque<=5).length;
const criticalKg = products.filter(item=>item.unidade==="kg" && item.estoque<3).length;

const total = products.length;

totalCount.textContent = total;
lowCount.textContent = lowUn + lowKg;
criticalCount.textContent = criticalUn + criticalKg;


// CARDS
document.getElementById("stockValue").textContent = total;

document.getElementById("lowUnValue").textContent = lowUn;
document.getElementById("lowKgValue").textContent = lowKg;

document.getElementById("criticalUnValue").textContent = criticalUn;
document.getElementById("criticalKgValue").textContent = criticalKg;

};



filterButtons.forEach(button=>{

button.addEventListener("click",()=>{

filterButtons.forEach(btn=>btn.classList.remove("active"));

button.classList.add("active");

renderRows(button.dataset.filter);

});

});



productsTableBody.addEventListener("click",(e)=>{

const btn = e.target.closest(".update-btn");

if(!btn) return;

const id = btn.dataset.id;

const produto = products.find(p=>p.id == id);

produtoSelecionado = produto;

produtoNome.textContent = produto.nome;

novoEstoque.value = produto.estoque;

modal.classList.remove("hidden");

});



cancelarEstoque.addEventListener("click",()=>{

modal.classList.add("hidden");

});



salvarEstoque.addEventListener("click", async()=>{

const valor = parseFloat(novoEstoque.value);

if(isNaN(valor)){

alert("Digite um valor válido");
return;

}

try{

await fetch(`/api/estoques/${produtoSelecionado.id}`,{

method:"PUT",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
estoque:valor
})

});

modal.classList.add("hidden");

carregarProdutos();

}catch(err){

console.error(err);
alert("Erro ao atualizar estoque");

}

});



carregarProdutos();

});