// =======================================================
// LAYLA AI 4.1 QUANTUM - CONTROLLER
// ElevenLabs Audio // 4D Parallax // Living Soundwaves
// =======================================================

let currentUser = JSON.parse(localStorage.getItem("layla_user") || '{"name":"Gerardo","is_creator":true,"avatar":"G"}');
let currentEmotion = localStorage.getItem("layla_emotion") || "professional";
let currentTheme = localStorage.getItem("layla_theme") || "dark";
let isVoiceActive = localStorage.getItem("layla_voice_active") !== "false";
let conversationHistory = [];

// Una sola entrada por conversación en el historial
let currentSessionTitle = null;

// DOM Elements
const chatStream = document.getElementById("chatStream");
const heroWelcome = document.getElementById("heroWelcome");
const messagesFeed = document.getElementById("messagesFeed");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const micBtn = document.getElementById("micBtn");
const imageShortcutBtn = document.getElementById("imageShortcutBtn");
const newChatBtn = document.getElementById("newChatBtn");
const toggleSidebarBtn = document.getElementById("toggleSidebarBtn");
const sidebar = document.getElementById("sidebar");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const soundwaveBar = document.getElementById("soundwaveBar");
const waveToggleBtn = document.getElementById("waveToggleBtn");
const waveStatusText = document.getElementById("waveStatusText");
const liveWaveCanvas = document.getElementById("liveWaveCanvas");
const audioPlayer = document.getElementById("audioPlayer");

// Modals
const authModal = document.getElementById("authModal");
const imageModal = document.getElementById("imageModal");
const modalImg = document.getElementById("modalImg");
const downloadImgBtn = document.getElementById("downloadImgBtn");
const modal4DCard = document.getElementById("modal4DCard");

// Emotion Pills
const emotionPills = document.querySelectorAll(".pill-emotion");

// INITIALIZATION
window.addEventListener("DOMContentLoaded", () => {
  applyTheme(currentTheme);
  applyEmotion(currentEmotion);
  updateVoiceToggleUI();
  updateUserUI();
  initSoundwaves();
  setupTextarea();
  setup4DParallax();
  setupCameraBtn();
});

// -------------------------------------------------------
// THEME & EMOTIONS
// -------------------------------------------------------
function applyTheme(theme) {
  currentTheme = theme;
  document.body.classList.toggle("theme-dark", theme === "dark");
  document.body.classList.toggle("theme-light", theme === "light");
  themeToggleBtn.innerText = theme === "dark" ? "🌙" : "☀️";
  localStorage.setItem("layla_theme", theme);
}

themeToggleBtn.addEventListener("click", () => {
  applyTheme(currentTheme === "dark" ? "light" : "dark");
});

// FIX: applyEmotion ahora preserva las clases theme- y solo cambia emotion-
function applyEmotion(emotion) {
  currentEmotion = emotion;

  // Quitar solo las clases emotion-* sin tocar theme-*
  const body = document.body;
  const classesToRemove = [...body.classList].filter(c => c.startsWith("emotion-"));
  classesToRemove.forEach(c => body.classList.remove(c));
  body.classList.add(`emotion-${emotion}`);

  emotionPills.forEach(p => p.classList.toggle("active", p.dataset.emotion === emotion));
  localStorage.setItem("layla_emotion", emotion);

  const statusMap = {
    professional: "Modo Profesional // Precisa y ejecutiva",
    loving: "Modo Amorosa // Con cariño y ternura",
    philosopher: "Modo Filósofa // Sabia y existencial",
    funny: "Modo Chistosa // Humor e ingenio",
    toxic: "Modo Sin Filtros // Cero paciencia y directa",
    advisor: "Modo Consejera // Tu mejor amiga con consejos reales",
    dramatic: "Modo Dramática // Todo es un evento épico 🎭"
  };
  waveStatusText.innerText = statusMap[emotion] || "Layla activa";
}

emotionPills.forEach(pill => {
  pill.addEventListener("click", () => {
    applyEmotion(pill.dataset.emotion);
  });
});

// -------------------------------------------------------
// VOICE TOGGLE
// -------------------------------------------------------
waveToggleBtn.addEventListener("click", () => {
  isVoiceActive = !isVoiceActive;
  localStorage.setItem("layla_voice_active", isVoiceActive);
  updateVoiceToggleUI();
  if (!isVoiceActive) {
    audioPlayer.pause();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }
});

function updateVoiceToggleUI() {
  waveToggleBtn.classList.toggle("active", isVoiceActive);
  waveToggleBtn.querySelector(".wave-label").innerText = isVoiceActive ? "Voz Activa" : "Silencio";
  soundwaveBar.classList.toggle("hidden", !isVoiceActive);
}

// -------------------------------------------------------
// USER AUTHENTICATION
// -------------------------------------------------------
function updateUserUI() {
  document.getElementById("sidebarName").innerText = currentUser.name;
  document.getElementById("sidebarAvatar").innerText = currentUser.avatar || currentUser.name.charAt(0).toUpperCase();
  document.getElementById("sidebarStatus").innerText = currentUser.is_creator ? "Fundador" : "Activo";
}

