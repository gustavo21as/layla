// =======================================================
// LAYLA AI 4.1 QUANTUM - CONTROLLER
// =======================================================

// Variables globales
let currentUser = JSON.parse(localStorage.getItem("layla_user") || '{"name":"Gerardo","is_creator":true,"avatar":"G","uid":"gerardo"}');
let currentEmotion = localStorage.getItem("layla_emotion") || "professional";
let currentTheme = localStorage.getItem("layla_theme") || "dark";
let isVoiceActive = localStorage.getItem("layla_voice_active") !== "false";
let conversationHistory = [];
let currentSessionTitle = null;
let currentPhotoBase64 = null;
let currentPhotoMime = "image/jpeg";
let isAudioPlaying = false;
let wavePhase = 0;
let activeVoiceId = localStorage.getItem("layla_voice_id") || "oJIuRMopN0sojGjwD6rQ";
let secretTapCount = 0;
let secretTapTimer = null;
let isVoiceLiveMuted = false;
let voiceRec = null;

const ELEVEN_API_KEY = "f9ebfddc7848d727dc872fdf0a76f0058cbd91628e0f271cd7d7ab0e337f0424";

// =======================================================
// INIT — esperar DOM
// =======================================================
document.addEventListener("DOMContentLoaded", () => {
  applyTheme(currentTheme);
  applyEmotion(currentEmotion);
  updateVoiceToggleUI();
  updateUserUI();
  initSoundwaves();
  setupTextarea();
  setup4DParallax();
  setupAttachMenu();
  setupSwipeSidebar();
  setupVoiceLive();
});

// =======================================================
// TEMA
// =======================================================
function applyTheme(theme) {
  currentTheme = theme;
  document.body.classList.toggle("theme-dark", theme === "dark");
  document.body.classList.toggle("theme-light", theme === "light");
  const btn = document.getElementById("themeToggleBtn");
  if (btn) btn.innerText = theme === "dark" ? "🌙" : "☀️";
  localStorage.setItem("layla_theme", theme);
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("themeToggleBtn").addEventListener("click", () => {
    applyTheme(currentTheme === "dark" ? "light" : "dark");
  });
});

// =======================================================
// EMOCIÓN
// =======================================================
function applyEmotion(emotion) {
  currentEmotion = emotion;
  [...document.body.classList].filter(c => c.startsWith("emotion-")).forEach(c => document.body.classList.remove(c));
  document.body.classList.add(`emotion-${emotion}`);
  document.querySelectorAll(".pill-emotion").forEach(p => p.classList.toggle("active", p.dataset.emotion === emotion));
  localStorage.setItem("layla_emotion", emotion);
  const statusMap = {
    professional: "Modo Profesional", loving: "Modo Amorosa", philosopher: "Modo Filósofa",
    funny: "Modo Chistosa", toxic: "Modo Sin Filtros", advisor: "Modo Consejera", dramatic: "Modo Dramática"
  };
  const wst = document.getElementById("waveStatusText");
  if (wst) wst.innerText = statusMap[emotion] || "Layla activa";
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".pill-emotion").forEach(pill => {
    pill.addEventListener("click", () => applyEmotion(pill.dataset.emotion));
  });
});

// =======================================================
// VOZ TOGGLE
// =======================================================
function updateVoiceToggleUI() {
  const btn = document.getElementById("waveToggleBtn");
  const bar = document.getElementById("soundwaveBar");
  if (btn) {
    btn.classList.toggle("active", isVoiceActive);
    const lbl = btn.querySelector(".wave-label");
    if (lbl) lbl.innerText = isVoiceActive ? "Voz Activa" : "Silencio";
  }
  if (bar) bar.classList.toggle("hidden", !isVoiceActive);
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("waveToggleBtn").addEventListener("click", () => {
    isVoiceActive = !isVoiceActive;
    localStorage.setItem("layla_voice_active", isVoiceActive);
    updateVoiceToggleUI();
    if (!isVoiceActive) {
      document.getElementById("audioPlayer").pause();
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    }
  });
});

