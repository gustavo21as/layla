// LAYLA AI 4.1 - CONTROLLER

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

window.addEventListener("DOMContentLoaded", init);
// Si DOM ya cargó, llamar init directo
if (document.readyState === "complete" || document.readyState === "interactive") {
  init();
}

function init() {
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

  document.getElementById("themeToggleBtn").addEventListener("click", () => applyTheme(currentTheme === "dark" ? "light" : "dark"));
  document.getElementById("waveToggleBtn").addEventListener("click", toggleVoice);
  document.getElementById("userProfileBtn").addEventListener("click", openAuthModal);
  document.getElementById("toggleSidebarBtn").addEventListener("click", toggleSidebar);
  document.getElementById("newChatBtn").addEventListener("click", newChat);
  document.getElementById("sendBtn").addEventListener("click", sendMessage);
  document.getElementById("secretVoiceBtn").addEventListener("click", handleSecretTap);
  document.querySelectorAll(".pill-emotion").forEach(p => p.addEventListener("click", () => applyEmotion(p.dataset.emotion)));
}

// TEMA
function applyTheme(theme) {
  currentTheme = theme;
  document.body.classList.toggle("theme-dark", theme === "dark");
  document.body.classList.toggle("theme-light", theme === "light");
  const btn = document.getElementById("themeToggleBtn");
  if (btn) btn.innerText = theme === "dark" ? "🌙" : "☀️";
  localStorage.setItem("layla_theme", theme);
}

// EMOCION
function applyEmotion(emotion) {
  currentEmotion = emotion;
  [...document.body.classList].filter(c => c.startsWith("emotion-")).forEach(c => document.body.classList.remove(c));
  document.body.classList.add("emotion-" + emotion);
  document.querySelectorAll(".pill-emotion").forEach(p => p.classList.toggle("active", p.dataset.emotion === emotion));
  localStorage.setItem("layla_emotion", emotion);
  const map = { professional:"Modo Profesional", loving:"Modo Amorosa", philosopher:"Modo Filósofa", funny:"Modo Chistosa", toxic:"Modo Sin Filtros", advisor:"Modo Consejera", dramatic:"Modo Dramática" };
  const el = document.getElementById("waveStatusText");
  if (el) el.innerText = map[emotion] || "Layla activa";
}

// VOZ TOGGLE
function toggleVoice() {
  isVoiceActive = !isVoiceActive;
  localStorage.setItem("layla_voice_active", isVoiceActive);
  updateVoiceToggleUI();
  if (!isVoiceActive) { document.getElementById("audioPlayer").pause(); if (window.speechSynthesis) window.speechSynthesis.cancel(); }
}

function updateVoiceToggleUI() {
  const btn = document.getElementById("waveToggleBtn");
  const bar = document.getElementById("soundwaveBar");
  if (btn) { btn.classList.toggle("active", isVoiceActive); const l = btn.querySelector(".wave-label"); if (l) l.innerText = isVoiceActive ? "Voz Activa" : "Silencio"; }
  if (bar) bar.classList.toggle("hidden", !isVoiceActive);
}

// USUARIO
function updateUserUI() {
  const isGuest = !currentUser.uid || currentUser.uid === "guest";
  const sn = document.getElementById("sidebarName"); if (sn) sn.innerText = currentUser.name;
  const sa = document.getElementById("sidebarAvatar"); if (sa) sa.innerText = currentUser.avatar || currentUser.name[0].toUpperCase();
  const ss = document.getElementById("sidebarStatus"); if (ss) ss.innerText = currentUser.is_creator ? "Fundador" : "Activo";
  const hb = document.getElementById("headerAuthBtn");
  if (hb) {
    if (isGuest) { hb.innerText = "Acceder"; hb.style.cssText = "background:var(--emotion-color);color:#050a14;position:relative;z-index:100;"; }
    else { hb.innerText = "⚙️"; hb.style.cssText = "background:var(--bg-card);color:var(--text-main);border:1px solid var(--border-light);position:relative;z-index:100;"; }
  }
}