function openAuthModal() { authModal.classList.add("active"); }
function closeAuthModal() { authModal.classList.remove("active"); }

document.getElementById("headerAuthBtn").addEventListener("click", openAuthModal);
document.getElementById("userProfileBtn").addEventListener("click", openAuthModal);

// -------------------------------------------------------
// PANEL SECRETO DE VOZ — doble clic en la "L" del modal
// -------------------------------------------------------
let activeVoiceId = localStorage.getItem("layla_voice_id") || "pN4aFdNIp2mvGfTwy1Oj";
let secretTapCount = 0;
let secretTapTimer = null;

document.getElementById("secretVoiceBtn").addEventListener("click", () => {
  secretTapCount++;
  if (secretTapTimer) clearTimeout(secretTapTimer);
  secretTapTimer = setTimeout(() => { secretTapCount = 0; }, 600);

  if (secretTapCount >= 2) {
    secretTapCount = 0;
    const panel = document.getElementById("secretVoicePanel");
    panel.style.display = panel.style.display === "none" ? "block" : "none";
    updateVoiceActiveLabel();
  }
});

function updateVoiceActiveLabel() {
  const label = document.getElementById("voiceActiveLabel");
  if (label) label.innerText = "Voz activa: " + activeVoiceId;
  // Marcar botón activo
  document.querySelectorAll(".voice-opt-btn").forEach(btn => btn.classList.remove("active"));
}

function setVoice(voiceId, btn) {
  activeVoiceId = voiceId;
  localStorage.setItem("layla_voice_id", voiceId);
  // Notificar al servidor
  fetch("/api/set-voice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ voice_id: voiceId })
  }).catch(() => {});
  document.querySelectorAll(".voice-opt-btn").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  updateVoiceActiveLabel();
  alert("✅ Voz cambiada. Se aplica en el próximo mensaje.");
}

function setCustomVoice() {
  const input = document.getElementById("customVoiceInput");
  const val = input.value.trim();
  if (!val) { alert("Pega un Voice ID válido de ElevenLabs."); return; }
  setVoice(val, null);
  input.value = "";
}

function loginSocial(provider) {
  const name = prompt(`Ingresa tu nombre o usuario para continuar con ${provider}:`, "Usuario");
  if (name && name.trim()) {
    const isGerardo = name.toLowerCase().includes("gerardo");
    currentUser = {
      name: isGerardo ? "Gerardo" : name.trim(),
      is_creator: isGerardo,
      avatar: name.trim().charAt(0).toUpperCase()
    };
    localStorage.setItem("layla_user", JSON.stringify(currentUser));
    updateUserUI();
    closeAuthModal();
  }
}

function loginGuest() {
  currentUser = { name: "Invitado", is_creator: false, avatar: "I" };
  localStorage.setItem("layla_user", JSON.stringify(currentUser));
  updateUserUI();
  closeAuthModal();
}

// -------------------------------------------------------
// SIDEBAR & CHAT ACTIONS
// -------------------------------------------------------
toggleSidebarBtn.addEventListener("click", () => {
  sidebar.classList.toggle("collapsed");
  sidebar.classList.toggle("mobile-open");
});

newChatBtn.addEventListener("click", () => {
  conversationHistory = [];
  currentSessionTitle = null;
  messagesFeed.innerHTML = "";
  heroWelcome.style.display = "flex";
  userInput.value = "";
  userInput.focus();
  if (window.innerWidth <= 768) sidebar.classList.remove("mobile-open");
});

// Eliminar conversación actual
const clearChatBtnEl = document.getElementById("clearChatBtn");
if (clearChatBtnEl) {
  clearChatBtnEl.addEventListener("click", () => {
  if (conversationHistory.length === 0) return;
  if (!confirm("¿Eliminar esta conversación? No se puede recuperar.")) return;

  // Quitar la entrada del historial que corresponde a esta sesión
  if (currentSessionTitle !== null) {
    const list = document.getElementById("historyList");
    const items = list.querySelectorAll(".history-item");
    items.forEach(item => {
      if (item.innerText === currentSessionTitle) item.remove();
    });
  }

  conversationHistory = [];
  currentSessionTitle = null;
  messagesFeed.innerHTML = "";
  heroWelcome.style.display = "flex";
  userInput.value = "";
  if (window.innerWidth <= 768) sidebar.classList.remove("mobile-open");
  });
}

function quickAsk(text) {
  userInput.value = text;
  sendMessage();
}

function setupTextarea() {
  userInput.addEventListener("input", () => {
    userInput.style.height = "auto";
    userInput.style.height = Math.min(userInput.scrollHeight, 180) + "px";
  });
  userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
}

