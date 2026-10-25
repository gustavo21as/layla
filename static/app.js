// =======================================================
// LAYLA AI 4.1 QUANTUM - CONTROLLER
// =======================================================

let currentUser = JSON.parse(localStorage.getItem("layla_user") || '{"name":"Gerardo","is_creator":true,"avatar":"G"}');
let currentEmotion = localStorage.getItem("layla_emotion") || "professional";
let currentTheme = localStorage.getItem("layla_theme") || "dark";
let isVoiceActive = localStorage.getItem("layla_voice_active") !== "false";
let conversationHistory = [];
let currentSessionTitle = null;
let currentPhotoBase64 = null;
let currentPhotoMime = "image/jpeg";
let isAudioPlaying = false;
let isMicListening = false;
let wavePhase = 0;
let activeVoiceId = localStorage.getItem("layla_voice_id") || "eZxqQzb5CuYo3Kl6EXfZ";
let secretTapCount = 0;
let secretTapTimer = null;

// DOM
const chatStream = document.getElementById("chatStream");
const heroWelcome = document.getElementById("heroWelcome");
const messagesFeed = document.getElementById("messagesFeed");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const micBtn = document.getElementById("micBtn");
const newChatBtn = document.getElementById("newChatBtn");
const toggleSidebarBtn = document.getElementById("toggleSidebarBtn");
const sidebar = document.getElementById("sidebar");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const soundwaveBar = document.getElementById("soundwaveBar");
const waveToggleBtn = document.getElementById("waveToggleBtn");
const waveStatusText = document.getElementById("waveStatusText");
const liveWaveCanvas = document.getElementById("liveWaveCanvas");
const audioPlayer = document.getElementById("audioPlayer");
const authModal = document.getElementById("authModal");
const imageModal = document.getElementById("imageModal");
const modalImg = document.getElementById("modalImg");
const downloadImgBtn = document.getElementById("downloadImgBtn");
const modal4DCard = document.getElementById("modal4DCard");
const photoInput = document.getElementById("photoInput");
const cameraInput = document.getElementById("cameraInput");
const fileInput = document.getElementById("fileInput");
const photoPreviewBox = document.getElementById("photoPreviewBox");
const photoPreviewImg = document.getElementById("photoPreviewImg");
const photoFileName = document.getElementById("photoFileName");
const removePhotoBtn = document.getElementById("removePhotoBtn");
const attachBtn = document.getElementById("attachBtn");
const attachMenu = document.getElementById("attachMenu");
const emotionPills = document.querySelectorAll(".pill-emotion");

// INIT
window.addEventListener("DOMContentLoaded", () => {
  applyTheme(currentTheme);
  applyEmotion(currentEmotion);
  updateVoiceToggleUI();
  updateUserUI();
  initSoundwaves();
  setupTextarea();
  setup4DParallax();
  setupAttachMenu();
  setupSwipeSidebar();
});

// -------------------------------------------------------
// TEMA
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

// -------------------------------------------------------
// EMOCIÓN
// -------------------------------------------------------
function applyEmotion(emotion) {
  currentEmotion = emotion;
  const body = document.body;
  [...body.classList].filter(c => c.startsWith("emotion-")).forEach(c => body.classList.remove(c));
  body.classList.add(`emotion-${emotion}`);
  emotionPills.forEach(p => p.classList.toggle("active", p.dataset.emotion === emotion));
  localStorage.setItem("layla_emotion", emotion);
  const statusMap = {
    professional: "Modo Profesional",
    loving: "Modo Amorosa",
    philosopher: "Modo Filósofa",
    funny: "Modo Chistosa",
    toxic: "Modo Sin Filtros",
    advisor: "Modo Consejera",
    dramatic: "Modo Dramática"
  };
  waveStatusText.innerText = statusMap[emotion] || "Layla activa";
}

emotionPills.forEach(pill => {
  pill.addEventListener("click", () => applyEmotion(pill.dataset.emotion));
});

// -------------------------------------------------------
// VOZ TOGGLE
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
// USUARIO
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

// Panel secreto de voz — doble tap en la L
document.getElementById("secretVoiceBtn").addEventListener("click", () => {
  secretTapCount++;
  if (secretTapTimer) clearTimeout(secretTapTimer);
  secretTapTimer = setTimeout(() => { secretTapCount = 0; }, 600);
  if (secretTapCount >= 2) {
    secretTapCount = 0;
    const panel = document.getElementById("secretVoicePanel");
    panel.style.display = panel.style.display === "none" ? "block" : "none";
    const label = document.getElementById("voiceActiveLabel");
    if (label) label.innerText = "Voz activa: " + activeVoiceId;
  }
});

