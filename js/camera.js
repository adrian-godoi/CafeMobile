// ==========================================================
// camera.js - câmera, galeria, compartilhamento e exclusão
// ==========================================================

const areaCamera = document.querySelector("#area-camera");
const video = document.querySelector("#video");
const canvas = document.querySelector("#canvas");
const btnLigarCamera = document.querySelector("#btn-ligar-camera");
const btnFoto = document.querySelector("#btn-foto");
const btnTrocarCamera = document.querySelector("#btn-trocar-camera");
const inputFoto = document.querySelector("#input-foto");
const galeria = document.querySelector("#galeria");
const tituloGaleria = document.querySelector("#titulo-galeria");

let stream = null;
let cameraAtual = "environment";

async function ligarCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    mostrarAviso("Câmera indisponível. Abra o app por HTTPS ou localhost.");
    return;
  }

  desligarCamera();

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: cameraAtual },
      audio: false
    });
    video.srcObject = stream;
    video.classList.toggle("espelhado", cameraAtual === "user");
    areaCamera.classList.add("ligada");
    btnFoto.disabled = false;
    btnTrocarCamera.disabled = false;
    btnLigarCamera.textContent = "Desligar";
  } catch (erro) {
    console.log(erro);
    if (erro.name === "NotAllowedError" || erro.name === "PermissionDeniedError") {
      mostrarAviso("Você precisa permitir o uso da câmera");
    } else {
      mostrarAviso("Não foi possível abrir a câmera (" + erro.name + ")");
    }
  }
}

function desligarCamera() {
  if (stream) {
    for (const track of stream.getTracks()) track.stop();
    stream = null;
  }
  video.srcObject = null;
  areaCamera.classList.remove("ligada");
  btnFoto.disabled = true;
  btnTrocarCamera.disabled = true;
  btnLigarCamera.textContent = "Ligar câmera";
}

function trocarCamera() {
  cameraAtual = cameraAtual === "environment" ? "user" : "environment";
  ligarCamera();
}

btnLigarCamera.addEventListener("click", function () {
  if (stream) desligarCamera();
  else ligarCamera();
});
btnTrocarCamera.addEventListener("click", trocarCamera);

// ---------- Fotos ----------

function carregarFotos() {
  const salvas = localStorage.getItem("fotos");
  if (salvas) {
    try {
      return JSON.parse(salvas);
    } catch (erro) {
      console.error("Não foi possível recuperar as fotos:", erro);
    }
  }
  return [];
}

let fotos = carregarFotos();

function salvarFotos() {
  try {
    localStorage.setItem("fotos", JSON.stringify(fotos));
  } catch (erro) {
    fotos.pop();
    mostrarAviso("Galeria cheia: a foto mais antiga foi removida");
    try {
      localStorage.setItem("fotos", JSON.stringify(fotos));
    } catch (erroInterno) {
      mostrarAviso("Não foi possível salvar as fotos. O armazenamento está cheio.");
    }
  }
}

function guardarImagem(fonte, larguraOriginal, alturaOriginal) {
  const legendaDigitada = prompt("Legenda da foto:");
  if (legendaDigitada === null) return false;

  const legenda = legendaDigitada.trim() || "Sem legenda";
  const largura = 1080;
  const altura = Math.round((alturaOriginal / larguraOriginal) * largura);
  canvas.width = largura;
  canvas.height = altura;

  const contexto = canvas.getContext("2d");
  contexto.drawImage(fonte, 0, 0, largura, altura);

  const imagem = canvas.toDataURL("image/jpeg", 0.85);
  fotos.unshift({
    imagem: imagem,
    legenda: legenda,
    data: new Date().toLocaleString("pt-BR")
  });

  if (fotos.length > 12) fotos.pop();
  salvarFotos();
  mostrarGaleria();
  return true;
}

function tirarFoto() {
  if (!stream) return;

  const salva = guardarImagem(video, video.videoWidth, video.videoHeight);
  if (!salva) return;

  areaCamera.classList.remove("flash");
  void areaCamera.offsetWidth;
  areaCamera.classList.add("flash");
  vibrar(30);
  mostrarAviso("📸 Foto salva na galeria");
}

btnFoto.addEventListener("click", tirarFoto);

inputFoto.addEventListener("change", function () {
  const arquivo = inputFoto.files[0];
  if (!arquivo) return;

  const img = new Image();
  img.onload = function () {
    const salva = guardarImagem(img, img.naturalWidth, img.naturalHeight);
    URL.revokeObjectURL(img.src);
    if (salva) mostrarAviso("📸 Foto salva na galeria");
  };
  img.onerror = function () {
    mostrarAviso("Não foi possível carregar essa imagem.");
    URL.revokeObjectURL(img.src);
  };
  img.src = URL.createObjectURL(arquivo);
  inputFoto.value = "";
});

function mostrarGaleria() {
  galeria.innerHTML = "";

  if (tituloGaleria) {
    tituloGaleria.textContent = `Galeria (${fotos.length})`;
  }

  if (fotos.length === 0) {
    galeria.innerHTML = '<p class="vazio">Nenhuma foto ainda.</p>';
    return;
  }

  fotos.forEach(function (foto, indice) {
    const div = document.createElement("div");
    div.className = "foto";

    const imagem = document.createElement("img");
    imagem.src = foto.imagem;
    imagem.alt = foto.legenda || "Foto do meu café";

    const legenda = document.createElement("small");
    legenda.textContent = foto.legenda || foto.data || "Sem legenda";

    const botoes = document.createElement("div");
    botoes.className = "acoes-foto";

    const botaoCompartilhar = document.createElement("button");
    botaoCompartilhar.type = "button";
    botaoCompartilhar.className = "btn-compartilhar-foto";
    botaoCompartilhar.textContent = "Compartilhar";
    botaoCompartilhar.setAttribute("aria-label", "Compartilhar foto: " + (foto.legenda || "Meu café"));
    botaoCompartilhar.addEventListener("click", function () {
      compartilharFoto(foto);
    });

    div.appendChild(imagem);
    div.appendChild(legenda);
    div.appendChild(botoes);
    galeria.appendChild(div);
  });
}

mostrarGaleria();