// -------------------------------------------------------
// LIVING SOUNDWAVES (GEMINI LIVE STYLE)
// -------------------------------------------------------
const wCtx = liveWaveCanvas.getContext("2d");
let isAudioPlaying = false;
let isMicListening = false;
let wavePhase = 0;

function initSoundwaves() {
  function render() {
    wCtx.clearRect(0, 0, liveWaveCanvas.width, liveWaveCanvas.height);
    const computed = getComputedStyle(document.body);
    const waveColor = computed.getPropertyValue("--emotion-color").trim() || "#00d2ff";
    const width = liveWaveCanvas.width;
    const height = liveWaveCanvas.height;
    const midY = height / 2;
    const amplitude = isAudioPlaying ? 14 : (isMicListening ? 18 : 3.5);
    const speed = isAudioPlaying ? 0.12 : (isMicListening ? 0.16 : 0.03);
    wavePhase += speed;
    wCtx.lineWidth = 2.5;
    wCtx.strokeStyle = waveColor;
    wCtx.shadowBlur = 10;
    wCtx.shadowColor = waveColor;
    wCtx.beginPath();
    for (let x = 0; x < width; x++) {
      const y = midY + Math.sin(x * 0.04 + wavePhase) * amplitude * Math.sin(x * 0.01);
      if (x === 0) wCtx.moveTo(x, y);
      else wCtx.lineTo(x, y);
    }
    wCtx.stroke();
    wCtx.lineWidth = 1.2;
    wCtx.beginPath();
    for (let x = 0; x < width; x++) {
      const y = midY + Math.cos(x * 0.06 - wavePhase * 1.2) * (amplitude * 0.6) * Math.sin(x * 0.015);
      if (x === 0) wCtx.moveTo(x, y);
      else wCtx.lineTo(x, y);
    }
    wCtx.stroke();
    requestAnimationFrame(render);
  }
  render();
}

// -------------------------------------------------------
// FOTOS: SUBIR ARCHIVO + TOMAR CON CÁMARA
// -------------------------------------------------------
let currentPhotoBase64 = null;
let currentPhotoMime = "image/jpeg";

const photoInput = document.getElementById("photoInput");
const cameraInput = document.getElementById("cameraInput");
const uploadPhotoBtn = document.getElementById("uploadPhotoBtn");
const cameraBtn = document.getElementById("cameraBtn");
const photoPreviewBox = document.getElementById("photoPreviewBox");
const photoPreviewImg = document.getElementById("photoPreviewImg");
const photoFileName = document.getElementById("photoFileName");
const removePhotoBtn = document.getElementById("removePhotoBtn");

uploadPhotoBtn.addEventListener("click", () => { photoInput.click(); });

// Cámara: captura directo
function setupCameraBtn() {
  if (cameraBtn && cameraInput) {
    cameraBtn.addEventListener("click", () => { cameraInput.click(); });
    cameraInput.addEventListener("change", handlePhotoFile);
  }
}

photoInput.addEventListener("change", handlePhotoFile);

function handlePhotoFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  currentPhotoMime = file.type || "image/jpeg";
  photoFileName.innerText = file.name;
  const reader = new FileReader();
  reader.onload = (ev) => {
    currentPhotoBase64 = ev.target.result;
    photoPreviewImg.src = currentPhotoBase64;
    photoPreviewBox.style.display = "flex";
  };
  reader.readAsDataURL(file);
}

removePhotoBtn.addEventListener("click", () => { clearAttachedPhoto(); });

function clearAttachedPhoto() {
  currentPhotoBase64 = null;
  photoPreviewBox.style.display = "none";
  photoPreviewImg.src = "";
  photoInput.value = "";
  if (cameraInput) cameraInput.value = "";
}
sendBtn.addEventListener("click", sendMessage);

async function sendMessage() {
  const text = userInput.value.trim();
  const photoToSend = currentPhotoBase64;
  const mimeToSend = currentPhotoMime;

  if (!text && !photoToSend) return;

  userInput.value = "";
  userInput.style.height = "auto";
  heroWelcome.style.display = "none";

  appendUserMessage(text || "Analiza esta foto de mi tarea y resuélvela", photoToSend);
  conversationHistory.push({ role: "user", text: text || "[Foto de tarea adjunta]" });
  clearAttachedPhoto();

  const placeholderId = appendThinkingPlaceholder();
  chatStream.scrollTop = chatStream.scrollHeight;

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        history: conversationHistory,
        user: currentUser,
        emotion: currentEmotion,
        image_data: photoToSend,
        image_mime: mimeToSend
      })
    });

    if (!res.ok) throw new Error(`Estado ${res.status}`);
    const data = await res.json();
    removeThinkingPlaceholder(placeholderId);
    appendAssistantMessage(data.reply, data.image_url);
    conversationHistory.push({ role: "model", text: data.reply });

    if (isVoiceActive) playElevenLabsTTS(data.reply);

    // FIX HISTORIAL: solo una entrada por conversación
    updateSessionHistory(text || "Consulta con foto");

    // Guardar en Firebase si está disponible
    if (window._laylaFirebase && conversationHistory.length >= 2) {
      window._laylaFirebase.saveConversation(
        currentSessionTitle || "Conversación",
        conversationHistory
      );
    }

  } catch (err) {
    removeThinkingPlaceholder(placeholderId);
    appendAssistantMessage(`Error: ${err.message}`);
  }

  chatStream.scrollTop = chatStream.scrollHeight;
}