function setVoice(voiceId, btn) {
  activeVoiceId = voiceId;
  localStorage.setItem("layla_voice_id", voiceId);
  fetch("/api/set-voice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ voice_id: voiceId })
  }).catch(() => {});
  document.querySelectorAll(".voice-opt-btn").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  const label = document.getElementById("voiceActiveLabel");
  if (label) label.innerText = "Voz activa: " + activeVoiceId;
  alert("✅ Voz cambiada.");
}

function setCustomVoice() {
  const input = document.getElementById("customVoiceInput");
  const val = input.value.trim();
  if (!val) return;
  setVoice(val, null);
  input.value = "";
}

function loginSocial(provider) {
  const name = prompt(`Nombre para continuar con ${provider}:`, "Usuario");
  if (name && name.trim()) {
    const isGerardo = name.toLowerCase().includes("gerardo");
    currentUser = { name: isGerardo ? "Gerardo" : name.trim(), is_creator: isGerardo, avatar: name.trim().charAt(0).toUpperCase() };
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
// SIDEBAR
// -------------------------------------------------------
toggleSidebarBtn.addEventListener("click", () => {
  sidebar.classList.toggle("collapsed");
  sidebar.classList.toggle("mobile-open");
  const overlay = document.getElementById("sidebarOverlay");
  if (overlay) overlay.classList.toggle("active", sidebar.classList.contains("mobile-open"));
});

newChatBtn.addEventListener("click", () => {
  conversationHistory = [];
  currentSessionTitle = null;
  messagesFeed.innerHTML = "";
  heroWelcome.style.display = "flex";
  userInput.value = "";
  userInput.focus();
  closeSidebar();
});

function closeSidebar() {
  if (window.innerWidth <= 768) {
    sidebar.classList.remove("mobile-open");
    const overlay = document.getElementById("sidebarOverlay");
    if (overlay) overlay.classList.remove("active");
  }
}

function setupSwipeSidebar() {
  // Crear overlay
  let overlay = document.getElementById("sidebarOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "sidebarOverlay";
    overlay.className = "sidebar-overlay";
    document.body.appendChild(overlay);
  }
  overlay.addEventListener("click", closeSidebar);

  // Swipe
  let touchStartX = 0;
  let touchStartY = 0;

  document.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY);
    if (dy > 60) return; // movimiento vertical, ignorar
    if (dx > 60 && touchStartX < 30) {
      // Swipe derecha desde el borde → abrir sidebar
      sidebar.classList.add("mobile-open");
      overlay.classList.add("active");
    } else if (dx < -60 && sidebar.classList.contains("mobile-open")) {
      // Swipe izquierda → cerrar sidebar
      closeSidebar();
    }
  }, { passive: true });
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
// SOUNDWAVES
// -------------------------------------------------------
const wCtx = liveWaveCanvas.getContext("2d");

function initSoundwaves() {
  function render() {
    wCtx.clearRect(0, 0, liveWaveCanvas.width, liveWaveCanvas.height);
    const waveColor = getComputedStyle(document.body).getPropertyValue("--emotion-color").trim() || "#00d2ff";
    const midY = liveWaveCanvas.height / 2;
    const amplitude = isAudioPlaying ? 14 : (isMicListening ? 18 : 3.5);
    const speed = isAudioPlaying ? 0.12 : (isMicListening ? 0.16 : 0.03);
    wavePhase += speed;
    wCtx.lineWidth = 2.5;
    wCtx.strokeStyle = waveColor;
    wCtx.shadowBlur = 10;
    wCtx.shadowColor = waveColor;
    wCtx.beginPath();
    for (let x = 0; x < liveWaveCanvas.width; x++) {
      const y = midY + Math.sin(x * 0.04 + wavePhase) * amplitude * Math.sin(x * 0.01);
      if (x === 0) wCtx.moveTo(x, y); else wCtx.lineTo(x, y);
    }
    wCtx.stroke();
    requestAnimationFrame(render);
  }
  render();
}

