// ==========================================================
// app.js - Cardápio, filtros por categoria e pedido.
// ==========================================================

function formatarPreco(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

let temporizadorAviso;
function mostrarAviso(texto) {
  const aviso = document.querySelector("#aviso");
  aviso.textContent = texto;
  aviso.classList.add("visivel");
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(function () {
    aviso.classList.remove("visivel");
  }, 2500);
}

function vibrar(padrao) {
  if ("vibrate" in navigator) {
    navigator.vibrate(padrao);
  }
}

// ---------- Navegação por abas ----------

const abas = document.querySelectorAll(".aba");
const telas = document.querySelectorAll(".tela");

function abrirTela(idTela) {
  for (const tela of telas) {
    tela.hidden = tela.id !== idTela;
  }
  for (const aba of abas) {
    aba.classList.toggle("ativa", aba.dataset.tela === idTela);
  }
  window.scrollTo(0, 0);

  if (idTela !== "tela-camera") {
    desligarCamera();
  }
}

for (const aba of abas) {
  aba.addEventListener("click", function () {
    abrirTela(aba.dataset.tela);
  });
}

// ---------- Cardápio e filtros por categoria ----------

const listaProdutos = document.querySelector("#lista-produtos");
const botoesFiltro = document.querySelectorAll(".filtro");
let categoriaAtual = "Todos";

function criarCard(produto) {
  const card = document.createElement("article");
  card.className = "card";
  card.innerHTML = `
    <div class="card-emoji">${produto.emoji}</div>
    <div class="card-info">
      <h3>${produto.nome}</h3>
      <p>${produto.descricao}</p>
      <strong>${formatarPreco(produto.preco)}</strong>
    </div>
    <button class="btn-adicionar" aria-label="Adicionar ${produto.nome}">+</button>
  `;
  card.querySelector(".btn-adicionar").addEventListener("click", function () {
    adicionarAoPedido(produto);
  });
  return card;
}

function mostrarCardapio() {
  listaProdutos.innerHTML = "";

  const encontrados = produtos.filter(function (produto) {
    const categoriaCorresponde =
      categoriaAtual === "Todos" || produto.categoria === categoriaAtual;
    return categoriaCorresponde;
  });

  if (encontrados.length === 0) {
    listaProdutos.innerHTML = '<p class="vazio">Nenhum produto encontrado. Tente outro nome.</p>';
    return;
  }

  for (const produto of encontrados) {
    listaProdutos.appendChild(criarCard(produto));
  }
}

for (const botao of botoesFiltro) {
  botao.addEventListener("click", function () {
    for (const outro of botoesFiltro) {
      outro.classList.remove("ativo");
    }
    botao.classList.add("ativo");
    categoriaAtual = botao.dataset.categoria;
    mostrarCardapio();
  });
}


// ---------- Pedido ----------

function carregarPedido() {
  const salvo = localStorage.getItem("pedido");
  if (salvo) {
    try {
      return JSON.parse(salvo);
    } catch (erro) {
      console.error("Não foi possível recuperar o pedido:", erro);
    }
  }
  return [];
}

function salvarPedido() {
  localStorage.setItem("pedido", JSON.stringify(pedido));
}

let pedido = carregarPedido();


function adicionarAoPedido(produto) {
  const item = pedido.find(function (i) {
    return i.id === produto.id;
  });

  if (item) {
    item.quantidade = item.quantidade + 1;
  } else {
    pedido.push({ id: produto.id, nome: produto.nome, preco: produto.preco, quantidade: 1 });
  }

  salvarPedido();
  mostrarPedido();
  vibrar(50);
  mostrarAviso(produto.emoji + " " + produto.nome + " adicionado");
}

function alterarQuantidade(id, mudanca) {
  const item = pedido.find(function (i) {
    return i.id === id;
  });
  if (!item) return;

  item.quantidade = item.quantidade + mudanca;

  if (item.quantidade <= 0) {
    pedido = pedido.filter(function (i) {
      return i.id !== id;
    });
  }
  salvarPedido();
  mostrarPedido();
}

function calcularTotal() {
  let total = 0;
  for (const item of pedido) {
    total = total + item.preco * item.quantidade;
  }
  return total;
}

function mostrarPedido() {
  const lista = document.querySelector("#lista-pedido");
  lista.innerHTML = "";

  if (pedido.length === 0) {
    lista.innerHTML = '<li class="vazio">Seu pedido está vazio. Escolha algo no cardápio!</li>';
  }

  let quantidadeTotal = 0;
  for (const item of pedido) {
    quantidadeTotal = quantidadeTotal + item.quantidade;

    const li = document.createElement("li");
    li.className = "item-pedido";
    li.innerHTML = `
      <div class="nome">
        ${item.nome}
        <small>${formatarPreco(item.preco * item.quantidade)}</small>
      </div>
      <button class="btn-qtd menos" aria-label="Diminuir">−</button>
      <span>${item.quantidade}</span>
      <button class="btn-qtd mais" aria-label="Aumentar">+</button>
    `;
    li.querySelector(".menos").addEventListener("click", function () {
      alterarQuantidade(item.id, -1);
    });
    li.querySelector(".mais").addEventListener("click", function () {
      alterarQuantidade(item.id, 1);
    });
    lista.appendChild(li);
  }

  document.querySelector("#total-pedido").textContent = formatarPreco(calcularTotal());

  const contador = document.querySelector("#contador-pedido");
  contador.textContent = quantidadeTotal;
  contador.hidden = quantidadeTotal === 0;

  document.querySelector("#btn-finalizar").disabled = pedido.length === 0;
  document.querySelector("#btn-compartilhar-pedido").disabled = pedido.length === 0;
}

function finalizarPedido() {
  if (pedido.length === 0) return;

  vibrar([100, 50, 100, 50, 200]);
  mostrarAviso("Pedido enviado! Total: " + formatarPreco(calcularTotal()));
  pedido = [];
  salvarPedido();
  mostrarPedido();

}

document.querySelector("#btn-finalizar").addEventListener("click", finalizarPedido);

// ---------- Início ----------
mostrarCardapio();
mostrarPedido();