// -------------------------------------------------------
// HISTORIAL: una entrada por conversación (no por mensaje)
// -------------------------------------------------------
function updateSessionHistory(firstText) {
  // Si ya hay título para esta sesión, no agregar nada más
  if (currentSessionTitle !== null) return;

  currentSessionTitle = firstText.length > 26 ? firstText.substring(0, 26) + "..." : firstText;

  const list = document.getElementById("historyList");
  const item = document.createElement("div");
  item.className = "history-item";
  item.innerText = currentSessionTitle;
  item.onclick = () => {
    // Al hacer click en historial solo enfoca el input (la conversación ya está en pantalla)
    userInput.focus();
  };
  list.prepend(item);
}

// -------------------------------------------------------
// ELEVENLABS TTS
// -------------------------------------------------------
async function playElevenLabsTTS(text) {
  if (!isVoiceActive) return;
  const clean = text.replace(/\[IMAGE_PROMPT:.*?\]/g, '').replace(/[*_#`]/g, '').trim();
  if (!clean) return;

  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: clean })
    });
    if (!res.ok) throw new Error("TTS error");
    const blob = await res.blob();
    const audioUrl = URL.createObjectURL(blob);
    audioPlayer.src = audioUrl;
    audioPlayer.onplay = () => { isAudioPlaying = true; };
    audioPlayer.onended = () => { isAudioPlaying = false; };
    audioPlayer.onerror = () => { isAudioPlaying = false; fallbackTTS(clean); };
    audioPlayer.play().catch(() => fallbackTTS(clean));
  } catch (e) {
    fallbackTTS(clean);
  }
}

function fallbackTTS(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "es-PE";
    utt.rate = 1.0;
    utt.onstart = () => { isAudioPlaying = true; };
    utt.onend = () => { isAudioPlaying = false; };
    window.speechSynthesis.speak(utt);
  }
}

// -------------------------------------------------------
// MESSAGE RENDERING
// -------------------------------------------------------
function appendUserMessage(text, photoUrl = null) {
  const row = document.createElement("div");
  row.className = "msg-row user";
  const bubble = document.createElement("div");
  bubble.className = "user-bubble";
  if (photoUrl) {
    const img = document.createElement("img");
    img.src = photoUrl;
    img.className = "user-attached-img";
    img.alt = "Foto adjunta";
    bubble.appendChild(img);
  }
  if (text) {
    const txt = document.createElement("div");
    txt.innerText = text;
    bubble.appendChild(txt);
  }
  row.appendChild(bubble);
  messagesFeed.appendChild(row);
}

function appendAssistantMessage(text, imageUrl = null) {
  const row = document.createElement("div");
  row.className = "msg-row assistant";
  const orb = document.createElement("div");
  orb.className = "assistant-orb";
  orb.innerText = "L";
  const wrapper = document.createElement("div");
  wrapper.className = "msg-content-wrapper";
  const textEl = document.createElement("div");
  textEl.className = "assistant-text";
  textEl.innerText = text;
  wrapper.appendChild(textEl);

  if (imageUrl) {
    const card4D = document.createElement("div");
    card4D.className = "chat-4d-card";
    const innerCard = document.createElement("div");
    innerCard.className = "inner-4d-card";
    const img = document.createElement("img");
    img.src = imageUrl;
    img.alt = "Render 4D";
    img.onclick = () => openImageModal(imageUrl);
    const bar = document.createElement("div");
    bar.className = "card-4d-bar";
    bar.innerHTML = `<span>🌌 Render 4D Holográfico</span><a href="${imageUrl}" target="_blank" download="layla-4d.jpg" class="action-chip">⬇ Descargar</a>`;
    innerCard.appendChild(img);
    innerCard.appendChild(bar);
    card4D.appendChild(innerCard);
    wrapper.appendChild(card4D);
    attach4DTilt(innerCard);
  }

  const actions = document.createElement("div");
  actions.className = "msg-actions";
  const copyChip = document.createElement("button");
  copyChip.className = "action-chip";
  copyChip.innerHTML = "📋 Copiar";
  copyChip.onclick = () => {
    navigator.clipboard.writeText(text);
    copyChip.innerHTML = "✓ Copiado";
    setTimeout(() => { copyChip.innerHTML = "📋 Copiar"; }, 2000);
  };
  const speakChip = document.createElement("button");
  speakChip.className = "action-chip";
  speakChip.innerHTML = "🔊 Escuchar";
  speakChip.onclick = () => playElevenLabsTTS(text);
  actions.appendChild(copyChip);
  actions.appendChild(speakChip);
  wrapper.appendChild(actions);

  row.appendChild(orb);
  row.appendChild(wrapper);
  messagesFeed.appendChild(row);
}