// =======================================================
// USUARIO
// =======================================================
function updateUserUI() {
  const sn = document.getElementById("sidebarName");
  const sa = document.getElementById("sidebarAvatar");
  const ss = document.getElementById("sidebarStatus");
  const hb = document.getElementById("headerAuthBtn");
  if (sn) sn.innerText = currentUser.name;
  if (sa) sa.innerText = currentUser.avatar || currentUser.name.charAt(0).toUpperCase();
  if (ss) ss.innerText = currentUser.is_creator ? "Fundador" : "Activo";
  const isGuest = !currentUser.uid || currentUser.uid === "guest";
  if (hb) {
    if (isGuest) {
      hb.innerText = "Acceder";
      hb.style.cssText = "background:var(--emotion-color);color:#050a14;";
    } else {
      hb.innerText = "⚙️";
      hb.style.cssText = "background:var(--bg-card);color:var(--text-main);border:1px solid var(--border-light);";
    }
  }
}

// =======================================================
// MODAL LOGIN
// =======================================================
function openAuthModal() {
  const modal = document.getElementById("authModal");
  if (!modal) return;
  const isGuest = !currentUser.uid || currentUser.uid === "guest";
  const ls = document.getElementById("loggedSection");
  const li = document.getElementById("loginSection");
  if (ls) ls.style.display = isGuest ? "none" : "block";
  if (li) li.style.display = isGuest ? "flex" : "none";
  if (!isGuest) {
    const ln = document.getElementById("loggedName");
    const le = document.getElementById("loggedEmail");
    if (ln) ln.innerText = currentUser.name;
    if (le) le.innerText = currentUser.email || "";
  }
  modal.classList.add("active");
}

function closeAuthModal() {
  const modal = document.getElementById("authModal");
  if (modal) modal.classList.remove("active");
}

// Exponer para Firebase
window._laylaCloseModal = closeAuthModal;
window._laylaUpdateUser = (u) => { currentUser = u; updateUserUI(); };

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("userProfileBtn").addEventListener("click", openAuthModal);
});

// =======================================================
// PANEL SECRETO VOZ
// =======================================================
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("secretVoiceBtn").addEventListener("click", () => {
    secretTapCount++;
    if (secretTapTimer) clearTimeout(secretTapTimer);
    secretTapTimer = setTimeout(() => { secretTapCount = 0; }, 600);
    if (secretTapCount >= 2) {
      secretTapCount = 0;
      const panel = document.getElementById("secretVoicePanel");
      if (panel) panel.style.display = panel.style.display === "none" ? "block" : "none";
      const label = document.getElementById("voiceActiveLabel");
      if (label) label.innerText = "Voz activa: " + activeVoiceId;
    }
  });
});

function setVoice(voiceId, btn) {
  activeVoiceId = voiceId;
  localStorage.setItem("layla_voice_id", voiceId);
  fetch("/api/set-voice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ voice_id: voiceId }) }).catch(() => {});
  document.querySelectorAll(".voice-opt-btn").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  const label = document.getElementById("voiceActiveLabel");
  if (label) label.innerText = "Voz activa: " + activeVoiceId;
  alert("✅ Voz cambiada a: " + voiceId);
}

function setCustomVoice() {
  const input = document.getElementById("customVoiceInput");
  if (!input || !input.value.trim()) return;
  setVoice(input.value.trim(), null);
  input.value = "";
}

// =======================================================
// LOGIN
// =======================================================
function loginSocial(provider) {
  if (window._laylaFirebase) {
    if (provider === "Google")      { window._laylaFirebase.loginWithGoogle(); return; }
    if (provider === "Facebook")    { window._laylaFirebase.loginWithFacebook(); return; }
    if (provider === "Twitter / X") { window._laylaFirebase.loginWithTwitter(); return; }
  }
  // Fallback simple
  const name = prompt("¿Cómo te llamas?");
  if (!name || !name.trim()) return;
  const isGerardo = name.toLowerCase().includes("gerardo");
  currentUser = { name: isGerardo ? "Gerardo" : name.trim(), is_creator: isGerardo, avatar: name.trim().charAt(0).toUpperCase(), uid: "u_" + Date.now() };
  localStorage.setItem("layla_user", JSON.stringify(currentUser));
  updateUserUI();
  closeAuthModal();
}

function loginGuest() {
  currentUser = { name: "Invitado", is_creator: false, avatar: "I", uid: "guest" };
  localStorage.setItem("layla_user", JSON.stringify(currentUser));
  updateUserUI();
  closeAuthModal();
}

// Logout
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.querySelector(".logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      if (window._laylaFirebase) window._laylaFirebase.logout();
      loginGuest();
    });
  }
});