// MODAL
function openAuthModal() {
  const modal = document.getElementById("authModal");
  if (!modal) return;
  const isGuest = !currentUser.uid || currentUser.uid === "guest";
  const ls = document.getElementById("loggedSection"); if (ls) ls.style.display = isGuest ? "none" : "block";
  const li = document.getElementById("loginSection"); if (li) li.style.display = isGuest ? "flex" : "none";
  if (!isGuest) {
    const ln = document.getElementById("loggedName"); if (ln) ln.innerText = currentUser.name;
    const le = document.getElementById("loggedEmail"); if (le) le.innerText = currentUser.email || "";
  }
  modal.classList.add("active");
}

function closeAuthModal() {
  const modal = document.getElementById("authModal");
  if (modal) modal.classList.remove("active");
}

window._laylaCloseModal = closeAuthModal;
window._laylaUpdateUser = (u) => { currentUser = u; updateUserUI(); };

// PANEL VOZ SECRETO
function handleSecretTap() {
  secretTapCount++;
  if (secretTapTimer) clearTimeout(secretTapTimer);
  secretTapTimer = setTimeout(() => { secretTapCount = 0; }, 600);
  if (secretTapCount >= 2) {
    secretTapCount = 0;
    const p = document.getElementById("secretVoicePanel");
    if (p) p.style.display = p.style.display === "none" ? "block" : "none";
    const l = document.getElementById("voiceActiveLabel");
    if (l) l.innerText = "Voz activa: " + activeVoiceId;
  }
}

function setVoice(voiceId, btn) {
  activeVoiceId = voiceId;
  localStorage.setItem("layla_voice_id", voiceId);
  fetch("/api/set-voice", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({voice_id:voiceId}) }).catch(()=>{});
  document.querySelectorAll(".voice-opt-btn").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  const l = document.getElementById("voiceActiveLabel"); if (l) l.innerText = "Voz activa: " + voiceId;
  alert("✅ Voz cambiada.");
}

function setCustomVoice() {
  const i = document.getElementById("customVoiceInput");
  if (!i || !i.value.trim()) return;
  setVoice(i.value.trim(), null);
  i.value = "";
}

// LOGIN
function loginSocial(provider) {
  if (window._laylaFirebase) {
    if (provider === "Google") { window._laylaFirebase.loginWithGoogle(); return; }
    if (provider === "Facebook") { window._laylaFirebase.loginWithFacebook(); return; }
    if (provider === "Twitter / X") { window._laylaFirebase.loginWithTwitter(); return; }
  }
  const name = prompt("¿Cómo te llamas?");
  if (!name || !name.trim()) return;
  const isG = name.toLowerCase().includes("gerardo");
  currentUser = { name: isG ? "Gerardo" : name.trim(), is_creator: isG, avatar: name.trim()[0].toUpperCase(), uid: "u_" + Date.now() };
  localStorage.setItem("layla_user", JSON.stringify(currentUser));
  updateUserUI();
  closeAuthModal();
}

function loginGuest() {
  currentUser = { name:"Invitado", is_creator:false, avatar:"I", uid:"guest" };
  localStorage.setItem("layla_user", JSON.stringify(currentUser));
  updateUserUI();
  closeAuthModal();
}

// SIDEBAR
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  if (window.innerWidth <= 768) {
    sidebar.classList.toggle("mobile-open");
    const ov = document.getElementById("sidebarOverlay");
    if (ov) ov.classList.toggle("active", sidebar.classList.contains("mobile-open"));
  } else {
    sidebar.classList.toggle("collapsed");
  }
}

function newChat() {
  conversationHistory = []; currentSessionTitle = null;
  document.getElementById("messagesFeed").innerHTML = "";
  document.getElementById("heroWelcome").style.display = "flex";
  document.getElementById("userInput").value = "";
  document.getElementById("userInput").focus();
  closeSidebar();
}

function closeSidebar() {
  if (window.innerWidth <= 768) {
    document.getElementById("sidebar").classList.remove("mobile-open");
    const ov = document.getElementById("sidebarOverlay"); if (ov) ov.classList.remove("active");
  }
}