function appendThinkingPlaceholder() {
  const id = "placeholder-" + Date.now();
  const row = document.createElement("div");
  row.className = "msg-row assistant";
  row.id = id;
  const orb = document.createElement("div");
  orb.className = "assistant-orb";
  orb.innerText = "L";
  const wrapper = document.createElement("div");
  wrapper.className = "msg-content-wrapper";
  const textEl = document.createElement("div");
  textEl.className = "assistant-text thinking-dots";
  textEl.style.color = "var(--text-dim)";
  textEl.innerText = "Layla procesando...";
  wrapper.appendChild(textEl);
  row.appendChild(orb);
  row.appendChild(wrapper);
  messagesFeed.appendChild(row);
  return id;
}

function removeThinkingPlaceholder(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

// -------------------------------------------------------
// 4D PARALLAX
// -------------------------------------------------------
function setup4DParallax() {
  attach4DTilt(modal4DCard);
  if (window.DeviceOrientationEvent) {
    window.addEventListener("deviceorientation", (e) => {
      if (imageModal.classList.contains("active")) {
        const tiltX = Math.min(Math.max(e.gamma || 0, -25), 25);
        const tiltY = Math.min(Math.max((e.beta || 0) - 45, -25), 25);
        modal4DCard.style.transform = `rotateX(${-tiltY}deg) rotateY(${tiltX}deg) scale(1.02)`;
      }
    });
  }
}

function attach4DTilt(element) {
  if (!element) return;
  element.addEventListener("mousemove", (e) => {
    const rect = element.getBoundingClientRect();
    const rotateX = (((e.clientY - rect.top) / rect.height) - 0.5) * -24;
    const rotateY = (((e.clientX - rect.left) / rect.width) - 0.5) * 24;
    element.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;
  });
  element.addEventListener("mouseleave", () => {
    element.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)";
  });
}

function openImageModal(url) {
  modalImg.src = url;
  downloadImgBtn.href = url;
  imageModal.classList.add("active");
}

function closeImageModal() {
  imageModal.classList.remove("active");
}

// -------------------------------------------------------
// IMAGE SHORTCUT
// -------------------------------------------------------
imageShortcutBtn.addEventListener("click", () => {
  const p = prompt("¿Qué imagen 4D deseas que Layla renderice?:");
  if (p) {
    userInput.value = `Genera una imagen 4D hiperrealista de: ${p}`;
    sendMessage();
  }
});

// -------------------------------------------------------
// MICRÓFONO — FIX COMPLETO (CELULAR + DESKTOP)
// -------------------------------------------------------
let recognition = null;
let micPermissionGranted = false;

// Detectar si estamos en HTTPS o localhost (requerido para micrófono en móvil)
const isSecureContext = window.isSecureContext || 
  location.protocol === "https:" || 
  location.hostname === "localhost" || 
  location.hostname === "127.0.0.1";

async function requestMicPermission() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(t => t.stop());
    micPermissionGranted = true;
    return true;
  } catch (err) {
    micPermissionGranted = false;
    if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
      waveStatusText.innerText = "⚠️ Permite el micrófono en tu navegador";
      alert("Layla necesita permiso de micrófono.\n\n📱 En celular Chrome:\nToca los 3 puntitos → Configuración del sitio → Micrófono → Permitir\n\n💻 En PC:\nHaz clic en el 🔒 de la barra → Permisos → Micrófono → Permitir\n\nLuego recarga e intenta de nuevo.");
    } else if (err.name === "NotFoundError") {
      waveStatusText.innerText = "⚠️ No se encontró micrófono en este dispositivo";
    } else {
      waveStatusText.innerText = "⚠️ Error de micrófono: " + err.name;
    }
    return false;
  }
}

