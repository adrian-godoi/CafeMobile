// ==========================================================
// pwa.js - Dia 5 e Dia 6: instalação, compartilhamento,
// instalação, compartilhamento e recursos PWA.
// ==========================================================

const btnInstalar = document.querySelector("#btn-instalar");
let eventoInstalacao = null;

// ---------- Service Worker ----------

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async function () {
    try {
      const registro = await navigator.serviceWorker.register("./sw.js");
      console.log("Service Worker registrado:", registro.scope);
    } catch (erro) {
      console.error("Falha ao registrar o Service Worker:", erro);
    }
  });
}

// ---------- Instalação ----------

window.addEventListener("beforeinstallprompt", function (evento) {
  evento.preventDefault();
  eventoInstalacao = evento;
  btnInstalar.hidden = false;
});

btnInstalar.addEventListener("click", async function () {
  if (!eventoInstalacao) {
    mostrarAviso("Use o menu do navegador para instalar este app.");
    return;
  }

  eventoInstalacao.prompt();
  const escolha = await eventoInstalacao.userChoice;

  mostrarAviso(escolha.outcome === "accepted"
    ? "Instalação iniciada! ☕"
    : "Instalação cancelada.");

  eventoInstalacao = null;
  btnInstalar.hidden = true;
});

window.addEventListener("appinstalled", function () {
  mostrarAviso("Café Mobile instalado com sucesso! ☕");
  btnInstalar.hidden = true;
  eventoInstalacao = null;
});

// ---------- Compartilhar pedido ----------

function montarResumoPedido() {
  if (!Array.isArray(pedido) || pedido.length === 0) return "";

  const linhas = pedido.map(function (item) {
    return item.quantidade + "x " + item.nome + " — " +
      formatarPreco(item.preco * item.quantidade);
  });

  const resumo = [
    "☕ Meu pedido no Café Mobile",
    "",
    ...linhas,
    "",
    "Total: " + formatarPreco(calcularTotal())
  ];


  return resumo.join("\n");
}

async function compartilharPedido() {
  const resumo = montarResumoPedido();

  if (!resumo) {
    mostrarAviso("Adicione um produto antes de compartilhar.");
    return;
  }

  try {
    if (navigator.share) {
      await navigator.share({
        title: "Meu pedido - Café Mobile",
        text: resumo
      });
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(resumo);
      mostrarAviso("Pedido copiado! Você já pode colar e enviar.");
    } else {
      mostrarAviso("Compartilhamento não disponível neste navegador.");
    }
  } catch (erro) {
    if (erro.name !== "AbortError") {
      console.error("Erro ao compartilhar pedido:", erro);
      mostrarAviso("Não foi possível compartilhar o pedido.");
    }
  }
}

document.querySelector("#btn-compartilhar-pedido")
  .addEventListener("click", compartilharPedido);

// ---------- Compartilhar foto ----------

async function compartilharFoto(foto) {
  if (!foto || !foto.imagem) {
    mostrarAviso("Esta foto não está disponível.");
    return;
  }

  try {
    const resposta = await fetch(foto.imagem);
    const blob = await resposta.blob();
    const arquivo = new File(
      [blob],
      "cafe-mobile-" + Date.now() + ".jpg",
      { type: blob.type || "image/jpeg" }
    );

    const titulo = foto.legenda || "Meu café";
    const texto = "☕ " + titulo + " — Café Mobile";

    if (navigator.canShare && navigator.canShare({ files: [arquivo] }) && navigator.share) {
      await navigator.share({
        title: "Foto do Café Mobile",
        text: texto,
        files: [arquivo]
      });
    } else if (navigator.share) {
      await navigator.share({
        title: "Foto do Café Mobile",
        text: texto
      });
      mostrarAviso("Seu navegador compartilhou o texto, mas não anexou a foto.");
    } else {
      mostrarAviso("O compartilhamento de fotos não é compatível com este navegador.");
    }
  } catch (erro) {
    if (erro.name !== "AbortError") {
      console.error("Erro ao compartilhar foto:", erro);
      mostrarAviso("Não foi possível compartilhar esta foto.");
    }
  }
}