function setupSwipeSidebar() {
  let ov = document.getElementById("sidebarOverlay");
  if (!ov) { ov = document.createElement("div"); ov.id = "sidebarOverlay"; ov.className = "sidebar-overlay"; document.body.appendChild(ov); }
  ov.addEventListener("click", closeSidebar);
  let tx = 0, ty = 0;
  document.addEventListener("touchstart", e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive:true });
  document.addEventListener("touchend", e => {
    const dx = e.changedTouches[0].clientX - tx;
    const dy = Math.abs(e.changedTouches[0].clientY - ty);
    if (dy > 60) return;
    const sb = document.getElementById("sidebar");
    if (dx > 60 && tx < 30) { sb.classList.add("mobile-open"); ov.classList.add("active"); }
    else if (dx < -60 && sb.classList.contains("mobile-open")) closeSidebar();
  }, { passive:true });
}

function quickAsk(text) { document.getElementById("userInput").value = text; sendMessage(); }

function setupTextarea() {
  const inp = document.getElementById("userInput");
  inp.addEventListener("input", () => { inp.style.height = "auto"; inp.style.height = Math.min(inp.scrollHeight, 180) + "px"; });
  inp.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
}

// SOUNDWAVES
function initSoundwaves() {
  const canvas = document.getElementById("liveWaveCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const color = getComputedStyle(document.body).getPropertyValue("--emotion-color").trim() || "#00d2ff";
    const midY = canvas.height / 2;
    const amp = isAudioPlaying ? 14 : 3.5;
    wavePhase += isAudioPlaying ? 0.12 : 0.03;
    ctx.lineWidth = 2.5; ctx.strokeStyle = color; ctx.shadowBlur = 10; ctx.shadowColor = color;
    ctx.beginPath();
    for (let x = 0; x < canvas.width; x++) {
      const y = midY + Math.sin(x * 0.04 + wavePhase) * amp * Math.sin(x * 0.01);
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    requestAnimationFrame(render);
  }
  render();
}

// ADJUNTOS
function setupAttachMenu() {
  const ab = document.getElementById("attachBtn");
  const am = document.getElementById("attachMenu");
  ab.addEventListener("click", e => { e.stopPropagation(); am.classList.toggle("open"); ab.classList.toggle("open"); });
  document.addEventListener("click", () => { am.classList.remove("open"); ab.classList.remove("open"); });
  am.addEventListener("click", e => e.stopPropagation());
  document.getElementById("cameraBtn").addEventListener("click", () => { document.getElementById("cameraInput").click(); am.classList.remove("open"); });
  document.getElementById("uploadPhotoBtn").addEventListener("click", () => { document.getElementById("photoInput").click(); am.classList.remove("open"); });
  document.getElementById("fileBtn").addEventListener("click", () => { document.getElementById("fileInput").click(); am.classList.remove("open"); });
  ["photoInput","cameraInput","fileInput"].forEach(id => document.getElementById(id).addEventListener("change", handlePhotoFile));
  document.getElementById("removePhotoBtn").addEventListener("click", clearAttachedPhoto);
}

function handlePhotoFile(e) {
  const file = e.target.files[0]; if (!file) return;
  currentPhotoMime = file.type || "image/jpeg";
  document.getElementById("photoFileName").innerText = file.name;
  const reader = new FileReader();
  reader.onload = ev => { currentPhotoBase64 = ev.target.result; document.getElementById("photoPreviewImg").src = currentPhotoBase64; document.getElementById("photoPreviewBox").style.display = "flex"; };
  reader.readAsDataURL(file);
}

function clearAttachedPhoto() {
  currentPhotoBase64 = null;
  document.getElementById("photoPreviewBox").style.display = "none";
  document.getElementById("photoPreviewImg").src = "";
  ["photoInput","cameraInput","fileInput"].forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
}

// CHAT
async function sendMessage() {
  const inp = document.getElementById("userInput");
  const text = inp.value.trim();
  const photo = currentPhotoBase64;
  const mime = currentPhotoMime;
  if (!text && !photo) return;
  inp.value = ""; inp.style.height = "auto";
  document.getElementById("heroWelcome").style.display = "none";
  appendUserMessage(text || "Analiza esta foto", photo);
  conversationHistory.push({ role:"user", text: text || "[Foto]" });
  clearAttachedPhoto();
  const pid = appendThinkingPlaceholder();
  const cs = document.getElementById("chatStream"); cs.scrollTop = cs.scrollHeight;
  try {
    const res = await fetch("/api/chat", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ message:text, history:conversationHistory, user:currentUser, emotion:currentEmotion, image_data:photo, image_mime:mime }) });
    if (!res.ok) throw new Error("Error " + res.status);
    const data = await res.json();
    removeThinkingPlaceholder(pid);
    appendAssistantMessage(data.reply, data.image_url);
    conversationHistory.push({ role:"model", text:data.reply });
    if (isVoiceActive) playElevenLabsTTS(data.reply);
    updateSessionHistory(text || "Consulta con foto");
    if (window._laylaFirebase && conversationHistory.length >= 2) window._laylaFirebase.saveConversation(currentSessionTitle || "Conversación", conversationHistory);
  } catch (err) { removeThinkingPlaceholder(pid); appendAssistantMessage("Error: " + err.message); }
  cs.scrollTop = cs.scrollHeight;
}