if (!isSecureContext) {
  // En HTTP sin localhost el micrófono NO funciona en móvil
  micBtn.style.opacity = "0.4";
  micBtn.title = "El micrófono requiere HTTPS";
  micBtn.addEventListener("click", () => {
    alert("⚠️ El micrófono solo funciona con HTTPS.\n\nPara usarlo en tu celular necesitas abrir Layla desde una URL https:// o usar cloudflared (túnel HTTPS).\n\nPor ahora puedes escribir tus mensajes normalmente.");
  });
} else if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;

  function createRecognition() {
    const rec = new SpeechRec();
    rec.lang = "es-PE";
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      isMicListening = true;
      micBtn.classList.add("listening");
      userInput.placeholder = "🎙️ Escuchando... habla ahora...";
      waveStatusText.innerText = "🎙️ Escuchando tu voz...";
    };

    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      userInput.value = transcript;
      userInput.style.height = "auto";
      userInput.style.height = Math.min(userInput.scrollHeight, 180) + "px";
      sendMessage();
    };

    rec.onspeechend = () => { rec.stop(); };

    rec.onerror = (e) => {
      isMicListening = false;
      micBtn.classList.remove("listening");
      userInput.placeholder = "Pregunta a Layla, dicta con tu voz o sube tu tarea...";
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        waveStatusText.innerText = "⚠️ Permiso de micrófono denegado";
        alert("Micrófono denegado.\n📱 Celular: 3 puntitos → Config del sitio → Micrófono → Permitir\n💻 PC: 🔒 → Permisos → Micrófono → Permitir\nLuego recarga.");
      } else if (e.error === "no-speech") {
        waveStatusText.innerText = "No escuché nada. Toca 🎙️ y habla claro.";
      } else if (e.error === "network") {
        waveStatusText.innerText = "⚠️ Sin conexión para voz. Revisa internet.";
      } else if (e.error === "aborted") {
        waveStatusText.innerText = "Micrófono detenido.";
      } else {
        waveStatusText.innerText = `Aviso: ${e.error}`;
      }
    };

    rec.onend = () => {
      isMicListening = false;
      micBtn.classList.remove("listening");
      userInput.placeholder = "Pregunta a Layla, dicta con tu voz o sube tu tarea...";
    };

    return rec;
  }

  recognition = createRecognition();

  micBtn.addEventListener("click", async () => {
    if (isMicListening) {
      recognition.stop();
      return;
    }
    if (!micPermissionGranted) {
      const granted = await requestMicPermission();
      if (!granted) return;
    }
    // Recrear recognition en cada uso evita el bug "already started"
    recognition = createRecognition();
    try {
      recognition.start();
    } catch (err) {
      waveStatusText.innerText = "Error al iniciar. Toca de nuevo.";
      isMicListening = false;
      micBtn.classList.remove("listening");
    }
  });

} else {
  micBtn.style.opacity = "0.4";
  micBtn.title = "Voz no soportada. Usa Chrome o Edge.";
  micBtn.addEventListener("click", () => {
    alert("El reconocimiento de voz requiere Google Chrome o Microsoft Edge.");
  });
}

// -------------------------------------------------------
// MODO VOZ EN VIVO (ESTILO CHATGPT ADVANCED VOICE)
// -------------------------------------------------------
const voiceLiveScreen = document.getElementById("voiceLiveScreen");
const voiceOrb = document.getElementById("voiceOrb");
const voiceLiveStatus = document.getElementById("voiceLiveStatus");
const voiceLiveTranscript = document.getElementById("voiceLiveTranscript");
const voiceLiveClose = document.getElementById("voiceLiveClose");
const voiceOrbBtn = document.getElementById("voiceOrbBtn");
const voiceLiveMute = document.getElementById("voiceLiveMute");

let voiceRecognition = null;
let isVoiceLiveActive = false;
let isVoiceMuted = false;

// Abrir pantalla de voz al tocar el micrófono
micBtn.removeEventListener("click", micBtn._clickHandler);
micBtn.addEventListener("click", openVoiceLive);

function openVoiceLive() {
  voiceLiveScreen.classList.add("active");
  isVoiceLiveActive = true;
  voiceLiveTranscript.innerText = "";
  voiceLiveStatus.innerText = "Toca el botón para hablar";
  voiceOrb.className = "voice-orb";
}

// Cerrar pantalla de voz
voiceLiveClose.addEventListener("click", () => {
  voiceLiveScreen.classList.remove("active");
  isVoiceLiveActive = false;
  if (voiceRecognition) voiceRecognition.stop();
  voiceOrb.className = "voice-orb";
  isAudioPlaying = false;
});

