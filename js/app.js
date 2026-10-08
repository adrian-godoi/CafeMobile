// ==========================================================
// app.js - Dia 2: cardápio dinâmico e filtro por categoria
// ==========================================================

// ---------- Utilidades ----------

// Transforma 9.5 em "R$ 9,50"
function formatarPreco(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ---------- Cardápio ----------

// Pegamos os elementos da página UMA vez e guardamos em constantes
const listaProdutos = document.querySelector("#lista-produtos");
const botoesFiltro = document.querySelectorAll(".filtro");

// Cria o card (HTML) de um produto
function criarCard(produto) {
  const card = document.createElement("article");
  card.className = "card";

  // Template string (crase): permite colocar variáveis com ${ }
  card.innerHTML = `
    <div class="card-emoji">${produto.emoji}</div>
    <div class="card-info">
      <h3>${produto.nome}</h3>
      <p>${produto.descricao}</p>
      <strong>${formatarPreco(produto.preco)}</strong>
    </div>
    <button class="btn-adicionar" aria-label="Adicionar ${produto.nome}">+</button>
  `;

  // Evento de clique no botão "+" deste card
  const botao = card.querySelector(".btn-adicionar");
  botao.addEventListener("click", function () {
    console.log("Clicou em:", produto.nome, produto.preco);
  });

  return card;
}

// Mostra os produtos da categoria escolhida ("Todos" mostra tudo)
function mostrarCardapio(categoria) {
  listaProdutos.innerHTML = ""; // limpa a lista

  for (const produto of produtos) {
    if (categoria === "Todos" || produto.categoria === categoria) {
      listaProdutos.appendChild(criarCard(produto));
    }
  }
}

// Clique em um filtro: marca o botão como ativo e filtra a lista
for (const botao of botoesFiltro) {
  botao.addEventListener("click", function () {
    for (const outro of botoesFiltro) {
      outro.classList.remove("ativo");
    }
    botao.classList.add("ativo");
    mostrarCardapio(botao.dataset.categoria);
  });
}

// ---------- Início ----------
mostrarCardapio("Todos");