// =======================================================
// SIDEBAR
// =======================================================
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("toggleSidebarBtn").addEventListener("click", () => {
    const sidebar = document.getElementById("sidebar");
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      sidebar.classList.toggle("mobile-open");
      const overlay = document.getElementById("sidebarOverlay");
      if (overlay) overlay.classList.toggle("active", sidebar.classList.contains("mobile-open"));
    } else {
      sidebar.classList.toggle("collapsed");
    }
  });

  document.getElementById("newChatBtn").addEventListener("click", () => {
    conversationHistory = [];
    currentSessionTitle = null;
    document.getElementById("messagesFeed").innerHTML = "";
    document.getElementById("heroWelcome").style.display = "flex";
    document.getElementById("userInput").value = "";
    document.getElementById("userInput").focus();
    closeSidebar();
  });
});

function closeSidebar() {
  if (window.innerWidth <= 768) {
    const sidebar = document.getElementById("sidebar");
    sidebar.classList.remove("mobile-open");
    const overlay = document.getElementById("sidebarOverlay");
    if (overlay) overlay.classList.remove("active");
  }
}

function setupSwipeSidebar() {
  let overlay = document.getElementById("sidebarOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "sidebarOverlay";
    overlay.className = "sidebar-overlay";
    document.body.appendChild(overlay);
  }
  overlay.addEventListener("click", closeSidebar);

  let touchStartX = 0, touchStartY = 0;
  document.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY);
    if (dy > 60) return;
    const sidebar = document.getElementById("sidebar");
    if (dx > 60 && touchStartX < 30) {
      sidebar.classList.add("mobile-open");
      overlay.classList.add("active");
    } else if (dx < -60 && sidebar.classList.contains("mobile-open")) {
      closeSidebar();
    }
  }, { passive: true });
}

function quickAsk(text) {
  document.getElementById("userInput").value = text;
  sendMessage();
}

function setupTextarea() {
  const input = document.getElementById("userInput");
  input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 180) + "px";
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
}

// =======================================================
// SOUNDWAVES
// =======================================================
function initSoundwaves() {
  const canvas = document.getElementById("liveWaveCanvas");
  if (!canvas) return;
  const wCtx = canvas.getContext("2d");
  function render() {
    wCtx.clearRect(0, 0, canvas.width, canvas.height);
    const waveColor = getComputedStyle(document.body).getPropertyValue("--emotion-color").trim() || "#00d2ff";
    const midY = canvas.height / 2;
    const amplitude = isAudioPlaying ? 14 : 3.5;
    const speed = isAudioPlaying ? 0.12 : 0.03;
    wavePhase += speed;
    wCtx.lineWidth = 2.5;
    wCtx.strokeStyle = waveColor;
    wCtx.shadowBlur = 10;
    wCtx.shadowColor = waveColor;
    wCtx.beginPath();
    for (let x = 0; x < canvas.width; x++) {
      const y = midY + Math.sin(x * 0.04 + wavePhase) * amplitude * Math.sin(x * 0.01);
      if (x === 0) wCtx.moveTo(x, y); else wCtx.lineTo(x, y);
    }
    wCtx.stroke();
    requestAnimationFrame(render);
  }
  render();
}