// -------------------------------------------------------
// ADJUNTOS (BOTÓN +)
// -------------------------------------------------------
function setupAttachMenu() {
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

  document.getElementById("fileBtn").addEventListener("click", () => {
    fileInput.click();
    attachMenu.classList.remove("open");
    attachBtn.classList.remove("open");
  });

  photoInput.addEventListener("change", handlePhotoFile);
  cameraInput.addEventListener("change", handlePhotoFile);
  fileInput.addEventListener("change", handlePhotoFile);
  removePhotoBtn.addEventListener("click", clearAttachedPhoto);
}

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

function clearAttachedPhoto() {
  currentPhotoBase64 = null;
  photoPreviewBox.style.display = "none";
  photoPreviewImg.src = "";
  photoInput.value = "";
  if (cameraInput) cameraInput.value = "";
  if (fileInput) fileInput.value = "";
}

// -------------------------------------------------------
// ENVIAR MENSAJE
// -------------------------------------------------------
sendBtn.addEventListener("click", sendMessage);

async function sendMessage() {
  const text = userInput.value.trim();
  const photoToSend = currentPhotoBase64;
  const mimeToSend = currentPhotoMime;
  if (!text && !photoToSend) return;

  userInput.value = "";
  userInput.style.height = "auto";
  heroWelcome.style.display = "none";

  appendUserMessage(text || "Analiza esta foto", photoToSend);
  conversationHistory.push({ role: "user", text: text || "[Foto adjunta]" });
  clearAttachedPhoto();

  const placeholderId = appendThinkingPlaceholder();
  chatStream.scrollTop = chatStream.scrollHeight;

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, history: conversationHistory, user: currentUser, emotion: currentEmotion, image_data: photoToSend, image_mime: mimeToSend })
    });
    if (!res.ok) throw new Error(`Error ${res.status}`);
    const data = await res.json();
    removeThinkingPlaceholder(placeholderId);
    appendAssistantMessage(data.reply, data.image_url);
    conversationHistory.push({ role: "model", text: data.reply });
    if (isVoiceActive) playElevenLabsTTS(data.reply);
    updateSessionHistory(text || "Consulta con foto");
    if (window._laylaFirebase && conversationHistory.length >= 2) {
      window._laylaFirebase.saveConversation(currentSessionTitle || "Conversación", conversationHistory);
    }
  } catch (err) {
    removeThinkingPlaceholder(placeholderId);
    appendAssistantMessage(`Error: ${err.message}`);
  }
  chatStream.scrollTop = chatStream.scrollHeight;
}

function updateSessionHistory(firstText) {
  if (currentSessionTitle !== null) return;
  currentSessionTitle = firstText.length > 26 ? firstText.substring(0, 26) + "..." : firstText;
  const list = document.getElementById("historyList");
  const item = document.createElement("div");
  item.className = "history-item";
  item.innerText = currentSessionTitle;

  // Toque largo para eliminar en móvil
  let pressTimer = null;
  item.addEventListener("touchstart", () => {
    pressTimer = setTimeout(() => {
      if (confirm(`¿Eliminar conversación?\n"${currentSessionTitle}"`)) {
        item.remove();
        conversationHistory = [];
        currentSessionTitle = null;
        messagesFeed.innerHTML = "";
        heroWelcome.style.display = "flex";
      }
    }, 600);
  });
  item.addEventListener("touchend", () => clearTimeout(pressTimer));
  item.addEventListener("touchmove", () => clearTimeout(pressTimer));
  item.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    if (confirm(`¿Eliminar conversación?\n"${currentSessionTitle}"`)) {
      item.remove();
      conversationHistory = [];
      currentSessionTitle = null;
      messagesFeed.innerHTML = "";
      heroWelcome.style.display = "flex";
    }
  });

  list.prepend(item);
}

// -------------------------------------------------------
// TTS ELEVENLABS
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
  } catch (e) { fallbackTTS(clean); }
}

function fallbackTTS(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "es-PE";
    utt.onstart = () => { isAudioPlaying = true; };
    utt.onend = () => { isAudioPlaying = false; };
    window.speechSynthesis.speak(utt);
  }
}

// -------------------------------------------------------
// RENDERIZAR MENSAJES
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
  textEl.className = "assistant-text";
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
  if (modal4DCard) attach4DTilt(modal4DCard);
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
  if (modalImg) modalImg.src = url;
  if (downloadImgBtn) downloadImgBtn.href = url;
  if (imageModal) imageModal.classList.add("active");
}

function closeImageModal() {
  if (imageModal) imageModal.classList.remove("active");
}

