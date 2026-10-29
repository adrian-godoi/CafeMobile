
 // ==========================================================
 // camera.js - Dia 4: câmera do celular e galeria de fotos
 // RECURSO DE HARDWARE: câmera (frontal e traseira)
 // Exige HTTPS (ou arquivo local/localhost) e permissão do usuário.
 // ==========================================================

const areaCamera = document.querySelector("#area-camera");
const video = document.querySelector("#video");
const canvas = document.querySelector("#canvas");
const btnLigarCamera = document.querySelector("#btn-ligar-camera");
const btnFoto = document.querySelector("#btn-foto");
const btnTrocarCamera = document.querySelector("#btn-trocar-camera");
const inputFoto = document.querySelector("#input-foto");
const galeria = document.querySelector("#galeria");
const tituloGaleria = document.querySelector("#tela-camera h3");

let stream = null;                 // a "transmissão" da câmera ligada
let cameraAtual = "environment";   // "environment" = traseira, "user" = frontal

// ---------- Ligar e desligar ----------

// async/await: esperamos o usuário responder ao pedido de permissão
async function ligarCamera() {
  // O navegador tem acesso à câmera? (sem HTTPS, mediaDevices nem existe)
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    mostrarAviso("Câmera indisponível. Abra o app pelo link https://");
    return;
  }

  desligarCamera(); // se já estava ligada, desliga antes de trocar

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: cameraAtual },
      audio: false
    });
    video.srcObject = stream;               // liga o vídeo na câmera
    video.classList.toggle("espelhado", cameraAtual === "user");
    areaCamera.classList.add("ligada");
    btnFoto.disabled = false;
    btnTrocarCamera.disabled = false;
    btnLigarCamera.textContent = "Desligar";
  } catch (erro) {
    // NotAllowedError = usuário negou | NotFoundError = sem câmera
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
    // Cada "track" é um sensor em uso; stop() desliga (e apaga a luz da câmera)
    for (const track of stream.getTracks()) {
      track.stop();
    }
    stream = null;
  }
  video.srcObject = null;
  areaCamera.classList.remove("ligada");
  btnFoto.disabled = true;
  btnTrocarCamera.disabled = true;
  btnLigarCamera.textContent = "Ligar câmera";
}

function trocarCamera() {
  if (cameraAtual === "environment") {
    cameraAtual = "user";
  } else {
    cameraAtual = "environment";
  }
  ligarCamera();
}

btnLigarCamera.addEventListener("click", function () {
  if (stream) {
    desligarCamera();
  } else {
    ligarCamera();
  }
});
btnTrocarCamera.addEventListener("click", trocarCamera);

// ---------- Fotos ----------

function carregarFotos() {
  const salvas = localStorage.getItem("fotos");
  if (salvas) {
    return JSON.parse(salvas);
  }
  return [];
}

let fotos = carregarFotos(); // cada foto: { imagem: "data:image/jpeg...", data: "01/10/2026 10:30" }

function salvarFotos() {
  try {
    localStorage.setItem("fotos", JSON.stringify(fotos));
  } catch (erro) {
    // localStorage tem limite (~5 MB). Se encher, apagamos a foto mais antiga.
    fotos.pop();
    mostrarAviso("Galeria cheia: a foto mais antiga foi removida");
    try {
      localStorage.setItem("fotos", JSON.stringify(fotos));
    } catch (erro) {
      mostrarAviso("Não foi possível salvar as fotos. O armazenamento está cheio.");
    }
  }
}

// Desenha uma imagem (do vídeo ou de um arquivo) no canvas, já reduzida,
// e guarda o resultado na galeria
function guardarImagem(fonte, larguraOriginal, alturaOriginal) {
  const legendaDigitada = prompt("Legenda da foto:");

  if (legendaDigitada === null) {
    return false;
  }

  const legenda = legendaDigitada.trim() || "Sem legenda";
  const largura = 1080; // reduzimos para não lotar o armazenamento
  const altura = Math.round((alturaOriginal / larguraOriginal) * largura);
  canvas.width = largura;
  canvas.height = altura;

  const contexto = canvas.getContext("2d");
  contexto.drawImage(fonte, 0, 0, largura, altura);

  // Transforma o desenho em texto (base64) no formato JPEG, qualidade 70%
  const imagem = canvas.toDataURL("image/jpeg", 0.95);

  fotos.unshift({
    imagem: imagem,
    legenda: legenda,
    data: new Date().toLocaleString("pt-BR")
  }); // unshift = coloca no começo

  if (fotos.length > 12) {
    fotos.pop(); // guardamos no máximo 12 fotos
  }
  salvarFotos();
  mostrarGaleria();

  return true;
}

function tirarFoto() {
  if (!stream) {
    return;
  }

  const salva = guardarImagem(video, video.videoWidth, video.videoHeight);

  if (!salva) {
    return;
  }

  // Efeito de flash + vibração, como uma câmera de verdade
  areaCamera.classList.remove("flash");
  void areaCamera.offsetWidth; // truque para reiniciar a animação
  areaCamera.classList.add("flash");
  vibrar(30);
  mostrarAviso("📸 Foto salva na galeria");
}

btnFoto.addEventListener("click", tirarFoto);

// Jeito simples: <input type="file" capture> abre o app de câmera do celular
inputFoto.addEventListener("change", function () {
  const arquivo = inputFoto.files[0];
  if (!arquivo) {
    return;
  }
  const img = new Image();
  img.onload = function () {
    const salva = guardarImagem(img, img.naturalWidth, img.naturalHeight);
    URL.revokeObjectURL(img.src);

    if (salva) {
      mostrarAviso("📸 Foto salva na galeria");
    }
  };
  img.src = URL.createObjectURL(arquivo);
  inputFoto.value = ""; // permite escolher a mesma foto de novo
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

  for (const foto of fotos) {
    const div = document.createElement("div");
    div.className = "foto";

    const imagem = document.createElement("img");
    imagem.src = foto.imagem;
    imagem.alt = "Foto do meu café";

    const legenda = document.createElement("small");
    legenda.textContent = foto.legenda || foto.data || "Sem legenda";

    div.appendChild(imagem);
    div.appendChild(legenda);
    galeria.appendChild(div);
  }
}

// ---------- Início ----------
mostrarGaleria();