// =======================================================
// ADJUNTOS
// =======================================================
function setupAttachMenu() {
  const attachBtn = document.getElementById("attachBtn");
  const attachMenu = document.getElementById("attachMenu");
  const photoInput = document.getElementById("photoInput");
  const cameraInput = document.getElementById("cameraInput");
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
  document.getElementById("cameraBtn").addEventListener("click", () => { cameraInput.click(); attachMenu.classList.remove("open"); });
  document.getElementById("uploadPhotoBtn").addEventListener("click", () => { photoInput.click(); attachMenu.classList.remove("open"); });
  document.getElementById("fileBtn").addEventListener("click", () => { fileInput.click(); attachMenu.classList.remove("open"); });
  photoInput.addEventListener("change", handlePhotoFile);
  cameraInput.addEventListener("change", handlePhotoFile);
  fileInput.addEventListener("change", handlePhotoFile);
  document.getElementById("removePhotoBtn").addEventListener("click", clearAttachedPhoto);
}

function handlePhotoFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  currentPhotoMime = file.type || "image/jpeg";
  document.getElementById("photoFileName").innerText = file.name;
  const reader = new FileReader();
  reader.onload = (ev) => {
    currentPhotoBase64 = ev.target.result;
    document.getElementById("photoPreviewImg").src = currentPhotoBase64;
    document.getElementById("photoPreviewBox").style.display = "flex";
  };
  reader.readAsDataURL(file);
}

function clearAttachedPhoto() {
  currentPhotoBase64 = null;
  document.getElementById("photoPreviewBox").style.display = "none";
  document.getElementById("photoPreviewImg").src = "";
  ["photoInput","cameraInput","fileInput"].forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
}

// =======================================================
// ENVIAR MENSAJE
// =======================================================
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("sendBtn").addEventListener("click", sendMessage);
});

async function sendMessage() {
  const userInput = document.getElementById("userInput");
  const heroWelcome = document.getElementById("heroWelcome");
  const chatStream = document.getElementById("chatStream");
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
  let pressTimer = null;
  item.addEventListener("touchstart", () => {
    pressTimer = setTimeout(() => {
      if (confirm(`¿Eliminar?\n"${currentSessionTitle}"`)) {
        item.remove(); conversationHistory = []; currentSessionTitle = null;
        document.getElementById("messagesFeed").innerHTML = "";
        document.getElementById("heroWelcome").style.display = "flex";
      }
    }, 600);
  });
  item.addEventListener("touchend", () => clearTimeout(pressTimer));
  item.addEventListener("touchmove", () => clearTimeout(pressTimer));
  item.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    if (confirm(`¿Eliminar?\n"${currentSessionTitle}"`)) {
      item.remove(); conversationHistory = []; currentSessionTitle = null;
      document.getElementById("messagesFeed").innerHTML = "";
      document.getElementById("heroWelcome").style.display = "flex";
    }
  });
  list.prepend(item);
}

// =======================================================
// TTS ELEVENLABS — directo al API
// =======================================================
function playElevenLabsTTS(text) {
  return new Promise(async (resolve) => {
    if (!isVoiceActive) return resolve();
    const clean = text.replace(/\[IMAGE_PROMPT:.*?\]/g, '').replace(/[*_#`]/g, '').trim();
    if (!clean) return resolve();
    try {
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${activeVoiceId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "xi-api-key": ELEVEN_API_KEY },
        body: JSON.stringify({ text: clean.substring(0, 500), model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.5, similarity_boost: 0.85 } })
      });
      if (!res.ok) return fallbackTTS(clean).then(resolve);
      const blob = await res.blob();
      if (blob.size < 100) return fallbackTTS(clean).then(resolve);
      const audioPlayer = document.getElementById("audioPlayer");
      const audioUrl = URL.createObjectURL(blob);
      audioPlayer.src = audioUrl;
      audioPlayer.onplay = () => { isAudioPlaying = true; };
      audioPlayer.onended = () => { isAudioPlaying = false; URL.revokeObjectURL(audioUrl); resolve(); };
      audioPlayer.onerror = () => { isAudioPlaying = false; fallbackTTS(clean).then(resolve); };
      await audioPlayer.play().catch(() => fallbackTTS(clean).then(resolve));
    } catch (e) { fallbackTTS(clean).then(resolve); }
  });
}