// -------------------------------------------------------
// MODO VOZ EN VIVO (ORBE ESTILO CHATGPT)
// -------------------------------------------------------
const voiceLiveScreen = document.getElementById("voiceLiveScreen");
const voiceOrb = document.getElementById("voiceOrb");
const voiceLiveStatus = document.getElementById("voiceLiveStatus");
const voiceLiveTranscript = document.getElementById("voiceLiveTranscript");
const voiceLiveClose = document.getElementById("voiceLiveClose");
const voiceOrbBtn = document.getElementById("voiceOrbBtn");
const voiceLiveMute = document.getElementById("voiceLiveMute");

let isVoiceLiveMuted = false;
let voiceRec = null;

// El micrófono abre la pantalla de voz en vivo
micBtn.addEventListener("click", () => {
  voiceLiveScreen.classList.add("active");
  voiceLiveStatus.innerText = "Toca el botón para hablar";
  voiceOrb.className = "voice-orb";
  if (voiceLiveTranscript) voiceLiveTranscript.innerText = "";
});

// Cerrar pantalla de voz
voiceLiveClose.addEventListener("click", () => {
  voiceLiveScreen.classList.remove("active");
  if (voiceRec) { try { voiceRec.stop(); } catch(e) {} }
  voiceOrb.className = "voice-orb";
  isAudioPlaying = false;
});

// Botón orbe — grabar
voiceOrbBtn.addEventListener("click", async () => {
  if (voiceOrbBtn.classList.contains("listening")) {
    if (voiceRec) { try { voiceRec.stop(); } catch(e) {} }
    voiceOrbBtn.classList.remove("listening");
    voiceOrb.className = "voice-orb";
    voiceLiveStatus.innerText = "Toca para hablar";
    return;
  }

  // Pedir permiso micro
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(t => t.stop());
  } catch (e) {
    voiceLiveStatus.innerText = "⚠️ Permite el micrófono primero";
    return;
  }

  if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
    voiceLiveStatus.innerText = "⚠️ Usa Chrome para voz";
    return;
  }

  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  voiceRec = new SpeechRec();
  voiceRec.lang = "es-PE";
  voiceRec.continuous = false;
  voiceRec.interimResults = true;

  voiceRec.onstart = () => {
    voiceOrbBtn.classList.add("listening");
    voiceOrb.className = "voice-orb listening";
    voiceLiveStatus.innerText = "Escuchando...";
    voiceLiveTranscript.innerText = "";
  };

  voiceRec.onresult = (e) => {
    let final = "";
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) final += e.results[i][0].transcript;
      else interim += e.results[i][0].transcript;
    }
    voiceLiveTranscript.innerText = final || interim;
  };

  voiceRec.onend = async () => {
    voiceOrbBtn.classList.remove("listening");
    voiceOrb.className = "voice-orb";
    const transcript = voiceLiveTranscript.innerText.trim();
    if (!transcript) {
      voiceLiveStatus.innerText = "No escuché nada. Toca de nuevo.";
      return;
    }
    voiceLiveStatus.innerText = "Layla pensando...";
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: transcript, history: conversationHistory, user: currentUser, emotion: currentEmotion })
      });
      const data = await res.json();
      conversationHistory.push({ role: "user", text: transcript });
      conversationHistory.push({ role: "model", text: data.reply });
      updateSessionHistory(transcript);
      voiceLiveTranscript.innerText = data.reply;
      voiceLiveStatus.innerText = "Layla respondiendo...";
      voiceOrb.className = "voice-orb speaking";
      appendUserMessage(transcript);
      appendAssistantMessage(data.reply);
      heroWelcome.style.display = "none";
      if (!isVoiceLiveMuted) {
        await playElevenLabsTTS(data.reply);
      }
      voiceOrb.className = "voice-orb";
      voiceLiveStatus.innerText = "Toca para hablar";
    } catch (err) {
      voiceLiveStatus.innerText = "Error al responder";
      voiceOrb.className = "voice-orb";
    }
  };

  voiceRec.onerror = (e) => {
    voiceOrbBtn.classList.remove("listening");
    voiceOrb.className = "voice-orb";
    voiceLiveStatus.innerText = e.error === "no-speech" ? "No escuché nada." : "Error: " + e.error;
  };

  voiceRec.start();
});

// Mutear voz
voiceLiveMute.addEventListener("click", () => {
  isVoiceLiveMuted = !isVoiceLiveMuted;
  voiceLiveMute.innerText = isVoiceLiveMuted ? "🔇" : "🔊";
  if (isVoiceLiveMuted) {
    audioPlayer.pause();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }
});