// Botón orbe — iniciar/detener escucha
voiceOrbBtn.addEventListener("click", async () => {
  if (!isSecureContext) {
    alert("Necesitas HTTPS para usar el micrófono en el celular.");
    return;
  }

  if (voiceOrbBtn.classList.contains("listening")) {
    if (voiceRecognition) voiceRecognition.stop();
    voiceOrbBtn.classList.remove("listening");
    voiceOrb.className = "voice-orb";
    voiceLiveStatus.innerText = "Toca para hablar";
    return;
  }

  // Pedir permiso
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(t => t.stop());
  } catch (e) {
    voiceLiveStatus.innerText = "⚠️ Permite el micrófono";
    return;
  }

  if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
    voiceLiveStatus.innerText = "⚠️ Usa Chrome para voz";
    return;
  }

  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  voiceRecognition = new SpeechRec();
  voiceRecognition.lang = "es-PE";
  voiceRecognition.continuous = false;
  voiceRecognition.interimResults = true;

  voiceRecognition.onstart = () => {
    voiceOrbBtn.classList.add("listening");
    voiceOrb.className = "voice-orb listening";
    voiceLiveStatus.innerText = "Escuchando...";
    voiceLiveTranscript.innerText = "";
  };

  voiceRecognition.onresult = (e) => {
    let interim = "";
    let final = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) final += e.results[i][0].transcript;
      else interim += e.results[i][0].transcript;
    }
    voiceLiveTranscript.innerText = final || interim;
  };

  voiceRecognition.onend = async () => {
    voiceOrbBtn.classList.remove("listening");
    voiceOrb.className = "voice-orb";

    const transcript = voiceLiveTranscript.innerText.trim();
    if (!transcript) {
      voiceLiveStatus.innerText = "No escuché nada. Toca de nuevo.";
      return;
    }

    voiceLiveStatus.innerText = "Layla pensando...";
    voiceOrb.className = "voice-orb";

    // Enviar a Layla
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: transcript,
          history: conversationHistory,
          user: currentUser,
          emotion: currentEmotion,
          image_data: null,
          image_mime: null
        })
      });

      const data = await res.json();
      conversationHistory.push({ role: "user", text: transcript });
      conversationHistory.push({ role: "model", text: data.reply });
      updateSessionHistory(transcript);

      voiceLiveTranscript.innerText = data.reply;
      voiceLiveStatus.innerText = "Layla respondiendo...";
      voiceOrb.className = "voice-orb speaking";

      // Reproducir voz
      if (!isVoiceMuted) {
        await playElevenLabsTTS(data.reply);
      }

      voiceOrb.className = "voice-orb";
      voiceLiveStatus.innerText = "Toca para hablar";

      // También agregar al chat
      appendUserMessage(transcript);
      appendAssistantMessage(data.reply);
      heroWelcome.style.display = "none";

    } catch (err) {
      voiceLiveStatus.innerText = "Error: " + err.message;
      voiceOrb.className = "voice-orb";
    }
  };

  voiceRecognition.onerror = (e) => {
    voiceOrbBtn.classList.remove("listening");
    voiceOrb.className = "voice-orb";
    if (e.error === "no-speech") {
      voiceLiveStatus.innerText = "No escuché nada. Toca de nuevo.";
    } else {
      voiceLiveStatus.innerText = "Error: " + e.error;
    }
  };

  voiceRecognition.start();
});

// Mutear/desmutear voz
voiceLiveMute.addEventListener("click", () => {
  isVoiceMuted = !isVoiceMuted;
  voiceLiveMute.innerText = isVoiceMuted ? "🔇" : "🔊";
  if (isVoiceMuted) {
    audioPlayer.pause();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }
});

// -------------------------------------------------------
// BOTÓN + MENÚ DE ADJUNTOS
// -------------------------------------------------------
const attachBtn = document.getElementById("attachBtn");
const attachMenu = document.getElementById("attachMenu");
const fileBtn = document.getElementById("fileBtn");
const fileInput = document.getElementById("fileInput");

attachBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  attachMenu.classList.toggle("open");
  attachBtn.classList.toggle("open");
});

document.addEventListener("click", () => {
  attachMenu.classList.remove("open");
  attachBtn.classList.remove("open");
});

attachMenu.addEventListener("click", (e) => e.stopPropagation());

document.getElementById("cameraBtn").addEventListener("click", () => {
  cameraInput.click();
  attachMenu.classList.remove("open");
  attachBtn.classList.remove("open");
});

document.getElementById("uploadPhotoBtn").addEventListener("click", () => {
  photoInput.click();
  attachMenu.classList.remove("open");
  attachBtn.classList.remove("open");
});

fileBtn.addEventListener("click", () => {
  fileInput.click();
  attachMenu.classList.remove("open");
  attachBtn.classList.remove("open");
});

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  photoFileName.innerText = file.name;
  currentPhotoMime = file.type || "application/octet-stream";
  const reader = new FileReader();
  reader.onload = (ev) => {
    currentPhotoBase64 = ev.target.result;
    photoPreviewImg.src = currentPhotoBase64;
    photoPreviewBox.style.display = "flex";
  };
  reader.readAsDataURL(file);
});

// -------------------------------------------------------
// MODO VOZ EN VIVO - ORBE ESTILO CHATGPT
// -------------------------------------------------------
const voiceLiveScreen = document.getElementById("voiceLiveScreen");
const voiceOrb = document.getElementById("voiceOrb");
const voiceOrbBtn = document.getElementById("voiceOrbBtn");
const voiceLiveClose = document.getElementById("voiceLiveClose");
const voiceLiveStatus = document.getElementById("voiceLiveStatus");
const voiceLiveTranscript = document.getElementById("voiceLiveTranscript");
const voiceLiveMute = document.getElementById("voiceLiveMute");

let voiceIsRecording = false;
let voiceIsMuted = false;
let voiceRecognition = null;

// Abrir pantalla de voz al tocar el micrófono
micBtn.addEventListener("click", () => {
  voiceLiveScreen.classList.add("active");
  voiceLiveStatus.innerText = "Toca el micrófono para hablar";
  voiceLiveTranscript.innerText = "";
});

// Cerrar pantalla de voz
voiceLiveClose.addEventListener("click", () => {
  voiceLiveScreen.classList.remove("active");
  stopVoiceRecording();
});