function fallbackTTS(text) {
  return new Promise((resolve) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = "es-PE";
      utt.onstart = () => { isAudioPlaying = true; };
      utt.onend = () => { isAudioPlaying = false; resolve(); };
      utt.onerror = () => { isAudioPlaying = false; resolve(); };
      window.speechSynthesis.speak(utt);
    } else resolve();
  });
}

// =======================================================
// MENSAJES
// =======================================================
function appendUserMessage(text, photoUrl = null) {
  const feed = document.getElementById("messagesFeed");
  const row = document.createElement("div");
  row.className = "msg-row user";
  const bubble = document.createElement("div");
  bubble.className = "user-bubble";
  if (photoUrl) { const img = document.createElement("img"); img.src = photoUrl; img.className = "user-attached-img"; bubble.appendChild(img); }
  if (text) { const txt = document.createElement("div"); txt.innerText = text; bubble.appendChild(txt); }
  row.appendChild(bubble);
  feed.appendChild(row);
}

function appendAssistantMessage(text, imageUrl = null) {
  const feed = document.getElementById("messagesFeed");
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
  copyChip.onclick = () => { navigator.clipboard.writeText(text); copyChip.innerHTML = "✓ Copiado"; setTimeout(() => { copyChip.innerHTML = "📋 Copiar"; }, 2000); };
  const speakChip = document.createElement("button");
  speakChip.className = "action-chip";
  speakChip.innerHTML = "🔊 Escuchar";
  speakChip.onclick = () => playElevenLabsTTS(text);
  actions.appendChild(copyChip);
  actions.appendChild(speakChip);
  wrapper.appendChild(actions);
  if (imageUrl) {
    const imgCard = document.createElement("div");
    imgCard.className = "chat-4d-card";
    imgCard.innerHTML = `<div class="inner-4d-card" onclick="openImageModal('${imageUrl}')"><img src="${imageUrl}" alt="Imagen generada" loading="lazy"></div>`;
    wrapper.appendChild(imgCard);
  }
  row.appendChild(orb);
  row.appendChild(wrapper);
  feed.appendChild(row);
}

function appendThinkingPlaceholder() {
  const feed = document.getElementById("messagesFeed");
  const id = "ph-" + Date.now();
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
  feed.appendChild(row);
  return id;
}

