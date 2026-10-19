// =====================================================
// LAYLA AI - FIREBASE FIRESTORE (MEMORIA EN LA NUBE)
// =====================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, orderBy, query, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBKTv_KvmoS7cDnIBYN_NI_r_sj0xxNDgw",
  authDomain: "layla-ai-6f8ea.firebaseapp.com",
  databaseURL: "https://layla-ai-6f8ea-default-rtdb.firebaseio.com",
  projectId: "layla-ai-6f8ea",
  storageBucket: "layla-ai-6f8ea.firebasestorage.app",
  messagingSenderId: "573193078345",
  appId: "1:573193078345:web:5d67cef7b01ec30e6b619b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// -------------------------------------------------------
// GUARDAR CONVERSACIÓN EN FIRESTORE
// -------------------------------------------------------
export async function saveConversation(title, messages) {
  try {
    const docRef = await addDoc(collection(db, "conversations"), {
      title: title,
      messages: messages,
      createdAt: serverTimestamp(),
      user: "Gerardo"
    });
    return docRef.id;
  } catch (e) {
    console.error("Error guardando conversación:", e);
    return null;
  }
}

// -------------------------------------------------------
// CARGAR TODAS LAS CONVERSACIONES
// -------------------------------------------------------
export async function loadConversations() {
  try {
    const q = query(collection(db, "conversations"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const convs = [];
    snapshot.forEach(doc => {
      convs.push({ id: doc.id, ...doc.data() });
    });
    return convs;
  } catch (e) {
    console.error("Error cargando conversaciones:", e);
    return [];
  }
}

// -------------------------------------------------------
// ELIMINAR CONVERSACIÓN
// -------------------------------------------------------
export async function deleteConversation(id) {
  try {
    await deleteDoc(doc(db, "conversations", id));
    return true;
  } catch (e) {
    console.error("Error eliminando conversación:", e);
    return false;
  }
}

// -------------------------------------------------------
// CARGAR HISTORIAL AL INICIAR — poblar el sidebar
// -------------------------------------------------------
window.addEventListener("DOMContentLoaded", async () => {
  const list = document.getElementById("historyList");
  if (!list) return;

  const convs = await loadConversations();
  convs.forEach(conv => {
    addHistoryItemFirebase(conv.id, conv.title, conv.messages);
  });
});

function addHistoryItemFirebase(id, title, messages) {
  const list = document.getElementById("historyList");
  if (!list) return;

  const item = document.createElement("div");
  item.className = "history-item";
  item.dataset.fbId = id;
  item.innerText = title;
  item.title = "Toca para ver opciones";

  let pressTimer = null;

  // En celular: toque largo = eliminar
  item.addEventListener("touchstart", () => {
    pressTimer = setTimeout(() => {
      if (confirm(`¿Eliminar conversación?\n"${title}"`)) {
        deleteConversation(id).then(ok => { if (ok) item.remove(); });
      }
    }, 600);
  });
  item.addEventListener("touchend", () => clearTimeout(pressTimer));
  item.addEventListener("touchmove", () => clearTimeout(pressTimer));

  // En PC: clic normal = cargar conversación, clic derecho = eliminar
  item.addEventListener("click", (e) => {
    if (!messages || messages.length === 0) return;
    const feed = document.getElementById("messagesFeed");
    const hero = document.getElementById("heroWelcome");
    if (!feed || !hero) return;
    feed.innerHTML = "";
    hero.style.display = "none";
    messages.forEach(msg => {
      if (msg.role === "user") {
        const row = document.createElement("div");
        row.className = "msg-row user";
        const bubble = document.createElement("div");
        bubble.className = "user-bubble";
        bubble.innerText = msg.text;
        row.appendChild(bubble);
        feed.appendChild(row);
      } else {
        const row = document.createElement("div");
        row.className = "msg-row assistant";
        const orb = document.createElement("div");
        orb.className = "assistant-orb";
        orb.innerText = "L";
        const wrapper = document.createElement("div");
        wrapper.className = "msg-content-wrapper";
        const textEl = document.createElement("div");
        textEl.className = "assistant-text";
        textEl.innerText = msg.text;
        wrapper.appendChild(textEl);
        row.appendChild(orb);
        row.appendChild(wrapper);
        feed.appendChild(row);
      }
    });
    document.getElementById("chatStream").scrollTop = 99999;
  });

  item.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    if (confirm(`¿Eliminar conversación?\n"${title}"`)) {
      deleteConversation(id).then(ok => { if (ok) item.remove(); });
    }
  });

  list.appendChild(item);
}

// Exponer para que app.js pueda llamar saveConversation
window._laylaFirebase = { saveConversation, deleteConversation };