function updateSessionHistory(txt) {
  if (currentSessionTitle !== null) return;
  currentSessionTitle = txt.length > 26 ? txt.substring(0, 26) + "..." : txt;
  const list = document.getElementById("historyList");
  const item = document.createElement("div");
  item.className = "history-item"; item.innerText = currentSessionTitle;
  let pt = null;
  item.addEventListener("touchstart", () => { pt = setTimeout(() => { if (confirm("¿Eliminar?")) { item.remove(); conversationHistory=[]; currentSessionTitle=null; document.getElementById("messagesFeed").innerHTML=""; document.getElementById("heroWelcome").style.display="flex"; } }, 600); });
  item.addEventListener("touchend", () => clearTimeout(pt));
  item.addEventListener("touchmove", () => clearTimeout(pt));
  item.addEventListener("contextmenu", e => { e.preventDefault(); if (confirm("¿Eliminar?")) { item.remove(); conversationHistory=[]; currentSessionTitle=null; document.getElementById("messagesFeed").innerHTML=""; document.getElementById("heroWelcome").style.display="flex"; } });
  list.prepend(item);
}

// TTS
function playElevenLabsTTS(text) {
  return new Promise(async resolve => {
    if (!isVoiceActive) return resolve();
    const clean = text.replace(/\[IMAGE_PROMPT:.*?\]/g,'').replace(/[*_#`]/g,'').trim();
    if (!clean) return resolve();
    try {
      const res = await fetch("https://api.elevenlabs.io/v1/text-to-speech/" + activeVoiceId, {
        method:"POST", headers:{"Content-Type":"application/json","xi-api-key":ELEVEN_API_KEY},
        body:JSON.stringify({ text:clean.substring(0,500), model_id:"eleven_multilingual_v2", voice_settings:{stability:0.5,similarity_boost:0.85} })
      });
      if (!res.ok) return fallbackTTS(clean).then(resolve);
      const blob = await res.blob();
      if (blob.size < 100) return fallbackTTS(clean).then(resolve);
      const ap = document.getElementById("audioPlayer");
      const url = URL.createObjectURL(blob);
      ap.src = url;
      ap.onplay = () => { isAudioPlaying = true; };
      ap.onended = () => { isAudioPlaying = false; URL.revokeObjectURL(url); resolve(); };
      ap.onerror = () => { isAudioPlaying = false; fallbackTTS(clean).then(resolve); };
      await ap.play().catch(() => fallbackTTS(clean).then(resolve));
    } catch(e) { fallbackTTS(clean).then(resolve); }
  });
}

function fallbackTTS(text) {
  return new Promise(resolve => {
    if (!window.speechSynthesis) return resolve();
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "es-PE";
    utt.onstart = () => { isAudioPlaying = true; };
    utt.onend = () => { isAudioPlaying = false; resolve(); };
    utt.onerror = () => { isAudioPlaying = false; resolve(); };
    window.speechSynthesis.speak(utt);
  });
}

// MENSAJES
function appendUserMessage(text, photo=null) {
  const feed = document.getElementById("messagesFeed");
  const row = document.createElement("div"); row.className = "msg-row user";
  const bubble = document.createElement("div"); bubble.className = "user-bubble";
  if (photo) { const img = document.createElement("img"); img.src = photo; img.className = "user-attached-img"; bubble.appendChild(img); }
  if (text) { const t = document.createElement("div"); t.innerText = text; bubble.appendChild(t); }
  row.appendChild(bubble); feed.appendChild(row);
}

function appendAssistantMessage(text, imageUrl=null) {
  const feed = document.getElementById("messagesFeed");
  const row = document.createElement("div"); row.className = "msg-row assistant";
  const orb = document.createElement("div"); orb.className = "assistant-orb"; orb.innerText = "L";
  const wrap = document.createElement("div"); wrap.className = "msg-content-wrapper";
  const tel = document.createElement("div"); tel.className = "assistant-text"; tel.innerText = text;
  wrap.appendChild(tel);
  const acts = document.createElement("div"); acts.className = "msg-actions";
  const cc = document.createElement("button"); cc.className = "action-chip"; cc.innerHTML = "📋 Copiar";
  cc.onclick = () => { navigator.clipboard.writeText(text); cc.innerHTML = "✓ Copiado"; setTimeout(()=>{ cc.innerHTML="📋 Copiar"; },2000); };
  const sc = document.createElement("button"); sc.className = "action-chip"; sc.innerHTML = "🔊 Escuchar";
  sc.onclick = () => playElevenLabsTTS(text);
  acts.appendChild(cc); acts.appendChild(sc); wrap.appendChild(acts);
  if (imageUrl) {
    const card = document.createElement("div"); card.className = "chat-4d-card";
    card.innerHTML = `<div class="inner-4d-card" onclick="openImageModal('${imageUrl}')"><img src="${imageUrl}" alt="Imagen" loading="lazy"></div>`;
    wrap.appendChild(card);
  }
  row.appendChild(orb); row.appendChild(wrap); feed.appendChild(row);
}

function appendThinkingPlaceholder() {
  const feed = document.getElementById("messagesFeed");
  const id = "ph-" + Date.now();
  const row = document.createElement("div"); row.className = "msg-row assistant"; row.id = id;
  const orb = document.createElement("div"); orb.className = "assistant-orb"; orb.innerText = "L";
  const wrap = document.createElement("div"); wrap.className = "msg-content-wrapper";
  const tel = document.createElement("div"); tel.className = "assistant-text"; tel.style.color = "var(--text-dim)"; tel.innerText = "Layla procesando...";
  wrap.appendChild(tel); row.appendChild(orb); row.appendChild(wrap); feed.appendChild(row);
  return id;
}

function removeThinkingPlaceholder(id) { const el = document.getElementById(id); if (el) el.remove(); }

// IMAGEN MODAL
function setup4DParallax() {
  const card = document.getElementById("modal4DCard"); if (!card) return;
  card.addEventListener("mousemove", e => {
    const r = card.getBoundingClientRect();
    const rx = (((e.clientY-r.top)/r.height)-0.5)*-24;
    const ry = (((e.clientX-r.left)/r.width)-0.5)*24;
    card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.03)`;
  });
  card.addEventListener("mouseleave", () => { card.style.transform = "perspective(1000px) rotateX(0) rotateY(0) scale(1)"; });
}

function openImageModal(url) {
  const mi = document.getElementById("modalImg"); if (mi) mi.src = url;
  const dl = document.getElementById("downloadImgBtn"); if (dl) dl.href = url;
  const im = document.getElementById("imageModal"); if (im) im.classList.add("active");
}

function closeImageModal() { const im = document.getElementById("imageModal"); if (im) im.classList.remove("active"); }

// VOZ EN VIVO
function setupVoiceLive() {
  document.getElementById("micBtn").addEventListener("click", () => {
    document.getElementById("voiceLiveScreen").classList.add("active");
    setOrbState("idle");
    document.getElementById("voiceLiveTranscript").innerText = "";
  });

  document.getElementById("voiceLiveClose").addEventListener("click", () => {
    document.getElementById("voiceLiveScreen").classList.remove("active");
    if (voiceRec) { try { voiceRec.stop(); } catch(e) {} }
    document.getElementById("audioPlayer").pause();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    isAudioPlaying = false; setOrbState("idle");
  });

  document.getElementById("voiceOrbBtn").addEventListener("click", async () => {
    const btn = document.getElementById("voiceOrbBtn");
    if (btn.classList.contains("listening")) { if (voiceRec) { try { voiceRec.stop(); } catch(e) {} } btn.classList.remove("listening"); setOrbState("idle"); return; }
    if (isAudioPlaying) { document.getElementById("audioPlayer").pause(); if (window.speechSynthesis) window.speechSynthesis.cancel(); isAudioPlaying = false; setOrbState("idle"); return; }
    try { const s = await navigator.mediaDevices.getUserMedia({audio:true}); s.getTracks().forEach(t=>t.stop()); } catch(e) { document.getElementById("voiceLiveStatus").innerText = "⚠️ Permite el micrófono"; return; }
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) { document.getElementById("voiceLiveStatus").innerText = "⚠️ Usa Chrome"; return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    voiceRec = new SR(); voiceRec.lang = "es-PE"; voiceRec.continuous = false; voiceRec.interimResults = true;
    voiceRec.onstart = () => { btn.classList.add("listening"); setOrbState("listening"); document.getElementById("voiceLiveTranscript").innerText = ""; };
    voiceRec.onresult = e => {
      let f="",i="";
      for (let x=e.resultIndex;x<e.results.length;x++) { if (e.results[x].isFinal) f+=e.results[x][0].transcript; else i+=e.results[x][0].transcript; }
      document.getElementById("voiceLiveTranscript").innerText = f||i;
    };
    voiceRec.onend = async () => {
      btn.classList.remove("listening");
      const t = document.getElementById("voiceLiveTranscript").innerText.trim();
      if (!t) { setOrbState("idle"); document.getElementById("voiceLiveStatus").innerText = "No escuché nada."; return; }
      setOrbState("thinking");
      try {
        const res = await fetch("/api/chat", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({message:t,history:conversationHistory,user:currentUser,emotion:currentEmotion}) });
        const data = await res.json();
        conversationHistory.push({role:"user",text:t}); conversationHistory.push({role:"model",text:data.reply});
        updateSessionHistory(t);
        document.getElementById("voiceLiveTranscript").innerText = data.reply.length>200?data.reply.substring(0,200)+"...":data.reply;
        appendUserMessage(t); appendAssistantMessage(data.reply, data.image_url);
        document.getElementById("heroWelcome").style.display = "none";
        if (!isVoiceLiveMuted) { setOrbState("speaking"); await playElevenLabsTTS(data.reply); }
        setOrbState("idle"); document.getElementById("voiceLiveTranscript").innerText = "";
      } catch(err) { setOrbState("idle"); document.getElementById("voiceLiveStatus").innerText = "Error. Intenta de nuevo."; }
    };
    voiceRec.onerror = e => { btn.classList.remove("listening"); setOrbState("idle"); document.getElementById("voiceLiveStatus").innerText = e.error==="no-speech"?"No escuché nada.":"Error: "+e.error; };
    voiceRec.start();
  });

  document.getElementById("voiceLiveMute").addEventListener("click", () => {
    isVoiceLiveMuted = !isVoiceLiveMuted;
    document.getElementById("voiceLiveMute").innerText = isVoiceLiveMuted ? "🔇" : "🔊";
    if (isVoiceLiveMuted) { document.getElementById("audioPlayer").pause(); if (window.speechSynthesis) window.speechSynthesis.cancel(); isAudioPlaying = false; }
  });
}

function setOrbState(state) {
  const orb = document.getElementById("voiceOrb");
  const status = document.getElementById("voiceLiveStatus");
  if (orb) orb.className = "voice-orb " + state;
  const map = { idle:"Toca el micrófono para hablar", listening:"Escuchando...", thinking:"Layla pensando...", speaking:"Layla hablando..." };
  if (status) status.innerText = map[state] || "";
}