function removeThinkingPlaceholder(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

// =======================================================
// IMAGEN MODAL
// =======================================================
function setup4DParallax() {
  const card = document.getElementById("modal4DCard");
  if (!card) return;
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const rotX = (((e.clientY - rect.top) / rect.height) - 0.5) * -24;
    const rotY = (((e.clientX - rect.left) / rect.width) - 0.5) * 24;
    card.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.03)`;
  });
  card.addEventListener("mouseleave", () => { card.style.transform = "perspective(1000px) rotateX(0) rotateY(0) scale(1)"; });
}

function openImageModal(url) {
  const modalImg = document.getElementById("modalImg");
  const downloadImgBtn = document.getElementById("downloadImgBtn");
  const imageModal = document.getElementById("imageModal");
  if (modalImg) modalImg.src = url;
  if (downloadImgBtn) downloadImgBtn.href = url;
  if (imageModal) imageModal.classList.add("active");
}

function closeImageModal() {
  const imageModal = document.getElementById("imageModal");
  if (imageModal) imageModal.classList.remove("active");
}

// =======================================================
// MODO VOZ EN VIVO
// =======================================================
function setupVoiceLive() {
  const micBtn = document.getElementById("micBtn");
  const voiceLiveScreen = document.getElementById("voiceLiveScreen");
  const voiceLiveClose = document.getElementById("voiceLiveClose");
  const voiceOrbBtn = document.getElementById("voiceOrbBtn");
  const voiceLiveMute = document.getElementById("voiceLiveMute");

  micBtn.addEventListener("click", () => {
    voiceLiveScreen.classList.add("active");
    setOrbState("idle");
    document.getElementById("voiceLiveTranscript").innerText = "";
  });

  voiceLiveClose.addEventListener("click", () => {
    voiceLiveScreen.classList.remove("active");
    if (voiceRec) { try { voiceRec.stop(); } catch(e) {} }
    document.getElementById("audioPlayer").pause();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    isAudioPlaying = false;
    setOrbState("idle");
  });

  voiceOrbBtn.addEventListener("click", async () => {
    if (voiceOrbBtn.classList.contains("listening")) {
      if (voiceRec) { try { voiceRec.stop(); } catch(e) {} }
      voiceOrbBtn.classList.remove("listening");
      setOrbState("idle");
      return;
    }
    if (isAudioPlaying) {
      document.getElementById("audioPlayer").pause();
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      isAudioPlaying = false;
      setOrbState("idle");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
    } catch (e) {
      setOrbState("idle");
      document.getElementById("voiceLiveStatus").innerText = "⚠️ Permite el micrófono";
      return;
    }
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      document.getElementById("voiceLiveStatus").innerText = "⚠️ Usa Chrome para voz";
      return;
    }
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    voiceRec = new SpeechRec();
    voiceRec.lang = "es-PE";
    voiceRec.continuous = false;
    voiceRec.interimResults = true;
    voiceRec.onstart = () => { voiceOrbBtn.classList.add("listening"); setOrbState("listening"); document.getElementById("voiceLiveTranscript").innerText = ""; };
    voiceRec.onresult = (e) => {
      let final = "", interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      document.getElementById("voiceLiveTranscript").innerText = final || interim;
    };
    voiceRec.onend = async () => {
      voiceOrbBtn.classList.remove("listening");
      const transcript = document.getElementById("voiceLiveTranscript").innerText.trim();
      if (!transcript) { setOrbState("idle"); document.getElementById("voiceLiveStatus").innerText = "No escuché nada."; return; }
      setOrbState("thinking");
      try {
        const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: transcript, history: conversationHistory, user: currentUser, emotion: currentEmotion }) });
        const data = await res.json();
        conversationHistory.push({ role: "user", text: transcript });
        conversationHistory.push({ role: "model", text: data.reply });
        updateSessionHistory(transcript);
        document.getElementById("voiceLiveTranscript").innerText = data.reply.length > 200 ? data.reply.substring(0, 200) + "..." : data.reply;
        appendUserMessage(transcript);
        appendAssistantMessage(data.reply, data.image_url);
        document.getElementById("heroWelcome").style.display = "none";
        if (!isVoiceLiveMuted) { setOrbState("speaking"); await playElevenLabsTTS(data.reply); }
        setOrbState("idle");
        document.getElementById("voiceLiveTranscript").innerText = "";
      } catch (err) { setOrbState("idle"); document.getElementById("voiceLiveStatus").innerText = "Error. Intenta de nuevo."; }
    };
    voiceRec.onerror = (e) => {
      voiceOrbBtn.classList.remove("listening");
      setOrbState("idle");
      document.getElementById("voiceLiveStatus").innerText = e.error === "no-speech" ? "No escuché nada." : "Error: " + e.error;
    };
    voiceRec.start();
  });

  voiceLiveMute.addEventListener("click", () => {
    isVoiceLiveMuted = !isVoiceLiveMuted;
    voiceLiveMute.innerText = isVoiceLiveMuted ? "🔇" : "🔊";
    if (isVoiceLiveMuted) { document.getElementById("audioPlayer").pause(); if (window.speechSynthesis) window.speechSynthesis.cancel(); isAudioPlaying = false; }
  });
}

function setOrbState(state) {
  const voiceOrb = document.getElementById("voiceOrb");
  const voiceLiveStatus = document.getElementById("voiceLiveStatus");
  if (voiceOrb) voiceOrb.className = "voice-orb " + state;
  const map = { idle: "Toca el micrófono para hablar", listening: "Escuchando...", thinking: "Layla pensando...", speaking: "Layla hablando..." };
  if (voiceLiveStatus) voiceLiveStatus.innerText = map[state] || "";
}