// Botón mute
voiceLiveMute.addEventListener("click", () => {
  voiceIsMuted = !voiceIsMuted;
  voiceLiveMute.innerText = voiceIsMuted ? "🔇" : "🔊";
  if (voiceIsMuted) audioPlayer.pause();
});

// Botón orbe — iniciar/detener grabación
voiceOrbBtn.addEventListener("click", async () => {
  if (voiceIsRecording) {
    stopVoiceRecording();
  } else {
    startVoiceRecording();
  }
});

async function startVoiceRecording() {
  if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
    voiceLiveStatus.innerText = "⚠️ Voz no soportada. Usa Chrome.";
    return;
  }

  // Pedir permiso micrófono
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(t => t.stop());
  } catch (e) {
    voiceLiveStatus.innerText = "⚠️ Permite el micrófono";
    return;
  }

  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  voiceRecognition = new SpeechRec();
  voiceRecognition.lang = "es-PE";
  voiceRecognition.continuous = false;
  voiceRecognition.interimResults = true;

  voiceRecognition.onstart = () => {
    voiceIsRecording = true;
    voiceOrbBtn.classList.add("recording");
    voiceOrbBtn.querySelector(".orb-btn-icon").innerText = "⏹";
    voiceOrb.classList.add("speaking");
    voiceLiveStatus.innerText = "Escuchando...";
  };

  voiceRecognition.onresult = (e) => {
    let interim = "";
    let final = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) {
        final += e.results[i][0].transcript;
      } else {
        interim += e.results[i][0].transcript;
      }
    }
    voiceLiveTranscript.innerText = final || interim;
    if (final) {
      sendVoiceMessage(final);
    }
  };

  voiceRecognition.onerror = (e) => {
    stopVoiceRecording();
    if (e.error === "not-allowed") {
      voiceLiveStatus.innerText = "⚠️ Permiso de micrófono denegado";
    } else if (e.error === "no-speech") {
      voiceLiveStatus.innerText = "No escuché nada. Toca de nuevo.";
    } else {
      voiceLiveStatus.innerText = `Error: ${e.error}`;
    }
  };

  voiceRecognition.onend = () => {
    stopVoiceRecording();
  };

  voiceRecognition.start();
}

function stopVoiceRecording() {
  voiceIsRecording = false;
  voiceOrbBtn.classList.remove("recording");
  voiceOrbBtn.querySelector(".orb-btn-icon").innerText = "🎙️";
  voiceOrb.classList.remove("speaking");
  voiceLiveStatus.innerText = "Toca para hablar";
  if (voiceRecognition) {
    try { voiceRecognition.stop(); } catch(e) {}
    voiceRecognition = null;
  }
}

async function sendVoiceMessage(text) {
  voiceLiveStatus.innerText = "Layla pensando...";
  voiceOrb.classList.add("speaking");
  voiceLiveTranscript.innerText = text;

  // Cerrar la pantalla de voz y enviar el mensaje al chat
  heroWelcome.style.display = "none";
  appendUserMessage(text, null);
  conversationHistory.push({ role: "user", text });

  const placeholderId = appendThinkingPlaceholder();

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        history: conversationHistory,
        user: currentUser,
        emotion: currentEmotion
      })
    });

    const data = await res.json();
    removeThinkingPlaceholder(placeholderId);
    appendAssistantMessage(data.reply, null);
    conversationHistory.push({ role: "model", text: data.reply });
    updateSessionHistory(text);

    voiceLiveTranscript.innerText = data.reply;
    voiceLiveStatus.innerText = "Layla respondió ✓";

    // Reproducir voz de respuesta
    if (!voiceIsMuted) {
      playElevenLabsTTS(data.reply);
      voiceOrb.classList.add("speaking");
      audioPlayer.onended = () => {
        voiceOrb.classList.remove("speaking");
        voiceLiveStatus.innerText = "Toca para hablar";
      };
    } else {
      voiceOrb.classList.remove("speaking");
    }

  } catch (err) {
    removeThinkingPlaceholder(placeholderId);
    voiceLiveStatus.innerText = "Error al responder";
    voiceOrb.classList.remove("speaking");
  }

  chatStream.scrollTop = chatStream.scrollHeight;
}

// -------------------------------------------------------
// DESLIZAR SIDEBAR (SWIPE) EN MÓVIL
// -------------------------------------------------------
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener("touchstart", (e) => {
  touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

document.addEventListener("touchend", (e) => {
  touchEndX = e.changedTouches[0].screenX;
  const diff = touchEndX - touchStartX;

  // Deslizar derecha desde el borde izquierdo → abrir sidebar
  if (touchStartX < 30 && diff > 60) {
    sidebar.classList.add("mobile-open");
    sidebar.classList.remove("collapsed");
  }

  // Deslizar izquierda → cerrar sidebar
  if (diff < -60 && sidebar.classList.contains("mobile-open")) {
    sidebar.classList.remove("mobile-open");
  }
}, { passive: true });
